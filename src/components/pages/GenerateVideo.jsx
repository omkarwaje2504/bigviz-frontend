"use client";

import React, { useEffect, useState } from "react";
import { DecryptData, EncryptData, RemoveData } from "@utils/cryptoUtils";
import {
  VideoRender,
  GetRenderStatus,
  GenerateVideoAPI,
  Download,
} from "@actions/evideoApis";
import { useRouter } from "next/navigation";
import { FiLoader, FiDownload, FiArrowLeft, FiVideo } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MyError from "@services/MyError";

function GenerateVideo({ ui, projectData, projectId }) {
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Generating video...");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [renderId, setRenderId] = useState(null);
  const [doctorHash, setDoctorHash] = useState(null);
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [videoDownloaded, setVideoDownloaded] = useState(false);
  const [downloadLoader, setdownloadLoader] = useState(false);
  const [empData, setempData] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const savedUrl = DecryptData("videoUrl");
    const doctorHash = localStorage.getItem("doctorHash");
    const empData = DecryptData("empData");
    const formData = DecryptData(`${doctorHash}-formData`);
  
    const savedGenerated = DecryptData("videoGenerated");

    if (!doctorHash && !formData) {
      router.back();
    }

    if (projectData?.config?.employee && !empData) {
      router.back();
    }

    if (empData && projectData?.config?.employee) {
      setempData(empData);
    }

    if (doctorHash) {
      setDoctorHash(doctorHash);
    }

    if (savedUrl && savedGenerated === "true") {
      setVideoUrl(savedUrl);
      setVideoGenerated(true);
      setLoading(false);
      setStatusMsg("Video ready!");
    }
  }, []);

  useEffect(() => {
    if (videoGenerated || videoUrl) return;

    const startVideoGeneration = async () => {
      try {
        const dh = localStorage.getItem("doctorHash");
 
        let formData = DecryptData(`${dh}-formData`);
        let prevData = DecryptData(`${dh}-prevData`);
        console.log(formData,prevData)
        if (formData && prevData) {
          let updatedFormData = {
            ...formData,
            name: `${formData?.prefix} ${formData?.name}`,
            photo:
              prevData?.photo?.croppedImage ||
              formData?.photo?.croppedImage ||
              formData?.photo?.originalImage,
          };

          const response = await VideoRender(
            projectData?.artworks[0]?.name,
            updatedFormData,
          );

          if (!response.success) {
            setError(response.message || "Video generation failed.");
            setLoading(false);
            return;
          }

          if (!response.data?.renderId) {
            setError("Render ID not returned.");
            setLoading(false);
            return;
          }

          setRenderId(response.data.renderId);
          setStatusMsg("Processing video...");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong while generating video.");
        setLoading(false);
      }
    };

    startVideoGeneration();
  }, [ui, projectData, videoGenerated, videoUrl]);

  useEffect(() => {
    if (!renderId || videoGenerated) return;

    let progressVal = 0;
    let attempts = 0;
    const maxAttempts = 120;

    const interval = setInterval(async () => {
      try {
        attempts++;

        const check = await GetRenderStatus(renderId);

        progressVal = Math.min(progressVal + 5, 90);
        setProgress(progressVal);

        if (check.isError) {
          let errorMsg =
            check.errors[0]?.message || "Error during video rendering.";
          clearInterval(interval);
          setError(errorMsg);
          setLoading(false);
          MyError(errorMsg);
          return;
        }

        if (check.success && check.data.postRenderData?.outputFile) {
          clearInterval(interval);
          setVideoUrl(check.data.postRenderData?.outputFile);
          setLoading(false);
          setStatusMsg("Video ready!");
          setProgress(100);
          toast.success("Video Generated Successfully!");
          EncryptData("videoUrl", check.data.postRenderData?.outputFile);
          EncryptData("videoGenerated", "true");

          let outputFile = check.data.postRenderData?.outputFile;
          let empHash = empData?.hash;
          let cost = check.data.postRenderData?.cost?.estimatedCost;
          let timetaken = check?.data?.timeToRenderFrames;
          let renderid = check?.data?.renderMetadata?.renderId;
          let outputsize = check?.data?.postRenderData?.outputSize;

          let response = await GenerateVideoAPI(
            projectData,
            doctorHash,
            24,
            outputFile,
            empHash,
            cost,
            renderid,
            outputsize,
            timetaken,
          );

          if (response?.data) {
            if (response?.data?.visitor_hash !== null) {
              EncryptData("visitorHash", response?.data?.visitor_hash);
            }
          }
          setVideoGenerated(true);
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Video is taking too long. Please try again later.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(interval);
        setError("Error while checking video status. Please try again.");
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [renderId, projectData, doctorHash, videoGenerated]);

  const handleDownload = async () => {
    await Download(projectData, doctorHash, 25, empData?.employee_hash);
    setVideoDownloaded(true);
  };

  const handleGoBack = () => {
    RemoveData("videoGenerated");
    RemoveData("videoUrl");
    RemoveData("formData");
    RemoveData("doctorHash");
    if (projectData?.config?.employee) {
      router.push(`/${projectId}/homepage`);
    } else {
      RemoveData("empData");
      router.back();
    }
  };

  const handleFileDownload = async () => {
    try {
      setdownloadLoader(true);
      let data = await Download(projectData, doctorHash, 25);
      let formData = DecryptData(`${doctorHash}-formData`);
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${formData.prefix}.${formData.name}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Video Downloaded Successfully!");
      setVideoDownloaded(true);
      setdownloadLoader(false);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <ToastContainer position="bottom-center" autoClose={3000} />

      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        {loading && !error && (
          <div className="flex flex-col items-center w-full max-w-md p-3 rounded-2xl border dark:border-white border-black transition-all duration-300">
            <div className="mb-6">
              <button
                style={{
                  display: "flex",
                  justifyContent: "center",
                  color: "#fff",
                  width: "80px",
                  height: "80px",
                  borderRadius: "100%",
                  background: ui.basic.primaryColor,
                  transition: "all 0.3s ease-in-out 0s",
                  boxShadow: "rgba(193, 244, 246, 0.698) 0px 0px 0px 0px",
                  animation: "pulse 1.2s cubic-bezier(0.8, 0, 0, 1) infinite",
                  alignItems: "center",
                  border: "0",
                }}
              >
                <svg
                  viewBox="0 0 448 512"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  width="26px"
                >
                  <path
                    d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="w-full mb-6 ">
              <div className="w-full h-3 rounded-full overflow-hidden bg-[#e5e7eb] dark:bg-[#404040]">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: ui.basic.SecondaryText,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-black dark:text-white">
                <span>{progress}%</span>
              </div>
            </div>

            <p className="text-center font-medium text-black dark:text-white">
              {statusMsg}
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center p-8 rounded-2xl shadow-lg max-w-md">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl">!</span>
            </div>
            <p className="text-center mb-6">{error}</p>
          </div>
        )}

        {!loading && videoUrl && !error && (
          <div className="flex flex-col items-center gap-5">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="rounded-xl shadow-lg max-w-full w-[600px]"
            />

            {videoUrl && (
              <button
                onClick={handleFileDownload}
                disabled={downloadLoader}
                className="flex justify-center items-center gap-3 p-3 w-48 rounded-xl font-semibold transition-all duration-300 cursor-pointer"
                style={{
                  background: ui.basic.primaryColor,
                  color: ui.basic.primaryText,
                }}
              >
                <FiDownload size={20} />
                {downloadLoader ? "Downloading" : "Download Video"}
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleGoBack}
          disabled={loading && !error && !videoGenerated}
          className={`flex items-center gap-3 mt-5 p-3  rounded-xl font-medium transition-all duration-300 cursor-pointer ${
            loading && !error && !videoGenerated
              ? "opacity-50 cursor-not-allowed"
              : "hover:shadow-lg transform hover:scale-105"
          }`}
          style={{
            backgroundColor:
              loading && !error && !videoGenerated
                ? "#6b7280"
                : ui.basic.primaryColor,
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default GenerateVideo;
