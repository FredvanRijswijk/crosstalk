import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

export const TypewriterText: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  delay?: number;
  speed?: number;
  fontWeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right";
}> = ({
  text,
  fontSize = 48,
  color = COLORS.fg,
  fontFamily = FONTS.sans,
  delay = 0,
  speed = 1.5,
  fontWeight = 400,
  letterSpacing = 0,
  textAlign = "center",
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const charsToShow = Math.floor(f * speed);
  const displayText = text.slice(0, Math.min(charsToShow, text.length));

  const cursorOpacity = f > text.length / speed ? (Math.floor(f / 15) % 2 === 0 ? 1 : 0) : 1;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        textAlign,
        lineHeight: 1.4,
      }}
    >
      {displayText}
      <span style={{ opacity: cursorOpacity, color: COLORS.accent }}>|</span>
    </div>
  );
};

export const FadeInText: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  delay?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  maxWidth?: number;
}> = ({
  text,
  fontSize = 48,
  color = COLORS.fg,
  fontFamily = FONTS.sans,
  delay = 0,
  fontWeight = 400,
  letterSpacing = 0,
  lineHeight = 1.4,
  textAlign = "center",
  maxWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const opacity = interpolate(f, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = spring({ frame: f, fps, config: { damping: 20, stiffness: 100 } });
  const translateY = interpolate(y, [0, 1], [30, 0]);

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        lineHeight,
        textAlign,
        opacity,
        transform: `translateY(${translateY}px)`,
        maxWidth,
      }}
    >
      {text}
    </div>
  );
};

export const WordByWordText: React.FC<{
  words: string[];
  fontSize?: number;
  color?: string;
  highlightColor?: string;
  fontFamily?: string;
  delay?: number;
  interval?: number;
  fontWeight?: number;
}> = ({
  words,
  fontSize = 48,
  color = COLORS.fg,
  highlightColor = COLORS.accent,
  fontFamily = FONTS.sans,
  delay = 0,
  interval = 8,
  fontWeight = 600,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const currentWordIndex = Math.floor(f / interval);

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        display: "flex",
        flexWrap: "wrap",
        gap: "0 14px",
        justifyContent: "center",
      }}
    >
      {words.map((word, i) => {
        const isVisible = i <= currentWordIndex;
        const isCurrent = i === currentWordIndex;
        return (
          <span
            key={i}
            style={{
              color: isCurrent ? highlightColor : color,
              opacity: isVisible ? 1 : 0,
              transform: `translateY(${isVisible ? 0 : 10}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
