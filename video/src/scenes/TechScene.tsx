import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { FadeInText } from "../components/AnimatedText";

const TECH = [
  { name: "Mistral AI", items: ["Voxstral Realtime (STT)", "Mistral Large (Translation)"], color: "#ff7000" },
  { name: "ElevenLabs", items: ["Flash v2.5 TTS", "Multi-language voices"], color: COLORS.accent },
  { name: "Next.js + React", items: ["Server-side streaming", "WebSocket real-time"], color: COLORS.fg },
];

const FEATURES = [
  "13 languages supported",
  "Auto language detection",
  "8 domain-specific contexts",
  "Male & female voice options",
  "Conversation summaries",
];

export const TechScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOut = interpolate(frame, [280, 310], [1, 0], {
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
        gap: 56,
        opacity: fadeOut,
      }}
    >
      <FadeInText text="Powered by" fontSize={42} fontWeight={600} delay={5} />

      <div style={{ display: "flex", gap: 40 }}>
        {TECH.map((tech, i) => {
          const cardDelay = 25 + i * 20;
          const f = Math.max(0, frame - cardDelay);
          const scale = spring({ frame: f, fps, config: { damping: 15 } });
          const opacity = interpolate(f, [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                width: 340,
                padding: 32,
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                opacity,
                transform: `scale(${interpolate(scale, [0, 1], [0.85, 1])})`,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 24,
                  fontWeight: 700,
                  color: tech.color,
                }}
              >
                {tech.name}
              </div>
              {tech.items.map((item, j) => (
                <div
                  key={j}
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 16,
                    color: COLORS.mutedLight,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: tech.color,
                      opacity: 0.6,
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {FEATURES.map((feat, i) => {
          const pillDelay = 100 + i * 10;
          const f = Math.max(0, frame - pillDelay);
          const s = spring({ frame: f, fps, config: { damping: 12 } });
          return (
            <div
              key={i}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: COLORS.mutedLight,
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                padding: "8px 20px",
                borderRadius: 100,
                opacity: interpolate(s, [0, 1], [0, 1]),
                transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
              }}
            >
              {feat}
            </div>
          );
        })}
      </div>
    </div>
  );
};
