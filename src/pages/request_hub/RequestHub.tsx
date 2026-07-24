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
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

import { header_height, header_mobile_height } from "../../constants/colors";
import {
  color_border,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
  color_background,
} from "../../constants/colors";
import {
  REQUEST_HUB_NAV_HEADER_SX,
  REQUEST_HUB_NAV_ITEM_SX,
} from "./styles";

type RequestView = "ADD_INFO" | "FORM_SUBMISSION" | "SUPPORT";

type RequestsHubProps = {
  addInfoRequests: React.ReactNode;
  formSubmissionRequests?: React.ReactNode;
  supportRequests?: React.ReactNode;
};

export default function RequestsHub({
  addInfoRequests,
  formSubmissionRequests,
  supportRequests,
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
      {
        key: "SUPPORT" as const,
        label: "Support Requests",
        icon: <SupportAgentIcon />,
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
          {view === "SUPPORT" && (supportRequests ?? <DefaultSupportRequestsPlaceholder />)}
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
            background: color_white_smoke,
            borderLeft: `1px solid ${color_border}`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
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
              ...REQUEST_HUB_NAV_HEADER_SX,
            }}
          >
            <Typography
              sx={{
                fontWeight: 1000,
                letterSpacing: 1,
                color: "rgba(255, 255, 255, 0.82)",
                fontSize: 12,
              }}
            >
              NAVIGATION
            </Typography>

            <IconButton
              onClick={() => setNavOpen(false)}
              aria-label="Close navigation"
              sx={{
                color: color_white,
                "&:hover": { background: "rgba(255, 255, 255, 0.12)" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: color_border }} />

          <Box sx={{ p: 1.75, flex: 1 }}>
            <List sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {items.map((it) => {
                const selected = view === it.key;

                return (
                  <ListItemButton
                    key={it.key}
                    selected={selected}
                    onClick={() => handleSelect(it.key)}
                    sx={REQUEST_HUB_NAV_ITEM_SX}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 44,
                        color: selected ? color_white : undefined,
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

function DefaultSupportRequestsPlaceholder() {
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
          Support Requests
        </Typography>
        <Typography sx={{ fontSize: 14, color: color_text_secondary, lineHeight: 1.7 }}>
          Support requests will appear here.
        </Typography>
      </Box>
    </Box>
  );
}
