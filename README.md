# 🛡️ RakshaSetu (રક્ષા સેતુ / रक्षा सेतु)
### Real-Time Scam Call Detector for Indian Elders Powered by Google Gemini Live API

> **Goal:** Play a pre-recorded phone call (`.wav`). While the call is still playing, the application listens, detects Indian scam patterns ("digital arrest", fake bank KYC, fake courier customs, OTP extortion), and displays a prominent warning that highlights exact red flag quotes and explains the risk in simple colloquial **Gujarati** or **Hindi**. Genuine calls remain strictly **Safe** with no false alarms.

---

## 🌟 Key Features

1. **Client-to-Server Gemini Live API Architecture**:
   - **Backend Token Server:** Creates short-lived ephemeral session tokens using `ai.authTokens.create()` scoped strictly to the live model, system prompt, and security tool. No master `GEMINI_API_KEY` is ever exposed to the client browser.
   - **Bidirectional WebSocket Streaming:** The browser connects directly to Google Gemini Live API (`gemini-3.8-live`) via `@google/genai` WebSocket.
   - **Real-Time Linear PCM Audio Streaming:** Audio is played through speakers for the user to hear, while simultaneously being downsampled via Web Audio API to **16 kHz mono 16-bit PCM** and streamed in **~100 ms frames** via `session.sendRealtimeInput()`.
   - **Chunk Boundary Control (~5 s):** Automatic server-side VAD is disabled (`automaticActivityDetection: { disabled: true }`). The client dispatches explicit `activityStart` and `activityEnd` control signals so Gemini evaluates the call incrementally mid-speech.
   - **Live Audio Transcription:** Employs `inputAudioTranscription` to stream real-time speech-to-text transcripts of the caller.

2. **Scam Detection Engine (`gemini-3.8-live` + Tool `report_call_risk`)**:
   - **Silent Call Monitor:** Gemini never talks back to the caller; it analyzes speech semantics and calls `report_call_risk`.
   - **Tool Schema Output:**
     - `risk_level`: `SAFE` | `SUSPICIOUS` | `SCAM`
     - `score`: `0` to `100`
     - `red_flags`: array of `{ type, evidence }`
     - `reason_gu` & `reason_hi`: simple elder explanations
     - `advice_gu` & `advice_hi`: direct actionable safety advice
   - **8 Specialized Red Flag Categories**:
     - `AUTHORITY_IMPERSONATION`: Police, CBI, ED, RBI, SBI, Telecom Dept, Supreme Court
     - `THREAT_ARREST`: Fake "Digital Arrest", illegal warrants, non-bailable FIRs
     - `URGENCY`: Artificial panic ("account blocked in 2 hours", "police raid in 10 mins")
     - `OTP_REQUEST`: Extortion of 6-digit SMS OTP (Critical flag)
     - `MONEY_TRANSFER`: Demands for "verification" or "clearance" deposit to UPI/accounts
     - `SECRECY_ISOLATION`: Forcing victim into a closed room, prohibiting telling family
     - `REMOTE_APP`: Demanding installation of AnyDesk, TeamViewer, QuickSupport
     - `PERSONAL_DATA`: Extraction of Aadhaar, PAN card, or debit card credentials
   - **Browser-Side Risk Latching Rules**:
     - Flag **SCAM** only if `score >= 70` AND `2+ distinct red flags` (or a critical flag like `OTP_REQUEST`).
     - **Latching / Hysteresis:** Once a call is flagged as `SCAM`, it stays `SCAM` for the remainder of the call.
     - **Zero False Alarms:** A genuine conversation stays strictly `SAFE` (score 0–15).

3. **Elder-Friendly Indian UI & Speech Warnings**:
   - **Elder Mode:** Large text, high-contrast borders, bold typography, panic-free clear action instructions.
   - **Language Toggle:** Instant switching between **ગુજરાતી (Gujarati)**, **हिंदी (Hindi)**, and **English**.
   - **Risk Meter:** Visual speedometer gauge transitioning dynamically from Green (Safe) → Amber (Suspicious) → Red (Scam Alert).
   - **Red-Flag Chips:** Badges detailing the flag category alongside the **exact quoted phrase heard from the caller**.
   - **Full-Screen Emergency Alert:** Triggers immediately upon scam latching with flashing warning, simple Gujarati/Hindi explanation, and a giant **"HANG UP NOW / ફોન કાપો / फोन काटें"** button that kills audio immediately.
   - **Audio Alert (Spoken Aloud):** Browser speaks the warning aloud in Gujarati or Hindi so elders who cannot read small screens hear a loud, clear verbal alert.

4. **Demo Calls & Multi-Speaker TTS (`gemini-3.8-flash-tts`)**:
   - Built-in demo calls:
     1. 🚨 **Digital Arrest Scam** (Hindi) — Fake Mumbai Crime Branch/CBI narcotics threat and demand for ₹50,000 RBI transfer.
     2. 🚨 **Fake Bank KYC Scam** (Gujarati) — Fake SBI customer manager threatening account closure and demanding OTP.
     3. 🚨 **Fake Courier Customs Scam** (Hinglish) — FedEx parcel seized with contraband and demand for clearance penalty.
     4. 🟢 **Genuine Family Call** (Gujarati) — Mother and son discussing Diwali sweets (mohanthal and sukhdi) and family visit.
   - Offline pre-recorded audio ready to play immediately, plus script `npm run generate-audio` to generate multi-speaker neural dialogue using `gemini-3.8-flash-tts`.
   - Custom `.wav` / `.mp3` file upload support.

5. **Dual-Mode Fallback Architecture**:
   - If the Live API WebSocket connection encounters issues, the frontend automatically falls back to sending rolling 5-second chunks to `gemini-3.8-flash` via `POST /api/analyze-chunk` with structured JSON output while preserving the exact same UI experience.

---

## 📁 Repository Structure

```
garbathon/
├── package.json              # Unified dependencies & scripts
├── vite.config.ts            # Vite bundler & backend API proxy configuration
├── tsconfig.json             # TypeScript compiler settings
├── index.html                # App entrypoint with Gujarati & Devanagari webfonts
├── Dockerfile                # Multi-stage production build for Cloud Run
├── .dockerignore
├── .env.example              # Environment variables template
├── .env                      # Local configuration
├── server/
│   ├── server.js             # Express server: /api/token, /api/analyze-chunk, /api/demo-calls
│   ├── scamDetectorPrompt.js # System instructions & report_call_risk tool definition
│   └── generateDemos.js      # gemini-3.8-flash-tts multi-speaker audio generator
├── src/
│   ├── main.tsx              # React mounting root
│   ├── App.tsx               # Main dashboard controller
│   ├── index.css             # Elder-friendly styling, animated gauge, modal styles
│   ├── types/
│   │   └── scam.ts           # Types for Red Flags, Risk Levels, and Demos
│   ├── translations/
│   │   └── i18n.ts           # Gujarati, Hindi, and English dictionaries
│   ├── live/
│   │   ├── riskEngine.ts     # Browser-side latching risk rules engine
│   │   ├── geminiLiveClient.ts # @google/genai WebSocket Live API client
│   │   └── fallbackDetector.ts # Rolling 5s chunk analyzer & offline simulator
│   ├── audio/
│   │   └── audioStreamer.ts  # Web Audio player, 16kHz PCM downsampler, 100ms slicer
│   └── components/
│       ├── Navbar.tsx        # Brand, status, Elder mode, language switcher
│       ├── CallPicker.tsx    # 4 phone calls picker + custom file upload
│       ├── AudioVisualizer.tsx # Waveform visualizer & playback controls
│       ├── RiskMeter.tsx     # Speedometer gauge with smooth angle transitions
│       ├── RedFlagChips.tsx  # Red flag badges with exact caller quotes
│       ├── LiveTranscript.tsx# Streaming speech-to-text transcript box
│       ├── ScamAlertModal.tsx# High-contrast emergency modal + text-to-speech
│       └── ApiKeyModal.tsx   # In-app Gemini API key & Cloud configuration
└── public/
    └── audio/
        ├── scam_digital_arrest.wav
        ├── scam_fake_kyc.wav
        ├── scam_courier.wav
        └── genuine_call.wav
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Configure Environment
Set your API key in `.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8080
LIVE_MODEL=gemini-3.8-live
FALLBACK_MODEL=gemini-3.8-flash
TTS_MODEL=gemini-3.8-flash-tts
```
*(Note: If no API key is provided, the application runs in Safe Demo Simulation Mode with pre-computed real-time cues so you can evaluate the entire UI immediately.)*

### 3. Install Dependencies
```bash
npm install
```

### 4. Build Frontend & Start Server
```bash
# Build the production bundle
npm run build

# Start the full-stack server
npm start
```
Visit `http://localhost:8080` in your browser.

For frontend live reloading during active development:
```bash
npm run dev
```
(Runs Vite dev server on `http://localhost:3000` with API proxying to `http://localhost:8080`).

---

## 🎙️ Generating Demo Audio with `gemini-3.8-flash-tts`

To generate fresh multi-speaker conversational dialogue files using Gemini's native two-voice TTS (`Caller` + `Victim`):
```bash
npm run generate-audio
```
This produces all 4 WAV files into `public/audio/`.

---

## ☁️ Deploying to Google Cloud Run

The backend is fully containerized and ready for 1-command deployment to Cloud Run.

### 1. Build and Deploy with Google Cloud CLI
```bash
# Set your GCP Project ID
export PROJECT_ID="your-google-cloud-project-id"

# Submit build to Cloud Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/$PROJECT_ID/rakshasetu-scam-shield

gcloud run deploy rakshasetu-scam-shield \
  --image gcr.io/$PROJECT_ID/rakshasetu-scam-shield \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_gemini_api_key_here",LIVE_MODEL="gemini-3.8-live",FALLBACK_MODEL="gemini-3.8-flash"
```

Cloud Run will automatically route port 8080 traffic to Express, serving both the API token endpoint and the compiled React frontend!

---

## 🔒 Security Best Practices
- **No Master Key Exposure:** The browser client only receives short-lived ephemeral tokens from `/api/token`.
- **Locked Token Scope:** The token generated via `ai.authTokens.create()` is strictly restricted to `gemini-3.8-live`, `report_call_risk`, and silent call monitoring instructions.
