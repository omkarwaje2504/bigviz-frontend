"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  FaCalendarAlt,
  FaUpload,
  FaCheck,
  FaTimes,
  FaImage,
  FaSyncAlt,
  FaCamera,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaEye,
  FaPlus,
  FaEdit,
  FaGripVertical,
  FaSearchMinus,
  FaSearchPlus,
  FaRedo,
  FaSlidersH,
} from "react-icons/fa";
import { Cropper, RectangleStencil } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import Button from "@components/ui/Button";
import { DecryptData } from "@utils/cryptoUtils";
import { useRouter } from "next/navigation";
import UploadFile from "@services/uploadFile";
import { getMimeType } from "advanced-cropper/extensions/mimes";
import MyError from "@services/MyError";
import { v4 as uuidv4 } from "uuid";

const months = [
  { name: "January", short: "Jan", emoji: "❄️", season: "winter" },
  { name: "February", short: "Feb", emoji: "💖", season: "winter" },
  { name: "March", short: "Mar", emoji: "🌸", season: "spring" },
  { name: "April", short: "Apr", emoji: "🌷", season: "spring" },
  { name: "May", short: "May", emoji: "🌺", season: "spring" },
  { name: "June", short: "Jun", emoji: "☀️", season: "summer" },
  { name: "July", short: "Jul", emoji: "🏖️", season: "summer" },
  { name: "August", short: "Aug", emoji: "🌻", season: "summer" },
  { name: "September", short: "Sep", emoji: "🍂", season: "autumn" },
  { name: "October", short: "Oct", emoji: "🎃", season: "autumn" },
  { name: "November", short: "Nov", emoji: "🦃", season: "autumn" },
  { name: "December", short: "Dec", emoji: "🎄", season: "winter" },
];

// Mobile-optimized constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Mobile utility functions
const getPhotoDims = (projectData) => {
  try {
    const firstArtwork = projectData?.artworks?.[0];
    const settings = firstArtwork?.settings || {};
    const w = Number(settings.photo_width) || 700;
    const h = Number(settings.photo_height) || 700;
    return { w, h };
  } catch (error) {
    return { w: 700, h: 700 };
  }
};

const getImagesPerPage = (projectData) => {
  try {
    const firstArtwork = projectData?.artworks?.[0];
    const settings = firstArtwork?.settings || {};
    return Number(settings.images_per_page) || 1;
  } catch (error) {
    return 1;
  }
};

const getMultiplePhotoSelection = (projectData) => {
  try {
    const firstArtwork = projectData?.artworks?.[0];
    const settings = firstArtwork?.settings || {};
    return Boolean(settings.multiplePhotoSelection);
  } catch (error) {
    return false;
  }
};

const dataURLToBlob = (dataURL) => {
  try {
    const arr = dataURL.split(",");
    if (arr.length !== 2) {
      throw new Error("Invalid data URL format");
    }

    const mimeMatch = arr[0].match(/:([^;]+)/);
    if (!mimeMatch) {
      throw new Error("Invalid MIME type in data URL");
    }

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  } catch (error) {
    MyError(error);
    console.error("Error converting data URL to Blob:", error);
    throw new Error("Failed to process image data");
  }
};

const validateImageFile = (file) => {
  if (!file) return { isValid: false, errors: ["No file selected"] };

  const errors = [];
  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File too large (max ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB)`,
    );
  }
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    errors.push("Unsupported format");
  }

  return { isValid: errors.length === 0, errors };
};

// Linear distribution function - fills months sequentially
const linearDistribute = (photos, imagesPerPage) => {
  const result = new Array(12).fill(null).map(() => ({ images: [] }));

  if (photos.length === 0) return result;

  // Calculate how many photos each month should get
  const totalSlots = 12 * imagesPerPage;
  const photosToDistribute = Math.min(photos.length, totalSlots);

  // Fill months linearly
  let currentMonth = 0;
  let currentSlotInMonth = 0;

  for (let i = 0; i < photosToDistribute; i++) {
    result[currentMonth].images.push(photos[i]);
    currentSlotInMonth++;

    // Move to next month if current month is full
    if (currentSlotInMonth >= imagesPerPage) {
      currentMonth++;
      currentSlotInMonth = 0;

      // Wrap around to beginning if we've filled all months
      if (currentMonth >= 12) {
        currentMonth = 0;
      }
    }
  }

  return result;
};

export default function MobileCalendarPage({
  projectData,
  formData,
  setFormData,
  projectId,
  ui,
}) {
  // Get project settings
  const imagesPerPage = useMemo(
    () => getImagesPerPage(projectData),
    [projectData],
  );
  const multiplePhotoSelection = useMemo(
    () => getMultiplePhotoSelection(projectData),
    [projectData],
  );
  const maxPhotos = useMemo(
    () => (multiplePhotoSelection ? 12 * imagesPerPage : 12),
    [multiplePhotoSelection, imagesPerPage],
  );

  // Mobile-optimized states
  const [photos, setPhotos] = useState([]);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);

  const [calendarData, setCalendarData] = useState(() => {
    try {
      const existingData = formData?.calendarData || [];
      if (Array.isArray(existingData) && existingData.length === 12) {
        return existingData;
      }
      return new Array(12).fill(null).map(() => ({ images: [] }));
    } catch {
      return new Array(12).fill(null).map(() => ({ images: [] }));
    }
  });

  // Upload states
  const [error, setError] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [currentCropImage, setCurrentCropImage] = useState(null);
  const [editingImageId, setEditingImageId] = useState(null);

  // Mobile-specific states
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const cropperRef = useRef(null);

  const router = useRouter();
  const { w: cropWidth, h: cropHeight } = useMemo(
    () => getPhotoDims(projectData),
    [projectData],
  );

  // Mobile calculations
  const totalPhotos = useMemo(
    () =>
      photos.length +
      calendarData.reduce(
        (sum, month) => sum + (month?.images?.length || 0),
        0,
      ),
    [photos, calendarData],
  );
useEffect(() => {
  if (
    calendarData.some((m) => m.images.length > 0) &&
    JSON.stringify(calendarData) !== JSON.stringify(formData?.calendarData)
  ) {
    setFormData((prev) => ({ ...prev, calendarData }));
  }
}, [calendarData, formData?.calendarData, setFormData]);

  // Auto-generate calendar when photos are processed
  useEffect(() => {
    const processedImages = photos
      .filter((p) => p.processed)
      .map((p) => p.data);
    if (processedImages.length > 0) {
      const distributedData = linearDistribute(processedImages, imagesPerPage);
      setCalendarData(distributedData);
    }
  }, [photos, imagesPerPage]);


  useEffect(() => {
  // Only hydrate if formData has calendarData
  if (formData?.calendarData?.length === 12) {
    const restoredPhotos = formData.calendarData.flatMap((month) =>
      (month.images || []).map((img) => ({
        id: uuidv4(),
        processed: true,
        data: img,
        preview: img.croppedImage, // fallback for preview grid
      }))
    );

    if (restoredPhotos.length > 0) {
      setPhotos(restoredPhotos);
    }
  }
}, [formData]);


  // File selection handler with limit enforcement
  const handleFileSelect = useCallback(
    (files) => {
      const fileArray = Array.from(files);
      const currentPhotoCount = photos.length;
      const availableSlots = maxPhotos - currentPhotoCount;

      if (availableSlots <= 0) {
        setError(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      // Limit files to available slots
      const filesToProcess = fileArray.slice(0, availableSlots);
      const skippedFiles = fileArray.length - filesToProcess.length;

      const validFiles = [];
      const errors = [];

      filesToProcess.forEach((file) => {
        const validation = validateImageFile(file);
        if (validation.isValid) {
          validFiles.push({
            file,
            id: uuidv4(),
            preview: URL.createObjectURL(file),
            processed: false,
          });
        } else {
          errors.push(`${file.name}: ${validation.errors.join(", ")}`);
        }
      });

      if (errors.length > 0) {
        setError(errors.join("; "));
      }

      if (skippedFiles > 0) {
        setError(
          `${skippedFiles} files skipped (max ${maxPhotos} photos allowed)`,
        );
      }

      if (validFiles.length > 0) {
        setPhotos((prev) => [...prev, ...validFiles]);

        // Auto-crop first unprocessed photo
        const firstUnprocessed =
          validFiles.find((f) => !f.processed) || validFiles[0];
        if (firstUnprocessed) {
          setTimeout(() => {
            setCurrentCropImage(firstUnprocessed);
            setShowCropper(true);
          }, 300);
        }
      }
    },
    [photos.length, maxPhotos],
  );

  // Camera and gallery handlers
  const handleCameraCapture = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (photos.length >= maxPhotos) {
        setError(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      cameraInputRef.current?.click();
    },
    [photos.length, maxPhotos],
  );

  const handleGallerySelect = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (photos.length >= maxPhotos) {
        setError(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      fileInputRef.current?.click();
    },
    [photos.length, maxPhotos],
  );

  // Process cropped photo
  const processSinglePhoto = useCallback(
    async (e, photoData) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!cropperRef.current) return;

      setIsProcessing(true);

      try {
        const canvas = cropperRef.current.getCanvas({
          width: cropWidth,
          height: cropHeight,
        });

        const dataUrl = canvas.toDataURL("image/png", 0.9);
        const croppedBlob = dataURLToBlob(dataUrl);

        const timestamp = Date.now();
        const croppedName = `calendar-crop-${timestamp}.png`;
        const originalName = `calendar-orig-${timestamp}.${photoData.file.name.split(".").pop()}`;

        const [croppedUrl, originalUrl] = await Promise.all([
          UploadFile(projectData, croppedBlob, croppedName, "image"),
          UploadFile(projectData, photoData.file, originalName, "image"),
        ]);

        const processedImage = {
          id: photoData.id,
          croppedImage: croppedUrl,
          originalImage: originalUrl,
          uploadedAt: new Date().toISOString(),
        };

        // Update photos and get the next unprocessed photo in the same operation
        setPhotos((prevPhotos) => {
          const updatedPhotos = prevPhotos.map((p) =>
            p.id === photoData.id
              ? { ...p, processed: true, data: processedImage }
              : p,
          );

          // Find next unprocessed photo from the updated array
          const nextUnprocessed = updatedPhotos.find(
            (p) => !p.processed && p.id !== photoData.id,
          );

          // Schedule the next cropping session
          if (nextUnprocessed) {
            setTimeout(() => {
              setCurrentCropImage(nextUnprocessed);
              setShowCropper(true);
            }, 500);
          }

          return updatedPhotos;
        });

        setShowCropper(false);
        setCurrentCropImage(null);
        setEditingImageId(null);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } catch (error) {
        MyError(error);
        setError("Failed to process image. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [cropWidth, cropHeight, projectData], // Removed 'photos' from dependencies
  );

  // Edit image handler
  const handleEditImage = useCallback((e, photoData) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingImageId(photoData.id);
    setCurrentCropImage(photoData);
    setShowCropper(true);
  }, []);

  // Remove photo handler
  const handleRemovePhoto = useCallback((e, photoId) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  // Close handlers
  const handleCloseCropper = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCropper(false);
    setEditingImageId(null);
  }, []);

  const handleCloseError = useCallback(() => {
    setError(null);
  }, []);

  // Components
  const MobileError = ({ message }) => (
    <div className="fixed top-4 left-4 right-4 z-50 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm">{message}</span>
        <button onClick={handleCloseError} className="text-red-500">
          <FaTimes />
        </button>
      </div>
    </div>
  );

  const MobileCropper = () => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [contrast, setContrast] = useState(100);
    const [brightness, setBrightness] = useState(100);
    const [saturate, setSaturate] = useState(100);
    const [showAdvancedControls, setShowAdvancedControls] = useState(false);

    const currentFilterStyle = {
      filter: `contrast(${contrast}%) brightness(${brightness}%) saturate(${saturate}%)`,
    };

    const handleZoom = (delta) => {
      setZoom((prev) => Math.max(0.5, Math.min(prev + delta * 0.1, 3)));
    };

    const rotateImage = (direction) => {
      setRotation((prev) => prev + 90 * direction);
    };

    const resetControls = () => {
      setZoom(1);
      setRotation(0);
      setContrast(100);
      setBrightness(100);
      setSaturate(100);
    };

    const handleProcessWithFilters = async () => {
      if (!cropperRef.current) return;

      setIsProcessing(true);

      try {
        // Get the cropped canvas
        let canvas = cropperRef.current.getCanvas({
          width: cropWidth,
          height: cropHeight,
        });

        // Apply filters if they've been modified
        if (
          contrast !== 100 ||
          brightness !== 100 ||
          saturate !== 100 ||
          rotation !== 0 ||
          zoom !== 1
        ) {
          const tempCanvas = document.createElement("canvas");
          const ctx = tempCanvas.getContext("2d");

          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;

          ctx.save();

          // Apply transformations
          if (rotation !== 0) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
          }

          // Apply filters
          ctx.filter = `contrast(${contrast}%) brightness(${brightness}%) saturate(${saturate}%)`;

          ctx.drawImage(canvas, 0, 0);
          ctx.restore();

          canvas = tempCanvas;
        }

        const dataUrl = canvas.toDataURL("image/png", 0.9);
        const croppedBlob = dataURLToBlob(dataUrl);

        const timestamp = Date.now();
        const croppedName = `calendar-crop-${timestamp}.png`;
        const originalName = `calendar-orig-${timestamp}.${currentCropImage.file.name.split(".").pop()}`;

        const [croppedUrl, originalUrl] = await Promise.all([
          UploadFile(projectData, croppedBlob, croppedName, "image"),
          UploadFile(projectData, currentCropImage.file, originalName, "image"),
        ]);

        const processedImage = {
          id: currentCropImage.id,
          croppedImage: croppedUrl,
          originalImage: originalUrl,
          uploadedAt: new Date().toISOString(),
        };

        // Update photos and get the next unprocessed photo
        setPhotos((prevPhotos) => {
          const updatedPhotos = prevPhotos.map((p) =>
            p.id === currentCropImage.id
              ? { ...p, processed: true, data: processedImage }
              : p,
          );

          // Find next unprocessed photo
          const nextUnprocessed = updatedPhotos.find(
            (p) => !p.processed && p.id !== currentCropImage.id,
          );

          // Schedule next cropping session
          if (nextUnprocessed) {
            setTimeout(() => {
              setCurrentCropImage(nextUnprocessed);
              // Reset controls for next image
              resetControls();
            }, 300);
          } else {
            setShowCropper(false);
            setCurrentCropImage(null);
          }

          return updatedPhotos;
        });

        setEditingImageId(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } catch (error) {
        MyError(error);
        setError("Failed to process image. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 pt-8 flex items-center justify-between">
            <button onClick={handleCloseCropper} disabled={isProcessing}>
              <FaTimes className="text-lg" />
            </button>
            <span className="font-semibold">
              Crop Photo {editingImageId ? "(Editing)" : ""}
            </span>
            <button
              onClick={handleProcessWithFilters}
              disabled={isProcessing}
              className="text-blue-400 font-semibold px-3 py-1 rounded"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <FaSyncAlt className="animate-spin" />
                  Processing...
                </div>
              ) : (
                "Done"
              )}
            </button>
          </div>

          {/* Cropper Area */}
          <div className="flex-1 p-4 relative">
            {currentCropImage && (
              <div style={currentFilterStyle}>
                <Cropper
                  ref={cropperRef}
                  src={currentCropImage.preview}
                  stencilComponent={RectangleStencil}
                  aspectRatio={cropWidth / cropHeight}
                  className="w-full h-full"
                  backgroundClassName="cropper-background"
                />
              </div>
            )}

            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                  <FaSyncAlt className="text-2xl text-blue-500 animate-spin mb-2" />
                  <span className="text-gray-700">Processing image...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <>
      {error && <MobileError message={error} />}

      <div>
        <div>
          {/* Upload Section */}
          <div className="mb-2">
            {/* Photo limit indicator */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-white text-gray-800">
                  Photos: {photos.filter((p) => p.processed).length} /{" "}
                  {maxPhotos}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {imagesPerPage} per month
                  {multiplePhotoSelection && " (multiple selection enabled)"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(photos.filter((p) => p.processed).length / maxPhotos) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Small Photo Preview Grid */}
            {photos.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={
                          photo.processed
                            ? photo.data.croppedImage
                            : photo.preview
                        }
                        alt="Uploaded"
                        className="w-13 h-13 object-cover rounded border-2 border-gray-200"
                      />

                      {/* Edit/Remove buttons for processed photos */}
                      {photo.processed && (
                        <div className="absolute -bottom-1 -right-1 flex gap-1">
                          <button
                            onClick={(e) => handleEditImage(e, photo)}
                            className="bg-blue-500 text-white rounded-full p-1"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={(e) => handleRemovePhoto(e, photo.id)}
                            className="bg-red-500 text-white rounded-full p-1"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-1">
              <button
                onClick={handleCameraCapture}
                disabled={photos.length >= maxPhotos}
                className="w-full text-nowrap bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded-sm flex items-center justify-center gap-1 font-semibold"
              >
                <FaCamera />
                Take Photo
              </button>
              <button
                onClick={handleGallerySelect}
                disabled={photos.length >= maxPhotos}
                className="w-full bg-yellow-500 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded-sm flex items-center justify-center gap-1 font-semibold"
              >
                <FaImage />
                Gallery
              </button>
            </div>
          </div>

          {/* Monthly Calendar Preview */}
          {calendarData.some((month) => month.images.length > 0) && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold dark:text-white text-gray-800 text-center">
                  📅 Calendar Preview
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  {totalPhotos} photos distributed linearly across 12 months
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {months.map((month, monthIndex) => (
                  <div
                    key={monthIndex}
                    className="bg-gray-800 rounded-lg shadow-md p-0.5"
                  >
                    {/* Month Header */}
                    <h4 className="font-semibold text-xs text-center dark:text-white text-gray-800 mb-1">
                      {month.short} (
                      {calendarData[monthIndex]?.images?.length || 0})
                    </h4>

                    {/* Month Images */}
                    {calendarData[monthIndex]?.images?.length > 0 ? (
                      <div className="space-y-1 items-center justify-center flex flex-col">
                        {calendarData[monthIndex].images
                          .slice(0, 2)
                          .map((image, imageIndex) => (
                            <div key={image.id} className="relative mx-auto">
                              <img
                                src={image.croppedImage}
                                alt={`${month.name} ${imageIndex + 1}`}
                                className="w-16 h-16 object-cover rounded border-white border"
                              />
                              {imageIndex === 0 && (
                                <div className="absolute top-1 left-1 bg-blue-500 text-white p-1 m-0 leading-none rounded text-xs">
                                  {monthIndex * imagesPerPage + imageIndex + 1}
                                </div>
                              )}
                            </div>
                          ))}
                        {calendarData[monthIndex].images.length > 2 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{calendarData[monthIndex].images.length - 2} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="h-16 w-16 mx-auto bg-gray-100 rounded flex items-center justify-center">
                        <FaImage className="text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress indicator for empty state */}
          {totalPhotos === 0 && (
            <div className="text-center py-12">
              <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Upload up to {maxPhotos} photos to build your calendar
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Photos will be distributed linearly across months
              </p>
            </div>
          )}
        </div>

        {/* Hidden inputs - CORRECTED VERSION */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={true}
          accept={SUPPORTED_FORMATS.join(",")}
          onChange={(e) => {
            e.preventDefault();
            handleFileSelect(e.target.files);
          }}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            e.preventDefault();
            handleFileSelect(e.target.files);
          }}
          className="hidden"
        />
      </div>

      {showCropper && currentCropImage && <MobileCropper />}
    </>
  );
}
