"use client";

import Konva from "konva";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type BackgroundImageConfig = {
  src: string;
  width?: number;
  height?: number;
};

type OverlayImageConfig = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  behindBackground?: boolean;
  cornerRadius?: number;
  offsetX?: number;
  offsetY?: number;
  skewX?: number;
  skewY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
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
  zIndex?: number;
};

interface UnifiedImageGeneratorConfig {
  width: number;
  height: number;
  backgroundImage?: BackgroundImageConfig;
  overlayImages?: OverlayImageConfig[];
  textBlocks?: TextBlockConfig[];
  mimeType?: "image/png" | "image/jpeg";
  quality?: number;
  pixelRatio?: number;
}

interface UnifiedImageGeneratorResult {
  blobUrl: string | null;
  error: string | null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Loads an image with CORS support and optional cache-busting
 */
const loadImage = (
  src: string,
  cacheBust = false,
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    try {
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${src}`));

      if (cacheBust) {
        const cacheBuster = `cb=${Date.now()}`;
        const url = src + (src.includes("?") ? "&" : "?") + cacheBuster;
        image.src = url;
      } else {
        image.src = src;
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Sorts elements by zIndex for proper layering
 */
const sortByZIndex = <T extends { zIndex?: number }>(items: T[]): T[] => {
  return [...items].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
};

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

/**
 * Unified Image Generator
 *
 * Generates calendar previews, greeting cards, and custom composite images.
 * Always returns a blob URL for optimal browser performance.
 *
 * @features
 * - Blob URL output only
 * - Background and overlay images with full transform support
 * - Text blocks with advanced styling and alignment
 * - Perspective transforms: skew, scale, rotation
 * - Z-index layering control
 * - Behind-background image placement
 * - High-quality export with configurable pixel ratio
 * - CORS-compliant image loading
 *
 * @param config - Configuration object for image generation
 * @returns Promise resolving to blob URL string or error
 *
 * @example
 * ```
 * const result = await generateUnifiedImage({
 *   width: 1200,
 *   height: 1600,
 *   backgroundImage: { src: "/mockup.png" },
 *   overlayImages: [{
 *     src: userPhoto,
 *     x: 600, y: 400,
 *     width: 800, height: 600,
 *     skewX: -5, scaleY: 0.95,
 *     cornerRadius: 12
 *   }],
 *   pixelRatio: 2
 * });
 *
 * if (result.blobUrl) {
 *   document.getElementById("preview").src = result.blobUrl;
 * }
 * ```
 */
export async function GenerateImage({
  width,
  height,
  backgroundImage,
  overlayImages = [],
  textBlocks = [],
  mimeType = "image/png",
  quality = 1,
  pixelRatio = 2,
}: UnifiedImageGeneratorConfig): Promise<UnifiedImageGeneratorResult> {
  // Browser environment check
  if (typeof window === "undefined") {
    return {
      blobUrl: null,
      error: "Image generation can only run in the browser.",
    };
  }

  try {
    // Create temporary off-screen container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    // Initialize Konva Stage
    const stage = new Konva.Stage({
      container,
      width,
      height,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // ========================================================================
    // LAYER 1: Render Overlay Images BEHIND Background
    // ========================================================================
    const behindImages = overlayImages.filter((img) => img.behindBackground);
    const sortedBehindImages = sortByZIndex(behindImages);

    for (const overlay of sortedBehindImages) {
      if (!overlay?.src) continue;

      try {
        const img = await loadImage(overlay.src, true);

        const offsetX = overlay.offsetX ?? overlay.width / 2;
        const offsetY = overlay.offsetY ?? overlay.height / 2;

        const konvaImage = new Konva.Image({
          image: img,
          x: overlay.x,
          y: overlay.y,
          width: overlay.width,
          height: overlay.height,
          cornerRadius: overlay.cornerRadius || 0,
          offsetX,
          offsetY,
          skewX: overlay.skewX || 0,
          skewY: overlay.skewY || 0,
          scaleX: overlay.scaleX || 1,
          scaleY: overlay.scaleY || 1,
          rotation: overlay.rotation || 0,
        });

        layer.add(konvaImage);
      } catch (err) {
        console.warn("Failed to load behind-background image:", overlay.src);
      }
    }

    // ========================================================================
    // LAYER 2: Render Background Image
    // ========================================================================
    if (backgroundImage?.src) {
      try {
        const bgImg = await loadImage(backgroundImage.src, false);

        const bgKonvaImage = new Konva.Image({
          image: bgImg,
          x: 0,
          y: 0,
          width: backgroundImage.width || width,
          height: backgroundImage.height || height,
        });

        layer.add(bgKonvaImage);
      } catch (err) {
        console.warn("Failed to load background image:", backgroundImage.src);
      }
    }

    // ========================================================================
    // LAYER 3: Render Overlay Images ABOVE Background
    // ========================================================================
    const aboveImages = overlayImages.filter((img) => !img.behindBackground);
    const sortedAboveImages = sortByZIndex(aboveImages);

    for (const overlay of sortedAboveImages) {
      if (!overlay?.src) continue;

      try {
        const img = await loadImage(overlay.src, true);

        const offsetX = overlay.offsetX ?? overlay.width / 2;
        const offsetY = overlay.offsetY ?? overlay.height / 2;

        const konvaImage = new Konva.Image({
          image: img,
          x: overlay.x,
          y: overlay.y,
          width: overlay.width,
          height: overlay.height,
          cornerRadius: overlay.cornerRadius || 0,
          offsetX,
          offsetY,
          skewX: overlay.skewX || 0,
          skewY: overlay.skewY || 0,
          scaleX: overlay.scaleX || 1,
          scaleY: overlay.scaleY || 1,
          rotation: overlay.rotation || 0,
        });

        layer.add(konvaImage);
      } catch (err) {
        console.warn("Failed to load overlay image:", overlay.src);
      }
    }

    // ========================================================================
    // LAYER 4: Render Text Blocks with Backgrounds
    // ========================================================================
    const sortedTextBlocks = sortByZIndex(textBlocks);

    for (const txt of sortedTextBlocks) {
      if (!txt?.text) continue;

      const textContent = txt.maxChars
        ? txt.text.slice(0, txt.maxChars)
        : txt.text;

      const konvaText = new Konva.Text({
        text: textContent,
        x: txt.x,
        y: txt.y,
        width: txt.width,
        fontSize: txt.fontSize || 16,
        fontFamily: txt.fontFamily || "Arial",
        fill: txt.fill || "black",
        align: txt.align || "left",
        lineHeight: txt.lineHeight || 1.2,
        wrap: "word",
      });

      if (txt.verticalAlign) {
        const textHeight = konvaText.height();
        if (txt.verticalAlign === "middle") {
          konvaText.y(txt.y - textHeight / 2);
        } else if (txt.verticalAlign === "bottom") {
          konvaText.y(txt.y - textHeight);
        }
      }

      if (txt.backgroundColor) {
        const padding = txt.padding || 0;
        const bgRect = new Konva.Rect({
          x: konvaText.x() - padding,
          y: konvaText.y() - padding,
          width: konvaText.width() + padding * 2,
          height: konvaText.height() + padding * 2,
          fill: txt.backgroundColor,
          cornerRadius: 4,
        });
        layer.add(bgRect);
      }

      layer.add(konvaText);
    }

    layer.batchDraw();

    // ========================================================================
    // STEP 5: Export as Blob URL
    // ========================================================================
    const blob = await new Promise<Blob | null>((resolve) => {
      stage.toBlob({
        callback: (blob) => resolve(blob),
        mimeType,
        quality,
        pixelRatio,
      });
    });

    stage.destroy();
    container.remove();

    if (!blob) {
      return {
        blobUrl: null,
        error: "Failed to generate image blob",
      };
    }

    const blobUrl = URL.createObjectURL(blob);

    return {
      blobUrl,
      error: null,
    };
  } catch (err) {
    console.error("Error generating image:", err);
    return {
      blobUrl: null,
      error:
        "Something went wrong while creating your image. Please try again.",
    };
  }
}

// ============================================================================
// EXPORT ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Generate greeting card (alias for generateUnifiedImage)
 */
export const GenerateCardImage = GenerateImage;

/**
 * Generate calendar preview with blob URL output
 *
 * @param croppedImageUrl - URL of the cropped user image
 * @param previewConfig - Configuration for calendar preview
 * @returns Promise resolving to blob URL string
 */
export async function generateCalendarPreviewBlob(
  croppedImageUrl: string,
  previewConfig: {
    baseImageUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
    perspective?: {
      skewX?: number;
      skewY?: number;
      scaleX?: number;
      scaleY?: number;
      rotation?: number;
    };
  },
): Promise<string> {
  const result = await GenerateImage({
    width: 1200,
    height: 1600,
    backgroundImage: { src: previewConfig.baseImageUrl },
    overlayImages: [
      {
        src: croppedImageUrl,
        x: previewConfig.x,
        y: previewConfig.y,
        width: previewConfig.width,
        height: previewConfig.height,
        cornerRadius: previewConfig.borderRadius || 8,
        skewX: previewConfig.perspective?.skewX || 0,
        skewY: previewConfig.perspective?.skewY || 0,
        scaleX: previewConfig.perspective?.scaleX || 1,
        scaleY: previewConfig.perspective?.scaleY || 1,
        rotation: previewConfig.perspective?.rotation || 0,
        zIndex: 1,
      },
    ],
    pixelRatio: 2,
  });

  if (result.error || !result.blobUrl) {
    throw new Error(result.error || "Failed to generate calendar preview");
  }

  return result.blobUrl;
}

export default GenerateImage;
