"use client";
import { Application, extend } from "@pixi/react";
import { Sprite, AnimatedSprite, Assets } from "pixi.js";
import { useEffect, useState, useRef } from "react";
import Confetti from "react-confetti";

extend({ Sprite, AnimatedSprite });

const assetCache = {
  doctorFrames: null,
  patientFrames: null,
  bgTexture: null,
  scratchImage: null,
  isLoaded: false,
};

function ScratchCard({ onComplete }) {
  const [doctorFrames, setDoctorFrames] = useState(
    assetCache.doctorFrames || [],
  );
  const [patientFrames, setPatientFrames] = useState(
    assetCache.patientFrames || [],
  );
  const [bgTexture, setBgTexture] = useState(assetCache.bgTexture || null);
  const [scratchImage, setScratchImage] = useState(
    assetCache.scratchImage || null,
  );
  const [loading, setLoading] = useState(!assetCache.isLoaded);

  const [messages, setMessages] = useState([]); // chat messages
  const [isPatientPlaying, setIsPatientPlaying] = useState(false);
  const [isDoctorPlaying, setIsDoctorPlaying] = useState(false);

  // Scratch card states
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

  // Audio refs
  const scratchSoundRef = useRef(null);
  const confettiSoundRef = useRef(null);
  const patientVoiceRef = useRef(null);
  const doctorVoice1Ref = useRef(null);
  const doctorVoice2Ref = useRef(null);

  const doctorRef = useRef(null);
  const patientRef = useRef(null);
  const replacementRef = useRef(null);
  const chatEndRef = useRef(null);
  const scratchCanvasRef = useRef(null);

  const CANVAS_WIDTH = typeof window !== "undefined" ? window.innerWidth : 400;
  const CANVAS_HEIGHT =
    typeof window !== "undefined" ? window.innerHeight : 600;

  const conversations = [
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
      text: "I'll prescribe an antifungal treatment for you",
      audioFile: "/sounds/doctor2.m4a",
    },
  ];

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
    scratchSoundRef.current = new Audio("/sounds/scratch.mp3");
    scratchSoundRef.current.loop = true;
    scratchSoundRef.current.volume = 0.4;

    confettiSoundRef.current = new Audio("/sounds/confetti.mp3");
    confettiSoundRef.current.volume = 0.7;

    patientVoiceRef.current = new Audio(conversations[0].audioFile);
    patientVoiceRef.current.volume = 0.8;

    doctorVoice1Ref.current = new Audio(conversations[1].audioFile);
    doctorVoice1Ref.current.volume = 0.8;

    doctorVoice2Ref.current = new Audio(conversations[2].audioFile);
    doctorVoice2Ref.current.volume = 0.8;
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showConfetti && confettiSoundRef.current) {
      confettiSoundRef.current.currentTime = 0;
      confettiSoundRef.current.play().catch(() => {});
    }
  }, [showConfetti]);

  useEffect(() => {
    if (assetCache.isLoaded) {
      setDoctorFrames(assetCache.doctorFrames);
      setPatientFrames(assetCache.patientFrames);
      setBgTexture(assetCache.bgTexture);
      setScratchImage(assetCache.scratchImage);
      setLoading(false);
      return;
    }

    (async () => {
      const doctorUrls = Array.from(
        { length: 52 },
        (_, i) => `/doctor/doctor${String(i).padStart(2, "0")}.png`,
      );
      const patientUrls = Array.from(
        { length: 52 },
        (_, i) => `/patient/patient${String(i).padStart(2, "0")}.png`,
      );

      try {
        const [doctorLoaded, patientLoaded, bg, scratchImg] = await Promise.all(
          [
            Promise.all(doctorUrls.map((url) => Assets.load(url))),
            Promise.all(patientUrls.map((url) => Assets.load(url))),
            Assets.load(
              "/bg.jpg",
            ),
            Assets.load("/Dark Slate Floral Dance Poster (1).png"),
          ],
        );

        assetCache.doctorFrames = doctorLoaded;
        assetCache.patientFrames = patientLoaded;
        assetCache.bgTexture = bg;
        assetCache.scratchImage = scratchImg;
        assetCache.isLoaded = true;

        setDoctorFrames(doctorLoaded);
        setPatientFrames(patientLoaded);
        setBgTexture(bg);
        setScratchImage(scratchImg);
      } catch (err) {
        console.error("Error loading assets:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (doctorFrames.length && patientFrames.length) {
      playConversationSequence();
    }
  }, [doctorFrames, patientFrames]);

  const playConversationSequence = async () => {
    const patientConversation = conversations[0];

    setMessages((prev) => [...prev, patientConversation]);
    setIsPatientPlaying(true);

    patientVoiceRef.current.currentTime = 0;
    patientVoiceRef.current.play().catch(() => {});

    const patientDuration = await getAudioDuration(
      patientConversation.audioFile,
    );

    setTimeout(() => {
      patientRef.current?.gotoAndPlay(0);
    }, 100);

    setTimeout(async () => {
      setIsPatientPlaying(false);
      patientRef.current?.gotoAndStop(0);
      patientVoiceRef.current.pause();

      const doctorConversation1 = conversations[1];
      setMessages((prev) => [...prev, doctorConversation1]);
      setIsDoctorPlaying(true);

      doctorVoice1Ref.current.currentTime = 0;
      doctorVoice1Ref.current.play().catch(() => {});

      const doctorDuration1 = await getAudioDuration(
        doctorConversation1.audioFile,
      );

      setTimeout(() => {
        doctorRef.current?.gotoAndPlay(0);
      }, 100);

      setTimeout(async () => {
        setIsDoctorPlaying(false);
        doctorRef.current?.stop();
        doctorVoice1Ref.current.pause();

        const doctorConversation2 = conversations[2];

        setMessages((prev) => [...prev, doctorConversation2]);
        setIsDoctorPlaying(true);

        doctorVoice2Ref.current.currentTime = 0;
        doctorVoice2Ref.current.play().catch(() => {});

        const doctorDuration2 = await getAudioDuration(
          doctorConversation2.audioFile,
        );

        setTimeout(() => {
          doctorRef.current?.gotoAndPlay(0);
        }, 100);

        setTimeout(() => {
          setIsDoctorPlaying(false);
          doctorRef.current?.stop();
          doctorVoice2Ref.current.pause();
          setConversationComplete(true);
          setTimeout(() => {
            setShowScratchCard(true);
          }, 1000);
        }, doctorDuration2);
      }, doctorDuration1);
    }, patientDuration);
  };

  const handleScratch = (e) => {
    if (!showScratchCard || autoRevealed) return;

    if (scratchSoundRef.current && scratchSoundRef.current.paused) {
      scratchSoundRef.current.play().catch(() => {});
    }

    const canvas = scratchCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const progress = transparent / (pixels.length / 4);
    setScratchProgress(progress);

    if (progress > 0.95 && !autoRevealed) {
      setAutoRevealed(true);
      setScratchProgress(1);

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (onComplete) onComplete();

      setShowConfetti(true);

      setTimeout(() => {
        // setShowCertificate(true);
      }, 5000);
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

      canvas.width = 350;
      canvas.height = 250;

      const img = new Image();

      img.onload = () => {
        const imgRatio = img.width / img.height
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };

      if (scratchImage.source && scratchImage.source.resource) {
        if (scratchImage.source.resource instanceof HTMLImageElement) {
          img.src = scratchImage.source.resource.src;
        } else {
          img.crossOrigin = "anonymous";
          img.src = "/Dark Slate Floral Dance Poster (1).png";
        }
      } else {
        img.crossOrigin = "anonymous";
        img.src = "/Dark Slate Floral Dance Poster (1).png";
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

      return () => {
        removeTouchListeners();
      };
    }
  }, [showScratchCard, scratchImage]);

  useEffect(() => {
    return () => {
      [
        scratchSoundRef,
        confettiSoundRef,
        patientVoiceRef,
        doctorVoice1Ref,
        doctorVoice2Ref,
      ].forEach((ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, []);

  const [breakpoint, setBreakpoint] = useState("md");

  useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth < 768) {
        setBreakpoint("sm");
      } else {
        setBreakpoint("md");
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full">
      {showConfetti && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        </div>
      )}

      {loading && (
        <div className="absolute w-full h-full flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-lg font-semibold">Loading animation...</p>
          </div>
        </div>
      )}

      {!loading && (
        <Application width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          {bgTexture && (
            <sprite
              texture={bgTexture}
              height={CANVAS_HEIGHT}
              width={CANVAS_WIDTH} 
            />
          )}

          {patientFrames.length > 0 && (
            <animatedSprite
              ref={patientRef}
              textures={patientFrames}
              x={CANVAS_WIDTH * 0.18}
              y={
                breakpoint === "sm" ? CANVAS_HEIGHT * 1.0 : CANVAS_HEIGHT * 1.0
              }
              anchor={{ x: 0.5, y: 1 }}
              scale={{
                x: (breakpoint === "sm" ? 0.3 : 0.42) * -1,
                y: breakpoint === "sm" ? 0.3 : 0.42,
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
              x={CANVAS_WIDTH * 0.7}
              y={breakpoint === "sm" ? CANVAS_HEIGHT * 1 : CANVAS_HEIGHT * 1.0}
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
      )}

      {!showScratchCard && (
        <div className="absolute bottom-[55%] w-full max-h-[40%] overflow-y-auto flex flex-col px-4 py-2 space-y-2 z-20 lato-bold">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`transition-all duration-500 ease-in-out max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-md font-medium text-white ${
                msg.sender === "patient"
                  ? "bg-[#b1087b] self-start rounded-bl-none"
                  : "bg-[#011689]  self-end rounded-br-none"
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
          <div
            className={`
            relative 
            w-[90%] lg:w-1/2 
            h-[90dvh] max-h-[90dvh]  
            preserve-3d 
            transition-transform 
            duration-700
          `}
          >
            {/* CARD FRONT */}
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl overflow-hidden backface-hidden">
              <div className="w-full h-full flex flex-col justify-center items-center bg-pink-50 rounded-2xl">
                <div className="text-center text-white p-1">
                  <img
                    src="/packet.png"
                    alt="Gogynax-packshot"
                    className="mx-auto mb-3 w-full h-[70%]"
                  /> 

                  <div className="w-full bg-white shadow-2xl overflow-hidden rounded-xl">
                    <div className="h-full flex flex-col">
                      <div className="bg-gradient-to-r from-[#ec008c] to-[#b1087b] px-1 py-2 text-white text-center">
                       
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
                          Decode the vaginal care
                          <br />
                          <span className="text-yellow-200">with Gogynax</span>
                        </h2>
                      </div>
                      <div className="flex-1 px-1 py-2 flex flex-col justify-center text-center bg-gradient-to-b from-pink-50 to-purple-50">
                        <p className="text-[#ec008c] font-semibold text-base sm:text-lg md:text-xl mb-4 sm:mb-6">
                          Restores comfort and confidence
                        </p>

                        <div className="bg-white rounded-xl px-2 py-2 border-l-8 border-[#ec008c] shadow-lg max-w-sm mx-auto">
                          <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                            <span className="font-medium text-[#ec008c] text-lg ">
                              Clotrimazole
                            </span>{" "}
                            — A trusted antifungal,
                            <br />
                            offers relief, right where it's needed
                          </p>
                        </div>
                      </div>
                      <div className="h-2 sm:h-3 bg-gradient-to-r from-[#ec008c] to-[#b1087b]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SCRATCH LAYER */}
            <canvas
              ref={scratchCanvasRef}
              className="absolute inset-0 cursor-pointer rounded-2xl z-10"
              onMouseMove={(e) => {
                if (e.buttons === 1) handleScratch(e);
              }}
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
            <p className="text-gray-700 text-lg mb-6">
              You have successfully completed the Gogynax journey with following You have contributed to Women's health!
            </p>
          </div>
        </div>
      )}

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
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}

export const preloadAnimationAssets = async () => {
  if (assetCache.isLoaded) return;

  const doctorUrls = Array.from(
    { length: 52 },
    (_, i) => `/doctor/doctor${String(i).padStart(2, "0")}.png`,
  );
  const patientUrls = Array.from(
    { length: 52 },
    (_, i) => `/patient/patient${String(i).padStart(2, "0")}.png`,
  );

  try {
    const [doctorLoaded, patientLoaded, bg, scratchImg] = await Promise.all([
      Promise.all(doctorUrls.map((url) => Assets.load(url))),
      Promise.all(patientUrls.map((url) => Assets.load(url))),
      Assets.load("/bg.jpg"),
      Assets.load("/Dark Slate Floral Dance Poster (1).png"),
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
