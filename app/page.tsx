"use client"

import { useState } from "react"
import { RealtimeDemo } from "@/components/crosstalk/realtime-demo"
import { UseCases, type UseCasePreset } from "@/components/crosstalk/use-cases"

export default function Page() {
  const [preset, setPreset] = useState<UseCasePreset | null>(null)

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
