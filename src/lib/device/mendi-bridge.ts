/**
 * Mendi BLE-bridge adapter — WebSocket transport.
 *
 * Background:
 *   Chrome's Web Bluetooth on macOS has been unreliable at discovering
 *   the Mendi V4 headband. The native Mac BLE stack (CoreBluetooth via
 *   the `bleak` Python lib) finds it cleanly, so we run a small Python
 *   daemon (`scripts/mendi-bridge.py`) that does the BLE work and
 *   forwards every frame as a hex-encoded JSON message over a localhost
 *   WebSocket. This adapter receives those frames and runs them through
 *   the same MendiPacketDecoder used by the direct WebBluetooth adapter,
 *   so the rest of the platform sees identical DeviceSamples either way.
 *
 * Setup (one-off):
 *   pip3 install --user bleak websockets
 *
 * Run alongside `npm run dev`:
 *   python3 scripts/mendi-bridge.py
 *
 * The web app's createAdapter() picks this adapter (instead of MendiAdapter)
 * for `deviceType === "mendi"` while the Web Bluetooth path is blocked.
 */

import type { DeviceAdapter, DeviceSample } from "./adapter";
import { MendiPacketDecoder } from "./mendi-decoder";

const DEFAULT_BRIDGE_URL = "ws://127.0.0.1:8765";

type SampleCallback = (sample: DeviceSample) => void;

interface BridgeMessage {
  type: "frame" | "status" | "ble_connected" | "ble_disconnected";
  hex?: string;
  ble_connected?: boolean;
  name?: string;
}

export class MendiBridgeAdapter implements DeviceAdapter {
  readonly deviceType = "mendi";
  readonly displayName = "Mendi (bridge)";

  private _socket: WebSocket | null = null;
  private _connected = false;
  private _bleConnected = false;
  private _callbacks: Set<SampleCallback> = new Set();
  private _decoder = new MendiPacketDecoder();
  private readonly _url: string;

  constructor(url: string = DEFAULT_BRIDGE_URL) {
    this._url = url;
  }

  async connect(): Promise<void> {
    if (typeof WebSocket === "undefined") {
      throw new Error("WebSocket is not available in this environment.");
    }

    return new Promise((resolve, reject) => {
      let opened = false;
      let timeout: ReturnType<typeof setTimeout> | null = null;

      const ws = new WebSocket(this._url);
      this._socket = ws;
      this._decoder.resetBaseline();

      timeout = setTimeout(() => {
        if (!opened) {
          ws.close();
          reject(
            new Error(
              "Mendi bridge not running. Start it in a terminal:\n" +
                "  cd ~/Desktop/eegbase && python3 scripts/mendi-bridge.py"
            )
          );
        }
      }, 4000);

      ws.addEventListener("open", () => {
        opened = true;
        if (timeout) clearTimeout(timeout);
        this._connected = true;
        resolve();
      });

      ws.addEventListener("error", () => {
        if (!opened && timeout) {
          clearTimeout(timeout);
          reject(
            new Error(
              "Cannot reach Mendi bridge at " +
                this._url +
                ". Is `python3 scripts/mendi-bridge.py` running?"
            )
          );
        }
      });

      ws.addEventListener("close", () => {
        this._connected = false;
        this._bleConnected = false;
      });

      ws.addEventListener("message", (event: MessageEvent) => {
        let msg: BridgeMessage;
        try {
          msg = JSON.parse(typeof event.data === "string" ? event.data : "");
        } catch {
          return;
        }

        if (msg.type === "ble_connected") {
          this._bleConnected = true;
          return;
        }
        if (msg.type === "ble_disconnected") {
          this._bleConnected = false;
          return;
        }
        if (msg.type === "status") {
          this._bleConnected = !!msg.ble_connected;
          return;
        }
        if (msg.type === "frame" && msg.hex) {
          const bytes = hexToBytes(msg.hex);
          if (!bytes) return;
          const sample = this._decoder.decode(new DataView(bytes.buffer));
          if (sample) this._callbacks.forEach((cb) => cb(sample));
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this._socket && this._socket.readyState <= WebSocket.OPEN) {
      this._socket.close();
    }
    this._socket = null;
    this._connected = false;
    this._bleConnected = false;
  }

  isConnected(): boolean {
    return this._connected;
  }

  /** True only when the Python bridge has an active BLE link to the headband. */
  isBleConnected(): boolean {
    return this._bleConnected;
  }

  onSample(callback: SampleCallback): () => void {
    this._callbacks.add(callback);
    return () => this._callbacks.delete(callback);
  }

  /** Diagnostics: dropped-packet count from the protobuf decoder. */
  getDroppedPacketCount(): number {
    return this._decoder.droppedPackets;
  }
}

function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.replace(/\s+/g, "");
  if (clean.length % 2 !== 0) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    const v = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(v)) return null;
    out[i] = v;
  }
  return out;
}
