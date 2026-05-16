#!/usr/bin/env python3
"""
Mendi BLE packet decode helper.

Workflow:
  1. Capture two btsnoop logs (baseline + task — see AUDIT-2026-MENDI-BLE-PROTOCOL.md).
  2. In Wireshark: filter `btatt`, find the streaming notification handle,
     copy ≥ 50 consecutive notification payloads (right-click → Copy → Bytes → Hex Stream).
  3. Save them one per line as `baseline-packets.txt` and `task-packets.txt`
     in the same directory as this script.
  4. Run:
       python3 decode-packets.py baseline-packets.txt task-packets.txt

The script tries every plausible byte interpretation and ranks them by
which produces (a) physiologically-plausible values and (b) a difference
between baseline and task that matches expected fNIRS behaviour
(prefrontal HbO higher during cognitive load).

Output: a ranked list of candidate decoders. Pick the top one and
plug it into:
  src/lib/device/mendi-decoder.ts → MENDI_PACKET_LAYOUT
  src/lib/device/mendi.ts          → MENDI_SERVICE_UUID, MENDI_FNIRS_CHAR_UUID
"""

from __future__ import annotations
import argparse
import struct
import sys
from dataclasses import dataclass, field
from statistics import mean, pstdev
from typing import Callable, List, Optional


@dataclass
class Decoder:
    name: str
    fmt: str
    offset: int
    n_floats: int
    desc: str
    decode: Callable[[bytes], Optional[List[float]]] = field(init=False)

    def __post_init__(self):
        size = struct.calcsize(self.fmt)

        def fn(b: bytes) -> Optional[List[float]]:
            if len(b) < self.offset + size:
                return None
            try:
                vals = struct.unpack_from(self.fmt, b, self.offset)
                # Coerce ints to floats so caller can stat them uniformly
                return [float(v) for v in vals]
            except struct.error:
                return None

        self.decode = fn


def hex_to_bytes(line: str) -> Optional[bytes]:
    line = line.strip().replace(" ", "").replace(":", "")
    if not line or any(c not in "0123456789abcdefABCDEF" for c in line):
        return None
    if len(line) % 2 != 0:
        return None
    try:
        return bytes.fromhex(line)
    except ValueError:
        return None


def load_packets(path: str) -> List[bytes]:
    out: List[bytes] = []
    with open(path) as f:
        for line in f:
            b = hex_to_bytes(line)
            if b is not None:
                out.append(b)
    return out


def physiological_score(values: List[List[float]], decoder: Decoder) -> float:
    """
    Heuristic: how plausible are these decoded values as fNIRS readings?
    Returns 0.0 (implausible) to 1.0 (very plausible).
    """
    if not values:
        return 0.0
    n_channels = len(values[0])
    score = 0.0

    # Check each channel column
    for ch in range(n_channels):
        col = [row[ch] for row in values if len(row) > ch]
        if not col:
            continue
        col_mean = mean(col)
        col_std = pstdev(col) if len(col) > 1 else 0.0

        if "raw-intensity" in decoder.desc.lower():
            # Raw uint16 ADC counts — should be 100–65000, varying slowly
            if 100 <= col_mean <= 65000 and col_std > 0:
                score += 1.0
        else:
            # ΔHbO/ΔHHb in μM — typically ±0.5, never > ±5
            if abs(col_mean) < 5 and 1e-6 < col_std < 2.0:
                score += 1.0
            # Reward score column (0–100)
            elif 0 <= col_mean <= 100 and col_std > 0:
                score += 0.5

    return score / n_channels


def task_baseline_diff(
    baseline_values: List[List[float]],
    task_values: List[List[float]],
    decoder: Decoder,
) -> Optional[float]:
    """
    Mean of first 4 channels for task minus baseline. Positive = task
    increased prefrontal activity (expected for serial sevens).
    """
    if not baseline_values or not task_values:
        return None
    n_channels = min(len(baseline_values[0]), len(task_values[0]), 4)
    diffs = []
    for ch in range(n_channels):
        b_col = [row[ch] for row in baseline_values if len(row) > ch]
        t_col = [row[ch] for row in task_values if len(row) > ch]
        if b_col and t_col:
            diffs.append(mean(t_col) - mean(b_col))
    return mean(diffs) if diffs else None


CANDIDATE_DECODERS: List[Decoder] = [
    Decoder("preprocessed-hb-float32-x5", "<5f", 0, 5, "ΔHbO/ΔHHb left+right + reward as float32 LE × 5"),
    Decoder("preprocessed-hb-float32-x4", "<4f", 0, 4, "ΔHbO/ΔHHb left+right as float32 LE × 4"),
    Decoder("preprocessed-hb-float32-x4-after-1byte-seq", "<4f", 1, 4, "1-byte sequence + 4 floats"),
    Decoder("preprocessed-hb-float32-x4-after-2byte-seq", "<4f", 2, 4, "2-byte sequence + 4 floats"),
    Decoder("raw-intensity-uint16-x4", "<4H", 0, 4, "raw-intensity 660+805 nm × 2 sites (uint16 LE)"),
    Decoder("raw-intensity-uint16-x4-after-1byte-seq", "<4H", 1, 4, "1-byte sequence + raw intensities"),
    Decoder("raw-intensity-uint16-x6", "<6H", 0, 6, "raw-intensity uint16 × 6"),
    Decoder("raw-intensity-uint32-x4", "<4I", 0, 4, "raw-intensity 32-bit × 4"),
    Decoder("hb-int16-x4-scaled", "<4h", 0, 4, "ΔHbO/ΔHHb as signed int16 (needs scale factor)"),
]


def main():
    ap = argparse.ArgumentParser(description="Mendi BLE packet decode helper")
    ap.add_argument("baseline_file", help="Path to baseline-packets.txt")
    ap.add_argument("task_file", nargs="?", help="Path to task-packets.txt (optional)")
    ap.add_argument("--show-samples", type=int, default=3,
                    help="Print N decoded sample values per decoder")
    args = ap.parse_args()

    baseline = load_packets(args.baseline_file)
    task = load_packets(args.task_file) if args.task_file else []

    if not baseline:
        print(f"No valid hex packets found in {args.baseline_file}", file=sys.stderr)
        sys.exit(1)

    print(f"Loaded {len(baseline)} baseline packets" + (f" + {len(task)} task packets" if task else ""))
    print(f"Packet length distribution (baseline): "
          f"min={min(len(p) for p in baseline)} max={max(len(p) for p in baseline)} "
          f"median={sorted(len(p) for p in baseline)[len(baseline)//2]}")
    print()

    results = []
    for d in CANDIDATE_DECODERS:
        baseline_decoded = [v for p in baseline if (v := d.decode(p)) is not None]
        task_decoded = [v for p in task if (v := d.decode(p)) is not None] if task else []
        if not baseline_decoded:
            continue

        physio = physiological_score(baseline_decoded, d)
        diff = task_baseline_diff(baseline_decoded, task_decoded, d) if task else None
        results.append((d, physio, diff, baseline_decoded[:args.show_samples]))

    # Rank: physiological score first, then |task-baseline diff| (if computed)
    results.sort(key=lambda r: (r[1], abs(r[2]) if r[2] is not None else 0), reverse=True)

    print(f"{'rank':<5}{'decoder':<46}{'physio':<8}{'task-baseline':<14}sample")
    print("-" * 100)
    for rank, (d, physio, diff, samples) in enumerate(results, 1):
        diff_str = f"{diff:+.4f}" if diff is not None else "n/a"
        sample_str = " ".join(f"{v:.3f}" if abs(v) < 100 else f"{int(v)}" for v in samples[0]) if samples else ""
        marker = " ⭐" if rank == 1 and physio > 0.5 else ""
        print(f"{rank:<5}{d.name:<46}{physio:<8.2f}{diff_str:<14}{sample_str}{marker}")

    print()
    print("⭐ = best candidate. If physio score is ≥ 0.5 AND task-baseline diff is positive,")
    print("   plug this layout into MENDI_PACKET_LAYOUT in src/lib/device/mendi-decoder.ts.")


if __name__ == "__main__":
    main()
