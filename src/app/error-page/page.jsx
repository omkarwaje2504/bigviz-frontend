"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  FaBug,
  FaChevronRight,
  FaChevronLeft,
  FaSearch,
  FaFilter,
  FaCircle,
  FaSync,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaLaptop,
  FaCheck,
  FaTimes,
  FaUser,
  FaUsers,
  FaClock,
  FaExclamationTriangle,
  FaChartLine,
  FaCalendarAlt,
  FaCode,
  FaGlobe,
  FaDesktop,
  FaMobile,
  FaTablet,
  FaFireAlt,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaLayerGroup,
  FaTags,
  FaHashtag,
} from "react-icons/fa";

const API = "https://error-tracking-api.vercel.app/api/error";

// Enhanced status chip with better styling
const getStatusChip = (status) => {
  const styles = {
    pending: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    resolved: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    rejected: "bg-red-500/20 text-red-300 border border-red-500/30",
  };
  return (
    styles[status] || "bg-gray-500/20 text-gray-300 border border-gray-500/30"
  );
};

// Priority calculation based on frequency and recency
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

const getPriorityColor = (priority) => {
  if (priority >= 4) return "text-red-400";
  if (priority >= 3) return "text-orange-400";
  if (priority >= 2) return "text-yellow-400";
  return "text-green-400";
};

export default function ErrorTrackingDashboard() {
  const [rawErrors, setRawErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // list, grouped
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    dateRange: "",
    search: "",
    browser: "",
    os: "",
    errorType: "",
    userId: "",
    customFrom: "",
    customTo: "",
  });

  // Fetch demo errors
  useEffect(() => {
    async function fetchErrors() {
      try {
        const res = await fetch(API);
        const data = await res.json();
        setRawErrors(data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchErrors();
  }, []);

  // Process filters, sorting, and priority
  const processedErrors = useMemo(() => {
    let filtered = rawErrors.filter((error) => {
      const errorDate = new Date(error.timestamp);
      const today = new Date();

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
      const searchMatch =
        !filters.search ||
        error.error.message
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        error.error.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        error.userId?.toLowerCase().includes(filters.search.toLowerCase());
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
  }, [rawErrors, filters, sortBy, sortOrder]);

  // Group for analytics
  const errorGroups = useMemo(() => {
    const groups = {};
    rawErrors.forEach((error) => {
      const key = `${error.error.name}: ${error.error.message}`;
      if (!groups[key]) {
        groups[key] = {
          errorType: error.error.name,
          message: error.error.message,
          count: 0,
          users: new Set(),
          statuses: { pending: 0, resolved: 0, rejected: 0 },
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
          browsers: new Set(),
        };
      }
      const g = groups[key];
      g.count++;
      g.users.add(error.userId);
      g.statuses[error.status]++;
      g.browsers?.add(error?.deviceInfo?.browser);
      if (new Date(error.timestamp) < new Date(g.firstSeen))
        g.firstSeen = error.timestamp;
      if (new Date(error.timestamp) > new Date(g.lastSeen))
        g.lastSeen = error.timestamp;
    });
    return Object.values(groups)
      .map((group) => ({
        ...group,
        users: group.users.size,
        browsers: Array.from(group.browsers),
        priority: calculatePriority(
          { error: { name: group.errorType }, timestamp: group.lastSeen },
          rawErrors,
        ),
      }))
      .sort((a, b) => b.count - a.count);
  }, [rawErrors]);

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

  const updateErrorStatus = async (id, status) => {
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
  };

  console.log(selectedError?.mappedStack[0].snippet);
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-full border-r border-gray-800 flex">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <FaBug className="text-red-400 text-xl" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Error Tracking</h1>
              <p className="text-xs text-gray-400">
                {rawErrors.length} total errors
              </p>
            </div>
          </div>
          {loading && <FaSync className="animate-spin text-blue-400" />}
        </header>
        <div className="flex w-full">
          {/* Filters */}
          <div className="p-4 border-b border-gray-800 space-y-4 flex-col gap-3 w-3/4 overflow-y-auto border">
            <div className="flex gap-3">
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Min Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, priority: e.target.value }))
                  }
                  className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="1">Low (1+)</option>
                  <option value="2">Medium (2+)</option>
                  <option value="3">High (3+)</option>
                  <option value="4">Critical (4+)</option>
                </select>
              </div>
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, dateRange: e.target.value }))
                  }
                  className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              {filters.dateRange === "custom" && (
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.customFrom}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, customFrom: e.target.value }))
                    }
                    className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.customTo}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, customTo: e.target.value }))
                    }
                    className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              {/* Error Type */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Error Type
                </label>
                <select
                  value={filters.errorType}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, errorType: e.target.value }))
                  }
                  className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {uniqueValues.errorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {/* Browser */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Browser
                </label>
                <select
                  value={filters.browser}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, browser: e.target.value }))
                  }
                  className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Browsers</option>
                  {uniqueValues.browsers.map((browser) => (
                    <option key={browser} value={browser}>
                      {browser}
                    </option>
                  ))}
                </select>
              </div>
              {/* OS */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Operating System
                </label>
                <select
                  value={filters.os}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, os: e.target.value }))
                  }
                  className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All OS</option>
                  {uniqueValues.operatingSystems.map((os) => (
                    <option key={os} value={os}>
                      {os}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sort */}
          <div className="p-4 border-t border-gray-800 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Sort by</span>
              <button
                onClick={() =>
                  setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                }
                className="p-1 text-gray-400 hover:text-gray-300"
              >
                {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
              </button>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="timestamp">Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="errorType">Error Type</option>
            </select>
          </div>
        </div>
      </aside>

      <div className="flex w-full">
        {/* Main */}
        <main className="flex-1 flex flex-col">
          <header className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">
                {viewMode === "list" ? "Error List" : "Error Groups"}
              </h2>
              <span className="text-sm text-gray-400">
                {viewMode === "list"
                  ? `${processedErrors.length} errors`
                  : `${errorGroups.length} groups`}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-400">
                  High Priority:{" "}
                  {processedErrors.filter((e) => e.priority >= 4).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-gray-400">
                  Pending:{" "}
                  {processedErrors.filter((e) => e.status === "pending").length}
                </span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <FaSync className="animate-spin text-gray-400 mr-2" />
                <span className="text-gray-400">Loading errors...</span>
              </div>
            ) : processedErrors.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <FaBug className="text-3xl text-gray-500 mb-3" />
                <p className="text-gray-500">
                  No errors found matching your filters
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {processedErrors.map((error) => (
                  <div
                    key={error._id}
                    className="p-4 hover:bg-gray-900/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedError(error)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-red-400">
                            {error.error.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${getStatusChip(error.status)}`}
                          >
                            {error.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                          {error.error.message}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaClock />{" "}
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FaLaptop /> {error.deviceInfo?.browser}
                          </div>
                        </div>
                      </div>
                      <FaChevronRight className="text-gray-500 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Detail Panel */}
        {selectedError && (
          <aside className="w-3/4 border-l border-gray-800 bg-gray-900 overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Error Details</h3>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateErrorStatus(selectedError._id, "resolved")
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
                >
                  <FaCheck className="text-xs" /> Resolve
                </button>
                <button
                  onClick={() =>
                    updateErrorStatus(selectedError._id, "rejected")
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                >
                  <FaTimes className="text-xs" /> Reject
                </button>
                <button
                  onClick={() => setSelectedError(null)}
                  className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-6">
              {/* Error Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-red-400">
                    {selectedError.error.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${getStatusChip(selectedError.status)}`}
                  >
                    {selectedError.status}
                  </span>
                </div>
                <p className="text-lg bg-gray-800 p-2 rounded-md  text-gray-300 mb-3">
                  {selectedError.error.message}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex items-center gap-1 ${getPriorityColor(selectedError.priority)}`}
                  >
                    <FaFireAlt />{" "}
                    <span className="text-sm font-medium">
                      Priority {selectedError.priority}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(selectedError.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Actions */}

              {/* Stack Trace */}
              <div>
                <h4 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <FaCode /> Stack Trace
                </h4>
                <div className="bg-gray-950 rounded-lg p-3 text-xs font-mono">
                  {selectedError.mappedStack?.length ? (
                    <div className="space-y-1">
  
                      <div className="space-y-8">
                        {selectedError.mappedStack.map((frame, i) =>
                          frame.separator ? (
                            <hr key={i} className="border-gray-800" />
                          ) : (
                            <article
                              key={i}
                              className="bg-gray-950/60 p-4 rounded-lg text-xs font-mono"
                            >
                              {/* ▼ file header */}
                              <header className="text-yellow-600 font-semibold mb-2 text-lg break-all border-b border-gray-800 pb-1">
                                {(frame.source || frame.fileName) ??
                                  "<unknown>"}
                                :{frame.line}:{frame.column}
                              </header>

                              {/* ▼ code snippet (fallback if missing) */}
                              <pre className="whitespace-pre leading-relaxed">
                                {(frame.snippet ?? "<no snippet>")
                                  .split("\\n")
                                  .map((ln, idx) => (
                                    <code
                                      key={idx}
                                      className={
                                        ln.startsWith(">>")
                                          ? "bg-gray-800 text-red-300"
                                          : "text-gray-400"
                                      }
                                    >
                                      {ln}
                                      {"\\n"}
                                    </code>
                                  ))}
                              </pre>
                            </article>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <pre className="text-gray-300 whitespace-pre-wrap">
                      {selectedError.error.stack}
                    </pre>
                  )}
                </div>
              </div>

              {/* Context */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex w-full gap-4">
                  {/* User Info */}
                  <div className="bg-gray-800/50 rounded-lg p-3 w-full">
                    <h4 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <FaUser /> User Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">User ID:</span>
                        <span className="text-gray-200">
                          {selectedError._id}
                        </span>
                      </div>
                      {selectedError.geo && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">city/state:</span>
                          <span className="text-gray-200 flex items-center gap-1">
                            <FaMapMarkerAlt className="text-xs" />
                            {selectedError.city}, {selectedError.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="bg-gray-800/50 rounded-lg p-3 w-full">
                    <h4 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <FaDesktop /> Device Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Browser:</span>
                        <span className="text-gray-200">
                          {selectedError.deviceInfo.browser}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">OS:</span>
                        <span className="text-gray-200">
                          {selectedError.deviceInfo.os}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Screen:</span>
                        <span className="text-gray-200">
                          {selectedError.deviceInfo.screen}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Page Info */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <FaGlobe /> Page Information
                  </h4>
                  <div className="space-y-1 text-sm">
                    {selectedError.locationInfo.url && (
                      <div className="flex items-center gap-1">
                        <FaExternalLinkAlt className="text-xs text-gray-400" />
                        <a
                          href={selectedError.locationInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 break-all"
                        >
                          {selectedError.locationInfo.url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Occurrence Stats */}
              <div>
                <h4 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <FaChartLine /> Occurrence Statistics
                </h4>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">
                        {
                          rawErrors.filter(
                            (e) => e.error.name === selectedError.error.name,
                          ).length
                        }
                      </div>
                      <div className="text-xs text-gray-400">
                        Total Occurrences
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">
                        {
                          new Set(
                            rawErrors
                              .filter(
                                (e) =>
                                  e.error.name === selectedError.error.name,
                              )
                              .map((e) => e.userId),
                          ).size
                        }
                      </div>
                      <div className="text-xs text-gray-400">
                        Affected Users
                      </div>
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
