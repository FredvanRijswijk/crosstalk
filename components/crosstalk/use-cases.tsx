import {
  Stethoscope,
  Building2,
  Hotel,
  Siren,
  GraduationCap,
  Briefcase,
  Plane,
  Heart,
  type LucideIcon,
} from "lucide-react"
import { track } from "@vercel/analytics"

export interface UseCasePreset {
  id: string
  label: string
  icon: LucideIcon
  left: string
  right: string
  silence: number
  autoSpeak: boolean
  domain: string
}

export const USE_CASE_PRESETS: UseCasePreset[] = [
  { id: "healthcare", label: "Healthcare", icon: Stethoscope, left: "nl", right: "ar", silence: 2, autoSpeak: true, domain: "medical/healthcare" },
  { id: "immigration", label: "Immigration", icon: Building2, left: "nl", right: "ar", silence: 1.5, autoSpeak: false, domain: "legal/immigration/bureaucratic" },
  { id: "hospitality", label: "Hospitality", icon: Hotel, left: "en", right: "es", silence: 1.5, autoSpeak: false, domain: "hospitality/hotel/restaurant" },
  { id: "emergency", label: "Emergency", icon: Siren, left: "en", right: "es", silence: 0.8, autoSpeak: true, domain: "emergency/911/urgent medical" },
  { id: "education", label: "Education", icon: GraduationCap, left: "en", right: "zh", silence: 2, autoSpeak: false, domain: "education/academic/classroom" },
  { id: "business", label: "Business", icon: Briefcase, left: "en", right: "de", silence: 1.5, autoSpeak: false, domain: "business/corporate/formal" },
  { id: "travel", label: "Travel", icon: Plane, left: "en", right: "fr", silence: 1.2, autoSpeak: true, domain: "travel/tourism/directions" },
  { id: "elderly", label: "Elderly Care", icon: Heart, left: "nl", right: "tr", silence: 2.5, autoSpeak: true, domain: "healthcare/elderly care/simple language" },
]

export function UseCases({
  active,
  onSelect,
}: {
  active: string | null
  onSelect: (preset: UseCasePreset) => void
}) {
  return (
    <section className="w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-5">
        <div className="h-px flex-1 bg-border" />
        <h2 className="text-xs font-mono tracking-[0.3em] uppercase text-muted-foreground">
          Use Cases
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-px bg-border">
        {USE_CASE_PRESETS.map((c) => {
          const isActive = active === c.id
          return (
            <button
              key={c.id}
              onClick={() => { track("select_use_case", { useCase: c.id, languages: `${c.left}-${c.right}` }); onSelect(c) }}
              className={`flex flex-col items-center justify-center gap-2.5 py-6 px-2 transition-colors ${
                isActive
                  ? "bg-foreground"
                  : "bg-card hover:bg-secondary"
              }`}
            >
              <c.icon
                className={`w-5 h-5 ${
                  isActive ? "text-background" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-mono tracking-wider uppercase text-center leading-tight ${
                  isActive ? "text-background font-bold" : "text-foreground/70"
                }`}
              >
                {c.label}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
