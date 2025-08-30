"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  FaCalendarAlt,
  FaUpload,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaImage,
  FaSyncAlt,
  FaExclamationTriangle,
  FaArrowRight,
  FaCamera,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { Cropper, RectangleStencil } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import Button from "@components/ui/Button";
import UploadFile from "@services/uploadFile";
import { getMimeType } from "advanced-cropper/extensions/mimes";

const months = [
  { name: "January", short: "Jan", number: 1 },
  { name: "February", short: "Feb", number: 2 },
  { name: "March", short: "Mar", number: 3 },
  { name: "April", short: "Apr", number: 4 },
  { name: "May", short: "May", number: 5 },
  { name: "June", short: "Jun", number: 6 },
  { name: "July", short: "Jul", number: 7 },
  { name: "August", short: "Aug", number: 8 },
  { name: "September", short: "Sep", number: 9 },
  { name: "October", short: "Oct", number: 10 },
  { name: "November", short: "Nov", number: 11 },
  { name: "December", short: "Dec", number: 12 },
];

const monthColors = [
  "bg-red-100 border-red-400 text-red-600",
  "bg-orange-100 border-orange-400 text-orange-600",
  "bg-yellow-100 border-yellow-400 text-yellow-600",
  "bg-green-100 border-green-400 text-green-600",
  "bg-teal-100 border-teal-400 text-teal-600",
  "bg-blue-100 border-blue-400 text-blue-600",
  "bg-indigo-100 border-indigo-400 text-indigo-600",
  "bg-purple-100 border-purple-400 text-purple-600",
  "bg-pink-100 border-pink-400 text-pink-600",
  "bg-rose-100 border-rose-400 text-rose-600",
  "bg-cyan-100 border-cyan-400 text-cyan-600",
  "bg-lime-100 border-lime-400 text-lime-600",
];

const LAYOUT_TYPES = {
  SINGLE: {
    id: "single",
    name: "Single Photo",
    photosPerMonth: 1,
    maxPhotos: 12,
  },
  DOUBLE: {
    id: "double",
    name: "Multiple Photos",
    photosPerMonth: 2,
    maxPhotos: 24,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const getPhotoDims = (projectData) => {
  try {
    const firstArtwork = projectData?.artworks?.[0];
    const settings = firstArtwork?.settings || {};
    const w = Number(settings.photo_width) || null;
    const h = Number(settings.photo_height) || null;
    if (w && h && w > 0 && h > 0) return { w, h };
  } catch (error) {
    console.warn("Error getting photo dimensions:", error);
  }
  return { w: 700, h: 700 };
};

const dataURLToBlob = (dataURL) => {
  try {
    const arr = dataURL.split(",");
    if (arr.length !== 2) throw new Error("Invalid data URL format");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid MIME type in data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error("Error converting data URL to blob:", error);
    throw new Error("Failed to process image data");
  }
};

const validateImageFile = (file) => {
  const errors = [];
  if (!file) {
    errors.push("No file selected");
    return { isValid: false, errors };
  }
  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    );
  }
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    errors.push(
      `Unsupported format. Please use: ${SUPPORTED_FORMATS.join(", ")}`,
    );
  }
  return { isValid: errors.length === 0, errors };
};

const generateUniqueFileName = (prefix = "calendar") => {
  const now = new Date();
  const timestamp = now
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/[/, ]/g, "_")
    .replace(/:/g, "-");
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.png`;
};

export default function CalendarPhotoUpload({
  projectData,
  formData,
  setFormData,
  projectId,
}) {
  // Layout and calendar state
  const [layoutType, setLayoutType] = useState(LAYOUT_TYPES.SINGLE);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [calendarData, setCalendarData] = useState(new Array(12).fill(null));

  // UI state
  const [currentView, setCurrentView] = useState("upload"); // 'upload' | 'calendar' | 'review'
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [currentEditPhoto, setCurrentEditPhoto] = useState(null);
  const [cropperReady, setCropperReady] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const cropperRef = useRef(null);

  const { w: cropWidth, h: cropHeight } = useMemo(
    () => getPhotoDims(projectData),
    [projectData],
  );

  // Calculate progress and distribution
  const totalSlots = useMemo(() => layoutType.maxPhotos, [layoutType]);
  const filledSlots = useMemo(() => {
    return calendarData.reduce((count, monthData) => {
      if (!monthData) return count;
      return (
        count +
        (Array.isArray(monthData) ? monthData.filter(Boolean).length : 1)
      );
    }, 0);
  }, [calendarData]);

  const progress = useMemo(
    () => (filledSlots / totalSlots) * 100,
    [filledSlots, totalSlots],
  );

  // Initialize calendar data
  useEffect(() => {
    try {
      const existingCalendarData = formData?.calendarData || [];
      if (
        Array.isArray(existingCalendarData) &&
        existingCalendarData.length === 12
      ) {
        setCalendarData(existingCalendarData);
        // Extract uploaded photos for editing
        const photos = [];
        existingCalendarData.forEach((monthData, monthIndex) => {
          if (monthData) {
            if (Array.isArray(monthData)) {
              monthData.forEach((photo, photoIndex) => {
                if (photo) {
                  photos.push({ ...photo, monthIndex, photoIndex });
                }
              });
            } else {
              photos.push({ ...monthData, monthIndex, photoIndex: 0 });
            }
          }
        });
        setUploadedPhotos(photos);
      }
    } catch (error) {
      console.error("Error initializing calendar data:", error);
      setError("Failed to load calendar data");
    }
  }, [formData]);

  // Update form data when calendar changes
  useEffect(() => {
    if (calendarData.some((item) => item !== null)) {
      try {
        setFormData((prev) => ({
          ...prev,
          calendarData,
          layoutType: layoutType.id,
        }));
      } catch (error) {
        console.error("Error updating form data:", error);
      }
    }
  }, [calendarData, layoutType, setFormData]);

  // Linear photo distribution function
  const distributePhotosLinearly = useCallback(
    (photos) => {
      const newCalendarData = new Array(12).fill(null);

      if (photos.length === 0) {
        setCalendarData(newCalendarData);
        return;
      }

      // Initialize calendar structure based on layout
      for (let month = 0; month < 12; month++) {
        if (layoutType.photosPerMonth === 1) {
          newCalendarData[month] = null;
        } else {
          newCalendarData[month] = new Array(layoutType.photosPerMonth).fill(
            null,
          );
        }
      }

      // Distribute photos linearly
      let photoIndex = 0;
      for (let month = 0; month < 12; month++) {
        if (layoutType.photosPerMonth === 1) {
          newCalendarData[month] = photos[photoIndex % photos.length];
          photoIndex++;
        } else {
          for (let slot = 0; slot < layoutType.photosPerMonth; slot++) {
            newCalendarData[month][slot] = photos[photoIndex % photos.length];
            photoIndex++;
          }
        }
      }

      setCalendarData(newCalendarData);
    },
    [layoutType],
  );

  // Handle file input change (multiple files)
  const handleFileSelect = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      setError(null);
      setIsLoading(true);

      try {
        const validFiles = [];
        const errors = [];

        // Validate all files
        for (const file of files) {
          const validation = validateImageFile(file);
          if (validation.isValid) {
            validFiles.push(file);
          } else {
            errors.push(`${file.name}: ${validation.errors.join(", ")}`);
          }
        }

        if (errors.length > 0) {
          setError(errors.join("\n"));
        }

        if (validFiles.length === 0) {
          setIsLoading(false);
          return;
        }

        // Check if adding these files would exceed the limit
        const totalPhotos = uploadedPhotos.length + validFiles.length;
        if (totalPhotos > layoutType.maxPhotos) {
          setError(
            `Cannot upload ${validFiles.length} photos. Maximum is ${layoutType.maxPhotos} for ${layoutType.name} layout. You currently have ${uploadedPhotos.length} photos.`,
          );
          setIsLoading(false);
          return;
        }

        // Process and upload files
        const processedPhotos = [];
        for (const file of validFiles) {
          try {
            // Create blob URL for preview
            const blob = URL.createObjectURL(file);

            // Generate unique filenames
            const blobName = generateUniqueFileName();
            const originalFileName = `original_${blobName}`;

            // Upload original file
            const uploadedOriginalFileUrl = await UploadFile(
              projectData,
              file,
              originalFileName,
              "image",
            );

            if (!uploadedOriginalFileUrl) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            const photoData = {
              id: Date.now() + Math.random(),
              originalImage: uploadedOriginalFileUrl,
              croppedImage: null, // Will be set after cropping
              filename: file.name,
              uploadedAt: new Date().toISOString(),
              needsCropping: true,
              previewUrl: blob,
            };

            processedPhotos.push(photoData);
          } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            errors.push(`Failed to process ${file.name}`);
          }
        }

        if (processedPhotos.length > 0) {
          const newUploadedPhotos = [...uploadedPhotos, ...processedPhotos];
          setUploadedPhotos(newUploadedPhotos);

          // Auto-distribute photos if we have enough
          if (newUploadedPhotos.filter((p) => p.croppedImage).length > 0) {
            distributePhotosLinearly(
              newUploadedPhotos.filter((p) => p.croppedImage),
            );
          }

          // If only one photo was uploaded, open cropper immediately
          if (processedPhotos.length === 1) {
            setCurrentEditPhoto(processedPhotos[0]);
            setShowCropper(true);
          }
        }

        if (errors.length > 0) {
          setError(errors.join("\n"));
        }
      } catch (error) {
        console.error("Error handling file selection:", error);
        setError("Failed to process selected files");
      } finally {
        setIsLoading(false);
        event.target.value = ""; // Reset input
      }
    },
    [uploadedPhotos, layoutType, projectData, distributePhotosLinearly],
  );

  // Handle camera capture
  const handleCameraCapture = useCallback(
    (event) => {
      handleFileSelect(event); // Same logic as file select
    },
    [handleFileSelect],
  );

  // Open cropper for specific photo
  const openCropper = useCallback((photo) => {
    setCurrentEditPhoto(photo);
    setShowCropper(true);
    setCropperReady(false);
  }, []);

  // Close cropper
  const closeCropper = useCallback(() => {
    setShowCropper(false);
    setCurrentEditPhoto(null);
    setCropperReady(false);
    setError(null);
  }, []);

  // Save cropped image
  const saveCroppedImage = useCallback(async () => {
    if (!cropperRef.current || !currentEditPhoto || !cropperReady) {
      setError("Cropper not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const canvas = cropperRef.current.getCanvas({
        width: cropWidth,
        height: cropHeight,
      });

      if (!canvas) {
        throw new Error("Failed to generate cropped image");
      }

      const dataUrl = canvas.toDataURL("image/png", 0.95);
      const imageBlob = dataURLToBlob(dataUrl);
      const blobName = generateUniqueFileName();
      const cropperFileName = `cropped_${blobName}`;

      // Upload cropped image
      const uploadedCroppedFileUrl = await UploadFile(
        projectData,
        imageBlob,
        cropperFileName,
        "image",
      );

      if (!uploadedCroppedFileUrl) {
        throw new Error("Failed to upload cropped image");
      }

      // Update the photo in uploadedPhotos
      const updatedPhotos = uploadedPhotos.map((photo) => {
        if (photo.id === currentEditPhoto.id) {
          return {
            ...photo,
            croppedImage: uploadedCroppedFileUrl,
            needsCropping: false,
          };
        }
        return photo;
      });

      setUploadedPhotos(updatedPhotos);

      // Redistribute photos with the newly cropped image
      const croppedPhotos = updatedPhotos.filter((p) => p.croppedImage);
      distributePhotosLinearly(croppedPhotos);

      closeCropper();
    } catch (error) {
      console.error("Error saving cropped image:", error);
      setError(error.message || "Failed to save cropped image");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentEditPhoto,
    cropperReady,
    cropWidth,
    cropHeight,
    projectData,
    uploadedPhotos,
    distributePhotosLinearly,
    closeCropper,
  ]);

  // Remove photo
  const removePhoto = useCallback(
    (photoToRemove) => {
      const updatedPhotos = uploadedPhotos.filter(
        (photo) => photo.id !== photoToRemove.id,
      );
      setUploadedPhotos(updatedPhotos);

      // Clean up blob URL if it exists
      if (photoToRemove.previewUrl) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }

      // Redistribute remaining photos
      const croppedPhotos = updatedPhotos.filter((p) => p.croppedImage);
      distributePhotosLinearly(croppedPhotos);
    },
    [uploadedPhotos, distributePhotosLinearly],
  );

  // Layout change handler
  const handleLayoutChange = useCallback(
    (newLayoutType) => {
      setLayoutType(newLayoutType);

      // Check if current photos exceed new limit
      if (uploadedPhotos.length > newLayoutType.maxPhotos) {
        setError(
          `Current layout supports maximum ${newLayoutType.maxPhotos} photos. You have ${uploadedPhotos.length} photos. Please remove ${uploadedPhotos.length - newLayoutType.maxPhotos} photos.`,
        );
        return;
      }

      // Redistribute photos with new layout
      const croppedPhotos = uploadedPhotos.filter((p) => p.croppedImage);
      distributePhotosLinearly(croppedPhotos);
      setError(null);
    },
    [uploadedPhotos, distributePhotosLinearly],
  );

  // Render upload section
  const renderUploadSection = () => (
    <div className="space-y-6">
      {/* Layout Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Calendar Layout</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(LAYOUT_TYPES).map((layout) => (
            <label
              key={layout.id}
              className={`
                cursor-pointer border-2 rounded-lg p-4 transition-all
                ${
                  layoutType.id === layout.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <input
                type="radio"
                name="layout"
                value={layout.id}
                checked={layoutType.id === layout.id}
                onChange={() => handleLayoutChange(layout)}
                className="sr-only"
              />
              <div className="text-center">
                <h4 className="font-semibold text-lg">{layout.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {layout.photosPerMonth} photo
                  {layout.photosPerMonth > 1 ? "s" : ""} per month
                </p>
                <p className="text-sm text-gray-500">
                  Maximum: {layout.maxPhotos} photos
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Upload Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Add Photos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<FaUpload />}
            disabled={
              isLoading || uploadedPhotos.length >= layoutType.maxPhotos
            }
            className="h-12"
          >
            Select Photos
          </Button>
          <Button
            onClick={() => cameraInputRef.current?.click()}
            leftIcon={<FaCamera />}
            variant="secondary"
            disabled={
              isLoading || uploadedPhotos.length >= layoutType.maxPhotos
            }
            className="h-12"
          >
            Take Photo
          </Button>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>
            {uploadedPhotos.length} of {layoutType.maxPhotos} photos uploaded
            {uploadedPhotos.length >= layoutType.maxPhotos && (
              <span className="text-green-600 ml-2">✓ Maximum reached</span>
            )}
          </p>
          <p className="mt-1">Supported: JPG, PNG, WebP • Max size: 10MB</p>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(uploadedPhotos.filter((p) => p.croppedImage).length / layoutType.maxPhotos) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Uploaded Photos Grid */}
      {uploadedPhotos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={
                      photo.croppedImage ||
                      photo.previewUrl ||
                      photo.originalImage
                    }
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                  {photo.needsCropping && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        Needs Cropping
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openCropper(photo)}
                    className="bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700"
                    title="Edit/Crop"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => removePhoto(photo)}
                    className="bg-red-600 text-white p-1 rounded text-xs hover:bg-red-700"
                    title="Remove"
                  >
                    <FaTrash />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {photo.filename}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          disabled={uploadedPhotos.filter((p) => p.croppedImage).length === 0}
          onClick={() => setCurrentView("calendar")}
        >
          Preview Calendar
        </Button>
        <Button
          disabled={uploadedPhotos.filter((p) => p.croppedImage).length === 0}
          onClick={() => setCurrentView("review")}
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );

  // Render calendar preview
  const renderCalendarPreview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendar Preview</h2>
        <Button
          variant="secondary"
          leftIcon={<FaArrowRight />}
          onClick={() => setCurrentView("upload")}
        >
          Back to Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month, index) => {
          const monthData = calendarData[index];
          const hasPhotos =
            monthData &&
            (Array.isArray(monthData)
              ? monthData.some(Boolean)
              : Boolean(monthData));

          return (
            <div
              key={month.name}
              className={`
                border-2 rounded-lg p-4 
                ${monthColors[index % monthColors.length]}
              `}
            >
              <h3 className="font-bold text-lg mb-2">{month.name}</h3>
              {hasPhotos ? (
                <div
                  className={`
                  grid gap-2 
                  ${layoutType.photosPerMonth === 1 ? "grid-cols-1" : "grid-cols-2"}
                `}
                >
                  {Array.isArray(monthData) ? (
                    monthData.map((photo, photoIndex) => (
                      <div
                        key={photoIndex}
                        className="aspect-square bg-gray-200 rounded overflow-hidden"
                      >
                        {photo ? (
                          <img
                            src={photo.croppedImage}
                            alt={`${month.name} ${photoIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaImage />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="aspect-square bg-gray-200 rounded overflow-hidden">
                      <img
                        src={monthData.croppedImage}
                        alt={month.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  <FaImage className="text-2xl" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button onClick={() => setCurrentView("review")}>
          Continue to Review
        </Button>
      </div>
    </div>
  );

  // Render review section
  const renderReviewSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Review Your Calendar</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <FaCheck />
            <span className="font-semibold">Calendar Ready!</span>
          </div>
          <p className="text-green-600 mt-1">
            {filledSlots} of {totalSlots} slots filled ({Math.round(progress)}%
            complete)
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {uploadedPhotos.length}
          </div>
          <div className="text-sm text-gray-600">Photos Uploaded</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {uploadedPhotos.filter((p) => p.croppedImage).length}
          </div>
          <div className="text-sm text-gray-600">Photos Processed</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {layoutType.name}
          </div>
          <div className="text-sm text-gray-600">Layout Type</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(progress)}%
          </div>
          <div className="text-sm text-gray-600">Complete</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="secondary" onClick={() => setCurrentView("upload")}>
          Edit Photos
        </Button>
        <Button variant="secondary" onClick={() => setCurrentView("calendar")}>
          Preview Calendar
        </Button>
        <Button
          disabled={uploadedPhotos.filter((p) => p.croppedImage).length === 0}
          onClick={() => {
            // Handle final submission
            console.log("Submitting calendar with data:", calendarData);
            // You can add navigation to render page here
          }}
        >
          Generate Calendar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_FORMATS.join(",")}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
            <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Error</p>
              <div className="text-sm whitespace-pre-line">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <FaSyncAlt className="animate-spin text-blue-600" />
              <span>Processing...</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        {currentView === "upload" && renderUploadSection()}
        {currentView === "calendar" && renderCalendarPreview()}
        {currentView === "review" && renderReviewSection()}

        {/* Cropper Modal */}
        {showCropper && currentEditPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  Crop Photo: {currentEditPhoto.filename}
                </h3>
                <button
                  onClick={closeCropper}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-4" style={{ height: "400px" }}>
                  <Cropper
                    ref={cropperRef}
                    src={
                      currentEditPhoto.previewUrl ||
                      currentEditPhoto.originalImage
                    }
                    stencilComponent={RectangleStencil}
                    aspectRatio={cropWidth / cropHeight}
                    className="w-full h-full"
                    onReady={() => setCropperReady(true)}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={closeCropper}
                    variant="secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveCroppedImage}
                    disabled={isLoading || !cropperReady}
                    leftIcon={
                      isLoading ? (
                        <FaSyncAlt className="animate-spin" />
                      ) : (
                        <FaCheck />
                      )
                    }
                  >
                    {isLoading ? "Saving..." : "Save & Continue"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
