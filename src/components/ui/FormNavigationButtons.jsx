"use client";

import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa";

const FormNavigationButtons = ({
  ui,
  currentStep,
  setCurrentStep,
  formData,
  validationStatus,
  projectData,
  isSubmitLoading,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(media.matches);
    const listener = (e) => setIsDark(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const projectType = projectData?.product_type;
  const disablePhotoUpload = projectData?.config?.doctor?.disable_photo_upload;

  const isPage1Valid =
    currentStep !== 1 ||
    (validationStatus && Object.values(validationStatus).every(Boolean));

  const isPage2Valid =
    currentStep !== 2 ||
    disablePhotoUpload ||
    (projectType !== "DeskCalendar" && !!formData?.photo?.croppedImage) ||
    (projectType === "DeskCalendar" &&
      Array.isArray(formData?.calendarData) &&
      formData.calendarData.length === 12 &&
      formData.calendarData.every((item) => !!item.images[0]?.croppedImage));

  const isLastStepForProject =
    (projectType === "Evideo" && currentStep === 2) ||
    (projectType === "RxPad" && currentStep === 2) ||
    (disablePhotoUpload && currentStep === 1 && isPage1Valid) ||
    (projectType === "DeskCalendar" && currentStep === 2 && isPage2Valid) ||
    (projectType === "PhotoFrame" && currentStep === 2 && isPage2Valid) ||
    (projectType !== "Evideo" && currentStep === 4);

  const canProceed =
    (currentStep === 1 && isPage1Valid) ||
    (currentStep === 2 && isPage2Valid) ||
    (currentStep === 3 && projectType !== "Evideo");

  const handleNext = () => {
    if (disablePhotoUpload && currentStep === 1) {
      setCurrentStep(99);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  // Theme-aware colors
  const buttonBgColor = isDark
    ? ui?.basic?.secondaryColor || "#444444"
    : ui?.basic?.primaryColor || "#fb2c36";

  const buttonTextColor = isDark
    ? ui?.basic?.secondaryText || "#ffffff"
    : ui?.basic?.primaryText || "#ffffff";

  return (
    <div className="mt-8 flex justify-between">
      {currentStep > 1 && currentStep !== 99 && (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center bg-gray-700 hover:bg-gray-600 text-white dark:bg-gray-500 dark:hover:bg-gray-400 py-2 px-4 rounded"
        >
          <FaChevronLeft size={16} className="mr-1" />
          Back
        </button>
      )}

      {!isLastStepForProject && canProceed && (
        <button
          type="button"
          onClick={handleNext}
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          className="flex items-center ml-auto py-2 px-4 rounded transition-colors duration-200"
        >
          Next
          <FaChevronRight size={16} className="ml-1" />
        </button>
      )}

      {isLastStepForProject && (
        <button
          type="submit"
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          className="flex items-center ml-auto py-2 px-4 rounded transition-colors duration-200"
          disabled={isSubmitLoading}
        >
          {ui?.DoctorRegistrationForm?.SubmitButtonLable}
          {isSubmitLoading ? (
            <FaSpinner className="gap-2 w-4 h-4 animate-spin" />
          ) : (
            <FaChevronRight size={16} className="ml-1" />
          )}
        </button>
      )}
    </div>
  );
};

export default FormNavigationButtons;
