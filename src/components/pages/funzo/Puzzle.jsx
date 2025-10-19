"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

const Puzzle = ({ projectData, projectId, ui }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [loadedImages, setLoadedImages] = useState([]);
  const [complete, setComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [scale, setScale] = useState(1);
  const [showCongrats, setShowCongrats] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const router = useRouter();

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent scroll on touch devices during drag
  useEffect(() => {
    const preventDefault = (e) => {
      if (dragging) {
        e.preventDefault();
      }
    };

    const preventDefaultPassive = (e) => {
      if (dragging) {
        e.preventDefault();
      }
    };

    if (dragging) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = "0";
      document.addEventListener("touchmove", preventDefault, {
        passive: false,
      });
      document.addEventListener("gesturestart", preventDefaultPassive);
      document.addEventListener("gesturechange", preventDefaultPassive);
      document.addEventListener("gestureend", preventDefaultPassive);
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      document.removeEventListener("touchmove", preventDefault);
      document.removeEventListener("gesturestart", preventDefaultPassive);
      document.removeEventListener("gesturechange", preventDefaultPassive);
      document.removeEventListener("gestureend", preventDefaultPassive);
    };
  }, [dragging]);

  const virtualWidth = 1107;
  const virtualHeight = 820;
  const pieceWidth = 369;
  const pieceHeight = 410;
  const overlap = 20;

  const imagesData = [
    {
      src: `/game/puzzle/${projectId}/part1.png`,
      seq: 1,
      width: pieceWidth + 113,
      height: pieceHeight,
    },
    {
      src: `/game/puzzle/${projectId}/part2.png`,
      seq: 2,
      width: pieceWidth + 115,
      height: pieceHeight,
    },
    {
      src: `/game/puzzle/${projectId}/part3.png`,
      seq: 3,
      width: pieceWidth,
      height: pieceHeight + 125,
    },
    {
      src: `/game/puzzle/${projectId}/part4.png`,
      seq: 4,
      width: pieceWidth,
      height: pieceHeight + 127,
    },
    {
      src: `/game/puzzle/${projectId}/part5.png`,
      seq: 5,
      width: pieceWidth + 115,
      height: pieceHeight + 127,
    },
    {
      src: `/game/puzzle/${projectId}/part6.png`,
      seq: 6,
      width: pieceWidth + 115,
      height: pieceHeight + 2,
    },
  ];

  const parts = [
    {
      seq: 1,
      x: 0,
      y: 0,
      w: pieceWidth,
      h: pieceHeight,
      imgWidth: pieceWidth,
      imgHeight: pieceHeight,
    },
    {
      seq: 2,
      x: 369,
      y: 0,
      w: pieceWidth,
      h: pieceHeight,
      imgWidth: pieceWidth,
      imgHeight: pieceHeight,
    },
    {
      seq: 3,
      x: 738,
      y: 0,
      w: pieceWidth,
      h: pieceHeight,
      imgWidth: pieceWidth,
      imgHeight: pieceHeight,
    },
    {
      seq: 4,
      x: 0,
      y: 410 - 127,
      w: pieceWidth,
      h: pieceHeight,
      imgWidth: pieceWidth,
      imgHeight: pieceHeight,
    },
    {
      seq: 5,
      x: 369 - 115,
      y: 410 - 127,
      w: pieceWidth,
      h: pieceHeight,
      imgWidth: pieceWidth,
      imgHeight: pieceHeight,
    },
    {
      seq: 6,
      x: 738 - 115,
      y: 410 - 3,
      w: pieceWidth,
      h: pieceHeight,
      imgWidth: pieceWidth,
      imgHeight: pieceHeight,
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Responsive calculations based on device size
      const isSmallMobile = window.innerWidth < 480;
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      const isLaptop = window.innerWidth >= 1024 && window.innerWidth < 1440;
      const isLargeScreen = window.innerWidth >= 1440;

      let maxWidth, maxHeight;

      if (isSmallMobile) {
        maxWidth = window.innerWidth - 20;
        maxHeight = window.innerHeight - 200;
      } else if (isMobile) {
        maxWidth = window.innerWidth - 30;
        maxHeight = window.innerHeight - 220;
      } else if (isTablet) {
        maxWidth = window.innerWidth - 60;
        maxHeight = window.innerHeight - 240;
      } else if (isLaptop) {
        maxWidth = window.innerWidth - 80;
        maxHeight = window.innerHeight - 250;
      } else {
        maxWidth = window.innerWidth - 100;
        maxHeight = window.innerHeight - 280;
      }

      const scaleX = maxWidth / virtualWidth;
      const scaleY = maxHeight / virtualHeight;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale);

      const displayWidth = virtualWidth * newScale;
      const displayHeight = virtualHeight * newScale;

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = virtualWidth * dpr;
      canvas.height = virtualHeight * dpr;

      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
    };

    if (canvasRef.current && containerRef.current) {
      handleResize();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted, virtualWidth, virtualHeight]);

  useEffect(() => {
    if (!mounted) return;

    const loadImages = async () => {
      setIsLoading(true);
      const totalImages = imagesData.length + 3;
      let loaded = 0;

      const updateProgress = () => {
        loaded++;
        setLoadProgress(Math.round((loaded / totalImages) * 100));
      };

      const imgs = await Promise.all(
        imagesData.map(
          (img) =>
            new Promise((resolve) => {
              const image = new Image();
              image.crossOrigin = "anonymous";
              image.onload = () => {
                updateProgress();
                resolve(image);
              };
              image.onerror = (err) => {
                console.error(`Failed to load image: ${img.src}`, err);
                updateProgress();
                resolve(null);
              };
              image.src = img.src;
            }),
        ),
      );

      const additionalImages = [
        `/game/puzzle/${projectId}/tagline.webp`,
        `/game/puzzle/${projectId}/logo.webp`,
        `/game/puzzle/${projectId}/packet.webp`,
      ];

      await Promise.all(
        additionalImages.map(
          (src) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                updateProgress();
                resolve();
              };
              img.onerror = () => {
                updateProgress();
                resolve();
              };
              img.src = src;
            }),
        ),
      );

      setLoadedImages(imgs.filter(Boolean));
      setTimeout(() => setIsLoading(false), 500);
    };

    loadImages();
  }, [mounted, projectId]);

  useEffect(() => {
    if (loadedImages.length === 0) return;

    const shuffledIndexes = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    const pos = shuffledIndexes.map((imgIndex) => {
      const imgData = imagesData[imgIndex];
      const x = Math.random() * (virtualWidth - imgData.width);
      const y = Math.random() * (virtualHeight - imgData.height);
      return { imgIndex, x, y, locked: false };
    });
    setPositions(pos);

    setComplete(false);
  }, [loadedImages]);

  useEffect(() => {
    if (
      !canvasRef.current ||
      positions.length === 0 ||
      loadedImages.length === 0
    )
      return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, virtualWidth, virtualHeight);

    ctx.fillStyle = "#7c5498";
    ctx.fillRect(0, 0, virtualWidth, virtualHeight);

    if (!complete) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(369, 0);
      ctx.lineTo(369, virtualHeight);
      ctx.moveTo(738, 0);
      ctx.lineTo(738, virtualHeight);
      ctx.moveTo(0, 410);
      ctx.lineTo(virtualWidth, 410);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    positions.forEach(({ imgIndex, x, y, locked }) => {
      const img = loadedImages[imgIndex];
      if (!img) return;

      const imgData = imagesData[imgIndex];

      if (!locked) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
      }

      ctx.drawImage(img, x, y, imgData.width, imgData.height);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (!locked) {
        const gradient = ctx.createLinearGradient(x + 8, y + 8, x + 48, y + 48);
        gradient.addColorStop(0, "#58247b");
        gradient.addColorStop(1, "#3d1858");

        ctx.fillStyle = gradient;
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, 40, 40, 8);
        ctx.fill();

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(imagesData[imgIndex].seq, x + 28, y + 28);
      } else {
        const gradient = ctx.createLinearGradient(x, y, x + 45, y + 45);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.25)");
        gradient.addColorStop(1, "rgba(22, 163, 74, 0.25)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, 50, 50, 8);
        ctx.fill();

        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✓", x + 25, y + 25);
      }
    });
  }, [positions, loadedImages, complete, scale]);

  useEffect(() => {
    if (positions.length === 0) return;
    const allLocked = positions.every((p) => p.locked);
    if (allLocked) {
      setTimeout(() => {
        setIsFlipping(true);
        setTimeout(() => {
          setComplete(true);
          setTimeout(() => {
            setShowCongrats(true);
          }, 5000);
        }, 5000);
      }, 2000);
    }
  }, [positions]);

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) / scale;
    const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) / scale;
    return { x, y };
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (complete || isFlipping) return;

    const { x: mouseX, y: mouseY } = getCanvasCoords(e);

    for (let i = positions.length - 1; i >= 0; i--) {
      const p = positions[i];
      if (p.locked) continue;

      const imgData = imagesData[p.imgIndex];

      if (
        mouseX >= p.x &&
        mouseX <= p.x + imgData.width &&
        mouseY >= p.y &&
        mouseY <= p.y + imgData.height
      ) {
        setPositions((prev) => {
          const newPos = [...prev];
          const [item] = newPos.splice(i, 1);
          newPos.push(item);
          return newPos;
        });

        setDragging({
          index: positions.length - 1,
          offsetX: mouseX - p.x,
          offsetY: mouseY - p.y,
        });
        break;
      }
    }
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (!dragging) return;

    const { x: mouseX, y: mouseY } = getCanvasCoords(e);

    setPositions((prev) =>
      prev.map((p, idx) => {
        if (idx !== dragging.index) return p;

        const imgData = imagesData[p.imgIndex];
        let newX = mouseX - dragging.offsetX;
        let newY = mouseY - dragging.offsetY;

        newX = Math.max(0, Math.min(newX, virtualWidth - imgData.width));
        newY = Math.max(0, Math.min(newY, virtualHeight - imgData.height));

        return { ...p, x: newX, y: newY };
      }),
    );
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (!dragging) return;

    setPositions((prev) =>
      prev.map((p, idx) => {
        if (idx !== dragging.index) return p;

        const imgData = imagesData[p.imgIndex];
        const centerX = p.x + imgData.width / 2;
        const centerY = p.y + imgData.height / 2;

        const part = parts.find(
          (part) =>
            imagesData[p.imgIndex].seq === part.seq &&
            centerX >= part.x &&
            centerX < part.x + part.w &&
            centerY >= part.y &&
            centerY < part.y + part.h,
        );

        if (part) {
          return { ...p, x: part.x, y: part.y, locked: true };
        }

        return p;
      }),
    );

    setDragging(null);
  };

  const tagline = `/game/puzzle/${projectId}/tagline.webp`;
  const logo = `/game/puzzle/${projectId}/logo.webp`;

  const cardTexts = {
    "puzzle-nigeria": {
      congratsText: "Congratulations!!",
      congratsSentence:
        "We are honoring your role in safeguarding patients from GERD",
      goBackText: "Go Back",
      message: "All-round protection. Proven relief. One trusted choice.",
      packshot: `/game/puzzle/${projectId}/packet.webp`,
    },
    "puzzle-french": {
      congratsText: "Félicitations!!",
      congratsSentence:
        "Honorer votre rôle dans la protection des patients contre le RGO",
      goBackText: "Retour",
      message:
        "Protection complète. Soulagement prouvé. Un choix de confiance.",
      packshot: `/game/puzzle/${projectId}/packet.webp`,
    },
    "puzzle-portuguese": {
      congratsText: "Parabéns!!",
      congratsSentence:
        "Estamos honrando seu papel na proteção de pacientes contra DRGE",
      goBackText: "Voltar",
      message:
        "Proteção completa. Alívio comprovado. Uma escolha de confiança.",
      packshot: `/game/puzzle/${projectId}/packet.webp`,
    },
  };

  if (!mounted) return null;

  return (
    <div className="bg-purple-200 min-h-screen">
      <div
        className="flex flex-col items-center justify-center px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10"
        style={{
          textAlign: "center",
          minHeight: "100vh",
          touchAction: "none",
          overscrollBehavior: "none",
          overflow: "hidden",
        }}
      >
        {/* Loading Screen */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#58247b] via-[#7c5498] to-[#58247b]"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center px-4 sm:px-6"
              >
                <div className="mb-6 sm:mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto border-4 border-white/30 border-t-white rounded-full"
                  />
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                  Loading Puzzle...
                </h2>

                <div className="w-48 sm:w-56 md:w-64 lg:w-80 h-2.5 sm:h-3 md:h-4 bg-white/20 rounded-full overflow-hidden mx-auto">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#f39500] to-[#00acdf] rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${loadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <p className="text-white/80 mt-2 sm:mt-3 text-base sm:text-lg md:text-xl font-medium">
                  {loadProgress}%
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.img
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? -20 : 0 }}
          transition={{ duration: 0.6 }}
          src={tagline}
          className="w-32 sm:w-40 md:w-48 lg:w-56 xl:w-64 mx-auto mb-1 sm:mb-2 md:mb-3"
          alt="Tagline"
          style={{ visibility: isLoading ? "hidden" : "visible" }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isLoading ? 0 : 1, scale: isLoading ? 0.95 : 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          ref={containerRef}
          className="relative my-1 sm:my-2 md:my-3"
          style={{
            perspective: "1000px",
            width: `${virtualWidth * scale}px`,
            height: `${virtualHeight * scale}px`,
            visibility: isLoading ? "hidden" : "visible",
          }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipping ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 2s",
            }}
          >
            <div
              className="absolute w-full h-full"
              style={{
                backfaceVisibility: "hidden",
              }}
            >
              <canvas
                ref={canvasRef}
                className="rounded-lg sm:rounded-xl shadow-2xl"
                style={{
                  border: "2px solid #333",
                  cursor: dragging ? "grabbing" : "grab",
                  display: "block",
                  backgroundColor: "#ffffff",
                  maxWidth: "100%",
                  height: "auto",
                  touchAction: "none",
                }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              />
            </div>

            <div
              className="absolute w-full h-full flex items-center justify-center rounded-lg sm:rounded-xl shadow-2xl"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "linear-gradient(135deg, #58237b 0%, #7c5498 100%)",
                padding: "12px",
              }}
            >
              <div className="flex flex-col items-center justify-center px-2">
                <h1 className="text-[#f39500] text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-center mb-2 sm:mb-3 md:mb-4 font-bold drop-shadow-lg leading-tight">
                  {cardTexts[projectId]?.message}
                </h1>
                <img
                  src={cardTexts[projectId]?.packshot}
                  alt="Prize Card"
                  className="max-w-full max-h-[40vh] sm:max-h-[45vh] md:max-h-[50vh] lg:max-h-[55vh] xl:max-h-[60vh] drop-shadow-2xl object-contain"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.img
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 20 : 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          src={logo}
          className="w-32 sm:w-40 md:w-48 lg:w-56 xl:w-64 mx-auto mt-1 sm:mt-2 md:mt-3"
          alt="Logo"
          style={{ visibility: isLoading ? "hidden" : "visible" }}
        />
      </div>

      {showCongrats && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-3 sm:p-4 md:p-6">
          <motion.div
            className="bg-white p-4 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-2xl text-center max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl w-full mx-3 sm:mx-4"
            initial={{ opacity: 0, scale: 0.7, rotateY: -180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: "spring", damping: 12 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1], opacity: 1 }}
              transition={{ duration: 0.6, times: [0, 0.7, 1] }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center bg-gradient-to-r from-[#58247b] to-[#46166a] shadow-lg">
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                  🎉
                </span>
              </div>
            </motion.div>

            <motion.h2
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#58247b] to-[#f39500] text-transparent bg-clip-text mb-2 sm:mb-3 md:mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {cardTexts[projectId]?.congratsText}
            </motion.h2>

            <motion.p
              className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-[#58247b] mb-4 sm:mb-5 md:mb-6 px-1 sm:px-2 leading-snug"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {cardTexts[projectId]?.congratsSentence}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <button
                className="px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-2.5 md:py-3 font-bold text-white bg-gradient-to-r from-[#00acdf] to-[#0096c2] text-sm sm:text-base md:text-lg lg:text-xl rounded-lg cursor-pointer shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95"
                onClick={() => router.push("homepage")}
              >
                {cardTexts[projectId]?.goBackText}
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}

      {showCongrats && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={window.innerWidth < 768 ? 200 : 300}
            gravity={0.3}
            colors={["#58247b", "#f39500", "#00acdf", "#22c55e", "#FFD700"]}
          />
        </div>
      )}
    </div>
  );
};

export default Puzzle;