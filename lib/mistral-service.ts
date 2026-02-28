import axios from 'axios';

const MISTRAL_API_URL = '/api/mistral/translate';


export interface TranslationResult {
  text: string;
  detectedLanguage: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
  translationMs: number;
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
    languages?: string[],
    domain?: string
  ): Promise<TranslationResult> {
    try {
      if (this.isTranslating) {
        console.warn('Translation already in progress');
      }
      
      this.isTranslating = true;
      const startTime = performance.now();
      console.log(`🌍 Translating from ${sourceLang} to ${targetLang}: "${text}"`);

      const response = await axios.post(MISTRAL_API_URL, {
        text: text,
        source_language: sourceLang,
        target_language: targetLang,
        languages: languages,
        domain: domain
      });

      const elapsed = Math.round(performance.now() - startTime);

      const result: TranslationResult = {
        text: response.data.translation,
        detectedLanguage: response.data.detected_language || sourceLang,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        timestamp: Date.now(),
        translationMs: elapsed
      };

      console.log(`✅ Translation complete (${elapsed}ms): "${result.text}"`);
      
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