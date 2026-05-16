#!/usr/bin/env python3
"""
Mendi V4 firmware-register brute-force probe.

Stays connected the WHOLE time (no auto-sleep cycles).
Tries multiple meaningful write values on each of the 17 firmware-internal
registers found earlier. After each write, waits briefly and checks if Frame
notifications start streaming.

Found firmware registers (from earlier probe):
  0x41 = 0x010600   unique
  0x43 = 0x000556   array
  0x44 = 0x000556
  0x46 = 0x000556
  0x47 = 0x000556
  0x48 = 0x000556
  0x49 = 0x000556
  0x4A = 0x000556   end of array
  0x4B = 0x00000F   count/version?
  0x4E = 0x000010   unique
  0x50 = 0x000038   unique
  0x52 = 0x0000F8   pair
  0x53 = 0x0000F8
  0x64 = 0x00001A   TRIPLET — likely L/R/Pulse channel state
  0x66 = 0x00001A
  0x68 = 0x00001A
  0x6A = 0x0000FE   end-of-triplet marker?

Most suspicious: 0x64/0x66/0x68 triplet (state for 3 LED channels) and 0x6A.
"""
from __future__ import annotations
import asyncio, logging, struct
from typing import Optional, List, Tuple
from bleak import BleakClient, BleakScanner

SERVICE = "fc3eabb0-c6c4-49e6-922a-6e551c455af5"
FRAME_CHAR = "fc3eabb1-c6c4-49e6-922a-6e551c455af5"
SENSOR_CHAR = "fc3eabb2-c6c4-49e6-922a-6e551c455af5"
ADC_CHAR = "fc3eabb4-c6c4-49e6-922a-6e551c455af5"
CALIB_CHAR = "fc3eabb6-c6c4-49e6-922a-6e551c455af5"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("brute")

frame_count = 0
last_frame_size = 0


def on_frame(_s, data):
    global frame_count, last_frame_size
    frame_count += 1
    last_frame_size = len(data)
    if frame_count <= 3 or frame_count % 31 == 0:
        log.info(f"  ★★★ FRAME #{frame_count}: {len(data)}B {bytes(data).hex()[:60]}")


def on_other(_s, data):
    pass  # quiet


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


# Suspicious firmware registers + values to try
# (addr, current_value)
FIRMWARE_REGS = [
    (0x41, 0x010600),
    (0x43, 0x000556),
    (0x44, 0x000556),
    (0x46, 0x000556),
    (0x47, 0x000556),
    (0x48, 0x000556),
    (0x49, 0x000556),
    (0x4A, 0x000556),
    (0x4B, 0x00000F),
    (0x4E, 0x000010),
    (0x50, 0x000038),
    (0x52, 0x0000F8),
    (0x53, 0x0000F8),
    (0x64, 0x00001A),
    (0x66, 0x00001A),
    (0x68, 0x00001A),
    (0x6A, 0x0000FE),
]


# Values to try writing to each register
def candidate_values(current: int) -> List[int]:
    return [
        current | 0x01,        # set lowest bit (often "enable")
        current | 0x80,        # set high bit
        current ^ 0xFFFFFF,    # bit-flip
        0x000001,              # minimal "on"
        0xFFFFFF,              # all bits
        0x00FFFF,
        0x000080,
        current << 1,          # shift left
        current >> 1,          # shift right
    ]


async def main():
    log.info("Scanning for Mendi (40 sec)...")
    devices = await BleakScanner.discover(timeout=40.0, scanning_mode="active")
    mendi = next((d for d in devices if d.name and "mendi" in d.name.lower()), None)
    if not mendi:
        log.error("No Mendi found.")
        return
    log.info(f"Found Mendi: {mendi.name}")

    async with BleakClient(mendi) as client:
        log.info("Connected. Subscribing...")
        await client.start_notify(FRAME_CHAR, on_frame)
        await client.start_notify(SENSOR_CHAR, on_other)
        await client.start_notify(ADC_CHAR, on_other)
        await client.start_notify(CALIB_CHAR, on_other)

        # Bootstrap AFE first so it's ready to stream
        log.info("Bootstrapping AFE4404 + calibration first...")
        cal = (b"\x0d" + struct.pack("<f", 20.0) +
               b"\x15" + struct.pack("<f", 20.0) +
               b"\x1d" + struct.pack("<f", 20.0) +
               b"\x20\x01")
        await client.write_gatt_char(CALIB_CHAR, cal, response=True)

        afe_init = [
            (0x09, 0x000050), (0x0A, 0x00018F), (0x01, 0x0001E0), (0x02, 0x00031F),
            (0x15, 0x000320), (0x16, 0x00045F), (0x0D, 0x000460), (0x0E, 0x00059F),
            (0x03, 0x0005F0), (0x04, 0x00072F), (0x19, 0x000730), (0x1A, 0x00086F),
            (0x1D, 0x009C3F), (0x22, 0x141414), (0x23, 0x000104), (0x20, 0x008003),
        ]
        for addr, data in afe_init:
            await client.write_gatt_char(SENSOR_CHAR, encode_sensor(False, addr, data), response=True)
        log.info("✓ AFE configured")

        # enable_sensor (kicks the firmware's gate, in case it now responds)
        await client.write_gatt_char(SENSOR_CHAR, encode_sensor(True, 0, 0), response=True)
        await asyncio.sleep(0.5)

        baseline_frames = frame_count
        log.info(f"Baseline frame count: {baseline_frames}")

        # Now brute-force the firmware registers
        log.info(f"\n=== Brute-forcing {len(FIRMWARE_REGS)} firmware regs × ~9 values each ===\n")
        wins: List[Tuple[int, int, int]] = []  # (addr, value, frames_observed)

        for addr, current in FIRMWARE_REGS:
            log.info(f"-- reg 0x{addr:02x} (current=0x{current:06x}) --")
            for val in candidate_values(current):
                before = frame_count
                payload = encode_sensor(False, addr, val)
                try:
                    await client.write_gatt_char(SENSOR_CHAR, payload, response=True)
                except Exception as e:
                    log.debug(f"  write 0x{val:06x} failed: {e}")
                    continue
                await asyncio.sleep(1.5)  # wait + listen for frames
                gained = frame_count - before
                marker = "  ★★★ STREAMING!" if gained >= 5 else ""
                log.info(f"  wrote 0x{val:06x} → +{gained} frames{marker}")
                if gained >= 5:
                    wins.append((addr, val, gained))
                    # Don't bail — keep recording so we know if other writes also work
                # Restore the original value to keep the device consistent
                try:
                    await client.write_gatt_char(SENSOR_CHAR, encode_sensor(False, addr, current), response=True)
                except Exception:
                    pass

        log.info(f"\n=== FINAL: {frame_count} total frames, {len(wins)} winning writes ===")
        for addr, val, n in wins:
            log.info(f"  ★ 0x{addr:02x} = 0x{val:06x} → {n} frames")

        try:
            await client.stop_notify(FRAME_CHAR)
            await client.stop_notify(SENSOR_CHAR)
            await client.stop_notify(ADC_CHAR)
            await client.stop_notify(CALIB_CHAR)
        except Exception:
            pass


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
