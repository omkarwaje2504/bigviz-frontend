"use client";

import { useEffect, useState } from "react";
import { FaFilePrescription } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";

const LoadingPage = ({ ui, projectData }) => {
  const [progress, setProgress] = useState(0);
  const [isDark, setIsDark] = useState(false);

  // Detect system dark mode
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(media.matches);

    const listener = (e) => setIsDark(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

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

  // Theme-aware colors
  const primaryColor = isDark
    ? ui?.basic?.secondaryColor || "#666666"
    : ui?.basic?.primaryColor || "#fb2c36";

  const primaryText = isDark
    ? ui?.basic?.secondaryText || "#ffffff"
    : ui?.basic?.primaryText || "#000000";

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white text-gray-800 dark:bg-black dark:text-white transition-colors duration-300">
      {/* Main Icon */}
      <div className="relative mb-12">
        {projectData?.product_type === "RxPad" ? (
          <FaFilePrescription
            size={50}
            className="text-4xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ fill: primaryColor }}
          />
        ) : (
          <FiLoader
            size={50}
            className="text-4xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin"
            style={{ stroke: primaryColor }}
          />
        )}
      </div>

      {/* Branding Text */}
      <h1
        className="text-4xl text-center font-bold mb-2"
        style={{ color: primaryColor }}
      >
        {ui?.loaderPage?.loaderTitle}
      </h1>

      <p
        className="mb-8"
        style={{
          color: isDark
            ? ui?.basic?.primaryColor || "#dddddd"
            : ui?.basic?.secondaryColor || "#666666",
        }}
      >
        {ui?.loaderPage?.loaderSubTitle}
      </p>

      {/* Progress Bar */}
      <div className="w-64 bg-gray-300 dark:bg-gray-700 rounded-full h-3 mb-4">
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: primaryColor,
          }}
        />
      </div>

      {/* Progress Label */}
      <p
        className="text-sm"
        style={{
          color: isDark
            ? ui?.basic?.primaryColor || "#cccccc"
            : ui?.basic?.secondaryColor || "#666666",
        }}
      >
        {ui?.loaderPage?.assetLoader} {progress}%
      </p>
    </div>
  );
};

export default LoadingPage;
