import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { FadeInText } from "../components/AnimatedText";

const STEPS = [
  { icon: "mic", title: "Speech Capture", subtitle: "WebSocket streaming", color: COLORS.accent, latency: "" },
  { icon: "transcribe", title: "Voxstral Realtime", subtitle: "Mistral speech-to-text", color: "#f59e0b", latency: "~200ms" },
  { icon: "translate", title: "Mistral Large", subtitle: "Context-aware translation", color: COLORS.gradient2, latency: "~150ms" },
  { icon: "speaker", title: "ElevenLabs TTS", subtitle: "Natural voice synthesis", color: COLORS.gradient3, latency: "~100ms" },
];

const IconSvg: React.FC<{ type: string; color: string }> = ({ type, color }) => {
  const props = { width: 32, height: 32, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.5 };
  switch (type) {
    case "mic":
      return <svg {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>;
    case "transcribe":
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 10h8" /><path d="M8 14h4" /></svg>;
    case "translate":
      return <svg {...props}><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>;
    case "speaker":
      return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>;
    default:
      return null;
  }
};

export const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOut = interpolate(frame, [200, 230], [1, 0], {
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
      <FadeInText text="How it works" fontSize={48} fontWeight={600} delay={3} />

      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {STEPS.map((step, i) => {
          const stepDelay = 20 + i * 30;
          const f = Math.max(0, frame - stepDelay);
          const scale = spring({ frame: f, fps, config: { damping: 15, stiffness: 100 } });
          const opacity = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const arrowF = Math.max(0, frame - stepDelay - 20);
          const arrowOpacity = interpolate(arrowF, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const arrowX = interpolate(arrowF, [0, 15], [-15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  opacity,
                  transform: `scale(${interpolate(scale, [0, 1], [0.7, 1])})`,
                  width: 240,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    background: `${step.color}15`,
                    border: `1.5px solid ${step.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSvg type={step.icon} color={step.color} />
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600, color: COLORS.fg, textAlign: "center" }}>
                  {step.title}
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, textAlign: "center" }}>
                  {step.subtitle}
                </div>
                {step.latency && (
                  <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.green, background: `${COLORS.green}15`, padding: "3px 10px", borderRadius: 6 }}>
                    {step.latency}
                  </div>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ opacity: arrowOpacity, transform: `translateX(${arrowX}px)`, marginTop: -36 }}>
                  <svg width="40" height="20" viewBox="0 0 48 24" fill="none">
                    <path d="M4 12h32m0 0l-8-8m8 8l-8 8" stroke={COLORS.cardBorder} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Total latency */}
      {frame > 140 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: interpolate(frame, [140, 155], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ fontFamily: FONTS.sans, fontSize: 15, color: COLORS.muted, letterSpacing: 2, textTransform: "uppercase" }}>
            Total end-to-end latency
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 52,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.accent})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            240 — 500ms
          </div>
        </div>
      )}
    </div>
  );
};
