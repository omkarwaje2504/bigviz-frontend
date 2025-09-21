"use client";

import { FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa";

const FormNavigationButtons = ({
  ui,
  currentStep,
  setCurrentStep,
  formData,
  validationStatus,
  projectData,
  isSubmitLoading,
  onSaveDoctor,
}) => {
  const projectType = projectData?.product_type;
  const disablePhotoUpload = projectData?.config?.doctor?.disable_photo_upload;

  const disableMobileNumber =
    projectData?.config?.doctor?.disable_mobile_number;

  const isPage1Valid =
    currentStep !== 1 ||
    (!validationStatus && disableMobileNumber) ||
    (validationStatus &&
      Object.entries(validationStatus).every(([key, value]) => {
        if (disableMobileNumber && key === "mobile_number") {
          return true;
        }
        return Boolean(value);
      }));

  const isPage2Valid =
    currentStep !== 2 ||
    disablePhotoUpload ||
    (projectType !== "DeskCalendar" && !!formData?.photo?.croppedImage) ||
    (projectType === "DeskCalendar" &&
      Array.isArray(formData?.calendarData) &&
      formData.calendarData.length === 12 &&
      formData.calendarData.every((item) => !!item.images[0]?.croppedImage));

  const isLastStepForProject =
    (projectType === "Evideo" && currentStep === 2 && formData.photo) ||
    (projectType === "RxPad" && currentStep === 2 && formData.photo) ||
    (disablePhotoUpload && currentStep === 1 && isPage1Valid) ||
    (projectType === "DeskCalendar" && currentStep === 2 && isPage2Valid) ||
    (projectType === "PhotoFrame" && currentStep === 2 && isPage2Valid) ||
    (projectType !== "Evideo" && currentStep === 4);

  const canProceed =
    (currentStep === 1 && isPage1Valid) ||
    (currentStep === 2 && isPage2Valid) ||
    (currentStep === 3 && projectType !== "Evideo");

  const handleNext = async () => {
    if (currentStep === 1) {
      const success = await onSaveDoctor();
      if (!success) {
        return;
      }
    }

    if (disablePhotoUpload && currentStep === 1) {
      setCurrentStep(99);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="mt-8 flex justify-between">
      {currentStep > 1 && currentStep !== 99 && (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          <FaChevronLeft size={16} className="mr-1" />
          Back
        </button>
      )}

      {!isLastStepForProject && canProceed && (
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center ml-auto bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
        >
          Next
          <FaChevronRight size={16} className="ml-1" />
        </button>
      )}

      {isLastStepForProject && (
        <button
          type="submit"
          className="flex items-center ml-auto bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          disabled={isSubmitLoading}
        >
          {ui?.DoctorRegistrationForm?.SubmitButtonLable}
          {isSubmitLoading ? (
            <FaSpinner className="gap-2 w-4 h-4 animate-spin fill-white" />
          ) : (
            <FaChevronRight size={16} className="ml-1" />
          )}
        </button>
      )}
    </div>
  );
};

export default FormNavigationButtons;
