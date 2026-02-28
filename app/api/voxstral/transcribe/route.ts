import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/audio/transcriptions'
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || ''
const MAX_AUDIO_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.audio || !body.model) {
      return NextResponse.json(
        { error: 'Missing required fields: audio and model' },
        { status: 400 }
      )
    }

    if (typeof body.audio !== 'string') {
      return NextResponse.json({ error: 'Invalid audio format' }, { status: 400 })
    }

    if (!MISTRAL_API_KEY) {
      return NextResponse.json({ error: 'Transcription service not configured' }, { status: 500 })
    }

    const audioBuffer = Buffer.from(body.audio, 'base64')

    if (audioBuffer.length > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: `Audio too large (max ${MAX_AUDIO_BYTES / 1024 / 1024}MB)` },
        { status: 400 }
      )
    }

    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'voxtral-mini-latest')

    if (body.language && body.language !== 'auto') {
      formData.append('language', body.language)
    }

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      console.error('Mistral API error:', response.status)
      return NextResponse.json({ error: 'Transcription service error' }, { status: 502 })
    }

    const data = await response.json()

    return NextResponse.json({
      text: data.text || '',
      language: data.language || 'unknown',
      confidence: 0.95,
      timestamp: Date.now(),
      model: data.model || body.model,
      status: 'success'
    })

  } catch (error) {
    console.error('Voxstral API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
