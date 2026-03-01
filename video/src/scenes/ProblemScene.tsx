import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { FadeInText } from "../components/AnimatedText";

const STATS = [
  { number: "25M+", label: "people face language barriers\nin healthcare yearly" },
  { number: "67%", label: "of medical errors involve\nmiscommunication" },
  { number: "240ms", label: "is all it takes to\nbreak that barrier" },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOut = interpolate(frame, [310, 340], [1, 0], {
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
        gap: 60,
        opacity: fadeOut,
      }}
    >
      <FadeInText
        text="The language barrier costs lives"
        fontSize={52}
        fontWeight={600}
        color={COLORS.fg}
        delay={5}
      />

      <div style={{ display: "flex", gap: 60, marginTop: 20 }}>
        {STATS.map((stat, i) => {
          const cardDelay = 20 + i * 18;
          const f = Math.max(0, frame - cardDelay);
          const scale = spring({ frame: f, fps, config: { damping: 15 } });
          const opacity = interpolate(f, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                opacity,
                transform: `scale(${interpolate(scale, [0, 1], [0.8, 1])})`,
                width: 340,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 72,
                  fontWeight: 700,
                  color: i === 2 ? COLORS.green : COLORS.accent,
                  lineHeight: 1,
                }}
              >
                {stat.number}
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 18,
                  color: COLORS.mutedLight,
                  textAlign: "center",
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
