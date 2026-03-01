import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { CrossTalkLogo } from "../components/CrossTalkLogo";

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA
  const ctaDelay = 50;
  const ctaF = Math.max(0, frame - ctaDelay);
  const ctaScale = spring({ frame: ctaF, fps, config: { damping: 14, stiffness: 100 } });
  const ctaOpacity = interpolate(ctaF, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Badge
  const badgeDelay = 100;
  const badgeF = Math.max(0, frame - badgeDelay);
  const badgeScale = spring({ frame: badgeF, fps, config: { damping: 12 } });

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
        gap: 32,
        opacity: fadeIn,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.gradient1}10, transparent 60%)`,
          filter: "blur(120px)",
        }}
      />

      <CrossTalkLogo scale={1.4} showTagline={false} delay={5} />

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${interpolate(ctaScale, [0, 1], [0.9, 1])})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontFamily: FONTS.sans, fontSize: 44, fontWeight: 700, color: COLORS.fg, letterSpacing: -1 }}>
          Try it now
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 30, color: COLORS.accent, letterSpacing: 2 }}>
          crosstalk.today
        </div>
      </div>

      {/* Badge */}
      <div
        style={{
          transform: `scale(${interpolate(badgeScale, [0, 1], [0, 1])})`,
          opacity: interpolate(badgeScale, [0, 1], [0, 1]),
          marginTop: 12,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            color: COLORS.accent,
            background: `${COLORS.accent}15`,
            border: `1px solid ${COLORS.accent}30`,
            padding: "8px 24px",
            borderRadius: 100,
          }}
        >
          Mistral AI Worldwide Hackathon — London
        </div>
      </div>
    </div>
  );
};
