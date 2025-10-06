"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { MdDelete, MdDragIndicator } from "react-icons/md";
import { Cropper, RectangleStencil } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { getMimeType } from "advanced-cropper/extensions/mimes";
import {
  FaTrashAlt,
  FaRedo,
  FaSearchPlus,
  FaSearchMinus,
  FaCrop,
  FaRegImage,
  FaSyncAlt,
  FaSave,
  FaSlidersH,
  FaTimes,
} from "react-icons/fa";
import UploadFile from "@services/uploadFile";
import CalendarPreviewKonva from "./CalendarPreviewKonva";
import { ImageCropper } from "./ImageCropper";

const CONFIG = {
  maxImages: 12,
  acceptedFormats: "image/*",
  maxFileSize: 10 * 1024 * 1024,
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Utility function to convert dataURL to blob
const dataURLToBlob = (dataURL) => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Utility function to get photo dimensions from project data
const getPhotoDims = (projectData) => {
  try {
    const firstArtwork = projectData?.artworks?.[0];
    const settings = firstArtwork?.settings || {};
    const w = Number(settings.photo_width) || null;
    const h = Number(settings.photo_height) || null;
    if (w && h) return { w, h };
  } catch {}
  return { w: 700, h: 700 };
};

// Crop Modal Component - Updated to match PhotoUpload styling
const CropModal = ({
  doctorHash,
  image,
  onSave,
  onCancel,
  projectData,
  monthName,
  cropDimensions,
  currentIndex,
  totalImages,
}) => {
  const cropperRef = useRef(null);
  const imageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [editMode, setEditMode] = useState("crop");
  const [isUploading, setIsUploading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const { w: cropWidth, h: cropHeight } = cropDimensions;
  const ratio = cropWidth / cropHeight;

  const currentFilterStyle = {
    filter: `contrast(${contrast}%) brightness(${brightness}%) saturate(${saturate}%)`,
  };

  const rotateImage = (direction) => {
    setRotation((prev) => prev + 90 * direction);
  };

  const handleZoom = (delta) => {
    setZoom((prev) => Math.max(0.5, Math.min(prev + delta * 0.1, 3)));
  };

  const resetEdits = () => {
    setZoom(1);
    setRotation(0);
    setContrast(100);
    setBrightness(100);
    setSaturate(100);
    setEditMode("crop");
    setPosition({ x: 0, y: 0 });
  };

  const toggleCropMode = () => {
    setEditMode((prev) => (prev === "crop" ? "edit" : "crop"));
  };

  const saveCroppedImage = async () => {
    setIsUploading(true);

    try {
      let canvas = null;
      const { w: cropWidth, h: cropHeight } = cropDimensions;

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

        ctx.clearRect(0, 0, size, size);
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
        const now = new Date();
        const blobName = `image-${now
          .toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
          .replace(/[/, ]/g, "_")
          .replace(/:/g, "-")}.png`;

        const dataUrl = canvas.toDataURL("image/png");
        const imageBlob = dataURLToBlob(dataUrl);

        const cropperFileName = `cropped_${monthName}_${blobName}`;
        const originalFileName = `original_${monthName}_${blobName}`;

        const uploadedCroppedFileUrl = await UploadFile(
          doctorHash,
          projectData,
          imageBlob,
          cropperFileName,
          "image",
        );

        const uploadedOriginalFileUrl = await UploadFile(
          doctorHash,
          projectData,
          image.file,
          originalFileName,
          "image",
        );

        onSave({
          croppedImage: uploadedCroppedFileUrl,
          originalImage: uploadedOriginalFileUrl,
          name: image.name,
          id: image.replaceId || image.id,
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Edit Image - {monthName}
              </h3>
              <p className="text-sm text-gray-400">
                {currentIndex + 1} of {totalImages} images
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              disabled={isUploading}
            >
              <FaTimes size={24} />
            </button>
          </div>
          <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center h-80 mb-6">
            {editMode === "crop" ? (
              <Cropper
                ref={cropperRef}
                src={image.src}
                stencilComponent={RectangleStencil}
                stencilProps={{
                  stencilSize: { width: cropWidth, height: cropHeight },
                  movable: true,
                  resizable: true,
                }}
                aspectRatio={ratio}
                imageClassName="cropper-image"
                className="cropper"
                backgroundClassName="cropper-bg"
                canvas={true}
                checkOrientation={true}
                imageRestriction="stencil"
                priority="coordinates"
                transformImage={{ adjustStencil: true }}
                transitions={true}
              />
            ) : (
              <img
                ref={imageRef}
                src={image.src}
                alt="Preview"
                className="max-h-80 transition-all duration-200"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: "center",
                  ...currentFilterStyle,
                  marginLeft: `${position.x}px`,
                  marginTop: `${position.y}px`,
                }}
              />
            )}
          </div>

          {/* Status and Action Buttons */}
          <div className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center">
            <div className="text-white mb-2 md:mb-0">
              <p className="text-sm text-gray-400">Filename: {image.name}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm mr-2">Zoom: {zoom.toFixed(1)}x</span>
                <span className="text-sm">Rotation: {rotation}°</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isUploading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCroppedImage}
                disabled={isUploading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main ImageCaptureComponent
const ImageCaptureComponent = ({
  projectData,
  formData,
  setFormData,
  ui,
  doctorHash,
}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [error, setError] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Load saved images from localStorage on component mount
  useEffect(() => {
    const savedImages = formData?.calendar_images;
    if (savedImages) {
      try {
        setSelectedImages(savedImages);
      } catch (e) {
        console.error("Error loading saved images:", e);
      }
    }
  }, []);

  // Save to localStorage whenever selectedImages changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, calendar_images: selectedImages }));
  }, [selectedImages]);

  const cropDimensions = getPhotoDims(projectData);

  const handleImageSelection = useCallback(
    (event, source = "gallery", replaceId = null) => {
      const files = Array.from(event.target.files);

      if (files.length === 0) return;

      const currentCount = selectedImages.length;
      const remainingSlots = CONFIG.maxImages - currentCount;

      if (replaceId && files.length > 1) {
        setError("You can only replace with one image at a time");
        return;
      }

      let filesToProcess = files;
      let warningMessage = "";

      if (!replaceId) {
        if (remainingSlots === 0) {
          setError(
            `Maximum limit of ${CONFIG.maxImages} images reached. Remove some images first.`,
          );
          return;
        }

        if (files.length > remainingSlots) {
          filesToProcess = files.slice(0, remainingSlots);
          warningMessage = `Only ${remainingSlots} images were added. You selected ${files.length} files but only ${remainingSlots} slots are available.`;
        }
      }

      const validFiles = [];
      const invalidFiles = [];

      filesToProcess.forEach((file) => {
        if (file.size > CONFIG.maxFileSize) {
          invalidFiles.push(
            `${file.name} is too large (max ${CONFIG.maxFileSize / (1024 * 1024)}MB)`,
          );
        } else if (!file.type.startsWith("image/")) {
          invalidFiles.push(`${file.name} is not a valid image format`);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        const errorMsg = `Invalid files: ${invalidFiles.join(", ")}`;
        setError(
          warningMessage ? `${warningMessage}\n\nAlso, ${errorMsg}` : errorMsg,
        );
        return;
      }

      const processFiles = async () => {
        const newImages = [];

        for (const file of validFiles) {
          const reader = new FileReader();
          const base64Promise = new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });

          const base64 = await base64Promise;
          newImages.push({
            id: replaceId || Date.now() + Math.random(),
            src: base64,
            name: file.name,
            type: source,
            file: file,
            needsCropping: true,
            replaceId: replaceId,
          });
        }

        if (replaceId) {
          // For replacement, add to pending and start cropping immediately
          setPendingImages([newImages[0]]);
          setCurrentCropIndex(0);
          setIsProcessing(true);
        } else {
          // For new images, add to pending and start cropping
          setPendingImages(newImages);
          setCurrentCropIndex(0);
          setIsProcessing(true);
        }

        if (warningMessage) {
          setError(warningMessage);
        } else {
          setError("");
        }
      };

      processFiles();

      if (event.target) {
        event.target.value = "";
      }
    },
    [selectedImages.length],
  );

  const handleCropSave = useCallback(
    (croppedData) => {
      const currentPendingImage = pendingImages[currentCropIndex];

      if (currentPendingImage.replaceId) {
        // Replace existing image
        setSelectedImages((prev) =>
          prev.map((img) =>
            img.id === currentPendingImage.replaceId
              ? {
                  ...croppedData,
                  needsCropping: false,
                  id: currentPendingImage.replaceId, // Keep original ID
                }
              : img,
          ),
        );
      } else {
        // Add new image
        setSelectedImages((prev) => [
          ...prev,
          {
            ...croppedData,

            needsCropping: false,
          },
        ]);
      }

      // Move to next image or finish
      const nextIndex = currentCropIndex + 1;
      if (nextIndex < pendingImages.length) {
        setCurrentCropIndex(nextIndex);
      } else {
        // All images processed
        setPendingImages([]);
        setCurrentCropIndex(null);
        setIsProcessing(false);
      }
    },
    [currentCropIndex, pendingImages],
  );

  const handleCropCancel = useCallback(() => {
    setPendingImages([]);
    setCurrentCropIndex(null);
    setIsProcessing(false);
  }, []);

  const handleReplaceImage = useCallback(
    (imageId, cameraType = "gallery") => {
      const tempInput = document.createElement("input");
      tempInput.type = "file";
      tempInput.accept = CONFIG.acceptedFormats;

      if (cameraType === "camera") {
        tempInput.capture = "environment";
      }

      tempInput.onchange = (e) => handleImageSelection(e, cameraType, imageId);
      tempInput.click();
    },
    [handleImageSelection],
  );

  const removeImage = useCallback((imageId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
    setError("");
  }, []);

  const clearAllImages = useCallback((event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedImages([]);
    setFormData((prev) => ({ ...prev, calendar_images: [] }));
    setError("");
  }, []);

  const toggleMenu = useCallback((imageId, event) => {
    event.preventDefault();
    event.stopPropagation();

    const menu = document.getElementById(`menu-${imageId}`);

    document.querySelectorAll('[id^="menu-"]').forEach((m) => {
      if (m.id !== `menu-${imageId}`) {
        m.style.display = "none";
      }
    });

    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }, []);

  const handleReplaceClick = useCallback(
    (imageId, cameraType, event) => {
      event.preventDefault();
      event.stopPropagation();

      handleReplaceImage(imageId, cameraType);
      document.getElementById(`menu-${imageId}`).style.display = "none";
    },
    [handleReplaceImage],
  );

  // Drag and drop handlers
  const handleDragStart = useCallback((e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";

    // Only set the current element as the drag image
    const dragElement = e.currentTarget; // this div represents one image card
    const rect = dragElement.getBoundingClientRect();

    // Use a small offset to make it feel natural
    e.dataTransfer.setDragImage(dragElement, rect.width / 2, rect.height / 2);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault();

      if (draggedItem === null || draggedItem === dropIndex) {
        setDraggedItem(null);
        setDragOverIndex(null);
        return;
      }

      const updatedImages = [...selectedImages];

      // 🔄 Swap the two images instead of shifting
      const temp = updatedImages[draggedItem];
      updatedImages[draggedItem] = updatedImages[dropIndex];
      updatedImages[dropIndex] = temp;

      setSelectedImages(updatedImages);
      setDraggedItem(null);
      setDragOverIndex(null);
    },
    [draggedItem, selectedImages],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const handlePreviewOpen = (image, index) => {
    setPreviewData({
      previewImageSrc: image.croppedImage || image.src,
      monthName: MONTH_NAMES[index], // e.g., ["January", "February", ...]
      calendarPreviewConfig: {
        baseImageUrl: "/calendar.png", // your mockup image path
        x: 716.5, // example placement
        y: 265,
        width: 184,
        height: 177,
        borderRadius: 10,
        perspective: {
          skewX: 0,
          skewY: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
        },
      },
    });
  };

  const remainingSlots = CONFIG.maxImages - selectedImages.length;

  const getMonthName = (index) => {
    return MONTH_NAMES[index] || `Month ${index + 1}`;
  };

  return (
    <div className="bg-gray-900">
      {previewData && (
        <CalendarPreviewKonva
          previewImageSrc={previewData.previewImageSrc}
          monthName={previewData.monthName}
          calendarPreviewConfig={previewData.calendarPreviewConfig}
          onClose={() => setPreviewData(null)}
          isDarkMode={true}
        />
      )}
      <h2 className="text-2xl font-bold text-white mb-6">Calendar Images</h2>

      {error && (
        <div className="text-red-400 mb-4 text-sm bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      {/* Upload Controls */}
      <div className="mb-2 flex gap-1">
        <label
          className={`
            py-2 rounded-lg text-white font-medium text-base w-full text-center
            inline-block transition-all duration-200 cursor-pointer
            ${
              remainingSlots > 0 && !isProcessing
                ? "bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-md hover:shadow-lg"
                : "bg-gray-700 cursor-not-allowed opacity-60"
            }
          `}
          title={
            isProcessing
              ? "Please finish cropping current images"
              : remainingSlots > 0
                ? "Take a photo with your camera"
                : "Maximum limit reached"
          }
        >
          📷 Take Photo
          <input
            ref={cameraInputRef}
            type="file"
            accept={CONFIG.acceptedFormats}
            capture="environment"
            onChange={(e) => handleImageSelection(e, "camera")}
            disabled={remainingSlots === 0 || isProcessing}
            className="hidden"
          />
        </label>

        <label
          className={`
            py-2 rounded-lg text-white font-medium text-base w-full text-center
            inline-block transition-all duration-200 cursor-pointer
            ${
              remainingSlots > 0 && !isProcessing
                ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg"
                : "bg-gray-700 cursor-not-allowed opacity-60"
            }
          `}
          title={
            isProcessing
              ? "Please finish cropping current images"
              : remainingSlots > 0
                ? `Choose up to ${remainingSlots} photos from gallery`
                : "Maximum limit reached"
          }
        >
          📁 Choose Photos
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={CONFIG.acceptedFormats}
            onChange={(e) => handleImageSelection(e, "gallery")}
            disabled={remainingSlots === 0 || isProcessing}
            className="hidden"
          />
        </label>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="mb-1 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-blue-300 font-medium">
              Processing images... {currentCropIndex + 1} of{" "}
              {pendingImages.length}
            </p>
          </div>
        </div>
      )}

      {/* Selected Images Grid */}
      {selectedImages.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-300">
            Selected Images ({selectedImages.length}/{CONFIG.maxImages})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {selectedImages.map((image, index) => (
              <div
                key={image.id}
                className={`
                  flex flex-col bg-gray-800 border-2 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-move
                  ${draggedItem === index ? "opacity-50 transform rotate-3 scale-105" : ""}
                  ${dragOverIndex === index ? "border-blue-500 bg-blue-900 bg-opacity-30" : "border-gray-700"}
                `}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                {/* Month Header */}
                <div className="bg-gray-700 text-white text-center py-0.5 text-sm font-semibold flex items-center justify-center gap-2">
                  <MdDragIndicator className="h-4 w-4 text-gray-400" />
                  {getMonthName(index)}
                </div>

                {/* Image Preview */}
                <div
                  className="relative w-full h-20 overflow-hidden"
                  onClick={() => handlePreviewOpen(image, index)}
                >
                  <img
                    src={image.croppedImage || image.src}
                    alt={`${getMonthName(index)} - ${image.name}`}
                    className="w-full h-full object-cover"
                  />
                  {image.needsCropping && (
                    <div className="absolute inset-0 bg-yellow-500 bg-opacity-30 flex items-center justify-center">
                      <span className="text-yellow-800 text-xs font-bold bg-yellow-400 px-2 rounded">
                        Needs Crop
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 justify-center bg-gray-700 p-1">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      className="w-full bg-blue-600 hover:bg-blue-700 active:scale-105 py-2 border-none rounded flex items-center justify-center shadow-sm transition-all duration-200 text-white"
                      onClick={(e) => toggleMenu(image.id, e)}
                      title={`Replace ${getMonthName(index)} image`}
                    >
                      ↻
                    </button>

                    <div
                      id={`menu-${image.id}`}
                      className="hidden absolute bottom-full left-0 mb-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 min-w-32 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={(e) =>
                          handleReplaceClick(image.id, "camera", e)
                        }
                        className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 border-none transition-colors duration-200"
                      >
                        📷 Camera
                      </button>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleReplaceClick(image.id, "gallery", e)
                        }
                        className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 border-none border-t border-gray-600 transition-colors duration-200"
                      >
                        📁 Gallery
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => removeImage(image.id, e)}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 active:scale-105 border-none rounded flex items-center justify-center shadow-sm transition-all duration-200 text-white"
                    title={`Delete ${getMonthName(index)} image`}
                  >
                    <MdDelete className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedImages.length === 0 && !isProcessing && (
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center h-40 flex flex-col items-center justify-center">
          <div className="text-gray-500 mb-4 bg-gray-800 p-4 rounded-full">
            <FaRegImage size={32} />
          </div>
          <p className="text-gray-400 mb-2">No images selected yet</p>
          <p className="text-gray-500 text-sm">
            Upload up to {CONFIG.maxImages} images for your calendar
          </p>
        </div>
      )}

      {/* Crop Modal */}
      {currentCropIndex !== null && pendingImages[currentCropIndex] && (
        <ImageCropper
          image={{
            src: pendingImages[currentCropIndex].src,
            type: pendingImages[currentCropIndex].file?.type || "image/jpeg",
          }}
          setImage={(newImage) => {
            setPendingImages((prev) => {
              const updated = [...prev];
              updated[currentCropIndex] = {
                ...updated[currentCropIndex],
                src: newImage.src,
              };
              return updated;
            });
          }}
          originalFile={pendingImages[currentCropIndex].file}
          filename={pendingImages[currentCropIndex].name}
          unsavedChanges={true}
          setUnsavedChanges={() => {}}
          isRxPadImage={false}
          formData={formData}
          setFormData={(updater) => {
            const result =
              typeof updater === "function" ? updater(formData) : updater;

            // Extract the saved photo data and trigger handleCropSave
            if (result.photo) {
              handleCropSave({
                croppedImage: result.photo.croppedImage,
                originalImage: result.photo.originalImage,
                name: pendingImages[currentCropIndex].name,
                id:
                  pendingImages[currentCropIndex].replaceId ||
                  pendingImages[currentCropIndex].id,
              });
            }
          }}
          onClose={handleCropCancel}
          ui={ui}
          doctorHash={doctorHash}
          projectData={projectData}
          cropWidth={cropDimensions.w}
          cropHeight={cropDimensions.h}
          ratio={cropDimensions.w / cropDimensions.h}
          onRemove={() => {
            const currentPending = pendingImages[currentCropIndex];
            if (currentPending.replaceId) {
              // If replacing, cancel the replacement
              handleCropCancel();
            } else {
              // If new image, skip this one
              const nextIndex = currentCropIndex + 1;
              if (nextIndex < pendingImages.length) {
                setCurrentCropIndex(nextIndex);
              } else {
                handleCropCancel();
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default ImageCaptureComponent;
