import React from "react";
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { DualScreen } from "../components/DualScreen";
import { FadeInText } from "../components/AnimatedText";
import { getSelected } from "../conversations";

const { preset, lines, totalFrames } = getSelected();

/** Exported so CrossTalkVideo can compute scene durations dynamically */
export const DEMO_TOTAL_FRAMES = totalFrames;

const DEMO_DELAY = 30;

export const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [totalFrames - 40, totalFrames - 10], [1, 0], {
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
        delay={3}
      />

      <DualScreen
        messages={lines}
        leftLang={preset.leftLang}
        rightLang={preset.rightLang}
        leftLabel={preset.leftLabel}
        rightLabel={preset.rightLabel}
        delay={DEMO_DELAY}
      />

      {/* Audio: original plays, then translation after gap */}
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          <Sequence from={line.delay + DEMO_DELAY} durationInFrames={line.origDur + 15} layout="none">
            <Audio src={staticFile(`audio/${line.audioOriginal}`)} volume={0.8} />
          </Sequence>
          <Sequence from={line.translationStart + DEMO_DELAY} durationInFrames={line.transDur + 15} layout="none">
            <Audio src={staticFile(`audio/${line.audioTranslation}`)} volume={0.7} />
          </Sequence>
        </React.Fragment>
      ))}
    </div>
  );
};
