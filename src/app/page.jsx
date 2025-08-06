import {
  FaFlask,
  FaDna,
  FaMicroscope,
  FaPills,
  FaHeartbeat,
  FaUserMd,
  FaStethoscope,
  FaSyringe,
} from "react-icons/fa";
import React from "react";

// Server-generated static floating molecules
const floatingMolecules = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 4 + Math.random() * 3,
  size: 0.5 + Math.random() * 1.5,
  colorClass:
    i % 5 === 0
      ? "bg-blue-400"
      : i % 5 === 1
        ? "bg-green-400"
        : i % 5 === 2
          ? "bg-purple-400"
          : i % 5 === 3
            ? "bg-cyan-400"
            : "bg-emerald-400",
}));

export default function Homepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white text-gray-900 overflow-hidden relative">
      {/* Static Pharma Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] left-[-300px] top-[-300px] bg-gradient-radial from-blue-500/10 via-blue-400/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute w-[500px] h-[500px] right-[100px] top-[100px] bg-gradient-radial from-green-500/10 via-emerald-400/5 to-transparent rounded-full blur-3xl" />
        <svg
          className="absolute inset-0 w-full h-full opacity-5"
          viewBox="0 0 100 100"
        >
          <pattern
            id="medicalGrid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <circle cx="5" cy="5" r="0.5" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#medicalGrid)" />
        </svg>
      </div>

      {/* Floating Molecules (Static) */}
      {floatingMolecules.map((molecule) => (
        <div
          key={molecule.id}
          className={`absolute animate-bounce opacity-30 ${molecule.colorClass}`}
          style={{
            left: `${molecule.x}%`,
            top: `${molecule.y}%`,
            animationDelay: `${molecule.delay}s`,
            animationDuration: `${molecule.duration}s`,
            transform: `scale(${molecule.size})`,
          }}
        >
          <div className="w-3 h-3 rounded-full blur-sm"></div>
        </div>
      ))}

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="block text-gray-900">PHARMA</span>
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 bg-clip-text text-transparent">
                INNOVATION
              </span>
              <span className="block text-gray-700 font-light text-4xl md:text-5xl lg:text-6xl">
                Through Design
              </span>
            </h1>
          </div>

          {/* Medical Visualization */}
          <div className="relative mb-20">
            <div className="w-96 h-96 mx-auto relative">
              <div
                className="absolute inset-0 border-2 border-blue-200 rounded-full animate-spin opacity-30"
                style={{ animationDuration: "20s" }}
              ></div>
              <div
                className="absolute inset-4 border-2 border-green-200 rounded-full animate-spin opacity-40"
                style={{
                  animationDuration: "15s",
                  animationDirection: "reverse",
                }}
              ></div>
              <div className="absolute inset-16 bg-gradient-to-br from-blue-100 to-white rounded-full shadow-2xl border border-blue-200 flex items-center justify-center">
                <div className="text-center">
                  <FaDna className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold text-gray-700">
                    Healthcare Innovation
                  </h3>
                </div>
              </div>

              {/* Orbit Icons */}
              {[
                { icon: <FaFlask />, angle: 0, color: "text-blue-500" },
                { icon: <FaPills />, angle: 72, color: "text-green-500" },
                {
                  icon: <FaStethoscope />,
                  angle: 144,
                  color: "text-purple-500",
                },
                { icon: <FaSyringe />, angle: 216, color: "text-cyan-500" },
                { icon: <FaUserMd />, angle: 288, color: "text-emerald-500" },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`absolute w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center ${item.color} text-xl animate-spin border border-gray-200`}
                  style={{
                    animationDuration: "15s",
                    transformOrigin: "192px 192px",
                    transform: `rotate(${item.angle}deg) translateX(150px) rotate(-${item.angle}deg)`,
                  }}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final Message */}
      <div className="block text-gray-700 font-light text-3xl md:text-4xl lg:text-5xl p-4 text-center -mt-48">
        You're on a wrong page. Please use the correct URL shared to your
        <b className="ml-2">WhatsApp</b>
      </div>
    </div>
  );
}
