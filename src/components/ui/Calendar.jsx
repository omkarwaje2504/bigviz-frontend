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
import { ImageCropper } from "./ImageCropper";
import PreviewModal from "./PreviewModal";
import { CALENDAR_PREVIEW_CONFIG } from "./CalendarConsent";
import { getPhotoDims } from "@utils/imageHelpers";
import { FaBahai } from "react-icons/fa6";
import { useSearchParams } from "next/navigation";
import { generateCalendarPreviewBlob } from "@services/GenerateImage";

// Import the new enhanced components
import NameArtSelector from './NameArtSelector';
import InitialSelector from './InitialSelector';
import SuperheroSelector from './SuperheroSelector';

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

// Predefined templates for AI-generated themes
const THEME_TEMPLATES = {
  nature: {
    name: "Nature",
    images: [
      { month: "january", prompt: "Serene winter forest landscape" },
      { month: "february", prompt: "Cherry blossoms in spring bloom" },
      { month: "march", prompt: "Mountain meadow with wildflowers" },
      { month: "april", prompt: "Tropical rainforest waterfall" },
      { month: "may", prompt: "Sunset over ocean waves" },
      { month: "june", prompt: "Lavender fields in summer" },
      { month: "july", prompt: "Desert sand dunes at golden hour" },
      { month: "august", prompt: "Northern lights over pine forest" },
      { month: "september", prompt: "Autumn leaves in woodland" },
      { month: "october", prompt: "Misty mountain peaks" },
      { month: "november", prompt: "Coastal cliffs and seascape" },
      { month: "december", prompt: "Snow-covered alpine landscape" },
    ],
  },
  abstract: {
    name: "Abstract",
    images: [
      { month: "january", prompt: "Blue geometric patterns" },
      { month: "february", prompt: "Pink and purple gradient waves" },
      { month: "march", prompt: "Green organic flowing shapes" },
      { month: "april", prompt: "Yellow and orange abstract art" },
      { month: "may", prompt: "Teal and cyan digital art" },
      { month: "june", prompt: "Red and gold abstract composition" },
      { month: "july", prompt: "Multicolor kaleidoscope pattern" },
      { month: "august", prompt: "Black and white minimalist design" },
      { month: "september", prompt: "Earth tones abstract landscape" },
      { month: "october", prompt: "Neon colors digital artwork" },
      { month: "november", prompt: "Pastel abstract watercolor" },
      { month: "december", prompt: "Silver and blue metallic pattern" },
    ],
  },
  medical: {
    name: "Medical",
    images: [
      { month: "january", prompt: "Modern hospital facility" },
      { month: "february", prompt: "Medical research laboratory" },
      { month: "march", prompt: "Healthcare technology equipment" },
      { month: "april", prompt: "Pharmacy and medication" },
      { month: "may", prompt: "Surgical operating room" },
      { month: "june", prompt: "Medical diagnostic imaging" },
      { month: "july", prompt: "Healthcare professionals teamwork" },
      { month: "august", prompt: "Wellness and preventive care" },
      { month: "september", prompt: "Emergency medical services" },
      { month: "october", prompt: "Medical education classroom" },
      { month: "november", prompt: "Healthcare innovation" },
      { month: "december", prompt: "Patient care excellence" },
    ],
  },
  motivational: {
    name: "Motivational",
    images: [
      { month: "january", prompt: "New beginnings sunrise" },
      { month: "february", prompt: "Heart-shaped motivation" },
      { month: "march", prompt: "Growth and progress concept" },
      { month: "april", prompt: "Success and achievement" },
      { month: "may", prompt: "Teamwork and collaboration" },
      { month: "june", prompt: "Excellence and quality" },
      { month: "july", prompt: "Innovation and creativity" },
      { month: "august", prompt: "Strength and perseverance" },
      { month: "september", prompt: "Focus and determination" },
      { month: "october", prompt: "Leadership and guidance" },
      { month: "november", prompt: "Gratitude and appreciation" },
      { month: "december", prompt: "Reflection and wisdom" },
    ],
  },
};

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
  const [photoCollectionType, setPhotoCollectionType] = useState(null);
  const [themeType, setThemeType] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const AI_ENABLED = projectData?.config?.calendar?.enable_ai;
  const searchParams = useSearchParams();

  const getParams = () => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    return { params, url };
  };

  useEffect(() => {
    const getPhotoCollectionType = searchParams.get("photo-collection-type");
    const getThemeType = searchParams.get("theme-type");
    const getSelectedPrompt = searchParams.get("selected-prompt");

    setPhotoCollectionType(getPhotoCollectionType);
    setThemeType(getThemeType);
    setSelectedPrompt(getSelectedPrompt);
  }, [searchParams]);

  useEffect(() => {
    const { params, url } = getParams();
    const getPhotoCollectionType = params.get("photo-collection-type");
    const getThemeType = params.get("theme-type");
    const getSelectedPrompt = params.get("selected-prompt");

    if (getPhotoCollectionType) {
      setPhotoCollectionType(getPhotoCollectionType);
    }
    if (getThemeType) {
      setThemeType(getThemeType);
    }
    if (getSelectedPrompt) {
      setSelectedPrompt(getSelectedPrompt);
    }
  }, []);

  useEffect(() => {
    const { params, url } = getParams();
    if (photoCollectionType) {
      params.set("photo-collection-type", photoCollectionType);
      window.history.replaceState({}, "", url.toString());
    }
    if (themeType) {
      params.set("theme-type", themeType);
      window.history.replaceState({}, "", url.toString());
    }
    if (selectedPrompt) {
      params.set("selected-prompt", selectedPrompt);
      window.history.replaceState({}, "", url.toString());
    }
  }, [photoCollectionType, themeType, selectedPrompt]);

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
            [`${key}`]: traillingPath + "/" + original || "",
            [`${key}_cropped`]: traillingPath + "/" + cropped || "",
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

  // Function to handle prefilled images from AI selections
  const handlePrefilledImages = useCallback((selectedImgs) => {
    setSelectedImages(selectedImgs);
    setFormData((prev) => ({ ...prev, calendar_images: selectedImgs }));
    // After setting prefilled images, continue to photo upload interface
    setSelectedPrompt("completed"); // Mark as completed to show upload interface
  }, [setFormData]);

  // Function to handle AI theme generation
  const handleAIThemeGeneration = useCallback(
    async (theme) => {
      setIsGeneratingAI(true);
      setError("");

      try {
        const template = THEME_TEMPLATES[theme];
        if (!template) {
          throw new Error("Invalid theme selected");
        }

        // Pre-populate formData with template data
        const themeData = {};
        template.images.forEach((img) => {
          themeData[`${img.month}_prompt`] = img.prompt;
          themeData[`${img.month}_theme`] = theme;
        });

        setFormData((prev) => ({
          ...prev,
          calendar_theme: theme,
          calendar_theme_data: themeData,
          calendar_ai_generated: true,
        }));

        // Optionally: Auto-generate preview or mark as ready
        setError(
          `${template.name} theme selected! Images will be generated automatically.`,
        );
      } catch (err) {
        setError(`Failed to apply theme: ${err.message}`);
      } finally {
        setIsGeneratingAI(false);
      }
    },
    [setFormData],
  );

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

        const newImages = await Promise.all(imagePromises);

        if (replaceId) {
          setPendingImages([newImages[0]]);
          setCurrentCropIndex(0);
          setIsProcessing(true);
        } else {
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

      const currentMonthIndex = selectedImages.length;
      const monthName = MONTH_NAMES[currentMonthIndex]
        ? MONTH_NAMES[currentMonthIndex].toLowerCase()
        : `month_${currentMonthIndex + 1}`;

      const formattedData = {
        id: currentPendingImage.replaceId || currentPendingImage.id,
        name: currentPendingImage.name,
        needsCropping: false,
        month: monthName,
        [`${monthName}`]: croppedData.originalImage,
        [`${monthName}_cropped`]: croppedData.croppedImage,
      };

      if (currentPendingImage.replaceId) {
        setSelectedImages((prev) =>
          prev.map((img) =>
            img.id === currentPendingImage.replaceId ? formattedData : img,
          ),
        );
      } else {
        setSelectedImages((prev) => [...prev, formattedData]);
      }

      const nextIndex = currentCropIndex + 1;
      if (nextIndex < pendingImages.length) {
        setCurrentCropIndex(nextIndex);
      } else {
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

  const handleDragStart = useCallback((e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";

    const dragElement = e.currentTarget;
    const rect = dragElement.getBoundingClientRect();

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
      image,
      CALENDAR_PREVIEW_CONFIG,
    );
    setPreviewData(previewUrl);
  };

  const remainingSlots = CONFIG.maxImages - selectedImages.length;

  // ENHANCED FLOW RENDERING

  // Step 1: Photo Collection Type Selection
  if (AI_ENABLED && !photoCollectionType) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Start Calendar Journey
        </h2>
        <p className="text-gray-600 text-sm dark:text-gray-400 mb-6">
          Select how you'd like to create your calendar images
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setPhotoCollectionType("with-doctor")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-md font-bold py-4 px-6 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            📸 Upload Doctor Photos
          </button>
          <button
            type="button"
            onClick={() => setPhotoCollectionType("ai-generate-for-you")}
            className="bg-green-600 hover:bg-green-700 text-white text-md font-bold py-4 px-6 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            🤖 AI Generate Theme for You
          </button>
          <button
            type="button"
            onClick={() => setPhotoCollectionType("mix")}
            className="bg-purple-600 hover:bg-purple-700 text-white text-md font-bold py-4 px-6 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            🎨 Doctor Photos + AI Generated
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Theme Selection (for AI-only mode)
  if (
    AI_ENABLED &&
    photoCollectionType === "ai-generate-for-you" &&
    !themeType
  ) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Choose Your Theme
        </h2>
        <p className="text-gray-600 text-sm dark:text-gray-400 mb-6">
          Select a theme for AI-generated calendar images
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(THEME_TEMPLATES).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => {
                setThemeType(theme);
                handleAIThemeGeneration(theme);
              }}
              disabled={isGeneratingAI}
              className="bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-md font-bold py-6 px-4 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed capitalize"
            >
              {THEME_TEMPLATES[theme].name}
            </button>
          ))}
        </div>
        {isGeneratingAI && (
          <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
            Setting up your theme...
          </div>
        )}
      </div>
    );
  }

  // Step 2: Enhanced Mix Mode Selection
  if (AI_ENABLED && photoCollectionType === "mix" && !selectedPrompt) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Select AI Enhancement Style
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Choose how to enhance your calendar with AI
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => setSelectedPrompt("name-art")}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-6 px-6 rounded-lg text-left hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
          >
            <div className="font-bold text-lg mb-2">🎨 Name Art</div>
            <div className="text-sm opacity-90">Generate artistic images based on doctor's name</div>
          </button>
          
          <button
            onClick={() => setSelectedPrompt("name-initial")}
            className="bg-gradient-to-r from-green-500 to-green-700 text-white font-bold py-6 px-6 rounded-lg text-left hover:from-green-600 hover:to-green-800 transition-all duration-200"
          >
            <div className="font-bold text-lg mb-2">🔤 Name Initial Patterns</div>
            <div className="text-sm opacity-90">Choose from 24 initial design patterns</div>
          </button>
          
          <button
            onClick={() => setSelectedPrompt("superhero")}
            className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold py-6 px-6 rounded-lg text-left hover:from-purple-600 hover:to-purple-800 transition-all duration-200"
          >
            <div className="font-bold text-lg mb-2">🦸‍♀️ Superhero Transformation</div>
            <div className="text-sm opacity-90">Transform doctor into different superhero styles</div>
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate enhanced component based on selection
  if (selectedPrompt === "name-art") {
    return (
      <NameArtSelector 
        doctorName={formData?.name || formData?.doctor_name || 'Doctor'} 
        onSelection={handlePrefilledImages}
        projectData={projectData}
      />
    );
  }
  
  if (selectedPrompt === "name-initial") {
    return (
      <InitialSelector 
        doctorName={formData?.name || formData?.doctor_name || 'Doctor'} 
        onSelection={handlePrefilledImages}
        projectData={projectData}
      />
    );
  }
  
  if (selectedPrompt === "superhero") {
    return (
      <SuperheroSelector 
        onSelection={handlePrefilledImages}
        projectData={projectData}
      />
    );
  }

  // ORIGINAL PHOTO UPLOAD INTERFACE (Enhanced)
  return (
    <div className="dark:bg-gray-900">
      {previewData && (
        <PreviewModal
          previewType="IMAGE"
          previewUrl={previewData}
          setPreviewMode={setPreviewData}
        />
      )}

      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        Calendar Images
        {photoCollectionType && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            (
            {photoCollectionType === "with-doctor"
              ? "Doctor Photos"
              : photoCollectionType === "ai-generate-for-you"
                ? `AI Theme: ${themeType}`
                : photoCollectionType === "mix" && selectedPrompt === "completed"
                  ? "AI Enhanced - Ready for Upload"
                  : "Mixed Mode"}
            )
          </span>
        )}
      </h2>

      {error && (
        <div
          className={`mb-4 text-sm p-3 rounded-lg border ${
            error.includes("successfully")
              ? "text-green-400 bg-green-900 bg-opacity-30 border-green-800"
              : "text-red-400 bg-red-900 bg-opacity-30 border-red-800"
          }`}
        >
          {error}
        </div>
      )}

      {/* Upload Controls - Show for with-doctor mode and mix mode after selection */}
      {(photoCollectionType === "with-doctor" || 
        (photoCollectionType === "mix" && selectedPrompt === "completed") ||
        !photoCollectionType) && (
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
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="mb-1 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3">
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
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
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
                    flex flex-col bg-gray-200 dark:bg-gray-800 border-gray-400 border-2 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-move
                    ${draggedItem === index ? "opacity-50 transform rotate-3 scale-105" : ""}
                    ${dragOverIndex === index ? "border-blue-500 bg-blue-900 bg-opacity-30" : "border-gray-200"}
                  `}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white text-center py-0.5 text-sm font-semibold flex items-center justify-center gap-2">
                    <MdDragIndicator className="h-4 w-4 text-gray-400" />
                    {displayMonthName}
                  </div>

                  <div
                    className="relative w-full h-20 overflow-hidden"
                    onClick={() => handlePreviewOpen(previewSrc, index)}
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

                  <div className="flex gap-1 justify-center bg-gray-200 dark:bg-gray-700 p-1">
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
                        className="hidden absolute bottom-full left-0 mb-1 bg-gray-100 dark:bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 min-w-32 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={(e) =>
                            handleReplaceClick(image.id, "camera", e)
                          }
                          className="block w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-700 bg-gray-200 dark:bg-gray-600 border-none transition-colors duration-200"
                        >
                          Camera
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleReplaceClick(image.id, "gallery", e)
                          }
                          className="block w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-700 border-none border-t border-gray-600 transition-colors duration-200"
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
          <div className="text-gray-500 mb-4 bg-gray-200 dark:bg-gray-800 p-4 rounded-full">
            <FaRegImage size={32} />
          </div>
          <p className="text-gray-400 mb-2">No images selected yet</p>
          <p className="text-gray-500 text-sm">
            {photoCollectionType === "with-doctor" 
              ? "Upload up to 12 doctor photos for your calendar"
              : photoCollectionType === "mix" && selectedPrompt === "completed"
                ? "Your AI-enhanced images are ready! Add more photos if needed"
                : `Upload up to ${CONFIG.maxImages} images for your calendar`}
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
              handleCropCancel();
            } else {
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