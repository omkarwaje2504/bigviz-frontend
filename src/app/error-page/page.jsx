"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  FaBug,
  FaChevronRight,
  FaSync,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaLaptop,
  FaCheck,
  FaTimes,
  FaUser,
  FaClock,
  FaChartLine,
  FaCode,
  FaGlobe,
  FaDesktop,
  FaFireAlt,
  FaArrowUp,
  FaArrowDown,
  FaMoon,
  FaSun,
  FaFilter,
  FaBars,
  FaSearch,
  FaChevronLeft,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaChartBar,
  FaUsers,
  FaCog,
  FaBell,
  FaDownload,
  FaExpand,
} from "react-icons/fa";
import { IoLayers, IoRefresh } from "react-icons/io5";

const API = "https://error-tracking-api.vercel.app/api/error";

// Enhanced theme system with gradient support
const useTheme = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setIsDark(saved === "dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggleTheme };
};

// Modern status chip with enhanced styling
const getStatusChip = (status, isDark) => {
  const baseStyles =
    "px-3 py-1 text-xs font-semibold rounded-full shadow-sm border transition-all duration-200";
  const styles = {
    pending: isDark
      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20"
      : "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200 shadow-amber-200/50",
    resolved: isDark
      ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20"
      : "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-emerald-200/50",
    rejected: isDark
      ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-500/40 shadow-red-500/20"
      : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 shadow-red-200/50",
  };
  return `${baseStyles} ${styles[status] || (isDark ? "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border-gray-500/40" : "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200")}`;
};

// Enhanced priority calculation
const calculatePriority = (error, allErrors) => {
  const sameErrorCount = allErrors.filter(
    (e) => e.error.name === error.error.name,
  ).length;
  const hoursSinceError =
    (Date.now() - new Date(error.timestamp).getTime()) / (1000 * 60 * 60);

  let priority = 0;
  if (sameErrorCount > 10) priority += 3;
  else if (sameErrorCount > 5) priority += 2;
  else if (sameErrorCount > 1) priority += 1;

  if (hoursSinceError < 1) priority += 3;
  else if (hoursSinceError < 24) priority += 2;
  else if (hoursSinceError < 168) priority += 1;

  return Math.min(priority, 5);
};

// Modern priority badge
const getPriorityBadge = (priority, isDark) => {
  const baseStyles =
    "inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-bold shadow-sm";
  if (priority >= 4)
    return `${baseStyles} ${isDark ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/30" : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-300/50"}`;
  if (priority >= 3)
    return `${baseStyles} ${isDark ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-orange-500/30" : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-300/50"}`;
  if (priority >= 2)
    return `${baseStyles} ${isDark ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-yellow-500/30" : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-yellow-300/50"}`;
  return `${baseStyles} ${isDark ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-500/30" : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-300/50"}`;
};

// Enhanced loading skeleton
const LoadingSkeleton = ({ isDark }) => (
  <div className="space-y-4 p-4">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className={`p-2 rounded-xl shadow-lg ${isDark ? "bg-gradient-to-br from-gray-900 to-gray-800" : "bg-gradient-to-br from-white to-gray-50"} border ${isDark ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="animate-pulse">
          <div className="flex items-start space-x-4">
            <div
              className={`h-10 w-10 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-300"}`}
            ></div>
            <div className="flex-1 space-y-3">
              <div
                className={`h-4 ${isDark ? "bg-gray-700" : "bg-gray-300"} rounded-lg w-3/4`}
              ></div>
              <div
                className={`h-3 ${isDark ? "bg-gray-700" : "bg-gray-300"} rounded-lg w-1/2`}
              ></div>
              <div className="flex space-x-2">
                <div
                  className={`h-6 ${isDark ? "bg-gray-700" : "bg-gray-300"} rounded-full w-16`}
                ></div>
                <div
                  className={`h-6 ${isDark ? "bg-gray-700" : "bg-gray-300"} rounded-full w-12`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Modern button component
const ModernButton = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500/30 shadow-blue-500/30",
    success:
      "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 focus:ring-emerald-500/30 shadow-emerald-500/30",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 focus:ring-red-500/30 shadow-red-500/30",
    secondary:
      "bg-gradient-to-r from-gray-600 to-slate-600 text-white hover:from-gray-700 hover:to-slate-700 focus:ring-gray-500/30 shadow-gray-500/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-2",
    md: "px-4 py-1 text-sm gap-2",
    lg: "px-6 py-1 text-base gap-3",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function ErrorTrackingDashboard() {
  const { isDark, toggleTheme } = useTheme();
  const [rawErrors, setRawErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    dateRange: "",
    browser: "",
    os: "",
    errorType: "",
    userId: "",
    customFrom: "",
    customTo: "",
  });

  // Modern theme classes with gradients and shadows
  const themeClasses = {
    bg: isDark
      ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
      : "bg-gradient-to-br from-gray-50 via-white to-gray-100",
    text: isDark ? "text-gray-100" : "text-gray-900",
    border: isDark ? "border-gray-700/50" : "border-gray-200",
    cardBg: isDark
      ? "bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-sm"
      : "bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm",
    sidebarBg: isDark
      ? "bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-xl"
      : "bg-gradient-to-b from-white/95 to-gray-50/95 backdrop-blur-xl",
    inputBg: isDark
      ? "bg-gray-800/50 border-gray-600/50 focus:border-blue-500/50 backdrop-blur-sm"
      : "bg-white/80 border-gray-300 focus:border-blue-500 backdrop-blur-sm",
    hoverBg: isDark
      ? "hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-700/50"
      : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-white",
    mutedText: isDark ? "text-gray-400" : "text-gray-600",
    accent: isDark ? "text-blue-400" : "text-blue-600",
    shadow: isDark
      ? "shadow-2xl shadow-black/20"
      : "shadow-2xl shadow-gray-900/10",
  };

  // Fetch errors with refresh capability
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

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  // Process filters, sorting, and priority
  const processedErrors = useMemo(() => {
    let filtered = rawErrors.filter((error) => {
      const errorDate = new Date(error.timestamp);
      const today = new Date();

      // Search filter
      const searchMatch =
        !searchTerm ||
        error.error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.error.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.userId?.toLowerCase().includes(searchTerm.toLowerCase());

      // Date Range
      let dateMatch = true;
      if (filters.dateRange) {
        switch (filters.dateRange) {
          case "today":
            dateMatch = errorDate.toDateString() === today.toDateString();
            break;
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            dateMatch = errorDate.toDateString() === yesterday.toDateString();
            break;
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateMatch = errorDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date(
              today.getTime() - 30 * 24 * 60 * 60 * 1000,
            );
            dateMatch = errorDate >= monthAgo;
            break;
          case "custom":
            if (filters.customFrom && filters.customTo) {
              const fromDate = new Date(filters.customFrom);
              const toDate = new Date(filters.customTo);
              dateMatch = errorDate >= fromDate && errorDate <= toDate;
            }
            break;
        }
      }

      const statusMatch = !filters.status || error.status === filters.status;
      const browserMatch =
        !filters.browser ||
        error.deviceInfo.browser
          .toLowerCase()
          .includes(filters.browser.toLowerCase());
      const osMatch =
        !filters.os ||
        error.deviceInfo.os.toLowerCase().includes(filters.os.toLowerCase());
      const errorTypeMatch =
        !filters.errorType || error.error.name === filters.errorType;
      const userMatch = !filters.userId || error.userId === filters.userId;

      return (
        dateMatch &&
        statusMatch &&
        searchMatch &&
        browserMatch &&
        osMatch &&
        errorTypeMatch &&
        userMatch
      );
    });

    // Add priority
    filtered = filtered.map((error) => ({
      ...error,
      priority: calculatePriority(error, rawErrors),
    }));

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(
        (error) => error.priority >= parseInt(filters.priority),
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "timestamp":
          aVal = new Date(a.timestamp);
          bVal = new Date(b.timestamp);
          break;
        case "priority":
          aVal = a.priority;
          bVal = b.priority;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "errorType":
          aVal = a.error.name;
          bVal = b.error.name;
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [rawErrors, filters, sortBy, sortOrder, searchTerm]);

  // Dropdown values
  const uniqueValues = useMemo(
    () => ({
      errorTypes: [...new Set(rawErrors.map((e) => e.error.name))],
      browsers: [
        ...new Set(rawErrors.map((e) => e.deviceInfo?.browser).filter(Boolean)),
      ],
      operatingSystems: [
        ...new Set(rawErrors.map((e) => e.deviceInfo?.os).filter(Boolean)),
      ],
      users: [...new Set(rawErrors.map((e) => e.userId).filter(Boolean))],
    }),
    [rawErrors],
  );

  const updateErrorStatus = useCallback(async (id, status) => {
    setRawErrors((errors) =>
      errors.map((e) => (e._id === id ? { ...e, status } : e)),
    );
    try {
      await fetch(`${API}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      status: "",
      priority: "",
      dateRange: "",
      browser: "",
      os: "",
      errorType: "",
      userId: "",
      customFrom: "",
      customTo: "",
    });
    setSearchTerm("");
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const pending = processedErrors.filter(
      (e) => e.status === "pending",
    ).length;
    const resolved = processedErrors.filter(
      (e) => e.status === "resolved",
    ).length;
    const critical = processedErrors.filter((e) => e.priority >= 4).length;
    const uniqueUsers = new Set(processedErrors.map((e) => e.userId)).size;

    return { pending, resolved, critical, uniqueUsers };
  }, [processedErrors]);

  return (
    <div
      className={`flex flex-col min-h-screen ${themeClasses.bg} ${themeClasses.text} font-sans transition-all duration-500`}
    >
      {/* Modern Mobile Header */}
      <div
        className={`lg:hidden flex items-center justify-between p-4 ${themeClasses.sidebarBg} ${themeClasses.border} border-b ${themeClasses.shadow} backdrop-blur-xl sticky top-0 z-30`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-3 ${themeClasses.hoverBg} rounded-xl transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
          >
            <FaBars className="text-lg" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl shadow-lg shadow-red-500/30">
              <FaBug className="text-white text-lg" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Error Tracker
              </h1>
              <p className={`text-xs ${themeClasses.mutedText}`}>
                {rawErrors.length} errors tracked
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchErrors(true)}
            disabled={refreshing}
            className={`p-3 ${themeClasses.hoverBg} rounded-xl transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
          >
            <IoRefresh
              className={`${refreshing ? "animate-spin" : ""} text-lg`}
            />
          </button>
          <button
            onClick={toggleTheme}
            className={`p-3 ${themeClasses.hoverBg} rounded-xl transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
          >
            {isDark ? (
              <FaSun className="text-yellow-400 text-lg" />
            ) : (
              <FaMoon className="text-purple-400 text-lg" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Enhanced Sidebar */}
        <aside
          className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-50
          w-80 ${themeClasses.sidebarBg} ${themeClasses.border} border-r ${themeClasses.shadow}
          transition-transform duration-300 ease-in-out
          flex flex-col backdrop-blur-xl
        `}
        >
          {/* Desktop Header with Stats */}
          <header
            className={`hidden lg:block p-2 ${themeClasses.border} border-b`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl shadow-lg shadow-red-500/30">
                  <FaBug className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Error Tracker Pro
                  </h1>
                  <p className={`text-sm ${themeClasses.mutedText}`}>
                    Advanced Error Monitoring
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchErrors(true)}
                  disabled={refreshing}
                  className={`p-3 ${themeClasses.hoverBg} rounded-xl transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                >
                  <IoRefresh
                    className={`${refreshing ? "animate-spin text-blue-400" : ""} text-lg`}
                  />
                </button>
                <button
                  onClick={toggleTheme}
                  className={`p-3 ${themeClasses.hoverBg} rounded-xl transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                >
                  {isDark ? (
                    <FaSun className="text-yellow-400 text-lg" />
                  ) : (
                    <FaMoon className="text-purple-400 text-lg" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`${themeClasses.cardBg} rounded-xl p-4 ${themeClasses.border} border ${themeClasses.shadow}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FaExclamationTriangle className="text-amber-400" />
                  <span
                    className={`text-xs font-medium ${themeClasses.mutedText}`}
                  >
                    Pending
                  </span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {stats.pending}
                </p>
              </div>
              <div
                className={`${themeClasses.cardBg} rounded-xl p-4 ${themeClasses.border} border ${themeClasses.shadow}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FaFireAlt className="text-red-400" />
                  <span
                    className={`text-xs font-medium ${themeClasses.mutedText}`}
                  >
                    Critical
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-400">
                  {stats.critical}
                </p>
              </div>
            </div>
          </header>

          {/* Enhanced Search */}
          <div className={`p-2 ${themeClasses.border} border-b`}>
            <div className="relative">
              <FaSearch
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${themeClasses.mutedText} text-sm`}
              />
              <input
                type="text"
                placeholder="Search errors, users, messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-11 pr-4 py-1 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
              />
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="flex-1 overflow-y-auto">
            <div className={`p-2 ${themeClasses.border} border-b`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FaFilter className="text-blue-400" />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Filters
                  </span>
                </h3>
                <button
                  onClick={resetFilters}
                  className={`text-xs ${themeClasses.accent} hover:underline font-medium`}
                >
                  Reset All
                </button>
              </div>

              <div className="space-y-5">
                {/* Status Filter */}
                <div>
                  <label
                    className={`block text-sm font-semibold ${themeClasses.text} mb-1`}
                  >
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, status: e.target.value }))
                    }
                    className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">🟡 Pending</option>
                    <option value="resolved">🟢 Resolved</option>
                    <option value="rejected">🔴 Rejected</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label
                    className={`block text-sm font-semibold ${themeClasses.text} mb-1`}
                  >
                    Minimum Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, priority: e.target.value }))
                    }
                    className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                  >
                    <option value="">All Priorities</option>
                    <option value="1">🟢 Low (1+)</option>
                    <option value="2">🟡 Medium (2+)</option>
                    <option value="3">🟠 High (3+)</option>
                    <option value="4">🔴 Critical (4+)</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label
                    className={`block text-sm font-semibold ${themeClasses.text} mb-1`}
                  >
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, dateRange: e.target.value }))
                    }
                    className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                  >
                    <option value="">All Time</option>
                    <option value="today">📅 Today</option>
                    <option value="yesterday">📅 Yesterday</option>
                    <option value="week">📅 Last 7 Days</option>
                    <option value="month">📅 Last 30 Days</option>
                    <option value="custom">📅 Custom Range</option>
                  </select>
                </div>

                {filters.dateRange === "custom" && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-400/30">
                    <input
                      type="date"
                      value={filters.customFrom}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          customFrom: e.target.value,
                        }))
                      }
                      className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                    />
                    <input
                      type="date"
                      value={filters.customTo}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, customTo: e.target.value }))
                      }
                      className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                    />
                  </div>
                )}

                {/* Error Type Filter */}
                <div>
                  <label
                    className={`block text-sm font-semibold ${themeClasses.text} mb-1`}
                  >
                    Error Type
                  </label>
                  <select
                    value={filters.errorType}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, errorType: e.target.value }))
                    }
                    className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                  >
                    <option value="">All Types</option>
                    {uniqueValues.errorTypes.map((type) => (
                      <option key={type} value={type}>
                        🐛 {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Browser Filter */}
                <div>
                  <label
                    className={`block text-sm font-semibold ${themeClasses.text} mb-1`}
                  >
                    Browser
                  </label>
                  <select
                    value={filters.browser}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, browser: e.target.value }))
                    }
                    className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                  >
                    <option value="">All Browsers</option>
                    {uniqueValues.browsers.map((browser) => (
                      <option key={browser} value={browser}>
                        🌐 {browser}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OS Filter */}
                <div>
                  <label
                    className={`block text-sm font-semibold ${themeClasses.text} mb-1`}
                  >
                    Operating System
                  </label>
                  <select
                    value={filters.os}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, os: e.target.value }))
                    }
                    className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                  >
                    <option value="">All Operating Systems</option>
                    {uniqueValues.operatingSystems.map((os) => (
                      <option key={os} value={os}>
                        💻 {os}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Enhanced Sort */}
            <div className={`p-2`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <IoLayers className="text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Sort
                  </span>
                </h3>
                <button
                  onClick={() =>
                    setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                  }
                  className={`p-2 ${themeClasses.hoverBg} rounded-xl transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                >
                  {sortOrder === "asc" ? (
                    <FaArrowUp className="text-green-400" />
                  ) : (
                    <FaArrowDown className="text-red-400" />
                  )}
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full py-1 px-4 ${themeClasses.inputBg} rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
              >
                <option value="timestamp">🕐 Date & Time</option>
                <option value="priority">🔥 Priority Level</option>
                <option value="status">📊 Status</option>
                <option value="errorType">🐛 Error Type</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Enhanced Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Main Header with Advanced Stats */}
          <header
            className={`${themeClasses.cardBg} ${themeClasses.border} border-b ${themeClasses.shadow} backdrop-blur-xl sticky top-0 z-20`}
          >
            <div className="p-2">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg shadow-blue-500/30">
                    <FaChartLine className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Error Dashboard
                    </h2>
                    <p className={`text-sm ${themeClasses.mutedText}`}>
                      {processedErrors.length} errors • {stats.uniqueUsers}{" "}
                      affected users
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ModernButton variant="secondary" size="sm">
                    <FaDownload />
                    Export
                  </ModernButton>
                  <ModernButton variant="primary" size="sm">
                    <FaCog />
                    Settings
                  </ModernButton>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className={`${themeClasses.cardBg} rounded-xl p-4 ${themeClasses.border} border ${themeClasses.shadow} hover:shadow-2xl transition-all duration-300 group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FaExclamationTriangle className="text-amber-400 text-xl group-hover:scale-110 transition-transform duration-200" />
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">
                    {stats.pending}
                  </p>
                  <p
                    className={`text-xs ${themeClasses.mutedText} font-medium`}
                  >
                    Pending Review
                  </p>
                </div>

                <div
                  className={`${themeClasses.cardBg} rounded-xl p-4 ${themeClasses.border} border ${themeClasses.shadow} hover:shadow-2xl transition-all duration-300 group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FaCheckCircle className="text-emerald-400 text-xl group-hover:scale-110 transition-transform duration-200" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {stats.resolved}
                  </p>
                  <p
                    className={`text-xs ${themeClasses.mutedText} font-medium`}
                  >
                    Resolved
                  </p>
                </div>

                <div
                  className={`${themeClasses.cardBg} rounded-xl p-4 ${themeClasses.border} border ${themeClasses.shadow} hover:shadow-2xl transition-all duration-300 group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FaFireAlt className="text-red-400 text-xl group-hover:scale-110 transition-transform duration-200" />
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {stats.critical}
                  </p>
                  <p
                    className={`text-xs ${themeClasses.mutedText} font-medium`}
                  >
                    Critical Priority
                  </p>
                </div>

                <div
                  className={`${themeClasses.cardBg} rounded-xl p-4 ${themeClasses.border} border ${themeClasses.shadow} hover:shadow-2xl transition-all duration-300 group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FaUsers className="text-blue-400 text-xl group-hover:scale-110 transition-transform duration-200" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {stats.uniqueUsers}
                  </p>
                  <p
                    className={`text-xs ${themeClasses.mutedText} font-medium`}
                  >
                    Affected Users
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Enhanced Error List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <LoadingSkeleton isDark={isDark} />
            ) : processedErrors.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center h-96 ${themeClasses.cardBg} rounded-2xl ${themeClasses.shadow} border ${themeClasses.border}`}
              >
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full mb-3">
                  <FaBug className="text-4xl text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-1">No Errors Found</h3>
                <p
                  className={`${themeClasses.mutedText} text-center mb-3 max-w-md`}
                >
                  Great news! No errors match your current filters. Try
                  adjusting your search criteria or check back later.
                </p>
                {(Object.values(filters).some((v) => v) || searchTerm) && (
                  <ModernButton onClick={resetFilters} variant="primary">
                    <IoRefresh />
                    Clear All Filters
                  </ModernButton>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {processedErrors.map((error) => (
                  <div
                    key={error._id}
                    className={`${themeClasses.cardBg} rounded-2xl p-2 ${themeClasses.border} border ${themeClasses.shadow} cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group`}
                    onClick={() => setSelectedError(error)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 p-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-xl group-hover:from-red-500/30 group-hover:to-rose-500/30 transition-colors duration-300">
                        <FaBug className="text-red-400 text-xl" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-bold text-lg text-red-400 truncate group-hover:text-red-300 transition-colors duration-200">
                              {error.error.name}
                            </h3>
                            <span
                              className={getStatusChip(error.status, isDark)}
                            >
                              {error.status === "pending"
                                ? "⏳"
                                : error.status === "resolved"
                                  ? "✅"
                                  : "❌"}{" "}
                              {error.status}
                            </span>
                            <span
                              className={getPriorityBadge(
                                error.priority,
                                isDark,
                              )}
                            >
                              <FaFireAlt className="text-xs" />P{error.priority}
                            </span>
                          </div>
                          <FaChevronRight
                            className={`${themeClasses.mutedText} group-hover:text-blue-400 transition-colors duration-200 flex-shrink-0`}
                          />
                        </div>

                        <p
                          className={`text-sm ${themeClasses.mutedText} mb-1 line-clamp-2 group-hover:text-gray-300 transition-colors duration-200`}
                        >
                          {error.error.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <div
                            className={`flex items-center gap-2 ${themeClasses.mutedText}`}
                          >
                            <FaClock className="text-blue-400" />
                            <span className="hidden sm:inline">
                              {new Date(error.timestamp).toLocaleString()}
                            </span>
                            <span className="sm:hidden">
                              {new Date(error.timestamp).toLocaleDateString()}
                            </span>
                          </div>

                          <div
                            className={`flex items-center gap-2 ${themeClasses.mutedText}`}
                          >
                            <FaLaptop className="text-green-400" />
                            <span>{error.deviceInfo?.browser}</span>
                          </div>

                          <div
                            className={`flex items-center gap-2 ${themeClasses.mutedText}`}
                          >
                            <FaUser className="text-purple-400" />
                            <span className="truncate max-w-24">
                              {error.userId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Enhanced Detail Panel */}
        {selectedError && (
          <aside
            className={`
            ${selectedError ? "translate-x-0" : "translate-x-full"}
            fixed lg:static inset-y-0 right-0 z-50
            w-full lg:w-2/3 xl:w-1/2 ${themeClasses.sidebarBg} ${themeClasses.border} border-l ${themeClasses.shadow}
            transition-transform duration-500 ease-out
            overflow-y-auto flex flex-col backdrop-blur-xl
          `}
          >
            {/* Enhanced Detail Header */}
            <div
              className={`p-2 ${themeClasses.border} border-b ${themeClasses.shadow} sticky top-0 bg-gradient-to-r ${isDark ? "from-gray-900/95 to-gray-800/95" : "from-white/95 to-gray-50/95"} backdrop-blur-xl z-10`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedError(null)}
                    className={`lg:hidden p-3 ${themeClasses.hoverBg} rounded-xl transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                  >
                    <FaChevronLeft />
                  </button>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg shadow-blue-500/30">
                    <FaEye className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Error Details
                    </h3>
                    <p className={`text-sm ${themeClasses.mutedText}`}>
                      Detailed error analysis and actions
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <ModernButton
                    onClick={() =>
                      updateErrorStatus(selectedError._id, "resolved")
                    }
                    variant="success"
                    size="sm"
                  >
                    <FaCheck />
                    <span className="hidden sm:inline">Resolve</span>
                  </ModernButton>
                  <ModernButton
                    onClick={() =>
                      updateErrorStatus(selectedError._id, "rejected")
                    }
                    variant="danger"
                    size="sm"
                  >
                    <FaTimes />
                    <span className="hidden sm:inline">Reject</span>
                  </ModernButton>
                  <button
                    onClick={() => setSelectedError(null)}
                    className={`hidden lg:block p-2 ${themeClasses.hoverBg} rounded-xl transition-all duration-200 ${themeClasses.shadow} border ${themeClasses.border}`}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Error Summary Card */}
              <div
                className={`${themeClasses.cardBg} rounded-2xl p-2 ${themeClasses.border} border ${themeClasses.shadow}`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-xl text-red-400">
                    {selectedError.error.name}
                  </span>
                  <span className={getStatusChip(selectedError.status, isDark)}>
                    {selectedError.status === "pending"
                      ? "⏳"
                      : selectedError.status === "resolved"
                        ? "✅"
                        : "❌"}{" "}
                    {selectedError.status}
                  </span>
                  <span
                    className={getPriorityBadge(selectedError.priority, isDark)}
                  >
                    <FaFireAlt className="text-xs" />
                    Priority {selectedError.priority}
                  </span>
                </div>

                <div
                  className={`${isDark ? "bg-gray-800/50" : "bg-gray-100"} rounded-xl p-4 mb-1`}
                >
                  <p className="text-lg leading-relaxed">
                    {selectedError.error.message}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div
                    className={`flex items-center gap-2 ${themeClasses.mutedText}`}
                  >
                    <FaClock className="text-blue-400" />
                    <span>
                      {new Date(selectedError.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 ${themeClasses.mutedText}`}
                  >
                    <FaUser className="text-green-400" />
                    <span>{selectedError.userId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Detail Content */}
            <div className="flex-1 p-2 space-y-8">
              {/* Stack Trace Section */}
              <div>
                <h4 className="text-lg font-bold mb-1 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-lg">
                    <FaCode className="text-red-400" />
                  </div>
                  <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                    Stack Trace
                  </span>
                </h4>

                <div
                  className={`${isDark ? "bg-gray-950" : "bg-gray-100"} rounded-2xl p-2 ${themeClasses.shadow} border ${themeClasses.border} overflow-x-auto`}
                >
                  {selectedError.mappedStack?.length ? (
                    <div className="space-y-6">
                      {selectedError.mappedStack.map((frame, i) =>
                        frame.separator ? (
                          <hr
                            key={i}
                            className={`${themeClasses.border} border-dashed`}
                          />
                        ) : (
                          <article
                            key={i}
                            className={`${themeClasses.cardBg} rounded-xl p-5 ${themeClasses.border} border`}
                          >
                            <header className="text-yellow-500 font-bold mb-3 text-lg break-all pb-2 border-b border-yellow-500/20">
                              📁{" "}
                              {(frame.source || frame.fileName) ?? "<unknown>"}
                              <span className="text-blue-400">
                                :{frame.line}:{frame.column}
                              </span>
                            </header>
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                              {(frame.snippet ?? "<no snippet>")
                                .split("\\n")
                                .map((ln, idx) => (
                                  <code
                                    key={idx}
                                    className={
                                      ln.startsWith(">>")
                                        ? `block px-2 py-1 rounded ${isDark ? "bg-red-900/50 text-red-200 border-l-4 border-red-400" : "bg-red-100 text-red-800 border-l-4 border-red-500"}`
                                        : `block px-2 py-1 ${themeClasses.mutedText}`
                                    }
                                  >
                                    {ln}
                                  </code>
                                ))}
                            </pre>
                          </article>
                        ),
                      )}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {selectedError.error.stack}
                    </pre>
                  )}
                </div>
              </div>

              {/* Context Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {/* User Information */}
                <div
                  className={`${themeClasses.cardBg} rounded-2xl p-2 ${themeClasses.border} border ${themeClasses.shadow}`}
                >
                  <h4 className="text-lg font-bold mb-1 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg">
                      <FaUser className="text-blue-400" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      User Info
                    </span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl">
                      <span className={`${themeClasses.mutedText} font-medium`}>
                        User ID
                      </span>
                      <span className="font-mono text-sm bg-blue-500/20 px-2 py-1 rounded-lg">
                        {selectedError.userId}
                      </span>
                    </div>
                    {selectedError.geo && (
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl">
                        <span
                          className={`${themeClasses.mutedText} font-medium`}
                        >
                          Location
                        </span>
                        <span className="flex items-center gap-2 text-sm">
                          <FaMapMarkerAlt className="text-green-400" />
                          {selectedError.city}, {selectedError.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Information */}
                <div
                  className={`${themeClasses.cardBg} rounded-2xl p-2 ${themeClasses.border} border ${themeClasses.shadow}`}
                >
                  <h4 className="text-lg font-bold mb-1 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                      <FaDesktop className="text-green-400" />
                    </div>
                    <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      Device Info
                    </span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl">
                      <span className={`${themeClasses.mutedText} font-medium`}>
                        Browser
                      </span>
                      <span className="font-medium">
                        {selectedError.deviceInfo.browser}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl">
                      <span className={`${themeClasses.mutedText} font-medium`}>
                        OS
                      </span>
                      <span className="font-medium">
                        {selectedError.deviceInfo.os}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl">
                      <span className={`${themeClasses.mutedText} font-medium`}>
                        Screen
                      </span>
                      <span className="font-medium font-mono text-sm">
                        {selectedError.deviceInfo.screen}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Information */}
              <div
                className={`${themeClasses.cardBg} rounded-2xl p-2 ${themeClasses.border} border ${themeClasses.shadow}`}
              >
                <h4 className="text-lg font-bold mb-1 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                    <FaGlobe className="text-purple-400" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Page Information
                  </span>
                </h4>
                {selectedError.locationInfo?.url && (
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl">
                    <div className="flex items-start gap-3">
                      <FaExternalLinkAlt className="text-purple-400 mt-1 flex-shrink-0" />
                      <a
                        href={selectedError.locationInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 break-all font-mono text-sm underline decoration-dotted hover:decoration-solid transition-all duration-200"
                      >
                        {selectedError.locationInfo.url}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Statistics */}
              <div
                className={`${themeClasses.cardBg} rounded-2xl p-2 ${themeClasses.border} border ${themeClasses.shadow}`}
              >
                <h4 className="text-lg font-bold mb-1 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg">
                    <FaChartLine className="text-yellow-400" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Occurrence Statistics
                  </span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {
                        rawErrors.filter(
                          (e) => e.error.name === selectedError.error.name,
                        ).length
                      }
                    </div>
                    <div
                      className={`text-sm ${themeClasses.mutedText} font-medium`}
                    >
                      Total Occurrences
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {
                        new Set(
                          rawErrors
                            .filter(
                              (e) => e.error.name === selectedError.error.name,
                            )
                            .map((e) => e.userId),
                        ).size
                      }
                    </div>
                    <div
                      className={`text-sm ${themeClasses.mutedText} font-medium`}
                    >
                      Affected Users
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
