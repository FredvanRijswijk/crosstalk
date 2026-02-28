export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  timestamp: number;
}

type TranscriptionCallback = (result: TranscriptionResult) => void;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

export class VoxstralService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private ws: WebSocket | null = null;
  private isRecording = false;
  private transcriptionCallbacks: TranscriptionCallback[] = [];
  private currentText = '';
  private currentLanguage = 'unknown';

  async startRecording(language: string = 'auto'): Promise<void> {
    if (this.isRecording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }

    // Get microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Set up audio processing to get raw PCM
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Use ScriptProcessorNode (deprecated but widely supported) to get raw samples
    const bufferSize = 4096;
    const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!this.isRecording || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const float32 = e.inputBuffer.getChannelData(0);
      // Convert float32 [-1,1] to int16 PCM
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      this.ws.send(int16.buffer);
    };

    this.sourceNode.connect(processor);
    processor.connect(this.audioContext.destination);
    this.workletNode = processor;

    // Connect WebSocket to server
    this.connectWebSocket();
    this.isRecording = true;
    console.log('Recording started (WebSocket mode)');
  }

  private connectWebSocket() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('[ws] connected to transcription server');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'text_delta') {
          this.currentText += msg.text;
          console.log('[ws] delta:', msg.text, '| full:', this.currentText);

          // Emit current accumulated text
          this.emitResult(this.currentText, this.currentLanguage);
        } else if (msg.type === 'language') {
          this.currentLanguage = msg.language;
          console.log('[ws] language detected:', msg.language);
        } else if (msg.type === 'segment') {
          // A complete segment - reset accumulator for next segment
          console.log('[ws] segment:', msg.text);
          if (msg.text) {
            this.emitResult(msg.text, this.currentLanguage);
          }
          this.currentText = '';
        } else if (msg.type === 'session.created') {
          console.log('[ws] session created');
        } else if (msg.type === 'done') {
          console.log('[ws] transcription done');
        } else if (msg.type === 'error') {
          console.error('[ws] error:', msg.error);
        }
      } catch (e) {
        console.error('[ws] parse error:', e);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[ws] error:', err);
    };

    this.ws.onclose = () => {
      console.log('[ws] disconnected');
    };
  }

  private emitResult(text: string, language: string) {
    if (!text.trim()) return;

    const result: TranscriptionResult = {
      text: text.trim(),
      language,
      confidence: 0.95,
      timestamp: Date.now(),
    };

    this.transcriptionCallbacks.forEach((cb) => {
      try {
        cb(result);
      } catch (e) {
        console.error('Callback error:', e);
      }
    });
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) return;

    // Signal end of audio
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end' }));
      // Small delay then close
      setTimeout(() => {
        this.ws?.close();
        this.ws = null;
      }, 500);
    }

    // Clean up audio
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    this.isRecording = false;
    this.currentText = '';
    console.log('Recording stopped');
  }

  onTranscription(callback: TranscriptionCallback): () => void {
    this.transcriptionCallbacks.push(callback);
    return () => {
      const i = this.transcriptionCallbacks.indexOf(callback);
      if (i !== -1) this.transcriptionCallbacks.splice(i, 1);
    };
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }
}
