"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getMimeType } from "advanced-cropper/extensions/mimes";
import { FaEdit } from "react-icons/fa";
import { ImageUploadButton } from "./ImageUploadButton";
import { ImageCropper } from "./ImageCropper";
import { getPhotoDims, fetchImageAsBlob } from "@utils/imageHelpers";
import "./styles.scss";

export default function PhotoUploadEditor({
  doctorHash,
  ui,
  projectData,
  setPhotoUploadStatus,
  formData,
  setFormData,
  isRxPadImage = false,
}) {
  const [image, setImage] = useState(null);
  const [filename, setFilename] = useState("");
  const [originalFile, setOriginalFile] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isRxPad = projectData?.product_type === "RxPad";
  const { w: cropWidth, h: cropHeight } = getPhotoDims(projectData);
  const ratio = cropWidth / cropHeight;

  const currentImageData = isRxPadImage
    ? formData?.rxpad_image
    : formData?.photo;

  useEffect(() => {
    setPhotoUploadStatus(!unsavedChanges);
  }, [unsavedChanges, setPhotoUploadStatus]);

  useEffect(() => {
    document.body.style.overflow = unsavedChanges ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [unsavedChanges]);

  useEffect(() => {
    const loadExistingImage = async () => {
      if (!currentImageData) return;

      setIsLoading(true);
      try {
        const imageUrl =
          currentImageData.croppedImage || currentImageData.originalImage;
        if (!imageUrl) return;

        const blob = await fetchImageAsBlob(imageUrl);
        const objectURL = URL.createObjectURL(blob);

        setImage({
          src: objectURL,
          type: blob.type || "image/jpeg",
        });

        if (currentImageData.originalImage) {
          const originalBlob = await fetchImageAsBlob(
            currentImageData.originalImage,
          );
          setOriginalFile(originalBlob);
        }
      } catch (err) {
        console.error("Failed to load image:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingImage();
  }, [currentImageData]);

  useEffect(() => {
    return () => {
      if (image?.src) {
        URL.revokeObjectURL(image.src);
      }
    };
  }, [image]);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    setOriginalFile(file);
    const blob = URL.createObjectURL(file);
    const typeFallback = file.type;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage({
        src: blob,
        type: getMimeType(e.target?.result, typeFallback),
      });
      setFilename(file.name);
      setUnsavedChanges(true);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (image?.src) {
      URL.revokeObjectURL(image.src);
    }

    setImage(null);
    setFilename("");
    setOriginalFile(null);
    setUnsavedChanges(false);

    if (isRxPadImage) {
      setFormData((prev) => ({ ...prev, rxpad_image: null }));
    } else {
      setFormData((prev) => ({ ...prev, photo: null }));
    }
  }, [image, isRxPadImage, setFormData]);

  const handleEditClick = useCallback(() => {
    setUnsavedChanges(true);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl mx-auto font-sans">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isRxPad ? "RxPad Image Upload" : "Photo Upload & Editor"}
      </h2>

      {!image ? (
        <ImageUploadButton
          ui={ui}
          onFileSelect={handleFileSelect}
          isRxPadImage={isRxPadImage}
          projectData={projectData}
        />
      ) : (
        <>
          {unsavedChanges ? (
            <ImageCropper
              image={image}
              setImage={setImage}
              originalFile={originalFile}
              filename={filename}
              unsavedChanges={unsavedChanges}
              setUnsavedChanges={setUnsavedChanges}
              isRxPadImage={isRxPadImage}
              formData={formData}
              setFormData={setFormData}
              onClose={() => setUnsavedChanges(false)}
              ui={ui}
              doctorHash={doctorHash}
              projectData={projectData}
              cropWidth={cropWidth}
              cropHeight={cropHeight}
              ratio={ratio}
              onRemove={handleRemoveImage}
            />
          ) : (
            <div className="space-y-4">
              {/* Edit Button */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="p-2 rounded-lg w-full justify-center text-white flex items-center gap-2 font-semibold bg-red-500 hover:bg-red-600 transition"
                  aria-label="Edit image"
                >
                  <FaEdit size={20} /> Re-Edit
                </button>
              </div>

              {/* Image Preview */}
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center h-80">
                {isLoading ? (
                  <div className="text-gray-500">Loading...</div>
                ) : (
                  image?.src && (
                    <img
                      src={image.src}
                      alt="Preview"
                      className="max-h-80 object-contain"
                    />
                  )
                )}
              </div>

              {/* Footer Info */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Filename: {filename || "Uploaded image"}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
