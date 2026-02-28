import { useState, useCallback, useRef } from 'react'

export function useTTS() {
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setPlayingId(null)
    setLoadingId(null)
  }, [])

  const playText = useCallback(async (id: number, text: string, language: string) => {
    // if same message playing, stop it
    if (playingId === id) {
      stop()
      return
    }

    // stop any current playback
    stop()
    setLoadingId(id)

    try {
      const res = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      })

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setPlayingId(null)
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
          blobUrlRef.current = null
        }
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
  }, [playingId, stop])

  return { playText, playingId, loadingId, stop }
}
