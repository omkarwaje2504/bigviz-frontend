import React, { useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";
import { FaTimes } from "react-icons/fa";

function CalendarPreviewKonva({
  previewImageSrc,
  monthName,
  calendarPreviewConfig,
  onClose,
  isDarkMode,
  ui,
}) {
  const [mockupImage, setMockupImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadImages = async () => {
      try {
        // Load base calendar mockup
        const baseImage = new window.Image();
        baseImage.crossOrigin = "Anonymous";

        const baseImagePromise = new Promise((resolve, reject) => {
          baseImage.onload = () => resolve(baseImage);
          baseImage.onerror = () =>
            reject(new Error("Failed to load calendar mockup"));

          // Add a cache-busting query param
          const cacheBuster = `cb=${Date.now()}`;
          const url = calendarPreviewConfig.baseImageUrl;

          baseImage.src = url + (url.includes("?") ? "&" : "?") + cacheBuster;
        });

        // Load preview image
        const preview = new window.Image();
        preview.crossOrigin = "Anonymous";

        const previewImagePromise = new Promise((resolve, reject) => {
          preview.onload = () => resolve(preview);
          preview.onerror = () =>
            reject(new Error("Failed to load preview image"));

          const cacheBuster = `cb=${Date.now()}`;
          const url = previewImageSrc;
          preview.src = url + (url.includes("?") ? "&" : "?") + cacheBuster;
        });

        // Wait for both images to load
        const [loadedMockup, loadedPreview] = await Promise.all([
          baseImagePromise,
          previewImagePromise,
        ]);

        if (isMounted) {
          setMockupImage(loadedMockup);
          setPreviewImage(loadedPreview);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [previewImageSrc, calendarPreviewConfig.baseImageUrl]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50">
        <div
          className={`${isDarkMode ? "bg-gray-800 text-white" : "bg-white"} p-6 rounded-lg`}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading preview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div
          className={`${isDarkMode ? "bg-gray-800 text-white" : "bg-white"} p-6 rounded-lg max-w-md`}
        >
          <div className="text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mockupImage || !previewImage) return null;

  const maxWidth = window.innerWidth * 0.9;
  const maxHeight = window.innerHeight * 0.8;
  const scale = Math.min(
    maxWidth / mockupImage.width,
    maxHeight / mockupImage.height,
    1, // Never scale up
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 w-full bg-gray-600 border-b border-gray-200">
        <h3
          className={`text-lg font-semibold ${isDarkMode ? "text-white" : ""}`}
        >
          Calendar Preview - {monthName}
        </h3>
        <button
          onClick={onClose}
          className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${
            isDarkMode ? "hover:bg-gray-700 text-white" : ""
          }`}
        >
          <FaTimes />
        </button>
      </div>

      {/* Konva Canvas Container */}
      <div className="flex items-center justify-center overflow-hidden max-h-96">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <Stage
            width={mockupImage.width}
            height={mockupImage.height}
            style={{
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              background: "white",
            }}
          >
            <Layer>
              <KonvaImage
                image={previewImage}
                x={calendarPreviewConfig.x}
                y={calendarPreviewConfig.y}
                width={calendarPreviewConfig.width}
                height={calendarPreviewConfig.height}
                listening={false}
                draggable={false}
                cornerRadius={calendarPreviewConfig.borderRadius || 8}
                // Add perspective transforms
                skewX={calendarPreviewConfig.perspective?.skewX || 0}
                skewY={calendarPreviewConfig.perspective?.skewY || 0}
                scaleX={calendarPreviewConfig.perspective?.scaleX || 1}
                scaleY={calendarPreviewConfig.perspective?.scaleY || 1}
                rotation={calendarPreviewConfig.perspective?.rotation || 0}
                offsetX={calendarPreviewConfig.width / 2} // Set transform origin to center
                offsetY={calendarPreviewConfig.height / 2}
              />
              <KonvaImage
                image={mockupImage}
                x={0}
                y={0}
                listening={false}
                draggable={false}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

/**
 * Generates a blob URL for a calendar preview image
 * @param {string} previewImageSrc - The source URL of the preview image
 * @param {string} monthName - Name of the month for the calendar
 * @param {Object} calendarPreviewConfig - Configuration object with positioning and styling
 * @returns {Promise<string>} - Promise that resolves to a blob URL
 */
export async function generateCalendarPreviewBlob(
  croppedImageUrl,
  previewConfig,
) {
  return new Promise(async (resolve, reject) => {
    try {
      // Load base calendar mockup image
      const baseImage = new window.Image();
      baseImage.crossOrigin = "Anonymous";

      const baseImagePromise = new Promise((resolveImg, rejectImg) => {
        baseImage.onload = () => resolveImg(baseImage);
        baseImage.onerror = () =>
          rejectImg(new Error("Failed to load calendar mockup"));

        const cacheBuster = `cb=${Date.now()}`;
        const url = previewConfig.baseImageUrl;
        baseImage.src = url + (url.includes("?") ? "&" : "?") + cacheBuster;
      });

      // Load cropped user image
      const userImage = new window.Image();
      userImage.crossOrigin = "Anonymous";

      const userImagePromise = new Promise((resolveImg, rejectImg) => {
        userImage.onload = () => resolveImg(userImage);
        userImage.onerror = () =>
          rejectImg(new Error("Failed to load user image"));

        const cacheBuster = `cb=${Date.now()}`;
        userImage.src =
          croppedImageUrl +
          (croppedImageUrl.includes("?") ? "&" : "?") +
          cacheBuster;
      });

      // Wait for both images to load
      const [loadedMockup, loadedUserImage] = await Promise.all([
        baseImagePromise,
        userImagePromise,
      ]);

      // Create off-screen Konva Stage
      const { Stage, Layer } = await import("konva/lib/Core");
      const { Image: KonvaImage } = await import("konva/lib/shapes/Image");

      const stage = new Stage({
        container: document.createElement("div"),
        width: loadedMockup.width,
        height: loadedMockup.height,
      });

      const layer = new Layer();
      stage.add(layer);

      // Add user image with transformations
      const userKonvaImage = new KonvaImage({
        image: loadedUserImage,
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
        offsetX: previewConfig.width / 2,
        offsetY: previewConfig.height / 2,
      });

      layer.add(userKonvaImage);

      // Add base mockup image on top
      const mockupKonvaImage = new KonvaImage({
        image: loadedMockup,
        x: 0,
        y: 0,
      });

      layer.add(mockupKonvaImage);
      layer.batchDraw();

      // Convert stage to blob and create URL
      stage.toBlob({
        callback: (blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            resolve(blobUrl);
          } else {
            reject(new Error("Failed to generate blob"));
          }
        },
        mimeType: "image/png",
        quality: 1,
        pixelRatio: 2, // Higher quality export
      });
    } catch (error) {
      reject(error);
    }
  });
}

export default CalendarPreviewKonva;
