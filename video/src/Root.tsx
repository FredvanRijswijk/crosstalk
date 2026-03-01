import { Composition } from "remotion";
import { CrossTalkVideo } from "./CrossTalkVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CrossTalkDemo"
      component={CrossTalkVideo}
      durationInFrames={4170}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
