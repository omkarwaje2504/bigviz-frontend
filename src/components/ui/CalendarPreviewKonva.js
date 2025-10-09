import React, { useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";
import { FaTimes } from "react-icons/fa";

/**
 * Generates a blob URL for a calendar preview image
 * @param {string} previewImageSrc - The source URL of the preview image
 * @param {string} monthName - Name of the month for the calendar
 * @param {Object} calendarPreviewConfig - Configuration object with positioning and styling
 * @returns {Promise<string>} - Promise that resolves to a blob URL
 */
async function generateCalendarPreviewBlob(croppedImageUrl, previewConfig) {
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
          (croppedImageUrl?.includes("?") ? "&" : "?") +
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

export default generateCalendarPreviewBlob;