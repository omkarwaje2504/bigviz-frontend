"use client";
import Footer from "@components/ui/Footer";
import Header from "@components/ui/Header";
import { DecryptData, EncryptData } from "@utils/cryptoUtils";
import FormNavigationButtons from "@components/ui/FormNavigationButtons";
import RenderStepContent from "@components/ui/RenderStepContent";
import RenderStepIndicator from "@components/ui/RenderStepIndicator";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import Link from "next/link";
import MyError from "@services/MyError";
import { SaveDoctors } from "@actions/user";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [isDark, setIsDark] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(media.matches);

    const listener = (e) => setIsDark(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

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

    const storedDoctorHash = localStorage.getItem("doctorHash");
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
    let doctorHash = DecryptData("doctorHash");
    if (doctorHash) {
      return true;
    }
    setIsSaveLoading(true);
    try {
      let doctorCode = DecryptData("doctorHash");
      const save = await SaveDoctors(
        projectData,
        userInfo?.hash,
        formData,
        doctorCode,
      );
      if (save.success) {
        EncryptData("doctorHash", save.doctorHash);
        setDoctorHash(save.doctorHash);
        setIsSaveLoading(false);
        return true;
      } else {
        console.log(save.message);
        toast.error(save.message || "Failed to save doctor");
        setIsSaveLoading(false);
        return false;
      }
    } catch (error) {
      console.error(error);
      MyError(error);
      toast.error("An error occurred while saving doctor");
      setIsSaveLoading(false);
      return false;
    }
  };

  const handleFormRedirection = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    try {
      let doctorCode = DecryptData("doctorHash");
      const save = await SaveDoctors(
        projectData,
        userInfo.hash,
        formData,
        doctorCode,
      );
      if (!save.success) {
        toast.error(save.message || "Submission failed");
      } else {
        toast.success("Doctor Added Successfully!");

        setTimeout(() => {
          if (projectData?.config?.game) {
            if (ui?.DoctorRegistrationForm?.HomeRedirection) {
              localStorage.removeItem("isEdit");
              localStorage.removeItem("doctorHash");
              router.push("homepage");
            } else {
              router.push("game");
            }
          } else if (projectData?.product_type === "RxPad") {
            localStorage.removeItem("isEdit");
            localStorage.removeItem("doctorHash");
            router.push("homepage");
          } else if (projectData?.product_type === "Evideo") {
            router.push(`/${projectData.project_hash}/generate-video`);
          } else {
            router.push("homepage");
          }
          setIsSubmitLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      MyError(error);
      toast.error("Unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen dark:bg-gray-900 text-white">
      <ToastContainer position="bottom-center" autoClose={3000} />

      <Header
        ui={ui}
        userInfo={userInfo}
        projectData={projectData}
        projectHash={projectId}
      />

      <div className="container mx-auto px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-1">
            {projectData?.config?.employee && (
              <Link
                className="text-xl font-bold flex gap-2 items-center text-gray-800 dark:text-white"
                href={`/${projectId}/homepage`}
              >
                <IoArrowBackCircleSharp
                  className="w-10 h-10"
                  style={{ fill: ui?.basic?.secondaryColor || "white" }}
                />
              </Link>
            )}
            <h1 className="text-xl font-bold flex gap-2 items-center text-gray-800 dark:text-white">
              {ui?.DoctorRegistrationForm?.FormHeading}
            </h1>
          </div>
          <p className="text-gray-400 mb-4 text-sm md:text-md">
            {ui?.DoctorRegistrationForm?.FormSubHeading}
          </p>

          <RenderStepIndicator
            projectData={projectData}
            currentStep={currentStep}
          />
          <form
            onSubmit={(e) => handleFormRedirection(e)}
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
