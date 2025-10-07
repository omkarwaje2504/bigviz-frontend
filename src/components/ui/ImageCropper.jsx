"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Cropper, RectangleStencil } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import {
  FaTrashAlt,
  FaRedo,
  FaSearchPlus,
  FaSearchMinus,
  FaCrop,
  FaSyncAlt,
  FaSave,
  FaSlidersH,
} from "react-icons/fa";
import Button from "./Button";
import UploadFile from "@services/uploadFile";
import { dataURLToBlob, generateFilename } from "@utils/imageHelpers";
import { IoClose } from "react-icons/io5";

export const ImageCropper = ({
  image,
  setImage,
  originalFile,
  filename,
  unsavedChanges,
  setUnsavedChanges,
  isRxPadImage,
  formData,
  setFormData,
  onClose,
  ui,
  doctorHash,
  projectData,
  cropWidth,
  cropHeight,
  ratio,
  onRemove,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [editMode, setEditMode] = useState(null);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isCropperLoading, setIsCropperLoading] = useState(true);

  const cropperRef = useRef(null);
  const imageRef = useRef(null);

  const currentFilterStyle = {
    filter: `contrast(${contrast}%) brightness(${brightness}%) saturate(${saturate}%)`,
  };

  const toggleCropMode = useCallback(() => {
    setEditMode((prev) => (prev === "crop" ? null : "crop"));
  }, []);

  const rotateImage = useCallback(() => {
    setRotation((prev) => prev + 90);
    setUnsavedChanges(true);
  }, [setUnsavedChanges]);

  const handleZoom = useCallback((delta) => {
    setZoom((prev) => Math.max(0.5, Math.min(prev + delta * 0.1, 3)));
  }, []);

  const resetEdits = useCallback(() => {
    if (originalFile) {
      const blob = URL.createObjectURL(originalFile);
      setImage({
        src: blob,
        type: originalFile.type || "image/jpeg",
      });
    }
    setZoom(1);
    setRotation(0);
    setEditMode(null);
    setPosition({ x: 0, y: 0 });
    setContrast(100);
    setBrightness(100);
    setSaturate(100);
    setUnsavedChanges(true);
  }, [originalFile, setImage, setUnsavedChanges]);

  const saveCroppedImage = useCallback(async () => {
    if (!image) return;

    setIsSaving(true);
    let canvas = null;

    try {
      if (editMode === "crop" && cropperRef.current) {
        canvas = cropperRef.current.getCanvas({
          width: cropWidth,
          height: cropHeight,
        });
      } else if (imageRef.current) {
        const imgElement = imageRef.current;
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        const size = Math.max(
          imgElement.naturalWidth,
          imgElement.naturalHeight,
        );

        tempCanvas.width = size;
        tempCanvas.height = size;

        // Fill background with white
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        ctx.filter = `contrast(${contrast}%) brightness(${brightness}%) saturate(${saturate}%)`;
        ctx.drawImage(
          imgElement,
          -imgElement.naturalWidth / 2,
          -imgElement.naturalHeight / 2,
        );
        ctx.restore();

        canvas = tempCanvas;
      }

      if (canvas) {
        const blobName = generateFilename();
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const imageBlob = dataURLToBlob(dataUrl);

        let uploadedCroppedFileUrl;
        const disableCropper =
          projectData?.config?.doctor?.disable_photo_cropper;

        if (!disableCropper) {
          uploadedCroppedFileUrl = await UploadFile(
            doctorHash,
            projectData,
            imageBlob,
            `cropped_${blobName}`,
            "image",
          );
        }

        const uploadedOriginalFileUrl = await UploadFile(
          doctorHash,
          projectData,
          originalFile,
          `original_${blobName}`,
          "image",
        );

        const imageData = {
          croppedImage: disableCropper
            ? uploadedOriginalFileUrl
            : uploadedCroppedFileUrl,
          originalImage: uploadedOriginalFileUrl,
        };

        if (isRxPadImage) {
          setFormData((prev) => ({ ...prev, rxpad_image: imageData }));
        } else {
          setFormData((prev) => ({ ...prev, photo: imageData }));
        }

        resetEdits();
        setEditMode(null);
        setUnsavedChanges(false);
        // onClose();
      }
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    image,
    editMode,
    cropWidth,
    cropHeight,
    rotation,
    zoom,
    contrast,
    brightness,
    saturate,
    doctorHash,
    projectData,
    originalFile,
    isRxPadImage,
    setFormData,
    resetEdits,
    setUnsavedChanges,
    onClose,
  ]);

  return (
    <div
      className="space-y-4 fixed top-0 left-0 w-full h-[100dvh] p-4 bg-black/70 overflow-y-auto"
      style={{ zIndex: 9999 }}
    >
      <div className="max-w-3xl mx-auto h-full space-y-4">
        {/* Toolbar */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={rotateImage}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-lg text-gray-900 dark:text-white transition"
              title="Rotate 90°"
              aria-label="Rotate image"
            >
              <FaRedo size={20} />
            </button>

            <button
              type="button"
              onClick={() => handleZoom(1)}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-lg text-gray-900 dark:text-white transition"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <FaSearchPlus size={20} />
            </button>

            <button
              type="button"
              onClick={() => handleZoom(-1)}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-lg text-gray-900 dark:text-white transition"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <FaSearchMinus size={20} />
            </button>

            <button
              type="button"
              onClick={toggleCropMode}
              className={`p-2 rounded-lg text-gray-900 dark:text-white transition ${
                editMode === "crop"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              }`}
              title="Crop Mode"
              aria-label="Toggle crop mode"
            >
              <FaCrop size={20} />
            </button>

            {/* Filters */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() =>
                  setEditMode((prev) => (prev === "filter" ? null : "filter"))
                }
                className={`p-2 rounded-lg text-gray-900 dark:text-white transition ${
                  editMode === "filter"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                }`}
                title="Adjust Filters"
                aria-label="Toggle filter controls"
              >
                <FaSlidersH size={20} />
              </button>

              {editMode === "filter" && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50 w-64">
                  <h3 className="text-gray-900 dark:text-white font-medium mb-3">
                    Adjust Filters
                  </h3>

                  <div className="mb-3">
                    <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">
                      Contrast: {contrast}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">
                      Brightness: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">
                      Saturation: {saturate}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={saturate}
                      onChange={(e) => setSaturate(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Reset/Remove */}
            <button
              type="button"
              onClick={resetEdits}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-lg text-gray-900 dark:text-white md:hidden transition"
              title="Reset All Edits"
              aria-label="Reset edits"
            >
              <FaSyncAlt size={20} />
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="bg-red-500 hover:bg-red-600 p-2 rounded-lg text-white md:hidden transition ml-4"
              title="Remove Image"
              aria-label="Remove image"
            >
              <IoClose size={20} />
            </button>
          </div>

          {/* Desktop Reset/Remove */}
          <div className="gap-3 hidden md:flex">
            <button
              type="button"
              onClick={resetEdits}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-lg text-gray-900 dark:text-white transition"
              title="Reset All Edits"
              aria-label="Reset edits"
            >
              <FaSyncAlt size={20} />
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="bg-red-500 hover:bg-red-600 p-2 rounded-lg text-white transition ml-4"
              title="Remove Image"
              aria-label="Remove image"
            >
              <IoClose size={20} />
            </button>
          </div>
        </div>

        {/* Image Preview/Editor */}
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center min-h-[50%]">
          {isCropperLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-900 bg-opacity-70 z-50">
              <FaSyncAlt className="animate-spin text-gray-800 dark:text-white text-3xl" />
            </div>
          )}

          {isSaving && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <FaSyncAlt className="animate-spin text-white text-3xl" />
              <span className="ml-3 text-white font-medium">Saving...</span>
            </div>
          )}

          {editMode === "crop" ? (
            <div className="absolute inset-0 h-full bg-white flex items-center justify-center w-full">
              <Cropper
                ref={cropperRef}
                src={image?.src}
                stencilComponent={RectangleStencil}
                stencilProps={{
                  aspectRatio: ratio,
                  movable: true,
                  resizable: true,
                }}
                aspectRatio={ratio}
                imageClassName="cropper-image"
                backgroundClassName="cropper-bg"
                className="cropper w-full h-full"
                canvas={true}
                checkOrientation={true}
                onReady={() => setIsCropperLoading(false)}
                priority="coordinates"
                transformImage={{ adjustStencil: true }}
                transitions={true}
              />
            </div>
          ) : (
            image?.src && (
              <img
                ref={imageRef}
                src={image.src}
                alt="Preview"
                className="max-h-[50%] md:max-h-[60dvh] transition-all duration-200"
                onLoad={() => setIsCropperLoading(false)}
                onError={() => setIsCropperLoading(false)}
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: "center",
                  ...currentFilterStyle,
                  marginLeft: `${position.x}px`,
                  marginTop: `${position.y}px`,
                }}
              />
            )
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-gray-800 dark:text-white w-full md:w-auto overflow-hidden">
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-full">
              Filename: {filename}
            </p>
            <div className="flex flex-wrap items-center mt-1 text-sm text-gray-700 dark:text-gray-300">
              <span className="mr-2">Zoom: {zoom.toFixed(1)}x</span>
              <span>Rotation: {rotation}°</span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end w-full md:w-auto">
            <Button
              ui={ui}
              type="button"
              fullWidth={false}
              leftIcon={
                isSaving ? (
                  <FaSyncAlt className="animate-spin mr-2" />
                ) : (
                  <FaSave size={20} className="mr-2" />
                )
              }
              onClick={saveCroppedImage}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            {unsavedChanges && (
              <p className="text-yellow-500 text-xs mt-1 text-center">
                Unsaved Changes
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
