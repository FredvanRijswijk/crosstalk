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

export async function POST(request: NextRequest) {
  try {
    const { text, language, voiceId: customVoiceId } = await request.json()

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), { status: 500 })
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
      const errText = await response.text()
      console.error('ElevenLabs TTS error:', response.status, errText)
      return new Response(JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }), { status: response.status })
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
