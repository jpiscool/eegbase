/**
 * Mendi fNIRS adapter — WebBluetooth implementation.
 *
 * ⚠️  PLACEHOLDER UUIDs — replace with actual values from Mendi SDK after May 11 call.
 *
 * Architecture:
 *  1. Browser calls navigator.bluetooth.requestDevice() — shows pairing dialog
 *  2. Connect to GATT server on the Mendi headband
 *  3. Subscribe to the fNIRS characteristic notifications
 *  4. Parse each notification (DataView) into a DeviceSample
 *  5. Forward samples to the registered callback
 *
 * Data format assumption (TBD after SDK access):
 *  Bytes 0-3  : float32 LE — oxyHb left channel (μM)
 *  Bytes 4-7  : float32 LE — oxyHb right channel (μM)
 *  Bytes 8-11 : float32 LE — deoxyHb left channel (μM)
 *  Bytes 12-15: float32 LE — deoxyHb right channel (μM)
 *  Bytes 16-19: float32 LE — reward score (0-100)
 *
 * Replace MENDI_SERVICE_UUID and MENDI_FNIRS_CHAR_UUID with the
 * values Mendi provides. If Mendi exposes a JS SDK instead, swap
 * the connect() implementation to use the SDK and keep the same
 * DeviceSample output shape.
 */

import type { DeviceAdapter, DeviceSample } from "./adapter";

// ── Configuration ──────────────────────────────────────────────────────────────
// ⚠️  SDK PENDING — these UUIDs are placeholders. Real values arrive after the
//     Mendi SDK call (Mustafa, May 11). Once received, replace the two values
//     below and flip MENDI_SDK_PENDING to false. No other code changes required.
export const MENDI_SDK_PENDING = true;
const MENDI_SERVICE_UUID = "00001234-0000-1000-8000-00805f9b34fb";
const MENDI_FNIRS_CHAR_UUID = "00001235-0000-1000-8000-00805f9b34fb";

// How many ms between synthetic timestamps if device doesn't provide one
const SAMPLE_INTERVAL_MS = 100; // Mendi samples at ~10 Hz

// ── Types ─────────────────────────────────────────────────────────────────────
type SampleCallback = (sample: DeviceSample) => void;

// ── Adapter ───────────────────────────────────────────────────────────────────
export class MendiAdapter implements DeviceAdapter {
  readonly deviceType = "mendi";
  readonly displayName = "Mendi";

  private _device: BluetoothDevice | null = null;
  private _server: BluetoothRemoteGATTServer | null = null;
  private _characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private _connected = false;
  private _callbacks: Set<SampleCallback> = new Set();

  // ── Public API ──────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (MENDI_SDK_PENDING) {
      throw new Error(
        "Mendi SDK integration pending — GATT UUIDs ship after the May 11 SDK handoff. " +
          "Until then, use the simulator device for live demos. Contact hello@eegbase.com to coordinate."
      );
    }
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      throw new Error(
        "Web Bluetooth is not supported in this browser. " +
          "Use Chrome or Edge on desktop (not iOS Safari)."
      );
    }

    try {
      this._device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "Mendi" }],
        optionalServices: [MENDI_SERVICE_UUID],
      });
    } catch (err) {
      if ((err as Error).name === "NotFoundError") {
        throw new Error(
          "No Mendi device found. Make sure your Mendi headband is powered on and in range."
        );
      }
      throw new Error(`Bluetooth pairing failed: ${(err as Error).message}`);
    }

    this._device.addEventListener("gattserverdisconnected", this._onDisconnect);

    try {
      this._server = await this._device.gatt!.connect();
      const service = await this._server.getPrimaryService(MENDI_SERVICE_UUID);
      this._characteristic = await service.getCharacteristic(MENDI_FNIRS_CHAR_UUID);

      this._characteristic.addEventListener(
        "characteristicvaluechanged",
        this._onNotification
      );
      await this._characteristic.startNotifications();

      this._connected = true;
    } catch (err) {
      this._cleanup();
      throw new Error(
        `Failed to connect to Mendi GATT service: ${(err as Error).message}. ` +
          "Ensure the Mendi app is not already connected to the headband."
      );
    }
  }

  async disconnect(): Promise<void> {
    this._cleanup();
  }

  isConnected(): boolean {
    return this._connected;
  }

  onSample(callback: SampleCallback): () => void {
    this._callbacks.add(callback);
    return () => this._callbacks.delete(callback);
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private _onNotification = (event: Event): void => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value || value.byteLength < 16) return;

    const sample = this._parse(value);
    this._callbacks.forEach((cb) => cb(sample));
  };

  /**
   * Parse a GATT notification DataView into a DeviceSample.
   *
   * Replace this method body with the actual Mendi binary protocol
   * once the SDK documentation is available from the May 11 call.
   */
  private _parse(view: DataView): DeviceSample {
    const oxyHbLeft = view.byteLength >= 4 ? view.getFloat32(0, true) : undefined;
    const oxyHbRight = view.byteLength >= 8 ? view.getFloat32(4, true) : undefined;
    const deoxyHbLeft = view.byteLength >= 12 ? view.getFloat32(8, true) : undefined;
    const deoxyHbRight = view.byteLength >= 16 ? view.getFloat32(12, true) : undefined;
    const rewardScore = view.byteLength >= 20 ? view.getFloat32(16, true) : undefined;

    // Compute reward score from oxyHb if device doesn't provide it
    const computedReward =
      rewardScore !== undefined
        ? rewardScore
        : oxyHbLeft != null && oxyHbRight != null
        ? Math.min(100, Math.max(0, 50 + (oxyHbLeft + oxyHbRight) * 100))
        : undefined;

    return {
      timestampMs: Date.now(),
      oxyHbLeft,
      oxyHbRight,
      deoxyHbLeft,
      deoxyHbRight,
      rewardScore: computedReward,
    };
  }

  private _onDisconnect = (): void => {
    this._connected = false;
    // Surface disconnection to consumers via a zero sample (signals gap)
    // Reconnection is left to the UI layer (user initiates).
  };

  private _cleanup(): void {
    if (this._characteristic) {
      this._characteristic
        .stopNotifications()
        .catch(() => { /* ignore if already disconnected */ });
      this._characteristic.removeEventListener(
        "characteristicvaluechanged",
        this._onNotification
      );
      this._characteristic = null;
    }
    if (this._server?.connected) {
      this._server.disconnect();
    }
    this._server = null;
    if (this._device) {
      this._device.removeEventListener("gattserverdisconnected", this._onDisconnect);
    }
    this._device = null;
    this._connected = false;
  }
}
