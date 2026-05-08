# Post-call: Mendi BLE swap checklist

Run through this **after** the May 11 call once you have the actual Mendi SDK info from Mustafa. Total time: ~15 minutes if their protocol matches the float32 assumption, ~45 minutes if it doesn't.

---

## What you need from Mustafa during the call

Capture these in your notes (don't trust memory):

1. **`MENDI_SERVICE_UUID`** — the GATT service UUID for the fNIRS data stream.
2. **`MENDI_FNIRS_CHAR_UUID`** — the characteristic UUID exposing the sample notifications.
3. **Sample binary layout** — confirm or correct each field:
   - Byte offset for `oxyHb left` (current assumption: 0, float32 LE, μM)
   - Byte offset for `oxyHb right` (current: 4, float32 LE, μM)
   - Byte offset for `deoxyHb left` (current: 8, float32 LE, μM)
   - Byte offset for `deoxyHb right` (current: 12, float32 LE, μM)
   - Byte offset for `reward score` (current: 16, float32 LE, 0–100)
   - Total packet size (current: 20 bytes)
   - Endianness (current: little-endian)
4. **Sample rate** — confirm 10 Hz or correct value.
5. **Optional: SDK availability** — if Mendi ships a JS SDK, ask whether to call it directly instead of WebBluetooth.

---

## The swap (3-step happy path)

Assuming binary layout matches current assumption:

### Step 1 — Edit `src/lib/device/mendi.ts`

```diff
- export const MENDI_SDK_PENDING = true;
- const MENDI_SERVICE_UUID = "00001234-0000-1000-8000-00805f9b34fb";
- const MENDI_FNIRS_CHAR_UUID = "00001235-0000-1000-8000-00805f9b34fb";
+ export const MENDI_SDK_PENDING = false;
+ const MENDI_SERVICE_UUID = "<value from Mustafa>";
+ const MENDI_FNIRS_CHAR_UUID = "<value from Mustafa>";
```

### Step 2 — Verify no other code needs updating

```bash
grep -rn "MENDI_SDK_PENDING" src
```

The flag is referenced in only one place (`mendi.ts` line 56 — a guard that throws a friendly error if someone tries to use the adapter before swap). When `MENDI_SDK_PENDING = false`, the guard simply turns off and the real BLE connection runs.

### Step 3 — Test with a real device

```bash
npm run build && npm start
# Open the demo, click "Connect Mendi", complete pairing, watch live signal
```

If signal looks reasonable (oxyHb in expected μM range, samples arriving ~every 100 ms), you're done.

---

## Falling back if binary layout differs

If the packet layout Mustafa describes differs from the float32 assumption, replace the body of `_parse()` (around line 136 of `mendi.ts`).

Common variants to be ready for:

| Variant | Implementation |
|---|---|
| **int16 instead of float32** | `view.getInt16(offset, /*littleEndian*/ true) / SCALE_FACTOR` — get the SCALE_FACTOR from Mustafa |
| **Different byte order** | Pass `false` (big-endian) as second arg to `getFloat32` / `getInt16` |
| **Multi-sample packets** | Wrap the read logic in a `for` loop and emit one DeviceSample per inner record |
| **Header / footer bytes** | Skip them by adding a byte offset before the first read |
| **CRC checksum at end** | Discard the last 1–2 bytes; optionally verify in a debug build |

Keep the existing public shape — `MendiAdapter` returns `DeviceSample` objects with the same fields. Everything downstream (live charts, session storage, AI insights) works unchanged.

---

## Validation script (run before declaring "done")

```bash
cd /Users/johnpaultraugott/Desktop/eegbase
npm run build         # must compile cleanly
npm test              # if any device-adapter tests exist
grep -rn "PLACEHOLDER\|TBD\|placeholder UUID" src/lib/device/  # should return 0
```

Then capture a 60-second live recording with the real Mendi headband on, confirm the chart traces look sane (no constant zeros, no NaNs, no obviously-wrong scale), and mark the task done in `eegbase.md`'s "Pending Post-May 11 Tasks" section.

---

## Documentation updates after successful swap

1. `src/lib/device/mendi.ts` lines 4 and 13 — remove "PLACEHOLDER" / "TBD" warnings, replace with a one-line "Verified against Mendi SDK [version] on [date]".
2. `eegbase.md` (memory file) — strike "placeholder BLE UUIDs (pending May 11 call)" and replace with "Mendi BLE swap landed [date]".
3. `EEGBase-Audit-2026-MAY-Applied.md` "Known outstanding" — remove the Mendi BLE bullet.
4. Run `node mendi-pitch/build-deck.js` if any pitch claims about Mendi integration status need to flip from "beta" to "shipping".

---

## What to NOT do post-call

- ❌ Don't push a "real Mendi data" build to production until you have at least one validated session recording. The simulator path stays as the safe default in case BLE pairing fails.
- ❌ Don't change the `DeviceSample` interface in `adapter.ts` — that ripples into 8+ files downstream. If Mendi's data has new fields you want to surface, add optional fields, never replace existing ones.
- ❌ Don't delete the `simulator.ts` adapter. It's the demo path and the offline-test path. It stays forever.
