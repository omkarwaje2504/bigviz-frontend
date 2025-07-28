"use client";

import { useState, useEffect } from "react";
import Banner from "@components/ui/Banner";
import LoadingPage from "@components/ui/LoadingPage";
import LoginForm from "./LoginForm";
import MyError from "@services/MyError";
import { DecryptData, EncryptData } from "@utils/cryptoUtils";
import PrepareVideo from "@services/PrepareVideo";
import { useRouter } from "next/navigation";

export default function LoginPage({ projectData, projectId, ui }) {
  const [loading, setLoading] = useState(true);
  const [loginType, setLoginType] = useState("code");
  const router = useRouter();

  useEffect(() => {
    const getUserData = DecryptData("empData");
    localStorage.clear();
    EncryptData("ui", ui);
    if (getUserData) {
      EncryptData("empData", getUserData);
      router.push(`${projectId}/homepage`);
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <LoadingPage ui={ui} loadingtext="Play your ads in PVR cinemas..." />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <Banner bannerImage={projectData?.top_banner} />

      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all">
          <div className="text-center">
            <h2
              className={`text-3xl font-extrabold mb-2`}
              style={{
                color: ui.basic.primaryColor,
              }}
            >
              {ui.loginPage.heading}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {ui.loginPage.subHeading}
            </p>
          </div>
          <LoginForm ui={ui} loginType={loginType} projectData={projectData} />
        </div>
      </div>
    </div>
  );
}
