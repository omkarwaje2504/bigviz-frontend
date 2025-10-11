"use client";
import Footer from "@components/ui/Footer";
import Header from "@components/ui/Header";
import { DecryptData, EncryptData, RemoveData } from "@utils/cryptoUtils";
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

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

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
  });
  const [doctorHash, setDoctorHash] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const urlCheck = params.get("dh");
    const photoCollectionType = params.get("photo-collection-type");

    if (!projectData?.config?.employee && !urlCheck) {
      params.set("dh", `${generateRandomString(8)}-new`);
      window.history.replaceState({}, "", url.toString());
    }
    if (projectData?.product_type === "DeskCalendar" && photoCollectionType) {
      setCurrentStep(2);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(media.matches);

    const listener = (e) => setIsDark(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    RemoveData("videoGenerated");
    RemoveData("videoUrl");
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const dh = params.get("dh");
    if (!projectData?.config?.employee) {
      RemoveData(`${dh}-formData`);
    }
    setDoctorHash(dh);

    if (dh) {
      setDoctorHash(dh);
    }
    const getFormData = DecryptData(`${dh}-formData`);

    const getUserInfo = DecryptData("empData");
    if (getFormData) {
      setFormData(getFormData);
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
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const dh = params.get("dh");
    if (formData) {
      EncryptData(`${dh}-formData`, formData);
    }
  }, [formData]);

  const handleSaveDoctor = async () => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const doctorHash = params.get("dh");

    if (!doctorHash) {
      toast.error("Id is missing. Please go to homepage and try again.");
      return;
    }
    setIsSaveLoading(true);
    try {
      const save = await SaveDoctors(
        projectData,
        userInfo?.hash,
        formData,
        doctorHash?.includes("-new") ? null : doctorHash,
      );
      if (save.success) {
        localStorage.setItem("doctorHash", save.doctorHash);
        setDoctorHash(save.doctorHash);
        localStorage.removeItem(`${doctorHash}-formData`);
        localStorage.removeItem(`null-formData`);
        EncryptData(`${save.doctorHash}-formData`, formData);

        const url = new URL(window.location.href);
        const params = url.searchParams;
        params.set("dh", save.doctorHash);
        window.history.replaceState({}, "", url.toString());

        setIsSaveLoading(false);
        return true;
      } else {
        toast.error(save.message || "Failed to save doctor");
        setIsSaveLoading(false);
        return false;
      }
    } catch (error) {
      console.error(error);
      MyError(error);
      toast.error(
        "An error occurred while saving doctor. Please logout and try again.",
      );
      setIsSaveLoading(false);
      return false;
    }
  };

  const handleExtraGameButton = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const dh = params.get("dh");

    try {
      const save = await SaveDoctors(projectData, userInfo.hash, formData, dh);
      if (!save.success) {
        toast.error("Submission failed");
      } else {
        toast.success("Doctor Added Successfully!");

        router.push(
          `https://platform.informatia.ai/${projectId}/game?dh=${dh}&h=${userInfo?.hash}`,
        );
      }
    } catch (error) {
      console.error(error);
      MyError(error);
      toast.error("Unexpected error occurred");
    }
  };
  const handleFormRedirection = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    try {
      let doctorCode = localStorage.getItem("doctorHash");
      const save = await SaveDoctors(
        projectData,
        userInfo.hash,
        formData,
        doctorCode,
      );
      if (!save.success) {
        toast.error(save.message || "Submission failed");
      } else {
        if(projectData?.config?.game?.scratch_card){
          localStorage.setItem("doctorHash", save.doctorHash);
        }
        toast.success("Doctor Added Successfully!");

        setTimeout(() => {
          if (projectData?.config?.game) {
            if (ui?.DoctorRegistrationForm?.HomeRedirection) {
              localStorage.removeItem("isEdit");
              localStorage.removeItem("doctorHash");
              router.push("homepage");
            } else {
              
              const urlParams = new URLSearchParams(window.location.search);
              const dhValue = urlParams.get("dh");
              if(projectData?.config?.game?.scratch_card){
                localStorage.setItem("formDataValue",dhValue)
              }
              router.push("game");
            }
          } else if (projectData?.product_type === "RxPad") {
            localStorage.removeItem("isEdit");
            localStorage.removeItem("doctorHash");
            router.push("homepage");
          } else if (projectData?.product_type === "EVideo") {
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
        isHomePage={true}
        ui={ui}
        userInfo={userInfo}
        projectData={projectData}
        projectHash={projectId}
      />

      <div className="container mx-auto px-4 py-3">
        <div className="max-w-3xl mx-auto">
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
              handleExtraGameButton={handleExtraGameButton}
            />
          </form>
        </div>
      </div>
      <Footer projectData={projectData} />
    </div>
  );
}
