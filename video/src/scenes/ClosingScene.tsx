import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { CrossTalkLogo } from "../components/CrossTalkLogo";

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline
  const tagDelay = 80;
  const tagF = Math.max(0, frame - tagDelay);
  const tagOpacity = interpolate(tagF, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagY = interpolate(tagF, [0, 30], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA
  const ctaDelay = 120;
  const ctaF = Math.max(0, frame - ctaDelay);
  const ctaOpacity = interpolate(ctaF, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaScale = spring({ frame: ctaF, fps, config: { damping: 14, stiffness: 100 } });

  // URL / info
  const infoDelay = 160;
  const infoF = Math.max(0, frame - infoDelay);
  const infoOpacity = interpolate(infoF, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hackathon badge
  const badgeDelay = 180;
  const badgeF = Math.max(0, frame - badgeDelay);
  const badgeScale = spring({ frame: badgeF, fps, config: { damping: 12 } });

  // Gradient orbs
  const orb1 = interpolate(frame, [0, 300], [0, 1], {
    extrapolateRight: "clamp",
  });
  const orb2 = interpolate(frame, [30, 300], [0, 1], {
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
        gap: 40,
        opacity: fadeIn,
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.gradient1}10, transparent 60%)`,
          filter: "blur(120px)",
          opacity: orb1,
          left: "10%",
          top: "-20%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.gradient3}10, transparent 60%)`,
          filter: "blur(120px)",
          opacity: orb2,
          right: "10%",
          bottom: "-20%",
        }}
      />

      <CrossTalkLogo scale={1.5} showTagline={false} delay={10} />

      <div
        style={{
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          fontFamily: FONTS.sans,
          fontSize: 32,
          fontWeight: 300,
          color: COLORS.mutedLight,
          textAlign: "center",
          maxWidth: 800,
          lineHeight: 1.5,
        }}
      >
        Breaking language barriers,{"\n"}one conversation at a time.
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${interpolate(ctaScale, [0, 1], [0.9, 1])})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 42,
            fontWeight: 700,
            color: COLORS.fg,
            letterSpacing: -1,
          }}
        >
          Try it now
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 28,
            fontWeight: 400,
            color: COLORS.accent,
            letterSpacing: 2,
          }}
        >
          crosstalk.today
        </div>
      </div>

      <div
        style={{
          opacity: infoOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            color: COLORS.muted,
            letterSpacing: 2,
          }}
        >
          Open source · Free to use
        </div>
      </div>

      <div
        style={{
          transform: `scale(${interpolate(badgeScale, [0, 1], [0, 1])})`,
          opacity: interpolate(badgeScale, [0, 1], [0, 1]),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
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
