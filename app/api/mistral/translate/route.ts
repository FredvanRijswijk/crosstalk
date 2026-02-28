import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Mock translations for different language pairs
const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    nl: "Goedemorgen, dokter. Ik heb al twee dagen veel pijn op de borst.",
    en: "Good morning, doctor. I've had severe chest pain for two days.",
    fr: "Bonjour docteur. J'ai des douleurs thoraciques sévères depuis deux jours.",
    de: "Guten Morgen, Arzt. Ich habe seit zwei Tagen starke Brustschmerzen."
  },
  nl: {
    es: "Buenos días, doctor. Me duele mucho el pecho desde hace dos días.",
    en: "Good morning, doctor. I've had severe chest pain for two days.",
    fr: "Bonjour docteur. J'ai des douleurs thoraciques sévères depuis deux jours.",
    de: "Guten Morgen, Arzt. Ich habe seit zwei Tagen starke Brustschmerzen."
  },
  en: {
    es: "Buenos días, doctor. Me duele mucho el pecho desde hace dos días.",
    nl: "Goedemorgen, dokter. Ik heb al twee dagen veel pijn op de borst.",
    fr: "Bonjour docteur. J'ai des douleurs thoraciques sévères depuis deux jours.",
    de: "Guten Morgen, Arzt. Ich habe seit zwei Tagen starke Brustschmerzen."
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.text || !body.source_language || !body.target_language) {
      return NextResponse.json(
        { error: 'Missing required fields: text, source_language, and target_language are required' },
        { status: 400 }
      )
    }

    // Mock processing delay (simulate real API latency)
    await new Promise(resolve => setTimeout(resolve, 300))

    // Get the mock translation
    const sourceLang = body.source_language
    const targetLang = body.target_language
    
    // Find the best matching mock translation
    let translation = MOCK_TRANSLATIONS[sourceLang]?.[targetLang] || "Translation not available"
    
    // If we don't have an exact match, try to find a similar one
    if (translation === "Translation not available") {
      // Try to find any translation from this source language
      const sourceTranslations = MOCK_TRANSLATIONS[sourceLang]
      if (sourceTranslations) {
        // Use the first available target language as fallback
        translation = sourceTranslations[Object.keys(sourceTranslations)[0]]
      }
    }

    return NextResponse.json({
      translation: translation,
      source_language: sourceLang,
      target_language: targetLang,
      model: body.model || 'mistral-large-latest',
      timestamp: Date.now(),
      status: "success"
    })
    
  } catch (error) {
    console.error('Mock Mistral API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export function GET() {
  return NextResponse.json(
    {
      message: "Mistral Mock Translation API - Use POST to /api/mistral/translate with text and language codes",
      supported_languages: ["es", "nl", "en", "fr", "de"],
      available_models: ["mistral-large-latest"],
      status: "ok"
    }
  )
}