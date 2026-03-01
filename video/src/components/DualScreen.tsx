import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

type Message = {
  text: string;
  translation?: string;
  side: "left" | "right";
  delay: number;
  translationStart?: number;
  latency?: number;
};

export const DualScreen: React.FC<{
  messages: Message[];
  leftLang: string;
  rightLang: string;
  leftLabel: string;
  rightLabel: string;
  delay?: number;
  activeSpeaker?: "left" | "right" | null;
}> = ({ messages, leftLang, rightLang, leftLabel, rightLabel, delay = 0, activeSpeaker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const screenScale = spring({ frame: f, fps, config: { damping: 20 } });

  // Determine which speaker is active based on latest message timing
  const currentSpeaker = (() => {
    if (activeSpeaker !== undefined) return activeSpeaker;
    let latest: Message | null = null;
    for (const m of messages) {
      if (frame >= m.delay + delay && (!latest || m.delay > latest.delay)) {
        latest = m;
      }
    }
    return latest?.side ?? null;
  })();

  // Count visible messages
  const visibleCount = messages.filter(
    (m) => frame >= m.delay + delay
  ).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1720,
        gap: 0,
        transform: `scale(${interpolate(screenScale, [0, 1], [0.9, 1])})`,
        opacity: interpolate(screenScale, [0, 1], [0, 1]),
      }}
    >
      {/* Main panels */}
      <div style={{ display: "flex", height: 720, gap: 0 }}>
        {/* Left panel */}
        <div
          style={{
            flex: 1,
            background: COLORS.card,
            borderRadius: "4px 0 0 0",
            border: `1px solid ${COLORS.cardBorder}`,
            borderRight: "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <PanelHeader
            label={leftLabel}
            lang={leftLang}
            avatarLetter="A"
            avatarFilled
            isSpeaking={currentSpeaker === "left"}
            frame={frame}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              justifyContent: "flex-end",
              padding: "16px 24px 24px",
            }}
          >
            {messages
              .filter((m) => m.side === "left" || (m.side === "right" && m.translation))
              .map((m, i) => {
                // On left panel: left messages are originals (appear at delay), right messages are translations (appear at translationStart)
                const isOrig = m.side === "left";
                const bubbleDelay = isOrig ? m.delay : (m.translationStart ?? m.delay);
                return (
                  <MessageBubble
                    key={i}
                    text={isOrig ? m.text : m.translation!}
                    isOriginal={isOrig}
                    messageDelay={bubbleDelay}
                    parentDelay={delay}
                    latency={!isOrig ? m.latency : undefined}
                    lang={isOrig ? leftLang : rightLang}
                    side="left"
                  />
                );
              })}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            background: COLORS.cardBorder,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 40,
              height: 40,
              borderRadius: 20,
              background: COLORS.bg,
              border: `1px solid ${COLORS.cardBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* ArrowLeftRight icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3L4 7l4 4" />
              <path d="M4 7h16" />
              <path d="M16 21l4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
          </div>
        </div>

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            background: COLORS.card,
            borderRadius: "0 4px 0 0",
            border: `1px solid ${COLORS.cardBorder}`,
            borderLeft: "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <PanelHeader
            label={rightLabel}
            lang={rightLang}
            avatarLetter="B"
            avatarFilled={false}
            isSpeaking={currentSpeaker === "right"}
            frame={frame}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              justifyContent: "flex-end",
              padding: "16px 24px 24px",
            }}
          >
            {messages
              .filter((m) => m.side === "right" || (m.side === "left" && m.translation))
              .map((m, i) => {
                // On right panel: right messages are originals (appear at delay), left messages are translations (appear at translationStart)
                const isOrig = m.side === "right";
                const bubbleDelay = isOrig ? m.delay : (m.translationStart ?? m.delay);
                return (
                  <MessageBubble
                    key={i}
                    text={isOrig ? m.text : m.translation!}
                    isOriginal={isOrig}
                    messageDelay={bubbleDelay}
                    parentDelay={delay}
                    latency={!isOrig ? m.latency : undefined}
                    lang={isOrig ? rightLang : leftLang}
                    side="right"
                  />
                );
              })}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        isListening={visibleCount > 0}
        leftLang={leftLang.split(" ")[0]}
        rightLang={rightLang.split(" ")[0]}
        messageCount={visibleCount}
        frame={frame}
        delay={delay}
      />
    </div>
  );
};

/* ── Wave bars ── */
const WAVE_HEIGHTS = [10, 16, 12, 18, 14];

const WaveBars: React.FC<{ active: boolean; frame: number }> = ({ active, frame }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20 }}>
    {WAVE_HEIGHTS.map((h, i) => {
      const animated = active
        ? h * (0.5 + 0.5 * Math.sin((frame * 0.3 + i * 1.2) % (Math.PI * 2)))
        : 3;
      return (
        <div
          key={i}
          style={{
            width: 3,
            height: animated,
            borderRadius: 2,
            background: active ? COLORS.fg : `${COLORS.muted}40`,
            transition: "height 0.15s",
          }}
        />
      );
    })}
  </div>
);

/* ── Panel header ── */
const PanelHeader: React.FC<{
  label: string;
  lang: string;
  avatarLetter: string;
  avatarFilled: boolean;
  isSpeaking: boolean;
  frame: number;
}> = ({ label, lang, avatarLetter, avatarFilled, isSpeaking, frame }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderBottom: `1px solid ${COLORS.cardBorder}`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {/* Circle avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          background: avatarFilled ? COLORS.fg : "transparent",
          border: avatarFilled ? "none" : `2px solid ${COLORS.fg}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 13,
            fontWeight: 700,
            color: avatarFilled ? COLORS.bg : COLORS.fg,
          }}
        >
          {avatarLetter}
        </span>
      </div>
      <div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.fg,
            letterSpacing: -0.3,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12,
            color: COLORS.mutedLight,
            letterSpacing: 1.5,
          }}
        >
          {lang}
        </div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* Auto-speak indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 28,
            height: 16,
            borderRadius: 8,
            background: COLORS.fg,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: COLORS.bg,
              position: "absolute",
              top: 2,
              right: 2,
            }}
          />
        </div>
        {/* Volume2 icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </div>
      <WaveBars active={isSpeaking} frame={frame} />
    </div>
  </div>
);

/* ── Message bubble ── */
const MessageBubble: React.FC<{
  text: string;
  isOriginal: boolean;
  messageDelay: number;
  parentDelay: number;
  latency?: number;
  lang: string;
  side: "left" | "right";
}> = ({ text, isOriginal, messageDelay, parentDelay, latency, lang, side }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalDelay = messageDelay + parentDelay;
  const f = Math.max(0, frame - totalDelay);

  const scale = spring({ frame: f, fps, config: { damping: 18, stiffness: 120 } });
  const opacity = interpolate(f, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame < totalDelay) return null;

  const charsVisible = Math.min(text.length, Math.floor(f * 2));
  const displayText = text.slice(0, charsVisible);
  const done = charsVisible >= text.length;

  // Timestamp based on message order
  const minutes = Math.floor(messageDelay / 60);
  const timestamp = `14:${String(minutes + 23).padStart(2, "0")}`;

  // Audio playing animation: pulse for ~60 frames after text completes
  const textDoneFrame = totalDelay + Math.ceil(text.length / 2);
  const audioPlaying = !isOriginal && frame >= textDoneFrame && frame < textDoneFrame + 60;
  const audioPulse = audioPlaying
    ? 0.5 + 0.5 * Math.sin((frame - textDoneFrame) * 0.4)
    : 0;

  return (
    <div
      style={{
        alignSelf: isOriginal ? "flex-end" : "flex-start",
        maxWidth: "85%",
        transform: `scale(${interpolate(scale, [0, 1], [0.8, 1])})`,
        opacity,
        transformOrigin: isOriginal ? "right bottom" : "left bottom",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* "TRANSLATED" label for translated messages */}
      {!isOriginal && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.mutedLight,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {/* Volume2 icon */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <span>Translated</span>
          {latency && done && (
            <span
              style={{
                color: latency < 500 ? COLORS.green : latency < 1000 ? COLORS.yellow : COLORS.red,
                marginLeft: 2,
              }}
            >
              {latency}ms
            </span>
          )}
          {/* Play button icon */}
          {done && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke={audioPlaying ? COLORS.fg : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: 2, opacity: audioPlaying ? 0.5 + audioPulse * 0.5 : 1 }}
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        style={{
          background: isOriginal ? COLORS.fg : "transparent",
          color: isOriginal ? COLORS.bg : `${COLORS.fg}cc`,
          border: isOriginal ? "none" : `1px solid ${COLORS.cardBorder}`,
          borderRadius: isOriginal
            ? (side === "left" ? "4px 4px 4px 0" : "4px 4px 0 4px")
            : (side === "left" ? "4px 4px 4px 0" : "4px 4px 0 4px"),
          padding: "12px 18px",
          fontFamily: FONTS.sans,
          fontSize: 16,
          lineHeight: 1.6,
        }}
      >
        {displayText}
      </div>

      {/* Timestamp */}
      {done && (
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: `${COLORS.muted}80`,
            textAlign: isOriginal ? "right" : "left",
            paddingLeft: isOriginal ? 0 : 4,
            paddingRight: isOriginal ? 4 : 0,
          }}
        >
          {timestamp}
        </div>
      )}
    </div>
  );
};

/* ── Status bar ── */
const StatusBar: React.FC<{
  isListening: boolean;
  leftLang: string;
  rightLang: string;
  messageCount: number;
  frame: number;
  delay: number;
}> = ({ isListening, leftLang, rightLang, messageCount, frame, delay }) => {
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = interpolate(frame % 30, [0, 15, 30], [0.6, 1, 0.6]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: COLORS.muted,
        letterSpacing: 1.5,
        opacity,
        background: COLORS.card,
        borderRadius: "0 0 4px 4px",
        border: `1px solid ${COLORS.cardBorder}`,
        borderTop: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: isListening ? COLORS.fg : `${COLORS.muted}40`,
              opacity: isListening ? pulse : 1,
            }}
          />
          <span style={{ textTransform: "uppercase", color: isListening ? COLORS.fg : COLORS.muted }}>
            {isListening ? "Listening" : "Idle"}
          </span>
        </div>
        <span>{leftLang} ↔ {rightLang}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span>SILENCE 1.5s</span>
        <span>{messageCount} MESSAGES</span>
      </div>
    </div>
  );
};
