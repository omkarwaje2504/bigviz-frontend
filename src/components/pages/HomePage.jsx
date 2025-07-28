"use client";

import { useState, useEffect } from "react";
import { FaFilm, FaUserPlus } from "react-icons/fa";
import Button from "@components/ui/Button";
import MemberTable from "@components/ui/MemberTable";
import Footer from "@components/ui/Footer";
import Header from "@components/ui/Header";
import LoadingPage from "@components/ui/LoadingPage";
import Dashboard from "@components/ui/Dashboard";
import Link from "next/link";
import { DecryptData, RemoveData } from "@utils/cryptoUtils";
import { FetchDoctors } from "@actions/user";


const HomePage = ({ projectData, projectId,ui }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [loadMembers, setLoadMembers] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: 1,
    designation: "Medical Representative",
    avatar: "/images/avatar.jpg",
  });
  const [statistics, setStats] = useState();

  // Loading effect to simulate data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Fetch user info and members data
  useEffect(() => {
    const getUserInfo = DecryptData("empData");
    if (getUserInfo) {
      setUserInfo({
        name: getUserInfo?.name,
        role: getUserInfo?.role,
        designation: getUserInfo?.role_name,
      });
    }
    getMembers(getUserInfo);
    const getStats = stats(members, ui, projectData);
    setStats(getStats);

    RemoveData("formData");
  }, []);

  const getMembers = async (getUserInfo) => {
    const membersData = await FetchDoctors(getUserInfo?.hash);
    if (membersData) {
      setMembers(membersData.data);
      setLoadMembers(false);
    } else {
      setLoadMembers(false);
      setMembers([]);
    }
  };

  if (isLoading) {
    return <LoadingPage ui={ui} loadingtext={"Loading the Dashboard..."} />;
  }
  return (
    <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <Header
        userInfo={userInfo}
        projectData={projectData}
        projectHash={projectId}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <Dashboard stats={statistics} ui={ui} projectData={projectData} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div className="w-full md:w-auto">
            <h2 className="text-xl font-semibold">
              {ui.Dashboard.HomePageTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              {ui.Dashboard.HomePageSubTitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            <Link
              href={
                projectData?.features?.includes("Calendar")
                  ? "register-new-ads"
                  : "new-calendar-entry"
              }
            >
              <Button type="button" fullWidth={false} leftIcon={<FaUserPlus />}>
                {ui.Dashboard.HomePageButtonLabel}
              </Button>
            </Link>
          </div>
        </div>
        {!loadMembers ? (
          <MemberTable
            projectData={projectData}
            members={members}
            onEdit={(id) => console.log("Edit", id)}
          />
        ) : (
          <div className="mt-6 text-center text-gray-400">
            <FaFilm className="text-4xl mx-auto mb-2" />
            <p>Loading...</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;

const stats = (members, ui, projectData) => {
  const total = members.length || 1; // to avoid division by zero

  const activeMembers = !projectData?.features?.includes("approval_system")
    ? members.filter((member) => member.download !== null)
    : members.filter((member) => member.approved_status == 1);

  const pendingMembers = !projectData?.features?.includes("approval_system")
    ? members.filter((member) => member.download == null)
    : members.filter((member) => member.approved_status == 0);

  const getPercentage = (count) => `${((count / total) * 100).toFixed(1)}%`;

  return [
    {
      label: ui.Dashboard.ActiveLabel,
      value: activeMembers.length,
      percentage: getPercentage(activeMembers.length),
    },
    {
      label: ui.Dashboard.PendingLabel,
      value: pendingMembers.length,
      percentage: getPercentage(pendingMembers.length),
    },
  ];
};
