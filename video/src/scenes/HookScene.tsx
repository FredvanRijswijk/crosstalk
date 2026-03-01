import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";
import { TypewriterText } from "../components/AnimatedText";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeOut = interpolate(frame, [260, 280], [1, 0], {
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
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accent}15, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />
      <TypewriterText
        text="What if language was never a barrier?"
        fontSize={56}
        fontWeight={300}
        color={COLORS.fg}
        delay={10}
        speed={1.8}
      />
    </div>
  );
};
