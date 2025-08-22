"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  FaBug,
  FaCheck,
  FaTimes,
  FaUser,
  FaClock,
  FaLaptop,
  FaDesktop,
  FaFireAlt,
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
  FaChartLine,
  FaGlobe,
  FaMapMarkerAlt,
  FaCode,
  FaPlay,
  FaPause,
  FaFilter,
  FaCalendarAlt,
  FaSort,
} from "react-icons/fa";
import { IoRefresh, IoClose } from "react-icons/io5";

const API = "https://error-tracking-api.vercel.app/api/error";

// Theme hook
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

// Status chip
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

// Priority badge
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

// Loading skeleton
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

// Button component
const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) => {
  const baseStyles =
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
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Stats card
const StatsCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="text-lg text-white" />
      </div>
      {trend && (
        <span
          className={`text-xs font-medium flex items-center ${
            trend > 0 ? "text-red-500" : "text-green-500"
          }`}
        >
          {trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">
      {value}
    </div>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
  </div>
);

// Filter panel component
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
        {/* Search input */}
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

        {/* Filter toggle button for mobile */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex items-center gap-2"
        >
          <FaFilter />
          Filters
        </Button>

        {/* Sort dropdown */}
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
            <option value="priority">Priority</option>
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

      {/* Expandable filters */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Priority</option>
              <option value="4">Critical</option>
              <option value="3">High</option>
              <option value="2">Medium</option>
              <option value="1">Low</option>
            </select>
          </div>

          {/* Date filter */}
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

          {/* Reset filters button */}
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

// Error card component
const ErrorCard = ({ error, onView, onResolve, onDelete }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-red-600 dark:text-red-400 truncate">
              {error.error.name}
            </h3>
            <StatusChip status={error.status} />
            <PriorityBadge priority={error.priority} />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {error.error.message}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FaUser className="text-gray-400" />
              <span className="truncate max-w-[120px]">{error.userId}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaClock className="text-gray-400" />
              <span>{new Date(error.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaLaptop className="text-gray-400" />
              <span>{error.deviceInfo?.browser || "Unknown"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(error)}
            className="p-2"
          >
            <FaEye />
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={() => onResolve(error._id)}
            className="p-2"
          >
            <FaCheck />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(error._id)}
            className="p-2"
          >
            <IoClose />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Error group component
const ErrorGroup = ({ group, onView, onResolve, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const errorCount = group.length;
  const userCount = new Set(group.map((e) => e.userId)).size;
  const latestError = group[0]; // Most recent error

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-red-600 dark:text-red-400 truncate">
                {latestError.error.name}
              </h3>
              <PriorityBadge priority={latestError.priority} />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">
              {latestError.error.message}
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {errorCount} occurrence{errorCount !== 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span>
                {userCount} user{userCount !== 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span>
                Last: {new Date(latestError.timestamp).toLocaleDateString()}
              </span>
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
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {group.map((error) => (
            <ErrorCard
              key={error._id}
              error={error}
              onView={onView}
              onResolve={onResolve}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main dashboard component
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
  const [viewMode, setViewMode] = useState("grouped"); // 'grouped' or 'list'
 const prevErrorIdsRef = useRef(new Set());
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

  useEffect(() => {
    const prevIds = prevErrorIdsRef.current;
    const currentIds = new Set(rawErrors.map((e) => e._id));
    const newErrorIds = [...currentIds].filter((id) => !prevIds.has(id));

    // Update the set of seen IDs for next run
    prevErrorIdsRef.current = currentIds;

    const originalTitle = "Error Tracker";

    // If new errors, start notification
    if (newErrorIds.length > 0) {
      let flash = false;
      const flashInterval = setInterval(() => {
        document.title = flash
          ? `(${newErrorIds.length})❗ New Errors | Error Tracker`
          : originalTitle;
        flash = !flash;
      }, 1000);

      // Cleanup interval on unmount or error change
      return () => {
        clearInterval(flashInterval);
        document.title = originalTitle;
      };
    } else {
      // No new errors, ensure clean title
      document.title = originalTitle;
    }
  }, [rawErrors]);

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

  // Process errors: filter, sort, compute priority
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

  // Group errors by name and message
  const groupedErrors = useMemo(() => {
    const groups = processedErrors.reduce((acc, error) => {
      const key = `${error.error.name}::${error.error.message}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(error);
      return acc;
    }, {});

    // Sort groups by the latest error timestamp
    return Object.entries(groups)
      .map(([key, errors]) => {
        // Sort errors within group by timestamp (newest first)
        errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return [key, errors];
      })
      .sort((a, b) => {
        // Sort groups by the latest error timestamp
        const aLatest = new Date(a[1][0].timestamp);
        const bLatest = new Date(b[1][0].timestamp);
        return sortOrder === "asc" ? aLatest - bLatest : bLatest - aLatest;
      });
  }, [processedErrors, sortOrder]);

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

  // Update error status
  const updateErrorStatus = async (id, status) => {
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
  };

  // Delete error
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
    }
  };

  // Resolve all visible errors
  const resolveAll = async () => {
    const ids = processedErrors.map((e) => e._id);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: "resolved" }),
          }),
        ),
      );
      fetchErrors(true);
    } catch (err) {
      console.error("Failed to resolve all:", err);
    }
  };

  // Delete all visible errors
  const deleteAll = async () => {
    const ids = processedErrors.map((e) => e._id);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(API, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          }),
        ),
      );
      fetchErrors(true);
    } catch (err) {
      console.error("Failed to delete all:", err);
    }
  };

  // Error detail view (simplified for brevity)
  const ErrorDetail = ({ error, onBack, onResolve, onReject }) => (
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
            <PriorityBadge priority={error.priority} />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-gray-800 dark:text-gray-200">
              {error.error.message}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Error Details
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Time:</span>{" "}
                  {new Date(error.timestamp).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">User ID:</span> {error.userId}
                </p>
                <p>
                  <span className="font-medium">Browser:</span>{" "}
                  {error.deviceInfo?.browser || "Unknown"}
                </p>
                <p>
                  <span className="font-medium">OS:</span>{" "}
                  {error.deviceInfo?.os || "Unknown"}
                </p>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Environment
              </h3>
              <div className="space-y-2 text-sm">
                {error.deviceInfo?.screen && (
                  <p>
                    <span className="font-medium">Screen:</span>{" "}
                    {error.deviceInfo.screen}
                  </p>
                )}
                {error.locationInfo?.url && (
                  <p className="truncate">
                    <span className="font-medium">URL:</span>
                    <a
                      href={error.locationInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                    >
                      {error.locationInfo.url}
                    </a>
                  </p>
                )}
                {error.city && (
                  <p>
                    <span className="font-medium">Location:</span> {error.city},{" "}
                    {error.state}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Stack Trace</h3>
            <pre className="text-green-400 text-sm overflow-x-auto">
              {error.error.stack}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  // Show error detail view if an error is selected
  if (selectedError) {
    return (
      <ErrorDetail
        error={selectedError}
        onBack={() => setSelectedError(null)}
        onResolve={(id) => updateErrorStatus(id, "resolved")}
        onReject={(id) => updateErrorStatus(id, "rejected")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
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
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            icon={FaExclamationTriangle}
            label="Pending Errors"
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
            label="Affected Users"
            value={stats.uniqueUsers}
            color="bg-blue-500"
          />
        </div>

        {/* Filters and Controls */}
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

        {/* View Toggle and Bulk Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              View:
            </span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grouped")}
                className={`px-3 py-1 text-sm rounded-md ${viewMode === "grouped" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
              >
                Grouped
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 text-sm rounded-md ${viewMode === "list" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
              >
                List
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={resolveAll}
              disabled={processedErrors.length === 0}
            >
              <FaCheck />
              Resolve All
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

        {/* Error List */}
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
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {Object.values(filters).some((v) => v) || searchTerm
                  ? "Try adjusting your filters or search terms."
                  : "All errors are resolved! 🎉"}
              </p>
              <Button variant="primary" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          ) : viewMode === "grouped" ? (
            <div className="space-y-4">
              {groupedErrors.map(([key, errors]) => (
                <ErrorGroup
                  key={key}
                  group={errors}
                  onView={setSelectedError}
                  onResolve={(id) => updateErrorStatus(id, "resolved")}
                  onDelete={deleteError}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {processedErrors.map((error) => (
                <ErrorCard
                  key={error._id}
                  error={error}
                  onView={setSelectedError}
                  onResolve={(id) => updateErrorStatus(id, "resolved")}
                  onDelete={deleteError}
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
