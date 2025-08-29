"use client";
import { Application, extend } from "@pixi/react";
import { useRouter } from "next/navigation";
import { Sprite, AnimatedSprite, Assets } from "pixi.js";
import { useEffect, useState, useRef, useCallback } from "react";
import Confetti from "react-confetti";
import { FaSpinner } from "react-icons/fa";
import { convertOffsetToTimes, motion } from "framer-motion";
import { DecryptData, EncryptData } from "@utils/cryptoUtils";
import { SaveDoctors } from "@actions/user";
import { IoChatboxOutline } from "react-icons/io5";
import { MdCelebration } from "react-icons/md";

extend({ Sprite, AnimatedSprite });

const assetCache = {
  doctorFrames: null,
  patientFrames: null,
  bgTexture: null,
  scratchImage: null,
  isLoaded: false,
};

function ScratchCard({ projectData, projectId, ui }) {
  const [startTime] = useState(Date.now());
  const [doctorFrames, setDoctorFrames] = useState([]);
  const [patientFrames, setPatientFrames] = useState([]);
  const [bgTexture, setBgTexture] = useState(null);
  const [scratchImage, setScratchImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pixiReady, setPixiReady] = useState(false);

  const [messages, setMessages] = useState([]);
  const [isPatientPlaying, setIsPatientPlaying] = useState(false);
  const [isDoctorPlaying, setIsDoctorPlaying] = useState(false);

  const [showScratchCard, setShowScratchCard] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [autoRevealed, setAutoRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPackshot, setShowPackshot] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showFront, setShowFront] = useState(false);
  const router = useRouter();

  const scratchSoundRef = useRef(null);
  const confettiSoundRef = useRef(null);
  const audioRefs = useRef([]);

  const doctorRef = useRef(null);
  const patientRef = useRef(null);
  const chatEndRef = useRef(null);
  const scratchCanvasRef = useRef(null);

  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 400,
    height: 600,
  });

  const [breakpoint, setBreakpoint] = useState("md");

  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== "undefined") {
        setCanvasDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        setBreakpoint(window.innerWidth < 768 ? "sm" : "md");
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const cardFrontMap = {
    "scratch-card-zambia": {
      title: (
        <>
          Decode the vaginal care
          <br />
          <span className="text-yellow-200">with Gogynax</span>
        </>
      ),
      tagline: "Restores comfort and confidence",
      info: (
        <>
          <span className="font-medium text-[#ec008c] text-2xl">
            Clotrimazole
          </span>{" "}
          — A trusted antifungal,
          <br />
          offers relief, right where it's needed
        </>
      ),
      packshot: "/packet.webp",
      gradientFrom: "#ec008c",
      gradientTo: "#b1087b",
    },
    "scratch-card-portuguese": {
      title: (
        <>
          Descubra os cuidados vaginais com Gogynax Trio
          <br />
          {/* <span className="text-yellow-200">with Gogynax</span> */}
        </>
      ),
      tagline: "Rápido, simples, eficaz – sem testes, apenas tratamento",
      info: (
        <>
          <span className="font-medium text-[#ec008c] text-2xl">
            A terapêutica tripla 
          </span>{" "}
          — Clotrimazol + Metronidazol + Clindamicina 
          <br />
           — oferece uma cobertura abrangente para infeções vaginais mistas
        </>
      ),
      packshot: "/packet.webp",
      gradientFrom: "#ec008c",
      gradientTo: "#b1087b",
    },
    "scratch-card-french": {
      title: (
        <>
         Décoder les soins vaginaux avec Azimyn FS kit
          <br />
          {/* <span className="text-yellow-200">with Gogynax</span> */}
        </>
      ),
      tagline: "Traitez les deux, prévenez les récidives - rapide, simple et sans dérangement",
      info: (
        <>
          <span className="font-medium text-[#ec008c] text-2xl">
            La trithérapie:   
          </span>{" "}
          Azithromycine + Secnidazole + Fluconazole - 
          <br />
          offre une couverture complète en une seule dose.
        </>
      ),
      packshot: "/packet.webp",
      gradientFrom: "#ec008c",
      gradientTo: "#b1087b",
    },
  };

  const conversationMap = {
    "scratch-card-zambia": [
      {
        id: 1,
        sender: "patient",
        text: "There's thick white discharge again… is it infection?",
        audioFile: "/sounds/patient1.m4a",
      },
      {
        id: 2,
        sender: "doctor",
        text: "Yes, typical of vaginal candidiasis",
        audioFile: "/sounds/doctor1.m4a",
      },
      {
        id: 3,
        sender: "doctor",
        text: "I'll prescribe an antifungal treatment for you. Guess which",
        audioFile: "/sounds/doctor2.m4a",
      },
    ],
     "scratch-card-french": [
      {
        id: 1,
        sender: "patient",
        text: "Docteur, mes symptômes reviennent toujours même après le traitement",
        audioFile: "/sounds/patient1.m4a",
      },
      {
        id: 2,
        sender: "doctor",
        text: "Une réinfection peut se produire si les deux partenaires ne sont pas traités",
        audioFile: "/sounds/doctor1.m4a",
      },
      {
        id: 3,
        sender: "doctor",
        text: "I'll prescribe an antifungal treatment for you. Guess which",
        audioFile: "/sounds/doctor2.m4a",
      },
    ],
    "scratch-card-portuguese": [
      {
        id: 1,
        sender: "patient",
        text: "Continuo com corrimento e desconforto mesmo após o tratamento.",
        audioFile: "/sounds/patient1.m4a",
      },
      {
        id: 2,
        sender: "doctor",
        text: "A terapia para um único agente patogénico pode não ser suficiente... O meu tratamento abrange fungos, bactérias e protozoários? ",
        audioFile: "/sounds/doctor1.m4a",
      },
      {
        id: 3,
        sender: "doctor",
        text: "I'll prescribe an antifungal treatment for you. Guess which",
        audioFile: "/sounds/doctor2.m4a",
      },
    ],
  };

  const getAudioDuration = (audioFile) => {
    return new Promise((resolve) => {
      const audio = new Audio(audioFile);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration * 1000);
      });
      audio.addEventListener("error", () => {
        resolve(3000);
      });
    });
  };

  useEffect(() => {
    const initializeAudio = () => {
      try {
        scratchSoundRef.current = new Audio("/sounds/scratch.m4a");
        scratchSoundRef.current.loop = true;
        scratchSoundRef.current.volume = 0.4;

        confettiSoundRef.current = new Audio("/sounds/confetti.mp3");
        confettiSoundRef.current.volume = 0.7;

        const conversations = conversationMap[projectData?.project_hash] || [];
        audioRefs.current = conversations.map((conv) => {
          const audio = new Audio(conv.audioFile);
          audio.volume = 0.8;
          return audio;
        });
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    };

    if (projectData?.project_hash) {
      initializeAudio();
    }
  }, [projectData?.project_hash]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        if (assetCache.isLoaded) {
          setDoctorFrames([...assetCache.doctorFrames]);
          setPatientFrames([...assetCache.patientFrames]);
          setBgTexture(assetCache.bgTexture);
          setScratchImage(assetCache.scratchImage);
          setLoading(false);
          setPixiReady(true);
          return;
        }

        const bgTexture = await Assets.load("/bg.jpg");

        setBgTexture(bgTexture);

        const scratchImg = await Assets.load("/scratch-card.png");
        setScratchImage(scratchImg);

        const doctorUrls = Array.from(
          { length: 52 },
          (_, i) => `/doctor/doctor${String(i).padStart(2, "0")}.webp`,
        );
        const patientUrls = Array.from(
          { length: 52 },
          (_, i) => `/patient/patient${String(i).padStart(2, "0")}.webp`,
        );

        const [doctorLoaded, patientLoaded] = await Promise.all([
          Promise.all(doctorUrls.map((url) => Assets.load(url))),
          Promise.all(patientUrls.map((url) => Assets.load(url))),
        ]);

        assetCache.doctorFrames = doctorLoaded;
        assetCache.patientFrames = patientLoaded;
        assetCache.bgTexture = bgTexture;
        assetCache.scratchImage = scratchImg;
        assetCache.isLoaded = true;

        setDoctorFrames([...doctorLoaded]);
        setPatientFrames([...patientLoaded]);

        setLoading(false);

        setTimeout(() => {
          setPixiReady(true);
        }, 100);
      } catch (error) {
        console.error("Error loading assets:", error);
        setLoading(false);
        setPixiReady(true);
      }
    };

    loadAssets();
  }, []);

  const playConversationSequence = useCallback(async () => {
    const conversations = conversationMap[projectData?.project_hash] || [];

    if (!conversations.length) {
      console.log("No conversations found");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      setMessages((prev) => [conv]);

      const audio = audioRefs.current[i];
      // console.log(conv)
      if (conv.sender === "patient") {
        setIsPatientPlaying(true);
        if (patientRef.current) {
          patientRef.current.gotoAndStop(0); 
          patientRef.current.gotoAndPlay(0); 
        }
      } else {
        // console.log("playing")
        setIsDoctorPlaying(true);
        if (doctorRef.current) {
          doctorRef.current.gotoAndStop(0); 
          doctorRef.current.gotoAndPlay(0); 
        }
      }

      if (audio) {
        try {
          audio.currentTime = 0;
          await audio.play();
        } catch (err) {
          console.log("Audio play failed:", err);
        }
      }

      const duration = await getAudioDuration(conv.audioFile);
      await new Promise((res) => setTimeout(res, duration));

      if (conv.sender === "patient") {
        setIsPatientPlaying(false);
        if (patientRef.current) patientRef.current.gotoAndStop(0);
      } else {
        if(conv.id===4){
          setIsDoctorPlaying(false);
          if (doctorRef.current) doctorRef.current.gotoAndStop(0);
        }else{
          setIsDoctorPlaying(true);
        }
      }

      if (audio) audio.pause();

      await new Promise((res) => setTimeout(res, 500));
    }

    setConversationComplete(true);
    setTimeout(() => setShowScratchCard(true), 1000);
  }, [projectData?.project_hash]);

  useEffect(() => {
    if (
      pixiReady &&
      doctorFrames.length > 0 &&
      patientFrames.length > 0 &&
      projectData?.project_hash &&
      !conversationComplete &&
      !loading
    ) {
      playConversationSequence();
    }
  }, [
    pixiReady,
    doctorFrames,
    patientFrames,
    projectData?.project_hash,
    conversationComplete,
    loading,
    playConversationSequence,
  ]);

  useEffect(() => {
    if (showScratchCard) {
      const timer = setTimeout(() => setShowFront(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [showScratchCard]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showConfetti && confettiSoundRef.current) {
      confettiSoundRef.current.currentTime = 0;
      confettiSoundRef.current.play().catch(() => {});
    }
  }, [showConfetti]);

  const getEventPosition = (e, rect) => {
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  let lastPoint = null;

  const handleScratch = (e) => {
    if (!showScratchCard || autoRevealed) return;

    if (scratchSoundRef.current && scratchSoundRef.current.paused) {
      scratchSoundRef.current.play().catch(() => {});
    }

    const canvas = scratchCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getEventPosition(e, rect);

    const isMobile = window.innerWidth < 768;
    const SCRATCH_RADIUS = isMobile ? 40 : 60;

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = SCRATCH_RADIUS * 2;

    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, SCRATCH_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    }

    lastPoint = { x, y };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const progress = transparent / (pixels.length / 4);
    setScratchProgress(progress);

    if (progress > 0.8 && !autoRevealed) {
      setAutoRevealed(true);
      setScratchProgress(1);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setShowConfetti(true);
      setTimeout(() => setShowCertificate(true), 10000);
    }
  };

  const handleTouchStart = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    handleScratch(e.touches[0]);
  };

  const handleScratchEnd = () => {
    if (scratchSoundRef.current) {
      scratchSoundRef.current.pause();
      scratchSoundRef.current.currentTime = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    handleScratch(e.touches[0]);
  };

  useEffect(() => {
    if (showScratchCard && scratchCanvasRef.current && scratchImage) {
      const canvas = scratchCanvasRef.current;
      const ctx = canvas.getContext("2d");

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };

      img.onerror = () => {
        console.error("Failed to load scratch image");
      };

      // Try to get image source
      if (scratchImage.source?.resource?.src) {
        img.src = scratchImage.source.resource.src;
      } else {
        img.src = "/scratch-card.png";
      }

      const addTouchListeners = () => {
        canvas.addEventListener("touchstart", handleTouchStart, {
          passive: false,
        });
        canvas.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
      };

      const removeTouchListeners = () => {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
      };

      addTouchListeners();
      return () => removeTouchListeners();
    }
  }, [showScratchCard, scratchImage]);

  const handleGoBack = async () => {
    let formData = DecryptData("formData");
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    let updatedformData = {
      ...formData,
      time_taken: durationMinutes,
    };

    const getUserInfo = DecryptData("empData");
    let userInfo = {
      name: getUserInfo?.name,
      role: getUserInfo?.role,
      designation: getUserInfo?.role_name,
      code: getUserInfo?.code,
      hash: getUserInfo?.hash,
    };

    localStorage.setItem("scratchCardDuration", durationMinutes);
    const save = await SaveDoctors(projectData, userInfo.hash, updatedformData);

    localStorage.removeItem("formData");
    router.push(`/${projectData?.project_hash}/homepage`);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      [scratchSoundRef, confettiSoundRef].forEach((ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });

      audioRefs.current.forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      {showConfetti && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <Confetti
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        </div>
      )}

      {loading && (
        <div className="absolute w-full h-full flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <FaSpinner className="w-10 h-10 animate-spin text-gray-800" />
            <p className="text-lg text-gray-800 font-semibold mt-2">
              Loading assets...
            </p>
          </div>
        </div>
      )}

      {!loading && pixiReady && (
        <div className="w-full h-full">
          <Application
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            options={{
              backgroundColor: 0x000000,
              antialias: true,
              resolution: window.devicePixelRatio || 1,
              autoDensity: true,
            }}
          >
            {bgTexture && (
              <sprite
                texture={bgTexture}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
              />
            )}

            {patientFrames.length > 0 && (
              <animatedSprite
                ref={patientRef}
                textures={patientFrames}
                x={canvasDimensions.width * 0.17}
                y={canvasDimensions.height * 1.0}
                anchor={{ x: 0.5, y: 1 }}
                scale={{
                  x: (breakpoint === "sm" ? 0.3 : 0.63) * -1,
                  y: breakpoint === "sm" ? 0.3 : 0.63,
                }}
                animationSpeed={0.2}
                loop={false}
                isPlaying={isPatientPlaying}
              />
            )}

            {doctorFrames.length > 0 && (
              <animatedSprite
                ref={doctorRef}
                textures={doctorFrames}
                x={canvasDimensions.width * 0.7}
                y={canvasDimensions.height * 1.0}
                anchor={{ x: 0.5, y: 1 }}
                scale={{
                  x: (breakpoint === "sm" ? 0.35 : 0.7) * -1,
                  y: breakpoint === "sm" ? 0.35 : 0.7,
                }}
                animationSpeed={0.2}
                loop={false}
                isPlaying={isDoctorPlaying}
              />
            )}
          </Application>
        </div>
      )}

      {!showScratchCard && (
        <div className="absolute bottom-[62%] md:bottom-[62%] lg:top-[10%] w-full max-h-[40%] overflow-y-auto flex flex-col px-4 py-2 space-y-2 z-20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`transition-all duration-500 ease-in-out max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-md md:text-3xl md:py-8 font-medium text-white ${
                msg.sender === "patient"
                  ? "bg-[#b1087b] self-start rounded-bl-none relative before:absolute before:content-[''] before:bottom-0 before:left-[-8px] before:border-r-[10px] before:border-r-[#b1087b] before:border-b-[10px] before:border-b-[#b1087b] before:border-l-[10px] before:border-l-transparent before:border-t-[10px] before:border-t-transparent"
                  : "bg-[#011689] self-end rounded-br-none relative after:absolute after:content-[''] after:bottom-0 after:right-[-8px] after:border-l-[10px] after:border-l-[#011689] after:border-b-[10px] after:border-b-[#011689] after:border-r-[10px] after:border-r-transparent after:border-t-[10px] after:border-t-transparent"
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {showScratchCard && (
        <div
          className={`absolute bg-white inset-0 flex items-center justify-center z-30 transition-all duration-1000 ${
            isDisappearing ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <div className="relative w-[95%] lg:w-1/2 h-[90dvh] max-h-[90dvh] preserve-3d transition-transform duration-700">
            {showFront && (
              <div className="absolute inset-0 flex justify-center rounded-2xl overflow-hidden backface-hidden">
                <div className="w-full h-full flex flex-col justify-center items-center bg-pink-50 border-2 border-pink-500 gap-6 rounded-2xl">
                  <div className="text-center px-5 w-full h-full flex flex-col gap-10 justify-center items-center text-white p-1 mt-2">
                    <div className="w-full bg-white shadow-2xl overflow-hidden mb-2 rounded-xl">
                      <div className="h-full flex flex-col">
                        <div
                          className="px-1 py-5 text-white text-center"
                          style={{
                            background: `linear-gradient(to right, ${cardFrontMap[projectData?.project_hash]?.gradientFrom}, ${cardFrontMap[projectData?.project_hash]?.gradientTo})`,
                          }}
                        >
                          <h2 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
                            {cardFrontMap[projectData?.project_hash]?.title}
                          </h2>
                        </div>
                        <div className="flex-1 px-1 py-2 flex flex-col justify-center text-center bg-gradient-to-b from-pink-50 to-purple-50">
                          <p className="text-[#ec008c] font-semibold text-lg md:text-2xl mb-4">
                            {cardFrontMap[projectData?.project_hash]?.tagline}
                          </p>
                          <div className="bg-white rounded-xl px-4 py-2 border-l-8 mb-2 border-[#ec008c] shadow-lg max-w-xl mx-auto">
                            <p className="text-lg md:text-2xl text-gray-700 leading-relaxed">
                              {cardFrontMap[projectData?.project_hash]?.info}
                            </p>
                          </div>
                        </div>
                        <div
                          className="h-2 sm:h-3"
                          style={{
                            background: `linear-gradient(to right, ${cardFrontMap[projectData?.project_hash]?.gradientFrom}, ${cardFrontMap[projectData?.project_hash]?.gradientTo})`,
                          }}
                        />
                      </div>
                    </div>
                    <img
                      src={cardFrontMap[projectData?.project_hash]?.packshot}
                      alt="Packshot"
                      className="mx-auto mb-3 w-full h-1/2 md:h-1/2"
                    />
                  </div>
                </div>
              </div>
            )}

            <motion.canvas
              ref={scratchCanvasRef}
              className="absolute inset-0 cursor-pointer rounded-2xl z-10"
              onMouseMove={(e) => {
                if (e.buttons === 1) handleScratch(e);
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onMouseDown={handleScratch}
              onMouseUp={handleScratchEnd}
              onMouseLeave={handleScratchEnd}
              onTouchStart={(e) => handleScratch(e.touches[0])}
              onTouchMove={(e) => handleScratch(e.touches[0])}
              onTouchEnd={handleScratchEnd}
              style={{ width: "100%", height: "100%", touchAction: "none" }}
            />
          </div>
        </div>
      )}

      {showCertificate && (
        <div className="absolute px-4 inset-0 flex items-center justify-center z-50 bg-black/60">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-lg animate-fadeIn">
            <h2 className="text-3xl font-bold text-[#ec008c] mb-4">
              🎉 Congratulations!
            </h2>
            <p className="text-gray-700 text-lg md:text-xl mb-6">
              You have contributed to Women's health!
            </p>
            <div>
              <button
                className="w-fit px-3 py-2 mx-auto text-white bg-blue-700 text-lg border rounded"
                onClick={handleGoBack}
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* {showCertificate && (
        <div className="absolute px-4 bottom-2 left-0 right-0 flex items-center justify-center z-50">
          <div className="bg-white p-2 lg:p-1 md:py-4 md:px-4 bg-gradient-to-r from-[#ec008c] to-[#b1087b] text-white font-bold rounded-xl shadow-2xl text-center max-w-lg animate-fadeIn">
            <p className="text-white font-bold text-sm md:text-xl lg:text-lg flex gap-2 justify-center items-center">
              <MdCelebration color="#FFEA00" size={24} />
              <span>You have contributed to Women's health!</span>
            </p>
          </div>
        </div>
      )}

      {showCertificate && (
        <div className="absolute px-4 top-4 left-5 flex items-center justify-center z-50">
          <div>
            <button
              className="w-fit px-3 py-2 mx-auto text-white bg-pink-500 border-2 border-pink-500 text-lg rounded-xl"
              onClick={handleGoBack}
            >
              Go back
            </button>
          </div>
        </div>
      )} */}

      <style jsx>{`
        canvas {
          touch-action: none !important;
          border-radius: 1rem;
        }
        .preserve-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}

export const preloadAnimationAssets = async () => {
  if (assetCache.isLoaded) return;

  const doctorUrls = Array.from(
    { length: 52 },
    (_, i) => `/doctor/doctor${String(i).padStart(2, "0")}.webp`,
  );
  const patientUrls = Array.from(
    { length: 52 },
    (_, i) => `/patient/patient${String(i).padStart(2, "0")}.webp`,
  );

  try {
    const [doctorLoaded, patientLoaded, bg, scratchImg] = await Promise.all([
      Promise.all(doctorUrls.map((url) => Assets.load(url))),
      Promise.all(patientUrls.map((url) => Assets.load(url))),
      Assets.load("/bg.jpg"),
      Assets.load("/scratch-card.png"),
    ]);

    assetCache.doctorFrames = doctorLoaded;
    assetCache.patientFrames = patientLoaded;
    assetCache.bgTexture = bg;
    assetCache.scratchImage = scratchImg;
    assetCache.isLoaded = true;
  } catch (err) {
    console.error("Error preloading assets:", err);
  }
};

export default ScratchCard;
