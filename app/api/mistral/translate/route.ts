import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || ''

const ALLOWED_DOMAINS = new Set([
  'medical/healthcare',
  'legal/immigration/bureaucratic',
  'hospitality/hotel/restaurant',
  'emergency/911/urgent medical',
  'education/academic/classroom',
  'business/corporate/formal',
  'travel/tourism/directions',
  'healthcare/elderly care/simple language',
])

const MAX_TEXT_LENGTH = 2000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    if (body.text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: `Text too long (max ${MAX_TEXT_LENGTH} chars)` }, { status: 400 })
    }

    if (!body.target_language && !body.languages) {
      return NextResponse.json({ error: 'Missing target_language or languages' }, { status: 400 })
    }

    if (!MISTRAL_API_KEY) {
      return NextResponse.json({ error: 'Translation service not configured' }, { status: 500 })
    }

    const sourceLang = body.source_language || 'auto'
    const targetLang = body.target_language
    const languages = body.languages

    // Validate domain against allowlist
    const domain = body.domain && ALLOWED_DOMAINS.has(body.domain) ? body.domain : ''
    const domainHint = domain ? ` Use ${domain} terminology.` : ''

    const prompt = languages && languages.length === 2
      ? `Translator. Input is ${languages[0]} or ${languages[1]}. Detect which, translate to the other.${domainHint} Reply: LANG|translation. LANG is ISO 639-1 code. No quotes, no explanation.`
      : `Translate to ${targetLang}.${domainHint} Reply: LANG|translation. LANG is detected ISO 639-1 code. No quotes, no explanation.`

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
      console.error('Mistral translation error:', response.status)
      return NextResponse.json({ error: 'Translation service error' }, { status: 502 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''

    let translation = ''
    let detectedLang = sourceLang
    const pipeIdx = content.indexOf('|')
    if (pipeIdx !== -1 && pipeIdx <= 5) {
      detectedLang = content.slice(0, pipeIdx).trim().toLowerCase()
      translation = content.slice(pipeIdx + 1).trim()
    } else {
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
