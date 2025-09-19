"use client";

import React, { useEffect, useState } from "react";
import { DecryptData, EncryptData } from "@utils/cryptoUtils";
import { VideoRender, GetRenderStatus, Analytics } from "@actions/evideoApis";
import { useRouter } from "next/navigation";

function GenerateVideo({ ui, projectData }) {
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Generating video...");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [renderId, setRenderId] = useState(null);
  const [doctorHash, setDoctorHash] = useState(null);

  const [videoGenerated, setVideoGenerated] = useState(false);
  const [videoDownloaded, setVideoDownloaded] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const savedUrl = DecryptData("videoUrl");
    const doctorHash = DecryptData("doctorHash");
    const savedGenerated = DecryptData("videoGenerated");

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
        let formData = DecryptData("formData");

        let updatedFormData = {
          ...formData,
          photo: formData.photo.originalImage,
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
    const maxAttempts = 20;

    const interval = setInterval(async () => {
      try {
        attempts++;

        const check = await GetRenderStatus(renderId);

        progressVal = Math.min(progressVal + 5, 90);
        setProgress(progressVal);

        if (check.success && check.data?.url && check.data.status === "OK") {
          clearInterval(interval);
          setVideoUrl(check.data.url);
          setLoading(false);
          setStatusMsg("Video ready!");
          setProgress(100);

          EncryptData("videoUrl", check.data.url);
          EncryptData("videoGenerated", "true");

          await Analytics({}, projectData, doctorHash, 24);
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
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Error while checking video status. Please try again.");
          setLoading(false);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [renderId, projectData, doctorHash, videoGenerated]);

  const handleDownload = async () => {
    await Analytics({}, projectData, doctorHash, 25);
    setVideoDownloaded(true);
  };

  const handleGoBack = () => {
    router.back();
  };
  const handleFileDownload = async () => {
    try {
      let data = await Analytics(projectData, doctorHash, 25);
      console.log(data)
      setVideoDownloaded(true);

      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "generated-video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
      {loading && !error && (
        <div className="flex flex-col items-center w-full max-w-md">
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-600">{statusMsg}</p>
        </div>
      )}

      {error || (videoGenerated && videoDownloaded) ? (
        <button
          onClick={handleGoBack}
          className="mt-6 px-6 py-2 rounded-lg shadow bg-green-600 text-white hover:bg-green-700"
        >
          ⬅️ Go Back
        </button>
      ) : null}

      {!loading && videoUrl && (
        <div className="flex flex-col items-center gap-4">
          <video
            src={videoUrl}
            controls
            className="rounded-xl shadow-lg max-w-full w-[600px]"
          />
          <button
            onClick={handleFileDownload}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            ⬇️ Download Video
          </button>
        </div>
      )}

      {(!loading && videoGenerated && videoDownloaded) || error ? (
        <button
          onClick={handleGoBack}
          className="mt-6 px-6 py-2 rounded-lg shadow bg-green-600 text-white hover:bg-green-700"
        >
          ⬅️ Go Back
        </button>
      ) : (
        <button
          disabled
          className="mt-6 px-6 py-2 rounded-lg shadow bg-gray-400 text-gray-200 cursor-not-allowed"
        >
          ⬅️ Go Back
        </button>
      )}
    </div>
  );
}

export default GenerateVideo;
