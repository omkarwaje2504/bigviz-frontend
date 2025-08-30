"use client";

import { useEffect } from "react";

export default function QrRealtimeAnalytics() {
  async function loadCSV(url) {
    const response = await fetch(url);
    const text = await response.text();
    const rows = text.trim().split("\n");
    const map = {};
    rows.slice(1).forEach((row) => {
      const values = row.split(",");
      const code = values[0]?.trim();
      const urlVal = values[1]?.trim();

      if (code && urlVal) {
        map[code] = urlVal;
      }
    });

    return map;
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectHash = urlParams.get("project-hash");
    const doctorHash = urlParams.get("hash");
    if (doctorHash) {
      loadCSV(`/csv/${projectHash}.csv`).then((map) => {
        if (doctorHash in map) {
          const cleanUrl = map[doctorHash].replace(/^"|"$/g, "");
          window.location.replace(cleanUrl);
        } else {
          console.warn("No match found");
        }
      });
    }
  }, []);
}
