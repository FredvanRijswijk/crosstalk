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

const ADAM = "pNInz6obpgDQGcFmaJgB"; // male — Dutch originals
const BELLA = "EXAVITQu4vr4xnSDxMaL"; // female — Spanish originals
const MODEL = "eleven_multilingual_v2";
const OUT_DIR = join(__dirname, "..", "public", "audio");

interface Line {
  text: string;
  voice: string;
  file: string;
}

const LINES: Line[] = [
  // Originals
  { text: "Hallo, ik ben Dr. van den Berg. Wat kan ik voor u doen?", voice: ADAM, file: "nl_01.mp3" },
  { text: "Buenos días doctor. Tengo un dolor fuerte en el pecho desde ayer.", voice: BELLA, file: "es_02.mp3" },
  { text: "Kunt u aanwijzen waar precies de pijn zit?", voice: ADAM, file: "nl_03.mp3" },
  { text: "Aquí, en el lado izquierdo. Se siente como presión.", voice: BELLA, file: "es_04.mp3" },
  { text: "Neemt u op dit moment medicijnen?", voice: ADAM, file: "nl_05.mp3" },
  { text: "Sí, tomo metformina para la diabetes.", voice: BELLA, file: "es_06.mp3" },
  // Translations
  { text: "Hola, soy el Dr. van den Berg. ¿En qué puedo ayudarle?", voice: BELLA, file: "es_01.mp3" },
  { text: "Goedemorgen dokter. Ik heb sinds gisteren sterke pijn op de borst.", voice: ADAM, file: "nl_02.mp3" },
  { text: "¿Puede señalar dónde exactamente siente el dolor?", voice: BELLA, file: "es_03.mp3" },
  { text: "Hier, aan de linkerkant. Het voelt als druk.", voice: ADAM, file: "nl_04.mp3" },
  { text: "¿Está tomando algún medicamento en este momento?", voice: BELLA, file: "es_05.mp3" },
  { text: "Ja, ik neem metformine voor diabetes.", voice: ADAM, file: "nl_06.mp3" },
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

  const buffer = Buffer.from(await res.arrayBuffer());
  const outPath = join(OUT_DIR, line.file);
  writeFileSync(outPath, buffer);
  console.log(`✓ ${line.file} (${buffer.length} bytes)`);
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
