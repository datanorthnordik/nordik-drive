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
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AssignmentIcon from "@mui/icons-material/Assignment";
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
} from "../../constants/colors";

type RequestView = "ADD_INFO" | "FORM_SUBMISSION";

type RequestsHubProps = {
  addInfoRequests: React.ReactNode;
  formSubmissionRequests?: React.ReactNode;
};

export default function RequestsHub({
  addInfoRequests,
  formSubmissionRequests,
}: RequestsHubProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<RequestView>("ADD_INFO");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const topOffset = isMobile ? header_mobile_height : header_height;

  const items = useMemo(
    () => [
      {
        key: "ADD_INFO" as const,
        label: "Add Info Requests",
        icon: <AssignmentIcon />,
      },
      {
        key: "FORM_SUBMISSION" as const,
        label: "Form Submission Requests",
        icon: <DescriptionIcon />,
      },
    ],
    []
  );

  const handleSelect = (next: RequestView) => {
    setView(next);
    setNavOpen(false);
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

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Box sx={{ height: "100%", overflow: "hidden" }}>
          {view === "ADD_INFO" && addInfoRequests}
          {view === "FORM_SUBMISSION" &&
            (formSubmissionRequests ?? <DefaultFormSubmissionPlaceholder />)}
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
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
            <Typography
              sx={{
                fontWeight: 1000,
                letterSpacing: 1,
                color: color_text_light,
                fontSize: 12,
              }}
            >
              NAVIGATION
            </Typography>

            <IconButton onClick={() => setNavOpen(false)} aria-label="Close navigation">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: color_border }} />

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
                      "& .MuiListItemText-primary": {
                        color: "inherit",
                        fontWeight: 950,
                      },
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

function DefaultFormSubmissionPlaceholder() {
  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 720,
          border: `1px dashed ${color_border}`,
          borderRadius: "20px",
          background: color_white,
          p: { xs: 3, md: 4 },
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 20, md: 24 },
            fontWeight: 950,
            color: color_text_primary,
            mb: 1,
          }}
        >
          Form Submission Requests
        </Typography>

        <Typography
          sx={{
            fontSize: 14,
            color: color_text_secondary,
            lineHeight: 1.7,
          }}
        >
          This section is kept as a placeholder for now.
        </Typography>
      </Box>
    </Box>
  );
}