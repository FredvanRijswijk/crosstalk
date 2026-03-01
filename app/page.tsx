"use client"

import { useState, useEffect } from "react"
import { RealtimeDemo } from "@/components/crosstalk/realtime-demo"
import { UseCases, type UseCasePreset } from "@/components/crosstalk/use-cases"

export default function Page() {
  const [preset, setPreset] = useState<UseCasePreset | null>(null)

  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get("demo")
    if (demo) {
      document.cookie = `__demo=${demo}; path=/; max-age=86400; SameSite=Lax`
    }
  }, [])

  const handleSelect = (p: UseCasePreset) => {
    setPreset(prev => prev?.id === p.id ? null : p)
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 sm:gap-8 px-3 sm:px-6 py-4 sm:py-10">
      <RealtimeDemo preset={preset} />
      <UseCases active={preset?.id ?? null} onSelect={handleSelect} />
    </main>
  )
}
