import React, { useEffect, useRef, useState } from "react";
import { delayRender, continueRender } from "remotion";

type SmartVideoProps = {
  src: string;
  frame: number;
  from: number;
};

const SmartVideo: React.FC<SmartVideoProps> = ({ src, frame, from }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [handle] = useState(() => delayRender());

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const onLoadedData = () => {
      continueRender(handle);
    };

    video.addEventListener("loadeddata", onLoadedData);

    return () => {
      video.removeEventListener("loadeddata", onLoadedData);
    };
  }, [handle]);

  console.log(frame,from)
  return (
    <video
      ref={videoRef}
      src={src}
      width="100%"
      height="100%"
      muted
      style={{
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
};

export default SmartVideo;
