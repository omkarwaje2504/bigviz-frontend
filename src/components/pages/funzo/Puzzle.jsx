"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion"; 

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
  const router = useRouter();

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const imagesData = [
    {
      src: `/game/puzzle/${projectId}/part1.png`,
      seq: 1,
      width: 548,
      height: 662,
    },
    {
      src: `/game/puzzle/${projectId}/part2.png`,
      seq: 2,
      width: 662,
      height: 662,
    },
    {
      src: `/game/puzzle/${projectId}/part3.png`,
      seq: 3,
      width: 548,
      height: 548,
    },
    {
      src: `/game/puzzle/${projectId}/part4.png`,
      seq: 4,
      width: 662,
      height: 548,
    },
  ];

  const virtualWidth = 1210;
  const virtualHeight = 1210;
  const overlap = 76.5;

  const parts = [
    {
      seq: 1,
      x: 0,
      y: 0,
      w: 548 + overlap,
      h: 662 + overlap,
      imgWidth: 548,
      imgHeight: 662,
    },
    {
      seq: 2,
      x: 548 - overlap,
      y: 0,
      w: 662 + overlap,
      h: 662 + overlap,
      imgWidth: 662,
      imgHeight: 662,
    },
    {
      seq: 3,
      x: 0,
      y: 662 - overlap,
      w: 548 + overlap,
      h: 548 + overlap,
      imgWidth: 548,
      imgHeight: 548,
    },
    {
      seq: 4,
      x: 548 - overlap,
      y: 662 - overlap,
      w: 662 + overlap,
      h: 548 + overlap,
      imgWidth: 662,
      imgHeight: 548,
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
      if (!canvas || !container) return; // safety check

      const maxWidth = window.innerWidth - 40;
      const maxHeight = window.innerHeight - 250;

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
      const imgs = await Promise.all(
        imagesData.map(
          (img) =>
            new Promise((resolve) => {
              const image = new Image();
              image.crossOrigin = "anonymous";
              image.onload = () => resolve(image);
              image.onerror = (err) => {
                console.error(`Failed to load image: ${img.src}`, err);
                resolve(null);
              };
              image.src = img.src;
            }),
        ),
      );
      setLoadedImages(imgs.filter(Boolean));
    };

    loadImages();
  }, [mounted]);

  useEffect(() => {
    if (loadedImages.length === 0) return;

    const shuffledIndexes = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const pos = shuffledIndexes.map((imgIndex) => {
      const imgData = imagesData[imgIndex];
      const x = Math.random() * (virtualWidth - imgData.width - overlap);
      const y = Math.random() * (virtualHeight - imgData.height - overlap);
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

    ctx.fillStyle = "#ffffffff";
    ctx.fillRect(0, 0, virtualWidth, virtualHeight);

    if (!complete) {
      ctx.strokeStyle = "rgba(63, 63, 63, 0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(548, 0);
      ctx.lineTo(548, virtualHeight);
      ctx.moveTo(0, 662);
      ctx.lineTo(virtualWidth, 662);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    positions.forEach(({ imgIndex, x, y, locked }) => {
      const img = loadedImages[imgIndex];
      if (!img) return;

      const imgData = imagesData[imgIndex];
      const drawWidth = imgData.width + overlap;
      const drawHeight = imgData.height + overlap;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      if (!locked) {
        ctx.fillStyle = "rgba(29, 29, 29, 0.85)";
        ctx.fillRect(x + 8, y + 8, 40, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px Arial";
        ctx.fillText(imagesData[imgIndex].seq, x + 20, y + 38);
      } else {
        ctx.fillStyle = "rgba(0, 255, 0, 0.15)";
        ctx.fillRect(x, y, 45, 45);
        ctx.fillStyle = "#00cc00";
        ctx.font = "bold 24px Arial";
        ctx.fillText("✓", x + 14, y + 32);
      }
    });
  }, [positions, loadedImages, complete, scale]);

  const shufflePositions = () => {
    setPositions((pos) =>
      pos.map((p) => {
        if (p.locked) return p;
        const imgData = imagesData[p.imgIndex];
        return {
          ...p,
          x: Math.random() * (virtualWidth - imgData.width - overlap),
          y: Math.random() * (virtualHeight - imgData.height - overlap),
        };
      }),
    );
    setComplete(false);
  };

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
      const drawWidth = imgData.width + overlap;
      const drawHeight = imgData.height + overlap;

      if (
        mouseX >= p.x &&
        mouseX <= p.x + drawWidth &&
        mouseY >= p.y &&
        mouseY <= p.y + drawHeight
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

        newX = Math.max(-overlap, Math.min(newX, virtualWidth - imgData.width));
        newY = Math.max(
          -overlap,
          Math.min(newY, virtualHeight - imgData.height),
        );

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
        const centerX = p.x + (imgData.width + overlap) / 2;
        const centerY = p.y + (imgData.height + overlap) / 2;

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
      congratsText: "Congratulations",
      congratsSentence:"We are honoring your role in safeguarding patients from GERD",
      goBackText: "Go Back",
      message: "All-round protection. Proven relief. One trusted choice.",
      packshot: `/game/puzzle/${projectId}/packet.webp`,
    },
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        textAlign: "center",
        padding: "0px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img src={tagline} className="w-60 mx-auto mb-1" />
      
      <div 
        ref={containerRef}
        className="relative"
        style={{
          perspective: "1000px",
          width: `${virtualWidth * scale}px`,
          height: `${virtualHeight * scale}px`,
        }}
      >
        <div 
          className={`relative w-full h-full transition-all duration-2000 ${
            isFlipping ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipping ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 2s",
          }}
        >
          {/* Front side - Puzzle */}
          <div 
            className="absolute w-full h-full backface-hidden"
            style={{
              backfaceVisibility: "hidden",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                border: "3px solid #333",
                cursor: dragging ? "grabbing" : "grab",
                display: "block",
                backgroundColor: "#0e0e0eff",
                maxWidth: "100%",
                height: "auto",
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
            className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              backgroundColor: "#58237b",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              padding: "24px",
            }}
          >
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-[#f39500] text-3xl text-center mb-5 font-bold">
                {cardTexts[projectId]?.message}
              </h1>
              <img
                src={cardTexts[projectId]?.packshot}
                alt="Prize Card"
                className="max-w-full max-h-[60vh]"
              />
            </div>
          </div>
        </div>
      </div>
      
      <img src={logo} className="w-60 mx-auto mt-1" />
     
      {showCongrats && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 bg-opacity-60 backdrop-blur-sm">
          <motion.div 
            className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-lg"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1], opacity: 1 }}
              transition={{ duration: 0.6, times: [0, 0.7, 1] }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-r from-[#58247b] to-[#46166a]">
                <span className="text-4xl">🎉</span>
              </div>
            </motion.div>
            
            <motion.h2 
              className="text-3xl font-bold bg-gradient-to-r from-[#58247b] to-[#f39500] text-transparent bg-clip-text mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {cardTexts[projectId]?.congratsText}
            </motion.h2>
            
            <motion.p 
              className="text-xl font-medium text-[#58247b] mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {cardTexts[projectId]?.congratsSentence}
            </motion.p>
           
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <button
                className="px-6 py-3 font-bold text-white bg-gradient-to-r from-[#00acdf] to-[#0096c2] text-lg rounded-lg cursor-pointer shadow-md hover:shadow-lg transform transition-transform hover:scale-105"
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
            numberOfPieces={300}
            gravity={0.3}
          />
        </div>
      )}
    </div>
  );
};

export default Puzzle;