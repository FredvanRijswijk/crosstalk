/**
 * Generate ElevenLabs TTS audio for all conversation presets + narrator.
 *
 * Usage:
 *   npx tsx video/scripts/generate-audio.ts                  # all presets + narrator
 *   npx tsx video/scripts/generate-audio.ts healthcare        # single preset
 *   npx tsx video/scripts/generate-audio.ts narrator           # narrator only
 *
 * Requires ELEVENLABS_API_KEY env var.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY");
  process.exit(1);
}

// Voices
const ADAM = "pNInz6obpgDQGcFmaJgB";   // male
const BELLA = "EXAVITQu4vr4xnSDxMaL";  // female
const NARRATOR = "onwK4e9ZLuTAKqWW03F9"; // Daniel — calm narrator
const MODEL = "eleven_multilingual_v2";
const OUT_DIR = join(__dirname, "..", "public", "audio");

interface Line { text: string; voice: string; file: string }

// Voice mapping per language
const VOICE_MAP: Record<string, string> = {
  en: ADAM,
  es: BELLA,
  fr: BELLA,
  ja: BELLA,
};

function getVoice(langCode: string): string {
  return VOICE_MAP[langCode] ?? ADAM;
}

/* ── Conversation lines ── */

interface RawPreset {
  id: string;
  leftLangCode: string;
  rightLangCode: string;
  lines: { text: string; translation: string; side: "left" | "right" }[];
}

const PRESETS: RawPreset[] = [
  {
    id: "healthcare",
    leftLangCode: "en",
    rightLangCode: "es",
    lines: [
      { text: "Hello, I'm Dr. Thompson. How can I help you today?", translation: "Hola, soy el Dr. Thompson. ¿En qué puedo ayudarle hoy?", side: "left" },
      { text: "Buenos días doctor. Tengo un dolor fuerte en el pecho desde ayer.", translation: "Good morning doctor. I've had a sharp pain in my chest since yesterday.", side: "right" },
      { text: "Can you point to where exactly it hurts?", translation: "¿Puede señalar dónde exactamente siente el dolor?", side: "left" },
      { text: "Aquí, en el lado izquierdo. Se siente como presión.", translation: "Here, on the left side. It feels like pressure.", side: "right" },
      { text: "Are you currently taking any medication?", translation: "¿Está tomando algún medicamento en este momento?", side: "left" },
      { text: "Sí, tomo metformina para la diabetes.", translation: "Yes, I take metformin for diabetes.", side: "right" },
      { text: "How long have you had diabetes? Any family history of heart disease?", translation: "¿Cuánto tiempo lleva con diabetes? ¿Antecedentes familiares de enfermedades cardíacas?", side: "left" },
      { text: "Cinco años. Mi padre tuvo problemas del corazón.", translation: "Five years. My father had heart problems.", side: "right" },
      { text: "I'd like to run an ECG and some blood tests. Please try to stay calm.", translation: "Me gustaría hacer un ECG y análisis de sangre. Intente mantener la calma.", side: "left" },
      { text: "Gracias doctor. ¿Cree que es algo grave?", translation: "Thank you doctor. Do you think it's something serious?", side: "right" },
    ],
  },
  {
    id: "business",
    leftLangCode: "en",
    rightLangCode: "fr",
    lines: [
      { text: "Welcome everyone. Let's review the Q3 partnership proposal.", translation: "Bienvenue à tous. Passons en revue la proposition de partenariat du T3.", side: "left" },
      { text: "Merci. Notre équipe a analysé les synergies potentielles avec votre marché européen.", translation: "Thank you. Our team has analyzed the potential synergies with your European market.", side: "right" },
      { text: "What's the projected revenue impact for the first year?", translation: "Quel est l'impact projeté sur le chiffre d'affaires pour la première année?", side: "left" },
      { text: "Nous estimons une croissance de quinze pour cent du revenu combiné.", translation: "We estimate a fifteen percent growth in combined revenue.", side: "right" },
      { text: "That's promising. What about the integration timeline?", translation: "C'est prometteur. Qu'en est-il du calendrier d'intégration?", side: "left" },
      { text: "Six mois pour l'intégration technique, neuf mois pour le déploiement complet.", translation: "Six months for technical integration, nine months for full deployment.", side: "right" },
      { text: "We'll need to align our legal teams on the IP framework.", translation: "Il faudra coordonner nos équipes juridiques sur le cadre de propriété intellectuelle.", side: "left" },
      { text: "Absolument. Nous pouvons programmer une réunion la semaine prochaine.", translation: "Absolutely. We can schedule a meeting next week.", side: "right" },
    ],
  },
  {
    id: "travel",
    leftLangCode: "en",
    rightLangCode: "ja",
    lines: [
      { text: "Hi, I have a reservation under the name Williams for three nights.", translation: "こんにちは、ウィリアムズの名前で3泊の予約があります。", side: "left" },
      { text: "はい、ウィリアムズ様ですね。お部屋は12階のオーシャンビューです。", translation: "Yes, Mr. Williams. Your room is on the 12th floor with an ocean view.", side: "right" },
      { text: "That sounds wonderful. Is breakfast included?", translation: "素晴らしいですね。朝食は含まれていますか？", side: "left" },
      { text: "はい、7時から10時まで2階のレストランでお召し上がりいただけます。", translation: "Yes, you can enjoy it at the restaurant on the 2nd floor from 7 to 10 AM.", side: "right" },
      { text: "Could you recommend a good local restaurant for dinner tonight?", translation: "今夜のディナーにおすすめの地元のレストランはありますか？", side: "left" },
      { text: "はい、近くに素晴らしい寿司店があります。予約をお取りしましょうか？", translation: "Yes, there's an excellent sushi restaurant nearby. Shall I make a reservation?", side: "right" },
    ],
  },
];

function buildLines(preset: RawPreset): Line[] {
  const result: Line[] = [];
  preset.lines.forEach((line, i) => {
    const idx = String(i + 1).padStart(2, "0");
    const origLang = line.side === "left" ? preset.leftLangCode : preset.rightLangCode;
    const transLang = line.side === "left" ? preset.rightLangCode : preset.leftLangCode;

    result.push({ text: line.text, voice: getVoice(origLang), file: `${preset.id}_${origLang}_${idx}.mp3` });
    result.push({ text: line.translation, voice: getVoice(transLang), file: `${preset.id}_${transLang}_t${idx}.mp3` });
  });
  return result;
}

/* ── Narrator lines ── */
const NARRATOR_LINES: Line[] = [
  {
    text: "What if language was never a barrier? Twenty-five million people face language barriers in healthcare every year in Europe alone.",
    voice: NARRATOR,
    file: "narrator_hook.mp3",
  },
  {
    text: "Sixty-seven percent of medical errors involve miscommunication. CrossTalk changes that with real-time voice translation in under five hundred milliseconds.",
    voice: NARRATOR,
    file: "narrator_problem.mp3",
  },
  {
    text: "Here's how it works. Speech is captured and streamed to Mistral's Voxstral for transcription, then translated by Mistral Large, and spoken back naturally through ElevenLabs.",
    voice: NARRATOR,
    file: "narrator_pipeline.mp3",
  },
  {
    text: "Try CrossTalk today. Open source, free to use, built at the Mistral AI Worldwide Hackathon in London.",
    voice: NARRATOR,
    file: "narrator_closing.mp3",
  },
  {
    text: "Powered by Fred.",
    voice: NARRATOR,
    file: "narrator_fred.mp3",
  },
  {
    text: "Powered by Mistral AI, ElevenLabs, and Next.js.",
    voice: NARRATOR,
    file: "narrator_tech.mp3",
  },
];

/* ── API call ── */
async function generateAudio(line: Line): Promise<void> {
  const outPath = join(OUT_DIR, line.file);
  if (existsSync(outPath)) {
    console.log(`  skip ${line.file} (exists)`);
    return;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${line.voice}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: line.text,
      model_id: MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status} for ${line.file}: ${err}`);
  }

  const buffer = new Uint8Array(await res.arrayBuffer());
  writeFileSync(outPath, buffer);
  console.log(`  ✓ ${line.file} (${buffer.byteLength} bytes)`);
}

/* ── Main ── */
async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const filter = process.argv[2]; // optional: preset id or "narrator"

  // Narrator
  if (!filter || filter === "narrator") {
    console.log(`\nNarrator (${NARRATOR_LINES.length} files):`);
    for (const line of NARRATOR_LINES) {
      await generateAudio(line);
    }
  }

  // Conversation presets
  for (const preset of PRESETS) {
    if (filter && filter !== "narrator" && filter !== preset.id) continue;
    const lines = buildLines(preset);
    console.log(`\n${preset.id} (${lines.length} files):`);
    for (const line of lines) {
      await generateAudio(line);
    }
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
