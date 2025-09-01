"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFilm, FaSignOutAlt, FaLocationArrow, FaVideo } from "react-icons/fa";
import { useEffect, useState } from "react";
import { IoGameControllerSharp } from "react-icons/io5";

function useHeaderData() {
  const pathname = usePathname();
  const pathnamesArray = pathname?.split("/") || [];
  return { pathname, pathnamesArray };
}
const getProjectIcon = (name) => {
  switch (name) {
    case "PVR":
      return <FaFilm className="text-red-600 text-2xl mr-3" />;
    case "Cinema":
      return <FaVideo className="text-red-600 text-2xl mr-3" />;
    case "Scratch activity":
      return <IoGameControllerSharp className="text-red-600 text-2xl mr-3" />;
    case "Doctor":
      return <FaUserMd className="text-purple-600 text-2xl mr-3" />;
    default:
      return <FaVideo className="text-gray-600 text-2xl mr-3" />; // fallback
  }
};

const Header = ({ userInfo, projectData, projectHash }) => {
  const { pathnamesArray } = useHeaderData();
  let hedaerLogo;
  return (
    <header className="bg-white dark:bg-black shadow-lg border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center">
          {/* Left Logo/Title */}
          <div className="flex items-center">
            {getProjectIcon(projectData?.name)}

            <div>
              <h1 className="text-xl font-bold text-red-600 dark:text-red-500">
                {projectData?.config?.theme?.loading_title || projectData?.name ||"Platform Partner"}
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 md:text-[13px]">
                {projectData?.company?.name || "Achieve your goals with us"}
              </p>
            </div>
          </div>

          {/* Right User Info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="font-medium text-gray-800 dark:text-white">
                  {userInfo.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userInfo.designation}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-red-800 text-white flex items-center justify-center text-sm font-bold uppercase">
                {userInfo.name.charAt(0)}
              </div>
              <FaSignOutAlt
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 cursor-pointer"
                onClick={() => {
                  const getProjectHash = localStorage.getItem("projectHash");
                  localStorage.clear();
                  localStorage.setItem("projectHash", getProjectHash);
                  window.location.href = `/${projectHash}`;
                }}
                title="Sign out"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
