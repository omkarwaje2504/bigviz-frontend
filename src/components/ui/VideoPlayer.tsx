// components/VideoPlayer.tsx
"use client";

import React from "react";
// @ts-expect-error this is static import
import VideoPlayer from "react-video-js-player";
import "video.js/dist/video-js.css";

interface Props {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
}

const CustomVideoPlayer: React.FC<Props> = ({
  src,
  poster,
}) => {

  return (
    <div className="w-full">
      <VideoPlayer
        src={src}
        poster={poster}
        width={window.innerWidth < 768 ? window.innerWidth - 15 : 900}
        height={ 
          window.innerHeight < 768
            ? window.innerHeight - 120
            : window.innerHeight - 150
        }
        controls={true}
      />
    </div>
  );
};

export default CustomVideoPlayer;
