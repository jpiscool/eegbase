#!/usr/bin/env bash
# ============================================================
# demo-api-push.sh
# Demonstrates pushing a Mendi fNIRS session into EEGBase via REST API.
#
# Usage:
#   bash scripts/demo-api-push.sh
#
# Prerequisites:
#   - curl (standard on macOS/Linux)
#   - jq    (optional — used for pretty-printing; falls back to raw output)
# ============================================================

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
# Replace these values before running.
BASE_URL="${BASE_URL:-http://localhost:3000}"       # EEGBase instance URL
API_KEY="${API_KEY:-your-clinic-id-here}"           # Clinic ID (used as Bearer token)
CLIENT_ID="${CLIENT_ID:-your-client-uuid-here}"     # Client UUID (must belong to your clinic)
# ──────────────────────────────────────────────────────────────────────────────

# Timestamp for the session start (ISO 8601)
STARTED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Sample data ────────────────────────────────────────────────────────────────
# Representative 10-sample slice from a 2-minute session.
# A full session at 1 sample/sec for 120s would have 120 samples — shown here
# as 10 representative points with the pattern matching real Mendi fNIRS output.
#
# Fields per sample:
#   timestampMs  — ms since session start
#   oxyHbLeft    — μM, oxygenated hemoglobin, left prefrontal
#   oxyHbRight   — μM, oxygenated hemoglobin, right prefrontal
#   deoxyHbLeft  — μM, de-oxygenated Hb, left (typically decreases)
#   deoxyHbRight — μM, de-oxygenated Hb, right
#   rewardScore  — 0–100 composite metric
SAMPLES='[
  { "timestampMs":    0, "oxyHbLeft": 0.021, "oxyHbRight": 0.018, "deoxyHbLeft": -0.010, "deoxyHbRight": -0.012, "rewardScore": 48.2 },
  { "timestampMs": 1000, "oxyHbLeft": 0.033, "oxyHbRight": 0.029, "deoxyHbLeft": -0.014, "deoxyHbRight": -0.017, "rewardScore": 51.4 },
  { "timestampMs": 2000, "oxyHbLeft": 0.045, "oxyHbRight": 0.041, "deoxyHbLeft": -0.019, "deoxyHbRight": -0.022, "rewardScore": 55.8 },
  { "timestampMs": 3000, "oxyHbLeft": 0.052, "oxyHbRight": 0.048, "deoxyHbLeft": -0.023, "deoxyHbRight": -0.026, "rewardScore": 59.1 },
  { "timestampMs": 4000, "oxyHbLeft": 0.061, "oxyHbRight": 0.057, "deoxyHbLeft": -0.028, "deoxyHbRight": -0.031, "rewardScore": 63.4 },
  { "timestampMs": 5000, "oxyHbLeft": 0.070, "oxyHbRight": 0.064, "deoxyHbLeft": -0.031, "deoxyHbRight": -0.035, "rewardScore": 67.0 },
  { "timestampMs": 6000, "oxyHbLeft": 0.068, "oxyHbRight": 0.063, "deoxyHbLeft": -0.030, "deoxyHbRight": -0.034, "rewardScore": 65.8 },
  { "timestampMs": 7000, "oxyHbLeft": 0.074, "oxyHbRight": 0.069, "deoxyHbLeft": -0.033, "deoxyHbRight": -0.038, "rewardScore": 69.3 },
  { "timestampMs": 8000, "oxyHbLeft": 0.079, "oxyHbRight": 0.073, "deoxyHbLeft": -0.035, "deoxyHbRight": -0.041, "rewardScore": 71.5 },
  { "timestampMs": 9000, "oxyHbLeft": 0.082, "oxyHbRight": 0.076, "deoxyHbLeft": -0.037, "deoxyHbRight": -0.043, "rewardScore": 73.1 }
]'
# NOTE: Full 2-minute session (120 samples) would extend timestampMs to 119000.
#       Full 10-minute session (600 samples) would extend to 599000.
#       The EEGBase API accepts up to 50,000 samples per request.

# ── Build request body ─────────────────────────────────────────────────────────
REQUEST_BODY=$(printf '{
  "clientId":        "%s",
  "deviceType":      "mendi",
  "startedAt":       "%s",
  "durationSeconds": 120,
  "samples": %s,
  "preSession":  { "focus": 5, "mood": 6, "anxiety": 5, "energy": 6 },
  "postSession": { "focus": 8, "mood": 8, "anxiety": 3, "energy": 7, "notes": "Demo session via REST API — felt great." },
  "clinicalNotes": "Pushed via demo-api-push.sh. Demonstrates Mendi → EEGBase integration without BLE."
}' "$CLIENT_ID" "$STARTED_AT" "$SAMPLES")

# ── Send request ───────────────────────────────────────────────────────────────
echo ""
echo "EEGBase API Demo Push"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Endpoint : POST ${BASE_URL}/api/v1/sessions"
echo "Client   : ${CLIENT_ID}"
echo "Started  : ${STARTED_AT}"
echo "Samples  : 10 (representative; full session = 120 at 1 Hz)"
echo ""

HTTP_CODE=$(curl -s -o /tmp/eegbase_api_response.json -w "%{http_code}" \
  -X POST "${BASE_URL}/api/v1/sessions" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

RESPONSE=$(cat /tmp/eegbase_api_response.json)

echo "HTTP Status: ${HTTP_CODE}"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "SUCCESS — session created:"
  if command -v jq &>/dev/null; then
    echo "$RESPONSE" | jq .
  else
    echo "$RESPONSE"
  fi
else
  echo "FAILED — server responded:"
  if command -v jq &>/dev/null; then
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  else
    echo "$RESPONSE"
  fi
  exit 1
fi
