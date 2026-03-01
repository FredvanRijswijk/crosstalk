import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { CrossTalkLogo } from "../components/CrossTalkLogo";

export const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOut = interpolate(frame, [120, 145], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [40, 55], [20, 0], {
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
      <CrossTalkLogo scale={1.3} showTagline={true} delay={3} />

      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontFamily: FONTS.sans,
          fontSize: 24,
          color: COLORS.mutedLight,
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.6,
        }}
      >
        Two people. Two languages. One seamless conversation.
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          opacity: interpolate(frame, [60, 75], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {["EN", "ES", "FR", "DE", "IT", "PT", "AR", "ZH", "JA", "HI", "NL", "RU"].map((lang, i) => {
          const langDelay = 60 + i * 2;
          const f = Math.max(0, frame - langDelay);
          const s = spring({ frame: f, fps, config: { damping: 12 } });
          return (
            <div
              key={lang}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: COLORS.muted,
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                padding: "6px 12px",
                borderRadius: 8,
                transform: `scale(${interpolate(s, [0, 1], [0, 1])})`,
                opacity: interpolate(s, [0, 1], [0, 1]),
              }}
            >
              {lang}
            </div>
          );
        })}
      </div>
    </div>
  );
};
