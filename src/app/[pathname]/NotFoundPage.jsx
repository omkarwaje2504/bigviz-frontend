// app/not-found.jsx (or .tsx if you're using TypeScript)
// ✅ This is a SERVER COMPONENT — no 'use client'

import {
  FaFlask,
  FaDna,
  FaMicroscope,
  FaExclamationTriangle,
  FaAtom,
  FaVial,
} from "react-icons/fa";
import React from "react";

// Static molecules and icons for fallback visuals
const floatingMolecules = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 4 + Math.random() * 3,
  size: 0.8 + Math.random() * 1.2,
  colorClass:
    i % 4 === 0
      ? "bg-red-400"
      : i % 4 === 1
        ? "bg-orange-400"
        : i % 4 === 2
          ? "bg-yellow-400"
          : "bg-blue-400",
}));

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 text-gray-900 overflow-hidden relative">
      {/* Background Glows + Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] left-[100px] top-[100px] bg-gradient-radial from-red-500/10 via-orange-400/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute w-[400px] h-[400px] right-[100px] top-[150px] bg-gradient-radial from-blue-500/10 via-blue-400/5 to-transparent rounded-full blur-3xl" />

        <svg
          className="absolute inset-0 w-full h-full opacity-5"
          viewBox="0 0 100 100"
        >
          <pattern
            id="errorGrid"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 8 0 L 0 0 0 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <circle cx="4" cy="4" r="0.5" fill="currentColor" opacity="0.3" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#errorGrid)" />
        </svg>
      </div>

      {/* Floating Molecules (Static positions) */}
      {floatingMolecules.map((molecule) => (
        <div
          key={molecule.id}
          className={`absolute animate-bounce opacity-20 ${molecule.colorClass}`}
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

      {/* Main Error Section */}
      <section className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 mt-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Error Visualization */}
          <div className="mb-10">
            <div className="w-80 h-80 mx-auto relative mb-12">
              {/* Broken Helix */}
              <div className="absolute inset-0 border-4 border-dashed border-red-300 rounded-full animate-pulse opacity-50" />
              <div className="absolute inset-8 border-4 border-dashed border-orange-300 rounded-full animate-pulse opacity-40" />

              {/* Central Icon */}
              <div className="absolute inset-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full shadow-2xl border border-red-200 flex items-center justify-center">
                <FaExclamationTriangle className="w-20 h-20 text-red-500 animate-bounce" />
              </div>

              {/* Orbiting Icons */}
              {[
                { icon: <FaVial />, angle: 0, color: "text-red-500" },
                { icon: <FaMicroscope />, angle: 90, color: "text-orange-500" },
                { icon: <FaAtom />, angle: 180, color: "text-yellow-500" },
                { icon: <FaDna />, angle: 270, color: "text-blue-500" },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`absolute w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center ${item.color} text-2xl animate-spin border border-gray-200`}
                  style={{
                    animationDuration: "20s",
                    transformOrigin: "160px 160px",
                    transform: `rotate(${item.angle}deg) translateX(120px) rotate(-${item.angle}deg)`,
                  }}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-black mb-2 leading-none">
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                404
              </span>
            </h1>

            <h2 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              Formula Not Found
            </h2>

            <p className="text-xl md:text-2xl text-gray-600 mb-1 font-light">
              The project you're looking for has gone missing from our browser.
            </p>

            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              It seems you are on a different location. Let's get you back to
              our main URL from WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
