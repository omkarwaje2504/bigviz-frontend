"use client";

import { useEffect, useState } from "react";
import Header from "@components/ui/Header";
import Footer from "@components/ui/Footer";
import LoadingPage from "@components/ui/LoadingPage";
import Dashboard from "@components/ui/Dashboard";
import { FaUser } from "react-icons/fa";
import Config from "@utils/Config";
import Button from "@components/ui/Button";
import ApprovalCard from "@components/ui/ApprovalCard";

const renderDashboardStats = (ui) => [
  { label: "Approved", value: 5, change: "+2%" },
  { label: "Disapproved", value: 1, change: "-1%" },
  { label: "Pending", value: 3, change: "+5%" },
];

const userInfo = { name: "John Doe", role: "NSM" };

const ApprovalPage = ({ projectData }) => {
  const ui = Config(projectData);
  const [loading, setLoading] = useState(true);
  const [selectedRSM, setSelectedRSM] = useState(null);
  const [selectedASM, setSelectedASM] = useState(null);
  const [selectedMR, setSelectedMR] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const getBreadcrumb = () => {
    const crumbs = ["NSM"];
    if (selectedRSM) crumbs.push(selectedRSM.name);
    if (selectedASM) crumbs.push(selectedASM.name);
    if (selectedMR) crumbs.push(selectedMR.name);
    return crumbs;
  };

  const handleBack = () => {
    if (selectedMR) {
      setSelectedMR(null);
    } else if (selectedASM) {
      setSelectedASM(null);
    } else if (selectedRSM) {
      setSelectedRSM(null);
    }
  };

  const handleApproval = (doctorId) => {
    alert("Approved doctor with ID: " + doctorId);
  };

  const handleEdit = (doctorId) => {
    alert("Edit doctor with ID: " + doctorId);
  };

  if (loading) {
    return <LoadingPage ui={ui} loadingtext="Loading approval system..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Header userInfo={userInfo} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Dashboard stats={renderDashboardStats(ui)} ui={ui} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div className="w-full md:w-auto">
            <h2 className="text-xl font-semibold">
              {ui.ApprovalPageTitle.HomePageTitle}
            </h2>
            <nav className="text-sm text-gray-600 dark:text-gray-300 mb-4 ">
              {getBreadcrumb().map((crumb, i, arr) => (
                <span key={i} className="hover:text-yellow-500 cursor-pointer">
                  {crumb}
                  {i !== arr.length - 1 && " / "}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            {(selectedRSM || selectedASM || selectedMR) && (
              <Button type="button" onClick={handleBack}>
                ← Back
              </Button>
            )}
          </div>
        </div>

        <div className="w-full">
          <ApprovalCard
            projectData={projectData}
            selectedASM={selectedASM}
            selectedMR={selectedMR}
            selectedRSM={selectedRSM}
            setSelectedASM={setSelectedASM}
            setSelectedMR={setSelectedMR}
            setSelectedRSM={setSelectedRSM}
            handleApproval={handleApproval}
            handleEdit={handleEdit}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApprovalPage;
