import { useState, useEffect, useCallback } from 'react';
import { VoxstralService, TranscriptionResult } from '@/lib/voxstral-service';

export function useTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [language, setLanguage] = useState<string>('auto');
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [voxstralService, setVoxstralService] = useState<VoxstralService | null>(null);
  
  // Initialize the Voxstral service
  useEffect(() => {
    const service = new VoxstralService();
    setVoxstralService(service);
    
    return () => {
      // Cleanup on unmount
      if (service && service.isRecordingActive()) {
        service.stopRecording();
      }
    };
  }, []);

  // Set up transcription callback
  useEffect(() => {
    if (!voxstralService) return;
    
    console.log('Setting up transcription callback');
    
    const unsubscribe = voxstralService.onTranscription((result) => {
      console.log('Received transcription result in hook:', result);
      // For real-time transcription, we want to show the latest complete utterance
      // Instead of accumulating, we'll treat each result as a potential complete sentence
      if (result.text.trim().length > 0) {
        setTranscription(result.text); // Replace with latest transcription
        setLanguage(result.language);
        setConfidence(result.confidence); // Store confidence level
      }
    });
    
    return () => {
      console.log('Cleaning up transcription callback');
      unsubscribe();
    };
  }, [voxstralService]);

  const startTranscription = useCallback(async (language: string = 'auto') => {
    if (!voxstralService) {
      setError('Voxstral service not initialized');
      return;
    }

    try {
      setIsRecording(true);
      setError(null);
      setTranscription('');
      setLanguage(language === 'auto' ? 'detecting...' : language);
      
      await voxstralService.startRecording(language);
      
    } catch (err) {
      console.error('Failed to start transcription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsRecording(false);
    }
  }, [voxstralService]);

  const resetTranscription = useCallback(() => {
    if (voxstralService) {
      voxstralService.resetText();
    }
    setTranscription('');
  }, [voxstralService]);

  const stopTranscription = useCallback(async () => {
    if (!voxstralService) {
      return;
    }

    try {
      await voxstralService.stopRecording();
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to stop transcription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [voxstralService]);

  const toggleTranscription = useCallback(async () => {
    if (isRecording) {
      await stopTranscription();
    } else {
      await startTranscription();
    }
  }, [isRecording, startTranscription, stopTranscription]);

  return {
    isRecording,
    transcription,
    language,
    confidence,
    error,
    startTranscription,
    stopTranscription,
    toggleTranscription,
    resetTranscription,
    setLanguage
  };
}