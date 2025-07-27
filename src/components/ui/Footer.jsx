"use client";
import Image from "next/image";
import { FaFilm } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 mt-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Left: Logo + Text */}
          <div className="flex items-center mb-4 md:mb-0">
            <FaFilm className="text-red-600 dark:text-red-500 text-xl mr-2" />
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 BigViz Cinema Advertising Platform
            </span>
          </div>

          {/* Right: Logo */}
          <div className="flex space-x-6">
            <Image
              src="/sai-logo.png"
              alt="Sai Logo"
              width={150}
              height={50}
              className="invert-0 dark:invert"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
