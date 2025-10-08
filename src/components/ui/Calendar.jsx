"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { MdDelete, MdDragIndicator } from "react-icons/md";
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
  FaCamera,
} from "react-icons/fa";
import UploadFile from "@services/uploadFile";
import generateCalendarPreviewBlob from "./CalendarPreviewKonva";
import { ImageCropper } from "./ImageCropper";
import PreviewModal from "./PreviewModal";
import { CALENDAR_PREVIEW_CONFIG } from "./CalendarConsent";
import { getPhotoDims } from "@utils/imageHelpers";
import { FaBahai } from "react-icons/fa6";

const CONFIG = {
  maxImages: 12,
  acceptedFormats: "image/*",
  maxFileSize: 10 * 1024 * 1024,
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CalendarPage = ({
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
    const media = formData?.media;

    if (media && typeof media === "object") {
      const images = [];

      MONTH_NAMES.forEach((month, index) => {
        const key = month.toLowerCase();
        const original = media[key];
        const cropped = media[`${key}_cropped`];
        const traillingPath = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

        if (original || cropped) {
          images.push({
            id: `${key}-${index}`,
            month: key,
            name: `${month} Image`,
            needsCropping: false,
            [`${key}`]: traillingPath +"/"+ original || "",
            [`${key}_cropped`]: traillingPath +"/"+ cropped || "",
          });
        }
      });

      if (images.length > 0) {
        setSelectedImages(images);
      }
    } else if (formData?.calendar_images) {
      setSelectedImages(formData.calendar_images);
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
        // Create all FileReader promises at once
        const imagePromises = validFiles.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: replaceId || Date.now() + Math.random(),
                src: reader.result,
                name: file.name,
                type: source,
                file: file,
                needsCropping: true,
                replaceId: replaceId,
              });
            };
            reader.readAsDataURL(file);
          });
        });

        // Wait for ALL images to be read
        const newImages = await Promise.all(imagePromises);

        if (replaceId) {
          // For replacement, add to pending and start cropping immediately
          setPendingImages([newImages[0]]);
          setCurrentCropIndex(0);
          setIsProcessing(true);
        } else {
          // For new images, add ALL to pending and start cropping
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
    [selectedImages],
  );

  const handleCropSave = useCallback(
    (croppedData) => {
      const currentPendingImage = pendingImages[currentCropIndex];

      // Determine the month name based on the current selectedImages length
      const currentMonthIndex = selectedImages.length;
      const monthName = MONTH_NAMES[currentMonthIndex]
        ? MONTH_NAMES[currentMonthIndex].toLowerCase()
        : `month_${currentMonthIndex + 1}`;

      // Create formatted image data
      const formattedData = {
        id: currentPendingImage.replaceId || currentPendingImage.id,
        name: currentPendingImage.name,
        needsCropping: false,
        month: monthName,
        [`${monthName}`]: croppedData.originalImage,
        [`${monthName}_cropped`]: croppedData.croppedImage,
      };

      if (currentPendingImage.replaceId) {
        // Replace existing image
        setSelectedImages((prev) =>
          prev.map((img) =>
            img.id === currentPendingImage.replaceId ? formattedData : img,
          ),
        );
      } else {
        // Add new image
        setSelectedImages((prev) => [...prev, formattedData]);
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
    [currentCropIndex, pendingImages, selectedImages],
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

  const handlePreviewOpen = async (image, index) => {
    const previewUrl = await generateCalendarPreviewBlob(
      image.croppedImage,
      CALENDAR_PREVIEW_CONFIG,
    );
    setPreviewData(previewUrl);
  };

  const remainingSlots = CONFIG.maxImages - selectedImages.length;

  const getMonthName = (index) => {
    return MONTH_NAMES[index] || `Month ${index + 1}`;
  };

  return (
    <div className="bg-gray-900">
      {previewData && (
        <PreviewModal
          previewType="IMAGE"
          previewUrl={previewData}
          setPreviewMode={setPreviewData}
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
            py-2 rounded-lg text-white font-medium text-sm w-full text-center justify-center items-center
            flex gap-1 transition-all duration-200 cursor-pointer
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
          <FaCamera className="h-4" /> Take Photo
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
            py-2 rounded-lg text-white font-medium text-sm w-full text-center
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
      <div className="mb-2 flex gap-1">
        <label
          className={`
            py-2 rounded-lg text-white font-medium text-sm w-full text-center
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
          <FaBahai /> Generate with AI
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
            {selectedImages.map((image, index) => {
              const monthKey = image.month || MONTH_NAMES[index]?.toLowerCase();
              const displayMonthName =
                monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

              const previewSrc =
                image[`${monthKey}_cropped`] ||
                image[`${monthKey}`] ||
                image.croppedImage ||
                image.src;

              return (
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
                    {displayMonthName}
                  </div>

                  {/* Image Preview */}
                  <div
                    className="relative w-full h-20 overflow-hidden"
                    onClick={() => handlePreviewOpen(image, index)}
                  >
                    <img
                      src={previewSrc}
                      alt={`${displayMonthName} - ${image.name}`}
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
                        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-105 py-1 border-none rounded flex items-center justify-center shadow-sm transition-all duration-200 text-white"
                        onClick={(e) => toggleMenu(image.id, e)}
                        title={`Replace ${displayMonthName} image`}
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
                          className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 bg-gray-600 border-none transition-colors duration-200"
                        >
                          Camera
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleReplaceClick(image.id, "gallery", e)
                          }
                          className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 border-none border-t border-gray-600 transition-colors duration-200"
                        >
                          Gallery
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => removeImage(image.id, e)}
                      className="flex-1 py-1 bg-red-600 hover:bg-red-700 active:scale-105 border-none rounded flex items-center justify-center shadow-sm transition-all duration-200 text-white"
                      title={`Delete ${displayMonthName} image`}
                    >
                      <MdDelete className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
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

export default CalendarPage;
