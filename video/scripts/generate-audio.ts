/**
 * Generate ElevenLabs TTS audio for the demo conversation.
 * Run: npx tsx video/scripts/generate-audio.ts
 *
 * Requires ELEVENLABS_API_KEY env var.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY");
  process.exit(1);
}

const ADAM = "pNInz6obpgDQGcFmaJgB"; // male — English doctor
const BELLA = "EXAVITQu4vr4xnSDxMaL"; // female — Spanish patient
const MODEL = "eleven_multilingual_v2";
const OUT_DIR = join(__dirname, "..", "public", "audio");

interface Line {
  text: string;
  voice: string;
  file: string;
}

const LINES: Line[] = [
  // English originals (doctor)
  { text: "Hello, I'm Dr. Thompson. How can I help you today?", voice: ADAM, file: "en_01.mp3" },
  { text: "Can you point to where exactly it hurts?", voice: ADAM, file: "en_03.mp3" },
  { text: "Are you currently taking any medication?", voice: ADAM, file: "en_05.mp3" },
  // Spanish originals (patient)
  { text: "Buenos días doctor. Tengo un dolor fuerte en el pecho desde ayer.", voice: BELLA, file: "es_02.mp3" },
  { text: "Aquí, en el lado izquierdo. Se siente como presión.", voice: BELLA, file: "es_04.mp3" },
  { text: "Sí, tomo metformina para la diabetes.", voice: BELLA, file: "es_06.mp3" },
  // Spanish translations (of doctor's English)
  { text: "Hola, soy el Dr. Thompson. ¿En qué puedo ayudarle hoy?", voice: BELLA, file: "es_01.mp3" },
  { text: "¿Puede señalar dónde exactamente siente el dolor?", voice: BELLA, file: "es_03.mp3" },
  { text: "¿Está tomando algún medicamento en este momento?", voice: BELLA, file: "es_05.mp3" },
  // English translations (of patient's Spanish)
  { text: "Good morning doctor. I've had a sharp pain in my chest since yesterday.", voice: ADAM, file: "en_02.mp3" },
  { text: "Here, on the left side. It feels like pressure.", voice: ADAM, file: "en_04.mp3" },
  { text: "Yes, I take metformin for diabetes.", voice: ADAM, file: "en_06.mp3" },
];

async function generateAudio(line: Line): Promise<void> {
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
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs error ${res.status} for ${line.file}: ${err}`);
  }

  const buffer = new Uint8Array(await res.arrayBuffer());
  const outPath = join(OUT_DIR, line.file);
  writeFileSync(outPath, buffer);
  console.log(`✓ ${line.file} (${buffer.byteLength} bytes)`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${LINES.length} audio files...\n`);

  // Process sequentially to avoid rate limits
  for (const line of LINES) {
    await generateAudio(line);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
