"use client";
import React, { useState, useRef, useEffect } from "react";
import { FetchDoctor } from "../../../../actions/user";
import { Download } from "@actions/evideoApis";

const ShalinaNigeriaFlagHosting = ({ projectData, projectId, ui }) => {
  const [stage, setStage] = useState("loading");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [doctorHash, setDoctorHash] = useState(null);
  const [empHash, setEmpHash] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [certificateReady, setCertificateReady] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [downlaodLoading,setDownloadLaoding] = useState(false)
  const [videoSrc,setVideoSrc] = useState()

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const fetDoctor = async () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const dh = params.get("dh");
      const h = params.get("h");
  
      if (dh && h) {
        setDoctorHash(dh);
        setEmpHash(h);
        try {
          let doctorData = await FetchDoctor(projectData, dh);
  
          if (doctorData) {
            if(doctorData?.data?.fields?.[3]?.value === "Male"){
              setVideoSrc("/game/male-flag-hosting.mp4")
            }else{
              setVideoSrc("/game/female-flag-hosting.mp4")
            }
            setDoctorData(doctorData?.data);
          }
        } catch (error) {
          console.log(error);
        }
      }
    };
    fetDoctor();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || loadedRef.current) return;

    loadedRef.current = true;
    setVideoError(null);
    setIsVideoLoaded(false);

    video.preload = "auto";
    video.muted = false; 
    video.playsInline = true;

    const handleVideoLoad = () => {
      if (isVideoLoaded) return;
      setIsVideoLoaded(true);
      setStage("initial");
    };

    const handleVideoError = (e) => {
      setVideoError("Failed to load Shalina Flag Hosting video");
      setStage("error");
    };

    const handleVideoEnd = async () => {
      setStage("completed");
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const dh = params.get("dh");
      const h = params.get("h");

      let doctorData = await FetchDoctor(projectData, dh);
 
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (doctorData) {
        drawCertificate(doctorData?.data);
      } else {
        console.warn("Doctor data not ready yet, waiting...");
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

    let windowHeight = window.innerHeight;

    if (canvas && video && ctx && video.videoWidth && video.videoHeight) {

      const aspectRatio = video.videoWidth / video.videoHeight;
      const newHeight = windowHeight;
      const newWidth = newHeight * aspectRatio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.drawImage(video, 0, 0, newWidth, newHeight);

      const borderWidth = 1;
      ctx.fillStyle = "#008000";
      ctx.fillRect(0, 0, canvas.width, borderWidth);
      ctx.fillRect(0, canvas.height - borderWidth, canvas.width, borderWidth);
      ctx.fillRect(0, 0, borderWidth, canvas.height);
      ctx.fillRect(canvas.width - borderWidth, 0, borderWidth, canvas.height);

      const text = doctorData?.name || "";
      if (text) {
        const paddingX = 14;
        const paddingY = 10;
        const maxWidth = canvas.width * 0.55;
        let fontSize = 25; 

        ctx.font = `bold ${fontSize}px Arial`;

  
        while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
          fontSize -= 2;
          ctx.font = `bold ${fontSize}px Arial`;
        }

        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight =
          textMetrics.actualBoundingBoxAscent +
          textMetrics.actualBoundingBoxDescent;

        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = textHeight + paddingY * 2;

        const rightMargin = 30;
        const x = canvas.width - boxWidth - rightMargin;
        const y = 25;

        const radius = 10;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + boxWidth - radius, y);
        ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
        ctx.lineTo(x + boxWidth, y + boxHeight - radius);
        ctx.quadraticCurveTo(
          x + boxWidth,
          y + boxHeight,
          x + boxWidth - radius,
          y + boxHeight,
        );
        ctx.lineTo(x + radius, y + boxHeight);
        ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#1e573f";
        ctx.textBaseline = "alphabetic";
        const textX = x + paddingX;
        const textY = y + paddingY + textMetrics.actualBoundingBoxAscent;
        ctx.fillText(text, textX, textY);
      }
    }

    if (!video.paused && !video.ended) {
      animationRef.current = requestAnimationFrame(drawVideoFrame);
    }
  };

  const startVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    setStage("playing");

    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          drawVideoFrame();
        })
        .catch((error) => {
          video.muted = true;
          video.play().then(() => {
            drawVideoFrame();
          });
        });
    }

    setTimeout(() => {
      if (video && !video.ended) {
        video.pause();
        setStage("paused");
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    }, 7800);
  };

  const resumeVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    setStage("playing");

    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => drawVideoFrame()).catch(console.error);
    }
  };

  const drawCertificate = async (data) => {
  
    setCertificateLoading(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const bgImg = new Image();
    bgImg.src = "/game/Certificate-Shalina.png";
    await new Promise((resolve) => (bgImg.onload = resolve));

    let doctorImgUrl = null;
    if (data?.image) {
      try {
        const res = await fetch(data?.image, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Network response not ok");

        const blob = await res.blob();
        doctorImgUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.error("❌ Failed to fetch doctor image:", err);
      }
    }

    const doctorImg = new Image();
    doctorImg.crossOrigin = "anonymous";
    doctorImg.src = doctorImgUrl || "/game/Certificate-Shalina.png";
    await new Promise((resolve) => (doctorImg.onload = resolve));

    canvas.width = bgImg.width;
    canvas.height = bgImg.height;

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    const photoSize = 456;
    const photoX = 168;
    const photoY = 95;
    const radius = photoSize / 2;
    ctx.save();

    ctx.beginPath();
    ctx.arc(photoX + radius, photoY + radius, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(doctorImg, photoX, photoY, photoSize, photoSize);

    ctx.restore();

    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "#3d397b";
    ctx.textAlign = "center";
    ctx.fillText(data?.name || "Doctor Name", 1045,410);

    setCertificateLoading(false);
    setCertificateReady(true);

    if (doctorImgUrl) URL.revokeObjectURL(doctorImgUrl);
  };

  const downloadCertificate = async() => {
    setDownloadLaoding(true)
    const canvas = canvasRef.current;
    let downlaod = await Download(projectData,doctorHash,25,empHash)
   
    const link = document.createElement("a");
    link.download = "certificate.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloadLaoding(false)
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
              className="group cursor-pointer relative px-12 py-3 bg-green-600 text-white rounded-lg text-2xl text-center font-bold hover:bg-green-700 transition-all duration-300 shadow-2xl border-4 border-white transform hover:scale-105"
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
          <div className="flex items-center justify-center min-h-screen relative bg-green-700">
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
                className="px-8 cursor-pointer py-4 bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg border-2 border-white transform hover:scale-105"
              >
                Host Flag
              </button>
            </div>
          </div>
        );

      case "completed":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-green-100 p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full shadow-xl rounded-lg border-4 border-green-600"
            />

            {certificateLoading && (
              <div className="mt-6 text-green-700 font-semibold">
                Generating Certificate...
              </div>
            )}

            {!certificateLoading && certificateReady && (
              <button
                onClick={downloadCertificate}
                className="mt-6 px-8 py-4 cursor-pointer bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg border-2 border-white transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!certificateReady||downlaodLoading}
              >
                {downlaodLoading?"Downlaoding...":"Download Certificate"}
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full lg:max-w-3xl mx-auto h-screen overflow-hidden">
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        playsInline
        muted={false}
        preload="auto"
      />

      {renderContent()}
    </div>
  );
};

export default ShalinaNigeriaFlagHosting;
