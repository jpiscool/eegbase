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

// Frame characteristic (notify) — emits the ~31 Hz protobuf-encoded fNIRS stream.
const MENDI_FNIRS_CHAR_UUID = "fc3eabb1-c6c4-49e6-922a-6e551c455af5";

// Sensor characteristic (write/notify) — must be written to before Frame
// notifications start on Mendi V4 firmware. The official app does this as part
// of its handshake. The expected payload is a protobuf Sensor{read:true,
// address:0, data:0} message which encodes to bytes 08 01 10 00 18 00.
const MENDI_SENSOR_CHAR_UUID: string = "fc3eabb2-c6c4-49e6-922a-6e551c455af5";
const MENDI_ENABLE_SENSOR_BYTES = new Uint8Array([0x08, 0x01, 0x10, 0x00, 0x18, 0x00]);

// ── Types ─────────────────────────────────────────────────────────────────
type SampleCallback = (sample: DeviceSample) => void;

// ── Adapter ───────────────────────────────────────────────────────────────
export class MendiAdapter implements DeviceAdapter {
  readonly deviceType = "mendi";
  readonly displayName = "Mendi";

  private _device: BluetoothDevice | null = null;
  private _server: BluetoothRemoteGATTServer | null = null;
  private _characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private _connected = false;
  private _callbacks: Set<SampleCallback> = new Set();
  private _decoder = new MendiPacketDecoder();

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
      const service = await this._server.getPrimaryService(MENDI_SERVICE_UUID);
      this._characteristic = await service.getCharacteristic(MENDI_FNIRS_CHAR_UUID);

      this._characteristic.addEventListener(
        "characteristicvaluechanged",
        this._onNotification
      );
      await this._characteristic.startNotifications();

      // Mendi V4 firmware requires a write to the Sensor characteristic on the
      // same primary service before it begins emitting Frame notifications.
      // The eugenehp/mendi crate documents this as the "enable_sensor" step.
      try {
        const sensor = await service.getCharacteristic(MENDI_SENSOR_CHAR_UUID);
        await sensor.writeValueWithResponse(MENDI_ENABLE_SENSOR_BYTES);
      } catch (err) {
        // Some firmware versions don't require the enable write — log but
        // don't fail the whole connect. If notifications never arrive, the
        // user will see an empty chart and we can revisit.
        console.warn("Mendi enable_sensor write failed (continuing):", err);
      }

      this._decoder.resetBaseline();
      this._connected = true;
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

    const sample = this._decoder.decode(value);
    if (sample) this._callbacks.forEach((cb) => cb(sample));
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
