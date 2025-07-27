import { FFmpeg } from "@ffmpeg/ffmpeg";
import loadScript from "@utils/LoadScript";

export async function PrepareVideo({
  compositionName,
  props = {},
  onProgress,
}) {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  try {
    await loadScript("/bundle.js");

    if (typeof window.renderRemotionFrame !== "function") {
      throw new Error("renderRemotionFrame not loaded.");
    }

    const compositions = await window.getCompositions?.();
    if (!compositions) throw new Error("getCompositions() missing.");

    const comp = compositions.find((c) => c.id === compositionName);
    if (!comp) throw new Error(`Composition "${compositionName}" not found.`);

    const { width, height, durationInFrames, fps, id } = comp;
    canvas.width = width;
    canvas.height = height;

    const ffmpeg = new FFmpeg({ log: true });
    await ffmpeg.load();
    onProgress?.("FFmpeg loaded", 0, durationInFrames);

    for (let frame = 0; frame < durationInFrames; frame++) {
      await window.renderRemotionFrame({
        canvas,
        frame,
        width,
        height,
        props,
        compositionId: id,
      });

      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const buffer = await blob.arrayBuffer();
      await ffmpeg.writeFile(`frame${frame}.png`, new Uint8Array(buffer));

      onProgress?.(`Rendered frame ${frame + 1}`, frame + 1, durationInFrames);
    }

    await ffmpeg.exec([
      "-framerate",
      String(fps),
      "-i",
      "frame%d.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    const videoBlob = new Blob([data.buffer], { type: "video/mp4" });

    canvas.remove();
    return videoBlob;
  } catch (err) {
    canvas.remove();
    throw err;
  }
}
