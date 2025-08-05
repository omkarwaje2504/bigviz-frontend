"use client";

import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";
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

  const currentTeam =
    selectionStack.length === 0
      ? hierarchyData
      : selectionStack[selectionStack.length - 1]?.team || [];

  const currentLevelMember = selectionStack.at(-1);
  const isMR = currentLevelMember?.role_name?.toLowerCase().includes("medical");

  useEffect(() => {
    const fetchMRDoctors = async () => {
      if (isMR) {
        setLoadingDoctors(true);
        const result = await FetchDoctors(projectData, currentLevelMember.hash);
        setDoctors(result?.data || []);
        setLoadingDoctors(false);
      } else {
        setDoctors([]); // Clear if not MR
      }
    };

    fetchMRDoctors();
  }, [currentLevelMember]);

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
        members={doctors}
        onEdit={(id) => alert(`Edit Doctor ID: ${id}`)}
        approvalState={true}
        onApprove={handleApproval}
        onDisapprove={handleEdit}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {currentTeam.map((member) => (
        <Card
          key={member.hash}
          name={member.name}
          role={member.role_name}
          icon={<UserIcon />}
          onClick={() => handleSelect(member)}
        />
      ))}
    </div>
  );
};

const Card = ({ name, onClick, role, icon }) => (
  <div
    className="cursor-pointer p-4 bg-white dark:bg-gray-800 border rounded-lg shadow hover:border-red-500 w-fit"
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
