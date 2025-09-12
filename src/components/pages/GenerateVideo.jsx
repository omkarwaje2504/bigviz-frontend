"use client";

import React, { useEffect, useState } from "react";
import { DecryptData } from "@utils/cryptoUtils";
import { VideoRender, GetRenderStatus } from "@actions/evideoApis";

function GenerateVideo({ ui }) {
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Generating video...");
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [renderId, setRenderId] = useState(null);

  // Start video generation once
  useEffect(() => {
    const startVideoGeneration = async () => {
      try {
        let formData = DecryptData("formData");
        let updatedFormData = {
          ...formData,
          photo: formData.photo.originalImage,
        };

        const response = await VideoRender(
          ui.EVideoConfigs.VideoID,
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
        console.log(renderId)
        const check = await GetRenderStatus(renderId);
        console.log(check)

        if (check.success && check.data?.url && check.data.status === "OK") {
          clearInterval(interval);
          setVideoUrl(check.data.url);
          setLoading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(interval);
        setError("Error while checking video status.");
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval); 
  }, [renderId]);

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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            ⬇️ Download Video
          </a>
        </div>
      )}
    </div>
  );
}

export default GenerateVideo;
