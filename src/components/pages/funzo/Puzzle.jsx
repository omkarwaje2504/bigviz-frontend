"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";

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

  // Canvas and piece dimensions based on the grid
  const virtualWidth = 1107;
  const virtualHeight = 820;
  const pieceWidth = 369;
  const pieceHeight = 410;
  const overlap = 20; // No overlap for clean grid

  // Updated for 6 pieces (3x2 grid) - all pieces same size
  const imagesData = [
    { src: `/game/puzzle/${projectId}/part1.png`, seq: 1, width: pieceWidth + 113, height: pieceHeight },
    { src: `/game/puzzle/${projectId}/part2.png`, seq: 2, width: pieceWidth + 115, height: pieceHeight },
    { src: `/game/puzzle/${projectId}/part3.png`, seq: 3, width: pieceWidth, height: pieceHeight + 125 },
    { src: `/game/puzzle/${projectId}/part4.png`, seq: 4, width: pieceWidth, height: pieceHeight + 127 },
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

  // Define grid positions for 3x2 layout (uniform grid)
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

    // Shuffle all 6 pieces
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

    // Draw grid lines for 3x2 layout
    if (!complete) {
      ctx.strokeStyle = "rgba(63, 63, 63, 0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      // Vertical lines (2 lines for 3 columns)
      ctx.moveTo(369, 0);
      ctx.lineTo(369, virtualHeight);
      ctx.moveTo(738, 0);
      ctx.lineTo(738, virtualHeight);
      // Horizontal line (1 line for 2 rows)
      ctx.moveTo(0, 410);
      ctx.lineTo(virtualWidth, 410);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    positions.forEach(({ imgIndex, x, y, locked }) => {
      const img = loadedImages[imgIndex];
      if (!img) return;

      const imgData = imagesData[imgIndex];

      ctx.drawImage(img, x, y, imgData.width, imgData.height);

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
          x: Math.random() * (virtualWidth - imgData.width),
          y: Math.random() * (virtualHeight - imgData.height),
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
      congratsText: "Congratulations",
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
      <img src={tagline} className="w-60 mx-auto mb-1" alt="Tagline" />

      {/* Card flip container */}
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
          className={`relative w-full h-full transition-all duration-2000`}
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

          {/* Back side - Complete content */}
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

      <img src={logo} className="w-60 mx-auto mt-1" alt="Logo" />

      {showCongrats && (
        <div className="absolute px-4 inset-0 flex items-center justify-center z-50 bg-black/60">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-lg animate-fadeIn">
            <h2 className="text-3xl font-bold text-[#58247b] mb-4">
              🎉 {cardTexts[projectId]?.congratsText}
            </h2>
            <div>
              <button
                className="w-fit px-3 py-2 font-bold mx-auto text-white bg-[#00acdf] text-lg border rounded-lg cursor-pointer"
                onClick={() => router.push("homepage")}
              >
                {cardTexts[projectId]?.goBackText}
              </button>
            </div>
          </div>
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
