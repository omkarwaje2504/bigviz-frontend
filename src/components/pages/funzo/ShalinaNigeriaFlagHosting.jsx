"use client";
import React, { useState, useRef, useEffect } from "react";
import { FetchDoctor } from "../../../../actions/user";
import { Download } from "@actions/evideoApis";
import { useRouter } from "next/navigation";

const ShalinaNigeriaFlagHosting = ({ projectData, projectId, ui }) => {
  const [stage, setStage] = useState("loading");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [doctorHash, setDoctorHash] = useState(null);
  const [empHash, setEmpHash] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [certificateReady, setCertificateReady] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [downlaodLoading, setDownloadLaoding] = useState(false);
  const [videoSrc, setVideoSrc] = useState();
  const [showDoctorName, setShowDoctorName] = useState(true);
  const router = useRouter();
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
      if (!dh || !h) {
        router.push(`/${projectId}/homepage`);
      }

      setDoctorHash(dh);
      setEmpHash(h);
      try {
        let doctorData = await FetchDoctor(projectData, dh);

        if (doctorData) {
          const genderField = doctorData?.data?.fields?.find(
            (f) => f.value === "Male" || f.value === "Female",
          );
          if (genderField?.value === "Male") {
            setVideoSrc(`/game/flag/${projectId}/male-flag-hosting.mp4`);
          } else {
            setVideoSrc(`/game/flag/${projectId}/female-flag-hosting.mp4`);
          }
          setDoctorData(doctorData?.data);
        }
      } catch (error) {
        console.log(error);
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

    if (canvas && video && ctx && video.videoWidth && video.videoHeight) {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const newHeight = window.innerHeight;
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

      let nameEnd

      if(projectId==="mg2n7zq8"){
        nameEnd= 17
      }else{
        nameEnd= 18
      }
      // console.log(video.currentTime)
      if (showDoctorName && video.currentTime < nameEnd) {
        const text = doctorData?.name || "";
        if (text) {
          const paddingX = 10;
          const paddingY = 8;
          const maxWidth = canvas.width * 0.4; // max 50%
          let fontSize = 60;
          const minFontSize = 4;

          ctx.font = `bold ${fontSize - 7}px Arial`;
          while (
            ctx.measureText(text).width > maxWidth &&
            fontSize > minFontSize
          ) {
            fontSize -= 2;
            ctx.font = `bold ${fontSize}px Arial`;
          }

          if (ctx.measureText(text).width < maxWidth / 3 && fontSize < 30) {
            fontSize = 30;
            ctx.font = `bold ${fontSize}px Arial`;
          }

          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight =
            textMetrics.actualBoundingBoxAscent +
            textMetrics.actualBoundingBoxDescent;

          const boxWidth = textWidth + paddingX * 2;
          const boxHeight = textHeight + paddingY * 2;

          const rightMargin = 10;
          const x = canvas.width - boxWidth - rightMargin;
          const y = 15;
          const radius = 6;

          // Box
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

          // Text
          ctx.fillStyle = "#1e573f";
          ctx.textBaseline = "alphabetic";
          const textX = x + paddingX;
          const textY = y + paddingY + textMetrics.actualBoundingBoxAscent;
          ctx.fillText(text, textX, textY);
        }
      }
    }

    // Continue animating
    if (!video.paused && !video.ended) {
      animationRef.current = requestAnimationFrame(drawVideoFrame);
    }
  };

  const startVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    setStage("playing");
    setIsVideoLoaded(false);

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
    
    bgImg.src = `/game/flag/${projectId}/Certificate-Shalina.png`;
    await new Promise((resolve) => (bgImg.onload = resolve));

    let doctorImgUrl = null;

    if (data?.cropped_image) {
      try {
        const res = await fetch(data?.cropped_image, {
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

    // Doctor photo (circle crop, keep aspect ratio)
    const photoSize = 456;
    const photoX = 165;
    const photoY = 93;
    const radius = photoSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoX + radius, photoY + radius, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Keep aspect ratio crop
    let sx, sy, sSize;
    if (doctorImg.width > doctorImg.height) {
      sSize = doctorImg.height;
      sx = (doctorImg.width - sSize) / 2;
      sy = 0;
    } else {
      sSize = doctorImg.width;
      sx = 0;
      sy = (doctorImg.height - sSize) / 2;
    }
    ctx.drawImage(
      doctorImg,
      sx,
      sy,
      sSize,
      sSize,
      photoX,
      photoY,
      photoSize,
      photoSize,
    );
    ctx.restore();

    ctx.font = "bold 80px Arial";
    ctx.fillStyle = "#3d397b";
    ctx.textAlign = "left";

    const maxWidth = 1300;
    const lineHeight = 70;
    const startX = 700;
    const startY = 410;

    const name = data?.name || "Doctor Name";

    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      const words = text.split(" ");
      let line = "";
      const lines = [];

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), x, y + i * lineHeight);
      });
    };

    wrapText(name, startX, startY, maxWidth, lineHeight);

    setCertificateLoading(false);
    setCertificateReady(true);

    if (doctorImgUrl) URL.revokeObjectURL(doctorImgUrl);
  };

  const downloadCertificate = async () => {
    setDownloadLaoding(true);
    const canvas = canvasRef.current;
    let downlaod = await Download(projectData, doctorHash, 25, empHash);

    const link = document.createElement("a");
    link.download = "certificate.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloadLaoding(false);
  };

  const shareCertificate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not found!");
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob || blob.size === 0) {
        console.error(
          "❌ Blob is empty — check canvas drawing or CORS issues.",
        );
        alert("Certificate not ready to share. Please try again.");
        return;
      }

      const file = new File([blob], "certificate.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Shalina Certificate",
            text: "🎉 I just received my Shalina Certificate! #Shalina #Achievement",
          });
  
        } catch (err) {
          console.error("❌ Share failed:", err);
        }
      } else {
    
        const text = encodeURIComponent(
          "🎉 I just received my Shalina Certificate!\n\n#Shalina #Achievement",
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
      }
    }, "image/png");
  };

  const renderContent = () => {
    switch (stage) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#018652] p-4">
            <div className="h-full p-8 rounded-2xl shadow-2xl text-center bg-gradient-to-br from-white via-green-50/30 to-white max-w-md backdrop-blur-sm border border-green-100">
            
              {/* Enhanced Title with Animation */}
              <div className="space-y-4 ">
                <h2 className="text-2xl font-bold text-white mb-2 relative z-20">
                  <span className="inline-block">
                    Loading Flag Hosting Activity
                  </span>

                  {/* Animated Underline */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse w-3/4"></div>
                </h2>

                {/* Animated Dots */}
                <div className="flex justify-center items-center space-x-2 text-green-600">
                  <span className="text-lg font-medium z-20 text-white">
                    Preparing experience
                  </span>
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{
                          animationDelay: `${index * 0.3}s`,
                          animationDuration: "1.2s",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress Bar Animation */}
                <div className="w-full bg-green-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full progress-bar"></div>
                </div>
              </div>

              {/* Floating Particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="absolute w-1 h-1 bg-green-300 rounded-full animate-float opacity-40"
                    style={{
                      left: `${20 + index * 12}%`,
                      top: `${20 + (index % 3) * 25}%`,
                      animationDelay: `${index * 0.8}s`,
                      animationDuration: `${3 + index * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <style jsx>{`
              /* Progress Bar Animation */
              .progress-bar {
                animation: progressLoad 2.5s ease-in-out infinite;
                transform-origin: left center;
              }

              @keyframes progressLoad {
                0% {
                  transform: scaleX(0);
                }
                50% {
                  transform: scaleX(0.7);
                }
                100% {
                  transform: scaleX(0);
                }
              }

              /* Floating Particles */
              .animate-float {
                animation: float ease-in-out infinite;
              }

              @keyframes float {
                0%,
                100% {
                  transform: translateY(0px) translateX(0px);
                  opacity: 0.2;
                }
                25% {
                  transform: translateY(-10px) translateX(5px);
                  opacity: 0.6;
                }
                50% {
                  transform: translateY(-20px) translateX(-3px);
                  opacity: 0.8;
                }
                75% {
                  transform: translateY(-15px) translateX(8px);
                  opacity: 0.4;
                }
              }

              /* Enhanced Shadow Effects */
              .shadow-2xl {
                box-shadow:
                  0 25px 50px -12px rgba(0, 0, 0, 0.1),
                  0 0 30px rgba(1, 134, 82, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6);
              }

              /* Responsive Adjustments */
              @media (max-width: 768px) {
                .progress-bar {
                  animation-duration: 2s;
                }

                .animate-float {
                  animation-duration: 2s;
                }
              }
            `}</style>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-600 via-white to-red-600">
            <div className="bg-[#018652] p-8 rounded-lg shadow-2xl text-center border-4 border-red-600 max-w-md">
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
          <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#018652] p-3">
            <div className="max-w-3xl bg-white w-full h-[100dvh] flex items-center justify-center p-3">
              <button
                onClick={startVideo}
                className="group relative overflow-hidden px-3 py-5 bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white rounded-2xl text-2xl font-bold transition-all duration-500 shadow-2xl border-2 border-green-400 transform hover:scale-105 hover:shadow-3xl"
              >
             
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                {/* Spark Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {[...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="spark absolute w-1 h-1 bg-yellow-300 rounded-full"
                      style={{
                        left: `${20 + index * 12}%`,
                        top: `${30 + (index % 2) * 40}%`,
                        animationDelay: `${index * 150}ms`,
                      }}
                    />
                  ))}
                </div>

                {/* Button Content */}
                <span className="relative z-10 flex items-center justify-center gap-4 font-extrabold tracking-wide">
                  {/* Animated Play Icon */}
                  Click here to Start Flag Hosting Celebration
                  {/* Animated Arrow */}
                </span>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 -z-10"></div>

                {/* Corner Highlights */}
                {/* <div className="absolute top-2 left-2 w-2 h-2 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300"></div> */}
              </button>

              <style jsx>{`
                /* Spark Animation */
                .spark {
                  animation: sparkle 2s infinite ease-in-out;
                }

                @keyframes sparkle {
                  0%,
                  100% {
                    opacity: 0;
                    transform: translateY(0px) scale(0);
                  }
                  25% {
                    opacity: 1;
                    transform: translateY(-10px) scale(1);
                  }
                  50% {
                    opacity: 1;
                    transform: translateY(-20px) scale(1.2);
                  }
                  75% {
                    opacity: 0.5;
                    transform: translateY(-30px) scale(0.8);
                  }
                }

               
                /* Enhanced Shadow */
                .group:hover {
                  box-shadow:
                    0 25px 50px rgba(34, 197, 94, 0.4),
                    0 0 30px rgba(34, 197, 94, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }

                /* Responsive Adjustments */
                @media (max-width: 768px) {
                  .spark {
                    animation-duration: 1.5s;
                  }
                }
              `}</style>
            </div>
          </div>
        );

      case "playing":
        return (
          <div className="flex justify-center min-h-[100dvh] relative bg-white w-full lg:max-w-3xl mx-auto">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          </div>
        );

      // case "paused":
      //   return (
      //     <div className="flex justify-center min-h-[100dvh] relative bg-white w-full lg:max-w-3xl mx-auto">
      //       <canvas
      //         ref={canvasRef}
      //         className="max-w-full max-h-full object-contain shadow-2xl"
      //       />

      //       <div className="absolute inset-0 flex items-center justify-center">
      //         <button
      //           onClick={resumeVideo}
      //           className="px-8 cursor-pointer py-4 bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg border-2 border-white transform hover:scale-105"
      //         >
      //           Host Flag
      //         </button>
      //       </div>
      //     </div>
      //   );

      case "completed":
        return (
          <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-white p-4 max-w-3xl mx-auto">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full shadow-xl rounded-lg "
            />

            {certificateLoading && (
              <div className="mt-6 text-green-700 font-semibold">
                Generating Certificate...
              </div>
            )}

            {!certificateLoading && certificateReady && (
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={downloadCertificate}
                  className="px-8 py-4 cursor-pointer bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg border-2 border-white transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!certificateReady || downlaodLoading}
                >
                  {downlaodLoading ? "Downloading..." : "Download Certificate"}
                </button>
                <button
                  onClick={shareCertificate}
                  className="px-8 py-4 cursor-pointer bg-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-700 transition-all duration-300 shadow-lg border-2 border-white transform hover:scale-105"
                >
                  Share on WhatsApp
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full mx-auto h-[100dvh] overflow-hidden bg-[#018652]">
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
