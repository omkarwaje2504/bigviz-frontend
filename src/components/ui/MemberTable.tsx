"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  FaEye,
  FaEdit,
  FaDownload,
  FaFilm,
  FaSearch,
  FaSpinner,
  FaUser,
} from "react-icons/fa";
import InputField from "./InputField";
import { ImCross } from "react-icons/im";
import { FaCheck } from "react-icons/fa";
import slugify from "slugify";
import MyError from "@services/MyError";
// import CustomVideoPlayer from "./VideoPlayer";
import { MdOutlineCancel } from "react-icons/md";
import { RiArtboardFill } from "react-icons/ri";

interface History {
  approved_at: Date;
  employee_email: string;
  employee_name: string;
  role: number;
  status: "Approved" | "Pending" | "Declined" | "Delivered";
}

interface ApprovalLogic {
  roleNames: RoleNames;
  approvalStackNumbers: number[];
  approvalHistory: History[];
  approvedRoles: number[];
  disapprovedRoles: number[];
  nextApproverRole: number | null;
  currentUserCanApprove: boolean;
  userHasActed: boolean;
  allApproved: boolean;
  anyDisapproved: boolean;
  userInApprovalFlow: boolean;
  currentUser: Users;
}

interface Member {
  approval_history: History[];
  approved_at: string | null;
  approved_status: number;
  code: string | null;
  created_at: string;
  download_url: string;
  email: string | null;
  doctor_hash: string;
  mobile: string;
  name: string;
  image: string;
  values: Record<string, string>;
  updated_at: string;
}

interface Users {
  name: string;
  role: 1 | 2 | 3 | 4 | 5;
  designation: string | null;
  avatar: string | null;
  hash: string | null;
  code: string | null;
}

// Define role names type
type RoleNames = {
  [key: number]: string;
};

type MemberTableProps = {
  ui: any;
  projectData: {
    product_type: string;
    features: any;
    config: {
      doctor: {};
      employee: {
        approval_roles: string[];
        approval_required: boolean;
      };
    };
    product_name: string;
  };
  userInfo: Users;
  members: Member[];
  onEdit: (id: string) => void;
  approvalState?: boolean;
  onApprove?: (member: Member) => void;
  onDisapprove?: (member: Member) => void;
};

const ITEMS_PER_PAGE = 4;

const MemberTable: React.FC<MemberTableProps> = ({
  ui,
  projectData,
  userInfo,
  members,
  onEdit,
  approvalState,
  onApprove,
  onDisapprove,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);
  const [downloadingStatus, setDownloadingStatus] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewType, setPreviewType] = useState<
    "IMAGE" | "PDF" | "VIDEO" | ""
  >("");
  const [previewImageType, setPreviewImageType] = useState<string>("");

  const [approvalProgressStates, setApprovalProgressStates] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const result = members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) || (m.mobile || "").includes(term),
    );
    setFilteredMembers(result);
    setCurrentPage(1);
  }, [searchTerm, members]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleApprovalProgress = (memberHash: string) => {
    console.log(`Toggling approval progress for member: ${memberHash}`); // Debug line
    setApprovalProgressStates((prev) => {
      const newState = {
        ...prev,
        [memberHash]: !Boolean(prev[memberHash]), // Explicitly convert to boolean
      };
      console.log("New approval states:", newState); // Debug line
      return newState;
    });
  };

  const getApprovalLogic = (member: Member): ApprovalLogic => {
    const roleNames: RoleNames = {
      1: "mr",
      2: "abm",
      3: "rsm",
      4: "zsm",
      5: "nsm",
    };

    const orderedRoles = Object.values(roleNames);

    let approvalStack: string[] =
      projectData?.config?.employee?.approval_roles || [];

    approvalStack = approvalStack.sort((a: string, b: string) => {
      return orderedRoles.indexOf(a) - orderedRoles.indexOf(b);
    });

    const currentUser = userInfo;

    // Convert approval_stack (role names) to role numbers in order
    const approvalStackNumbers: number[] = approvalStack
      .map((roleName: string) => {
        const roleKey = Object.keys(roleNames).find(
          (key) =>
            roleNames[parseInt(key)].toLowerCase() === roleName.toLowerCase(),
        );
        return roleKey ? parseInt(roleKey) : 0;
      })
      .filter((num) => num > 0);

    const approvalHistory = member.approval_history || [];

    const approvedRoles: number[] = approvalHistory
      .filter((entry) => entry.status === "Approved")
      .map((entry) => entry.role);

    const disapprovedRoles: number[] = approvalHistory
      .filter((entry) => entry.status === "Declined")
      .map((entry) => entry.role);

    let nextApproverRole: number | null = null;
    let currentUserCanApprove = false;

    // If no approval history, first role can approve
    if (approvalHistory.length === 0) {
      nextApproverRole = approvalStackNumbers[0] || null;
      currentUserCanApprove = currentUser.role === nextApproverRole;
    } else {
      // Find next role in sequence
      for (let i = 0; i < approvalStackNumbers.length; i++) {
        const currentRoleInStack = approvalStackNumbers[i];

        if (
          !approvedRoles.includes(currentRoleInStack) &&
          !disapprovedRoles.includes(currentRoleInStack)
        ) {
          nextApproverRole = currentRoleInStack;

          const allPreviousRolesApproved = approvalStackNumbers
            .slice(0, i)
            .every((prevRole: number) => approvedRoles.includes(prevRole));

          if (
            currentUser.role === currentRoleInStack &&
            allPreviousRolesApproved &&
            disapprovedRoles.length === 0
          ) {
            currentUserCanApprove = true;
          }
          break;
        }
      }
    }

    const userHasActed: boolean = approvalHistory.some(
      (entry) => entry.role === currentUser.role,
    );

    const allApproved: boolean = approvalStackNumbers.every((roleNum: number) =>
      approvedRoles.includes(roleNum),
    );

    const anyDisapproved: boolean = disapprovedRoles.length > 0;

    // Check if user is in the approval flow
    const userInApprovalFlow = approvalStackNumbers.includes(currentUser.role);

    return {
      roleNames,
      approvalStackNumbers,
      approvalHistory,
      approvedRoles,
      disapprovedRoles,
      nextApproverRole,
      currentUserCanApprove,
      userHasActed,
      allApproved,
      anyDisapproved,
      userInApprovalFlow,
      currentUser,
    };
  };

  const onDownload = async (member: Member) => {
    const link = member.download_url;
    try {
      const response = await fetch(link, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setDownloadingStatus((prev) => [...prev, member.doctor_hash]);
      // @ts-expect-error this is a dynamic import
      const FileSaver = (await import("file-saverjs")).default;
      const contentBlob = await response.blob();

      switch (projectData.product_type) {
        case "PhotoFrame": {
          const fileExtension = "jpg";
          const fileName = `${slugify(member.name || "download", {
            replacement: "",
            remove: /[*+~.()'"!:@]/g,
            lower: false,
          })}.${fileExtension}`;
          FileSaver(contentBlob, fileName);
          break; // Added missing break
        }
        case "E-Greeting": {
          const fileExtension = projectData.features.includes("pdf_ecard")
            ? "pdf"
            : "jpg";
          const fileName = `${slugify(member.name || "download", {
            replacement: "",
            remove: /[*+~.()'"!:@]/g,
            lower: false,
          })}.${fileExtension}`;
          FileSaver(contentBlob, fileName);
          break; // Added missing break
        }
        case "E-Video": {
          const fileName = `${slugify(member.name || "download", {
            replacement: "",
            remove: /[*+~.()'"!:@]/g,
            lower: false,
          })}.mp4`;
          FileSaver(contentBlob, fileName);
          break; // Added missing break
        }
        default:
          break;
      }

      setDownloadingStatus((prev) =>
        prev.filter((hash) => hash !== member.doctor_hash),
      );
    } catch (error) {
      setDownloadingStatus((prev) =>
        prev.filter((h) => h !== member.doctor_hash),
      );
      console.error("Error saving the file:", error);
    }
  };

  const onPreview = async (member: Member, type: string) => {
    setPreviewMode(true);

    try {
      if (type === "DOCTOR_IMAGE") {
        setPreviewType("IMAGE");
        setPreviewImageType(type);
        setPreviewUrl(member.image || "");
      } else {
        setPreviewImageType("");
        switch (projectData.product_type) {
          case "PhotoFrame":
            setPreviewType("IMAGE");
            setPreviewUrl(member.download_url || "");
            break;

          case "E-Greeting":
            setPreviewType(
              projectData.features.includes("pdf_ecard") ? "PDF" : "IMAGE",
            );
            setPreviewUrl(member.download_url || "");
            break;

          case "E-Video":
            setPreviewType("VIDEO");
            setPreviewUrl(member.download_url || "");
            break;

          default:
            setPreviewMode(false);
            break;
        }
      }
    } catch (e) {
      console.error("Preview error", e);
      setPreviewMode(false);
    }
  };

  const renderApprovalButtons = (
    member: Member,
    isListView: boolean = false,
  ) => {
    const approval = getApprovalLogic(member);
    const {
      currentUserCanApprove,
      userHasActed,
      anyDisapproved,
      allApproved,
      userInApprovalFlow,
      approvalHistory,
      currentUser,
    } = approval;

    if (!approvalState) return null;

    console.log(currentUserCanApprove,userHasActed,approvalHistory)
    if ((currentUserCanApprove || userHasActed) && !anyDisapproved) {
      const userAction = approvalHistory.find(
        (entry) => entry.role === currentUser.role,
      );

      if (userAction?.status === "Approved") {
        // User has approved - show status + disapprove button
        return (
          <div
            className={`flex ${isListView ? "items-center space-x-2" : "gap-2 w-full items-center"}`}
          >
            <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-1 font-semibold">
              ✅ You Approved
            </span>
            <button
              className={
                isListView
                  ? ""
                  : "flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-red-600 p-2 rounded-sm hover:bg-red-700"
              }
              onClick={() => onDisapprove?.(member)}
              title="Disapprove"
            >
              {isListView ? (
                <ImCross className="fill-red-500 h-4 w-4 hover:fill-red-600" />
              ) : (
                <>
                  <ImCross className="fill-white mr-1" />
                  <span>Disapprove</span>
                </>
              )}
            </button>
          </div>
        );
      } else if (userAction?.status === "Declined") {
        // User has disapproved - show status + approve button
        return (
          <div
            className={`flex ${isListView ? "items-center space-x-2" : "gap-2 w-full items-center"}`}
          >
            <span className="text-xs bg-red-100 text-red-700 rounded px-2 py-1 font-semibold">
              ❌ You Disapproved
            </span>
            <button
              className={
                isListView
                  ? ""
                  : "flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-emerald-600 p-2 rounded-sm hover:bg-emerald-700"
              }
              onClick={() => onApprove?.(member)}
              title="Approve"
            >
              {isListView ? (
                <FaCheck className="fill-green-500 h-4 w-4 hover:fill-green-600" />
              ) : (
                <>
                  <FaCheck className="fill-white mr-1" />
                  <span>Approve</span>
                </>
              )}
            </button>
          </div>
        );
      } else {
        // User hasn't acted yet and it's their turn - show both buttons
        return (
          <div className={`flex ${isListView ? "space-x-2" : "gap-2 w-full"}`}>
            <button
              className={
                isListView
                  ? ""
                  : "flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-emerald-600 p-2 rounded-sm hover:bg-emerald-700"
              }
              onClick={() => onApprove?.(member)}
              title="Approve"
            >
              {isListView ? (
                <FaCheck className="fill-green-500 h-5 w-5 hover:fill-green-600" />
              ) : (
                <>
                  <FaCheck className="fill-white mr-1" />
                  <span>Approve</span>
                </>
              )}
            </button>
            <button
              className={
                isListView
                  ? ""
                  : "flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-red-600 p-2 rounded-sm hover:bg-red-700"
              }
              onClick={() => onDisapprove?.(member)}
              title="Disapprove"
            >
              {isListView ? (
                <ImCross className="fill-red-500 h-5 w-5 hover:fill-red-600" />
              ) : (
                <>
                  <ImCross className="fill-white mr-1" />
                  <span>Disapprove</span>
                </>
              )}
            </button>
          </div>
        );
      }
    } else {
      // Show status only - NO BUTTONS until it's user's turn
      return (
        <div className={isListView ? "text-xs" : "text-center"}>
          {allApproved ? (
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${isListView ? "bg-green-100 text-green-600" : "bg-green-100 text-green-700"}`}
            >
              ✅ {isListView ? "Approved" : "Fully Approved"}
            </span>
          ) : anyDisapproved ? (
            <div className="gap-2 flex">
              <button
                className={
                  isListView
                    ? ""
                    : "flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-emerald-600 p-2 rounded-sm hover:bg-emerald-700"
                }
                onClick={() => onApprove?.(member)}
                title="Approve"
              >
                {isListView ? (
                  <FaCheck className="fill-green-500 h-4 w-4 hover:fill-green-600" />
                ) : (
                  <>
                    <FaCheck className="fill-white mr-1" />
                    <span>Approve</span>
                  </>
                )}
              </button>

              <span
                className={`w-1/2 items-center pt-2 text-xs font-medium px-2 py-1 rounded ${isListView ? "bg-red-100 text-red-600" : "bg-red-100 text-red-700"}`}
              >
                ❌ {isListView ? "Stopped" : "You Disapproved"}
              </span>
            </div>
          ) : userInApprovalFlow ? (
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${isListView ? "bg-orange-100 text-orange-600" : "bg-orange-100 text-orange-700"}`}
            >
              ⏳{" "}
              {isListView
                ? "Pending"
                : `Waiting for ${approval.nextApproverRole ? approval.roleNames[approval.nextApproverRole]?.toUpperCase() : "previous"} approval`}
            </span>
          ) : (
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${isListView ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-700"}`}
            >
              👁️ View Only
            </span>
          )}
        </div>
      );
    }
  };

  const renderApprovalProgress = (member: Member) => {
    const approval = getApprovalLogic(member);
    // Use strict boolean check to prevent any undefined issues
    const isOpen = Boolean(approvalProgressStates[member.doctor_hash]);

    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Header with Toggle Button */}
        <button
          className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleApprovalProgress(member.doctor_hash);
          }}
        >
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Approval Progress:
          </div>
          <div className="flex items-center gap-2">
            {/* Progress indicator */}
            <span className="text-xs text-gray-500">
              {approval.approvedRoles.length}/
              {approval.approvalStackNumbers.length}
            </span>
            {/* Chevron icon */}
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Collapsible Content - Only shows for the specific member when isOpen is true */}
        {isOpen && (
          <div className="px-3 pb-3 space-y-2">
            {/* Show the complete approval flow */}
            <div className="space-y-1">
              {approval.approvalStackNumbers.map(
                (roleNum: number, index: number) => {
                  const roleName = approval.roleNames[roleNum];
                  const isApproved = approval.approvedRoles.includes(roleNum);
                  const isDisapproved =
                    approval.disapprovedRoles.includes(roleNum);
                  const isNext = roleNum === approval.nextApproverRole;
                  const isCurrentUser = approval.currentUser.role === roleNum;

                  return (
                    <div
                      key={roleNum}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4">
                          {index + 1}.
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-sm font-medium ${
                            isApproved
                              ? "bg-green-100 text-green-700"
                              : isDisapproved
                                ? "bg-red-100 text-red-700"
                                : isNext
                                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {roleName.toUpperCase()}
                          {isCurrentUser && " (You)"}
                        </span>
                      </div>

                      <div className="text-xs">
                        {isApproved ? (
                          <span className="text-green-600">✅ Approved</span>
                        ) : isDisapproved ? (
                          <span className="text-red-600">❌ Declined</span>
                        ) : isNext ? (
                          <span className="text-blue-600 font-medium">
                            ⏳ Pending
                          </span>
                        ) : (
                          <span className="text-gray-500">⏸️ Waiting</span>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {/* Show approval order */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Required Order:{" "}
                {approval.approvalStackNumbers
                  .map((roleNum: number) =>
                    approval.roleNames[roleNum].toUpperCase(),
                  )
                  .join(" → ")}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 text-gray-900 dark:text-white">
      {previewMode && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-10 bg-slate-900/80 transition-all duration-300 ease-in-out">
          <div className="flex flex-col items-center justify-center p-3 w-full md:max-w-[50%] h-full max-h-[75%] relative">
            <MdOutlineCancel
              className="w-10 h-10 fill-white mb-2 z-10 self-end cursor-pointer"
              onClick={() => setPreviewMode(false)}
            />

            {/* Image Preview */}
            {previewType === "IMAGE" && (
              <div className="w-full h-full flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain border-4 border-white rounded-2xl overflow-hidden"
                  />
                ) : previewImageType === "DOCTOR_IMAGE" ? (
                  <div className="w-64 h-64 p-10 bg-gray-800 flex flex-col items-center justify-center">
                    <FaUser className="text-4xl text-gray-400" />
                    No Doctor Photo
                  </div>
                ) : (
                  <div className="w-64 h-64 p-10 bg-gray-800 flex flex-col items-center justify-center">
                    <RiArtboardFill className="text-6xl text-gray-400" />
                    No Artwork Uploaded
                  </div>
                )}
              </div>
            )}

            {/* PDF Preview */}
            {previewType === "PDF" && previewUrl && (
              <div className="w-full h-full">
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-4 border-white rounded-2xl"
                  title="PDF Preview"
                />
              </div>
            )}

            {/* Video Preview */}
            {previewType === "VIDEO" && previewUrl && (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  controls
                  className="max-w-full max-h-full border-4 border-white rounded-2xl"
                  src={previewUrl}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex w-full items-center gap-2 mb-4">
        <div className="w-full">
          <InputField
            ui={ui}
            id="search"
            label=""
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients or ads..."
            icon={<FaSearch className="text-gray-400" />}
          />
        </div>
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg inline-flex text-sm h-10 mb-3">
          <button
            className={`px-3 py-0.5 rounded ${
              viewMode === "grid"
                ? "bg-red-600 text-white"
                : "text-gray-700 dark:text-gray-400"
            }`}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
          <button
            className={`px-3 py-0.5 rounded ${
              viewMode === "list"
                ? "bg-red-600 text-white"
                : "text-gray-700 dark:text-gray-400"
            }`}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
        </div>
      </div>

      {/* Grid or List */}
      {viewMode === "grid" ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          key={currentPage}
        >
          {paginatedMembers.map((member) => (
            <div
              key={member.doctor_hash}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-lg hover:border-red-500 transition-all"
            >
              <div className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 relative overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center dark:bg-gray-700">
                    {member?.image ? (
                      <div
                        className="relative w-full h-[200px] rounded overflow-hidden cursor-pointer"
                        onClick={() => onPreview(member, "DOCTOR_IMAGE")}
                      >
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          quality={10}
                          blurDataURL={member.image}
                          sizes="(max-width: 640px) 100px, (min-width: 641px) 150px, (min-width: 1024px) 200px"
                          className="object-cover object-top opacity-50"
                        />
                      </div>
                    ) : (
                      <FaUser
                        className="text-4xl text-gray-400 cursor-pointer"
                        onClick={() => onPreview(member, "DOCTOR_IMAGE")}
                      />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-medium px-1 py-0.5 rounded ${
                        member.download_url
                          ? "bg-green-500/20 text-green-600 dark:text-green-400"
                          : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {member.download_url
                        ? "Artwork Generated"
                        : "Artwork Pending"}
                    </span>

                    <h3 className="font-bold text-lg">{member.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {member.mobile}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Added on{" "}
                      {new Date(
                        member.updated_at ?? member.created_at,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between gap-2">
                    <button
                      className="w-full justify-center flex items-center space-x-1 text-xs text-white bg-blue-600 p-2 rounded-sm"
                      onClick={() => onPreview(member, "PREVIEW")}
                    >
                      <FaEye />
                      <span>Preview</span>
                    </button>
                    <button
                      className="w-full justify-center flex items-center space-x-1 text-xs text-white bg-purple-600 p-2 rounded-sm"
                      onClick={() => onEdit(member.doctor_hash)}
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                    <button
                      className="w-full justify-center flex items-center space-x-1 text-xs text-white bg-green-600 p-2 rounded-sm"
                      onClick={() => onDownload(member)}
                    >
                      {downloadingStatus.includes(member.doctor_hash) ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaDownload />
                      )}
                      <span>
                        {downloadingStatus.includes(member.doctor_hash)
                          ? "Downloading"
                          : "Download"}
                      </span>
                    </button>
                  </div>
                  {approvalState && (
                    <div className="flex-1 mt-1 flex flex-col items-center justify-center space-y-2 w-full">
                      <div className="w-full">
                        <div className="mb-3">
                          {renderApprovalButtons(member)}
                        </div>
                        {/* Approval Status Breakdown - Collapsible */}
                        {renderApprovalProgress(member)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-200 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Mobile No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Date Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-300 dark:divide-gray-800">
              {paginatedMembers.map((member) => {
                const approval = getApprovalLogic(member);

                return (
                  <tr
                    key={member.doctor_hash}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">
                        <p>{member.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 block md:hidden">
                          {member.mobile}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      {member.mobile}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {new Date(
                        member.updated_at ?? member.created_at,
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {projectData?.config?.employee?.approval_required &&
                      userInfo.role !== 1 ? (
                        <div className="flex flex-col gap-1">
                          {/* Main Status */}
                          {approval.allApproved ? (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-green-500/20 text-green-600 dark:text-green-400">
                              ✅ Fully Approved
                            </span>
                          ) : approval.anyDisapproved ? (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                              ❌ Process Stopped
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400">
                              ⏳ Waiting for{" "}
                              {approval.nextApproverRole
                                ? approval.roleNames[
                                    approval.nextApproverRole
                                  ]?.toUpperCase()
                                : "approval"}
                            </span>
                          )}

                          {/* Progress indicator */}
                          <span className="text-xs text-gray-500">
                            {approval.approvedRoles.length}/
                            {approval.approvalStackNumbers.length} approved
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-medium px-1 py-0.5 rounded ${
                            member.download_url
                              ? "bg-green-500/20 text-green-600 dark:text-green-400"
                              : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {member.download_url
                            ? "Artwork Generated"
                            : "Artwork Pending"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        {/* Preview/Edit/Download buttons */}
                        {member.download_url && (
                          <button
                            onClick={() => onPreview(member, "PREVIEW")}
                            title="Preview"
                          >
                            <FaEye className="w-5 h-5 fill-yellow-500 hover:fill-yellow-600" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(member.doctor_hash)}
                          title="Edit"
                        >
                          <FaEdit className="w-5 h-5 fill-purple-500 hover:fill-purple-600" />
                        </button>
                        <button
                          onClick={() => onDownload(member)}
                          title="Download"
                        >
                          {downloadingStatus.includes(member.doctor_hash) ? (
                            <FaSpinner className="animate-spin w-5 h-5 fill-blue-500" />
                          ) : (
                            <FaDownload className="w-5 h-5 fill-blue-500 hover:fill-blue-600" />
                          )}
                        </button>

                        {/* Approval buttons */}
                        {renderApprovalButtons(member, true)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => {
            const page = idx + 1;
            const startPage = Math.max(1, currentPage - 1);
            const endPage = Math.min(totalPages, startPage + 3);

            // Only render buttons between startPage and endPage
            if (page < startPage || page > endPage) return null;

            return (
              <button
                key={page}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === page
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            );
          })}
          <button
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Empty state */}
      {filteredMembers.length === 0 && (
        <div className="mt-6 text-center text-gray-400">
          <FaFilm className="text-4xl mx-auto mb-2" />
          <p>No members match your search.</p>
        </div>
      )}
    </div>
  );
};

export default MemberTable;
