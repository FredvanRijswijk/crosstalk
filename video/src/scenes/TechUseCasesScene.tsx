import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { FadeInText } from "../components/AnimatedText";

const TECH = [
  { name: "Mistral AI", items: ["Voxstral Realtime (STT)", "Mistral Large (Translation)"], color: "#ff7000" },
  { name: "ElevenLabs", items: ["Flash v2.5 TTS", "Multi-language voices"], color: COLORS.accent },
  { name: "Next.js", items: ["Server-side streaming", "WebSocket real-time"], color: COLORS.fg },
];

const USE_CASES = [
  "Healthcare", "Emergency", "Business", "Travel", "Education", "Hospitality", "Immigration", "Elderly Care",
];

export const TechUseCasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOut = interpolate(frame, [320, 350], [1, 0], {
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
        gap: 48,
        opacity: fadeOut,
      }}
    >
      <FadeInText text="Powered by" fontSize={42} fontWeight={600} delay={3} />

      <div style={{ display: "flex", gap: 32 }}>
        {TECH.map((tech, i) => {
          const cardDelay = 15 + i * 15;
          const f = Math.max(0, frame - cardDelay);
          const scale = spring({ frame: f, fps, config: { damping: 15 } });
          const opacity = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={i}
              style={{
                width: 320,
                padding: 28,
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                opacity,
                transform: `scale(${interpolate(scale, [0, 1], [0.85, 1])})`,
              }}
            >
              <div style={{ fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700, color: tech.color }}>
                {tech.name}
              </div>
              {tech.items.map((item, j) => (
                <div
                  key={j}
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 15,
                    color: COLORS.mutedLight,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: tech.color, opacity: 0.6, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Use case pills */}
      <div
        style={{
          display: "flex",
          gap: 12,
          opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ fontFamily: FONTS.sans, fontSize: 15, color: COLORS.muted, display: "flex", alignItems: "center", marginRight: 8 }}>
          Built for
        </div>
        {USE_CASES.map((uc, i) => {
          const pillDelay = 80 + i * 6;
          const f = Math.max(0, frame - pillDelay);
          const s = spring({ frame: f, fps, config: { damping: 12 } });
          return (
            <div
              key={i}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 13,
                color: i === 0 ? COLORS.accent : COLORS.mutedLight,
                background: i === 0 ? `${COLORS.accent}15` : COLORS.card,
                border: `1px solid ${i === 0 ? `${COLORS.accent}40` : COLORS.cardBorder}`,
                padding: "6px 16px",
                borderRadius: 100,
                opacity: interpolate(s, [0, 1], [0, 1]),
                transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
              }}
            >
              {uc}
            </div>
          );
        })}
      </div>
    </div>
  );
};
