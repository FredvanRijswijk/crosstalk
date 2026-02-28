import { useState, useCallback, useRef } from 'react'

const MAX_CACHE = 50

export function useTTS() {
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cacheRef = useRef<Map<string, string>>(new Map())

  const cacheKey = (text: string, language: string, voiceId?: string) =>
    `${text}|${language}|${voiceId || ''}`

  const fetchAudio = useCallback(async (text: string, language: string, voiceId?: string): Promise<string> => {
    const key = cacheKey(text, language, voiceId)
    const cached = cacheRef.current.get(key)
    if (cached) return cached

    const body: Record<string, string> = { text, language }
    if (voiceId) body.voiceId = voiceId

    const res = await fetch('/api/elevenlabs/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`TTS failed: ${res.status}`)

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    // Evict oldest entry if cache is full
    if (cacheRef.current.size >= MAX_CACHE) {
      const oldest = cacheRef.current.keys().next().value!
      URL.revokeObjectURL(cacheRef.current.get(oldest)!)
      cacheRef.current.delete(oldest)
    }

    cacheRef.current.set(key, url)
    return url
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingId(null)
    setLoadingId(null)
  }, [])

  const playText = useCallback(async (id: number, text: string, language: string, voiceId?: string) => {
    if (playingId === id) {
      stop()
      return
    }

    stop()
    setLoadingId(id)

    try {
      const url = await fetchAudio(text, language, voiceId)

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setPlayingId(null)
        audioRef.current = null
      }

      setLoadingId(null)
      setPlayingId(id)
      await audio.play()
    } catch (err) {
      console.error('TTS playback error:', err)
      setLoadingId(null)
      setPlayingId(null)
    }
  }, [playingId, stop, fetchAudio])

  const preload = useCallback(async (text: string, language: string, voiceId?: string) => {
    try {
      await fetchAudio(text, language, voiceId)
    } catch {
      // silent — preload is best-effort
    }
  }, [fetchAudio])

  return { playText, playingId, loadingId, stop, preload }
}
