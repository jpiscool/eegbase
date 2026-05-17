/**
 * Mendi fNIRS adapter — WebBluetooth transport.
 *
 * Mendi has no public SDK and no public BLE-protocol documentation.
 * Per direct conversation with Mendi (May 2026), an independent
 * integration is the supported model — same approach Myndlift took
 * with Muse. EEGBase talks to the headband directly over BLE; no
 * Mendi app, no Mendi cloud, no licensing required.
 *
 * STATUS: Pending hardware capture of the BLE protocol. See
 *   AUDIT-2026-MENDI-BLE-PROTOCOL.md
 * for the capture procedure. Once UUIDs and packet shape are
 * documented, replace the placeholder constants below and flip
 * MENDI_PROTOCOL_PENDING to false.
 *
 * Architecture:
 *  1. navigator.bluetooth.requestDevice() — browser pairing dialog
 *  2. GATT connect → get primary service → get streaming characteristic
 *  3. Optional: write start-streaming command to control characteristic
 *  4. Subscribe to notifications
 *  5. Hand each notification to MendiPacketDecoder (pure, no I/O)
 *  6. Forward decoded DeviceSamples to subscribers
 *
 * The packet-decode logic lives in `mendi-decoder.ts` so it can be
 * unit-tested against captured fixtures and re-used by the future
 * mobile app (react-native-ble-plx transport).
 */

import type { DeviceAdapter, DeviceSample } from "./adapter";
import { MendiPacketDecoder } from "./mendi-decoder";

// ── Configuration ──────────────────────────────────────────────────────────
// Reverse-engineered from a Mendi V4 (firmware 1.0.2) on 2026-05-13, then
// corrected against the public eugenehp/mendi Rust crate which independently
// reverse-engineered the same protocol. The previous UUIDs were correct bytes
// but byte-reversed (Wireshark displays UUIDs in little-endian).
//
// References:
//   https://github.com/eugenehp/mendi
//   https://github.com/eugenehp/mendi/blob/main/src/protocol.rs
//   https://github.com/eugenehp/mendi/blob/main/src/mendi_client.rs
export const MENDI_PROTOCOL_PENDING = false;

// Single primary service hosting all Mendi V4 functional characteristics.
const MENDI_SERVICE_UUID = "fc3eabb0-c6c4-49e6-922a-6e551c455af5";

// Mendi V4 exposes SIX characteristics on this service. We must enumerate
// them all — Web Bluetooth only resolves characteristics declared up-front,
// and on V4 firmware the Frame stream only engages after the client has
// performed the full warm-up (subscribe to 4 notify chars, read diagnostics,
// write Calibration{enable:true}, write Sensor{read:true}). Reference:
// https://github.com/eugenehp/mendi (Rust crate that successfully streams
// from V4 firmware).
const MENDI_FRAME_CHAR_UUID       = "fc3eabb1-c6c4-49e6-922a-6e551c455af5"; // notify — fNIRS+IMU stream
const MENDI_SENSOR_CHAR_UUID      = "fc3eabb2-c6c4-49e6-922a-6e551c455af5"; // write+notify — optical sensor register I/O
const MENDI_IMU_CHAR_UUID         = "fc3eabb3-c6c4-49e6-922a-6e551c455af5"; // write+notify — IMU register I/O
const MENDI_ADC_CHAR_UUID         = "fc3eabb4-c6c4-49e6-922a-6e551c455af5"; // notify — battery/charging/USB
const MENDI_DIAGNOSTICS_CHAR_UUID = "fc3eabb5-c6c4-49e6-922a-6e551c455af5"; // read — power-on self-test
const MENDI_CALIBRATION_CHAR_UUID = "fc3eabb6-c6c4-49e6-922a-6e551c455af5"; // write+notify — LED current offsets, auto-cal, low-power

// Legacy alias retained so other modules importing the name still compile.
const MENDI_FNIRS_CHAR_UUID = MENDI_FRAME_CHAR_UUID;

// protobuf-encoded `Sensor{read:true, address:0, data:0}` — kicks Sensor
// channel into the read state.
const MENDI_ENABLE_SENSOR_BYTES = new Uint8Array([0x08, 0x01, 0x10, 0x00, 0x18, 0x00]);
// protobuf-encoded `Calibration{enable:true}` (proto3 zero-value floats
// omitted; field 4 = bool true → tag `0x20`, value `0x01`).
// Per eugenehp's CLI `c` command, this is the trigger that engages the
// internal sensor loop. Frame notifications start streaming after this.
const MENDI_ENABLE_CALIBRATION_BYTES = new Uint8Array([0x20, 0x01]);

// ── Types ─────────────────────────────────────────────────────────────────
type SampleCallback = (sample: DeviceSample) => void;

// ── Adapter ───────────────────────────────────────────────────────────────
export class MendiAdapter implements DeviceAdapter {
  readonly deviceType = "mendi";
  readonly displayName = "Mendi";

  private _device: BluetoothDevice | null = null;
  private _server: BluetoothRemoteGATTServer | null = null;
  private _characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private _sensorChar: BluetoothRemoteGATTCharacteristic | null = null;
  private _connected = false;
  private _callbacks: Set<SampleCallback> = new Set();
  private _decoder = new MendiPacketDecoder();
  private _notifCount = 0;
  private _sampleCount = 0;
  private _sensorNotifCount = 0;

  async connect(): Promise<void> {
    if (MENDI_PROTOCOL_PENDING) {
      throw new Error(
        "Mendi BLE protocol is being reverse-engineered (no Mendi SDK exists). " +
          "Until the capture is complete, use the simulator device for live demos. " +
          "See AUDIT-2026-MENDI-BLE-PROTOCOL.md for status."
      );
    }
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      throw new Error(
        "Web Bluetooth is not supported in this browser. Use Chrome or Edge on desktop."
      );
    }

    try {
      this._device = await navigator.bluetooth.requestDevice({
        // List the service UUID in BOTH `filters` and `optionalServices` to
        // satisfy Chrome's Web Bluetooth chooser logic on macOS — the chooser
        // is more reliable when given a service-UUID filter alongside the name.
        filters: [
          { namePrefix: "Mendi" },
          { services: [MENDI_SERVICE_UUID] },
        ],
        optionalServices: [MENDI_SERVICE_UUID],
      });
    } catch (err) {
      if ((err as Error).name === "NotFoundError") {
        throw new Error(
          "No Mendi device found. Make sure the headband is powered on, in range, and not currently paired with the Mendi consumer app."
        );
      }
      throw new Error(`Bluetooth pairing failed: ${(err as Error).message}`);
    }

    this._device.addEventListener("gattserverdisconnected", this._onDisconnect);

    try {
      this._server = await this._device.gatt!.connect();
      console.info("[Mendi] GATT connected");
      const service = await this._server.getPrimaryService(MENDI_SERVICE_UUID);
      console.info("[Mendi] primary service acquired");

      // ── 1. Acquire all six characteristics ────────────────────────────
      // Mendi V4 firmware gates streaming on the client having performed
      // the full warm-up against all six. eugenehp/mendi confirmed flow.
      this._characteristic = await service.getCharacteristic(MENDI_FRAME_CHAR_UUID);
      console.info("[Mendi] frame characteristic acquired", {
        properties: {
          notify: this._characteristic.properties.notify,
          indicate: this._characteristic.properties.indicate,
          read: this._characteristic.properties.read,
        },
      });

      const sensor = await service.getCharacteristic(MENDI_SENSOR_CHAR_UUID);
      this._sensorChar = sensor;
      console.info("[Mendi] sensor characteristic acquired");

      // The ADC, Calibration, and Diagnostics characteristics are optional
      // in the sense that the eugenehp client gracefully degrades if any
      // one of them is missing — but on V4 firmware the device watches for
      // the client to touch them as part of "client ready" detection.
      let adcChar: BluetoothRemoteGATTCharacteristic | null = null;
      let calibChar: BluetoothRemoteGATTCharacteristic | null = null;
      let diagChar: BluetoothRemoteGATTCharacteristic | null = null;
      try { adcChar = await service.getCharacteristic(MENDI_ADC_CHAR_UUID); console.info("[Mendi] adc characteristic acquired"); } catch (e) { console.warn("[Mendi] adc characteristic missing:", e); }
      try { calibChar = await service.getCharacteristic(MENDI_CALIBRATION_CHAR_UUID); console.info("[Mendi] calibration characteristic acquired"); } catch (e) { console.warn("[Mendi] calibration characteristic missing:", e); }
      try { diagChar = await service.getCharacteristic(MENDI_DIAGNOSTICS_CHAR_UUID); console.info("[Mendi] diagnostics characteristic acquired"); } catch (e) { console.warn("[Mendi] diagnostics characteristic missing:", e); }

      // ── 2. Subscribe to the four notify chars in eugenehp's order ─────
      this._characteristic.addEventListener("characteristicvaluechanged", this._onNotification);
      await this._characteristic.startNotifications();
      console.info("[Mendi] frame notifications subscribed");

      if (adcChar && adcChar.properties.notify) {
        try { await adcChar.startNotifications(); console.info("[Mendi] adc notifications subscribed"); }
        catch (e) { console.warn("[Mendi] adc startNotifications failed:", e); }
      }

      if (calibChar && calibChar.properties.notify) {
        try { await calibChar.startNotifications(); console.info("[Mendi] calibration notifications subscribed"); }
        catch (e) { console.warn("[Mendi] calibration startNotifications failed:", e); }
      }

      if (sensor.properties.notify) {
        sensor.addEventListener("characteristicvaluechanged", this._onSensorNotification);
        try { await sensor.startNotifications(); console.info("[Mendi] sensor notifications subscribed"); }
        catch (e) { console.warn("[Mendi] sensor startNotifications failed:", e); }
      }

      // ── 3. Read Diagnostics once ──────────────────────────────────────
      // Even if we don't parse the protobuf, the read itself contributes to
      // the device's "client looks ready" signal.
      if (diagChar && diagChar.properties.read) {
        try {
          const diag = await diagChar.readValue();
          console.info("[Mendi] diagnostics read", { bytes: diag.byteLength });
        } catch (e) {
          console.warn("[Mendi] diagnostics read failed:", e);
        }
      }

      // ── 4. Write Calibration{enable:true} to ABB6 ─────────────────────
      // This is the actual streaming trigger per eugenehp's CLI `c` command.
      // The Sensor enable below is documented as "some FW versions require
      // this" — implying Calibration is the primary trigger on V4.
      if (calibChar && (calibChar.properties.write || calibChar.properties.writeWithoutResponse)) {
        const calibPayload = MENDI_ENABLE_CALIBRATION_BYTES as unknown as BufferSource;
        try {
          await calibChar.writeValueWithResponse(calibPayload);
          console.info("[Mendi] calibration enable write OK (withResponse)");
        } catch (errC) {
          console.warn("[Mendi] calibration writeWithResponse failed; trying withoutResponse:", errC);
          try {
            await calibChar.writeValueWithoutResponse(calibPayload);
            console.info("[Mendi] calibration enable write OK (withoutResponse)");
          } catch (errC2) {
            console.warn("[Mendi] calibration enable write failed entirely:", errC2);
          }
        }
      }

      // Brief settling delay so the device can process the calibration
      // command before we issue the sensor enable.
      await new Promise((r) => setTimeout(r, 200));

      // ── 5. Write Sensor{read:true,address:0,data:0} to ABB2 ───────────
      const sensorPayload = MENDI_ENABLE_SENSOR_BYTES as unknown as BufferSource;
      try {
        await sensor.writeValueWithResponse(sensorPayload);
        console.info("[Mendi] enable_sensor write OK (withResponse)");
      } catch (errWith) {
        console.warn("[Mendi] writeValueWithResponse failed; trying withoutResponse:", errWith);
        await sensor.writeValueWithoutResponse(sensorPayload);
        console.info("[Mendi] enable_sensor write OK (withoutResponse)");
      }

      this._decoder.resetBaseline();
      this._connected = true;
      console.info("[Mendi] ready — awaiting frames");
    } catch (err) {
      this._cleanup();
      throw new Error(
        `Failed to connect to Mendi GATT service: ${(err as Error).message}. ` +
          "Ensure the Mendi consumer app is not already connected to the headband."
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

  /** Diagnostics: dropped-packet count from the decoder (transport-level). */
  getDroppedPacketCount(): number {
    return this._decoder.droppedPackets;
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private _onNotification = (event: Event): void => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    this._notifCount++;
    // Log the first frame (proves notifications are alive) and every 100th
    // afterwards so the console doesn't drown but operators get a heartbeat.
    if (this._notifCount === 1) {
      console.info("[Mendi] first frame received", {
        bytes: value.byteLength,
        head: Array.from(new Uint8Array(value.buffer.slice(0, Math.min(8, value.byteLength))))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" "),
      });
    } else if (this._notifCount % 100 === 0) {
      console.info(
        `[Mendi] ${this._notifCount} frames received · ${this._sampleCount} decoded samples · dropped=${this._decoder.droppedPackets}`
      );
    }

    const sample = this._decoder.decode(value);
    if (sample) {
      this._sampleCount++;
      this._callbacks.forEach((cb) => cb(sample));
    }
  };

  // Mirror handler for the Sensor characteristic in case V4 firmware
  // streams sensor data on that char instead of the Frame char. We log
  // the first frame loudly so the operator can see WHERE data is arriving;
  // if it lands here consistently we'll switch the decoder over.
  private _onSensorNotification = (event: Event): void => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;
    this._sensorNotifCount++;
    if (this._sensorNotifCount === 1) {
      console.info("[Mendi] first SENSOR notification received", {
        bytes: value.byteLength,
        head: Array.from(new Uint8Array(value.buffer.slice(0, Math.min(8, value.byteLength))))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" "),
      });
    } else if (this._sensorNotifCount % 100 === 0) {
      console.info(`[Mendi] ${this._sensorNotifCount} sensor notifications received`);
    }
    // Try decoding as a Frame packet too — if it works, great, data is
    // arriving on the sensor char and we're done.
    const sample = this._decoder.decode(value);
    if (sample) {
      this._sampleCount++;
      this._callbacks.forEach((cb) => cb(sample));
    }
  };

  private _onDisconnect = (): void => {
    this._connected = false;
    // Reconnect strategy is left to the UI layer — surface the
    // disconnect via isConnected() so the live-session view can
    // prompt the user.
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
    if (this._sensorChar) {
      this._sensorChar
        .stopNotifications()
        .catch(() => { /* ignore if already disconnected */ });
      this._sensorChar.removeEventListener(
        "characteristicvaluechanged",
        this._onSensorNotification
      );
      this._sensorChar = null;
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
