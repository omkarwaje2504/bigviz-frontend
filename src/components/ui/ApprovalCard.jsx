"use client";

import { useEffect, useState } from "react";
import { FaUserLarge } from "react-icons/fa6";
import MemberTable from "./MemberTable";
import { FetchDoctors } from "@actions/user";

const ApprovalCard = ({
  ui,
  projectData,
  userInfo,
  hierarchyData,
  selectionStack,
  setSelectionStack,
  handleApproval,
  handleEdit,
}) => {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [approvalTriggered, setApprovalTriggered] = useState(false);
  const [approvingStatus, setApprovingStatus] = useState({});

  const currentTeam =
    selectionStack.length === 0
      ? hierarchyData
      : selectionStack[selectionStack.length - 1]?.team || [];

  const currentLevelMember = selectionStack.at(-1);
  const isMR = currentLevelMember?.role_name?.toLowerCase().includes("medical");

  useEffect(() => {
    if (isMR) {
      fetchMRDoctors();
    } else {
      setDoctors([]); // Clear if not MR
    }
  }, [currentLevelMember, isMR]);

  useEffect(() => {
    let timeoutId;
    if (isMR && approvalTriggered) {
      timeoutId = setTimeout(() => {
        fetchMRDoctors();
        setApprovalTriggered(false); // Reset the trigger
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [approvalTriggered, isMR]);

  const fetchMRDoctors = async () => {
    if (isMR) {
      setLoadingDoctors(true);
      const result = await FetchDoctors(projectData, currentLevelMember.hash);
      setDoctors(result?.data || []);
      setLoadingDoctors(false);
    } else {
      setDoctors([]);
    }
  };

  const handleApprovalWithRefresh = async (...args) => {
    setApprovingStatus((prev) => ({ ...prev, [member.doctor_hash]: true }));
    try {
      await handleApproval(...args);

      if (isMR) {
        setApprovalTriggered(true);
      }
    } catch (error) {
      console.error("Approval error:", error);
      console.clear();
    } finally {
      setApprovingStatus((prev) => ({ ...prev, [member.doctor_hash]: false }));
    }
  };

  const handleSelect = (person) => {
    setSelectionStack([...selectionStack, person]);
  };

  if (isMR) {
    if (loadingDoctors) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-600 dark:text-gray-300">Loading doctors...</p>
        </div>
      );
    }

    return (
      <MemberTable
        ui={ui}
        projectData={projectData}
        userInfo={userInfo}
        members={doctors}
        onEdit={handleEdit}
        approvalState={true}
        approvingStatus={approvingStatus}
        onApprove={handleApprovalWithRefresh}
        onDisapprove={handleApprovalWithRefresh}
      />
    );
  }
  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-4">
      {currentTeam.map((member) => (
        <Card
          key={member.hash}
          name={member.name}
          role={member.role_name}
          icon={
            <FaUserLarge
              style={{
                fill: ui.basic.secondaryColor,
              }}
            />
          }
          onClick={() => handleSelect(member)}
        />
      ))}
    </div>
  );
};

const Card = ({ name, onClick, role, icon }) => (
  <div
    className="cursor-pointer p-4 bg-white dark:bg-gray-800 border rounded-lg shadow hover:border-red-500 w-full md:w-fit"
    onClick={onClick}
  >
    <div className="flex items-center space-x-2 mb-2">
      {icon}
      <div className="flex flex-col">
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-xs">{role}</p>
      </div>
    </div>
  </div>
);

const UserIcon = () => (
  <FaUser className="text-4xl text-yellow-500 bg-gray-600 p-2 border border-gray-400 rounded-md" />
);

export default ApprovalCard;
