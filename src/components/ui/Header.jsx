"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFilm, FaSignOutAlt, FaVideo, FaUserMd } from "react-icons/fa";
import { useEffect, useState } from "react";
import { IoGameControllerSharp } from "react-icons/io5";
import { FaFilePrescription } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";

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
    case "RxPad Ajanata":
      return <FaFilePrescription className="text-gray-600 text-2xl mr-3" />;
    default:
      return <FaUserDoctor className="text-gray-600 text-2xl mr-3" />; // fallback
  }
};

const Header = ({ ui, userInfo, projectData, projectHash }) => {
  const { pathnamesArray } = useHeaderData();

  const [isDark, setIsDark] = useState(false);

  // detect system dark/light
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(media.matches);

    const listener = (e) => setIsDark(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  // pick colors based on theme
  const bgColor = isDark
    ? ui?.basic?.secondaryColor || "#f5ba01"
    : ui?.basic?.primaryColor || "#fb2c36";

  const textColor = isDark
    ? ui?.basic?.secondaryText || "#000000"
    : ui?.basic?.primaryColor || "#ffffff";

  if (projectData?.config?.employee) {
    return (
      <header className="bg-white dark:bg-black shadow-lg border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex justify-between items-center">
            {/* Left Logo/Title */}
            <div className="flex items-center">
              {getProjectIcon(projectData?.name)}

              <div>
                <h1
                  className="text-md md:text-xl font-bold"
                  style={{ color: textColor }}
                >
                  {projectData?.config?.theme?.loading_title ||
                    projectData?.name ||
                    "Platform Partner"}
                </h1>
                <p
                  className="text-sm md:text-[13px]"
                  style={{ color: textColor }}
                >
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

                {/* Avatar Circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold uppercase"
                  style={{
                    backgroundColor: bgColor,
                    color: ui?.basic?.primaryText,
                  }}
                >
                  {userInfo.name.charAt(0)}
                </div>

                {/* Logout */}
                {projectData?.project_hash !== "gv2zgqr6" && (
                  <FaSignOutAlt
                    className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 cursor-pointer"
                    onClick={() => {
                      const getProjectHash =
                        localStorage.getItem("projectHash");
                      localStorage.clear();
                      localStorage.setItem("projectHash", getProjectHash);
                      window.location.href = `/${projectHash}`;
                    }}
                    title="Sign out"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  } else {
    return (
      <header className="bg-white dark:bg-black shadow-lg border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 flex items-center justify-center max-h-[20rem]">
        <img
          src={
            process.env.NEXT_PUBLIC_R2_PUBLIC_URL +
            "/" +
            projectData?.top_banner
          }
          className="max-h-[20rem]"
          alt="Top-banner"
        />
      </header>
    );
  }
};

export default Header;
