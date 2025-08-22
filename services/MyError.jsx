"use client";

import { UAParser } from "ua-parser-js";

const MyError = async (err) => {
  try {
    // ① Basic error info
    const error = {
      name: err instanceof Error ? err.name : "Error",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : "No stack",
    };

    // ② Device + runtime details
    let deviceInfo = {};
    try {
      const parser = new UAParser();
      const ua = parser.getResult();
      deviceInfo = {
        browser: `${ua.browser.name || "Unknown"} ${ua.browser.version || ""}`,
        os: `${ua.os.name || "Unknown"} ${ua.os.version || ""}`,
        device: ua.device.model || "Desktop / Unknown",
        screen: `${window.innerWidth}×${window.innerHeight}`,
        userAgent: navigator.userAgent,
      };
    } catch (e) {
      console.warn("Failed to parse UA:", e);
    }

    // ③ Current page
    let locationInfo = {};
    try {
      locationInfo = {
        url: window?.location?.href ?? "",
        referrer: document?.referrer ?? "",
      };
    } catch (e) {
      console.warn("Failed to get location info:", e);
    }

    // ④ Geolocation (safe fallback)
    let geo = {};
    try {
      geo = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({});
        navigator.geolocation.getCurrentPosition(
          ({ coords }) =>
            resolve({
              lat: coords.latitude,
              lon: coords.longitude,
              accuracy: coords.accuracy,
            }),
          () => resolve({}), // permission denied or error
          { enableHighAccuracy: true, timeout: 2000, maximumAge: 60000 },
        );
      });
    } catch (e) {
      console.warn("Geo lookup failed:", e);
    }

    // ⑤ ProjectId from storage
    let projectId = null;
    try {
      projectId = localStorage.getItem("projectHash");
    } catch (e) {
      console.warn("LocalStorage read failed:", e);
    }

    // ⑥ Map stack trace → original sources (placeholder for sourcemaps)
    const mappedStack = [];

    // ⑦ Send to error API
    try {
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
      });
    } catch (e) {
      console.error("Failed to send error report:", e);
    }
  } catch (fatal) {
    // 🚨 Last line of defense — MyError itself should never crash
    console.error("MyError failed completely:", fatal);
  }
};

export default MyError;
