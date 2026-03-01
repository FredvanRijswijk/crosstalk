import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { RevealScene } from "./scenes/RevealScene";
import { PipelineScene } from "./scenes/PipelineScene";
import { DemoScene, DEMO_TOTAL_FRAMES } from "./scenes/DemoScene";
import { TechUseCasesScene } from "./scenes/TechUseCasesScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { COLORS } from "./theme";

loadInter("normal", { weights: ["300", "400", "600", "700"], subsets: ["latin"] });
loadJetBrainsMono("normal", { weights: ["400", "700"], subsets: ["latin"] });

// Scene timing (frames at 30fps) — fitted to actual narrator audio durations
const SCENES = {
  hook:     { from: 0,   duration: 290 },      // narrator_hook = 271 frames
  problem:  { from: 270, duration: 350 },      // narrator_problem = 320 frames
  reveal:   { from: 600, duration: 160 },      // no narrator
  pipeline: { from: 740, duration: 390 },      // narrator_pipeline = 365 frames
  demo:     { from: 1110, duration: DEMO_TOTAL_FRAMES },
  techUse:  { from: 1110 + DEMO_TOTAL_FRAMES + 30, duration: 370 },  // +30 gap after demo
  closing:  { from: 1110 + DEMO_TOTAL_FRAMES + 30 + 350, duration: 280 },
};

export const TOTAL_DURATION =
  SCENES.closing.from + SCENES.closing.duration;

// Narrator voiceover — durations from actual ffprobe measurements
const NARRATOR = [
  { file: "narrator_hook.mp3",     from: 5,                        dur: 280 },
  { file: "narrator_problem.mp3",  from: SCENES.problem.from + 5,  dur: 330 },
  { file: "narrator_pipeline.mp3", from: SCENES.pipeline.from + 5, dur: 375 },
  { file: "narrator_closing.mp3",  from: SCENES.closing.from + 5,  dur: 265 },
];

export const CrossTalkVideo: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration} premountFor={20}>
        <HookScene />
      </Sequence>

      <Sequence from={SCENES.problem.from} durationInFrames={SCENES.problem.duration} premountFor={20}>
        <ProblemScene />
      </Sequence>

      <Sequence from={SCENES.reveal.from} durationInFrames={SCENES.reveal.duration} premountFor={20}>
        <RevealScene />
      </Sequence>

      <Sequence from={SCENES.pipeline.from} durationInFrames={SCENES.pipeline.duration} premountFor={20}>
        <PipelineScene />
      </Sequence>

      <Sequence from={SCENES.demo.from} durationInFrames={SCENES.demo.duration} premountFor={20}>
        <DemoScene />
      </Sequence>

      <Sequence from={SCENES.techUse.from} durationInFrames={SCENES.techUse.duration} premountFor={20}>
        <TechUseCasesScene />
      </Sequence>

      <Sequence from={SCENES.closing.from} durationInFrames={SCENES.closing.duration} premountFor={20}>
        <ClosingScene />
      </Sequence>

      {/* Narrator voiceover */}
      {NARRATOR.map((n, i) => (
        <Sequence key={i} from={n.from} durationInFrames={n.dur + 30} layout="none">
          <Audio src={staticFile(`audio/${n.file}`)} volume={0.9} />
        </Sequence>
      ))}
    </div>
  );
};
