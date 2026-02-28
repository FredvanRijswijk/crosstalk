import { RealtimeDemo } from "@/components/crosstalk/realtime-demo"
import { UseCases } from "@/components/crosstalk/use-cases"

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-8 px-6 py-10">
      <RealtimeDemo />
      <UseCases />
    </main>
  )
}
