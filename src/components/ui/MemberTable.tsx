"use client";

import React, { useState, useEffect } from "react";
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
// import CustomVideoPlayer from "./VideoPlayer";
// import { MdOutlineCancel } from "react-icons/md";

interface Member {
  approved_at: string | null;
  approved_status: number;
  code: string | null;
  created_at: string;
  download: string;
  email: string | null;
  hash: string;
  mobile: string;
  name: string;
  photo?: {
    extension: string;
    name: string;
    path: string;
    size: string;
    url: string;
    updated_at: string;
  };
  values: Record<string, string>;
  updated_at: string;
}

type MemberTableProps = {
  projectData: {
    features: string[];
    product_name: string;
  };
  members: Member[];
  onEdit: (id: string) => void;
  approvalState?: boolean;
  onApprove?: (id: string) => void;
  onDisapprove?: (id: string) => void;
};

const ITEMS_PER_PAGE = 4;

const MemberTable: React.FC<MemberTableProps> = ({
  projectData,
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
  // const [showVideoPlayer, setShowVideoPlayer] = useState("");

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

  function cleanUrl(url: string): string {
    if (!url) {
      return "";
    }
    const prefixToRemove =
      "https://pixpro.s3.ap-south-1.amazonaws.com/production";
    if (url.startsWith(prefixToRemove)) {
      url = url.slice(prefixToRemove.length);
    }
    if (url.startsWith("/")) {
      url = url.slice(1);
    }
    url = url.replace(/%3A/g, ":");
    return url;
  }

  const onDownload = async (member: Member) => {
    const link = member.download;
    const cleanLink = cleanUrl(link);
    try {
      const response = await fetch(cleanLink, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setDownloadingStatus((prev) => [...prev, member.hash]);
      // @ts-expect-error this is a dynamic import
      const FileSaver = (await import("file-saverjs")).default;
      const contentBlob = await response.blob();
      switch (projectData.product_name) {
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
          setDownloadingStatus((prev) =>
            prev.filter((hash) => hash !== member.hash),
          );
        }
        case "E-Video": {
          const fileName = `${slugify(member.name || "download", {
            replacement: "",
            remove: /[*+~.()'"!:@]/g,
            lower: false,
          })}.mp4`;
          FileSaver(contentBlob, fileName);
          setDownloadingStatus((prev) =>
            prev.filter((hash) => hash !== member.hash),
          );
        }
      }
    } catch (error) {
      setDownloadingStatus((prev) => prev.filter((h) => h !== member.hash));
      console.error("Error saving the video:", error);
    }
  };

  return (
    <div className="mt-6 text-gray-900 dark:text-white">
      {/* {showVideoPlayer !== "" && showVideoPlayer !== "undefined" && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-10 bg-slate-900/80 dark:bg-slate-900/80 transition-all duration-300 ease-in-out">
          <div className="flex flex-col items-end">
            <MdOutlineCancel
              className="w-10 h-10 fill-white  z-10"
              onClick={() => setShowVideoPlayer("")}
            />
            <CustomVideoPlayer
              poster="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFZx_ZFEsimWyth-dYgdYyFTbovP44kKiWog&s"
              src={showVideoPlayer}
            />
          </div>
        </div>
      )} */}
      {/* Controls */}
      <div className="flex w-full items-center gap-2 mb-4">
        <div className="w-full">
          <InputField
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
              key={member.hash}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-lg hover:border-red-500 transition-all"
            >
              <div className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 relative overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center dark:bg-gray-700">
                    {member?.photo?.url ? (
                      <div className="relative w-full h-[200px] rounded overflow-hidden">
                        <Image
                          src={member.photo?.url}
                          alt={member.name}
                          fill
                          quality={10}
                          blurDataURL={member.photo?.url}
                          sizes="(max-width: 640px) 100px, (min-width: 641px) 150px, (min-width: 1024px) 200px"
                          className="object-cover object-top opacity-50"
                        />
                      </div>
                    ) : (
                      <FaUser className="text-4xl text-gray-400" />
                    )}
                  </div>
                  <div>
                    {projectData?.features.includes("aproval_system") ? (
                      <span
                        className={`text-xs font-medium px-1 py-0.5 rounded ${
                          member.approved_status === 1
                            ? "bg-green-500/20 text-green-600 dark:text-green-400"
                            : member.approved_status === 0
                              ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                              : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {member.approved_status === 1 ? "Approved" : " Pending"}
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-medium px-1 py-0.5 rounded ${
                          member.download
                            ? "bg-green-500/20 text-green-600 dark:text-green-400"
                            : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {member.download ? "Completed" : " Pending"}
                      </span>
                    )}
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
                <div className="mt-2 ">
                  <div className="flex justify-between gap-2">
                    <button
                      className="w-full justify-center flex items-center space-x-1 text-xs text-white bg-blue-600 p-2 rounded-sm"
                      // onClick={() =>
                      //   setShowVideoPlayer(cleanUrl(member.download))
                      // }
                    >
                      <FaEye />
                      <span>Preview</span>
                    </button>
                    <button
                      className="w-full justify-center flex items-center space-x-1 text-xs text-white bg-purple-600 p-2 rounded-sm"
                      onClick={() => onEdit(member.hash)}
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                    <button
                      className="w-full justify-center flex items-center space-x-1 text-xs text-white bg-green-600 p-2 rounded-sm"
                      onClick={() => onDownload(member)}
                    >
                      {downloadingStatus.includes(member.hash) ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaDownload />
                      )}
                      <span>
                        {downloadingStatus.includes(member.hash)
                          ? "Downloading"
                          : "Download"}
                      </span>
                    </button>
                  </div>
                  {approvalState && (
                    <div className="flex-1 mt-1 flex items-center justify-center space-x-2 w-full">
                      {member.approved_status == 1 ? (
                        <>
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            ✅ Approved
                          </span>
                          <button
                            className="flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-red-600 p-2 rounded-sm"
                            onClick={() => onDisapprove?.(member.hash)}
                          >
                            <ImCross className="fill-white mr-1" />
                            <span>Disapprove</span>
                          </button>
                        </>
                      ) : member.approved_status == 0 ? (
                        <>
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                            ❌ Disapproved
                          </span>
                          <button
                            className="flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-emerald-600 p-2 rounded-sm"
                            onClick={() => onApprove?.(member.hash)}
                          >
                            <FaCheck className="fill-white mr-1" />
                            <span>Approve</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-emerald-600 p-2 rounded-sm"
                            onClick={() => onApprove?.(member.hash)}
                          >
                            <FaCheck className="fill-white mr-1" />
                            <span>Approve</span>
                          </button>
                          <button
                            className="flex-1 flex items-center justify-center space-x-1 text-xs text-white bg-red-600 p-2 rounded-sm"
                            onClick={() => onDisapprove?.(member.hash)}
                          >
                            <ImCross className="fill-white mr-1" />
                            <span>Disapprove</span>
                          </button>
                        </>
                      )}
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
              {paginatedMembers.map((member) => (
                <tr
                  key={member.hash}
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
                    {projectData?.features.includes("aproval_system") ? (
                      <span
                        className={`text-xs font-medium px-1 py-0.5 rounded ${
                          member.approved_status === 1
                            ? "bg-green-500/20 text-green-600 dark:text-green-400"
                            : member.approved_status === 0
                              ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                              : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {member.approved_status === 1 ? "Approved" : " Pending"}
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-medium px-1 py-0.5 rounded ${
                          member.download
                            ? "bg-green-500/20 text-green-600 dark:text-green-400"
                            : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {member.download ? "Completed" : " Pending"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-4">
                      <button
                      // onClick={() =>
                      //   setShowVideoPlayer(cleanUrl(member.download))
                      // }
                      >
                        <FaEye className="w-5 h-5 fill-yellow-500 hover:bg-gray-700" />
                      </button>
                      <button onClick={() => onEdit(member.hash)}>
                        <FaEdit className="w-5 h-5 fill-purple-500 hover:bg-gray-700" />
                      </button>
                      <button onClick={() => onDownload(member)}>
                        {downloadingStatus.includes(member.hash) ? (
                          <FaSpinner className="animate-spin w-5 h-5 fill-blue-500" />
                        ) : (
                          <FaDownload className="w-5 h-5 fill-blue-500 hover:bg-gray-700" />
                        )}
                      </button>
                      {approvalState && (
                        <>
                          {member.approved_status == 1 ? (
                            <>
                              <span className="text-xs text-green-600 font-semibold">
                                ✅ Approved
                              </span>
                              <button
                                onClick={() => onDisapprove?.(member.hash)}
                              >
                                <ImCross className="fill-red-500 h-5 w-5 hover:bg-gray-700 ml-2" />
                              </button>
                            </>
                          ) : member.approved_status == 0 ? (
                            <>
                              <span className="text-xs text-red-600 font-semibold">
                                ❌ Disapproved
                              </span>
                              <button onClick={() => onApprove?.(member.hash)}>
                                <FaCheck className="fill-green-500 h-5 w-5 hover:bg-gray-700 ml-2" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => onApprove?.(member.hash)}>
                                <FaCheck className="fill-green-500 h-5 w-5 hover:bg-gray-700" />
                              </button>
                              <button
                                onClick={() => onDisapprove?.(member.hash)}
                              >
                                <ImCross className="fill-red-500 h-5 w-5 hover:bg-gray-700" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
