"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  FaBug,
  FaChevronRight,
  FaLaptop,
  FaCheck,
  FaTimes,
  FaUser,
  FaClock,
  FaCode,
  FaGlobe,
  FaDesktop,
  FaFireAlt,
  FaArrowUp,
  FaArrowDown,
  FaMoon,
  FaSun,
  FaSearch,
  FaChevronLeft,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUsers,
  FaPlay,
  FaPause,
  FaChartLine,
  FaMapMarkerAlt,
  FaEye,
} from "react-icons/fa";
import { IoRefresh, IoClose } from "react-icons/io5";

const API = "https://error-tracking-api.vercel.app/api/error";

// Compact theme hook
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
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggleTheme };
};

// Compact status chip
const StatusChip = ({ status }) => {
  const configs = {
    pending: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-300",
      icon: "⏳",
    },
    resolved: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-300",
      icon: "✅",
    },
    rejected: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-300",
      icon: "❌",
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.icon} {status}
    </span>
  );
};

// Compact priority badge
const PriorityBadge = ({ priority }) => {
  const getConfig = (p) => {
    if (p >= 4)
      return { bg: "bg-red-500", text: "text-white", label: "Critical" };
    if (p >= 3)
      return { bg: "bg-orange-500", text: "text-white", label: "High" };
    if (p >= 2)
      return { bg: "bg-yellow-500", text: "text-white", label: "Medium" };
    return { bg: "bg-green-500", text: "text-white", label: "Low" };
  };

  const config = getConfig(priority);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.text}`}
    >
      <FaFireAlt className="text-xs" />
      {config.label}
    </span>
  );
};

// Minimal loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 animate-pulse"
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded bg-gray-300 dark:bg-gray-600" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Compact button
const Button = ({
  children,
  variant = "primary",
  size = "sm",
  className = "",
  disabled = false,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500/50",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500/50",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50",
    secondary:
      "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
    ghost:
      "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
  };

  const sizes = {
    xs: "px-2 py-1 text-xs gap-1",
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Priority calculation
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

// Compact stats card
const StatsCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2 mb-1">
      <div className={`p-1.5 rounded-md ${color}`}>
        <Icon className="text-sm text-white" />
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
    </div>
    <div className="text-xl font-bold text-gray-900 dark:text-white">
      {value}
    </div>
  </div>
);

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
    priority: "",
    dateRange: "",
  });

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

  // Process errors
  const processedErrors = useMemo(() => {
    let filtered = rawErrors.filter((error) => {
      const searchMatch =
        !searchTerm ||
        error.error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.error.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.userId?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = !filters.status || error.status === filters.status;

      let dateMatch = true;
      if (filters.dateRange) {
        const errorDate = new Date(error.timestamp);
        const today = new Date();

        switch (filters.dateRange) {
          case "today":
            dateMatch = errorDate.toDateString() === today.toDateString();
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
        }
      }

      return searchMatch && statusMatch && dateMatch;
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

    // Sort
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

  // Update error status
  const updateErrorStatus = useCallback(async (id, status) => {
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
    }
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
    return {
      pending,
      resolved,
      critical,
      uniqueUsers,
      total: processedErrors.length,
    };
  }, [processedErrors]);

  // Reset filters
  const resetFilters = () => {
    setFilters({ status: "", priority: "", dateRange: "" });
    setSearchTerm("");
  };

  // Error detail view
  if (selectedError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Compact Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedError(null)}
                  className="flex items-center gap-1"
                >
                  <FaChevronLeft />
                  <span className="hidden xs:inline">Back</span>
                </Button>

                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-red-500 rounded-lg flex-shrink-0">
                    <FaEye className="text-white text-sm" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      TracePoint-Error Details
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Analysis & trace
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="success"
                  size="xs"
                  onClick={() =>
                    updateErrorStatus(selectedError._id, "resolved")
                  }
                >
                  <FaCheck />
                  <span className="hidden sm:inline">Resolve</span>
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() =>
                    updateErrorStatus(selectedError._id, "rejected")
                  }
                >
                  <FaTimes />
                  <span className="hidden sm:inline">Reject</span>
                </Button>

                <Button variant="ghost" size="xs" onClick={toggleTheme}>
                  {isDark ? (
                    <FaSun className="text-yellow-500" />
                  ) : (
                    <FaMoon className="text-blue-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-4">
          {/* Error Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 break-words">
                  {selectedError.error.name}
                </h2>
                <StatusChip status={selectedError.status} />
                <PriorityBadge priority={selectedError.priority} />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-800 dark:text-gray-200 break-words">
                  {selectedError.error.message}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <FaClock className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-gray-600 dark:text-gray-400">Time</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {new Date(selectedError.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <FaUser className="text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-gray-600 dark:text-gray-400">User</div>
                    <div className="font-medium text-gray-900 dark:text-white font-mono text-xs truncate">
                      {selectedError.userId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <FaLaptop className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-gray-600 dark:text-gray-400">
                      Browser
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {selectedError.deviceInfo?.browser || "Unknown"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <FaDesktop className="text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-gray-600 dark:text-gray-400">OS</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {selectedError.deviceInfo?.os || "Unknown"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Stack Trace */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <FaCode className="text-red-500 text-sm" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Stack Trace
                    </h3>
                  </div>
                </div>

                <div className="bg-gray-900 dark:bg-gray-950">
                  <pre className="p-3 text-xs font-mono leading-relaxed text-green-400 overflow-x-auto">
                    {selectedError.mappedStack?.length ? (
                      selectedError.mappedStack.map((frame, i) =>
                        frame.separator ? (
                          <div
                            key={i}
                            className="border-t border-gray-700 my-2"
                          ></div>
                        ) : (
                          <div key={i} className="mb-4">
                            <div className="text-cyan-400 font-medium mb-1 flex items-center gap-1 break-all">
                              <span className="text-yellow-400">📁</span>
                              <span>
                                {frame.source || frame.fileName || "<unknown>"}
                              </span>
                              <span className="text-orange-400">
                                :{frame.line}:{frame.column}
                              </span>
                            </div>
                            <div className="pl-4 border-l-2 border-gray-700">
                              {(frame.snippet || "<no snippet>")
                                .split("\n")
                                .map((line, idx) => (
                                  <div
                                    key={idx}
                                    className={
                                      line.startsWith(">>")
                                        ? "bg-red-900/50 text-red-200 px-2 py-0.5 rounded border-l-2 border-red-500 my-0.5"
                                        : "text-gray-300 px-2 py-0.5"
                                    }
                                  >
                                    {line}
                                  </div>
                                ))}
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="text-gray-300 break-all">
                        {selectedError.error.stack}
                      </div>
                    )}
                  </pre>
                </div>
              </div>
            </div>

            {/* Side Info */}
            <div className="space-y-4">
              {/* Stats */}
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <FaChartLine className="text-blue-500 text-sm" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Impact
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {
                        rawErrors.filter(
                          (e) => e.error.name === selectedError.error.name,
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Occurrences
                    </div>
                  </div>

                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Users
                    </div>
                  </div>
                </div>
              </div>

              {/* Environment */}
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <FaGlobe className="text-green-500 text-sm" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Environment
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  {selectedError.deviceInfo?.screen && (
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                        Screen
                      </span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {selectedError.deviceInfo.screen}
                      </span>
                    </div>
                  )}

                  {selectedError.locationInfo?.url && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-gray-600 dark:text-gray-400 mb-1">
                        URL
                      </div>
                      <a
                        href={selectedError.locationInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all font-mono"
                      >
                        {selectedError.locationInfo.url}
                      </a>
                    </div>
                  )}

                  {selectedError.city && (
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                        Location
                      </span>
                      <span className="flex items-center gap-1 text-gray-900 dark:text-white">
                        <FaMapMarkerAlt className="text-red-500" />
                        {selectedError.city}, {selectedError.state}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Compact Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-red-500 rounded-lg flex-shrink-0">
                <FaBug className="text-white text-sm" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                  TracePoint
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stats.total} errors • {stats.uniqueUsers} users
                </p>
              </div>
            </div>

            {/* Quick Stats - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{stats.pending}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Pending
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">{stats.resolved}</span>
                <span className="text-gray-500 dark:text-gray-400">Fixed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{stats.critical}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Critical
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={
                  autoRefresh ? "text-green-600 dark:text-green-400" : ""
                }
              >
                {autoRefresh ? <FaPause /> : <FaPlay />}
              </Button>

              <Button
                variant="ghost"
                size="xs"
                onClick={() => fetchErrors(true)}
                disabled={refreshing}
              >
                <IoRefresh className={refreshing ? "animate-spin" : ""} />
              </Button>

              <Button variant="ghost" size="xs" onClick={toggleTheme}>
                {isDark ? (
                  <FaSun className="text-yellow-500" />
                ) : (
                  <FaMoon className="text-blue-500" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-4">
        {/* Mobile Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:hidden">
          <StatsCard
            icon={FaExclamationTriangle}
            label="Pending"
            value={stats.pending}
            color="bg-yellow-500"
          />
          <StatsCard
            icon={FaCheckCircle}
            label="Resolved"
            value={stats.resolved}
            color="bg-green-500"
          />
          <StatsCard
            icon={FaFireAlt}
            label="Critical"
            value={stats.critical}
            color="bg-red-500"
          />
          <StatsCard
            icon={FaUsers}
            label="Users"
            value={stats.uniqueUsers}
            color="bg-blue-500"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm" />
              <input
                type="text"
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
                className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white flex-1 min-w-0"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, priority: e.target.value }))
                }
                className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white flex-1 min-w-0"
              >
                <option value="">All Priority</option>
                <option value="4">Critical</option>
                <option value="3">High</option>
                <option value="2">Medium</option>
                <option value="1">Low</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateRange: e.target.value }))
                }
                className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white flex-1 min-w-0"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>

              {(Object.values(filters).some((v) => v) || searchTerm) && (
                <Button variant="secondary" size="xs" onClick={resetFilters}>
                  <IoClose />
                  Clear
                </Button>
              )}

              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                }
              >
                {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
              </Button>
            </div>
          </div>
        </div>

        {/* Error List */}
        <div className="space-y-3">
          {loading ? (
            <LoadingSkeleton />
          ) : processedErrors.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg inline-block mb-3">
                <FaBug className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No errors found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {Object.values(filters).some((v) => v) || searchTerm
                  ? "Try adjusting your filters."
                  : "Great! No errors to display."}
              </p>
              {(Object.values(filters).some((v) => v) || searchTerm) && (
                <Button onClick={resetFilters} variant="primary" size="sm">
                  <IoRefresh />
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            processedErrors.map((error) => (
              <div
                key={error._id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                onClick={() => setSelectedError(error)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <FaBug className="text-red-600 dark:text-red-400 text-sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-red-600 dark:text-red-400 text-sm truncate">
                          {error.error.name}
                        </h3>
                        <StatusChip status={error.status} />
                        <PriorityBadge priority={error.priority} />
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">
                        {error.error.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <FaClock />
                          <span>
                            {new Date(error.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <FaUser />
                          <span className="font-mono truncate max-w-20">
                            {error.userId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <FaLaptop />
                          <span className="truncate">
                            {error.deviceInfo?.browser}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <FaChevronRight className="text-gray-400 dark:text-gray-500 flex-shrink-0 text-sm mt-1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
