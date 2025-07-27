"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const FormNavigationButtons = ({
  currentStep,
  setCurrentStep,
  formData,
  validationStatus,
  projectData,
}) => {
  const projectType = projectData?.product_name;

  const isPage1Valid =
    currentStep !== 1 ||
    (validationStatus && Object.values(validationStatus).every(Boolean));
  const isPage2Valid = currentStep !== 2 || !!formData?.photo?.croppedImage;

  const isLastStepForProject =
    (projectType === "E-Video" && currentStep === 2 && isPage2Valid) ||
    (projectType !== "E-Video" && currentStep === 4);

  const canProceed =
    (currentStep === 1 && isPage1Valid) ||
    (currentStep === 2 && isPage2Valid) ||
    (currentStep === 3 && projectType !== "E-Video");
  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="mt-8 flex justify-between">
      {currentStep > 1 && (
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
          disabled={projectType !== "E-Video" && !formData.consent} // Optional: if E-Video, no constraint, else consent
        >
          Submit
          <FaChevronRight size={16} className="ml-1" />
        </button>
      )}
    </div>
  );
};

export default FormNavigationButtons;
