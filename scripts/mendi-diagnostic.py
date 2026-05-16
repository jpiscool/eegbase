#!/usr/bin/env python3
"""
Mendi V4 diagnostic probe — runs every remaining experiment in one pass.

Goal: definitively narrow down what's blocking sustained Frame streaming.
We don't broadcast over WebSocket here — this is pure diagnosis.

Experiments performed (in order):
  1. Read standard FW/HW revision chars to confirm device identity
  2. Read AFE register 0 BEFORE any writes (baseline)
  3. Write CONTROL0=0x08 (SW_RESET) then immediately read back
     → if read returns 0x08, AFE writes ARE landing → bridge works
     → if read returns 0xffffff, AFE writes are silently dropped
  4. Run full AFE init + read each register back to verify
  5. Try LEDCNTRL with corrected bit packing (0x141414 = 20mA per LED)
  6. Send Calibration with various LED current values
  7. Send Calibration MULTIPLE times (in case firmware needs N writes)
  8. Try enable_sensor with WriteWithoutResponse
  9. Probe addresses 0..0x40 — which return non-0xffffff?
 10. Final: count Frame notifications received during the whole run
"""

from __future__ import annotations
import asyncio
import logging
import struct
from typing import Optional

from bleak import BleakClient, BleakScanner

# ── UUIDs ──
SERVICE_UUID = "fc3eabb0-c6c4-49e6-922a-6e551c455af5"
FRAME_CHAR = "fc3eabb1-c6c4-49e6-922a-6e551c455af5"
SENSOR_CHAR = "fc3eabb2-c6c4-49e6-922a-6e551c455af5"
IMU_CHAR = "fc3eabb3-c6c4-49e6-922a-6e551c455af5"
ADC_CHAR = "fc3eabb4-c6c4-49e6-922a-6e551c455af5"
DIAG_CHAR = "fc3eabb5-c6c4-49e6-922a-6e551c455af5"
CALIB_CHAR = "fc3eabb6-c6c4-49e6-922a-6e551c455af5"
FW_REV_UUID = "00002a26-0000-1000-8000-00805f9b34fb"
HW_REV_UUID = "00002a27-0000-1000-8000-00805f9b34fb"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("diag")

# Counters
frame_count = 0
last_sensor_response: Optional[bytes] = None
sensor_response_event = asyncio.Event()


def on_frame(_sender, data):
    global frame_count
    frame_count += 1
    if frame_count <= 3 or frame_count % 31 == 0:
        log.info(f"  >>> FRAME #{frame_count}: {len(data)}B {bytes(data).hex()[:60]}")


def on_sensor_response(_sender, data):
    global last_sensor_response
    last_sensor_response = bytes(data)
    sensor_response_event.set()


def encode_sensor(read: bool, address: int, data: int) -> bytes:
    """Encode protobuf Sensor{read, address, data}."""
    out = bytearray()
    if read:
        out += b"\x08\x01"
    if address != 0:
        out += b"\x10"
        v = address
        while v >= 0x80:
            out += bytes([(v & 0x7f) | 0x80])
            v >>= 7
        out += bytes([v])
    out += b"\x1d" + struct.pack("<I", data & 0xffffffff)
    return bytes(out)


def decode_sensor_response(b: bytes) -> dict:
    """Decode protobuf Sensor response into {read, address, data}."""
    out = {"read": False, "address": 0, "data": None}
    i = 0
    while i < len(b):
        tag = b[i]
        i += 1
        fn = tag >> 3
        wt = tag & 0x7
        if wt == 0:  # varint
            v = 0
            shift = 0
            while True:
                bb = b[i]
                i += 1
                v |= (bb & 0x7f) << shift
                if bb & 0x80 == 0:
                    break
                shift += 7
            if fn == 1:
                out["read"] = bool(v)
            elif fn == 2:
                out["address"] = v
        elif wt == 5:  # fixed32
            out["data"] = struct.unpack("<I", b[i:i+4])[0]
            i += 4
        else:
            break
    return out


async def write_then_read(client, address: int, data: int) -> Optional[int]:
    """Write a register then immediately read it back. Returns read-back value."""
    sensor_response_event.clear()
    # Write
    write_payload = encode_sensor(read=False, address=address, data=data)
    try:
        await client.write_gatt_char(SENSOR_CHAR, write_payload, response=True)
    except Exception as e:
        log.warning(f"    write 0x{address:02x}=0x{data:06x} failed: {e}")
        return None
    await asyncio.sleep(0.05)

    # Read
    sensor_response_event.clear()
    read_payload = encode_sensor(read=True, address=address, data=0)
    try:
        await client.write_gatt_char(SENSOR_CHAR, read_payload, response=True)
    except Exception as e:
        log.warning(f"    read 0x{address:02x} failed: {e}")
        return None
    try:
        await asyncio.wait_for(sensor_response_event.wait(), timeout=1.0)
    except asyncio.TimeoutError:
        log.warning(f"    read 0x{address:02x}: timeout (no response)")
        return None
    if last_sensor_response:
        decoded = decode_sensor_response(last_sensor_response)
        return decoded.get("data")
    return None


async def main():
    global frame_count

    log.info("=== MENDI V4 DIAGNOSTIC ===")
    log.info("Scanning for Mendi (40 sec)...")
    devices = await BleakScanner.discover(timeout=40.0, scanning_mode="active")
    mendi = next((d for d in devices if d.name and "mendi" in d.name.lower()), None)
    if not mendi:
        log.error("No Mendi found. Make sure it's on and breathing.")
        return
    log.info(f"Found Mendi: {mendi.name} @ {mendi.address}")

    async with BleakClient(mendi) as client:
        log.info("Connected.")

        # ── Experiment 1: device identity ──
        log.info("\n--- EXP 1: Device identity ---")
        try:
            fw = await client.read_gatt_char(FW_REV_UUID)
            log.info(f"  Firmware: {fw.decode('utf-8', errors='replace')}")
        except Exception as e:
            log.warning(f"  FW read failed: {e}")
        try:
            hw = await client.read_gatt_char(HW_REV_UUID)
            log.info(f"  Hardware: {hw.decode('utf-8', errors='replace')}")
        except Exception as e:
            log.warning(f"  HW read failed: {e}")

        # ── Subscribe ──
        await client.start_notify(FRAME_CHAR, on_frame)
        await client.start_notify(SENSOR_CHAR, on_sensor_response)

        # ── Experiment 2: AFE register 0 baseline ──
        log.info("\n--- EXP 2: Baseline AFE register reads ---")
        for addr in [0x00, 0x09, 0x1D, 0x20, 0x22, 0x23]:
            sensor_response_event.clear()
            await client.write_gatt_char(SENSOR_CHAR, encode_sensor(True, addr, 0), response=True)
            try:
                await asyncio.wait_for(sensor_response_event.wait(), timeout=1.0)
                d = decode_sensor_response(last_sensor_response)
                data_str = f"0x{d['data']:06x}" if d['data'] is not None else "(omitted=0)"
                log.info(f"  reg 0x{addr:02x} = {data_str}  read={d['read']}  resp_addr={d['address']}  raw={last_sensor_response.hex()}")
            except asyncio.TimeoutError:
                log.warning(f"  reg 0x{addr:02x}: timeout")

        # ── Experiment 3: write-then-read roundtrip (THE KEY TEST) ──
        log.info("\n--- EXP 3: Write-then-read roundtrip (key test) ---")
        for addr, data in [(0x00, 0x000008), (0x1D, 0x009C3F), (0x22, 0x141414), (0x20, 0x008003)]:
            log.info(f"  writing 0x{addr:02x} = 0x{data:06x}, then reading back...")
            actual = await write_then_read(client, addr, data)
            if actual is None:
                log.info(f"    read returned NOTHING")
            elif actual == data:
                log.info(f"    ✓ read returned 0x{actual:06x} — WRITE LANDED")
            else:
                log.info(f"    ✗ read returned 0x{actual:06x} — DIFFERENT (writes silently filtered or dropped)")

        # ── Experiment 4: try Calibration with bigger LEDs ──
        log.info("\n--- EXP 4: Calibration with various LED currents ---")
        for offset in [0.0, 30.0, 60.0, 100.0]:
            log.info(f"  Calibration offset_l/r/p = {offset}mA, enable=true")
            payload = (
                b"\x0d" + struct.pack("<f", offset) +
                b"\x15" + struct.pack("<f", offset) +
                b"\x1d" + struct.pack("<f", offset) +
                b"\x20\x01"
            )
            try:
                await client.write_gatt_char(CALIB_CHAR, payload, response=True)
                log.info(f"    ✓ sent")
            except Exception as e:
                log.warning(f"    failed: {e}")
            await asyncio.sleep(0.3)

        # ── Experiment 5: enable_sensor WithoutResponse ──
        log.info("\n--- EXP 5: enable_sensor with WriteWithoutResponse ---")
        before = frame_count
        try:
            await client.write_gatt_char(SENSOR_CHAR, encode_sensor(True, 0, 0), response=False)
            log.info(f"  ✓ sent without response")
        except Exception as e:
            log.warning(f"  failed: {e}")
        await asyncio.sleep(3.0)
        log.info(f"  Frames in 3 sec: {frame_count - before}")

        # ── Experiment 6: address scan — which AFE registers respond? ──
        log.info("\n--- EXP 6: Address scan 0x00..0x40 ---")
        responsive = []
        for addr in range(0, 0x40):
            sensor_response_event.clear()
            try:
                await client.write_gatt_char(SENSOR_CHAR, encode_sensor(True, addr, 0), response=True)
                await asyncio.wait_for(sensor_response_event.wait(), timeout=0.3)
                d = decode_sensor_response(last_sensor_response)
                data_val = d["data"]
                if data_val is not None and data_val != 0xffffff and data_val != 0:
                    log.info(f"  reg 0x{addr:02x} = 0x{data_val:06x}  <-- non-default")
                    responsive.append((addr, data_val))
            except (asyncio.TimeoutError, Exception):
                pass
        log.info(f"  Total non-0xffffff registers: {len(responsive)}")

        # ── Experiment 7: send Calibration repeatedly ──
        log.info("\n--- EXP 7: Repeated Calibration writes ---")
        for i in range(5):
            payload = b"\x0d\x00\x00\xa0\x41\x15\x00\x00\xa0\x41\x1d\x00\x00\xa0\x41\x20\x01"
            try:
                await client.write_gatt_char(CALIB_CHAR, payload, response=True)
            except Exception:
                pass
            await asyncio.sleep(0.2)
        log.info("  ✓ 5 calibration writes sent")

        # ── Final: 5 sec frame count ──
        log.info("\n--- FINAL: Listening 10 sec for any frames ---")
        before = frame_count
        await asyncio.sleep(10)
        log.info(f"\n=== TOTAL FRAMES THIS RUN: {frame_count} ({frame_count - before} in last 10 sec) ===")

        try:
            await client.stop_notify(FRAME_CHAR)
            await client.stop_notify(SENSOR_CHAR)
        except Exception:
            pass


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
