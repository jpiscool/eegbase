/**
 * Muse EEG adapter — WebBluetooth implementation.
 *
 * Supports Muse 2 (2018) and Muse S (2019+).
 * BLE protocol reverse-engineered and documented by the muse-lsl open-source
 * project (MIT license): https://github.com/alexandrebarachant/muse-lsl
 *
 * Architecture:
 *  1. Browser opens device picker (requestDevice), user selects their Muse
 *  2. Connect to GATT, subscribe to 4 EEG channel characteristics
 *  3. Write start-streaming command to control characteristic
 *  4. Decode 20-byte EEG packets (12 × 12-bit samples per channel)
 *  5. Compute band powers via FFT over a 256-sample (1 s) sliding window
 *  6. Emit DeviceSample at ~21 Hz with latest band powers (0–1 normalised)
 *
 * EEG packet format (20 bytes per notification per channel):
 *  bytes 0-1  : uint16 BE — packet sequence index
 *  bytes 2-19 : 12 × 12-bit samples packed MSB-first:
 *               every 3 bytes encode 2 samples:
 *               sample_even = (b0 << 4) | (b1 >> 4)
 *               sample_odd  = ((b1 & 0x0F) << 8) | b2
 *
 * ADC → μV: (raw_12bit − 2048) × 0.48828125
 *   (Vref = 1.8 V, programmable gain = 6, 12-bit resolution)
 */

import type { DeviceAdapter, DeviceSample } from "./adapter";

// ── BLE UUIDs ────────────────────────────────────────────────────────────────
// Primary service shared by Muse 2 and Muse S
const MUSE_SERVICE = "0000fe8d-0000-1000-8000-00805f9b34fb";

// Write start/stop streaming commands here
const MUSE_CONTROL_CHAR = "273e0001-4c4d-454d-96be-f03bac821358";

// Four EEG electrode channels (TP9, AF7, AF8, TP10)
const MUSE_EEG_CHARS = [
  "273e0003-4c4d-454d-96be-f03bac821358", // TP9  — left temporal
  "273e0004-4c4d-454d-96be-f03bac821358", // AF7  — left frontal
  "273e0005-4c4d-454d-96be-f03bac821358", // AF8  — right frontal
  "273e0006-4c4d-454d-96be-f03bac821358", // TP10 — right temporal
] as const;

// ── Constants ─────────────────────────────────────────────────────────────────
const SAMPLE_RATE = 256;       // Hz (Muse hardware rate)
const SAMPLES_PER_PACKET = 12; // EEG samples per BLE notification
const FFT_SIZE = 256;          // window size = 1 s at 256 Hz → 1 Hz resolution
const ADC_SCALE = 0.48828125;  // μV per LSB (Vref/gain/resolution)
const ADC_OFFSET = 2048;       // 12-bit midpoint

// Frequency band definitions [low, high] Hz
const BANDS = {
  delta: [0.5, 4] as [number, number],
  theta: [4, 8]   as [number, number],
  alpha: [8, 12]  as [number, number],
  beta:  [12, 30] as [number, number],
  gamma: [30, 100] as [number, number],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Unpack 12 × 12-bit EEG samples from bytes 2-19 of a Muse BLE packet.
 * Each group of 3 bytes encodes 2 samples (even/odd interleaved).
 */
function unpackEeg(view: DataView): number[] {
  const samples: number[] = [];
  for (let i = 0; i < 6; i++) {
    const b0 = view.getUint8(2 + i * 3);
    const b1 = view.getUint8(3 + i * 3);
    const b2 = view.getUint8(4 + i * 3);
    samples.push((b0 << 4) | (b1 >> 4));          // even sample
    samples.push(((b1 & 0x0f) << 8) | b2);        // odd sample
  }
  return samples; // 12 raw 12-bit ADC values
}

/** Scale a raw 12-bit ADC value to microvolts. */
function toMicrovolt(raw: number): number {
  return (raw - ADC_OFFSET) * ADC_SCALE;
}

/**
 * In-place Cooley-Tukey radix-2 FFT (power-of-2 size).
 * Operates on separate real/imaginary arrays.
 */
function fft(re: number[], im: number[]): void {
  const n = re.length;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Butterfly stages
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j],             uIm = im[i + j];
        const vRe = re[i + j + len / 2] * curRe - im[i + j + len / 2] * curIm;
        const vIm = re[i + j + len / 2] * curIm + im[i + j + len / 2] * curRe;
        re[i + j]           = uRe + vRe;  im[i + j]           = uIm + vIm;
        re[i + j + len / 2] = uRe - vRe;  im[i + j + len / 2] = uIm - vIm;
        const nRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
      }
    }
  }
}

/**
 * Compute RMS power in a frequency band from FFT output.
 * Returns a non-negative value in μV (RMS amplitude in band).
 */
function bandRms(re: number[], im: number[], fLow: number, fHigh: number): number {
  const n = re.length;
  const res = SAMPLE_RATE / n;
  let sum = 0, count = 0;
  const lo = Math.max(1, Math.ceil(fLow / res));
  const hi = Math.min(Math.floor(fHigh / res), n / 2 - 1);
  for (let k = lo; k <= hi; k++) {
    sum += (re[k] * re[k] + im[k] * im[k]) / (n * n);
    count++;
  }
  return count > 0 ? Math.sqrt(sum / count) : 0;
}

// ── Adapter ───────────────────────────────────────────────────────────────────
type SampleCallback = (sample: DeviceSample) => void;

export class MuseAdapter implements DeviceAdapter {
  readonly deviceType = "muse";
  readonly displayName = "Muse EEG";

  private _device: BluetoothDevice | null = null;
  private _server: BluetoothRemoteGATTServer | null = null;
  private _eegChars: BluetoothRemoteGATTCharacteristic[] = [];
  private _connected = false;
  private _callbacks: Set<SampleCallback> = new Set();
  private _startMs = 0;

  // Per-channel sliding buffers (4 channels × FFT_SIZE samples)
  private _buffers: number[][] = [[], [], [], []];
  // Latest band power estimates (0–1 normalised)
  private _bands = { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 };
  // Monotonic counter for packet ordering
  private _lastSeq = -1;

  // ── Public API ──────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      throw new Error(
        "Web Bluetooth is not supported in this browser. " +
          "Use Chrome or Edge on desktop (not iOS Safari)."
      );
    }

    try {
      this._device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "Muse" }],
        optionalServices: [MUSE_SERVICE],
      });
    } catch (err) {
      if ((err as Error).name === "NotFoundError") {
        throw new Error("No Muse device found. Power on your Muse headband and try again.");
      }
      throw new Error(`Bluetooth pairing failed: ${(err as Error).message}`);
    }

    this._device.addEventListener("gattserverdisconnected", this._onDisconnect);

    try {
      this._server = await this._device.gatt!.connect();
      const service = await this._server.getPrimaryService(MUSE_SERVICE);

      // Subscribe to all four EEG channel characteristics
      for (const uuid of MUSE_EEG_CHARS) {
        const char = await service.getCharacteristic(uuid);
        char.addEventListener("characteristicvaluechanged", this._onEegNotification);
        await char.startNotifications();
        this._eegChars.push(char);
      }

      // Start data streaming: preset 50 enables all sensors at full rate
      const controlChar = await service.getCharacteristic(MUSE_CONTROL_CHAR);
      const startCmd = new TextEncoder().encode("p50\n");
      await controlChar.writeValue(startCmd);

      this._startMs = Date.now();
      this._connected = true;
    } catch (err) {
      await this._cleanup();
      throw new Error(
        `Failed to connect to Muse GATT service: ${(err as Error).message}. ` +
          "Make sure no other app (Muse app, muse-lsl) is connected to the headband."
      );
    }
  }

  async disconnect(): Promise<void> {
    await this._cleanup();
  }

  isConnected(): boolean {
    return this._connected;
  }

  onSample(callback: SampleCallback): () => void {
    this._callbacks.add(callback);
    return () => this._callbacks.delete(callback);
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private _onEegNotification = (event: Event): void => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value || value.byteLength < 20) return;

    // Determine which channel this notification belongs to
    const charUuid = target.uuid;
    const channelIdx = MUSE_EEG_CHARS.indexOf(charUuid as typeof MUSE_EEG_CHARS[number]);
    if (channelIdx === -1) return;

    const seq = value.getUint16(0); // big-endian sequence index
    const rawSamples = unpackEeg(value);

    // Convert to μV and append to rolling buffer
    const buf = this._buffers[channelIdx];
    for (const raw of rawSamples) {
      buf.push(toMicrovolt(raw));
      if (buf.length > FFT_SIZE) buf.shift(); // keep last 1 s
    }

    // Recompute band powers once per full window (any channel, ~once/s)
    if (channelIdx === 1 && buf.length === FFT_SIZE && seq !== this._lastSeq) {
      this._lastSeq = seq;
      this._updateBandPowers();
    }

    // Emit a DeviceSample on every AF7 (frontal) packet (~21 Hz)
    if (channelIdx === 1) {
      const { delta, theta, alpha, beta, gamma } = this._bands;
      // Reward score: frontal alpha power normalised 0–100
      const totalPower = delta + theta + alpha + beta + gamma;
      const rewardScore = totalPower > 0
        ? Math.round(Math.min(100, (alpha / totalPower) * 200) * 10) / 10
        : 0;

      const sample: DeviceSample = {
        timestampMs: Date.now() - this._startMs,
        delta:       Math.round(delta  * 1000) / 1000,
        theta:       Math.round(theta  * 1000) / 1000,
        alpha:       Math.round(alpha  * 1000) / 1000,
        beta:        Math.round(beta   * 1000) / 1000,
        gamma:       Math.round(gamma  * 1000) / 1000,
        rewardScore,
      };
      this._callbacks.forEach((cb) => cb(sample));
    }
  };

  /** Run FFT on the AF7 buffer and update _bands with normalised powers. */
  private _updateBandPowers(): void {
    const buf = this._buffers[1]; // AF7 — frontal channel
    if (buf.length < FFT_SIZE) return;

    // Copy last FFT_SIZE samples into re/im arrays (apply Hann window)
    const re: number[] = new Array(FFT_SIZE);
    const im: number[] = new Array(FFT_SIZE).fill(0);
    for (let i = 0; i < FFT_SIZE; i++) {
      const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1));
      re[i] = buf[i] * hann;
    }

    fft(re, im);

    // Compute raw RMS for each band
    const raw = {
      delta: bandRms(re, im, ...BANDS.delta),
      theta: bandRms(re, im, ...BANDS.theta),
      alpha: bandRms(re, im, ...BANDS.alpha),
      beta:  bandRms(re, im, ...BANDS.beta),
      gamma: bandRms(re, im, ...BANDS.gamma),
    };

    // Normalise so each band is in [0, 1] relative to max across bands
    const maxRms = Math.max(...Object.values(raw), 1e-9);
    this._bands = {
      delta: raw.delta / maxRms,
      theta: raw.theta / maxRms,
      alpha: raw.alpha / maxRms,
      beta:  raw.beta  / maxRms,
      gamma: raw.gamma / maxRms,
    };
  }

  private _onDisconnect = (): void => {
    this._connected = false;
  };

  private async _cleanup(): Promise<void> {
    for (const char of this._eegChars) {
      await char.stopNotifications().catch(() => {});
      char.removeEventListener("characteristicvaluechanged", this._onEegNotification);
    }
    this._eegChars = [];
    if (this._server?.connected) this._server.disconnect();
    this._server = null;
    if (this._device) {
      this._device.removeEventListener("gattserverdisconnected", this._onDisconnect);
    }
    this._device = null;
    this._connected = false;
    this._buffers = [[], [], [], []];
  }
}
