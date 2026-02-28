import axios from 'axios';

// Mistral API configuration
const MISTRAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mistral.ai/v1/chat/completions'
  : '/api/mistral/translate';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';

export interface TranslationResult {
  text: string;
  detectedLanguage: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
}

type TranslationCallback = (result: TranslationResult) => void;

export class MistralService {
  private translationCallbacks: TranslationCallback[] = [];
  private isTranslating = false;

  constructor() {
    console.log('🤖 MistralService initialized');
  }

  async translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
    languages?: string[]
  ): Promise<TranslationResult> {
    try {
      if (this.isTranslating) {
        console.warn('Translation already in progress');
      }
      
      this.isTranslating = true;
      console.log(`🌍 Translating from ${sourceLang} to ${targetLang}: "${text}"`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Only add authorization header if we're using the real API
      if (MISTRAL_API_URL.startsWith('https://api.mistral.ai')) {
        headers['Authorization'] = `Bearer ${MISTRAL_API_KEY}`;
      }

      const response = await axios.post(
        MISTRAL_API_URL,
        {
          text: text,
          source_language: sourceLang,
          target_language: targetLang,
          languages: languages,
          model: 'mistral-large-latest',
          timestamp: Date.now()
        },
        { headers }
      );

      const result: TranslationResult = {
        text: response.data.translation,
        detectedLanguage: response.data.detected_language || sourceLang,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        timestamp: Date.now()
      };

      console.log(`✅ Translation complete: "${result.text}"`);
      
      // Notify all callbacks with the translation result
      this.translationCallbacks.forEach(callback => {
        try {
          callback(result);
        } catch (error) {
          console.error('Error in translation callback:', error);
        }
      });

      this.isTranslating = false;
      return result;
      
    } catch (error) {
      console.error('Error translating text with Mistral:', error);
      this.isTranslating = false;
      
      if (axios.isAxiosError(error)) {
        console.error('Mistral API error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
      
      throw error;
    }
  }

  /**
   * Register a callback to receive translation results
   * @param callback Function to call when translation results are available
   * @returns Function to unregister the callback
   */
  onTranslation(callback: TranslationCallback): () => void {
    this.translationCallbacks.push(callback);
    return () => {
      const index = this.translationCallbacks.indexOf(callback);
      if (index !== -1) {
        this.translationCallbacks.splice(index, 1);
      }
    };
  }

  isTranslatingActive(): boolean {
    return this.isTranslating;
  }
}