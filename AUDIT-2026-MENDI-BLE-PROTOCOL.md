# Mendi BLE protocol — reverse-engineering runbook

**Status:** ✅ **RESOLVED — May 16, 2026.** Protocol decoded, schema cross-validated against the public `eugenehp/mendi` Rust crate (independent reverse-engineering of the same V4 firmware). UUIDs and field mappings are live in `src/lib/device/mendi.ts` and `src/lib/device/mendi-decoder.ts`; `MENDI_PROTOCOL_PENDING = false`.

**Owner:** John Paul
**Goal:** Document the BLE GATT structure of the Mendi headband well enough to drop concrete UUIDs + a packet decoder into `src/lib/device/mendi.ts` and `src/lib/device/mendi-decoder.ts`.

---

## ✅ Final values (2026-05-13 capture → 2026-05-16 schema lock)

Hardware: Mendi headband BD_ADDR `da:ec:4b:42:3c:75`, advertising name **"Mendi"**.
- **Model:** V4
- **Hardware revision:** r2.1b-ub1
- **Firmware:** 1.0.2
- **FCC ID:** RYYEYSHJN

Captured via iPhone 15 Pro Max sysdiagnose → `bluetoothd-hci-latest.pklg` (3.1 MB).

### GATT topology

The headband exposes a **single custom primary service** with six functional characteristics. The initial capture log showed the UUIDs byte-reversed because Wireshark displays 128-bit UUIDs in little-endian; the canonical big-endian values are below.

| Short | UUID | Purpose | Wired in code? |
|---|---|---|---|
| `0xABB0` | `fc3eabb0-c6c4-49e6-922a-6e551c455af5` | **Primary service** | yes (`MENDI_SERVICE_UUID`) |
| `0xABB1` | `fc3eabb1-c6c4-49e6-922a-6e551c455af5` | **Frame** — fNIRS stream (notify, ~31 Hz protobuf) | yes (`MENDI_FNIRS_CHAR_UUID`) |
| `0xABB2` | `fc3eabb2-c6c4-49e6-922a-6e551c455af5` | **Sensor** — write/notify; handshake required before Frame begins | yes (`MENDI_SENSOR_CHAR_UUID`) |
| `0xABB3` | `fc3eabb3-c6c4-49e6-922a-6e551c455af5` | **Imu** — register-level IMU access | no |
| `0xABB4` | `fc3eabb4-c6c4-49e6-922a-6e551c455af5` | **Adc** — battery voltage / charging / USB | no |
| `0xABB5` | `fc3eabb5-c6c4-49e6-922a-6e551c455af5` | **Diagnostics** — IMU/sensor self-test, power-on ADC | no |
| `0xABB6` | `fc3eabb6-c6c4-49e6-922a-6e551c455af5` | **Calibration** — per-channel offset, low-power toggle | no |

Plus standard services: GAP (0x1800), GATT (0x1801), Device Information (0x180a), Battery (0x180f), Current Time (0x1805), Nordic DFU (0xfe59).

### Frame characteristic (the streaming one)

| Field | Value |
|---|---|
| Characteristic UUID | `fc3eabb1-c6c4-49e6-922a-6e551c455af5` |
| Property | Notify |
| Sample rate | **31.2 Hz** (5,782 packets in 185.6 s) |
| Packet length | ~105 bytes (variable — proto3 omits zero-valued fields) |
| Encoding | **Protobuf** wire format, schema `mendi.Frame` (see below) |

### Sensor characteristic (the handshake one)

Mendi V4 firmware requires a write to the Sensor characteristic before Frame notifications begin. The payload is a `mendi.Sensor` message with `{ read: true, address: 0, data: 0 }`, which serialises to the byte string `08 01 10 00 18 00`. This is what `MendiAdapter.connect()` writes after subscribing to Frame.

### `mendi.Frame` schema (source-of-truth: `eugenehp/mendi/proto/device_v4.proto`)

```protobuf
message Frame {
  int32 acc_x = 1;   // Accelerometer X, int16 LSB at ±2g range (16384 LSB = 1g)
  int32 acc_y = 2;
  int32 acc_z = 3;
  int32 ang_x = 4;   // Gyroscope X, int16 LSB at ±125 dps
  int32 ang_y = 5;
  int32 ang_z = 6;
  float temp  = 7;   // Skin/scalp temperature in °C
  int32 ir_l  = 8;   // Infrared (940 nm), left optode raw photodiode count
  int32 red_l = 9;   // Red (660 nm), left optode
  int32 amb_l = 10;  // Ambient (LED off), left optode — for noise correction
  int32 ir_r  = 11;  // right optode
  int32 red_r = 12;
  int32 amb_r = 13;
  int32 ir_p  = 14;  // pulse / forehead optode
  int32 red_p = 15;
  int32 amb_p = 16;
}
```

All fields are proto3-optional. Negative int32 values appear as 10-byte sign-extended varints on the wire (e.g. `cff8ffffffffffffff01` = −945). The decoder in `mendi-decoder.ts` reassembles those via `combineHiLoSigned()`.

### Worked example — packet 0 (105 bytes, 2026-05-13 baseline)

```
08c90f 10c87d 18cff8ffffffffffffff01 …
```

| # | Field | Decoded | Sanity |
|---|---|---|---|
| 1 | acc_x | 1993 | small motion at rest |
| 2 | acc_y | 16072 | 0.98 g — gravity on this axis (headband upright on head) ✓ |
| 3 | acc_z | −945 | small |
| 4–6 | ang_x/y/z | −247, −1093, −892 | small gyro values at rest ✓ |
| 7 | temp | **23.5 °C** | physiologically plausible scalp temp ✓ |
| 8 | ir_l | 49335 | raw photodiode count |
| 9 | red_l | 19241 | raw photodiode count |
| 10 | amb_l | −1153 | ambient (signed; per-optode bias) |
| 11 | ir_r | 45551 | |
| 12 | red_r | 18780 | |
| 13 | amb_r | 4180 | (positive on this optode) |
| 14 | ir_p | 358904 | pulse optode runs ~7× hotter |
| 15 | red_p | 213946 | |
| 16 | amb_p | −1187 | |

### Stats across 200 baseline packets

- acc_y mean **16036 ± 135** → 0.979 g (gravity, head upright) ✓
- temp mean **23.53 ± 0.07 °C** ✓
- All optical channels stable within ±3 % at rest, consistent with raw photodiode counts ✓
- No field is monotonic — there is **no packet sequence counter or timestamp in the wire format**. Frame ordering relies on BLE link-layer ordering + the local receive timestamp.

### Important: Mendi sends raw photodiode counts only

Earlier in this audit we hypothesised that fields 3–6 / 10 / 16 carried pre-computed ΔHb deltas (because they were negative signed varints). The eugenehp `.proto` schema disconfirms that: fields 3–6 are accel-z / gyro-x/y/z (which happen to be small signed values at rest), and fields 10/16 are `amb_l`/`amb_p` (ambient LED-off readings — sometimes negative due to per-optode DC bias).

**Beer-Lambert must run client-side.** `MendiPacketDecoder.decode()` computes a unitless ΔHbO/ΔHHb proxy from `red - amb` and `ir - amb` ratios against a per-session baseline — see `mendi-decoder.ts:104-127`. The proxy is monotonic with true ΔHbO but is **not in μM**; calibration to real μM is a future task and would need the `Calibration` characteristic (`0xABB6`) and per-wavelength extinction coefficients.

---

## Captures saved

- `~/Desktop/sysdiagnose_2026.05.13_14-47-33-0600_iPhone-OS_iPhone_23E261/logs/Bluetooth/bluetoothd-hci-latest.pklg` — full pklg (3.1 MB)
- `scripts/mendi-capture/captures/baseline-packets.txt` — 200 streaming packets from this session, hex-encoded one per line

---

> Mendi confirmed (May 2026) they do not publish an SDK and that an
> independent BLE integration is the supported model — same approach
> Myndlift took with Muse. We own the entire transport.

---

## What "done" looks like — checklist

All seven items are now resolved (✅) for V4 firmware 1.0.2:

1. ✅ **Service UUID** — `fc3eabb0-c6c4-49e6-922a-6e551c455af5`
2. ✅ **Streaming characteristic UUID** — `fc3eabb1-c6c4-49e6-922a-6e551c455af5` (Frame, notify)
3. ✅ **Handshake characteristic + bytes** — `fc3eabb2-c6c4-49e6-922a-6e551c455af5` (Sensor), write `08 01 10 00 18 00`
4. ✅ **Sample rate** — 31.2 Hz
5. ✅ **Packet structure** — protobuf `mendi.Frame`, ~105 bytes
6. ✅ **Pre-computed vs raw** — raw photodiode counts; Beer-Lambert client-side
7. ✅ **Firmware** — 1.0.2

The remaining work is hardware validation (`scripts/mendi-capture/validation-runbook.md`), not protocol work. If the firmware version changes, re-run Steps 1–5 below.

---

## Step 1 — Tools (iPhone + Mac path — primary)

You only need an iPhone (any model running iOS 15+) and a Mac.

- **iPhone** with the Mendi consumer app installed and paired with the headband.
- **Mac** (Apple Silicon or Intel) with Wireshark ≥ 4.0 installed:
  ```bash
  brew install --cask wireshark
  ```
- **Apple Bluetooth Logging configuration profile** — free, official Apple-signed profile that turns on the kernel-level BLE packet logger inside iOS. You install it once on the iPhone.
  - Download page (signed in with your Apple ID): <https://developer.apple.com/bug-reporting/profiles-and-logs/?platform=ios>
  - On the page, click **Bluetooth** under "Logging Profiles for iOS". Tap the `.mobileconfig` to download. Settings → General → VPN & Device Management → install the profile, then reboot the iPhone.

> If you don't want to enrol an iPhone in a developer profile, the alternative is **macOS PacketLogger.app** (comes with Apple's free *Additional Tools for Xcode* download — no developer account needed). It sniffs BLE from the Mac while the iPhone runs the Mendi app nearby. Less reliable than the iPhone-native log because it captures only what the Mac's antenna sees, but workable if you stay within ~1 m of the Mac during the session. Steps are similar — open PacketLogger, hit record, run the session in the Mendi app, stop, save the `.pklg` (which Wireshark opens directly).

The earlier Android HCI snoop path also works if you ever borrow an Android phone — leaving as fallback at the bottom of this doc.

---

## Step 2 — Verify the Apple BLE logging profile is active

After installing the profile and rebooting the iPhone:

1. Open Settings → Privacy & Security → Analytics & Improvements → Analytics Data.
2. Trigger a fresh sysdiagnose: hold **Volume Up + Volume Down + Side button** for ~1 second, release. (You won't get a confirmation flash — that's normal.)
3. Wait ~5 minutes for it to finish, then scroll the Analytics Data list. A new entry `sysdiagnose_<timestamp>.tar.gz` should appear.
4. AirDrop that file to your Mac — extract it. Inside, look for `bluetoothd_log.pcap` (or `bluetoothd-*.pcap`). If it's there with non-zero size, the profile is working.

(If `bluetoothd_log.pcap` is missing, the profile didn't install correctly — re-install and reboot.)

---

## Step 3 — Capture two reference sessions

You want two sessions because comparing them tells you which bytes carry the signal vs. which are constant headers.

### Capture A — quiet baseline

1. Close every Bluetooth-using app on the iPhone.
2. Open the Mendi app, start a session.
3. **Sit completely still with eyes open for 60 seconds.**
4. Stop the session.
5. Trigger a sysdiagnose (Volume Up + Volume Down + Side button, ~1 s).
6. Wait 5 minutes.
7. Settings → Privacy & Security → Analytics & Improvements → Analytics Data → find the newest `sysdiagnose_<timestamp>.tar.gz`.
8. AirDrop to Mac → extract → grab `bluetoothd_log.pcap`. Save as `baseline.pcap` in `~/Desktop/mendi-capture/`.

### Capture B — task condition

Repeat with one change at step 3: instead of sitting still, **do serial sevens in your head** (start at 1000 and subtract 7 over and over). This reliably raises prefrontal HbO and gives a clean activation signal. Save as `task.pcap`.

Also record from the Mendi app's session-summary screen:
- Avg / max reward
- Session duration
- Firmware version (Mendi app → Settings → About)

---

## Step 4 — Decode in Wireshark

1. Open `baseline.pcap` in Wireshark. (Apple's `.pcap` file is auto-detected as Bluetooth HCI H4 — same dissector as Android btsnoop.)
2. Apply filter: `btatt`
3. Find the GATT discovery phase (right at the start, after `LE Connection Complete`):
   - **`Read By Group Type Response`** packets list every primary service UUID. The Mendi service will be a 128-bit UUID **not** in the standard Bluetooth assigned numbers list. Note it.
   - **`Read By Type Response`** lists characteristics. The streaming characteristic is the one with the `Notify` property AND that subsequently emits a stream of `Handle Value Notification` packets. Note its handle and UUID.
4. Look at the notifications themselves:
   - Packet rate: select 50 consecutive notifications → look at "Time" delta. Mendi targets ~10 Hz so expect ~100 ms.
   - Payload length: select a notification → "Bluetooth Attribute Protocol" → "Value" length. Should be constant.
   - Right-click a notification → **Copy → Bytes → Hex Stream**. Save 50 consecutive hex strings to `baseline-packets.txt`, one per line.
5. Also look just before the first notification: did the Mendi app **write** any bytes to a different characteristic? If yes, that's the start-streaming command. Note:
   - Control characteristic UUID
   - Bytes written
6. Repeat steps 4–5 for `task.btsnoop` → `task-packets.txt`.

---

## Step 5 — Decode the packet structure

1. Open both `baseline-packets.txt` and `task-packets.txt` in a Jupyter notebook (or Python REPL).
2. For each candidate byte interpretation, decode all packets and check whether the values:
   - Lie in physiological range
   - Differ between baseline and task in a sensible direction (HbO higher in task)

### Try interpretations in this order

```python
import struct

# Each line of packets.txt is a hex string from one notification
def parse(packets, fmt, offset=0):
    return [struct.unpack_from(fmt, bytes.fromhex(p), offset) for p in packets]

# A) Pre-computed Hb concentrations as float32 LE × 5
parse(packets, '<5f')
# Expect first 4 values in range ~ -0.5 to +0.5 (μM ΔHb), 5th in 0–100 (reward)

# B) Pre-computed Hb concentrations as float32 LE × 4
parse(packets, '<4f')

# C) Raw intensities as uint16 LE × 4
parse(packets, '<4H')
# Expect values 0–4095 (12-bit ADC) or 0–65535 (16-bit). Should drift slowly.

# D) Mixed: 1-byte sequence counter + 4 floats
parse(packets, '<B4f', offset=0)
```

If interpretation A or B works, the Mendi headband does Beer-Lambert on-device and we use `shape: "preprocessed-hb-float32"`.

If interpretation C works, we need to do Beer-Lambert ourselves with `shape: "raw-intensity-uint16"`.

### Validation checklist

- [ ] Decoded values are finite (no NaN)
- [ ] Decoded values lie in physiological range (HbO/HHb in ~ ±1 μM, raw intensity in 0–65535)
- [ ] Mean of `task` decoded HbO > mean of `baseline` decoded HbO by ≥ 0.05 μM
- [ ] Reward score (if present) correlates with what the Mendi app showed at session end

---

## Step 6 — Document findings here

Once Steps 1–5 pass, fill in the values below.

```
SERVICE_UUID: <128-bit UUID>
STREAMING_CHAR_UUID: <128-bit UUID>
CONTROL_CHAR_UUID: <128-bit UUID or null>
START_STREAMING_BYTES: <hex string or null>
SAMPLE_RATE_HZ: <number>
PACKET_LENGTH_BYTES: <number>
PACKET_SHAPE: preprocessed-hb-float32 | raw-intensity-uint16
PACKET_LAYOUT:
  bytes 0–N: <description>
  ...
FIRMWARE_VERSION: <string>
CAPTURE_DATE: <YYYY-MM-DD>
```

---

## Step 7 — Apply to the codebase

Three small edits:

1. **`src/lib/device/mendi.ts`**
   - Replace `MENDI_SERVICE_UUID` and `MENDI_FNIRS_CHAR_UUID` with values from Step 6
   - If a control char + start command exists, set `MENDI_CONTROL_CHAR_UUID` and `MENDI_START_STREAMING_BYTES`
   - Set `MENDI_PROTOCOL_PENDING = false`

2. **`src/lib/device/mendi-decoder.ts`**
   - Update `MENDI_PACKET_LAYOUT` to match: set `shape`, `minBytes`, optional `sequenceOffset`
   - If the layout is non-default, edit `_decodePreprocessed()` or `_decodeRawIntensity()` byte offsets

3. **`src/lib/device/mendi-decoder.test.ts`**
   - Populate the `REAL_FIXTURES` array (currently `describe.skip`) with 5–10 real captured packets and their expected decoded values. Remove `.skip`.

Then proceed to the Phase 4 hardware-validation runbook (`scripts/mendi-capture/validation-runbook.md`).

---

## Risks (in priority order)

1. **BLE link is encrypted / requires bonding.** If the snoop shows `Pairing Request` / `Pairing Response` SMP packets right at the start, the link is encrypted. Mitigations:
   - Bond the laptop to the headband once (Web Bluetooth handles this in `requestDevice`); the OS keystore stores the LTK and reuses it.
   - If a vendor-specific auth challenge appears (write to a non-data characteristic right after pairing), record those exact bytes — we can replay them verbatim.
2. **Mendi rotates UUIDs per firmware version.** Record firmware version with each capture; document in this file. If it changes, re-capture.
3. **Mendi consumer app holding the connection.** BLE peripherals only allow one master. Always close the Mendi app before testing the EEGBase adapter.
4. **iOS Safari has no Web Bluetooth.** Documented; users on iOS will need the (forthcoming) native iOS app.

---

## Appendix A — Android HCI snoop log (alternative path)

Use if you have access to an Android phone. Otherwise the iPhone path above is the recommended approach.

1. Settings → About phone → tap **Build Number** seven times → unlock Developer Options.
2. Developer Options → enable **"USB debugging"** AND **"Enable Bluetooth HCI snoop log"**.
3. Toggle Bluetooth OFF then ON to start a fresh log.
4. Plug into Mac → run a Mendi session for 60 seconds.
5. `adb bugreport ~/Desktop/mendi-capture/bugreport-baseline.zip` — unzip — file is at `FS/data/misc/bluetooth/logs/btsnoop_hci.log`. Save as `baseline.btsnoop`.
6. Repeat for the task condition → `task.btsnoop`.

Wireshark opens both `.btsnoop` and `.pcap` with the same dissector. From Step 4 onward the procedure is identical.

---

## Appendix B — nRF52840 USB dongle (gold standard, ~$50)

Use if you ever need reproducible captures or the iPhone path proves flaky.

- Order an **nRF52840 Dongle** from Nordic (or DigiKey). ~$10 hardware, ~$50 with shipping in small qty.
- Flash with Nordic's "nRF Sniffer for Bluetooth LE" firmware (free, signed image).
- Install the Wireshark nRF Sniffer extcap plugin.
- The dongle becomes a passive third-party observer — captures the iPhone↔Mendi traffic without participating in the connection.
- More reliable than capturing on the master device because you never lose packets to driver scheduling.

This is what professional BLE reverse-engineers use. Worth the $50 if the iPhone sysdiagnose path turns out to be lossy.
