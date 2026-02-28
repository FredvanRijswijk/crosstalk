export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  timestamp: number;
}

type TranscriptionCallback = (result: TranscriptionResult) => void;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

// Warn if using unencrypted ws:// in production
if (typeof window !== 'undefined' && WS_URL.startsWith('ws://') && window.location.protocol === 'https:') {
  console.warn('[voxstral] WARNING: using unencrypted ws:// over HTTPS. Set NEXT_PUBLIC_WS_URL to wss://');
}

export class VoxstralService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private ws: WebSocket | null = null;
  private isRecording = false;
  private transcriptionCallbacks: TranscriptionCallback[] = [];
  private currentText = '';
  private currentLanguage = 'unknown';

  async startRecording(_language: string = 'auto'): Promise<void> {
    if (this.isRecording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }

    // Connect WS first so it's ready when audio starts
    await this.connectWebSocket();

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // 2048 samples = 128ms at 16kHz — good balance between latency and overhead
    const processor = this.audioContext.createScriptProcessor(2048, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!this.isRecording || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const input = e.inputBuffer.getChannelData(0);

      // Fast float32→int16 conversion
      const pcm = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = input[i];
        pcm[i] = s > 0 ? (s * 0x7fff) | 0 : (s * 0x8000) | 0;
      }

      // Send binary directly — server handles base64
      this.ws.send(pcm.buffer);
    };

    this.sourceNode.connect(processor);
    // Connect to destination to keep the processor alive (required by spec)
    processor.connect(this.audioContext.destination);
    this.processorNode = processor;

    this.isRecording = true;
    console.log('[voxstral] recording started');
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);
      this.ws.binaryType = 'arraybuffer';

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log('[ws] connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'text_delta':
              this.currentText += msg.text;
              this.emitResult(this.currentText, this.currentLanguage);
              break;
            case 'language':
              this.currentLanguage = msg.language;
              console.log('[ws] language:', msg.language);
              break;
            case 'segment':
              if (msg.language) {
                this.currentLanguage = msg.language;
              }
              if (msg.text) {
                this.emitResult(msg.text, this.currentLanguage);
              }
              this.currentText = '';
              break;
            case 'session.created':
              console.log('[ws] session ready');
              break;
            case 'done':
              console.log('[ws] done');
              break;
            case 'error':
              console.error('[ws] error:', msg.error);
              break;
          }
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        console.error('[ws] error:', err);
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = () => {
        console.log('[ws] disconnected');
      };
    });
  }

  private emitResult(text: string, language: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const result: TranscriptionResult = {
      text: trimmed,
      language,
      confidence: 0.95,
      timestamp: Date.now(),
    };

    for (const cb of this.transcriptionCallbacks) {
      try { cb(result); } catch { /* skip */ }
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) return;
    this.isRecording = false;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('{"type":"end"}');
      this.ws.close();
    }
    this.ws = null;

    this.processorNode?.disconnect();
    this.processorNode = null;
    this.sourceNode?.disconnect();
    this.sourceNode = null;

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.mediaStream = null;
    this.currentText = '';
    console.log('[voxstral] stopped');
  }

  onTranscription(callback: TranscriptionCallback): () => void {
    this.transcriptionCallbacks.push(callback);
    return () => {
      const i = this.transcriptionCallbacks.indexOf(callback);
      if (i !== -1) this.transcriptionCallbacks.splice(i, 1);
    };
  }

  resetText(): void {
    this.currentText = '';
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }
}
