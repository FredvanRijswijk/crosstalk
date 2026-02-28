import { LiveDemoReal } from "@/components/crosstalk/live-demo-real"

export default function TestRealPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-8 px-6 py-10">
      <LiveDemoReal />
    </main>
  )
}