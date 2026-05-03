# EEGBase

An open-source, self-hosted neurofeedback practice management platform for licensed clinicians. Built with Next.js 15 App Router, PostgreSQL (Drizzle ORM), and WebBluetooth.

---

## Features

- **Live session streaming** — Real-time fNIRS and EEG data via WebBluetooth (Mendi, Muse 2/S, simulator)
- **Animated reward gauge** — Arc gauge with color-coded zones; audio feedback when score exceeds threshold
- **Session analytics** — OxyHb/DeoxyHb trends, EEG band power charts, reward score replay
- **AI clinical insight** — Claude-powered session summaries from neurophysiological data
- **Pre/post questionnaires** — Focus, mood, anxiety, energy tracking every session
- **Client management** — Protocol assignment, weekly heatmap, check-in history, messaging
- **Progress reports** — Printable clinical reports with AI insight block
- **Session comparison** — Side-by-side overlay of any two sessions
- **REST ingestion API** — `POST /api/v1/sessions` for external tools
- **Protocol presets** — Evidence-based presets for Mendi and Muse devices
- **Self-hosted & private** — Patient data never leaves your servers

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/trainbase/eegbase
cd eegbase
npm install
```

### 2. Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL and AUTH_SECRET
```

### 3. Database

```bash
# Create tables
npm run db:migrate

# Create your clinic and clinician account
npm run seed

# Load demo clients, sessions, and realistic fNIRS/EEG data (~22k samples)
npm run seed:demo
```

### 4. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## Device Support

| Device | Protocol | Status |
|--------|----------|--------|
| **Mendi** fNIRS headband | WebBluetooth GATT | Integrated (UUIDs pending SDK call) |
| **Muse 2 / Muse S** | WebBluetooth GATT | Integrated (muse-lsl protocol, 256-pt FFT) |
| Simulator | — | Built-in, no hardware needed |

> **Note:** WebBluetooth requires Chrome or Edge on desktop. iOS Safari is not supported.

### Mendi BLE Integration

The adapter is in `src/lib/device/mendi.ts`. Placeholder GATT UUIDs are used until SDK access is confirmed. Replace `MENDI_SERVICE_UUID` and `MENDI_FNIRS_CHAR_UUID` with the real values. If Mendi exposes a JS SDK, swap the `connect()` body and keep the `DeviceSample` output shape unchanged.

---

## REST API

```
POST /api/v1/sessions
Authorization: Bearer <your-clinic-id>
Content-Type: application/json
```

Returns `{ "sessionId": "uuid" }`. Your Clinic ID (API key) is shown on the Settings page.

---

## Stack

- **Next.js 15** App Router (React 19)
- **PostgreSQL** via Drizzle ORM
- **NextAuth.js** v5 (credentials)
- **Tailwind CSS**
- **Anthropic Claude API** (optional, for AI session insights)
- **Web Bluetooth API** (Chrome/Edge desktop)
- **Web Audio API** (audio neurofeedback)

---

## License

MIT
