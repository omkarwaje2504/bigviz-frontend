"use client";

import { useEffect, useState } from "react";
import { FaFilm, FaRegPlayCircle } from "react-icons/fa";

const LoadingPage = ({ ui, loadingtext }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white text-gray-800 dark:bg-black dark:text-white transition-colors duration-300">
      {/* Main Icon */}
      <div className="relative mb-12">
        <FaFilm
          className="text-8xl animate-pulse"
          style={{
            fill: ui.basic.secondaryColor,
          }}
        />
        <FaRegPlayCircle
          className="text-4xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            fill: ui.basic.secondaryText,
          }}
        />
      </div>

      {/* Branding Text */}
      <h1 className="text-4xl font-bold text-red-600 dark:text-red-500 mb-2">
        Bigviz
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-300">{loadingtext}</p>

      {/* Progress Bar */}
      <div className="w-64 bg-gray-300 dark:bg-gray-700 rounded-full h-3 mb-4">
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: ui.basic.secondaryColor,
          }}
        />
      </div>

      {/* Progress Label */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Loading assets... {progress}%
      </p>
    </div>
  );
};

export default LoadingPage;
