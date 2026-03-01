"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  ArrowLeftRight,
  Play,
  Pause,
  Loader2,
  FileText,
  X,
  Minus,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranscription } from "@/hooks/use-transcription"
import { useTranslation } from "@/hooks/use-translation"
import { useTTS } from "@/hooks/use-tts"
import { LanguageSelector } from "@/components/ui/language-selector"
import { Switch } from "@/components/ui/switch"
import type { UseCasePreset } from "@/components/crosstalk/use-cases"

interface Message {
  id: number
  original: string
  translated: string
  speaker: "left" | "right"
  timestamp: string
  sourceLanguage: string
  targetLanguage: string
  confidence: number
  isTranslating?: boolean
  translationMs?: number
}

const VOICES = [
  { id: "pNInz6obpgDQGcFmaJgB", label: "M" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "F" },
] as const

const WAVE_HEIGHTS = [10, 16, 12, 18, 14]

function WaveBar({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-5">
      {WAVE_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-200"
          style={{
            height: active ? `${h}px` : "3px",
            backgroundColor: active ? "oklch(0.98 0 0)" : "oklch(0.3 0 0)",
            animation: active
              ? `wave-line 0.5s ease-in-out ${i * 0.07}s infinite`
              : "none",
          }}
        />
      ))}
    </div>
  )
}

function Dots() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-foreground/80 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
      <Mic className="w-10 h-10" />
      <p className="text-xs font-mono tracking-widest uppercase">Press start or spacebar</p>
    </div>
  )
}

export function RealtimeDemo({ preset }: { preset?: UseCasePreset | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [liveText, setLiveText] = useState<string>('')
  const [currentSpeaker, setCurrentSpeaker] = useState<"left" | "right" | null>(null)
  const [leftLanguage, setLeftLanguage] = useState<string>("nl")
  const [rightLanguage, setRightLanguage] = useState<string>("en")
  const [leftVoice, setLeftVoice] = useState(0)
  const [rightVoice, setRightVoice] = useState(1)
  const [silenceTimeout, setSilenceTimeout] = useState(1.5)
  const [domain, setDomain] = useState<string>('')
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  // Apply preset when selected
  useEffect(() => {
    if (!preset) {
      setDomain('')
      return
    }
    setLeftLanguage(preset.left)
    setRightLanguage(preset.right)
    setSilenceTimeout(preset.silence)
    setLeftAutoSpeak(preset.autoSpeak)
    setRightAutoSpeak(preset.autoSpeak)
    setDomain(preset.domain)
  }, [preset])
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const prevTranscriptionRef = useRef<string>('')
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageIdRef = useRef(0)
  const pendingCommitRef = useRef<{ text: string; msgId: number; timestamp: string; confidence: number } | null>(null)

  const {
    isRecording,
    transcription,
    language: detectedLanguage,
    confidence,
    error: transcriptionError,
    startTranscription,
    stopTranscription,
    resetTranscription,
  } = useTranscription()

  const {
    isTranslating,
    translation,
    detectedLanguage: translationDetectedLang,
    translationMs,
    sourceLanguage,
    targetLanguage,
    error: translationError,
    translateText,
    setTargetLanguage: setTranslationTargetLanguage
  } = useTranslation()

  const { playText, playingId, loadingId, preload } = useTTS()
  const [leftAutoSpeak, setLeftAutoSpeak] = useState(false)
  const [rightAutoSpeak, setRightAutoSpeak] = useState(false)
  const leftAutoSpeakRef = useRef(leftAutoSpeak)
  const rightAutoSpeakRef = useRef(rightAutoSpeak)
  leftAutoSpeakRef.current = leftAutoSpeak
  rightAutoSpeakRef.current = rightAutoSpeak

  const leftLangRef = useRef(leftLanguage)
  const rightLangRef = useRef(rightLanguage)
  const detectedLangRef = useRef(detectedLanguage)
  const confidenceRef = useRef(confidence)
  const silenceRef = useRef(silenceTimeout)
  const leftVoiceRef = useRef(leftVoice)
  const rightVoiceRef = useRef(rightVoice)
  const domainRef = useRef(domain)
  leftLangRef.current = leftLanguage
  rightLangRef.current = rightLanguage
  detectedLangRef.current = detectedLanguage
  confidenceRef.current = confidence
  silenceRef.current = silenceTimeout
  leftVoiceRef.current = leftVoice
  rightVoiceRef.current = rightVoice
  domainRef.current = domain

  const determineSpeaker = useCallback((lang: string): "left" | "right" => {
    const l = leftLangRef.current
    const r = rightLangRef.current
    if (lang === l) return "left"
    if (lang === r) return "right"
    if (lang.startsWith(l) || l.startsWith(lang)) return "left"
    if (lang.startsWith(r) || r.startsWith(lang)) return "right"
    return "left"
  }, [])

  // Keyboard shortcut: spacebar to toggle recording
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        toggleListeningRef.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Handle realtime transcription
  useEffect(() => {
    if (!isListening || !transcription || transcription.trim().length === 0) return
    if (transcription === prevTranscriptionRef.current) return
    prevTranscriptionRef.current = transcription

    const lang = detectedLangRef.current || "auto"
    const speaker = determineSpeaker(lang)
    setCurrentSpeaker(speaker)
    setLiveText(transcription)

    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)

    commitTimerRef.current = setTimeout(() => {
      const finalText = prevTranscriptionRef.current
      if (!finalText.trim()) return

      messageIdRef.current += 1
      const msgId = messageIdRef.current
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      pendingCommitRef.current = { text: finalText, msgId, timestamp, confidence: confidenceRef.current }
      prevTranscriptionRef.current = ''
      resetTranscription()

      const langs = [leftLangRef.current, rightLangRef.current]
      translateText(finalText, 'auto', '', langs, domainRef.current || undefined)
        .catch(error => {
          console.error('Translation failed:', error)
          if (pendingCommitRef.current?.msgId === msgId) {
            setMessages(prev => [...prev, {
              id: msgId,
              original: finalText,
              translated: '[Translation failed]',
              speaker: 'left',
              timestamp,
              sourceLanguage: 'unknown',
              targetLanguage: '',
              confidence: 0,
              isTranslating: false
            }])
            pendingCommitRef.current = null
            setCurrentSpeaker(null)
            setLiveText('')
          }
        })
    }, silenceRef.current * 1000)

    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    }
  }, [transcription, isListening, confidence, determineSpeaker, translateText, resetTranscription])

  // Handle translation results
  useEffect(() => {
    if (!translation || !translationDetectedLang) return

    const pending = pendingCommitRef.current
    if (!pending) return

    const spk = determineSpeaker(translationDetectedLang)

    // Auto-update language selector if detected language differs
    if (spk === 'left' && translationDetectedLang !== leftLangRef.current) {
      setLeftLanguage(translationDetectedLang)
    } else if (spk === 'right' && translationDetectedLang !== rightLangRef.current) {
      setRightLanguage(translationDetectedLang)
    }

    const correctTarget = spk === 'left' ? rightLangRef.current : leftLangRef.current

    const newMessage: Message = {
      id: pending.msgId,
      original: pending.text,
      translated: translation,
      speaker: spk,
      timestamp: pending.timestamp,
      sourceLanguage: translationDetectedLang,
      targetLanguage: correctTarget,
      confidence: pending.confidence,
      isTranslating: false,
      translationMs
    }

    pendingCommitRef.current = null
    setMessages(prev => [...prev, newMessage])
    setCurrentSpeaker(null)
    setLiveText('')

    // Translation appears in opposite panel: left speaker → right panel, right speaker → left panel
    const targetPanel = spk === 'left' ? 'right' : 'left'
    const voiceIdx = targetPanel === 'left' ? leftVoiceRef.current : rightVoiceRef.current
    const voiceId = VOICES[voiceIdx].id
    const shouldAutoSpeak = targetPanel === 'left' ? leftAutoSpeakRef.current : rightAutoSpeakRef.current

    if (shouldAutoSpeak) {
      playText(newMessage.id, newMessage.translated, newMessage.targetLanguage, voiceId)
    } else {
      preload(newMessage.translated, newMessage.targetLanguage, voiceId)
    }
  }, [translation, translationDetectedLang, translationMs, determineSpeaker, playText, preload])

  useEffect(() => {
    leftRef.current?.scrollTo({ top: leftRef.current.scrollHeight, behavior: "smooth" })
    rightRef.current?.scrollTo({ top: rightRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const startListening = async () => {
    try {
      setIsListening(true)
      await startTranscription("auto")
    } catch (error) {
      setIsListening(false)
      console.error("Failed to start listening:", error)
    }
  }

  const stopListening = async () => {
    try {
      setIsListening(false)
      await stopTranscription()
    } catch (error) {
      console.error("Failed to stop listening:", error)
    }
  }

  const resetConversation = async () => {
    setMessages([])
    setCurrentSpeaker(null)
    setSummary(null)
    if (isListening) {
      await stopListening()
    }
  }

  const toggleListening = async () => {
    if (isListening) {
      await stopListening()
    } else {
      await startListening()
    }
  }

  // Ref for keyboard shortcut to avoid stale closure
  const toggleListeningRef = useRef(toggleListening)
  toggleListeningRef.current = toggleListening

  const fetchSummary = async () => {
    if (messages.length === 0) return
    setIsSummarizing(true)
    setSummary(null)
    try {
      const res = await fetch('/api/mistral/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      if (!res.ok) throw new Error(`Summary failed: ${res.status}`)
      const data = await res.json()
      setSummary(data.summary)
    } catch (err) {
      console.error('Summary error:', err)
      setSummary('Failed to generate summary.')
    } finally {
      setIsSummarizing(false)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-3 sm:gap-6">
      {/* Title area */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-end justify-between sm:block">
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground leading-none">
              CrossTalk
            </h1>
            <p className="text-[10px] sm:text-sm font-mono text-muted-foreground mt-1 sm:mt-2 tracking-wide">
              REAL-TIME VOICE TRANSLATION
            </p>
          </div>
          {/* Mobile-only start button */}
          <Button
            size="sm"
            onClick={toggleListening}
            className="sm:hidden font-mono text-xs tracking-wider h-9 px-5 rounded-none bg-foreground text-background hover:bg-foreground/80"
          >
            {isListening ? (
              <><Pause className="w-3.5 h-3.5 mr-2" />STOP</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-2" />START</>
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <LanguageSelector
            value={leftLanguage}
            onChange={setLeftLanguage}
            side="left"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={!hasMessages || isSummarizing}
            className="font-mono text-xs tracking-wider h-9 px-2 sm:px-4 rounded-none border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
          >
            {isSummarizing ? (
              <Loader2 className="w-3.5 h-3.5 sm:mr-2 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 sm:mr-2" />
            )}
            <span className="hidden sm:inline">SUMMARY</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetConversation}
            disabled={messages.length === 0 && !isListening}
            className="font-mono text-xs tracking-wider h-9 px-2 sm:px-4 rounded-none border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:mr-2" />
            <span className="hidden sm:inline">RESET</span>
          </Button>
          <Button
            size="sm"
            onClick={toggleListening}
            className="hidden sm:flex font-mono text-xs tracking-wider h-9 px-5 rounded-none bg-foreground text-background hover:bg-foreground/80"
          >
            {isListening ? (
              <><Pause className="w-3.5 h-3.5 mr-2" />STOP</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-2" />START</>
            )}
          </Button>
          <LanguageSelector
            value={rightLanguage}
            onChange={setRightLanguage}
            side="right"
          />
        </div>
      </div>

      {/* Summary panel */}
      {summary && (
        <div className="relative border border-border rounded-sm bg-card px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={() => setSummary(null)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Summary</p>
          <p className="text-sm leading-relaxed text-foreground/80">{summary}</p>
        </div>
      )}

      {/* Main split panel */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 border border-border rounded-sm overflow-hidden bg-card">
        {/* Center divider */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* LEFT: Person A */}
        <div className="flex flex-col h-[35vh] sm:h-[45vh] lg:h-[68vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-foreground flex items-center justify-center">
                <span className="font-mono text-[10px] sm:text-xs font-bold text-background">A</span>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Person A</h3>
                <p className="text-xs font-mono text-muted-foreground tracking-wider">
                  {leftLanguage.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer" title="Auto-speak translations">
                <Switch checked={leftAutoSpeak} onCheckedChange={setLeftAutoSpeak} className="scale-[0.6]" />
                <Volume2 className={`w-3 h-3 ${leftAutoSpeak ? 'text-foreground' : 'text-muted-foreground/30'}`} />
              </label>
              <button
                onClick={() => setLeftVoice(v => (v + 1) % VOICES.length)}
                className="text-[10px] font-mono font-bold tracking-wider border border-border rounded px-2 py-0.5 hover:bg-foreground hover:text-background transition-colors"
                title="Toggle TTS voice"
              >
                {VOICES[leftVoice].label}
              </button>
              <WaveBar active={currentSpeaker === "left"} />
              {currentSpeaker === "left" ? (
                <Mic className="w-4 h-4 text-foreground" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground/30" />
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col" ref={leftRef}>
            {!hasMessages && !currentSpeaker ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState />
              </div>
            ) : (
              <div className="mt-auto space-y-4">
                {messages.map((msg) => (
                  <div key={`l-${msg.id}`}>
                    {msg.speaker === "left" ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="bg-foreground text-background px-4 py-3 rounded-sm rounded-br-none max-w-[85%] text-sm leading-relaxed">
                          {msg.original}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground/50">{msg.sourceLanguage.toUpperCase()}</span>
                          {msg.confidence < 0.8 && (
                            <span className="text-[10px] font-mono text-yellow-500">{Math.round(msg.confidence * 100)}%</span>
                          )}
                          <span className="text-[10px] font-mono text-muted-foreground">{msg.timestamp}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                          <Volume2 className="w-3 h-3" />
                          Translated
                          {msg.translationMs ? (
                            <span className={`ml-1 ${msg.translationMs < 500 ? 'text-green-500' : msg.translationMs < 1000 ? 'text-yellow-500' : 'text-red-400'}`}>
                              {msg.translationMs}ms
                            </span>
                          ) : null}
                          <button
                            onClick={() => playText(msg.id, msg.translated, msg.targetLanguage, VOICES[leftVoice].id)}
                            className="ml-1 hover:text-foreground transition-colors"
                          >
                            {loadingId === msg.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : playingId === msg.id ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className={`border px-4 py-3 rounded-sm rounded-bl-none max-w-[85%] text-sm leading-relaxed ${msg.isTranslating ? 'border-yellow-500 bg-yellow-50' : 'border-border text-foreground/80'}`}>
                          {msg.isTranslating ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                              <span>{msg.translated}</span>
                            </div>
                          ) : (
                            <span>{msg.translated}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{msg.timestamp}</span>
                      </div>
                    )}
                  </div>
                ))}
                {currentSpeaker === "left" && (
                  <div className="flex justify-end"><Dots /></div>
                )}
                {currentSpeaker === "right" && (
                  <div className="flex justify-start"><Dots /></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Person B */}
        <div className="flex flex-col h-[35vh] sm:h-[45vh] lg:h-[68vh] border-t lg:border-t-0">
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-foreground flex items-center justify-center">
                <span className="font-mono text-[10px] sm:text-xs font-bold text-foreground">B</span>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Person B</h3>
                <p className="text-xs font-mono text-muted-foreground tracking-wider">
                  {rightLanguage.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer" title="Auto-speak translations">
                <Switch checked={rightAutoSpeak} onCheckedChange={setRightAutoSpeak} className="scale-[0.6]" />
                <Volume2 className={`w-3 h-3 ${rightAutoSpeak ? 'text-foreground' : 'text-muted-foreground/30'}`} />
              </label>
              <button
                onClick={() => setRightVoice(v => (v + 1) % VOICES.length)}
                className="text-[10px] font-mono font-bold tracking-wider border border-border rounded px-2 py-0.5 hover:bg-foreground hover:text-background transition-colors"
                title="Toggle TTS voice"
              >
                {VOICES[rightVoice].label}
              </button>
              <WaveBar active={currentSpeaker === "right"} />
              {currentSpeaker === "right" ? (
                <Mic className="w-4 h-4 text-foreground" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground/30" />
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col" ref={rightRef}>
            {!hasMessages && !currentSpeaker ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState />
              </div>
            ) : (
              <div className="mt-auto space-y-4">
                {messages.map((msg) => (
                  <div key={`r-${msg.id}`}>
                    {msg.speaker === "right" ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="bg-foreground text-background px-4 py-3 rounded-sm rounded-br-none max-w-[85%] text-sm leading-relaxed">
                          {msg.original}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground/50">{msg.sourceLanguage.toUpperCase()}</span>
                          {msg.confidence < 0.8 && (
                            <span className="text-[10px] font-mono text-yellow-500">{Math.round(msg.confidence * 100)}%</span>
                          )}
                          <span className="text-[10px] font-mono text-muted-foreground">{msg.timestamp}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                          <Volume2 className="w-3 h-3" />
                          Translated
                          {msg.translationMs ? (
                            <span className={`ml-1 ${msg.translationMs < 500 ? 'text-green-500' : msg.translationMs < 1000 ? 'text-yellow-500' : 'text-red-400'}`}>
                              {msg.translationMs}ms
                            </span>
                          ) : null}
                          <button
                            onClick={() => playText(msg.id, msg.translated, msg.targetLanguage, VOICES[rightVoice].id)}
                            className="ml-1 hover:text-foreground transition-colors"
                          >
                            {loadingId === msg.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : playingId === msg.id ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className={`border px-4 py-3 rounded-sm rounded-bl-none max-w-[85%] text-sm leading-relaxed ${msg.isTranslating ? 'border-yellow-500 bg-yellow-50' : 'border-border text-foreground/80'}`}>
                          {msg.isTranslating ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                              <span>{msg.translated}</span>
                            </div>
                          ) : (
                            <span>{msg.translated}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{msg.timestamp}</span>
                      </div>
                    )}
                  </div>
                ))}
                {currentSpeaker === "right" && (
                  <div className="flex justify-end"><Dots /></div>
                )}
                {currentSpeaker === "left" && (
                  <div className="flex justify-start"><Dots /></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground px-1">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-foreground animate-pulse" : "bg-muted-foreground/30"}`} />
            <span className="uppercase tracking-widest">{isListening ? "Listening" : hasMessages ? "Ready" : "Idle"}</span>
          </div>
          <span className="tracking-widest">{leftLanguage.toUpperCase()} ↔ {rightLanguage.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-widest hidden sm:inline">Silence</span>
            <button
              onClick={() => setSilenceTimeout(t => Math.max(0.5, +(t - 0.25).toFixed(2)))}
              className="hover:text-foreground transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center tabular-nums">{silenceTimeout}s</span>
            <button
              onClick={() => setSilenceTimeout(t => Math.min(3, +(t + 0.25).toFixed(2)))}
              className="hover:text-foreground transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="tracking-widest">{messages.length} MESSAGES</span>
        </div>
      </div>

      {/* Error display */}
      {(transcriptionError || translationError) && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded flex items-center justify-center">
          <span className="text-sm text-destructive">
            {transcriptionError || translationError}
          </span>
        </div>
      )}

      {/* Live transcription display */}
      {isListening && (
        <div className="p-3 bg-background border border-border rounded flex flex-col gap-2">
          {detectedLanguage && detectedLanguage !== 'detecting...' && (
            <div className="text-center">
              <span className="text-xs font-mono text-green-500 tracking-widest">
                DETECTED: {detectedLanguage.toUpperCase()}
              </span>
            </div>
          )}

          {liveText ? (
            <div className="text-center">
              <span className="text-sm font-mono text-foreground/70 tracking-wide">
                {liveText}
              </span>
              <span className="inline-block w-0.5 h-4 bg-foreground/50 animate-pulse ml-0.5 align-middle" />
            </div>
          ) : (
            <div className="text-center">
              <span className="text-xs font-mono text-muted-foreground tracking-widest">
                SPEAK NOW...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
