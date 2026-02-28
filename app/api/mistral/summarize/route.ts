import { NextRequest } from 'next/server'

export const runtime = 'edge'

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || ''
const MAX_MESSAGES = 100

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing messages array' }), { status: 400 })
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Too many messages (max ${MAX_MESSAGES})` }), { status: 400 })
    }

    if (!MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Summary service not configured' }), { status: 500 })
    }

    const transcript = messages.map((m: { speaker: string; sourceLanguage: string; original: string; targetLanguage: string; translated: string }) =>
      `[${m.speaker}] (${m.sourceLanguage}): ${m.original}\n→ (${m.targetLanguage}): ${m.translated}`
    ).join('\n\n')

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: 'Summarize this multilingual conversation concisely. Include key topics discussed, any decisions made, and action items if any. Write in English.' },
          { role: 'user', content: transcript }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.error('Mistral summarize error:', response.status)
      return new Response(JSON.stringify({ error: 'Summary service error' }), { status: 502 })
    }

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content?.trim() || ''

    return new Response(JSON.stringify({ summary }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Summarize API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
