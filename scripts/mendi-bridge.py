#!/usr/bin/env python3
"""
Mendi BLE → WebSocket bridge.

Why this exists: Chrome's Web Bluetooth on macOS has been unreliable at
discovering the Mendi V4 headband (BT chooser opens but no device shows,
even though the headband is broadcasting and visible to other Mac BLE
tools). Rather than fight Chrome's BT subsystem, this Python daemon:

  1. Uses `bleak` (the same CoreBluetooth-based library that successfully
     discovered the Mendi during testing) to scan + connect to the headband.
  2. Subscribes to the Frame characteristic and writes the sensor-enable
     command to start the protobuf stream.
  3. Forwards every received frame as a hex-encoded WebSocket message to
     any connected client.

The web app's MendiBridgeAdapter (src/lib/device/mendi-bridge.ts) connects
to ws://localhost:8765, decodes each hex frame with the existing protobuf
decoder, and emits DeviceSamples as if it were a native BLE adapter.

Usage:
    cd /Users/johnpaultraugott/Desktop/eegbase
    python3 scripts/mendi-bridge.py

Then in another terminal:
    npm run dev

Then open http://localhost:3000/sessions/live in Chrome and pick a Mendi
protocol. The MendiBridgeAdapter will connect via WebSocket, the bridge
will pair with the headband over BLE, and live data will flow into the
web app as if it were native Web Bluetooth.

Dependencies (already installed via `pip3 install --user bleak websockets`):
    pip3 install bleak websockets
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional, Set

import websockets
from bleak import BleakClient, BleakScanner
from bleak.backends.device import BLEDevice

# ── Configuration (must match src/lib/device/mendi.ts) ─────────────────────

MENDI_SERVICE_UUID = "fc3eabb0-c6c4-49e6-922a-6e551c455af5"
MENDI_FRAME_CHAR_UUID = "fc3eabb1-c6c4-49e6-922a-6e551c455af5"
MENDI_SENSOR_CHAR_UUID = "fc3eabb2-c6c4-49e6-922a-6e551c455af5"
MENDI_ADC_CHAR_UUID = "fc3eabb4-c6c4-49e6-922a-6e551c455af5"
MENDI_DIAGNOSTICS_CHAR_UUID = "fc3eabb5-c6c4-49e6-922a-6e551c455af5"
MENDI_CALIBRATION_CHAR_UUID = "fc3eabb6-c6c4-49e6-922a-6e551c455af5"
# We subscribe to the same chars the eugenehp/mendi Rust crate does — in the
# same order. Subscribing to the IMU char (0xABB3) appears to interfere with
# the Frame stream, so we skip it. Diagnostics (0xABB5) is READ ONCE, not
# subscribed. Calibration (0xABB6) and ADC (0xABB4) are subscribed.

# START-STREAMING command — captured from a real iPhone Mendi-app session
# on 2026-05-15. The iPhone writes EXACTLY these bytes once after
# subscribing to Frame + Calibration, and the headband immediately begins
# 31 Hz Frame notifications.
#
# Decoded protobuf: Sensor { address: 0x1E, data: 0x00000100 }
#   field 2 (uint32 address = 0x1E): tag 0x10, value 0x1E  →  10 1e
#   field 3 (fixed32 data = 0x100): tag 0x1d, 4-byte LE     →  1d 00 01 00 00
# Total: 7 bytes.
#
# 0x1E is AFE4404 register TIA_AMB_GAIN. Why writing 0x100 to it triggers
# streaming on Mendi V4 fw 1.0.2 isn't documented anywhere — it's a
# firmware-specific behavior we discovered by sniffing the iOS app.
ENABLE_SENSOR_BYTES = bytes([0x10, 0x1E, 0x1D, 0x00, 0x01, 0x00, 0x00])

# Calibration with non-zero LED current offsets — testing the theory that
# all-zero offsets keep the LEDs off (and therefore no Frame data flows).
# offset_l = +20.0 mA, offset_r = +20.0 mA, offset_p = +20.0 mA, enable=true.
# float 20.0 = 0x41a00000 (little-endian: 00 00 a0 41).
import struct as _struct
def _build_calibration(offset_l: float, offset_r: float, offset_p: float,
                       enable_auto_cal: bool, low_power: bool) -> bytes:
    out = bytearray()
    out += b"\x0d" + _struct.pack("<f", offset_l)
    out += b"\x15" + _struct.pack("<f", offset_r)
    out += b"\x1d" + _struct.pack("<f", offset_p)
    if enable_auto_cal:
        out += b"\x20\x01"
    if low_power:
        out += b"\x28\x01"
    return bytes(out)

CALIBRATION_BYTES = _build_calibration(20.0, 20.0, 20.0, True, False)

# ── AFE4404 bootstrap sequence ────────────────────────────────────────────
# Mendi V4 uses a TI AFE4404 optical chip. Firmware 1.0.2 acts as a
# transparent I²C bridge: the host must configure the AFE before it streams.
# Reading register 0 returns 0xffffff (= chip in reset state, all unset).
#
# Each entry below is (address, data) for a write_sensor_register call.
# Encoded as protobuf Sensor{read:false, address, data} per the V4 .proto.
# Values from TI AFE4404 datasheet + reference driver, configured for
# ~50 Hz sampling, 3-channel (LED1=Red, LED2=IR, AMB), default LED currents.
AFE4404_INIT_SEQUENCE = [
    (0x00, 0x000008),  # CONTROL0: SW_RESET
    # — wait 10ms after reset —
    (0x09, 0x000050),  # LED2STC
    (0x0A, 0x00018F),  # LED2ENDC
    (0x01, 0x0001E0),  # LED2LEDSTC
    (0x02, 0x00031F),  # LED2LEDENDC
    (0x15, 0x000320),  # ALED2STC
    (0x16, 0x00045F),  # ALED2ENDC
    (0x0D, 0x000460),  # LED1STC
    (0x0E, 0x00059F),  # LED1ENDC
    (0x03, 0x0005F0),  # LED1LEDSTC
    (0x04, 0x00072F),  # LED1LEDENDC
    (0x19, 0x000730),  # ALED1STC
    (0x1A, 0x00086F),  # ALED1ENDC
    (0x1D, 0x009C3F),  # PRPCT (40000 = 50 Hz @ 4 MHz internal clock)
    (0x22, 0x011414),  # LEDCNTRL: LED1 + LED2 currents (~25 mA each)
    (0x23, 0x000104),  # CONTROL2: DRDY enable
    (0x20, 0x008003),  # CONTROL1: TIMEREN=1 (enables timing engine)
]


def build_sensor_write(address: int, data: int) -> bytes:
    """Build a protobuf-encoded Sensor message for a register WRITE.
    Sensor { bool read = 1; uint32 address = 2; fixed32 data = 3 }
    For a write: read=false (omit the field — proto3 default), address+data set.
    """
    out = bytearray()
    # field 2 (uint32 address) — varint, only if non-zero (proto3 omits defaults)
    if address != 0:
        out += b"\x10"
        v = address
        while True:
            byte = v & 0x7f
            v >>= 7
            if v == 0:
                out += bytes([byte])
                break
            out += bytes([byte | 0x80])
    # field 3 (fixed32 data) — always include even if 0
    out += b"\x1d"
    out += _struct.pack("<I", data & 0xffffffff)
    return bytes(out)

WEBSOCKET_HOST = "127.0.0.1"
WEBSOCKET_PORT = 8765

SCAN_TIMEOUT_SEC = 30.0  # Mendi has long advertising interval; needs >20s

# ── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("mendi-bridge")


# ── State ──────────────────────────────────────────────────────────────────

clients: Set[websockets.WebSocketServerProtocol] = set()
ble_client: Optional[BleakClient] = None
frame_count = 0


# ── BLE side ───────────────────────────────────────────────────────────────


async def find_mendi() -> Optional[BLEDevice]:
    """Active-scan for a device named 'Mendi'."""
    log.info(f"Scanning for Mendi (timeout {SCAN_TIMEOUT_SEC}s)...")
    devices = await BleakScanner.discover(
        timeout=SCAN_TIMEOUT_SEC, scanning_mode="active"
    )
    for d in devices:
        if d.name and "mendi" in d.name.lower():
            log.info(f"Found Mendi: name={d.name!r} addr={d.address}")
            return d
    log.warning(
        f"No Mendi in scan (saw {len(devices)} other devices). "
        f"Make sure the headband is on, blinking, and not connected to the iPhone app."
    )
    return None


async def broadcast_frame(data: bytes) -> None:
    """Send a frame to every connected WS client as a hex string."""
    global frame_count
    frame_count += 1
    if frame_count % 31 == 0:  # ~once a second at 31 Hz
        log.info(f"Streamed {frame_count} frames to {len(clients)} client(s)")

    if not clients:
        return

    msg = json.dumps({"type": "frame", "hex": data.hex()})
    dead = []
    for ws in clients:
        try:
            await ws.send(msg)
        except websockets.ConnectionClosed:
            dead.append(ws)
    for ws in dead:
        clients.discard(ws)


_frame_first_logged = False

def on_frame_notification(_sender: int, data: bytearray) -> None:
    """Called by bleak on every Frame notification — schedule the broadcast."""
    global _frame_first_logged
    if not _frame_first_logged or frame_count < 5:
        log.info(
            f"  FRAME (0xABB1) #{frame_count + 1}: {len(data)}B "
            f"{bytes(data).hex()[:80]}"
        )
        _frame_first_logged = True
    asyncio.create_task(broadcast_frame(bytes(data)))


def make_diag_handler(char_uuid: str):
    """One-off logger for any non-Frame characteristic that emits."""
    short = char_uuid.split("-")[0]  # the unique part: fc3eabb3, fc3eabb4, ...
    seen = {"count": 0}

    def handler(_sender: int, data: bytearray) -> None:
        seen["count"] += 1
        if seen["count"] <= 3 or seen["count"] % 50 == 0:
            log.info(
                f"  diag {short} got #{seen['count']}: "
                f"{len(data)}B {bytes(data).hex()[:80]}"
            )
    return handler


async def maintain_ble_connection() -> None:
    """Find, connect, subscribe, enable streaming. Reconnect on failure."""
    global ble_client, frame_count
    backoff = 2.0
    while True:
        device = await find_mendi()
        if device is None:
            await asyncio.sleep(backoff)
            backoff = min(backoff * 1.5, 30.0)
            continue
        backoff = 2.0
        try:
            log.info(f"Connecting to {device.address}...")
            async with BleakClient(device) as client:
                ble_client = client
                log.info("Connected. Subscribing the way the iPhone Mendi app does...")
                # The official iPhone app subscribes to ONLY two chars:
                # Frame (0xABB1) + Calibration (0xABB6). It does NOT
                # subscribe to ADC, IMU, or Sensor. Subscribing to more
                # may cause the firmware to refuse streaming on fw 1.0.2.
                await client.start_notify(MENDI_FRAME_CHAR_UUID, on_frame_notification)
                log.info("  ✓ Frame (0xABB1) subscribed")
                await client.start_notify(MENDI_CALIBRATION_CHAR_UUID, make_diag_handler(MENDI_CALIBRATION_CHAR_UUID))
                log.info("  ✓ Calibration (0xABB6) subscribed")

                # Notify all WS clients that BLE is ready
                if clients:
                    msg = json.dumps({"type": "ble_connected", "name": device.name})
                    await asyncio.gather(*[ws.send(msg) for ws in clients])

                # The iPhone app does ONLY this: subscribe to Frame +
                # Calibration, then write the magic Sensor command.
                # No AFE bootstrap. No Calibration write. No retries.
                log.info(f"Writing start-streaming: {ENABLE_SENSOR_BYTES.hex()}")
                try:
                    await client.write_gatt_char(
                        MENDI_SENSOR_CHAR_UUID, ENABLE_SENSOR_BYTES, response=True
                    )
                    log.info("  ✓ start-streaming sent")
                except Exception as e:
                    log.warning(f"start-streaming write failed: {e}")

                # Verify Frames flow within 3 sec
                await asyncio.sleep(3)
                if frame_count >= 10:
                    log.info(
                        f"✓✓✓ STREAMING! {frame_count} Frames received "
                        f"(~{frame_count / 3:.1f} Hz). Stable."
                    )
                else:
                    log.warning(
                        f"Only {frame_count} Frames in 3 sec. Either firmware "
                        f"differs or we still need something."
                    )

                # Stay connected as long as the BLE link is alive
                while client.is_connected:
                    await asyncio.sleep(1)

                log.warning("BLE link dropped. Will rescan + reconnect.")
        except Exception as e:
            log.error(f"BLE connection error: {e}")
        finally:
            ble_client = None
            frame_count = 0
            if clients:
                msg = json.dumps({"type": "ble_disconnected"})
                await asyncio.gather(*[ws.send(msg) for ws in clients], return_exceptions=True)
        await asyncio.sleep(2.0)


# ── WebSocket side ─────────────────────────────────────────────────────────


async def handle_client(ws: websockets.WebSocketServerProtocol) -> None:
    """Register a client, send current status, then keep alive until disconnect."""
    log.info(f"WS client connected from {ws.remote_address}")
    clients.add(ws)
    try:
        # Send current state
        await ws.send(json.dumps({
            "type": "status",
            "ble_connected": ble_client is not None and ble_client.is_connected,
        }))
        # Stay open until the client disconnects
        async for _ in ws:
            pass
    except websockets.ConnectionClosed:
        pass
    finally:
        clients.discard(ws)
        log.info(f"WS client disconnected ({len(clients)} remaining)")


# ── Main ───────────────────────────────────────────────────────────────────


async def main() -> None:
    log.info(f"Mendi bridge starting on ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}")
    log.info("Open the EEGBase web app at http://localhost:3000 and start a Mendi session.")
    # `origins=None` allows the browser to connect from any origin (including
    # http://localhost:3000) without Origin-header rejection. Safe because we
    # only bind to 127.0.0.1.
    server = await websockets.serve(
        handle_client, WEBSOCKET_HOST, WEBSOCKET_PORT, origins=None
    )
    ble_task = asyncio.create_task(maintain_ble_connection())
    try:
        await asyncio.gather(server.wait_closed(), ble_task)
    except (KeyboardInterrupt, asyncio.CancelledError):
        log.info("Shutting down...")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
