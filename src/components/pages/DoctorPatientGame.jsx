"use client";
import { Application, extend } from "@pixi/react";
import { Sprite, AnimatedSprite } from "pixi.js";
import { Assets } from "pixi.js";
import { useEffect, useState, useRef } from "react";

// Register Pixi classes
extend({ Sprite, AnimatedSprite });

function DoctorAnimation() {
  const [doctorFrames, setDoctorFrames] = useState([]);
  const [patientFrames, setPatientFrames] = useState([]);
  const [bgTexture, setBgTexture] = useState(null);

  const doctorRef = useRef(null);
  const patientRef = useRef(null);

  useEffect(() => {
    (async () => {
      // Doctor frames
      const doctorUrls = Array.from(
        { length: 52 },
        (_, i) => `/doctor/doctor${String(i).padStart(2, "0")}.png`,
      );
      // Patient frames
      const patientUrls = Array.from(
        { length: 52 },
        (_, i) => `/patient/patient${String(i).padStart(2, "0")}.png`,
      );

      // Load everything
      const [doctorLoaded, patientLoaded, bg] = await Promise.all([
        Promise.all(doctorUrls.map((url) => Assets.load(url))),
        Promise.all(patientUrls.map((url) => Assets.load(url))),
        Assets.load("/hos-bg.jpg"),
      ]);

      setDoctorFrames(doctorLoaded);
      setPatientFrames(patientLoaded);
      setBgTexture(bg);
    })();
  }, []);

  const handleStart = () => {
    doctorRef.current?.gotoAndPlay(0);
    setTimeout(() => {
      patientRef.current?.gotoAndPlay(0);
    }, 1000);
  };

  const handleStop = () => {
    doctorRef.current?.stop();
    patientRef.current?.stop();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Shared Controls */}
      <div className="mb-4">
        <button
          onClick={handleStart}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
          disabled={!doctorFrames.length || !patientFrames.length}
        >
          Start Both
        </button>
        <button
          onClick={handleStop}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          disabled={!doctorFrames.length || !patientFrames.length}
        >
          Stop Both
        </button>
      </div>

      {/* ONE PixiJS Application */}
      <Application width={400} height={600}>
        {/* Background */}
        {bgTexture && <sprite texture={bgTexture} width={800} height={600} />}

        {/* Doctor animation */}
        {doctorFrames.length > 0 && (
          <animatedSprite
            ref={doctorRef}
            textures={doctorFrames}
            x={290}
            y={550}
            anchor={0.5}
            scale={0.45}
            animationSpeed={0.2}
            loop={true}
            isPlaying={false}
          />
        )}

        {/* Patient animation */}
        {patientFrames.length > 0 && (
          <animatedSprite
            ref={patientRef}
            textures={patientFrames}
            x={130}
            y={550}
            anchor={0.5}
            scale={{ x: -0.43, y: 0.43 }}
            animationSpeed={0.2}
            loop={true}
            isPlaying={false}
          />
        )}
      </Application>
    </div>
  );
}

export default DoctorAnimation;
