"use client";

import { UAParser } from "ua-parser-js";

const MyError = async (err) => {
  // ① Basic error info
  const error = {
    name: err?.name ?? "Error",
    message: err?.message ?? "Unexpected error",
    stack: err?.stack ?? "No stack",
  };

  // ② Device + runtime details
  const parser = new UAParser();
  const ua = parser.getResult();
  const deviceInfo = {
    browser: `${ua.browser.name} ${ua.browser.version}`,
    os: `${ua.os.name} ${ua.os.version}`,
    device: ua.device.model || "Desktop / Unknown",
    screen: `${window.innerWidth}×${window.innerHeight}`,
    userAgent: navigator.userAgent,
  };

  // ③ Current page
  const locationInfo = {
    url: window.location.href,
    referrer: document.referrer,
  };

  // ④ Geolocation (requires user permission, fallback to undefined)
  let geo = {};
  try {
    geo = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          resolve({
            lat: coords.latitude,
            lon: coords.longitude,
            accuracy: coords.accuracy,
          }),
        () => resolve({}) /* permission denied */,
        { enableHighAccuracy: true, timeout: 2000, maximumAge: 60000 },
      );
    });
  } catch (_) {}

  // ⑥ Map stack trace → original sources (if maps available)
  const mappedStack = [];
  // ⑦ Send everything to your API
  const projectId = localStorage.getItem("projectHash");
  await fetch("https://error-tracking-api.vercel.app/api/error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      error,
      mappedStack,
      deviceInfo,
      locationInfo,
      geo,
      projectId,
    }),
  }).catch(() => {
    console.error("Failed to send error report");
  });
};

export default MyError;
