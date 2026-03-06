"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ViewListIcon from "@mui/icons-material/ViewList";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";

import { header_height, header_mobile_height } from "../../constants/colors";
import {
  color_border,
  color_secondary_dark,
  color_white,
  color_white_smoke,
  color_text_primary,
  color_text_secondary,
  color_text_light,
  color_background,
  color_success,
} from "../../constants/colors";

// existing components (unchanged)
import UserActivity from "./UserActivity";
import AdminFileEditRequests from "./FileActivities";
import FormSubmissionLogs from "./FormSubmissionLogs";

type ActivityView = "GENERAL" | "FILE_MANAGEMENT" | "FORM_SUBMISSION";

export default function AdminActivitiesHub() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const topOffset = isMobile ? header_mobile_height : header_height;

  const [view, setView] = useState<ActivityView>("GENERAL");
  const [navOpen, setNavOpen] = useState(false);

  const items = useMemo(
    () => [
      { key: "GENERAL" as const, label: "General logs", icon: <ViewListIcon /> },
      { key: "FILE_MANAGEMENT" as const, label: "File management logs", icon: <FolderIcon /> },
      { key: "FORM_SUBMISSION" as const, label: "Form submission logs", icon: <DescriptionIcon /> },
    ],
    []
  );

  const handleSelect = (next: ActivityView) => {
    setView(next);
    setNavOpen(false); // close on selection
  };

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
        position: "relative",
        background: color_background,
      }}
    >
      {/* Always-visible "reopen navigation" icon (already correctly below header because container is offset) */}
      <IconButton
        onClick={() => setNavOpen(true)}
        aria-label="Open navigation"
        title="Open navigation"
        sx={{
          position: "absolute",
          right: { xs: 10, md: 14 },
          top: { xs: 10, md: 14 },
          zIndex: 2,
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: color_white,
          border: `1px solid ${color_border}`,
          color: color_text_primary,
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          "&:hover": { background: color_white_smoke },
        }}
      >
        <MoreVertIcon />
      </IconButton>

      {/* Body */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Box sx={{ height: "100%", overflow: "hidden" }}>
          {view === "GENERAL" && <UserActivity />}
          {view === "FILE_MANAGEMENT" && (
            <AdminFileEditRequests
              onParentModeChange={(m: any) => {
                if (m === "GENERAL") setView("GENERAL");
                if (m === "FILE_MANAGEMENT") setView("FILE_MANAGEMENT");
              }}
            />
          )}
          {view === "FORM_SUBMISSION" && <FormSubmissionLogs />}
        </Box>
      </Box>

      {/* ✅ Right Drawer Navigation (OFFSET BELOW HEADER LIKE YOUR LOGS AREA) */}
      <Drawer
        anchor="right"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          // IMPORTANT: make BOTH drawer panel and backdrop start below header
          "& .MuiBackdrop-root": {
            top: topOffset,
            height: `calc(100vh - ${topOffset})`,
          },
          "& .MuiDrawer-paper": {
            top: topOffset,
            height: `calc(100vh - ${topOffset})`,
            width: 360,
            background: color_white,
            borderLeft: `1px solid ${color_border}`,
            boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: color_white,
            }}
          >
            <Typography sx={{ fontWeight: 1000, letterSpacing: 1, color: color_text_light, fontSize: 12 }}>
              NAVIGATION
            </Typography>

            <IconButton onClick={() => setNavOpen(false)} aria-label="Close navigation">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: color_border }} />

          {/* Items */}
          <Box sx={{ p: 1.75 }}>
            <List sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {items.map((it) => {
                const selected = view === it.key;
                return (
                  <ListItemButton
                    key={it.key}
                    selected={selected}
                    onClick={() => handleSelect(it.key)}
                    sx={{
                      borderRadius: "16px",
                      py: 1.35,

                      border: `1px solid ${color_border}`,
                      backgroundColor: color_white,
                      color: color_text_primary,

                      "&:hover": { backgroundColor: color_white_smoke },

                      "& .MuiListItemIcon-root": { color: color_text_secondary },
                      "& .MuiListItemText-primary": { color: "inherit", fontWeight: 950 },

                      "&.Mui-selected": {
                        backgroundColor: color_secondary_dark,
                        borderColor: color_secondary_dark,
                        color: color_white,
                      },
                      "&.Mui-selected:hover": {
                        backgroundColor: color_secondary_dark,
                      },
                      "&.Mui-selected .MuiListItemIcon-root": {
                        color: color_white,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 44,
                        color: selected ? color_white : color_text_secondary,
                      }}
                    >
                      {it.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={it.label}
                      primaryTypographyProps={{
                        fontWeight: 950,
                        fontSize: 15,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}