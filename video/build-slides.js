const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Fred van Rijswijk";
pres.title = "CrossTalk — Real-time Voice Translation";

// Colors (no # prefix)
const BG = "0A0A0A";
const FG = "FAFAFA";
const ACCENT = "3B82F6";
const MUTED = "A1A1AA";
const CARD = "18181B";
const CARD_BORDER = "27272A";
const GREEN = "22C55E";
const ORANGE = "FF7000";

// Helper: fresh shadow each call (pptxgenjs mutates objects)
const cardShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.3 });

// ─── Slide 1: Title ───
const s1 = pres.addSlide();
s1.background = { color: BG };

// Subtle glow circle
s1.addShape(pres.shapes.OVAL, {
  x: 2.5, y: 0.5, w: 5, h: 4.5,
  fill: { color: ACCENT, transparency: 92 },
});

s1.addText("CrossTalk", {
  x: 0.5, y: 1.2, w: 9, h: 1.2,
  fontSize: 72, fontFace: "Arial", bold: true,
  color: FG, align: "center", margin: 0,
});

s1.addText("Real-time voice translation", {
  x: 0.5, y: 2.5, w: 9, h: 0.6,
  fontSize: 22, fontFace: "Consolas",
  color: MUTED, align: "center", charSpacing: 4, margin: 0,
});

// Divider line
s1.addShape(pres.shapes.LINE, {
  x: 3.5, y: 3.4, w: 3, h: 0,
  line: { color: ACCENT, width: 1.5, transparency: 60 },
});

s1.addText("Mistral AI Worldwide Hackathon — London", {
  x: 0.5, y: 3.8, w: 9, h: 0.5,
  fontSize: 16, fontFace: "Consolas",
  color: ACCENT, align: "center", margin: 0,
});

// ─── Slide 2: Problem ───
const s2 = pres.addSlide();
s2.background = { color: BG };

s2.addText("The language barrier costs lives", {
  x: 0.5, y: 0.4, w: 9, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true,
  color: FG, align: "center", margin: 0,
});

const stats = [
  { num: "25M+", label: "people face language barriers\nin healthcare yearly", color: ACCENT },
  { num: "67%", label: "of medical errors involve\nmiscommunication", color: ACCENT },
  { num: "240ms", label: "is all it takes to\nbreak that barrier", color: GREEN },
];

stats.forEach((stat, i) => {
  const x = 0.5 + i * 3.15;
  // Card background
  s2.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y: 1.6, w: 2.85, h: 2.8,
    fill: { color: CARD },
    line: { color: CARD_BORDER, width: 1 },
    rectRadius: 0.12,
    shadow: cardShadow(),
  });
  // Number
  s2.addText(stat.num, {
    x, y: 1.9, w: 2.85, h: 1.0,
    fontSize: 52, fontFace: "Consolas", bold: true,
    color: stat.color, align: "center", margin: 0,
  });
  // Label
  s2.addText(stat.label, {
    x, y: 3.0, w: 2.85, h: 1.0,
    fontSize: 14, fontFace: "Arial",
    color: MUTED, align: "center", margin: 0,
  });
});

// ─── Slide 3: How it works ───
const s3 = pres.addSlide();
s3.background = { color: BG };

s3.addText("How it works", {
  x: 0.5, y: 0.3, w: 9, h: 0.7,
  fontSize: 36, fontFace: "Arial", bold: true,
  color: FG, align: "center", margin: 0,
});

const steps = [
  { title: "Speech Capture", sub: "WebSocket streaming", latency: "", color: ACCENT },
  { title: "Voxstral Realtime", sub: "Mistral speech-to-text", latency: "~200ms", color: "F59E0B" },
  { title: "Mistral Small", sub: "Context-aware translation", latency: "~150ms", color: "8B5CF6" },
  { title: "ElevenLabs TTS", sub: "Natural voice synthesis", latency: "~100ms", color: "EC4899" },
];

steps.forEach((step, i) => {
  const x = 0.3 + i * 2.45;
  // Card
  s3.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y: 1.3, w: 2.2, h: 2.2,
    fill: { color: CARD },
    line: { color: CARD_BORDER, width: 1 },
    rectRadius: 0.1,
    shadow: cardShadow(),
  });
  // Colored dot
  s3.addShape(pres.shapes.OVAL, {
    x: x + 0.85, y: 1.5, w: 0.5, h: 0.5,
    fill: { color: step.color, transparency: 80 },
    line: { color: step.color, width: 1.5 },
  });
  // Title
  s3.addText(step.title, {
    x, y: 2.15, w: 2.2, h: 0.45,
    fontSize: 14, fontFace: "Arial", bold: true,
    color: FG, align: "center", margin: 0,
  });
  // Subtitle
  s3.addText(step.sub, {
    x, y: 2.55, w: 2.2, h: 0.35,
    fontSize: 11, fontFace: "Arial",
    color: MUTED, align: "center", margin: 0,
  });
  // Latency badge
  if (step.latency) {
    s3.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.55, y: 2.95, w: 1.1, h: 0.35,
      fill: { color: GREEN, transparency: 85 },
      line: { color: GREEN, width: 0.5, transparency: 60 },
      rectRadius: 0.05,
    });
    s3.addText(step.latency, {
      x: x + 0.55, y: 2.95, w: 1.1, h: 0.35,
      fontSize: 11, fontFace: "Consolas",
      color: GREEN, align: "center", valign: "middle", margin: 0,
    });
  }

  // Arrow between steps
  if (i < steps.length - 1) {
    s3.addText("\u2192", {
      x: x + 2.15, y: 2.05, w: 0.35, h: 0.45,
      fontSize: 22, fontFace: "Arial",
      color: CARD_BORDER, align: "center", valign: "middle", margin: 0,
    });
  }
});

// Total latency
s3.addText("TOTAL END-TO-END LATENCY", {
  x: 0.5, y: 3.85, w: 9, h: 0.35,
  fontSize: 12, fontFace: "Consolas",
  color: MUTED, align: "center", charSpacing: 3, margin: 0,
});

s3.addText("240 — 500ms", {
  x: 0.5, y: 4.2, w: 9, h: 0.7,
  fontSize: 42, fontFace: "Consolas", bold: true,
  color: GREEN, align: "center", margin: 0,
});

// ─── Slide 4: Live Demo ───
const s4 = pres.addSlide();
s4.background = { color: BG };

// Big glow
s4.addShape(pres.shapes.OVAL, {
  x: 2, y: 0.3, w: 6, h: 5,
  fill: { color: ACCENT, transparency: 93 },
});

s4.addText("LIVE DEMO", {
  x: 0.5, y: 1.0, w: 9, h: 1.5,
  fontSize: 80, fontFace: "Arial", bold: true,
  color: FG, align: "center", margin: 0,
});

// URL badge
s4.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 3, y: 3.0, w: 4, h: 0.7,
  fill: { color: ACCENT, transparency: 85 },
  line: { color: ACCENT, width: 1 },
  rectRadius: 0.35,
});

s4.addText("crosstalk.today", {
  x: 3, y: 3.0, w: 4, h: 0.7,
  fontSize: 28, fontFace: "Consolas",
  color: ACCENT, align: "center", valign: "middle", margin: 0,
  hyperlink: { url: "https://crosstalk.today" },
});

s4.addText("Open your browser and try it yourself", {
  x: 0.5, y: 4.0, w: 9, h: 0.5,
  fontSize: 16, fontFace: "Arial",
  color: MUTED, align: "center", margin: 0,
});

// ─── Slide 5: Powered by ───
const s5 = pres.addSlide();
s5.background = { color: BG };

s5.addText("Powered by", {
  x: 0.5, y: 0.3, w: 9, h: 0.7,
  fontSize: 36, fontFace: "Arial", bold: true,
  color: FG, align: "center", margin: 0,
});

const tech = [
  { name: "Mistral AI", items: ["Voxstral Realtime (STT)", "Mistral Small (Translation)"], color: ORANGE },
  { name: "ElevenLabs", items: ["Flash v2.5 TTS", "Multi-language voices"], color: ACCENT },
  { name: "Next.js", items: ["Server-side streaming", "WebSocket real-time"], color: FG },
];

tech.forEach((t, i) => {
  const x = 0.4 + i * 3.2;
  s5.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y: 1.2, w: 2.9, h: 1.8,
    fill: { color: CARD },
    line: { color: CARD_BORDER, width: 1 },
    rectRadius: 0.1,
    shadow: cardShadow(),
  });
  s5.addText(t.name, {
    x: x + 0.2, y: 1.35, w: 2.5, h: 0.45,
    fontSize: 18, fontFace: "Arial", bold: true,
    color: t.color, align: "left", margin: 0,
  });
  t.items.forEach((item, j) => {
    s5.addText(item, {
      x: x + 0.4, y: 1.85 + j * 0.38, w: 2.3, h: 0.35,
      fontSize: 12, fontFace: "Arial",
      color: MUTED, align: "left", margin: 0,
    });
    // Small dot
    s5.addShape(pres.shapes.OVAL, {
      x: x + 0.22, y: 1.95 + j * 0.38, w: 0.1, h: 0.1,
      fill: { color: t.color, transparency: 40 },
    });
  });
});

// Use cases
s5.addText("Built for", {
  x: 0.5, y: 3.3, w: 1.2, h: 0.4,
  fontSize: 13, fontFace: "Arial",
  color: MUTED, align: "left", margin: 0,
});

const useCases = ["Healthcare", "Emergency", "Business", "Travel", "Education", "Hospitality", "Immigration", "Elderly Care"];
useCases.forEach((uc, i) => {
  const pillX = 1.7 + i * 1.05;
  const isFirst = i === 0;
  s5.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: pillX, y: 3.3, w: 0.95, h: 0.38,
    fill: { color: isFirst ? ACCENT : CARD, transparency: isFirst ? 85 : 0 },
    line: { color: isFirst ? ACCENT : CARD_BORDER, width: 0.75, transparency: isFirst ? 60 : 0 },
    rectRadius: 0.19,
  });
  s5.addText(uc, {
    x: pillX, y: 3.3, w: 0.95, h: 0.38,
    fontSize: 9, fontFace: "Consolas",
    color: isFirst ? ACCENT : MUTED, align: "center", valign: "middle", margin: 0,
  });
});

// ─── Slide 6: Closing ───
const s6 = pres.addSlide();
s6.background = { color: BG };

// Glow
s6.addShape(pres.shapes.OVAL, {
  x: 2.5, y: 0.5, w: 5, h: 4.5,
  fill: { color: ACCENT, transparency: 93 },
});

s6.addText("Try it now", {
  x: 0.5, y: 1.2, w: 9, h: 0.8,
  fontSize: 44, fontFace: "Arial", bold: true,
  color: FG, align: "center", margin: 0,
});

s6.addText("crosstalk.today", {
  x: 0.5, y: 2.1, w: 9, h: 0.6,
  fontSize: 30, fontFace: "Consolas",
  color: ACCENT, align: "center", charSpacing: 2, margin: 0,
  hyperlink: { url: "https://crosstalk.today" },
});

s6.addText("Open source, free to use", {
  x: 0.5, y: 2.8, w: 9, h: 0.5,
  fontSize: 18, fontFace: "Arial",
  color: MUTED, align: "center", margin: 0,
});

// YouTube link
s6.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 3.2, y: 3.6, w: 3.6, h: 0.5,
  fill: { color: CARD },
  line: { color: CARD_BORDER, width: 0.75 },
  rectRadius: 0.25,
});
s6.addText("Watch demo on YouTube", {
  x: 3.2, y: 3.6, w: 3.6, h: 0.5,
  fontSize: 13, fontFace: "Consolas",
  color: ACCENT, align: "center", valign: "middle", margin: 0,
  hyperlink: { url: "https://youtu.be/LI0CwjrnVhA" },
});

// Hackathon badge
s6.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 2.5, y: 4.4, w: 5, h: 0.45,
  fill: { color: ACCENT, transparency: 90 },
  line: { color: ACCENT, width: 0.5, transparency: 70 },
  rectRadius: 0.22,
});
s6.addText("Mistral AI Worldwide Hackathon — London", {
  x: 2.5, y: 4.4, w: 5, h: 0.45,
  fontSize: 12, fontFace: "Consolas",
  color: ACCENT, align: "center", valign: "middle", margin: 0,
});

// Write
pres.writeFile({ fileName: "/Users/fredvanrijswijk/hackathon/crosstalk/video/CrossTalk-Pitch.pptx" })
  .then(() => console.log("Done: CrossTalk-Pitch.pptx"))
  .catch(err => { console.error(err); process.exit(1); });
