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
import Config from "@utils/Config";
import { DecryptData, EncryptData, RemoveData } from "@utils/cryptoUtils";
import { FetchDoctor, FetchDoctors } from "@actions/user";
import config from "@utils/Config";
import { useRouter } from "next/navigation";
import { ApprovalAction } from "@actions/approvalApis";
import { FaCircleNotch } from "react-icons/fa6";

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const HomePage = ({ projectData, projectId, ui }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [loadMembers, setLoadMembers] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: 1,
    role_name: "",
    designation: "Medical Representative",
    avatar: "/images/avatar.jpg",
    hash: "",
    code: "",
    contacts_count: 0,
    hq: "",
    limit: 0,
    region: "",
    state: "",
    team: [],
    zone: "",
    limit: null,
  });
  const [statistics, setStats] = useState();
  const [approvingStatus, setApprovingStatus] = useState({});
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(media.matches);
    const listener = (e) => setIsDark(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const getUserInfo = DecryptData("empData");
    const visitorHash = DecryptData("visitorHash");
    if (getUserInfo) {
      if (getUserInfo?.role !== 1) {
        localStorage.clear();
        router.push(`/${projectId}`);
      } else {
        EncryptData("projectHash", projectId);
        setUserInfo({
          name: getUserInfo?.name,
          role: getUserInfo?.role,
          designation: getUserInfo?.role_name,
          hash: getUserInfo?.hash,
          limit: getUserInfo?.limit,
        });
      }
    }
    if (!getUserInfo) {
      router.push(`/${projectId}`);
    }
    RemoveData("doctorHash");
    RemoveData("videoGenerated");
    RemoveData("videoUrl");
    RemoveData("isEdit");
    RemoveData("formData");
    RemoveData("prevData");
    getMembers(getUserInfo);
  }, []);

  const getMembers = async (getUserInfo) => {
    const membersData = await FetchDoctors(projectData, getUserInfo?.hash);
    if (membersData) {
      setDoctorList(membersData.result);
      setMembers(membersData.data);
      setLoadMembers(false);
      // Recalculate stats after members are fetched
      setIsLoading(false);
      const updatedStats = stats(membersData.data, ui, projectData);
      setStats(updatedStats);
    } else {
      setLoadMembers(false);
      setIsLoading(false);
      setMembers([]);
    }
  };

  const handleApprove = async (member, comments) => {
    setApprovingStatus((prev) => ({ ...prev, [member.doctor_hash]: true }));
    try {
      await ApprovalAction(
        projectData,
        userInfo.hash,
        member,
        comments ? 2 : 1,
        comments,
      );
      await getMembers(userInfo);
    } catch (error) {
      console.error("Approval error:", error);
    } finally {
      setApprovingStatus((prev) => ({ ...prev, [member.doctor_hash]: false }));
    }
  };

  const editDoctor = async (member) => {
    let tempData = {
      ...member,
      mobile: member?.mobile?.replace(/^\+91/, "") || "",
      prefix: "Dr",
      photo: {
        croppedImage: member?.image,
        originalImage: member?.cropped_image,
      },
    };

    if (projectData?.config?.field?.length > 0) {
      projectData.config.field.forEach((field) => {
        const matchingField = member?.fields?.find(
          (f) => String(f.id) === String(field.id),
        );

        tempData[field.name] = matchingField
          ? matchingField.value
          : field.default_value || "";
      });
    }
    if (tempData) {
      localStorage.setItem("doctorHash", member.doctor_hash);
      EncryptData(`${member.doctor_hash}-prevData`, tempData);
      EncryptData(`${member.doctor_hash}-formData`, tempData);
      router.push(`register-new-candidate?dh=${member.doctor_hash}`);
    }
  };

  if (isLoading) {
    return (
      <LoadingPage
        projectData={projectData}
        ui={ui}
        loadingtext={"Loading the Dashboard..."}
        loadingTitle={projectData?.name}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <Header
        ui={ui}
        userInfo={userInfo}
        projectData={projectData}
        projectHash={projectId}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-8">
        {projectData?.config?.theme?.enable_dashboard === true && (
          <Dashboard
            members={doctorList}
            stats={statistics}
            ui={ui}
            projectData={projectData}
          />
        )}

        <div className="flex md:gap-10  md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div className="w-full md:w-auto">
            <h2 className="text-xl font-semibold">
              {ui.Dashboard.HomePageTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              {ui.Dashboard.HomePageSubTitle}
            </p>
          </div>

          <div className="flex  md:w-auto">
            {projectData?.config?.doctor?.enable_add_new_doctor &&
              userInfo.limit !== members?.length && (
                <Link
                  href={`register-new-candidate?dh=${generateRandomString(8)}-new`}
                >
                  <Button
                    type="button"
                    fullWidth={false}
                    leftIcon={
                      <FaUserPlus
                        style={{
                          fill: isDark
                            ? ui?.basic?.secondaryText || "white"
                            : ui?.basic?.primaryText || "white",
                        }}
                      />
                    }
                    ui={ui}
                  >
                    {ui.Dashboard.HomePageButtonLabel}
                  </Button>
                </Link>
              )}
            {projectData?.config?.doctor?.enable_add_new_doctor &&
              userInfo.limit == members?.length && (
                <Button
                  type="button"
                  fullWidth={false}
                  leftIcon={
                    <FaCircleNotch
                      style={{
                        fill: isDark
                          ? ui?.basic?.secondaryText || "white"
                          : ui?.basic?.primaryText || "white",
                      }}
                    />
                  }
                  ui={ui}
                >
                  Reached Limit
                </Button>
              )}
          </div>
        </div>
        {!loadMembers ? (
          <MemberTable
            ui={ui}
            projectData={projectData}
            userInfo={userInfo}
            members={members}
            approvalState={projectData.config.employee.approval_required}
            approvingStatus={approvingStatus}
            onEdit={(member) => editDoctor(member)}
            onApprove={handleApprove}
            onDisapprove={handleApprove}
          />
        ) : (
          <div className="mt-6 text-center text-gray-400">
            <FaFilm className="text-4xl mx-auto mb-2" />
            <p>Loading...</p>
          </div>
        )}
      </main>

      <Footer projectData={projectData} />
    </div>
  );
};

export default HomePage;

const stats = (members, ui, projectData) => {
  const total = (members && members?.length) || 1;
  const activeMembers =
    members && members?.length > 0
      ? projectData?.config?.employee?.approval_required
        ? members?.filter((member) => member?.download_url !== null)
        : members?.filter((member) => member?.approval_history.length >= 1)
      : 0;

  const pendingMembers =
    members && members?.length > 0
      ? projectData?.config?.employee?.approval_required
        ? members?.filter((member) => member?.photo_approval_status == 0)
        : members?.filter((member) => member?.approval_history.length == 0)
      : 0;

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
