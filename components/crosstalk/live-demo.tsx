"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  ArrowLeftRight,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: number
  original: string
  translated: string
  speaker: "left" | "right"
  timestamp: string
}

const CONVERSATION: Message[] = [
  {
    id: 1,
    original: "Buenos dias, doctor. Me duele mucho el pecho desde hace dos dias.",
    translated: "Goedemorgen, dokter. Ik heb al twee dagen veel pijn op de borst.",
    speaker: "right",
    timestamp: "09:01",
  },
  {
    id: 2,
    original: "Goedemorgen. Kunt u aanwijzen waar precies de pijn zit?",
    translated: "Buenos dias. Puede indicar exactamente donde le duele?",
    speaker: "left",
    timestamp: "09:01",
  },
  {
    id: 3,
    original: "Aqui, en el lado izquierdo. A veces siento presion.",
    translated: "Hier, aan de linkerkant. Soms voel ik druk.",
    speaker: "right",
    timestamp: "09:02",
  },
  {
    id: 4,
    original: "Heeft u ook last van kortademigheid of duizeligheid?",
    translated: "Tiene tambien dificultad para respirar o mareos?",
    speaker: "left",
    timestamp: "09:02",
  },
  {
    id: 5,
    original: "Si, a veces me mareo cuando camino rapido.",
    translated: "Ja, soms word ik duizelig als ik snel loop.",
    speaker: "right",
    timestamp: "09:03",
  },
  {
    id: 6,
    original: "Ik ga uw bloeddruk en hartslag controleren. Ontspan alstublieft.",
    translated: "Voy a revisar su presion arterial y pulso. Relajese por favor.",
    speaker: "left",
    timestamp: "09:03",
  },
]

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

export function LiveDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [playing, setPlaying] = useState(false)
  const [idx, setIdx] = useState(0)
  const [speaker, setSpeaker] = useState<"left" | "right" | null>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  const next = useCallback(() => {
    if (idx >= CONVERSATION.length) {
      setPlaying(false)
      setSpeaker(null)
      return
    }
    const msg = CONVERSATION[idx]
    setSpeaker(msg.speaker)
    setTimeout(() => {
      setMessages((p) => [...p, msg])
      setSpeaker(null)
      setIdx((p) => p + 1)
    }, 2200)
  }, [idx])

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(next, 800)
    return () => clearTimeout(t)
  }, [playing, idx, next])

  useEffect(() => {
    leftRef.current?.scrollTo({ top: leftRef.current.scrollHeight, behavior: "smooth" })
    rightRef.current?.scrollTo({ top: rightRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const start = () => {
    setMessages([])
    setIdx(0)
    setPlaying(true)
  }

  const reset = () => {
    setMessages([])
    setIdx(0)
    setPlaying(false)
    setSpeaker(null)
  }

  const done = !playing && messages.length === CONVERSATION.length

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
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={messages.length === 0 && !playing}
            className="font-mono text-xs tracking-wider h-9 px-4 rounded-none border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            RESET
          </Button>
          <Button
            size="sm"
            onClick={start}
            disabled={playing}
            className="font-mono text-xs tracking-wider h-9 px-5 rounded-none bg-foreground text-background hover:bg-foreground/80"
          >
            {playing ? (
              <>
                <span className="w-2 h-2 rounded-full bg-background animate-pulse mr-2" />
                TRANSLATING
              </>
            ) : done ? (
              <>
                <Play className="w-3.5 h-3.5 mr-2" />
                REPLAY
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-2" />
                START
              </>
            )}
          </Button>
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

        {/* LEFT: Doctor / Nederlands */}
        <div className="flex flex-col min-h-[55vh] lg:min-h-[68vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-background">DR</span>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Doctor</h3>
                <p className="text-xs font-mono text-muted-foreground tracking-wider">NL</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WaveBar active={speaker === "left"} />
              {speaker === "left" ? (
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
                      Vertaald
                    </div>
                    <div className="border border-border px-4 py-3 rounded-sm rounded-bl-none max-w-[85%] text-sm leading-relaxed text-foreground/80">
                      {msg.translated}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{msg.timestamp}</span>
                  </div>
                )}
              </div>
            ))}
            {speaker === "left" && (
              <div className="flex justify-end"><Dots /></div>
            )}
            {speaker === "right" && (
              <div className="flex justify-start"><Dots /></div>
            )}
          </div>
        </div>

        {/* RIGHT: Paciente / Espanol */}
        <div className="flex flex-col min-h-[55vh] lg:min-h-[68vh] border-t lg:border-t-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-foreground">PT</span>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Paciente</h3>
                <p className="text-xs font-mono text-muted-foreground tracking-wider">ES</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WaveBar active={speaker === "right"} />
              {speaker === "right" ? (
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
                      Traducido
                    </div>
                    <div className="border border-border px-4 py-3 rounded-sm rounded-bl-none max-w-[85%] text-sm leading-relaxed text-foreground/80">
                      {msg.translated}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{msg.timestamp}</span>
                  </div>
                )}
              </div>
            ))}
            {speaker === "right" && (
              <div className="flex justify-end"><Dots /></div>
            )}
            {speaker === "left" && (
              <div className="flex justify-start"><Dots /></div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${playing ? "bg-foreground animate-pulse" : "bg-muted-foreground/30"}`} />
            <span className="uppercase tracking-widest">{playing ? "Live" : done ? "Done" : "Ready"}</span>
          </div>
          <span className="tracking-widest">NL / ES</span>
        </div>
        <span className="tracking-widest">{messages.length} / {CONVERSATION.length}</span>
      </div>
    </div>
  )
}
