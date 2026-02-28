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
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranscription } from "@/hooks/use-transcription"
import { useTranslation } from "@/hooks/use-translation"
import { useTTS } from "@/hooks/use-tts"
import { LanguageSelector } from "@/components/ui/language-selector"

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

function WaveBar({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-200"
          style={{
            height: active ? `${8 + Math.random() * 12}px` : "3px",
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

export function RealtimeDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [liveText, setLiveText] = useState<string>('')
  const [currentSpeaker, setCurrentSpeaker] = useState<"left" | "right" | null>(null)
  const [leftLanguage, setLeftLanguage] = useState<string>("nl")
  const [rightLanguage, setRightLanguage] = useState<string>("en")
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const prevTranscriptionRef = useRef<string>('')
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageIdRef = useRef(0)
  const pendingCommitRef = useRef<{ text: string; msgId: number; timestamp: string } | null>(null)

  // Transcription hooks
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

  // Translation hooks
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

  // Use refs for values needed in callbacks to avoid stale closures
  const leftLangRef = useRef(leftLanguage)
  const rightLangRef = useRef(rightLanguage)
  const detectedLangRef = useRef(detectedLanguage)
  leftLangRef.current = leftLanguage
  rightLangRef.current = rightLanguage
  detectedLangRef.current = detectedLanguage

  const determineSpeaker = useCallback((lang: string): "left" | "right" => {
    const l = leftLangRef.current
    const r = rightLangRef.current
    if (lang === l) return "left"
    if (lang === r) return "right"
    // Fuzzy match for language codes (e.g. "nld" vs "nl")
    if (lang.startsWith(l) || l.startsWith(lang)) return "left"
    if (lang.startsWith(r) || r.startsWith(lang)) return "right"
    return "left" // default to left (person A)
  }, [])

  // Handle realtime transcription - show live text and commit after silence
  useEffect(() => {
    if (!isListening || !transcription || transcription.trim().length === 0) return
    if (transcription === prevTranscriptionRef.current) return
    prevTranscriptionRef.current = transcription

    const lang = detectedLangRef.current || "auto"
    const speaker = determineSpeaker(lang)
    setCurrentSpeaker(speaker)
    setLiveText(transcription)

    // Reset commit timer on each new delta
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)

    // After 1.5s of no new text, send for translation (don't add to messages yet)
    commitTimerRef.current = setTimeout(() => {
      const finalText = prevTranscriptionRef.current
      if (!finalText.trim()) return

      messageIdRef.current += 1
      const msgId = messageIdRef.current
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      // Store pending — keep liveText visible until translation returns
      pendingCommitRef.current = { text: finalText, msgId, timestamp }
      prevTranscriptionRef.current = ''
      resetTranscription()

      // Send both languages — API detects which one and translates to the other
      const langs = [leftLangRef.current, rightLangRef.current]
      translateText(finalText, 'auto', '', langs)
        .catch(error => {
          console.error('Translation failed:', error)
          // On failure, still add message so user sees it
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
    }, 1500)

    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    }
  }, [transcription, isListening, confidence, determineSpeaker, translateText, resetTranscription])

  // Handle translation results — add message with correct speaker in one shot (no flicker)
  useEffect(() => {
    if (!translation || !translationDetectedLang) return

    const pending = pendingCommitRef.current
    if (!pending) return

    const spk = determineSpeaker(translationDetectedLang)
    const correctTarget = spk === 'left' ? rightLangRef.current : leftLangRef.current

    const newMessage: Message = {
      id: pending.msgId,
      original: pending.text,
      translated: translation,
      speaker: spk,
      timestamp: pending.timestamp,
      sourceLanguage: translationDetectedLang,
      targetLanguage: correctTarget,
      confidence: 0.95,
      isTranslating: false,
      translationMs
    }

    pendingCommitRef.current = null
    setMessages(prev => [...prev, newMessage])
    setCurrentSpeaker(null)
    setLiveText('')
  }, [translation, translationDetectedLang, translationMs, determineSpeaker])

  useEffect(() => {
    leftRef.current?.scrollTo({ top: leftRef.current.scrollHeight, behavior: "smooth" })
    rightRef.current?.scrollTo({ top: rightRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, liveText])

  const startListening = async () => {
    try {
      setIsListening(true)
      await startTranscription("auto") // Always use auto-detection
    } catch (error) {
      setIsListening(false)
      console.error("Failed to start listening:", error)
      // The error will be caught by the useTranscription hook and displayed in the UI
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

  const { playText, playingId, loadingId } = useTTS()

  const hasMessages = messages.length > 0

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Title area */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground leading-none">
            CrossTalk
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-2 tracking-wide">
            REAL-TIME VOICE TRANSLATION
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector
            value={leftLanguage}
            onChange={setLeftLanguage}
            side="left"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={resetConversation}
            disabled={messages.length === 0 && !isListening}
            className="font-mono text-xs tracking-wider h-9 px-4 rounded-none border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            RESET
          </Button>
          <Button
            size="sm"
            onClick={toggleListening}
            disabled={false}
            className="font-mono text-xs tracking-wider h-9 px-5 rounded-none bg-foreground text-background hover:bg-foreground/80"
          >
            {isListening ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-2" />
                STOP
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-2" />
                START
              </>
            )}
          </Button>
          <LanguageSelector
            value={rightLanguage}
            onChange={setRightLanguage}
            side="right"
          />
        </div>
      </div>

      {/* Main split panel */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 border border-border rounded-sm overflow-hidden bg-card">
        {/* Center divider */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* LEFT: Person A */}
        <div className="flex flex-col min-h-[55vh] lg:min-h-[68vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-background">A</span>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Person A</h3>
                <p className="text-xs font-mono text-muted-foreground tracking-wider">
                  {leftLanguage.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WaveBar active={currentSpeaker === "left"} />
              {currentSpeaker === "left" ? (
                <Mic className="w-4 h-4 text-foreground" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground/30" />
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={leftRef}>
            {messages.map((msg) => (
              <div key={`l-${msg.id}`}>
                {msg.speaker === "left" ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="bg-foreground text-background px-4 py-3 rounded-sm rounded-br-none max-w-[85%] text-sm leading-relaxed">
                      {msg.original}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{msg.timestamp}</span>
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
                        onClick={() => playText(msg.id, msg.translated, msg.targetLanguage)}
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
        </div>

        {/* RIGHT: Person B */}
        <div className="flex flex-col min-h-[55vh] lg:min-h-[68vh] border-t lg:border-t-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-foreground">B</span>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Person B</h3>
                <p className="text-xs font-mono text-muted-foreground tracking-wider">
                  {rightLanguage.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WaveBar active={currentSpeaker === "right"} />
              {currentSpeaker === "right" ? (
                <Mic className="w-4 h-4 text-foreground" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground/30" />
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={rightRef}>
            {messages.map((msg) => (
              <div key={`r-${msg.id}`}>
                {msg.speaker === "right" ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="bg-foreground text-background px-4 py-3 rounded-sm rounded-br-none max-w-[85%] text-sm leading-relaxed">
                      {msg.original}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{msg.timestamp}</span>
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
                        onClick={() => playText(msg.id, msg.translated, msg.targetLanguage)}
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
                    <div className="border border-border px-4 py-3 rounded-sm rounded-bl-none max-w-[85%] text-sm leading-relaxed text-foreground/80">
                      {msg.translated}
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
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-foreground animate-pulse" : "bg-muted-foreground/30"}`} />
            <span className="uppercase tracking-widest">{isListening ? "Listening" : hasMessages ? "Ready" : "Idle"}</span>
          </div>
          <span className="tracking-widest">{leftLanguage.toUpperCase()} ↔ {rightLanguage.toUpperCase()}</span>
        </div>
        <span className="tracking-widest">{messages.length} MESSAGES</span>
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