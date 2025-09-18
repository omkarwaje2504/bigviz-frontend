"use client";

import React, { useEffect, useState } from "react";
import { DecryptData } from "@utils/cryptoUtils";
import { VideoRender, GetRenderStatus, Analytics } from "@actions/evideoApis";
import { useRouter } from "next/navigation";

function GenerateVideo({ ui, projectData }) {

  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Generating video...");
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [renderId, setRenderId] = useState(null);

  const [videoGenerated, setVideoGenerated] = useState(false);
  const [videoDownloaded, setVideoDownloaded] = useState(false);
  const router = useRouter();

  const doctorHash =
    typeof window !== "undefined" ? localStorage.getItem("doctorHash") : null;

  useEffect(() => {
    const startVideoGeneration = async () => {
      try {
        let formData = DecryptData("formData");
       
        let updatedFormData = {
          ...formData,
          photo: formData.photo.originalImage,
        };

        const response = await VideoRender(
          projectData?.artworks[0]?.name,
          updatedFormData
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
      } catch (err) {
        console.error(err);
        setError("Something went wrong while generating video.");
        setLoading(false);
      }
    };

    startVideoGeneration();
  }, [ui]);


  useEffect(() => {
    if (!renderId) return;

    const interval = setInterval(async () => {
      try {
        const check = await GetRenderStatus(renderId);

        if (check.success && check.data?.url && check.data.status === "OK") {
          clearInterval(interval);
          setVideoUrl(check.data.url);
          setLoading(false);
          setStatusMsg("Video ready!");
          Analytics({}, projectData, doctorHash, 24);
          setVideoGenerated(true);
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(interval);
        setError("Error while checking video status.");
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [renderId, projectData, doctorHash]);


  const handleDownload = () => {
    Analytics({}, projectData, doctorHash, 25);
    setVideoDownloaded(true);
  };

  const handleGoBack = () => {
    if (!videoGenerated || !videoDownloaded) {
      alert("Data will get lost if you go back before completing download!");
      return;
    }
    router.back();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
      {loading && !error && (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600">{statusMsg}</p>
        </div>
      )}

      {error && <div className="text-red-500 font-medium">{error}</div>}

      {!loading && videoUrl && (
        <div className="flex flex-col items-center gap-4">
          <video
            src={videoUrl}
            controls
            className="rounded-xl shadow-lg max-w-full w-[600px]"
          />
          <a
            href={videoUrl}
            download="generated-video.mp4"
            onClick={handleDownload}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            ⬇️ Download Video
          </a>
        </div>
      )}

      <button
        onClick={handleGoBack}
        disabled={!videoGenerated || !videoDownloaded}
        className={`mt-6 px-6 py-2 rounded-lg shadow ${
          videoGenerated && videoDownloaded
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
      >
        ⬅️ Go Back
      </button>
    </div>
  );
}

export default GenerateVideo;
