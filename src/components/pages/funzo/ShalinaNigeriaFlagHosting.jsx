"use client";
import React, { useState, useRef, useEffect } from "react";

const ShalinaNigeriaFlagHosting = () => {
  const [stage, setStage] = useState("loading");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const loadedRef = useRef(false);

  const videoSrc = "/game/male-flag-hosting.mp4";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || loadedRef.current) return;

    console.log("🎬 Initializing Shalina Nigeria Flag Hosting video...");

    loadedRef.current = true;
    setVideoError(null);
    setIsVideoLoaded(false);

    video.preload = "auto";
    video.muted = false; // Enable sound
    video.playsInline = true;

    const handleVideoLoad = () => {
      if (isVideoLoaded) return;
      console.log("✅ Shalina Flag Hosting video ready to play!");
      setIsVideoLoaded(true);
      setStage("initial");
    };

    const handleVideoError = (e) => {
      console.error("❌ Video loading failed:", e);
      setVideoError("Failed to load Shalina Flag Hosting video");
      setStage("error");
    };

    const handleVideoEnd = () => {
      console.log("🎉 Shalina Flag Hosting celebration completed!");
      setStage("completed");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    video.addEventListener("canplaythrough", handleVideoLoad, { once: true });
    video.addEventListener("error", handleVideoError);
    video.addEventListener("ended", handleVideoEnd);

    video.load();

    return () => {
      video.removeEventListener("canplaythrough", handleVideoLoad);
      video.removeEventListener("error", handleVideoError);
      video.removeEventListener("ended", handleVideoEnd);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const drawVideoFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (canvas && video && ctx && video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Nigeria flag border overlay
      const borderWidth = 8;
      ctx.fillStyle = "#008000"; // Nigerian green
      ctx.fillRect(0, 0, canvas.width, borderWidth);
      ctx.fillRect(0, canvas.height - borderWidth, canvas.width, borderWidth);
      ctx.fillRect(0, 0, borderWidth, canvas.height);
      ctx.fillRect(canvas.width - borderWidth, 0, borderWidth, canvas.height);
    }

    if (!video.paused && !video.ended) {
      animationRef.current = requestAnimationFrame(drawVideoFrame);
    }
  };

  const startVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    console.log("🚀 Starting Shalina Flag Hosting celebration!");
    setStage("playing");

    // Enable sound and play
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("▶️ Shalina video playing successfully with sound");
          drawVideoFrame();
        })
        .catch((error) => {
          console.error("❌ Play failed:", error);
          // If autoplay with sound fails, try muted first
          video.muted = true;
          video.play().then(() => {
            console.log("▶️ Playing muted, user can unmute manually");
            drawVideoFrame();
          });
        });
    }

    // Auto-pause after 2 seconds (you had changed it to 2000ms)
    setTimeout(() => {
      if (video && !video.ended) {
        console.log("⏸️ Auto-pausing Shalina video at 2 seconds");
        video.pause();
        setStage("paused");
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    }, 7500);
  };

  const resumeVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    console.log("▶️ Resuming Shalina Flag Hosting celebration");
    setStage("playing");

    // Ensure sound is enabled when resuming
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => drawVideoFrame()).catch(console.error);
    }
  };

  const renderContent = () => {
    switch (stage) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-600 via-white to-green-600 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl text-center border-4 border-green-600 max-w-md">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Loading Flag Hosting Activity
              </h2>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-600 via-white to-red-600">
            <div className="bg-white p-8 rounded-lg shadow-2xl text-center border-4 border-red-600 max-w-md">
              <h2 className="text-2xl font-bold text-red-800 mb-4">
                Video Loading Error
              </h2>
              <p className="text-lg text-gray-700 mb-4">{videoError}</p>

              <div className="text-sm text-gray-600 mb-4">
                <p>
                  <strong>Video Path:</strong> {videoSrc}
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        );

      case "initial":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-600 via-white to-green-600 p-3">
            <button
              onClick={startVideo}
              className="group relative px-12 py-3 bg-green-600 text-white rounded-lg text-2xl text-center font-bold hover:bg-green-700 transition-all duration-300 shadow-2xl border-4 border-white transform hover:scale-105"
            >
              <span className="relative z-10">
                Start Flag Hosting Celebration
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        );

      case "playing":
        return (
          <div className="flex items-center justify-center min-h-screen bg-black relative">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          </div>
        );

      case "paused":
        return (
          <div className="flex items-center justify-center min-h-screen bg-green-600 relative">
            {/* Canvas stays visible - not hidden */}
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain shadow-2xl"
            />

            {/* Pause button overlay on top of the video */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={resumeVideo}
                className="px-8 py-4 bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg border-2 border-white transform hover:scale-105"
              >
                Host Flag
              </button>
            </div>
          </div>
        );

      case "completed":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-600 via-white to-green-600">
            <div className="text-center bg-white p-12 rounded-lg shadow-2xl border-4 border-green-600 max-w-2xl">
              <h1 className="text-5xl font-bold text-green-800 mb-6">
                🎉 THANK YOU! 🎉
              </h1>
              <h2 className="text-3xl font-semibold text-green-700 mb-4">
                Shalina's Flag Hosting Complete!
              </h2>
              <h3 className="text-2xl font-semibold text-green-700 mb-4">
                Happy 64th Independence Day!
              </h3>
              <p className="text-xl text-gray-800 mb-6 leading-relaxed">
                Thank you for witnessing Shalina's flag hosting ceremony
                celebrating Nigeria's journey of unity, peace, and progress.
                Together we honor our nation's heritage.
              </p>

              <div className="flex justify-center items-center space-x-4 mb-6">
                <div className="w-8 h-12 bg-green-600 rounded"></div>
                <div className="w-8 h-12 bg-white border-2 border-green-600 rounded"></div>
                <div className="w-8 h-12 bg-green-600 rounded"></div>
              </div>

              <div className="text-green-800 font-bold text-lg mb-4">
                🇳🇬 One Nation, One Destiny 🇳🇬
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  "Unity and Faith, Peace and Progress" - Nigeria's National
                  Motto
                </p>
                <p className="mt-2">Flag Hosting Ceremony by Shalina</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        playsInline
        muted={false} // Sound enabled by default
        preload="auto"
      />

      {renderContent()}
    </div>
  );
};

export default ShalinaNigeriaFlagHosting;
