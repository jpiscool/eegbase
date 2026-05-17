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
  private _notifCount = 0;
  private _sampleCount = 0;

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
      this._characteristic = await service.getCharacteristic(MENDI_FNIRS_CHAR_UUID);
      console.info("[Mendi] frame characteristic acquired", {
        properties: {
          notify: this._characteristic.properties.notify,
          indicate: this._characteristic.properties.indicate,
          read: this._characteristic.properties.read,
        },
      });

      this._characteristic.addEventListener(
        "characteristicvaluechanged",
        this._onNotification
      );
      await this._characteristic.startNotifications();
      console.info("[Mendi] frame notifications subscribed");

      // Mendi V4 firmware requires a write to the Sensor characteristic on
      // the same primary service before it begins emitting Frame notifications.
      // The eugenehp/mendi crate documents this as the "enable_sensor" step.
      //
      // Some V4 firmware revisions only accept write-without-response on this
      // characteristic, so we try withResponse first (more reliable when it
      // works) and fall back to withoutResponse before giving up.
      try {
        const sensor = await service.getCharacteristic(MENDI_SENSOR_CHAR_UUID);
        console.info("[Mendi] sensor characteristic acquired", {
          properties: {
            write: sensor.properties.write,
            writeWithoutResponse: sensor.properties.writeWithoutResponse,
            notify: sensor.properties.notify,
          },
        });
        // Small delay so the BLE stack has settled after subscribing.
        await new Promise((r) => setTimeout(r, 150));
        try {
          await sensor.writeValueWithResponse(MENDI_ENABLE_SENSOR_BYTES);
          console.info("[Mendi] enable_sensor write OK (withResponse)");
        } catch (errWith) {
          console.warn("[Mendi] writeValueWithResponse failed; trying withoutResponse:", errWith);
          await sensor.writeValueWithoutResponse(MENDI_ENABLE_SENSOR_BYTES);
          console.info("[Mendi] enable_sensor write OK (withoutResponse)");
        }
      } catch (err) {
        console.error(
          "[Mendi] enable_sensor handshake failed — Frame notifications likely won't arrive:",
          err
        );
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
