"use client";

import MyError from "@services/MyError";
import { FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const FormNavigationButtons = ({
  ui,
  currentStep,
  setCurrentStep,
  formData,
  validationStatus,
  projectData,
  isSubmitLoading,
  onSaveDoctor,
  handleExtraGameButton,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const projectType = projectData?.product_type;
  const disablePhotoUpload = projectData?.config?.doctor?.disable_photo_upload;
  const optionalPhotoUpload = projectData?.config?.doctor?.optional_first_photo;

  const photoCollectionType = searchParams.get("photo-collection-type");
  const themeType = searchParams.get("theme-type");
  const selectedPrompt = searchParams.get("selected-prompt");
  const ShowFinalPreview = searchParams.get("final-preview");

  const disableMobileNumber =
    projectData?.config?.doctor?.disable_mobile_number;

  const isPage1Valid =
    currentStep !== 1 ||
    (!validationStatus && disableMobileNumber && formData.name) ||
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
      Array.isArray(formData?.calendar_images) &&
      formData?.calendar_images?.length > 0);

  const isPage3Valid = currentStep !== 3 || !!formData?.calendar_consent;

  const isLastStepForProject =
    (projectData?.config?.doctor?.data_collection === true &&
      currentStep === 2 &&
      (optionalPhotoUpload ? true : formData.photo)) ||
    (projectType === "EVideo" &&
      currentStep === 2 &&
      (optionalPhotoUpload ? true : formData.photo)) ||
    (projectType === "RxPad" && currentStep === 2 && formData.photo) ||
    (disablePhotoUpload && currentStep === 1 && isPage1Valid) ||
    (projectType === "DeskCalendar" && currentStep === 3 && isPage3Valid) ||
    (projectType === "PhotoFrame" && currentStep === 2 && isPage2Valid) ||
    (projectType !== "EVideo" && currentStep === 4);

  const canProceed =
    (currentStep === 1 && isPage1Valid) ||
    (currentStep === 2 && isPage2Valid) ||
    (currentStep === 3 && projectType !== "EVideo");

  const handleNext = async () => {
    if (currentStep === 1) {
      try {
        const success = await onSaveDoctor();
        if (!success) {
          return;
        }
      } catch (e) {
        MyError(e);
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
  const handleCalendarBack = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    const getPhotoCollectionType = newParams.get("photo-collection-type");

    if (
      newParams.has("final-preview") &&
      getPhotoCollectionType === "with-doctor"
    ) {
      newParams.delete("final-preview");
      newParams.delete("photo-collection-type");
    } else if (newParams.has("final-preview")) {
      newParams.delete("final-preview");
    } else if (newParams.has("selected-prompt")) {
      newParams.delete("selected-prompt");
    } else if (newParams.has("theme-type")) {
      newParams.delete("theme-type");
    } else if (newParams.has("photo-collection-type")) {
      newParams.delete("photo-collection-type");
    } else {
      setCurrentStep(currentStep - 1);
      return;
    }

    // Update URL reactively (this re-renders automatically)
    router.replace(`${pathname}?${newParams.toString()}`);
  };

  return (
    <div className="mt-8 flex flex-wrap justify-between">
      {currentStep > 1 && currentStep !== 99 && (
        <button
          type="button"
          onClick={
            projectType !== "DeskCalendar" ? handleBack : handleCalendarBack
          }
          className="flex items-center bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded h-fit"
        >
          <FaChevronLeft size={16} className="mr-1" />
          Back
        </button>
      )}

      {!isLastStepForProject && canProceed && currentStep !== 3 && (
        <>
          {projectType === "DeskCalendar" &&
            (currentStep !== 2 ||
              (currentStep === 2 &&
                Array.isArray(formData?.calendar_images) &&
                formData?.calendar_images.length > 0 &&
                photoCollectionType &&
                ShowFinalPreview)) && (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center ml-auto bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
              >
                Next
                <FaChevronRight size={16} className="ml-1" />
              </button>
            )}
        </>
      )}
      <div className="md:flex gap-2">
        {ui?.DoctorRegistrationForm?.HomeRedirection &&
          isLastStepForProject && (
            <button
              type="button"
              onClick={handleExtraGameButton}
              className="flex items-center ml-auto bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded mb-2"
              disabled={isSubmitLoading}
            >
              Start Flag Hosting
              {isSubmitLoading ? (
                <FaSpinner className="gap-2 w-4 h-4 animate-spin fill-white" />
              ) : (
                <FaChevronRight size={16} className="ml-1" />
              )}
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
    </div>
  );
};

export default FormNavigationButtons;
