import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.text || !body.target_language) {
      return NextResponse.json(
        { error: 'Missing required fields: text and target_language' },
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
    const languages = body.languages // e.g. ["nl", "en"] — the two conversation languages

    // Build prompt: if we know both languages, ask to detect and translate to the OTHER one
    const prompt = languages && languages.length === 2
      ? `You are a professional translator. The conversation uses ${languages[0]} and ${languages[1]}. Detect which of these two languages the input text is in, then translate it to the OTHER language. Respond in this exact JSON format: {"detected":"<ISO 639-1 code>","translation":"<translated text>"}. Nothing else.`
      : `You are a professional translator. Detect the language of the input text and translate it to ${targetLang}. Respond in this exact JSON format: {"detected":"<ISO 639-1 language code>","translation":"<translated text>"}. Nothing else.`

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
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
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

    let translation = ''
    let detectedLang = sourceLang
    try {
      const parsed = JSON.parse(content)
      translation = parsed.translation || ''
      detectedLang = parsed.detected || sourceLang
    } catch {
      // Fallback if JSON parse fails
      translation = content
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
