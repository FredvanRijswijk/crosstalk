import React from "react";
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { DualScreen } from "../components/DualScreen";
import { FadeInText } from "../components/AnimatedText";

// Estimated audio durations in frames (30fps). ~3-4s per sentence.
// These are conservative estimates; Remotion will just stop if clip ends early.
const AUDIO_DURATIONS: Record<string, number> = {
  "nl_01.mp3": 105, // "Hallo, ik ben Dr. van den Berg..."
  "es_01.mp3": 105, // translation
  "es_02.mp3": 120, // "Buenos días doctor..."
  "nl_02.mp3": 120, // translation
  "nl_03.mp3": 90,  // "Kunt u aanwijzen..."
  "es_03.mp3": 90,  // translation
  "es_04.mp3": 100, // "Aquí, en el lado izquierdo..."
  "nl_04.mp3": 90,  // translation
  "nl_05.mp3": 80,  // "Neemt u op dit moment..."
  "es_05.mp3": 90,  // translation
  "es_06.mp3": 80,  // "Sí, tomo metformina..."
  "nl_06.mp3": 80,  // translation
};

const GAP = 15; // ~0.5s gap between original and translation
const MSG_GAP = 25; // ~0.8s gap between conversation turns

// Build sequential timing: original → gap → translation → gap → next
// Each entry gets `delay` (when bubble appears) computed from accumulated time.
function buildConversation() {
  const raw = [
    {
      text: "Hallo, ik ben Dr. van den Berg. Wat kan ik voor u doen?",
      translation: "Hola, soy el Dr. van den Berg. ¿En qué puedo ayudarle?",
      side: "left" as const,
      latency: 340,
      audioOriginal: "nl_01.mp3",
      audioTranslation: "es_01.mp3",
    },
    {
      text: "Buenos días doctor. Tengo un dolor fuerte en el pecho desde ayer.",
      translation: "Goedemorgen dokter. Ik heb sinds gisteren sterke pijn op de borst.",
      side: "right" as const,
      latency: 290,
      audioOriginal: "es_02.mp3",
      audioTranslation: "nl_02.mp3",
    },
    {
      text: "Kunt u aanwijzen waar precies de pijn zit?",
      translation: "¿Puede señalar dónde exactamente siente el dolor?",
      side: "left" as const,
      latency: 260,
      audioOriginal: "nl_03.mp3",
      audioTranslation: "es_03.mp3",
    },
    {
      text: "Aquí, en el lado izquierdo. Se siente como presión.",
      translation: "Hier, aan de linkerkant. Het voelt als druk.",
      side: "right" as const,
      latency: 310,
      audioOriginal: "es_04.mp3",
      audioTranslation: "nl_04.mp3",
    },
    {
      text: "Neemt u op dit moment medicijnen?",
      translation: "¿Está tomando algún medicamento en este momento?",
      side: "left" as const,
      latency: 280,
      audioOriginal: "nl_05.mp3",
      audioTranslation: "es_05.mp3",
    },
    {
      text: "Sí, tomo metformina para la diabetes.",
      translation: "Ja, ik neem metformine voor diabetes.",
      side: "right" as const,
      latency: 250,
      audioOriginal: "es_06.mp3",
      audioTranslation: "nl_06.mp3",
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
        leftLang="NL — Dutch"
        rightLang="ES — Spanish"
        leftLabel="Dr. van den Berg"
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
