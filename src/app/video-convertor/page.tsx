"use client";

import { useEffect } from "react";
import etro from "etro";

const VideoConvertor = () => {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const movie = new etro.Movie({
      canvas,
    });

    const BaseLayer = new etro.layer.Base({
      startTime: 0,
      duration: 1000,
    });

    movie.layers.push(BaseLayer);
    console.log(movie);
  }, []);

  return <div>video</div>;
};

export default VideoConvertor;
