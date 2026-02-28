import { useState, useEffect, useCallback } from 'react';
import { MistralService, TranslationResult } from '@/lib/mistral-service';

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translation, setTranslation] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [translationMs, setTranslationMs] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [mistralService, setMistralService] = useState<MistralService | null>(null);
  
  // Initialize the Mistral service
  useEffect(() => {
    const service = new MistralService();
    setMistralService(service);
    
    return () => {
      // Cleanup on unmount
      if (service && service.isTranslatingActive()) {
        // Service will complete current translation
      }
    };
  }, []);

  // Set up translation callback
  useEffect(() => {
    if (!mistralService) return;
    
    const unsubscribe = mistralService.onTranslation((result) => {
      setTranslation(result.text);
      setDetectedLanguage(result.detectedLanguage);
      setSourceLanguage(result.sourceLanguage);
      setTargetLanguage(result.targetLanguage);
      setTranslationMs(result.translationMs);
      setIsTranslating(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [mistralService]);

  const translateText = useCallback(async (
    text: string,
    sourceLang: string,
    targetLang: string,
    languages?: string[],
    domain?: string
  ) => {
    if (!mistralService) {
      setError('Mistral service not initialized');
      return;
    }

    try {
      setIsTranslating(true);
      setError(null);
      setTranslation('');

      await mistralService.translateText(text, sourceLang, targetLang, languages, domain);
      
    } catch (err) {
      console.error('Failed to translate text:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsTranslating(false);
    }
  }, [mistralService]);

  return {
    isTranslating,
    translation,
    detectedLanguage,
    translationMs,
    sourceLanguage,
    targetLanguage,
    error,
    translateText,
    setTargetLanguage
  };
}