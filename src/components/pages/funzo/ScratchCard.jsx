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

  // Conversation data with audio files
  const conversations = [
    {
      id: 1,
      sender: "patient",
      text: "There's thick white discharge again… is it infection?",
      audioFile: "/sounds/patient1.m4a", // Add your audio file path
    },
    {
      id: 2,
      sender: "doctor",
      text: "Yes, typical of vaginal candidiasis",
      audioFile: "/sounds/doctor1.m4a", // Add your audio file path
    },
    {
      id: 3,
      sender: "doctor",
      text: "I'll prescribe an antifungal treatment for you",
      audioFile: "/sounds/doctor2.m4a", // Add your audio file path
    },
  ];

  // Function to get audio duration
  const getAudioDuration = (audioFile) => {
    return new Promise((resolve) => {
      const audio = new Audio(audioFile);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration * 1000); // Return duration in milliseconds
      });
      audio.addEventListener("error", () => {
        // Fallback to estimated duration if audio fails to load
        resolve(3000); // 3 seconds default
      });
    });
  };

  useEffect(() => {
    // Load sounds
    scratchSoundRef.current = new Audio("/sounds/scratch.mp3");
    scratchSoundRef.current.loop = true;
    scratchSoundRef.current.volume = 0.4;

    confettiSoundRef.current = new Audio("/sounds/confetti.mp3");
    confettiSoundRef.current.volume = 0.7;

    // Load conversation audio files
    patientVoiceRef.current = new Audio(conversations[0].audioFile);
    patientVoiceRef.current.volume = 0.8;

    doctorVoice1Ref.current = new Audio(conversations[1].audioFile);
    doctorVoice1Ref.current.volume = 0.8;

    doctorVoice2Ref.current = new Audio(conversations[2].audioFile);
    doctorVoice2Ref.current.volume = 0.8;
  }, []);

  // scroll to bottom when messages update
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
            Assets.load("/hos-bg.png"),
            Assets.load("/scratch-card.jpg"),
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

  // Updated conversation sequence with dynamic audio timing
  useEffect(() => {
    if (doctorFrames.length && patientFrames.length) {
      playConversationSequence();
    }
  }, [doctorFrames, patientFrames]);

  const playConversationSequence = async () => {
    // Step 1: Patient speaks
    const patientConversation = conversations[0];

    setMessages((prev) => [...prev, patientConversation]);
    setIsPatientPlaying(true);

    // Play patient audio and get its duration
    patientVoiceRef.current.currentTime = 0;
    patientVoiceRef.current.play().catch(() => {});

    const patientDuration = await getAudioDuration(
      patientConversation.audioFile,
    );

    setTimeout(() => {
      patientRef.current?.gotoAndPlay(0);
    }, 100);

    setTimeout(async () => {
      // Stop patient animation and audio
      setIsPatientPlaying(false);
      patientRef.current?.gotoAndStop(0);
      patientVoiceRef.current.pause();

      // Step 2: Doctor speaks (first line)
      const doctorConversation1 = conversations[1];

      setMessages((prev) => [...prev, doctorConversation1]);
      setIsDoctorPlaying(true);

      // Play doctor audio and get its duration
      doctorVoice1Ref.current.currentTime = 0;
      doctorVoice1Ref.current.play().catch(() => {});

      const doctorDuration1 = await getAudioDuration(
        doctorConversation1.audioFile,
      );

      setTimeout(() => {
        doctorRef.current?.gotoAndPlay(0);
      }, 100);

      setTimeout(async () => {
        // Stop doctor animation and audio
        setIsDoctorPlaying(false);
        doctorRef.current?.stop();
        doctorVoice1Ref.current.pause();

        // Step 3: Doctor speaks (second line)
        const doctorConversation2 = conversations[2];

        setMessages((prev) => [...prev, doctorConversation2]);
        setIsDoctorPlaying(true);

        // Play doctor audio and get its duration
        doctorVoice2Ref.current.currentTime = 0;
        doctorVoice2Ref.current.play().catch(() => {});

        const doctorDuration2 = await getAudioDuration(
          doctorConversation2.audioFile,
        );

        setTimeout(() => {
          doctorRef.current?.gotoAndPlay(0);
        }, 100);

        setTimeout(() => {
          // Stop final animation and audio
          setIsDoctorPlaying(false);
          doctorRef.current?.stop();
          doctorVoice2Ref.current.pause();
          setConversationComplete(true);

          // Show scratch card after conversation
          setTimeout(() => {
            setShowScratchCard(true);
          }, 1000);
        }, doctorDuration2);
      }, doctorDuration1);
    }, patientDuration);
  };

  // Handle scratch card interaction
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

    // Calculate scratch progress
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const progress = transparent / (pixels.length / 4);
    setScratchProgress(progress);

    // Show content when 95% is scratched
    if (progress > 0.95 && !autoRevealed) {
      setAutoRevealed(true);
      setShowConfetti(true);
      setTimeout(() => {
        setShowPackshot(false);
      }, 2500);

      // Clear the entire canvas
      setTimeout(() => {
        const ctx = canvas.getContext("2d");
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setScratchProgress(1);

        // Show confetti
        setShowConfetti(true);

        // Wait 3-4 seconds with confetti, then flip the card
        setTimeout(() => {
          setIsFlipped(true);

          // After 4-5 seconds, start disappearing animation
          setTimeout(() => {
            setIsDisappearing(true);

            // Start character animations and complete after animation
            setIsPatientPlaying(true);
            setIsDoctorPlaying(true);
            setTimeout(() => {
              patientRef.current?.gotoAndPlay(0);
              doctorRef.current?.gotoAndPlay(0);
            }, 100);

            setTimeout(() => {
              if (onComplete) {
              onComplete();
            }
            setTimeout(() => {
              setShowCertificate(true);
            }, 6000);
            }, 2000);
          }, 4000);
        }, 3000);
      }, 3000);
    }
  };

  // Handle touch events properly
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

  // Initialize scratch canvas with image and add event listeners properly
  useEffect(() => {
    if (showScratchCard && scratchCanvasRef.current && scratchImage) {
      const canvas = scratchCanvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas size
      canvas.width = 350;
      canvas.height = 250;

      // Load and draw the scratch image
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };

      // For PixiJS v8, use the source property directly or fallback to direct path
      if (scratchImage.source && scratchImage.source.resource) {
        if (scratchImage.source.resource instanceof HTMLImageElement) {
          img.src = scratchImage.source.resource.src;
        } else {
          img.crossOrigin = "anonymous";
          img.src = "/scratch-card.jpg";
        }
      } else {
        img.crossOrigin = "anonymous";
        img.src = "/scratch-card.jpg";
      }

      // Add non-passive touch event listeners
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

      // Cleanup
      return () => {
        removeTouchListeners();
      };
    }
  }, [showScratchCard, scratchImage]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      // Stop and cleanup all audio
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

  return (
    <div className="fixed inset-0 w-full h-full">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Loader */}
      {loading && (
        <div className="absolute w-full h-full flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-lg font-semibold">Loading animation...</p>
          </div>
        </div>
      )}

      {/* PIXI fullscreen */}
      {!loading && (
        <Application width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          {bgTexture && (
            <sprite
              texture={bgTexture}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />
          )}

          {patientFrames.length > 0 && (
            <animatedSprite
              ref={patientRef}
              textures={patientFrames}
              x={CANVAS_WIDTH * 0.3}
              y={CANVAS_HEIGHT * 0.752}
              anchor={0.5}
              scale={0.26}
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
              y={CANVAS_HEIGHT * 0.9}
              anchor={0.5}
              scale={0.45}
              animationSpeed={0.2}
              loop={false}
              isPlaying={isDoctorPlaying}
            />
          )}
        </Application>
      )}

      {/* Chat UI */}
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

      {/* Scratch Card */}
      {showScratchCard && (
        <div
          className={`absolute bg-purple-500/60 inset-0 flex items-center justify-center z-30 transition-all duration-1000 ${
            isDisappearing ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <div
            className={`relative w-80 h-56 preserve-3d transition-transform duration-700 ${
              isFlipped ? "rotate-y-180" : ""
            }`}
          >
            {/* Front side (scratchable) */}
            <div className="absolute inset-0 backface-hidden">
              {/* Scratch Layer with Image */}
              <canvas
                ref={scratchCanvasRef}
                className="absolute inset-0 cursor-pointer rounded-2xl"
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

              {/* Base content (visible before scratch) */}
              {showPackshot && (
                <div className="w-80 h-56 flex items-center border-white border-2 p-3 justify-center bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl">
                  <div className="text-center text-white">
                    <img src="/Gogynax-packshot.png" alt="Gogynax-packshot" />
                  </div>
                </div>
              )}

              {/* Revealed content (after packshot is hidden) */}
              {autoRevealed && !isFlipped && !showPackshot && (
                <div className="w-80 h-56 flex border-white border-2 items-center justify-center bg-[#ec008c] rounded-2xl">
                  <div className="text-center text-white p-3">
                    <img src="/Gogynax-name.png" alt="Gogynax-name" />
                  </div>
                </div>
              )}
            </div>

            {/* Back side (after flip) */}
            <div className="absolute -top-56 rotate-y-180 backface-hidden">
              <div className="w-full  bg-white shadow-2xl overflow-hidden">
                <div className="h-full flex flex-col">
                  {/* Header section */}
                  <div className="bg-gradient-to-r from-[#ec008c] to-[#b1087b] p-8 text-white text-center flex-shrink-0">
                    <div className="text-6xl mb-4">💊</div>
                    <h2 className="text-3xl font-bold leading-tight">
                      Decode the vaginal care
                      <br />
                      <span className="text-yellow-200">with Gogynax</span>
                    </h2>
                  </div>

                  {/* Content section */}
                  <div className="flex-1 p-8 flex flex-col justify-center text-center bg-gradient-to-b from-pink-50 to-purple-50">
                    <p className="text-[#ec008c] font-semibold text-2xl mb-8">
                      Restores comfort and confidence
                    </p>

                    <div className="bg-white rounded-xl p-6 border-l-8 border-[#ec008c] shadow-lg max-w-lg mx-auto">
                      <p className="text-lg text-gray-700 leading-relaxed">
                        <span className="font-bold text-[#ec008c] text-xl">
                          Clotrimazole
                        </span>{" "}
                        — A trusted antifungal,
                        <br />
                        offers relief, right where it's needed
                      </p>
                    </div>
                  </div>

                  {/* Footer accent */}
                  <div className="h-3 bg-gradient-to-r from-[#ec008c] to-[#b1087b] flex-shrink-0"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {showCertificate && (
        <div className="absolute px-4 inset-0 flex items-center justify-center z-50 bg-black/60">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-lg animate-fadeIn">
            <h2 className="text-3xl font-bold text-[#ec008c] mb-4">🎉 Congratulations!</h2>
            <p className="text-gray-700 text-lg mb-6">
              You have successfully completed the Gogynax journey.
            </p>
            {/* <img src="/certificate.png" alt="Certificate" className="mx-auto rounded-lg shadow" /> */}
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
      Assets.load("/hos-bg.png"),
      Assets.load("/scratch-card.jpg"),
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
