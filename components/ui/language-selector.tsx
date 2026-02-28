import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

// Supported languages with their native names
const LANGUAGES = [
  { code: "auto", name: "Auto Detect", native: "Auto Detect" },
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
]

export function LanguageSelector({ 
  value,
  onChange,
  side = "left",
  className = ""
}: {
  value: string
  onChange: (language: string) => void
  side?: "left" | "right"
  className?: string
}) {
  const [open, setOpen] = useState(false)
  
  const currentLanguage = LANGUAGES.find(lang => lang.code === value) || LANGUAGES[0]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`font-mono text-xs tracking-wider h-8 px-3 rounded-none border-foreground/20 text-foreground hover:bg-foreground hover:text-background ${className}`}
        >
          <Globe className="w-3 h-3 mr-2" />
          {side === "left" ? currentLanguage.code.toUpperCase() : currentLanguage.native}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => {
              onChange(lang.code)
              setOpen(false)
            }}
            className="flex justify-between items-center"
          >
            <span>{lang.name}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {side === "left" ? lang.code.toUpperCase() : lang.native}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}