import { NextRequest } from 'next/server'

export const runtime = 'edge'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''

const VOICE_MAP: Record<string, { voiceId: string; model: string }> = {
  en: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_turbo_v2_5' },
  nl: { voiceId: 'pNInz6obpgDQGcFmaJgB', model: 'eleven_multilingual_v2' },
  es: { voiceId: 'pNInz6obpgDQGcFmaJgB', model: 'eleven_multilingual_v2' },
  fr: { voiceId: 'pNInz6obpgDQGcFmaJgB', model: 'eleven_multilingual_v2' },
  de: { voiceId: 'pNInz6obpgDQGcFmaJgB', model: 'eleven_multilingual_v2' },
}

const DEFAULT_VOICE = { voiceId: 'pNInz6obpgDQGcFmaJgB', model: 'eleven_multilingual_v2' }

// Allowlist of valid voice IDs
const ALLOWED_VOICE_IDS = new Set([
  'JBFqnCBsd6RMkjVDRZzb', // George (EN)
  'pNInz6obpgDQGcFmaJgB', // Adam (multilingual)
  'EXAVITQu4vr4xnSDxMaL', // Bella (F)
])

const MAX_TEXT_LENGTH = 5000

export async function POST(request: NextRequest) {
  try {
    const { text, language, voiceId: customVoiceId } = await request.json()

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 })
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: `Text too long (max ${MAX_TEXT_LENGTH} chars)` }), { status: 400 })
    }

    // Validate custom voiceId against allowlist
    if (customVoiceId && !ALLOWED_VOICE_IDS.has(customVoiceId)) {
      return new Response(JSON.stringify({ error: 'Invalid voice ID' }), { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: 'TTS service not configured' }), { status: 500 })
    }

    const mapped = VOICE_MAP[language] || DEFAULT_VOICE
    const voiceId = customVoiceId || mapped.voiceId
    const model = customVoiceId ? 'eleven_multilingual_v2' : mapped.model

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        output_format: 'mp3_44100_64',
      }),
    })

    if (!response.ok) {
      console.error('ElevenLabs TTS error:', response.status)
      return new Response(JSON.stringify({ error: 'TTS service error' }), { status: 502 })
    }

    const audioBuffer = await response.arrayBuffer()
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (error) {
    console.error('TTS API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
