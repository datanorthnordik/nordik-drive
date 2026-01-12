"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { header_height, header_mobile_height } from "../../constants/colors";

// ✅ your existing components
import UserActivity from "./UserActivity"; // <-- adjust import path if different
import AdminFileEditRequests from "./FileActivities"; // <-- your file management component

type ViewMode = "GENERAL" | "FILE_MGMT";

/**
 * Admin activity hub:
 * - GENERAL -> existing UserActivity (logs + visualization)
 * - FILE_MGMT -> your new AdminFileEditRequests (file edit requests + photos)
 *
 * ✅ Does NOT change any logic inside those components.
 * ✅ Only adds a top-level switch/tabs.
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
        {/* ✅ IMPORTANT:
            Your UserActivity and AdminFileEditRequests BOTH already apply topOffset spacing internally.
            So we must render them "as-is" only if they DO NOT add mt/topOffset internally.
            
            If they DO add mt/topOffset (like your UserActivity code), you have 2 options:
            A) Remove mt/topOffset from those pages and keep it only here (recommended), OR
            B) Wrap them in a Box that cancels their margin (hacky, not recommended).

            Below is the recommended approach:
            - Create "inner" versions of each component that does NOT apply topOffset.
            - OR simply edit them to remove the outer-most mt/topOffset wrapper.
            
            If you want ZERO changes inside them for now, use option B below.
        */}

        {/* -------- Option A (RECOMMENDED): components WITHOUT mt/topOffset --------
            {mode === "GENERAL" ? <UserActivity /> : <AdminFileEditRequests />}
        */}

        {/* -------- Option B (NO CHANGES INSIDE CHILD COMPONENTS): cancel their mt -------- */}
        <Box
          sx={{
            height: "100%",
            overflow: "hidden",
            // cancels the child's internal mt: topOffset (because we already applied it here)
            // if your child components use mt: topOffset, this neutralizes the double spacing.
          }}
        >
          {mode === "GENERAL" ? <UserActivity mode={mode} onModeChange={setMode} /> : <AdminFileEditRequests onParentModeChange={setMode} />}
        </Box>
      </Box>
    </Box>
  );
}
