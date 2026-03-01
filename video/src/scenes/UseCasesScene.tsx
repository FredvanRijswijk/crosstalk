import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { FadeInText } from "../components/AnimatedText";

const USE_CASES = [
  { icon: "heart", label: "Healthcare", desc: "Doctor-patient consultations" },
  { icon: "alert", label: "Emergency", desc: "First responder communication" },
  { icon: "plane", label: "Travel", desc: "Tourist assistance" },
  { icon: "briefcase", label: "Business", desc: "International meetings" },
  { icon: "book", label: "Education", desc: "Multilingual classrooms" },
  { icon: "hotel", label: "Hospitality", desc: "Hotel & restaurant service" },
  { icon: "shield", label: "Immigration", desc: "Government service desks" },
  { icon: "users", label: "Elderly Care", desc: "Caretaker communication" },
];

const CaseIcon: React.FC<{ type: string; color: string }> = ({ type, color }) => {
  const p = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "heart": return <svg {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
    case "alert": return <svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case "plane": return <svg {...p}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>;
    case "briefcase": return <svg {...p}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
    case "book": return <svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
    case "hotel": return <svg {...p}><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>;
    case "shield": return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>;
    case "users": return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    default: return null;
  }
};

export const UseCasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOut = interpolate(frame, [340, 370], [1, 0], {
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
      <FadeInText text="Built for real-world conversations" fontSize={48} fontWeight={600} delay={5} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 280px)",
          gap: 20,
        }}
      >
        {USE_CASES.map((uc, i) => {
          const cardDelay = 30 + i * 12;
          const f = Math.max(0, frame - cardDelay);
          const scale = spring({ frame: f, fps, config: { damping: 15 } });
          const opacity = interpolate(f, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isHighlight = i === 0;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "20px 24px",
                background: isHighlight ? `${COLORS.accent}10` : COLORS.card,
                border: `1px solid ${isHighlight ? `${COLORS.accent}40` : COLORS.cardBorder}`,
                borderRadius: 16,
                opacity,
                transform: `scale(${interpolate(scale, [0, 1], [0.8, 1])})`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: isHighlight ? `${COLORS.accent}20` : `${COLORS.fg}08`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CaseIcon type={uc.icon} color={isHighlight ? COLORS.accent : COLORS.mutedLight} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 17,
                    fontWeight: 600,
                    color: COLORS.fg,
                  }}
                >
                  {uc.label}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 13,
                    color: COLORS.muted,
                  }}
                >
                  {uc.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
