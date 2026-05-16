# Mendi BLE protocol — reverse-engineering runbook

**Status:** ✅ **CAPTURED — May 13, 2026** (iPhone 15 Pro Max sysdiagnose path)
**Owner:** John Paul
**Goal:** Document the BLE GATT structure of the Mendi headband well enough to drop concrete UUIDs + a packet decoder into `src/lib/device/mendi.ts` and `src/lib/device/mendi-decoder.ts`.

---

## ✅ Capture results (2026-05-13)

Hardware: Mendi headband BD_ADDR `da:ec:4b:42:3c:75`, advertising name **"Mendi"**.
- **Model:** V4
- **Hardware revision:** r2.1b-ub1
- **Firmware:** 1.0.2
- **FCC ID:** RYYEYSHJN

Captured via iPhone 15 Pro Max sysdiagnose → `bluetoothd-hci-latest.pklg` (3.1 MB).

### GATT topology

The headband exposes **two custom services**:

| Range (handles) | Service UUID | Purpose |
|---|---|---|
| 0x000e – 0x0020 | `f55a451c-556e-2a92-e649-c4c6b0ab3efc` | **Streaming** — high-rate fNIRS data |
| 0x0025 – 0x0034 | `9fa480e0-4967-4542-9390-d343dc5d04ae` | Control / configuration (handshake messages) |

Plus standard services: GAP (0x1800), GATT (0x1801), Device Information (0x180a), Battery (0x180f), Current Time (0x1805), Nordic DFU (0xfe59).

### Streaming characteristic

| Field | Value |
|---|---|
| Characteristic UUID | `f55a451c-556e-2a92-e649-c4c6b1ab3efc` (note last byte `b1`) |
| Handle | 0x0010 |
| Property | Notify (opcode 0x1b) |
| Sample rate | **31.2 Hz** (5,782 packets in 185.6 s) |
| Packet length | ~105 bytes (variable) |
| Encoding | **Protobuf** (Google Protocol Buffers wire format) |

### Control characteristic (handshake)

| Field | Value |
|---|---|
| Characteristic UUID | `4f860002-943b-49ef-bed4-2f730304427a` (handle 0x002a, in `9fa480e0...` service) |
| Pattern | iPhone writes (opcode 0x12) → Mendi indicates (opcode 0x1d) |
| Sibling chars | `4f86000{1,3,4,5}-...` at handles 0x0027/0x002d/0x0030/0x0033 |

The control flow is request/response, used during session setup. Streaming on the `f55a...b1` characteristic begins after this handshake completes.

### Sample packet decoded (protobuf wire format)

First streaming packet (105 bytes):
```
08c90f 10c87d 18cff8ffffffffffffff01 2089feffffffffffffff01 …
```

Decoded protobuf fields:

| Field # | Wire type | Decoded value | Likely meaning |
|---|---|---|---|
|  1 | varint | 1993 | sample/sequence counter |
|  2 | varint | 16072 | raw intensity (channel A?) |
|  3 | varint (signed) | -945 | ΔHb derived value |
|  4 | varint (signed) | -247 | ΔHb derived value |
|  5 | varint (signed) | -1093 | ΔHb derived value |
|  6 | varint (signed) | -892 | ΔHb derived value |
|  7 | **float32** | **23.5** | likely **temperature °C** or **reward score** |
|  8 | varint | 49335 | raw intensity |
|  9 | varint | 19241 | raw intensity |
| 10 | varint (signed) | -1153 | ΔHb derived value |
| 11 | varint | 45551 | raw intensity |
| 12 | varint | 18780 | raw intensity |
| 13 | varint | 4180 | smaller varint (counter? quality?) |
| 14 | varint | 358904 | larger counter / timestamp |
| 15 | varint | 213946 | larger counter / timestamp |
| 16 | varint (signed) | -1187 | ΔHb derived value |

**Mendi sends both raw intensities AND pre-computed Hb deltas in every packet.** No need for us to do Beer-Lambert on the client side — pick the appropriate fields.

### What we still need

To finish the decoder we must determine which protobuf field number maps to:
- ΔHbO left
- ΔHbO right
- ΔHHb left
- ΔHHb right
- Reward / quality score
- Sample timestamp

Approach: capture a 2nd session with a known-cognitive-task interval (serial sevens) and find which fields show the expected positive shift. Mendi's official app session-summary screen also shows the avg/peak reward — we can grep for matching values in the protobuf fields to identify the reward field.

---

## Captures saved

- `~/Desktop/sysdiagnose_2026.05.13_14-47-33-0600_iPhone-OS_iPhone_23E261/logs/Bluetooth/bluetoothd-hci-latest.pklg` — full pklg (3.1 MB)
- `scripts/mendi-capture/captures/baseline-packets.txt` — 200 streaming packets from this session, hex-encoded one per line

---

> Mendi confirmed (May 2026) they do not publish an SDK and that an
> independent BLE integration is the supported model — same approach
> Myndlift took with Muse. We own the entire transport.

---

## What "done" looks like

This document, when complete, contains:

1. **Service UUID** of the Mendi primary GATT service.
2. **Streaming characteristic UUID** that emits notifications during a session.
3. **Optional control characteristic UUID** + the byte sequence written to it to start streaming (if any).
4. **Sample rate (Hz)** measured from inter-packet intervals.
5. **Packet length (bytes)** and **byte structure** (which offsets contain what).
6. **Whether values are pre-computed ΔHbO / ΔHHb** (drop straight into the chart) **or raw light intensities** (run through Beer-Lambert).
7. **Firmware version** of the headband used during capture (record from Mendi app About screen).

When all 7 are documented, the code change is:
- Replace 2 UUID constants in `src/lib/device/mendi.ts`
- Set `MENDI_PROTOCOL_PENDING = false`
- (If raw intensities) flip `MENDI_PACKET_LAYOUT.shape` in `src/lib/device/mendi-decoder.ts` to `"raw-intensity-uint16"`
- (If different byte layout) tweak the decoder methods accordingly

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
