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
import MyError from "@services/MyError";
import { SaveDoctors } from "@actions/user";

export default function RegisterNewCandidate({ projectData, projectId, ui }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [photoUploadStatus, setPhotoUploadStatus] = useState(false);
  const [audioUploadStatus, setAudioUploadStatus] = useState(false);
  const [validationStatus, setValidationStatus] = useState();
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: 1,
    designation: "Medical Representative",
    avatar: "/images/avatar.jpg",
    code: "",
    hash: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    prefix: "Dr",
    photo: null,
  });
  const [doctorHash, setDoctorHash] = useState(null);

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
        code: getUserInfo?.code,
        hash: getUserInfo?.hash,
      });
    }
    
    // Check if we already have a doctor hash in localStorage
    const storedDoctorHash = localStorage.getItem('doctorHash');
    if (storedDoctorHash) {
      setDoctorHash(storedDoctorHash);
    }
  }, []);

  useEffect(() => {
    if (formData) {
      EncryptData("formData", formData);
    }
  }, [formData]);


  const handleSaveDoctor = async () => {
    setIsSaveLoading(true);
    try {
      const save = await SaveDoctors(projectData, userInfo.hash, formData);
      if (save.success) {
        
        EncryptData('doctorHash', save.doctorHash);
        setDoctorHash(save.doctorHash);
        setIsSaveLoading(false);
        return true;
      } else {
        console.log(save.message);
        setIsSaveLoading(false);
        return false;
      }
    } catch (error) {
      console.error(error);
      MyError(error);
      setIsSaveLoading(false);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    try {
      
      const save = await SaveDoctors(projectData, userInfo.hash, formData);
      if (!save.success) {
        console.log(save.message);
      } else {
        if (projectData?.config?.game) {
          router.push(`game`);
          setIsSubmitLoading(false);
        } else if(projectData?.product_type==="RxPad"){
          router.push(`homepage`);
          setIsSubmitLoading(false);
        } else if(projectData?.product_type==="Evideo"){
          router.push(`generate-video`)
          setIsSubmitLoading(false);
        } else {
          router.push(`homepage`);
          setIsSubmitLoading(false);
        }
        
        // Clear the stored doctor hash after successful submission
        localStorage.removeItem('doctorHash');
      }
    } catch (error) {
      console.error(error);
      MyError(error);
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
              doctorHash={doctorHash} 
            />
            <FormNavigationButtons
              ui={ui}
              projectData={projectData}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              formData={formData}
              validationStatus={validationStatus}
              isSubmitLoading={isSubmitLoading}
              onSaveDoctor={handleSaveDoctor} 
              isSaveLoading={isSaveLoading}
            />
          </form>
        </div>
      </div>
      <Footer projectData={projectData} />
    </div>
  );
}