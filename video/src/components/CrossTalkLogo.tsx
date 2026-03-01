import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

export const CrossTalkLogo: React.FC<{
  scale?: number;
  showTagline?: boolean;
  delay?: number;
}> = ({ scale = 1, showTagline = true, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const logoScale = spring({ frame: f, fps, config: { damping: 15, stiffness: 80 } });
  const textOpacity = interpolate(f, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(f, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(f, [30, 50], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16 * scale,
        transform: `scale(${scale})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            transform: `scale(${logoScale})`,
            width: 80,
            height: 80,
            borderRadius: 18,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img src={staticFile("icon.svg")} style={{ width: 80, height: 80, objectFit: "cover" }} />
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 64,
            fontWeight: 700,
            color: COLORS.fg,
            letterSpacing: -2,
            opacity: textOpacity,
          }}
        >
          CrossTalk
        </div>
      </div>
      {showTagline && (
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            fontWeight: 400,
            color: COLORS.mutedLight,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Real-time voice translation
        </div>
      )}
    </div>
  );
};
