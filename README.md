# CrossTalk

Real-time voice translation app. Two people speak different languages, the app transcribes, translates, and speaks translations aloud.

**[crosstalk.today](https://crosstalk.today)** — Built at the Mistral AI Worldwide Hackathon in London.

Built with Next.js, Mistral AI (Voxstral + Mistral Small), and ElevenLabs TTS.

> Demo video: [`video/out/CrossTalkDemo.mp4`](video/out/CrossTalkDemo.mp4)

## Features

- Real-time speech-to-text with auto language detection
- Instant translation between any two languages
- Text-to-speech playback with manual play button and per-person auto-speak toggle
- Male/female voice selection per person
- 8 use case presets (Healthcare, Emergency, Travel, etc.) with domain-specific terminology
- Conversation summary generation
- Configurable silence timeout (0.5s-3s)
- Spacebar shortcut to start/stop
- Confidence indicator on low-confidence transcriptions

## Models and APIs

| Service | Model | Purpose | Route |
|---------|-------|---------|-------|
| Mistral (Voxstral) | `voxtral-mini-transcribe-realtime-2602` | Real-time speech-to-text via WebSocket | WebSocket streaming |
| Mistral (Voxstral) | `voxtral-mini-latest` | Speech-to-text transcription (REST) | `POST /api/voxstral/transcribe` |
| Mistral | `mistral-small-latest` | Translation with domain hints | `POST /api/mistral/translate` |
| Mistral | `mistral-small-latest` | Conversation summary | `POST /api/mistral/summarize` |
| ElevenLabs | `eleven_turbo_v2_5` (EN) / `eleven_multilingual_v2` (other) | Text-to-speech | `POST /api/elevenlabs/tts` |

Primary transcription uses a WebSocket server streaming audio chunks to Voxstral in real-time (~200ms latency). REST endpoint available as fallback.

## Environment variables

| Variable | Description |
|----------|-------------|
| `MISTRAL_API_KEY` | Mistral API key - used for STT, translation, and summary |
| `ELEVENLABS_API_KEY` | ElevenLabs API key - used for TTS |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL for streaming transcription |

## Setup

```bash
# install dependencies
npm install

# copy env file and add your keys
cp .env.local.example .env.local

# start dev server
npm run dev
```

The app runs on `http://localhost:3000`.

## WebSocket server

The real-time transcription requires a WebSocket server that accepts audio chunks and proxies them to Mistral's audio transcription API. For production, this needs to be deployed separately with a `wss://` URL.

## Use case presets

| Preset | Languages | Domain |
|--------|-----------|--------|
| Healthcare | NL - AR | medical/healthcare |
| Immigration | NL - AR | legal/immigration/bureaucratic |
| Hospitality | EN - ES | hospitality/hotel/restaurant |
| Emergency | EN - ES | emergency/911/urgent medical |
| Education | EN - ZH | education/academic/classroom |
| Business | EN - DE | business/corporate/formal |
| Travel | EN - FR | travel/tourism/directions |
| Elderly Care | NL - TR | healthcare/elderly care/simple language |
