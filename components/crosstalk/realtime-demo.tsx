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
  const [currentSpeaker, setCurrentSpeaker] = useState<"left" | "right" | null>(null)
  const [leftLanguage, setLeftLanguage] = useState<string>("nl")
  const [rightLanguage, setRightLanguage] = useState<string>("es")
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  
  // Transcription hooks
  const {
    isRecording,
    transcription,
    language: detectedLanguage,
    confidence,
    error: transcriptionError,
    startTranscription,
    stopTranscription,
  } = useTranscription()

  // Translation hooks
  const {
    isTranslating,
    translation,
    sourceLanguage,
    targetLanguage,
    error: translationError,
    translateText,
    setTargetLanguage: setTranslationTargetLanguage
  } = useTranslation()

  // Determine which side is currently speaking based on the detected language
  const determineSpeaker = useCallback((lang: string) => {
    // If language matches left side, speaker is left
    // If language matches right side, speaker is right  
    // Otherwise, alternate speakers based on message count
    if (lang === leftLanguage) {
      return "left"
    } else if (lang === rightLanguage) {
      return "right"
    } else {
      // For auto-detection, alternate based on next message ID
      return (messages.length + 1) % 2 === 0 ? "left" : "right"
    }
  }, [leftLanguage, rightLanguage, messages.length])

  // Handle new transcription results
  useEffect(() => {
    if (transcription && isListening && transcription.trim().length > 0) {
      console.log('New transcription received:', { transcription, detectedLanguage });
      const speaker = determineSpeaker(detectedLanguage || "auto")
      setCurrentSpeaker(speaker)
      
      // For real-time transcription, we'll create a message after a brief pause
      // This simulates natural speech patterns where people pause between sentences
      const timer = setTimeout(() => {
        const newMessage: Message = {
          id: messages.length + 1,
          original: transcription,
          translated: `[Translating from ${detectedLanguage || 'unknown'} to ${speaker === 'left' ? rightLanguage : leftLanguage}]`,
          speaker: speaker,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sourceLanguage: detectedLanguage || 'unknown',
          targetLanguage: speaker === 'left' ? rightLanguage : leftLanguage,
          confidence: confidence || 0.95,
          isTranslating: true // Mark as translating
        }
        
        console.log('Adding new message:', newMessage);
        setMessages((prev) => [...prev, newMessage])
        setCurrentSpeaker(null)
        
        // Start translation
        const targetLang = speaker === 'left' ? rightLanguage : leftLanguage
        translateText(transcription, detectedLanguage || 'auto', targetLang)
          .catch(error => {
            console.error('Translation failed:', error)
            // Update message to show translation error
            setMessages(prev => prev.map(msg => 
              msg.id === newMessage.id 
                ? {...msg, translated: `[Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}]`, isTranslating: false}
                : msg
            ))
          })
      }, 2000) // Wait 2 seconds of silence before creating message
      
      return () => clearTimeout(timer)
    }
  }, [transcription, isListening, detectedLanguage, messages.length, determineSpeaker, leftLanguage, rightLanguage, confidence, translateText])

  // Handle translation results
  useEffect(() => {
    if (translation && messages.length > 0) {
      // Find the most recent message that's still translating
      const messageToUpdate = messages.find(msg => msg.isTranslating)
      
      if (messageToUpdate) {
        console.log('Translation completed:', { translation, sourceLanguage, targetLanguage });
        
        // Update the message with the actual translation
        setMessages(prev => prev.map(msg => 
          msg.id === messageToUpdate.id 
            ? {
                ...msg,
                translated: translation,
                targetLanguage: targetLanguage,
                isTranslating: false
              }
            : msg
        ))
      }
    }
  }, [translation, messages, targetLanguage])

  useEffect(() => {
    leftRef.current?.scrollTo({ top: leftRef.current.scrollHeight, behavior: "smooth" })
    rightRef.current?.scrollTo({ top: rightRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

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
      
      {/* Detection and transcription display */}
      {isListening && (
        <div className="p-3 bg-background border border-border rounded flex flex-col gap-2">
          {/* Language detection */}
          {detectedLanguage && detectedLanguage !== 'detecting...' && (
            <div className="text-center">
              <span className="text-xs font-mono text-green-500 tracking-widest">
                🔍 DETECTED: {detectedLanguage.toUpperCase()} (Confidence: {(confidence * 100).toFixed(1)}%)
              </span>
            </div>
          )}
          
          {/* Live transcription */}
          {transcription && transcription.trim().length > 0 && (
            <div className="text-center">
              <span className="text-sm font-mono text-blue-500 tracking-wide">
                🎤 LIVE: "{transcription}"
              </span>
            </div>
          )}
          
          {/* Waiting for speech */}
          {!transcription && (
            <div className="text-center">
              <span className="text-xs font-mono text-muted-foreground tracking-widest">
                🎤 SPEAK NOW - Language detection active...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}