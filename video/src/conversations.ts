/**
 * Conversation presets for the demo video.
 * Change SELECTED to switch between use cases.
 * Run `npx tsx video/scripts/generate-audio.ts` after switching to generate audio.
 */

export interface ConversationLine {
  text: string;
  translation: string;
  side: "left" | "right";
  latency: number;
  /** Estimated original audio duration in frames (30fps) */
  origDur: number;
  /** Estimated translation audio duration in frames (30fps) */
  transDur: number;
}

export interface ConversationPreset {
  id: string;
  leftLabel: string;
  rightLabel: string;
  leftLang: string;
  rightLang: string;
  leftLangCode: string;
  rightLangCode: string;
  lines: ConversationLine[];
}

/* ── Healthcare: EN ↔ ES ── */
const healthcare: ConversationPreset = {
  id: "healthcare",
  leftLabel: "Dr. Thompson",
  rightLabel: "Patient",
  leftLang: "EN — English",
  rightLang: "ES — Spanish",
  leftLangCode: "en",
  rightLangCode: "es",
  lines: [
    {
      text: "Hello, I'm Dr. Thompson. How can I help you today?",
      translation: "Hola, soy el Dr. Thompson. ¿En qué puedo ayudarle hoy?",
      side: "left", latency: 340, origDur: 86, transDur: 91,
    },
    {
      text: "Buenos días doctor. Tengo un dolor fuerte en el pecho desde ayer.",
      translation: "Good morning doctor. I've had a sharp pain in my chest since yesterday.",
      side: "right", latency: 290, origDur: 119, transDur: 119,
    },
    {
      text: "Can you point to where exactly it hurts?",
      translation: "¿Puede señalar dónde exactamente siente el dolor?",
      side: "left", latency: 260, origDur: 61, transDur: 93,
    },
    {
      text: "Aquí, en el lado izquierdo. Se siente como presión.",
      translation: "Here, on the left side. It feels like pressure.",
      side: "right", latency: 310, origDur: 108, transDur: 87,
    },
    {
      text: "Are you currently taking any medication?",
      translation: "¿Está tomando algún medicamento en este momento?",
      side: "left", latency: 280, origDur: 66, transDur: 82,
    },
    {
      text: "Sí, tomo metformina para la diabetes.",
      translation: "Yes, I take metformin for diabetes.",
      side: "right", latency: 250, origDur: 76, transDur: 75,
    },
    {
      text: "How long have you had diabetes? Any family history of heart disease?",
      translation: "¿Cuánto tiempo lleva con diabetes? ¿Antecedentes familiares de enfermedades cardíacas?",
      side: "left", latency: 320, origDur: 126, transDur: 158,
    },
    {
      text: "Cinco años. Mi padre tuvo problemas del corazón.",
      translation: "Five years. My father had heart problems.",
      side: "right", latency: 270, origDur: 86, transDur: 77,
    },
    {
      text: "I'd like to run an ECG and some blood tests. Please try to stay calm.",
      translation: "Me gustaría hacer un ECG y análisis de sangre. Intente mantener la calma.",
      side: "left", latency: 300, origDur: 120, transDur: 170,
    },
    {
      text: "Gracias doctor. ¿Cree que es algo grave?",
      translation: "Thank you doctor. Do you think it's something serious?",
      side: "right", latency: 240, origDur: 66, transDur: 104,
    },
  ],
};

/* ── Business: EN ↔ FR ── */
const business: ConversationPreset = {
  id: "business",
  leftLabel: "CEO — London",
  rightLabel: "Directeur — Paris",
  leftLang: "EN — English",
  rightLang: "FR — French",
  leftLangCode: "en",
  rightLangCode: "fr",
  lines: [
    {
      text: "Welcome everyone. Let's review the Q3 partnership proposal.",
      translation: "Bienvenue à tous. Passons en revue la proposition de partenariat du T3.",
      side: "left", latency: 310, origDur: 90, transDur: 100,
    },
    {
      text: "Merci. Notre équipe a analysé les synergies potentielles avec votre marché européen.",
      translation: "Thank you. Our team has analyzed the potential synergies with your European market.",
      side: "right", latency: 280, origDur: 110, transDur: 95,
    },
    {
      text: "What's the projected revenue impact for the first year?",
      translation: "Quel est l'impact projeté sur le chiffre d'affaires pour la première année?",
      side: "left", latency: 260, origDur: 80, transDur: 100,
    },
    {
      text: "Nous estimons une croissance de quinze pour cent du revenu combiné.",
      translation: "We estimate a fifteen percent growth in combined revenue.",
      side: "right", latency: 300, origDur: 95, transDur: 80,
    },
    {
      text: "That's promising. What about the integration timeline?",
      translation: "C'est prometteur. Qu'en est-il du calendrier d'intégration?",
      side: "left", latency: 250, origDur: 75, transDur: 85,
    },
    {
      text: "Six mois pour l'intégration technique, neuf mois pour le déploiement complet.",
      translation: "Six months for technical integration, nine months for full deployment.",
      side: "right", latency: 290, origDur: 100, transDur: 85,
    },
    {
      text: "We'll need to align our legal teams on the IP framework.",
      translation: "Il faudra coordonner nos équipes juridiques sur le cadre de propriété intellectuelle.",
      side: "left", latency: 270, origDur: 85, transDur: 110,
    },
    {
      text: "Absolument. Nous pouvons programmer une réunion la semaine prochaine.",
      translation: "Absolutely. We can schedule a meeting next week.",
      side: "right", latency: 240, origDur: 90, transDur: 70,
    },
  ],
};

/* ── Travel: EN ↔ JA ── */
const travel: ConversationPreset = {
  id: "travel",
  leftLabel: "Tourist",
  rightLabel: "Hotel Staff",
  leftLang: "EN — English",
  rightLang: "JA — Japanese",
  leftLangCode: "en",
  rightLangCode: "ja",
  lines: [
    {
      text: "Hi, I have a reservation under the name Williams for three nights.",
      translation: "こんにちは、ウィリアムズの名前で3泊の予約があります。",
      side: "left", latency: 320, origDur: 90, transDur: 100,
    },
    {
      text: "はい、ウィリアムズ様ですね。お部屋は12階のオーシャンビューです。",
      translation: "Yes, Mr. Williams. Your room is on the 12th floor with an ocean view.",
      side: "right", latency: 280, origDur: 100, transDur: 90,
    },
    {
      text: "That sounds wonderful. Is breakfast included?",
      translation: "素晴らしいですね。朝食は含まれていますか？",
      side: "left", latency: 250, origDur: 70, transDur: 80,
    },
    {
      text: "はい、7時から10時まで2階のレストランでお召し上がりいただけます。",
      translation: "Yes, you can enjoy it at the restaurant on the 2nd floor from 7 to 10 AM.",
      side: "right", latency: 300, origDur: 100, transDur: 95,
    },
    {
      text: "Could you recommend a good local restaurant for dinner tonight?",
      translation: "今夜のディナーにおすすめの地元のレストランはありますか？",
      side: "left", latency: 270, origDur: 85, transDur: 90,
    },
    {
      text: "はい、近くに素晴らしい寿司店があります。予約をお取りしましょうか？",
      translation: "Yes, there's an excellent sushi restaurant nearby. Shall I make a reservation?",
      side: "right", latency: 260, origDur: 95, transDur: 85,
    },
  ],
};

/* ── Timing helpers ── */
const GAP = 10;     // ~0.33s between original and translation
const MSG_GAP = 15;  // ~0.5s between conversation turns

export interface TimedLine extends ConversationLine {
  delay: number;
  translationStart: number;
  audioOriginal: string;
  audioTranslation: string;
}

export function buildTimedConversation(preset: ConversationPreset): {
  lines: TimedLine[];
  totalFrames: number;
} {
  let cursor = 30;
  const lines = preset.lines.map((line, i) => {
    const idx = String(i + 1).padStart(2, "0");
    const origLang = line.side === "left" ? preset.leftLangCode : preset.rightLangCode;
    const transLang = line.side === "left" ? preset.rightLangCode : preset.leftLangCode;

    const delay = cursor;
    const translationStart = delay + line.origDur + GAP;
    cursor = translationStart + line.transDur + (i < preset.lines.length - 1 ? MSG_GAP : 0);

    return {
      ...line,
      delay,
      translationStart,
      audioOriginal: `${preset.id}_${origLang}_${idx}.mp3`,
      audioTranslation: `${preset.id}_${transLang}_t${idx}.mp3`,
    };
  });

  return { lines, totalFrames: cursor + 50 }; // +50 for fade buffer
}

/* ── Exports ── */
export const PRESETS = { healthcare, business, travel } as const;
export type PresetId = keyof typeof PRESETS;

/** Change this to switch the demo conversation */
export const SELECTED: PresetId = "healthcare";

export function getSelected() {
  const preset = PRESETS[SELECTED];
  return { preset, ...buildTimedConversation(preset) };
}
