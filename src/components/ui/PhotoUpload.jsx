"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  MdDelete,
  MdFindReplace,
  MdDragIndicator,
  MdCrop,
  MdSave,
  MdClose,
} from "react-icons/md";
import { Cropper, RectangleStencil } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";

const CONFIG = {
  maxImages: 12,
  acceptedFormats: "image/*",
  maxFileSize: 5 * 1024 * 1024,
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

const ImageCaptureComponent = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [error, setError] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [cropperModal, setCropperModal] = useState({
    show: false,
    image: null,
    replaceId: null,
    source: null,
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const cropperRef = useRef(null);

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

      if (validFiles.length > 0) {
        const file = validFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          setCropperModal({
            show: true,
            image: e.target.result,
            replaceId,
            source,
            file,
            warningMessage,
          });
        };
        reader.readAsDataURL(file);
      }

      if (event.target) {
        event.target.value = "";
      }
    },
    [selectedImages.length],
  );

  const handleCropSave = useCallback(() => {
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCanvas({
        width: 400,
        height: 400,
      });

      if (canvas) {
        const croppedDataURL = canvas.toDataURL("image/png");
        const blob = dataURLToBlob(croppedDataURL);

        const newImage = {
          id: cropperModal.replaceId || Date.now() + Math.random(),
          src: croppedDataURL,
          name: cropperModal.file.name,
          type: cropperModal.source,
          file: blob,
        };

        if (cropperModal.replaceId) {
          setSelectedImages((prev) =>
            prev.map((img) =>
              img.id === cropperModal.replaceId ? newImage : img,
            ),
          );
        } else {
          setSelectedImages((prev) => [...prev, newImage]);
        }

        if (cropperModal.warningMessage) {
          setError(cropperModal.warningMessage);
        } else {
          setError("");
        }

        setCropperModal({
          show: false,
          image: null,
          replaceId: null,
          source: null,
        });
      }
    }
  }, [cropperModal]);

  const handleCropCancel = useCallback(() => {
    setCropperModal({
      show: false,
      image: null,
      replaceId: null,
      source: null,
    });
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

  const handleDragStart = useCallback((e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
    e.dataTransfer.setDragImage(e.target.parentNode, 60, 40);
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
      const draggedImage = updatedImages[draggedItem];

      updatedImages.splice(draggedItem, 1);

      const actualDropIndex =
        draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
      updatedImages.splice(actualDropIndex, 0, draggedImage);

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

  const remainingSlots = CONFIG.maxImages - selectedImages.length;

  const getMonthName = (index) => {
    return MONTH_NAMES[index] || `Month ${index + 1}`;
  };

  return (
    <div className="">
      <h2 className="text-xl font-semibold mb-2">Calendar Images</h2>

      {error && <div className="text-red-600 mb-2 text-xs">{error}</div>}

      <div className="mb-1 flex gap-1">
        <label
          className={`
          py-3 rounded-lg text-white font-medium text-base min-w-40 text-center
          inline-block transition-all duration-200 cursor-pointer
          ${
            remainingSlots > 0
              ? "bg-green-500 hover:bg-green-600 active:bg-green-700"
              : "bg-gray-400 cursor-not-allowed opacity-60"
          }
        `}
          title={
            remainingSlots > 0
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
            disabled={remainingSlots === 0}
            className="hidden"
          />
        </label>

        <label
          className={`
          py-3 rounded-lg text-white font-medium text-base min-w-40 text-center
          inline-block transition-all duration-200 cursor-pointer
          ${
            remainingSlots > 0
              ? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed opacity-60"
          }
        `}
          title={
            remainingSlots > 0
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
            disabled={remainingSlots === 0}
            className="hidden"
          />
        </label>
      </div>

      {cropperModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MdCrop className="h-5 w-5" />
                Crop Image
              </h3>
              <button
                onClick={handleCropCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdClose className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <Cropper
                ref={cropperRef}
                src={cropperModal.image}
                className="h-96 w-full bg-gray-100"
                stencilComponent={RectangleStencil}
                stencilProps={{
                  aspectRatio: 1,
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCropCancel}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <MdSave className="h-4 w-4" />
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImages.length > 0 && (
        <div>
          <h3 className="text-md font-medium mt-2 mb-1 text-gray-100">
            Selected Images ({selectedImages.length}/{CONFIG.maxImages})
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-1">
            {selectedImages.map((image, index) => (
              <div
                key={image.id}
                className={`
                  flex flex-col bg-white border-2 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-move
                  ${draggedItem === index ? "opacity-50 transform rotate-3 scale-105" : ""}
                  ${dragOverIndex === index ? "border-blue-500 bg-blue-50" : "border-gray-200"}
                `}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold flex items-center justify-center gap-1">
                  <MdDragIndicator className="h-4 w-4 text-gray-400" />
                  {getMonthName(index)}
                </div>

                <div className="relative w-full h-20 overflow-hidden">
                  <img
                    src={image.src}
                    alt={`${getMonthName(index)} - ${image.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex gap-0.5 justify-center bg-gray-50">
                  <div className="relative w-full">
                    <button
                      type="button"
                      className="w-full bg-blue-500 hover:bg-blue-600 active:scale-105 py-1 border-none rounded flex items-center justify-center shadow-sm transition-all duration-200"
                      onClick={(e) => toggleMenu(image.id, e)}
                      title={`Replace ${getMonthName(index)} image`}
                    >
                      <MdFindReplace className="h-4" />
                    </button>

                    <div
                      id={`menu-${image.id}`}
                      className="hidden absolute bottom-8 left-0 bg-white border font-medium border-gray-300 rounded-md shadow-lg z-50 min-w-28 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={(e) =>
                          handleReplaceClick(image.id, "camera", e)
                        }
                        className="block w-full bg-gray-100 border-b border-black px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 border-none transition-colors duration-200"
                      >
                        📷 Camera
                      </button>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleReplaceClick(image.id, "gallery", e)
                        }
                        className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 border-none bg-white border-t border-gray-100 transition-colors duration-200"
                      >
                        📁 Gallery
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => removeImage(image.id, e)}
                    className="w-full py-1 bg-red-500 hover:bg-red-600 active:scale-105 border-none rounded flex items-center justify-center shadow-sm transition-all duration-200"
                    title={`Delete ${getMonthName(index)} image`}
                  >
                    <MdDelete className="h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCaptureComponent;
