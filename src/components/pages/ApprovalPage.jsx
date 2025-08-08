"use client";

import { useEffect, useState } from "react";
import Header from "@components/ui/Header";
import Footer from "@components/ui/Footer";
import LoadingPage from "@components/ui/LoadingPage";
import Dashboard from "@components/ui/Dashboard";
import Button from "@components/ui/Button";
import ApprovalCard from "@components/ui/ApprovalCard";
import { DecryptData, EncryptData, RemoveData } from "@utils/cryptoUtils";
import { ApprovalAction } from "@actions/approvalApis";

const ApprovalPage = ({ projectData, projectId, ui }) => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: 1,
    designation: "Medical Representative",
    avatar: "/images/avatar.jpg",
    hash: "",
    code: "",
  });

  const [hierarchy, setHierarchy] = useState([]); // top-level (RSMs)
  const [selectionStack, setSelectionStack] = useState([]); // [RSM, ZSM, ABM, MR]
  const [statistics, setStatistics] = useState([]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const getUserInfo = DecryptData("empData");
    if (getUserInfo) {
      setUserInfo({
        name: getUserInfo?.name,
        role: getUserInfo?.role,
        designation: getUserInfo?.role_name,
        hash: getUserInfo?.hash,
        code: getUserInfo?.code,
      });
    }
    console.log(getUserInfo);
    setHierarchy(getUserInfo?.team);
    const getStats = stats(hierarchy, ui, projectData);
    setStatistics(getStats);

    RemoveData("formData");
  }, []);

  const handleBack = () => {
    setSelectionStack((prev) => prev.slice(0, -1));
  };

  const handleApproval = async (member, comments) => {
    const approvalCheck = await ApprovalAction(
      projectData,
      userInfo.hash,
      member,
      comments ? 2 : 1,
      comments,
    );
  };

  const handleEdit = (doctorId) => {
    alert("Edit doctor with ID: " + doctorId);
  };

  const getBreadcrumb = () => {
    const rootLabel = () => {
      switch (userInfo.role) {
        case 1:
          return "MR";
        case 2:
          return "ABM";
        case 3:
          return "RSM";
        case 4:
          return "ZSM";
        case 5:
          return "NSM";

        default:
          break;
      }
    };
    return [
      rootLabel(),
      ...selectionStack.map((person) => {
        switch (person.role) {
          case 1:
            return "MR";
          case 2:
            return "ABM";
          case 3:
            return "RSM";
          case 4:
            return "ZSM";
          case 5:
            return "NSM";

          default:
            break;
        }
      }),
    ];
  };

  if (loading) {
    return (
      <LoadingPage
        ui={ui}
        loadingtext="Loading approval system..."
        loadingTitle={projectData.name}
      />
    );
  }
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Header
        userInfo={userInfo}
        projectData={projectData}
        projectHash={projectId}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Dashboard stats={statistics} ui={ui} projectData={projectData} />

        <div className="flex flex-col md:flex-row w-full justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div className="w-full md:w-auto ">
            <h2 className="text-xl font-semibold">
              {ui.ApprovalPageTitle?.HomePageTitle || "Approval Page"}
            </h2>

            <nav className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {getBreadcrumb().map((crumb, i, arr) => (
                <span key={i} className="hover:text-yellow-500 cursor-pointer">
                  {crumb}
                  {i !== arr.length - 1 && " / "}
                </span>
              ))}
            </nav>
          </div>

          {selectionStack.length > 0 && (
            <div>
              <Button type="button" onClick={handleBack} ui={ui}>
                ← Back
              </Button>
            </div>
          )}
        </div>

        <div className="w-full">
          <ApprovalCard
            ui={ui}
            userInfo={userInfo}
            projectData={projectData}
            hierarchyData={hierarchy}
            selectionStack={selectionStack}
            setSelectionStack={setSelectionStack}
            handleApproval={handleApproval}
            handleEdit={handleEdit}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

const stats = (members, ui, projectData) => {
  const total = members.length || 1;

  const activeMembers = !projectData?.config?.employee.approval_required
    ? members.filter((member) => member.download !== null)
    : members.filter((member) => member.approved_status == 1);

  const pendingMembers = !projectData?.config?.employee.approval_required
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

export default ApprovalPage;
