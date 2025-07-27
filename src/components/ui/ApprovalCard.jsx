"use client";
import { FaUser } from "react-icons/fa";
import MemberTable from "@components/ui/MemberTable";

const ApprovalCard = ({
  projectData,
  selectedASM,
  selectedRSM,
  selectedMR,
  setSelectedASM,
  setSelectedMR,
  setSelectedRSM,
  handleApproval,
  handleEdit,
}) => {
  if (!selectedRSM) {
    return hierarchy.RSMs.map((rsm) => (
      <Card
        key={rsm.id}
        name={rsm.name}
        role="RSM"
        icon={
          <FaUser className="text-4xl text-yellow-500 bg-gray-600 p-2 border border-gray-400 rounded-md" />
        }
        onClick={() => setSelectedRSM(rsm)}
      />
    ));
  }
  if (!selectedASM) {
    return selectedRSM.ASMs.map((asm) => (
      <Card
        key={asm.id}
        name={asm.name}
        role="ASM"
        icon={
          <FaUser className="text-4xl text-yellow-500 bg-gray-600 p-2 border border-gray-400 rounded-md" />
        }
        onClick={() => setSelectedASM(asm)}
      />
    ));
  }
  if (!selectedMR) {
    return selectedASM.MRs.map((mr) => (
      <Card
        key={mr.id}
        name={mr.name}
        role="MR"
        icon={
          <FaUser className="text-4xl text-yellow-500 bg-gray-600 p-2 border border-gray-400 rounded-md" />
        }
        onClick={() => setSelectedMR(mr)}
      />
    ));
  }

  return (
    <div className="w-full">
      <MemberTable
        projectData={projectData}
        members={selectedMR?.doctors || []}
        onEdit={(id) => alert(`Edit Doctor ID: ${id}`)}
        approvalState={true}
        onApprove={handleApproval}
        onDisapprove={handleEdit}
      />
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

export default ApprovalCard;

const hierarchy = {
  RSMs: [
    {
      id: 1,
      name: "Omkar Waje",
      ASMs: [
        {
          id: 10,
          name: "Rohit Sharmas",
          MRs: [
            {
              id: 100,
              name: "MR A1a",
              doctors: [
                {
                  id: 1001,
                  name: "Dr. Omkar Waje",
                  status: "Pending",
                  speciality: "Cardiologist",
                  dateAdded: "2025-05-12",
                },
                {
                  id: 1,
                  name: "Omkar Waje",
                  speciality: "Cardiologist",
                  dateAdded: "2025-05-12",
                  status: "Active",
                  preview: "/previews/ad1.mp4",
                  imageUrl:
                    "https://img.freepik.com/free-photo/beautiful-young-female-doctor-looking-camera-office_1301-7807.jpg?semt=ais_hybrid&w=740",
                  approvalStatus: "disapproved",
                },
                {
                  id: 2,
                  name: "Rohini Patil",
                  speciality: "Dermatologist",
                  dateAdded: "2025-05-10",
                  status: "Pending",
                  preview: "/previews/ad2.mp4",
                  imageUrl:
                    "https://img.freepik.com/free-photo/beautiful-young-female-doctor-looking-camera-office_1301-7807.jpg?semt=ais_hybrid&w=740",
                  approvalStatus: "approved",
                },
                {
                  id: 3,
                  name: "Sweta Patil",
                  speciality: "Otolaryngologist",
                  dateAdded: "2025-05-08",
                  status: "Active",
                  preview: "/previews/ad3.mp4",
                  imageUrl:
                    "https://img.freepik.com/free-photo/beautiful-young-female-doctor-looking-camera-office_1301-7807.jpg?semt=ais_hybrid&w=740",
                  approvalStatus: "pending",
                },
                {
                  id: 4,
                  name: "Vedant Thakur",
                  speciality: "Orthopedic Surgeon",
                  dateAdded: "2025-05-07",
                  status: "Active",
                  preview: "/previews/ad4.mp4",
                  imageUrl: "",
                },
                {
                  id: 5,
                  name: "EduSmart Academy",
                  speciality: "New Course Enrollment",
                  dateAdded: "2025-05-05",
                  status: "Inactive",
                  preview: "/previews/ad5.mp4",
                  imageUrl: "",
                },
                {
                  id: 6,
                  name: "FitLife Gym",
                  speciality: "Membership Promotion",
                  dateAdded: "2025-05-03",
                  status: "Active",
                  preview: "/previews/ad6.mp4",
                  imageUrl: "/",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
