import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
import React from "react";
import ReactDOM from "react-dom/client";
import html2canvas from "html2canvas";
import { compositions } from "../../utils/compositions"; // ✅ your static list

declare global {
  interface Window {
    getCompositions: () => Promise<
      {
        id: string;
        width: number;
        height: number;
        durationInFrames: number;
        fps: number;
      }[]
    >;
    renderRemotionFrame: (options: {
      canvas: HTMLCanvasElement;
      frame: number;
      width: number;
      height: number;
      props?: { download?: boolean; formData?: any } | undefined;
      compositionId: string;
    }) => Promise<void>;
  }
}

registerRoot(RemotionRoot);
window.getCompositions = async () => compositions;

window.renderRemotionFrame = async ({
  canvas,
  frame,
  width,
  height,
  props,
  compositionId,
}) => {
  const composition = compositions.find((c) => c.id === compositionId);
  if (!composition) throw new Error(`Composition "${compositionId}" not found`);

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  document.body.appendChild(container);
  console.log("Rendering frame", frame, "for composition", composition);
  const FrameWrapper = () =>
    React.createElement(
      composition.component as React.ComponentType<{
        frame: number;
        formData?: FormData | undefined;
        download: boolean;
      }>,
      {
        ...(typeof props === "object" ? props : {}),
        frame,
        download:props?.download ?? false,
        formData: props?.formData ?? undefined,
      },
    );

  const root = ReactDOM.createRoot(container);
  await new Promise((res) => {
    root.render(React.createElement(FrameWrapper));
    setTimeout(res, 50);
  });

  const snapshot = await html2canvas(container, { width, height });
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(snapshot, 0, 0);

  root.unmount();
  container.remove();
};