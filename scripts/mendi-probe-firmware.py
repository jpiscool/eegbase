#!/usr/bin/env python3
"""
Mendi V4 firmware register probe — looks for firmware-internal registers
beyond the AFE4404 address space (0x00-0x4D).

If Mendi's firmware exposes its own state/control registers, they'd be
at addresses outside the AFE's range. A read that returns NOT 0xffffff
at, say, address 0x80 or 0x100 would confirm a firmware-internal register.

Also probes addresses likely to control "start streaming" — looking for
any address where a write triggers Frame data.
"""
from __future__ import annotations
import asyncio, logging, struct
from typing import Optional
from bleak import BleakClient, BleakScanner

SERVICE_UUID = "fc3eabb0-c6c4-49e6-922a-6e551c455af5"
FRAME_CHAR = "fc3eabb1-c6c4-49e6-922a-6e551c455af5"
SENSOR_CHAR = "fc3eabb2-c6c4-49e6-922a-6e551c455af5"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("probe")

frame_count = 0
last_resp: Optional[bytes] = None
event = asyncio.Event()


def on_frame(_s, data):
    global frame_count
    frame_count += 1
    if frame_count <= 3:
        log.info(f"  >>> FRAME #{frame_count}: {len(data)}B {bytes(data).hex()[:60]}")


def on_sensor(_s, data):
    global last_resp
    last_resp = bytes(data)
    event.set()


def encode_sensor(read: bool, addr: int, data: int) -> bytes:
    out = bytearray()
    if read:
        out += b"\x08\x01"
    if addr != 0:
        out += b"\x10"
        v = addr
        while v >= 0x80:
            out += bytes([(v & 0x7f) | 0x80])
            v >>= 7
        out += bytes([v])
    out += b"\x1d" + struct.pack("<I", data & 0xffffffff)
    return bytes(out)


def decode(b: bytes) -> dict:
    out = {"read": False, "address": 0, "data": None}
    i = 0
    while i < len(b):
        tag = b[i]
        i += 1
        fn, wt = tag >> 3, tag & 0x7
        if wt == 0:
            v = 0; shift = 0
            while True:
                bb = b[i]; i += 1
                v |= (bb & 0x7f) << shift
                if not (bb & 0x80): break
                shift += 7
            if fn == 1: out["read"] = bool(v)
            elif fn == 2: out["address"] = v
        elif wt == 5:
            out["data"] = struct.unpack("<I", b[i:i+4])[0]
            i += 4
        else:
            break
    return out


async def read_addr(client, addr: int, timeout: float = 0.4) -> Optional[int]:
    event.clear()
    try:
        await client.write_gatt_char(SENSOR_CHAR, encode_sensor(True, addr, 0), response=True)
        await asyncio.wait_for(event.wait(), timeout=timeout)
    except Exception:
        return None
    if last_resp:
        d = decode(last_resp)
        if d["address"] != addr:
            log.warning(f"  reg 0x{addr:x}: response addr mismatch ({d['address']:x}) — firmware filtered?")
            return None
        return d["data"] if d["data"] is not None else 0
    return None


async def main():
    log.info("Scanning for Mendi (40 sec)...")
    devices = await BleakScanner.discover(timeout=40.0, scanning_mode="active")
    mendi = next((d for d in devices if d.name and "mendi" in d.name.lower()), None)
    if not mendi:
        log.error("No Mendi found.")
        return
    log.info(f"Found Mendi: {mendi.name}")

    async with BleakClient(mendi) as client:
        log.info("Connected.")
        await client.start_notify(FRAME_CHAR, on_frame)
        await client.start_notify(SENSOR_CHAR, on_sensor)

        # Probe ranges:
        # AFE4404: 0x00-0x4D (already partially probed)
        # Firmware-internal candidates: 0x4E-0xFF, 0x100, 0x200, 0x500, 0x1000, 0xFF00
        probes = (
            list(range(0x40, 0x60)) +
            list(range(0x60, 0x80, 2)) +
            list(range(0x80, 0x100, 4)) +
            [0x100, 0x101, 0x110, 0x200, 0x300, 0x400, 0x500, 0x800, 0x1000, 0xFF00, 0xFFFF]
        )

        log.info(f"--- Probing {len(probes)} candidate addresses ---")
        non_default = []
        for addr in probes:
            v = await read_addr(client, addr, timeout=0.3)
            if v is None:
                continue
            if v != 0xffffff and v != 0:
                log.info(f"  reg 0x{addr:04x} = 0x{v:06x}  <-- NON-DEFAULT (firmware reg?)")
                non_default.append((addr, v))

        log.info(f"\n--- Found {len(non_default)} non-default registers above 0x40 ---")

        # Now try writing 0x01 to each suspicious "high" register, see if any triggers Frame stream
        suspicious = non_default + [(0x4E, 0x01), (0x4F, 0x01), (0x50, 0x01), (0x80, 0x01), (0x100, 0x01)]
        log.info("\n--- Trying to write 0x01 to suspicious registers (test for stream trigger) ---")
        for addr, _ in suspicious:
            before = frame_count
            await client.write_gatt_char(SENSOR_CHAR, encode_sensor(False, addr, 0x01), response=True)
            await asyncio.sleep(2)
            new_frames = frame_count - before
            if new_frames > 0:
                log.info(f"  ★★★ writing 0x01 to 0x{addr:04x} produced {new_frames} frames!")
            else:
                log.info(f"  reg 0x{addr:04x} <- 0x01: 0 frames")

        log.info(f"\n=== FINAL FRAME COUNT: {frame_count} ===")

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
