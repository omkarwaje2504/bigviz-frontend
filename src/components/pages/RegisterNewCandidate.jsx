"use client";
import Footer from "@components/ui/Footer";
import Header from "@components/ui/Header";
import { DecryptData, EncryptData } from "@utils/cryptoUtils";
import FormNavigationButtons from "@components/ui/FormNavigationButtons";
import RenderStepContent from "@components/ui/RenderStepContent";
import RenderStepIndicator from "@components/ui/RenderStepIndicator";
import { useEffect, useState } from "react";
import {
  FaCheck,
  FaTimes,
  FaMicrophone,
  FaChevronRight,
  FaChevronLeft,
  FaStar,
} from "react-icons/fa";
import { set } from "zod";
import { useRouter } from "next/navigation";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import Link from "next/link";

export default function RegisterNewCandidate({ projectData, projectId, ui }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [photoUploadStatus, setPhotoUploadStatus] = useState(false);
  const [audioUploadStatus, setAudioUploadStatus] = useState(false);
  const [validationStatus, setValidationStatus] = useState();
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: 1,
    designation: "Medical Representative",
    avatar: "/images/avatar.jpg",
  });
  const [formData, setFormData] = useState({
    name: "",
    prefix: "Dr",
    mobile_number: `${projectData?.config?.doctor?.country_codes[0] || "+91"}`,
    photo: null,
  });
  const router = useRouter();

  useEffect(() => {
    const gitFormData = DecryptData("formData");
    const getUserInfo = DecryptData("empData");

    if (gitFormData) {
      setFormData(gitFormData);
    }
    if (getUserInfo) {
      setUserInfo({
        name: getUserInfo?.name,
        role: getUserInfo?.role,
        designation: getUserInfo?.role_name,
      });
    }
  }, []);
  useEffect(() => {
    if (formData) {
      EncryptData("formData", formData);
    }
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log("Form submitted:", formData,projectData?.config?.game);
    if (projectData?.config?.game) {
      router.push(`game`);
    } else {
      router.push(`render-magic-moment`);
    }
  };
  return (
    <div className="min-h-screen dark:bg-gray-900 text-white">
      <Header
        userInfo={userInfo}
        projectData={projectData}
        projectHash={projectId}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <Link
            className="text-xl font-bold flex gap-2 items-center text-gray-800 dark:text-white"
            href={`/${projectId}/homepage`}
          >
            <IoArrowBackCircleSharp
              className="w-10 h-10"
              style={{ fill: ui?.basic?.secondaryColor || "white" }}
            />{" "}
            {ui?.DoctorRegistrationForm?.FormHeading}
          </Link>
          <p className="text-gray-400 mb-4 text-sm md:text-md">
            {ui?.DoctorRegistrationForm?.FormSubHeading}
          </p>

          <RenderStepIndicator
            projectData={projectData}
            currentStep={currentStep}
          />
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-800"
          >
            <RenderStepContent
              ui={ui}
              currentStep={currentStep}
              formData={formData}
              setFormData={setFormData}
              projectData={projectData}
              setPhotoUploadStatus={setPhotoUploadStatus}
              setAudioUploadStatus={setAudioUploadStatus}
              setValidationStatus={setValidationStatus}
            />
            <FormNavigationButtons
              projectData={projectData}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              formData={formData}
              validationStatus={validationStatus}
            />
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
