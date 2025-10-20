"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  FaBug,
  FaCheck,
  FaTimes,
  FaUser,
  FaClock,
  FaLaptop,
  FaArrowUp,
  FaArrowDown,
  FaMoon,
  FaSun,
  FaSearch,
  FaChevronLeft,
  FaChevronDown,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUsers,
  FaEye,
  FaMapMarkerAlt,
  FaCode,
  FaPlay,
  FaPause,
  FaFilter,
  FaBuilding,
  FaUserTie,
} from "react-icons/fa";
import { IoRefresh, IoClose } from "react-icons/io5";

const API = "https://error-tracking-api.vercel.app/api/error";

/* ============== Theme hook ============== */
const useTheme = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setIsDark(saved === "dark");
    } else {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
    }
  }, []);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggleTheme };
};

/* ============== UI atoms ============== */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    secondary:
      "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
    ghost:
      "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
  };
  const sizes = {
    xs: "px-2 py-1 text-xs gap-1",
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const StatusChip = ({ status }) => {
  const cfg = configs[status] || configs.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.icon} {status}
    </span>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ============== Filters ============== */
const FilterPanel = ({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  resetFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex items-center gap-2"
        >
          <FaFilter />
          Filters
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          >
            <option value="timestamp">Date</option>
            <option value="status">Status</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters({ ...filters, dateRange: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============== Individual Error Card ============== */
const ErrorCard = ({ error, onView, onDelete, isSelected, onToggleSelect }) => {
  const checked = isSelected?.(error._id) || false;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <input
            type="checkbox"
            className="mt-1"
            checked={checked}
            onChange={() => onToggleSelect?.(error._id)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1 min-w-0" onClick={() => onView(error)}>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-red-600 dark:text-red-400 truncate text-sm">
                {error.error.name}
              </h4>
              <StatusChip status={error.status} />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
              {error.error.message}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <FaClock className="text-gray-400" />
                <span>
                  {new Date(error.timestamp).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FaLaptop className="text-gray-400" />
                <span>{error.deviceInfo?.browser || "Unknown"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 ml-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onView(error)}
            className="p-1"
          >
            <FaEye />
          </Button>

          <Button
            variant="danger"
            size="xs"
            onClick={() => onDelete(error._id)}
            className="p-1"
          >
            <IoClose />
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ============== Error Type Group (Level 3) ============== */
const ErrorTypeGroup = ({
  errorType,
  errors,
  onView,
  onDelete,
  isSelected,
  toggleSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const errorCount = errors.length;
  const latestError = errors[0];

  const groupAllChecked = errors.every((e) => isSelected?.(e._id));

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden ml-8">
      <div
        className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={groupAllChecked}
              onChange={(e) => {
                e.stopPropagation();
                if (groupAllChecked) {
                  errors.forEach((it) => toggleSelect(it._id));
                } else {
                  errors.forEach((it) => {
                    if (!isSelected(it._id)) toggleSelect(it._id);
                  });
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-red-600 dark:text-red-400 text-sm">
                  {errorType}
                </h4>
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-md">
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 line-clamp-1">
                {latestError.error.message}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last: {new Date(latestError.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusChip status={latestError.status} />
            <FaChevronDown
              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-3 space-y-2">
          {errors.map((error) => (
            <ErrorCard
              key={error._id}
              error={error}
              onView={onView}
              onDelete={onDelete}
              isSelected={isSelected}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ============== Employee Group (Level 2) ============== */
const EmployeeGroup = ({
  employeeCode,
  employeeName,
  errorTypeGroups,
  onView,
  onResolve,
  onDelete,
  isSelected,
  toggleSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all errors from all error types under this employee
  const allErrors = Object.values(errorTypeGroups).flat();
  const errorCount = allErrors.length;
  const errorTypeCount = Object.keys(errorTypeGroups).length;

  const groupAllChecked = allErrors.every((e) => isSelected?.(e._id));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ml-4">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={groupAllChecked}
              onChange={(e) => {
                e.stopPropagation();
                if (groupAllChecked) {
                  allErrors.forEach((it) => toggleSelect(it._id));
                } else {
                  allErrors.forEach((it) => {
                    if (!isSelected(it._id)) toggleSelect(it._id);
                  });
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FaUserTie className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {employeeName || "Unknown Employee"}
                </h3>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                  Code: {employeeCode}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span>{errorCount} total errors</span>
                <span>•</span>
                <span>{errorTypeCount} error types</span>
              </div>
            </div>
          </div>

          <FaChevronDown
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {Object.entries(errorTypeGroups)
            .sort(([, a], [, b]) => b.length - a.length) // Sort by error count
            .map(([errorType, errors]) => (
              <ErrorTypeGroup
                key={errorType}
                errorType={errorType}
                errors={errors}
                onView={onView}
                onResolve={onResolve}
                onDelete={onDelete}
                isSelected={isSelected}
                toggleSelect={toggleSelect}
              />
            ))}
        </div>
      )}
    </div>
  );
};

/* ============== Project Group (Level 1) ============== */
const ProjectGroup = ({
  projectId,
  employeeGroups,
  onView,
  onResolve,
  onDelete,
  isSelected,
  toggleSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Projects expanded by default

  // Get all errors from all employees under this project
  const allErrors = Object.values(employeeGroups)
    .map((emp) => Object.values(emp.errorTypeGroups))
    .flat(2);

  const errorCount = allErrors.length;
  const employeeCount = Object.keys(employeeGroups).length;
  const uniqueErrorTypes = new Set(allErrors.map((e) => e.error.name)).size;

  const groupAllChecked = allErrors.every((e) => isSelected?.(e._id));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={groupAllChecked}
              onChange={(e) => {
                e.stopPropagation();
                if (groupAllChecked) {
                  allErrors.forEach((it) => toggleSelect(it._id));
                } else {
                  allErrors.forEach((it) => {
                    if (!isSelected(it._id)) toggleSelect(it._id);
                  });
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FaBuilding className="text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Project: {projectId}
                </h2>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-md">
                  {errorCount} errors
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <FaUsers className="text-gray-400" />
                  <span>{employeeCount} employees</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaBug className="text-gray-400" />
                  <span>{uniqueErrorTypes} error types</span>
                </div>
              </div>
            </div>
          </div>

          <FaChevronDown
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {Object.entries(employeeGroups)
            .sort(([, a], [, b]) => {
              const aCount = Object.values(a.errorTypeGroups).flat().length;
              const bCount = Object.values(b.errorTypeGroups).flat().length;
              return bCount - aCount; // Sort by error count
            })
            .map(([employeeCode, employeeData]) => (
              <EmployeeGroup
                key={employeeCode}
                employeeCode={employeeCode}
                employeeName={employeeData.employeeName}
                errorTypeGroups={employeeData.errorTypeGroups}
                onView={onView}
                onResolve={onResolve}
                onDelete={onDelete}
                isSelected={isSelected}
                toggleSelect={toggleSelect}
              />
            ))}
        </div>
      )}
    </div>
  );
};

/* ============== Detail view ============== */
const ErrorDetail = ({ error, onBack, onResolve, onReject }) => {
  const employeeDetails = error.deviceInfo?.employeeDetails || {};
  const locationInfo = error.locationInfo || {};
  const deviceInfo = error.deviceInfo || {};
  const mappedStack = error.mappedStack || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 p-4">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={onBack}>
            <FaChevronLeft />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="success" onClick={() => onResolve(error._id)}>
              <FaCheck />
              Resolve
            </Button>
            <Button variant="danger" onClick={() => onReject(error._id)}>
              <FaTimes />
              Reject
            </Button>
          </div>
        </div>
      </header>
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
              {error.error.name}
            </h1>
            <StatusChip status={error.status} />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-gray-800 dark:text-gray-200 font-medium">
              {error.error.message}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                <FaClock />
                Error Details
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Time:</span>{" "}
                  {new Date(error.timestamp).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
                <p>
                  <span className="font-medium">User ID:</span>{" "}
                  {error.userId || "Unknown"}
                </p>
                <p>
                  <span className="font-medium">Project ID:</span>{" "}
                  {error.projectId || "Unknown"}
                </p>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                <FaLaptop />
                Device Information
              </h3>
              <div className="space-y-2 text-sm">
                {deviceInfo.browser && (
                  <p>
                    <span className="font-medium">Browser:</span>{" "}
                    {deviceInfo.browser}
                  </p>
                )}
                {deviceInfo.os && (
                  <p>
                    <span className="font-medium">OS:</span> {deviceInfo.os}
                  </p>
                )}
                {deviceInfo.device && (
                  <p>
                    <span className="font-medium">Device:</span>{" "}
                    {deviceInfo.device}
                  </p>
                )}
                {deviceInfo.screen && (
                  <p>
                    <span className="font-medium">Screen:</span>{" "}
                    {deviceInfo.screen}
                  </p>
                )}
              </div>
            </div>

            {employeeDetails.code && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                  <FaUser />
                  Employee Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {employeeDetails.name || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">Code:</span>{" "}
                    {employeeDetails.code}
                  </p>
                  <p>
                    <span className="font-medium">Role:</span>{" "}
                    {employeeDetails.role_name || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">Designation:</span>{" "}
                    {employeeDetails.designation || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">Region:</span>{" "}
                    {employeeDetails.region || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">Zone:</span>{" "}
                    {employeeDetails.zone || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">HQ:</span>{" "}
                    {employeeDetails.hq || "Unknown"}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                <FaMapMarkerAlt />
                Location Information
              </h3>
              <div className="space-y-2 text-sm">
                {locationInfo.url && (
                  <p className="truncate">
                    <span className="font-medium">URL:</span>
                    <a
                      href={locationInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                    >
                      {locationInfo.url}
                    </a>
                  </p>
                )}
                {locationInfo.referrer && (
                  <p className="truncate">
                    <span className="font-medium">Referrer:</span>{" "}
                    {locationInfo.referrer}
                  </p>
                )}
                {(error.city || error.state || error.country) && (
                  <p>
                    <span className="font-medium">Location:</span>{" "}
                    {[error.city, error.state, error.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FaCode />
              Stack Trace
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              {mappedStack.length > 0 ? (
                <div className="space-y-4">
                  {mappedStack.map((frame, index) => {
                    if (frame.separator) {
                      return (
                        <div
                          key={index}
                          className="border-t border-gray-700 my-3"
                        />
                      );
                    }
                    return (
                      <div key={index} className="text-sm font-mono">
                        {frame.function && (
                          <div className="text-blue-400 mb-1">
                            at {frame.function}
                            {frame.source &&
                              ` (${frame.source}:${frame.line}:${frame.column})`}
                          </div>
                        )}
                        {frame.snippet && (
                          <pre className="text-green-400 bg-gray-800 p-3 rounded-md overflow-x-auto mt-1">
                            {frame.snippet}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <pre className="text-green-400 text-sm overflow-x-auto">
                  {error.error.stack}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============== Main dashboard ============== */
export default function ErrorTrackingDashboard() {
  const { isDark, toggleTheme } = useTheme();
  const [rawErrors, setRawErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
  });
  const [viewMode, setViewMode] = useState("hierarchical");
  const prevErrorIdsRef = useRef(new Set());

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Fetch errors
  const fetchErrors = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setRawErrors(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto refresh
  useEffect(() => {
    fetchErrors();
    if (autoRefresh) {
      const interval = setInterval(() => fetchErrors(true), 30000);
      return () => clearInterval(interval);
    }
  }, [fetchErrors, autoRefresh]);

  // Title flash on new errors
  useEffect(() => {
    const prevIds = prevErrorIdsRef.current;
    const currentIds = new Set(rawErrors.map((e) => e._id));
    const newErrorIds = [...currentIds].filter((id) => !prevIds.has(id));
    prevErrorIdsRef.current = currentIds;

    const originalTitle = "Error Tracker";
    if (newErrorIds.length > 0) {
      let flash = false;
      const flashInterval = setInterval(() => {
        document.title = flash
          ? `(${newErrorIds.length})❗ New Errors | Error Tracker`
          : originalTitle;
        flash = !flash;
      }, 1000);
      return () => {
        clearInterval(flashInterval);
        document.title = originalTitle;
      };
    } else {
      document.title = originalTitle;
    }
  }, [rawErrors]);

  // Process errors: filter, sort
  const processedErrors = useMemo(() => {
    let filtered = rawErrors.filter((error) => {
      const q = searchTerm.toLowerCase();
      const searchMatch =
        !searchTerm ||
        error.error.message?.toLowerCase().includes(q) ||
        error.error.name?.toLowerCase().includes(q) ||
        error.userId?.toLowerCase().includes(q) ||
        error.projectId?.toLowerCase().includes(q) ||
        error.deviceInfo?.employeeDetails?.code?.toLowerCase().includes(q) ||
        error.deviceInfo?.employeeDetails?.name?.toLowerCase().includes(q);

      const statusMatch = !filters.status || error.status === filters.status;

      let dateMatch = true;
      if (filters.dateRange) {
        const errorDate = new Date(error.timestamp);
        const today = new Date();

        switch (filters.dateRange) {
          case "today":
            dateMatch = errorDate.toDateString() === today.toDateString();
            break;
          case "week": {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateMatch = errorDate >= weekAgo;
            break;
          }
          case "month": {
            const monthAgo = new Date(
              today.getTime() - 30 * 24 * 60 * 60 * 1000,
            );
            dateMatch = errorDate >= monthAgo;
            break;
          }
        }
      }

      return searchMatch && statusMatch && dateMatch;
    });

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "timestamp":
          aVal = new Date(a.timestamp);
          bVal = new Date(b.timestamp);
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }
      return sortOrder === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
          ? 1
          : -1;
    });

    return filtered;
  }, [rawErrors, filters, sortBy, sortOrder, searchTerm]);

  // Hierarchical grouping: ProjectID -> Employee Code -> Error Type
  const hierarchicalGroups = useMemo(() => {
    const groups = {};

    processedErrors.forEach((error) => {
      const projectId = error.projectId || "Unknown Project";
      const employeeCode =
        error.deviceInfo?.employeeDetails?.code || "Unknown Employee";
      const employeeName =
        error.deviceInfo?.employeeDetails?.name || "Unknown Name";
      const errorType = error.error.name || "Unknown Error";

      // Initialize project group if not exists
      if (!groups[projectId]) {
        groups[projectId] = {};
      }

      // Initialize employee group if not exists
      if (!groups[projectId][employeeCode]) {
        groups[projectId][employeeCode] = {
          employeeName,
          errorTypeGroups: {},
        };
      }

      // Initialize error type group if not exists
      if (!groups[projectId][employeeCode].errorTypeGroups[errorType]) {
        groups[projectId][employeeCode].errorTypeGroups[errorType] = [];
      }

      // Add error to the appropriate group
      groups[projectId][employeeCode].errorTypeGroups[errorType].push(error);
    });

    // Sort errors within each group by timestamp
    Object.values(groups).forEach((projectGroup) => {
      Object.values(projectGroup).forEach((employeeGroup) => {
        Object.values(employeeGroup.errorTypeGroups).forEach(
          (errorTypeGroup) => {
            errorTypeGroup.sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
            );
          },
        );
      });
    });

    return groups;
  }, [processedErrors]);

  // Simple list view (fallback)
  const simpleErrors = useMemo(() => {
    return processedErrors;
  }, [processedErrors]);

  // Reset filters
  const resetFilters = () => {
    setFilters({ status: "", dateRange: "" });
    setSearchTerm("");
  };

  // Single update status
  const updateErrorStatus = async (id, status) => {
    if (!ALLOWED_STATUSES.includes(status)) return;
    setRawErrors((errors) =>
      errors.map((e) => (e._id === id ? { ...e, status } : e)),
    );
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchErrors(true);
    }
  };

  // Single delete
  const deleteError = async (id) => {
    setRawErrors((errors) => errors.filter((e) => e._id !== id));
    try {
      await fetch(API, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error("Failed to delete error:", err);
      fetchErrors(true);
    }
  };

  // Bulk helpers
  const bulkUpdateStatus = async (ids, status) => {
    if (!ids?.length || !ALLOWED_STATUSES.includes(status)) return;
    setRawErrors((errors) =>
      errors.map((e) => (ids.includes(e._id) ? { ...e, status } : e)),
    );
    try {
      await fetch(API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
    } catch (err) {
      console.error("Bulk status update failed:", err);
      fetchErrors(true);
    }
  };

  const bulkDelete = async (ids) => {
    if (!ids?.length) return;
    setRawErrors((errors) => errors.filter((e) => !ids.includes(e._id)));
    try {
      await fetch(API, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.error("Bulk delete failed:", err);
      fetchErrors(true);
    }
  };

  // Bulk on all visible
  const resolveAll = async () => {
    const ids = processedErrors.map((e) => e._id);
    await bulkUpdateStatus(ids, "resolved");
    clearSelection();
  };

  const rejectAll = async () => {
    const ids = processedErrors.map((e) => e._id);
    await bulkUpdateStatus(ids, "rejected");
    clearSelection();
  };

  const deleteAll = async () => {
    const ids = processedErrors.map((e) => e._id);
    await bulkDelete(ids);
    clearSelection();
  };

  const deleteSelected = async () => {
    const ids = processedErrors
      .filter((e) => selectedIds.has(e._id))
      .map((e) => e._id);
    await bulkDelete(ids);
    clearSelection();
  };

  // Selection helpers
  const allVisibleSelected = useMemo(() => {
    if (processedErrors.length === 0) return false;
    for (const e of processedErrors) if (!selectedIds.has(e._id)) return false;
    return true;
  }, [processedErrors, selectedIds]);

  const someVisibleSelected = useMemo(() => {
    for (const e of processedErrors) if (selectedIds.has(e._id)) return true;
    return false;
  }, [processedErrors, selectedIds]);

  const countVisibleSelected = useMemo(() => {
    let count = 0;
    for (const e of processedErrors) if (selectedIds.has(e._id)) count++;
    return count;
  }, [processedErrors, selectedIds]);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = processedErrors.every((e) => next.has(e._id));
      if (allSelected) {
        processedErrors.forEach((e) => next.delete(e._id));
      } else {
        processedErrors.forEach((e) => next.add(e._id));
      }
      return next;
    });
  }, [processedErrors]);

  // Detail view
  if (selectedError) {
    return (
      <ErrorDetail
        error={selectedError}
        onBack={() => setSelectedError(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Total Error Count */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <FaBug className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Error Tracker
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monitor and resolve application errors
              </p>
            </div>
            {/* Total Error Count in Navbar */}
            <div className="ml-6 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Total: {rawErrors.length} errors
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={
                autoRefresh ? "text-green-600 dark:text-green-400" : ""
              }
            >
              {autoRefresh ? <FaPause /> : <FaPlay />}
              <span className="hidden sm:inline">
                {autoRefresh ? "Pause" : "Auto-Refresh"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchErrors(true)}
              disabled={refreshing}
            >
              <IoRefresh className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDark ? <FaSun /> : <FaMoon />}
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          resetFilters={resetFilters}
        />

        {/* View + Selection + Bulk actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {allVisibleSelected
                  ? "Unselect All Visible"
                  : "Select All Visible"}
              </span>
              {someVisibleSelected && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {countVisibleSelected} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                View:
              </span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("hierarchical")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === "hierarchical"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : ""
                  }`}
                >
                  Project Hierarchy
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : ""
                  }`}
                >
                  Simple List
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="danger"
              size="sm"
              onClick={deleteSelected}
              disabled={!someVisibleSelected}
            >
              <IoClose />
              Delete Selected
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={deleteAll}
              disabled={processedErrors.length === 0}
            >
              <IoClose />
              Delete All
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {processedErrors.length} of {rawErrors.length} errors
          </p>
          {Object.values(filters).some((v) => v) || searchTerm ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : null}
        </div>

        {/* Error Display */}
        <div className="space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : processedErrors.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full inline-block mb-4">
                <FaBug className="text-3xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No errors found
              </h3>

              <Button variant="primary" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          ) : viewMode === "hierarchical" ? (
            <div className="space-y-6">
              {Object.entries(hierarchicalGroups)
                .sort(([, a], [, b]) => {
                  // Sort projects by total error count
                  const aCount = Object.values(a).reduce(
                    (acc, emp) =>
                      acc + Object.values(emp.errorTypeGroups).flat().length,
                    0,
                  );
                  const bCount = Object.values(b).reduce(
                    (acc, emp) =>
                      acc + Object.values(emp.errorTypeGroups).flat().length,
                    0,
                  );
                  return bCount - aCount;
                })
                .map(([projectId, employeeGroups]) => (
                  <ProjectGroup
                    key={projectId}
                    projectId={projectId}
                    employeeGroups={employeeGroups}
                    onView={setSelectedError}
                    onDelete={deleteError}
                    isSelected={isSelected}
                    toggleSelect={toggleSelect}
                  />
                ))}
            </div>
          ) : (
            <div className="space-y-3">
              {simpleErrors.map((error) => (
                <ErrorCard
                  key={error._id}
                  error={error}
                  onView={setSelectedError}
                  onDelete={deleteError}
                  isSelected={isSelected}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Error Tracking Dashboard • Built with React & Next.js</p>
        </div>
      </footer>
    </div>
  );
}
