import React from "react";
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { DualScreen } from "../components/DualScreen";
import { FadeInText } from "../components/AnimatedText";

// Estimated audio durations in frames (30fps). ~3-4s per sentence.
// These are conservative estimates; Remotion will just stop if clip ends early.
const AUDIO_DURATIONS: Record<string, number> = {
  "en_01.mp3": 100, // "Hello, I'm Dr. Thompson..."
  "es_01.mp3": 105, // translation
  "es_02.mp3": 120, // "Buenos días doctor..."
  "en_02.mp3": 110, // translation
  "en_03.mp3": 85,  // "Can you point to where..."
  "es_03.mp3": 90,  // translation
  "es_04.mp3": 100, // "Aquí, en el lado izquierdo..."
  "en_04.mp3": 85,  // translation
  "en_05.mp3": 80,  // "Are you currently taking..."
  "es_05.mp3": 90,  // translation
  "es_06.mp3": 80,  // "Sí, tomo metformina..."
  "en_06.mp3": 75,  // translation
};

const GAP = 15; // ~0.5s gap between original and translation
const MSG_GAP = 25; // ~0.8s gap between conversation turns

// Build sequential timing: original → gap → translation → gap → next
// Each entry gets `delay` (when bubble appears) computed from accumulated time.
function buildConversation() {
  const raw = [
    {
      text: "Hello, I'm Dr. Thompson. How can I help you today?",
      translation: "Hola, soy el Dr. Thompson. ¿En qué puedo ayudarle hoy?",
      side: "left" as const,
      latency: 340,
      audioOriginal: "en_01.mp3",
      audioTranslation: "es_01.mp3",
    },
    {
      text: "Buenos días doctor. Tengo un dolor fuerte en el pecho desde ayer.",
      translation: "Good morning doctor. I've had a sharp pain in my chest since yesterday.",
      side: "right" as const,
      latency: 290,
      audioOriginal: "es_02.mp3",
      audioTranslation: "en_02.mp3",
    },
    {
      text: "Can you point to where exactly it hurts?",
      translation: "¿Puede señalar dónde exactamente siente el dolor?",
      side: "left" as const,
      latency: 260,
      audioOriginal: "en_03.mp3",
      audioTranslation: "es_03.mp3",
    },
    {
      text: "Aquí, en el lado izquierdo. Se siente como presión.",
      translation: "Here, on the left side. It feels like pressure.",
      side: "right" as const,
      latency: 310,
      audioOriginal: "es_04.mp3",
      audioTranslation: "en_04.mp3",
    },
    {
      text: "Are you currently taking any medication?",
      translation: "¿Está tomando algún medicamento en este momento?",
      side: "left" as const,
      latency: 280,
      audioOriginal: "en_05.mp3",
      audioTranslation: "es_05.mp3",
    },
    {
      text: "Sí, tomo metformina para la diabetes.",
      translation: "Yes, I take metformin for diabetes.",
      side: "right" as const,
      latency: 250,
      audioOriginal: "es_06.mp3",
      audioTranslation: "en_06.mp3",
    },
  ];

  let cursor = 30; // initial delay before first message
  return raw.map((msg) => {
    const origDur = AUDIO_DURATIONS[msg.audioOriginal] ?? 100;
    const transDur = AUDIO_DURATIONS[msg.audioTranslation] ?? 100;

    const delay = cursor;
    // Timeline: original audio starts at `delay`,
    // translation audio starts after original finishes + gap
    const translationStart = delay + origDur + GAP;

    // Next message starts after translation finishes + message gap
    cursor = translationStart + transDur + MSG_GAP;

    return { ...msg, delay, translationStart };
  });
}

const CONVERSATION = buildConversation();
const DEMO_DELAY = 30;

export const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [1450, 1490], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        opacity: fadeIn * fadeOut,
      }}
    >
      <FadeInText
        text="Live conversation demo"
        fontSize={24}
        fontWeight={400}
        color={COLORS.muted}
        fontFamily={FONTS.mono}
        letterSpacing={4}
        delay={5}
      />

      <DualScreen
        messages={CONVERSATION}
        leftLang="EN — English"
        rightLang="ES — Spanish"
        leftLabel="Dr. Thompson"
        rightLabel="Patient"
        delay={DEMO_DELAY}
      />

      {/* Audio: original plays first, then translation after original finishes */}
      {CONVERSATION.map((msg, i) => {
        const origDur = AUDIO_DURATIONS[msg.audioOriginal] ?? 100;
        const transDur = AUDIO_DURATIONS[msg.audioTranslation] ?? 100;
        return (
          <React.Fragment key={i}>
            <Sequence from={msg.delay + DEMO_DELAY} durationInFrames={origDur + 10} layout="none">
              <Audio src={staticFile(`audio/${msg.audioOriginal}`)} volume={0.8} />
            </Sequence>
            <Sequence from={msg.translationStart + DEMO_DELAY} durationInFrames={transDur + 10} layout="none">
              <Audio src={staticFile(`audio/${msg.audioTranslation}`)} volume={0.7} />
            </Sequence>
          </React.Fragment>
        );
      })}
    </div>
  );
};
