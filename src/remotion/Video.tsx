import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import Sequence from "../components/remotion-components/Sequence";
type FormData = {
  name?: string;
};

const MyVideo: React.FC<{
  frame: number;
  formData?: FormData;
  download: boolean;
}> = ({ frame, formData = undefined, download }) => {
  const frameData = download ? frame : useCurrentFrame();

  return (
    <Sequence frame={frameData} from={10} durationInFrames={160}>
      <AbsoluteFill
        style={{
          width: "100vh",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            background: "blue",
            color: "white",
            fontSize: interpolate(frame, [20, 50], [20, 70], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Hello, {formData?.name}
          {frameData}
        </h1>
        <div style={{
          width:600,
          height:800
        }}>
        {/* <SmartVideo from={30} frame={frameData} src="http://localhost:3000/IPCA/YogaDay/English/Intro.mp4" /> */}
        </div>
       
      </AbsoluteFill>
    </Sequence>
  );
};

export default MyVideo;
