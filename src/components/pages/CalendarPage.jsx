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
} from "react-icons/fa";
import { Cropper, RectangleStencil } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import Header from "@components/ui/Header";
import Footer from "@components/ui/Footer";
import Button from "@components/ui/Button";
import LoadingPage from "@components/ui/LoadingPage";
import { DecryptData, EncryptData } from "@utils/cryptoUtils";
import { useRouter } from "next/navigation";
import config from "@utils/Config";
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

// Constants for better maintainability
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MIN_IMAGE_DIMENSION = 300;
const RECOMMENDED_DIMENSION = 1080;

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

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    );
  }

  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    errors.push(
      `Unsupported format. Please use: ${SUPPORTED_FORMATS.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const generateUniqueFileName = (prefix = "image") => {
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

export default function CalendarPage({
  projectData,
  formData,
  setFormData,
  projectId,
}) {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [calendarData, setCalendarData] = useState({});
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: 1,
    designation: "Medical Representative",
    avatar: "/images/avatar.jpg",
  });

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [image, setImage] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cropperReady, setCropperReady] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);
  const cropperRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);

  const ui = config(projectData);
  const router = useRouter();
  const isDarkMode = localStorage.getItem("ThemeMode");
  const { w: cropWidth, h: cropHeight } = useMemo(
    () => getPhotoDims(projectData),
    [projectData],
  );

  // Memoized calculations
  const completedMonths = useMemo(
    () =>
      months.filter(
        (_, index) => calendarData[months[index].name]?.croppedImage,
      ).length,
    [calendarData],
  );

  const progress = useMemo(
    () => (completedMonths / 12) * 100,
    [completedMonths],
  );

  // Initialize data
  useEffect(() => {
    try {
      const getUserInfo = DecryptData("empData");
      const getCalendarData = formData?.calendarData || {};

      if (getUserInfo) {
        setUserInfo({
          name: getUserInfo?.name || "",
          role: getUserInfo?.role || 1,
          designation: getUserInfo?.role_name || "Medical Representative",
        });
      }

      if (getCalendarData && typeof getCalendarData === "object") {
        setCalendarData(getCalendarData);
        const incompleteMonth = months.findIndex(
          (_, index) => !getCalendarData[months[index].name]?.croppedImage,
        );
        setCurrentMonth(incompleteMonth === -1 ? 0 : incompleteMonth);
      }
    } catch (error) {
      console.error("Error initializing calendar data:", error);
      setError("Failed to load calendar data");
    }
  }, [formData]);

  // Update form data when calendar data changes
  useEffect(() => {
    if (Object.keys(calendarData).length > 0) {
      try {
        setFormData((prev) => ({
          ...prev,
          calendarData,
        }));
      } catch (error) {
        console.error("Error updating form data:", error);
      }
    }
  }, [calendarData, setFormData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      // Revoke any existing blob URLs
      if (image?.src) {
        URL.revokeObjectURL(image.src);
      }
    };
  }, [image]);

  const handleMonthClick = useCallback(
    (monthIndex) => {
      if (isSaving || isLoading) return;

      setError(null);
      setSelectedMonth(monthIndex);
      setCurrentMonth(monthIndex);
      setShowCropper(true);
      setCropperReady(false);

      // Trigger file input with delay
      cleanupTimeoutRef.current = setTimeout(() => {
        inputRef.current?.click();
      }, 100);
    },
    [isSaving, isLoading],
  );

  const onLoadImage = useCallback((event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const file = event.target.files?.[0];

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.errors.join(", "));
      setIsLoading(false);
      return;
    }

    setOriginalFile(file);

    try {
      const blob = URL.createObjectURL(file);
      const typeFallback = file.type;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          // Create image to check dimensions
          const img = new Image();
          img.onload = () => {
            if (
              img.width < MIN_IMAGE_DIMENSION ||
              img.height < MIN_IMAGE_DIMENSION
            ) {
              setError(
                `Image too small. Minimum size: ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}px`,
              );
              URL.revokeObjectURL(blob);
              setIsLoading(false);
              return;
            }

            setImage({
              src: blob,
              type: getMimeType(e.target?.result, typeFallback),
            });
            setIsLoading(false);
          };

          img.onerror = () => {
            setError("Invalid image file");
            URL.revokeObjectURL(blob);
            setIsLoading(false);
          };

          img.src = blob;
        } catch (error) {
          console.error("Error processing image:", error);
          setError("Failed to process image");
          URL.revokeObjectURL(blob);
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read image file");
        URL.revokeObjectURL(blob);
        setIsLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error loading image:", error);
      setError("Failed to load image");
      setIsLoading(false);
    }

    event.target.value = "";
  }, []);

  const onCropperReady = useCallback(() => {
    console.log("Cropper is ready!");
    setCropperReady(true);
  }, []);

  const saveCroppedImage = useCallback(async () => {
    if (
      !cropperRef.current ||
      !originalFile ||
      selectedMonth === null ||
      !cropperReady
    ) {
      setError("Cropper not ready. Please try again.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Add delay to ensure cropper is fully ready
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = cropperRef.current.getCanvas({
        width: cropWidth,
        height: cropHeight,
      });

      if (!canvas) {
        throw new Error("Failed to generate cropped image");
      }

      const dataUrl = canvas.toDataURL("image/png", 0.95); // Add quality parameter
      const imageBlob = dataURLToBlob(dataUrl);

      const blobName = generateUniqueFileName("calendar");
      const cropperFileName = `cropped_${blobName}`;
      const originalFileName = `original_${blobName}`;

      // Upload files with error handling
      const [uploadedCroppedFileUrl, uploadedOriginalFileUrl] =
        await Promise.all([
          UploadFile(projectData, imageBlob, cropperFileName, "image"),
          UploadFile(projectData, originalFile, originalFileName, "image"),
        ]);

      if (!uploadedCroppedFileUrl || !uploadedOriginalFileUrl) {
        throw new Error("Failed to upload images");
      }

      const monthName = months[selectedMonth].name;
      setCalendarData((prev) => ({
        ...prev,
        [monthName]: {
          croppedImage: uploadedCroppedFileUrl,
          originalImage: uploadedOriginalFileUrl,
          uploadedAt: new Date().toISOString(),
        },
      }));

      // Close cropper and reset states
      closeCropper();
    } catch (error) {
      console.error("Error saving image:", error);
      setError(error.message || "Failed to save image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    cropperRef,
    originalFile,
    selectedMonth,
    cropperReady,
    cropWidth,
    cropHeight,
    projectData,
  ]);

  const closeCropper = useCallback(() => {
    setShowCropper(false);
    setImage(null);
    setOriginalFile(null);
    setCropperReady(false);
    setSelectedMonth(null);
    setError(null);
    setIsLoading(false);

    if (image?.src) {
      URL.revokeObjectURL(image.src);
    }
  }, [image]);

  const isMonthCompleted = useCallback(
    (monthIndex) => {
      return Boolean(calendarData[months[monthIndex].name]?.croppedImage);
    },
    [calendarData],
  );

  const shuffleCalendarImages = () => {
    const uploadedEntries = Object.values(calendarData).filter(
      (item) => item?.croppedImage,
    );

    if (uploadedEntries.length === 0) {
      toast.error("Upload at least 1 image to shuffle.");
      return;
    }

    const shuffled = [...uploadedEntries, ...uploadedEntries];
    const assigned = {};

    for (let i = 0; i < 12; i++) {
      const monthName = months[i].name;
      assigned[monthName] = shuffled[i % shuffled.length];
    }

    setCalendarData(assigned);
    toast.success("Calendar shuffled!");
  };

  const handleSubmit = useCallback(() => {
    if (completedMonths === 12 && projectId) {
      router.push(`/${projectId}/render-calendar`);
    }
  }, [completedMonths, projectId, router]);

  // Error display component
  const ErrorDisplay = ({ message, onClose }) => (
    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FaExclamationTriangle />
        <span className="text-sm">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-red-500 hover:text-red-700">
          <FaTimes className="text-sm" />
        </button>
      )}
    </div>
  );

  console.log(formData);

  return (
    <main className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_FORMATS.join(",")}
        onChange={onLoadImage}
        className="hidden"
        disabled={isSaving || isLoading}
      />

      {/* Error Display */}
      {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}

      {/* Calendar Grid View */}
      <div
        className={`${isDarkMode ? "bg-gray-900" : "bg-white"} rounded-lg shadow-lg mb-8`}
      >
        <div className="p-1">
          <h2 className="text-xl font-semibold">Calendar Photo Upload</h2>
          <p className="text-sm text-gray-400 mb-4">
            Click on months to upload photo ({completedMonths}/12 completed)
          </p>

          {/* Progress Bar */}
          <div
            className={`w-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2 mb-4`}
          >
            <div
              className={`h-2 rounded-full transition-all duration-300 ${ui?.theme?.selectedBg || "bg-blue-600"}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {months.map((month, index) => (
              <div
                key={month.name}
                onClick={() => handleMonthClick(index)}
                className={`relative p-1 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${isMonthCompleted(index) ? monthColors[index % monthColors.length] : "bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"} ${isSaving || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">{month.short}</div>
                  <FaImage
                    className={`mx-auto mt-2 text-gray-400 ${ui?.theme?.selectedText || "text-blue-500"}`}
                  />
                </div>

                {isMonthCompleted(index) && (
                  <div
                    className={`absolute -top-2 -right-2 ${ui?.theme?.selectedBg || "bg-green-500"} text-white rounded-full p-1`}
                  >
                    <FaCheck className="text-xs" />
                  </div>
                )}

                {currentMonth === index && (
                  <div
                    className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 ${ui?.theme?.selectedBg || "bg-blue-500"} rounded-full`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-6`}
      >
        <div className="flex gap-3">
          <Button
            onClick={shuffleCalendarImages}
            leftIcon={<FaSyncAlt />}
            fullWidth={false}
            className="mt-4"
          >
            Shuffle & Fill Calendar
          </Button>

          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={completedMonths !== 12 || !projectId}
              leftIcon={<FaCalendarAlt />}
              fullWidth={false}
            >
              Create Calendar ({completedMonths}/12)
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        <div
          className={`mt-6 p-4 ${isDarkMode ? "bg-gray-700" : "bg-blue-50"} rounded-lg`}
        >
          <div className="flex items-start gap-3">
            <FaUpload
              className={`mt-1 ${ui?.theme?.selectedText || "text-blue-600"}`}
            />
            <div className="text-sm">
              <p className="font-medium mb-1">Requirements & Tips:</p>
              <ul
                className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} space-y-1`}
              >
                <li>• File size: Max {MAX_FILE_SIZE / (1024 * 1024)}MB</li>
                <li>• Formats: JPG, PNG, WebP</li>
                <li>
                  • Minimum size: {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}px
                </li>
                <li>
                  • Recommended: {RECOMMENDED_DIMENSION}x{RECOMMENDED_DIMENSION}
                  px or higher
                </li>
                <li>• Choose images that represent each month or season</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                Crop Image for{" "}
                {selectedMonth !== null ? months[selectedMonth].name : ""}
              </h3>
              <button
                onClick={closeCropper}
                disabled={isSaving}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <FaTimes />
              </button>
            </div>

            {/* Cropper Content */}
            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <FaSyncAlt className="text-4xl text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Processing image...</p>
                </div>
              ) : image ? (
                <>
                  <div className="mb-4" style={{ height: "400px" }}>
                    <Cropper
                      ref={cropperRef}
                      src={image.src}
                      stencilComponent={RectangleStencil}
                      aspectRatio={cropWidth / cropHeight}
                      className="w-full h-full"
                      onReady={onCropperReady}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    <Button
                      onClick={closeCropper}
                      variant="secondary"
                      fullWidth={false}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveCroppedImage}
                      disabled={isSaving || !cropperReady}
                      leftIcon={
                        isSaving ? (
                          <FaSyncAlt className="animate-spin" />
                        ) : (
                          <FaCheck />
                        )
                      }
                      fullWidth={false}
                    >
                      {isSaving
                        ? "Saving..."
                        : cropperReady
                          ? "Save & Continue"
                          : "Loading..."}
                    </Button>
                  </div>

                  {/* Status info */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="mt-2 text-xs text-gray-500">
                      Cropper Ready: {cropperReady ? "Yes" : "No"} | Ref
                      Available: {!!cropperRef.current ? "Yes" : "No"}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <FaImage className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Please select an image to continue...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
