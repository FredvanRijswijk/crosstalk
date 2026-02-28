import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/audio/transcriptions'
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.audio || !body.model) {
      return NextResponse.json(
        { error: 'Missing required fields: audio and model are required' },
        { status: 400 }
      )
    }

    if (!MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: 'MISTRAL_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Decode base64 audio to a buffer
    const audioBuffer = Buffer.from(body.audio, 'base64')

    // Build multipart form data for Mistral API
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
      const errorText = await response.text()
      console.error('Mistral API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Mistral API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      text: data.text || '',
      language: data.language || 'unknown',
      confidence: 0.95, // Mistral doesn't return confidence, use high default
      timestamp: Date.now(),
      model: data.model || body.model,
      status: 'success'
    })

  } catch (error) {
    console.error('Voxstral API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export function GET() {
  return NextResponse.json({
    message: 'Voxstral API - Use POST to /api/voxstral/transcribe with audio data',
    available_models: ['voxtral-mini-latest'],
    status: 'ok'
  })
}
