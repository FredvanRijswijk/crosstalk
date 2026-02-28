"use client"

import { useState } from "react"
import { RealtimeDemo } from "@/components/crosstalk/realtime-demo"
import { UseCases, type UseCasePreset } from "@/components/crosstalk/use-cases"

export default function Page() {
  const [activeCase, setActiveCase] = useState<string | null>(null)
  const [preset, setPreset] = useState<UseCasePreset | null>(null)

  const handleSelect = (p: UseCasePreset) => {
    // Toggle off if same case clicked
    if (activeCase === p.id) {
      setActiveCase(null)
      setPreset(null)
    } else {
      setActiveCase(p.id)
      setPreset(p)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-8 px-6 py-10">
      <RealtimeDemo preset={preset} />
      <UseCases active={activeCase} onSelect={handleSelect} />
    </main>
  )
}
