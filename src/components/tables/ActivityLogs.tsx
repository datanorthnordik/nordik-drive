"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";

import { header_height, header_mobile_height } from "../../constants/colors";

//  your existing components
import UserActivity from "./UserActivity"; // <-- adjust import path if different
import AdminFileEditRequests from "./FileActivities"; // <-- your file management component

type ViewMode = "GENERAL" | "FILE_MGMT";

/**
 * Admin activity hub:
 * - GENERAL -> existing UserActivity (logs + visualization)
 * - FILE_MGMT -> your new AdminFileEditRequests (file edit requests + photos)
 *
 *  Does NOT change any logic inside those components.
 *  Only adds a top-level switch/tabs.
 */
export default function AdminActivitiesHub() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const topOffset = isMobile ? header_mobile_height : header_height;


  const [mode, setMode] = useState<"GENERAL" | "FILE_MANAGEMENT">("GENERAL");

  const headerDesc = useMemo(() => {
    return mode === "GENERAL"
      ? "User logins, file access, and other general platform events."
      : "Administratively handle file edit requests + photos, with advanced search/filters.";
  }, [mode]);

  return (
    <Box
      sx={{
        height: `calc(100vh - ${topOffset})`,
        mt: topOffset,
        p: { xs: 1.5, md: 2 },
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      {/* Top switch header */}
      

      {/* Body: keep the child components FULL height */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Box
          sx={{
            height: "100%",
            overflow: "hidden",
          }}
        >
          {mode === "GENERAL" ? <UserActivity mode={mode} onModeChange={setMode} /> : <AdminFileEditRequests onParentModeChange={setMode} />}
        </Box>
      </Box>
    </Box>
  );
}
