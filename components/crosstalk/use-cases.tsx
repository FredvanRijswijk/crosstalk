import {
  Stethoscope,
  Building2,
  Hotel,
  Siren,
  GraduationCap,
  Briefcase,
  Plane,
  Heart,
} from "lucide-react"

const cases = [
  { icon: Stethoscope, label: "Healthcare", highlight: true },
  { icon: Building2, label: "Immigration", highlight: false },
  { icon: Hotel, label: "Hospitality", highlight: false },
  { icon: Siren, label: "Emergency", highlight: false },
  { icon: GraduationCap, label: "Education", highlight: false },
  { icon: Briefcase, label: "Business", highlight: false },
  { icon: Plane, label: "Travel", highlight: false },
  { icon: Heart, label: "Elderly Care", highlight: false },
]

export function UseCases() {
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
        {cases.map((c) => (
          <div
            key={c.label}
            className={`flex flex-col items-center justify-center gap-2.5 py-6 px-2 transition-colors ${
              c.highlight
                ? "bg-foreground"
                : "bg-card hover:bg-secondary"
            }`}
          >
            <c.icon
              className={`w-5 h-5 ${
                c.highlight ? "text-background" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-[10px] font-mono tracking-wider uppercase text-center leading-tight ${
                c.highlight ? "text-background font-bold" : "text-foreground/70"
              }`}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
