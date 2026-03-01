import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { RevealScene } from "./scenes/RevealScene";
import { PipelineScene } from "./scenes/PipelineScene";
import { DemoScene } from "./scenes/DemoScene";
import { UseCasesScene } from "./scenes/UseCasesScene";
import { TechScene } from "./scenes/TechScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { COLORS } from "./theme";

// Load fonts at top level
loadInter("normal", { weights: ["300", "400", "600", "700"], subsets: ["latin"] });
loadJetBrainsMono("normal", { weights: ["400", "700"], subsets: ["latin"] });

// Scene timing (frames at 30fps)
// Total: 4170 frames = 139 seconds ≈ 2:19
const SCENES = {
  hook:     { from: 0,    duration: 200 },    // 0-6.7s
  problem:  { from: 180,  duration: 330 },    // 6-17s
  reveal:   { from: 490,  duration: 270 },    // 16.3-25.3s
  pipeline: { from: 740,  duration: 600 },    // 24.7-44.7s
  demo:     { from: 1320, duration: 1500 },   // 44-94s (sequential audio)
  useCases: { from: 2800, duration: 390 },    // 93.3-106.3s
  tech:     { from: 3170, duration: 330 },    // 105.7-116.7s
  closing:  { from: 3480, duration: 690 },    // 116-139s
};

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
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration} premountFor={30}>
        <HookScene />
      </Sequence>

      <Sequence from={SCENES.problem.from} durationInFrames={SCENES.problem.duration} premountFor={30}>
        <ProblemScene />
      </Sequence>

      <Sequence from={SCENES.reveal.from} durationInFrames={SCENES.reveal.duration} premountFor={30}>
        <RevealScene />
      </Sequence>

      <Sequence from={SCENES.pipeline.from} durationInFrames={SCENES.pipeline.duration} premountFor={30}>
        <PipelineScene />
      </Sequence>

      <Sequence from={SCENES.demo.from} durationInFrames={SCENES.demo.duration} premountFor={30}>
        <DemoScene />
      </Sequence>

      <Sequence from={SCENES.useCases.from} durationInFrames={SCENES.useCases.duration} premountFor={30}>
        <UseCasesScene />
      </Sequence>

      <Sequence from={SCENES.tech.from} durationInFrames={SCENES.tech.duration} premountFor={30}>
        <TechScene />
      </Sequence>

      <Sequence from={SCENES.closing.from} durationInFrames={SCENES.closing.duration} premountFor={30}>
        <ClosingScene />
      </Sequence>
    </div>
  );
};
