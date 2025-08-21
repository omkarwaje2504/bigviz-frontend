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
  FaRandom,
  FaPlay,
  FaEye,
  FaPlus,
  FaEdit,
  FaGripVertical,
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
const MIN_PHOTOS_FOR_CALENDAR = 1;

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

    const mime = mimeMatch;
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

// Fixed distribution function
const mobileSmartDistribute = (photos) => {
  const result = new Array(12).fill(null).map(() => ({ images: [] }));

  if (photos.length === 0) return result;

  // Ensure every month gets at least one photo
  for (let i = 0; i < 12; i++) {
    const photoIndex = i % photos.length;
    result[i].images.push(photos[photoIndex]);
  }

  // Distribute remaining photos if we have more than 12
  if (photos.length > 12) {
    let currentMonth = 0;
    for (let i = 12; i < photos.length; i++) {
      result[currentMonth].images.push(photos[i]);
      currentMonth = (currentMonth + 1) % 12;
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
  // Mobile-optimized states
  const [photos, setPhotos] = useState([]);
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
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const cropperRef = useRef(null);

  const router = useRouter();
  const isDarkMode = "dark";
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

  // Sync with form data
  useEffect(() => {
    if (calendarData.some((month) => month.images.length > 0)) {
      setFormData((prev) => ({ ...prev, calendarData }));
    }
  }, [calendarData, setFormData]);

  // Auto-generate calendar when photos are processed
  useEffect(() => {
    const processedImages = photos
      .filter((p) => p.processed)
      .map((p) => p.data);
    if (processedImages.length > 0) {
      const distributedData = mobileSmartDistribute(processedImages);
      setCalendarData(distributedData);
    }
  }, [photos]);

  // File selection handler
  const handleFileSelect = useCallback((files) => {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach((file) => {
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

    if (validFiles.length > 0) {
      setPhotos((prev) => [...prev, ...validFiles]);
      setShowUploadOptions(false);

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
  }, []);

  // Camera and gallery handlers
  const handleCameraCapture = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    cameraInputRef.current?.click();
  }, []);

  const handleGallerySelect = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);
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

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoData.id
              ? { ...p, processed: true, data: processedImage }
              : p,
          ),
        );

        setShowCropper(false);
        setCurrentCropImage(null);
        setEditingImageId(null);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);

        // Auto-process next unprocessed photo
        const nextUnprocessed = photos.find(
          (p) => !p.processed && p.id !== photoData.id,
        );
        if (nextUnprocessed) {
          setTimeout(() => {
            setCurrentCropImage(nextUnprocessed);
            setShowCropper(true);
          }, 500);
        }
      } catch (error) {
        MyError(error);
        setError("Failed to process image. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [cropWidth, cropHeight, projectData, photos],
  );

  // Shuffle photos
  const shufflePhotos = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const allImages = calendarData.flatMap((month) => month?.images || []);
      if (allImages.length === 0) {
        setError("No images to shuffle");
        return;
      }

      const shuffled = [...allImages].sort(() => Math.random() - 0.5);
      const redistributed = mobileSmartDistribute(shuffled);
      setCalendarData(redistributed);
    },
    [calendarData],
  );

  // Edit image handler
  const handleEditImage = useCallback((e, photoData) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingImageId(photoData.id);
    setCurrentCropImage(photoData);
    setShowCropper(true);
  }, []);

  // Reupload handler
  const handleReupload = useCallback((e, photoId) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingImageId(photoId);
    fileInputRef.current?.click();
  }, []);

  // Drag and drop handlers (simplified for mobile)
  const moveImage = useCallback((fromIndex, toIndex) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [moved] = newPhotos.splice(fromIndex, 1);
      newPhotos.splice(toIndex, 0, moved);
      return newPhotos;
    });
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

  const SuccessAnimation = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-full p-4 shadow-xl animate-bounce">
        <FaCheck className="text-2xl text-green-500" />
      </div>
    </div>
  );

  const MobileCropper = () => (
    <div className="fixed inset-0 bg-black z-50">
      <div className="h-full flex flex-col">
        <div className="bg-gray-900 text-white p-4 pt-8 flex items-center justify-between">
          <button onClick={handleCloseCropper}>
            <FaTimes />
          </button>
          <span className="font-semibold">Crop Photo</span>
          <button
            onClick={(e) => processSinglePhoto(e, currentCropImage)}
            disabled={isProcessing}
            className="text-blue-400 font-semibold"
          >
            {isProcessing ? "..." : "Done"}
          </button>
        </div>

        <div className="flex-1 p-4">
          {currentCropImage && (
            <Cropper
              ref={cropperRef}
              src={currentCropImage.preview}
              stencilComponent={RectangleStencil}
              aspectRatio={cropWidth / cropHeight}
              className="w-full h-full"
            />
          )}
        </div>

        <div className="bg-gray-900 text-white p-4 text-center">
          <p className="text-sm">Pinch to zoom • Drag to reposition</p>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <>
      {error && <MobileError message={error} />}
      {showSuccess && <SuccessAnimation />}

      <div>
        <div>
          {/* Upload Section */}
          <div className="mb-6">
            {/* Small Photo Preview Grid */}
            {photos.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold dark:text-white text-gray-800 mb-2">
                  Uploaded Photos
                </h3>
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
                        className="w-16 h-16 object-cover rounded border-2 border-gray-200"
                      />
                      {photo.processed ? (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                          <FaCheck className="text-xs" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded">
                          <FaSyncAlt className="text-white text-sm animate-spin" />
                        </div>
                      )}

                      {/* Edit button for processed photos */}
                      {photo.processed && (
                        <button
                          onClick={(e) => handleEditImage(e, photo)}
                          className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-1">
              <button
                onClick={handleCameraCapture}
                className="w-full text-nowrap bg-green-500 hover:bg-green-600 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-1 font-semibold"
              >
                <FaCamera />
                Take Photo
              </button>
              <button
                onClick={handleGallerySelect}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-1 font-semibold"
              >
                <FaImage />
                Gallery
              </button>
            </div>
            <button
              onClick={shufflePhotos}
              disabled={totalPhotos === 0}
              className="bg-blue-600 flex items-center justify-center px-3 py-3 gap-2 mx-auto mt-2 hover:bg-blue-700 disabled:opacity-50 p-2 rounded-lg"
            >
              <FaRandom /> Shuffle Images
            </button>
          </div>

          {/* Monthly Calendar Preview */}
          {calendarData.some((month) => month.images.length > 0) && (
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <h3 className="text-base font-semibold dark:text-white text-gray-800 text-center">
                  📅 Calendar Preview
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
                  {totalPhotos} photos distributed across 12 months
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {months.map((month, monthIndex) => (
                  <div
                    key={monthIndex}
                    className="bg-gray-800 rounded-lg shadow-md p-1"
                  >
                    {/* Month Header */}
                    <h4 className="font-semibold text-sm text-center dark:text-white text-gray-800 mb-1">
                      {month.name} (
                      {calendarData[monthIndex]?.images?.length || 0})
                    </h4>

                    {/* Month Images */}
                    {calendarData[monthIndex]?.images?.length > 0 ? (
                      <div className="space-y-1 items-center justify-center flex">
                        {calendarData[monthIndex].images
                          .slice(0, 2)
                          .map((image, imageIndex) => (
                            <div key={image.id} className="relative mx-auto">
                              <img
                                src={image.croppedImage}
                                alt={`${month.name} ${imageIndex + 1}`}
                                className="w-24 h-24 object-cover rounded"
                              />
                              {imageIndex === 0 && (
                                <div className="absolute top-1 left-1 bg-blue-500 text-white p-1 m-0 leading-none rounded text-xs">
                                  *
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
                      <div className="h-24 bg-gray-100 rounded flex items-center justify-center">
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
                Upload photos to start building your calendar
              </p>
            </div>
          )}
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
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
