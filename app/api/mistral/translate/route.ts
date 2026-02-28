import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Edge runtime — lower latency, no cold starts
export const runtime = 'edge'

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.text || (!body.target_language && !body.languages)) {
      return NextResponse.json(
        { error: 'Missing required fields: text and target_language or languages' },
        { status: 400 }
      )
    }

    if (!MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: 'MISTRAL_API_KEY not configured' },
        { status: 500 }
      )
    }

    const sourceLang = body.source_language || 'auto'
    const targetLang = body.target_language
    const languages = body.languages

    // Minimal prompt — fewer tokens = faster response
    const prompt = languages && languages.length === 2
      ? `Translator. Input is ${languages[0]} or ${languages[1]}. Detect which, translate to the other. Reply: LANG|translation. LANG is ISO 639-1 code. No quotes, no explanation.`
      : `Translate to ${targetLang}. Reply: LANG|translation. LANG is detected ISO 639-1 code. No quotes, no explanation.`

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: body.text }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mistral translation error:', response.status, errorText)
      return NextResponse.json(
        { error: `Mistral API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''

    // Parse "LANG|translation" format
    let translation = ''
    let detectedLang = sourceLang
    const pipeIdx = content.indexOf('|')
    if (pipeIdx !== -1 && pipeIdx <= 5) {
      detectedLang = content.slice(0, pipeIdx).trim().toLowerCase()
      translation = content.slice(pipeIdx + 1).trim()
    } else {
      // Fallback: try JSON parse (backwards compat)
      try {
        const parsed = JSON.parse(content)
        translation = parsed.translation || ''
        detectedLang = parsed.detected || sourceLang
      } catch {
        translation = content
      }
    }

    return NextResponse.json({
      translation,
      detected_language: detectedLang,
      source_language: sourceLang,
      target_language: targetLang,
      timestamp: Date.now(),
      status: 'success'
    })

  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
