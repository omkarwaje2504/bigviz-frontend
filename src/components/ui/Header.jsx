"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFilm, FaSignOutAlt, FaLocationArrow, FaVideo } from "react-icons/fa";
import { useEffect, useState } from "react";

function useHeaderData() {
  const pathname = usePathname();
  const pathnamesArray = pathname?.split("/") || [];
  return { pathname, pathnamesArray };
}

const Header = ({ userInfo, projectData, projectHash }) => {
  const { pathnamesArray } = useHeaderData();

  return (
    <header className="bg-white dark:bg-black shadow-lg border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center">
          {/* Left Logo/Title */}
          <div className="flex items-center">
            {projectData?.product_name === "PVR" ? (
              <FaFilm className="text-red-600 text-2xl mr-3" />
            ) : (
              <FaVideo className="text-red-600 text-2xl mr-3" />
            )}

            <div>
              <h1 className="text-xl font-bold text-red-600 dark:text-red-500">
                {projectData?.product_name || "Platform Partner"}
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {projectData?.company || "Achieve your goals with us"}
              </p>
            </div>
          </div>

          {/* Right User Info */}
          <div className="flex items-center space-x-6">
            {userInfo.role !== 1 && pathnamesArray.includes("homepage") ? (
              <div>
                <Link href={`/${projectHash}/approval-dashboard`}>
                  <p className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-colors duration-200 flex gap-2 border p-2 rounded-md">
                    <FaLocationArrow className="mt-1" /> Approval Dashboard
                  </p>
                </Link>
              </div>
            ) : userInfo.role !== 1 &&
              pathnamesArray.includes("approval-dashboard") ? (
              <div>
                <Link href={`/${projectHash}/homepage`}>
                  <p className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-colors duration-200 flex gap-2 border p-2 rounded-md">
                    <FaLocationArrow className="mt-1" /> Go to Home
                  </p>
                </Link>
              </div>
            ) : null}

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
