import { Composition } from "remotion";
import { CrossTalkVideo, TOTAL_DURATION } from "./CrossTalkVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CrossTalkDemo"
      component={CrossTalkVideo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
