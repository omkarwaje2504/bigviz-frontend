"use client";
import Image from "next/image";
import { FaFilm } from "react-icons/fa";
import { FaFilePrescription } from "react-icons/fa";

const Footer = ({ projectData }) => {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 mt-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            {
              projectData?.product_type=== "RxPad" ? <FaFilePrescription className="text-gray-600 text-2xl mr-3" /> : <FaFilm className="text-red-600 dark:text-red-500 text-xl mr-2" />
            }
            
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 {projectData?.config?.theme?.footer_text}
            </span>
          </div>
          {projectData?.bottom_banner && (
            <div className="flex space-x-6 p-2">
              <Image
                src={`https://pub-0b6394cfeda24bf196c98e1746afe09b.r2.dev/${projectData?.bottom_banner}`}
                alt="Sai Logo"
                width={200}
                height={70}
                className=""
              />
            </div>
          )}

          {/* Right: Logo */}
          <div className="flex space-x-6">
            {projectData?.project_hash === "j02y1r2m" ? (
              <Image
                src="/game/image.png"
                alt="Different Logo"
                width={250}
                height={70}
              />
            ) : (
              <Image
                src="/sai-logo.png"
                alt="Sai Logo"
                width={120}
                height={50}
              />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
