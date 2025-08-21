"use client";

import Konva from "konva";

type BackgroundImageConfig = { src: string };

type OverlayImageConfig = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
};

type TextBlockConfig = {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily?: string;
  fill?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  maxChars?: number;
  verticalAlign?: "top" | "middle" | "bottom";
  backgroundColor?: string;
  padding?: number;
};

interface GenerateCardImageConfig {
  width: number;
  height: number;
  backgroundImage?: BackgroundImageConfig;
  overlayImages?: OverlayImageConfig[];
  textBlocks?: TextBlockConfig[];
}

interface GenerateCardImageResult {
  dataUrl: string | null;
  error: string | null;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    try {
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image: ${src}`));
      image.src = src;
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a greeting card image from a given configuration.
 *
 * @param config Configuration object containing:
 *  - `width` and `height` of the canvas
 *  - Optional `backgroundImage` (src)
 *  - Optional `overlayImages` array with position, size, and zIndex
 *  - Optional `textBlocks` array with text content and styling
 *
 * @returns A Promise resolving to `{ dataUrl, error }`:
 *  - `dataUrl` → Base64 data URL of the final image, or `null` if failed
 *  - `error` → Friendly user-facing message if something went wrong, otherwise `null`
 *
 * @example
 * ```ts
 * const result = await GenerateCardImage({
 *   width: 800,
 *   height: 600,
 *   backgroundImage: { src: "https://example.com/bg.png" },
 *   overlayImages: [
 *     { src: "https://example.com/logo.png", x: 50, y: 50, width: 100, height: 100 }
 *   ],
 *   textBlocks: [
 *     { text: "Happy Birthday!", x: 200, y: 500, width: 400, fontSize: 32, fill: "white", align: "center" }
 *   ]
 * });
 *
 * if (result.error) {
 *   alert(result.error);
 * } else if (result.dataUrl) {
 *   document.querySelector("#preview")!.src = result.dataUrl;
 * }
 * ```
 */

export async function GenerateCardImage({
  width,
  height,
  backgroundImage,
  overlayImages = [],
  textBlocks = [],
}: GenerateCardImageConfig): Promise<GenerateCardImageResult> {
  if (typeof window === "undefined") {
    return {
      dataUrl: null,
      error: "Image generation can only run in the browser.",
    };
  }

  try {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const stage = new Konva.Stage({
      container,
      width,
      height,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Background
    if (backgroundImage?.src) {
      try {
        const img = await loadImage(backgroundImage.src);
        layer.add(new Konva.Image({ image: img, x: 0, y: 0, width, height }));
      } catch {
        console.warn("Failed to load background image:", backgroundImage.src);
      }
    }

    // Overlays
    const sortedImages = [...overlayImages].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
    );
    for (const imgData of sortedImages) {
      if (!imgData?.src) continue;
      try {
        const img = await loadImage(imgData.src);
        layer.add(
          new Konva.Image({
            image: img,
            x: imgData.x ?? 0,
            y: imgData.y ?? 0,
            width: imgData.width ?? 50,
            height: imgData.height ?? 50,
          }),
        );
      } catch {
        console.warn("Failed to load overlay image:", imgData.src);
      }
    }

    // Text
    for (const txt of textBlocks) {
      if (!txt?.text) continue;

      const konvaText = new Konva.Text({
        text: txt.maxChars ? txt.text.slice(0, txt.maxChars) : txt.text,
        x: txt.x ?? 0,
        y: txt.y ?? 0,
        width: txt.width ?? 100,
        fontSize: txt.fontSize ?? 16,
        fontFamily: txt.fontFamily || "Arial",
        fill: txt.fill || "black",
        align: txt.align || "left",
        lineHeight: txt.lineHeight || 1.2,
        wrap: "word",
      });

      if (txt.verticalAlign) {
        const textHeight = konvaText.height();
        if (txt.verticalAlign === "middle") {
          konvaText.y((txt.y ?? 0) - textHeight / 2);
        } else if (txt.verticalAlign === "bottom") {
          konvaText.y((txt.y ?? 0) - textHeight);
        }
      }

      if (txt.backgroundColor) {
        const padding = txt.padding || 0;
        layer.add(
          new Konva.Rect({
            x: konvaText.x() - padding,
            y: konvaText.y() - padding,
            width: konvaText.width() + padding * 2,
            height: konvaText.height() + padding * 2,
            fill: txt.backgroundColor,
            cornerRadius: 4,
          }),
        );
      }

      layer.add(konvaText);
    }

    layer.draw();

    const dataUrl = stage.toDataURL({ pixelRatio: 2 });

    stage.destroy();
    container.remove();

    return { dataUrl, error: null };
  } catch (err) {
    console.error("Error generating card image:", err);
    return {
      dataUrl: null,
      error: "Something went wrong while creating your card. Please try again.",
    };
  }
}
