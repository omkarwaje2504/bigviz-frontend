"use client";

import { useEffect, useRef, useState } from "react";
import { Cropper, RectangleStencil } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import "./styles.scss";
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
} from "react-icons/fa";
import Button from "./Button";
import UploadFile from "@services/uploadFile";

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

export default function PhotoUploadEditor({
  projectData,
  setPhotoUploadStatus,
  formData,
  setFormData,
}) {
  const imageRef = useRef(null);
  const inputRef = useRef(null);
  const cropperRef = useRef(null);

  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [editMode, setEditMode] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [filename, setFilename] = useState("");
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [originalFile, setOriginalFile] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const { w: cropWidth, h: cropHeight } = getPhotoDims(projectData);
  const ratio = cropWidth / cropHeight;

  useEffect(() => {
    if (unsavedChanges) {
      setPhotoUploadStatus(false);
    } else {
      setPhotoUploadStatus(false);
    }
  }, [unsavedChanges]);

  useEffect(() => {
    const loadCroppedImage = async () => {
      if (formData.photo?.croppedImage) {
        try {
          const response = await fetch(formData.photo.croppedImage, {
            cache: "no-store",
          });
          const blob = await response.blob();
          const objectURL = URL.createObjectURL(blob);

          setImage({
            src: objectURL,
            type: blob.type || "image/png",
          });
        } catch (err) {
          console.error("Failed to load cropped image:", err);
        }
      }
    };

    loadCroppedImage();

    if (formData?.photo?.originalImage) {
      const fetchAndConvertToBlob = async () => {
        try {
          const response = await fetch(formData.photo.originalImage, {
            cache: "no-store",
          });
          const blob = await response.blob();
          setOriginalFile(blob);
        } catch (err) {
          console.error("Failed to fetch image from S3:", err);
        }
      };

      if (formData.photo.originalImage) {
        fetchAndConvertToBlob();
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (image?.src) URL.revokeObjectURL(image.src);
    };
  }, [image]);

  const currentFilterStyle = {
    filter: `
    contrast(${contrast}%)
    brightness(${brightness}%)
    saturate(${saturate}%)
  `,
  };

  const onUpload = () => {
    inputRef.current?.click();
  };

  const onLoadImage = (event) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    setOriginalFile(file);
    if (file) {
      const blob = URL.createObjectURL(file);
      const typeFallback = file.type;
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage({
          src: blob,
          type: getMimeType(e.target?.result, typeFallback),
        });

        setFilename(file.name);
        setEditMode("crop");
        setUnsavedChanges(true);
      };
      reader.readAsArrayBuffer(file);
    }
    event.target.value = "";
  };

  const rotateImage = (direction) => {
    setRotation((prev) => prev + 90 * direction);
    setUnsavedChanges(true);
  };

  const handleZoom = (delta) => {
    setZoom((prev) => Math.max(0.5, Math.min(prev + delta * 0.1, 3)));
    setUnsavedChanges(true);
  };

  const resetEdits = () => {
    if (originalFile) {
      const blob = URL.createObjectURL(originalFile);
      setImage({
        src: blob,
        type: getMimeType(originalFile, originalFile.type),
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
  };

  const toggleCropMode = () => {
    setEditMode((prev) => (prev === "crop" ? null : "crop"));
    setUnsavedChanges(true);
  };

  const handleRemoveImage = () => {
    if (image?.src) URL.revokeObjectURL(image.src);
    setZoom(1);
    setRotation(0);
    setEditMode(null);
    setPosition({ x: 0, y: 0 });
    setImage(null);

    setFilename("");
    setFormData((prev) => ({
      ...prev,
      photo: null,
    }));
  };
  const saveCroppedImage = async () => {
    console.log("Saving cropped image...");
    let canvas = null;

    if (editMode === "crop" && cropperRef.current) {
      canvas = cropperRef.current.getCanvas({
        width: cropWidth,
        height: cropHeight,
      });
    } else if (imageRef.current) {
      // Create a temporary canvas and draw the image with rotation, zoom, and filters
      const imgElement = imageRef.current;
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");

      // Calculate new dimensions
      const size = Math.max(imgElement.naturalWidth, imgElement.naturalHeight);
      tempCanvas.width = size;
      tempCanvas.height = size;

      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Apply filters
      ctx.filter = `
      contrast(${contrast}%)
      brightness(${brightness}%)
      saturate(${saturate}%)
    `;

      ctx.drawImage(
        imgElement,
        -imgElement.naturalWidth / 2,
        -imgElement.naturalHeight / 2,
      );
      ctx.restore();

      canvas = tempCanvas;
      setContrast(100);
      setBrightness(100);
      setSaturate(100);
      setUnsavedChanges(false);
      setRotation(0);
      setZoom(1);
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
      const dataUrl = canvas.toDataURL("image"); 
      const imageBlob = dataURLToBlob(dataUrl);
      const cropperFileName = `cropped_${blobName}`;
      const originalFileName = `original_${blobName}`;
      const uploadedCroppedFileUrl = await UploadFile(
        projectData,
        imageBlob,
        cropperFileName,
        "image",
      );

      const uploadedOriginalFileUrl = await UploadFile(
        projectData,
        originalFile,
        originalFileName,
        "image",
      );
      setImage({
        src: uploadedCroppedFileUrl,
      });
      setFormData((prev) => ({
        ...prev,
        photo: {
          croppedImage: uploadedCroppedFileUrl,
          originalImage: uploadedOriginalFileUrl,
        },
      }));
      setEditMode(null);
      setUnsavedChanges(false);
      console.log("Image saved successfully!");
    }
  };
  return (
    <div className="bg-gray-900 rounded-lg max-w-3xl mx-auto font-sans">
      <h2 className="text-2xl font-bold text-white mb-6">
        Photo Upload & Editor
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onLoadImage}
        style={{ display: "none" }}
      />

      {!image ? (
        <div
          className="relative border-2 border-dashed border-gray-600 rounded-lg p-8 text-center h-80 flex flex-col items-center justify-center cursor-pointer"
          onClick={onUpload}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const fakeEvent = {
                target: { files: [file] },
                preventDefault: () => {},
              };
              onLoadImage(fakeEvent);
            }
          }}
        >
          <div className="text-gray-400 mb-4 bg-gray-800 p-4 rounded-full">
            <FaRegImage size={48} />
          </div>
          <p className="text-gray-300 mb-4 text-lg">
            Drag and drop your photo here, or click to browse
          </p>
          <p className="text-gray-500 mb-6 text-sm">
            Supported formats: JPG, PNG, WEBP
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => rotateImage(1)}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-white"
                title="Rotate"
              >
                <FaRedo size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(1)}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-white"
                title="Zoom In"
              >
                <FaSearchPlus size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-1)}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-white"
                title="Zoom Out"
              >
                <FaSearchMinus size={20} />
              </button>
              <button
                type="button"
                onClick={toggleCropMode}
                className={`p-2 rounded-lg text-white ${editMode === "crop" ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
                title="Crop"
              >
                <FaCrop size={20} />
              </button>
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() =>
                    setEditMode((prev) => (prev === "filter" ? null : "filter"))
                  }
                  className={`p-2 rounded-lg text-white ${editMode === "filter" ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
                  title="Filters"
                >
                  <FaSlidersH size={20} />
                </button>
                {editMode === "filter" && (
                  <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg p-4 z-50 w-64">
                    <h3 className="text-white font-medium mb-2">
                      Adjust Filters
                    </h3>

                    <div className="mb-2">
                      <label className="text-gray-300 text-sm">
                        Contrast: {contrast}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={contrast}
                        onChange={(e) => setContrast(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="mb-2">
                      <label className="text-gray-300 text-sm">
                        Brightness: {brightness}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={brightness}
                        onChange={(e) => setBrightness(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="mb-2">
                      <label className="text-gray-300 text-sm">
                        Saturation: {saturate}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={saturate}
                        onChange={(e) => setSaturate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={resetEdits}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-white md:hidden"
                title="Reset Edits"
              >
                <FaSyncAlt size={20} />
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-red-600 hover:bg-red-700 p-2 rounded-lg text-white md:hidden"
                title="Remove Image"
              >
                <FaTrashAlt size={20} />
              </button>
            </div>
            <div className=" gap-3 hidden md:flex">
              <button
                type="button"
                onClick={resetEdits}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-white"
                title="Reset Edits"
              >
                <FaSyncAlt size={20} />
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-red-600 hover:bg-red-700 p-2 rounded-lg text-white"
                title="Remove Image"
              >
                <FaTrashAlt size={20} />
              </button>
            </div>
          </div>

          <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center h-80">
            <img
              ref={imageRef}
              src={image?.src || image}
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
            {editMode === "crop" && (
              <div className="absolute inset-0">
                <Cropper
                  ref={cropperRef}
                  src={image?.src}
                  stencilComponent={RectangleStencil}
                  stencilProps={{
                    stencilSize: { width: cropWidth, height: cropHeight }, // lock to 800×300
                    movable: true, // can drag
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
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row  justify-between items-center">
            <div className="text-white mb-2 md:mb-0">
              <p className="text-sm text-gray-400">Filename: {filename}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm mr-2">Zoom: {zoom.toFixed(1)}x</span>
                <span className="text-sm">Rotation: {rotation}°</span>
              </div>
            </div>
            <div>
              <Button
                type="button"
                fullWidth={false}
                leftIcon={<FaSave size={20} className="mr-2" />}
                onClick={saveCroppedImage}
              >
                Save Changes
              </Button>
              {unsavedChanges && (
                <p className="text-yellow-400 text-xs mt-1 text-center">
                  Unsaved Changes
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-gray-400 text-sm">
        <h3 className="text-white text-lg font-medium mb-2">
          Photo Requirements
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Upload a professional, high-quality headshot</li>
          <li>Make sure your face is clearly visible with good lighting</li>
          <li>Professional attire recommended</li>
          <li>Neutral background works best for cinema advertisements</li>
          <li>Minimum resolution: 1000x1000 pixels</li>
        </ul>
      </div>
    </div>
  );
}

function dataURLToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}
