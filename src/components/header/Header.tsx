import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import { useState } from "react";
import "./Header.scss";
import HeaderNav from "../header_nav/HeaderNav";
import Logout from "../logout/Logout";
import { NavContainer } from "../NavContainer";

import { useTheme, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../hooks/useFetch";
import { apiUrl } from "../../config/api";

const hasExternalScheme = (value: string) =>
  /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(value) || /^[a-z][a-z\d+\-.]*:/i.test(value);

const normalizeInternalPath = (value: string) => {
  if (!value) return "";
  if (/^[?#]/.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
};

const normalizeConfigValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

type LogoContentResponse =
  | string
  | {
      html?: string;
      content?: string;
      data?: string;
    };

const extractHtml = (payload: LogoContentResponse | null) => {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";

  if (typeof payload.html === "string") return payload.html.trim();
  if (typeof payload.content === "string") return payload.content.trim();
  if (typeof payload.data === "string") return payload.data.trim();

  return "";
};

const AppToolbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const { selectedFile } = useSelector((state: RootState) => state.file);
  const configFileName = (selectedFile?.filename || "").trim();
  const configEntry = useSelector((state: RootState) =>
    configFileName ? state.api.entries[`config_${configFileName}`] : null
  );
  const configJson = (configEntry?.data as any)?.config || null;
  const fileLogo = normalizeConfigValue(configJson?.logo);
  const logoNavigationLink = normalizeConfigValue(configJson?.logo_navigation_link);
  const partnerLogo = (
    <img
      src={fileLogo}
      alt={`${selectedFile?.filename || "Selected file"} partner logo`}
      style={{
        height: isMobile ? "2.7rem" : "4.9rem",
        width: "auto",
        objectFit: "contain",
      }}
    />
  );

  const handleContentNavigation = async () => {
    const fileId = selectedFile?.id;
    if (!fileId || contentLoading) return;

    try {
      setContentLoading(true);
      const response = await apiRequest<LogoContentResponse>(apiUrl(`logo-content/${fileId}`), "GET");
      const htmlContent = extractHtml(response);

      if (!htmlContent) return;

      navigate("/file-content", {
        state: {
          htmlContent,
          fileId,
          pageTitle: selectedFile?.filename ? `${selectedFile.filename} content page` : "File content page",
        },
      });
    } catch {
      // If the API returns no content or 404, keep the user on the current page.
    } finally {
      setContentLoading(false);
    }
  };

  const drawer = (
    <Box
      sx={{
        width: 240,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: { xs: 7, sm: 8 },
        px: 2,
      }}
    >
      <HeaderNav onLinkClick={() => setMobileOpen(false)} />

      {/* Logout only in drawer for mobile */}
      {isMobile && (
        <Box mt={2}>
          <Logout />
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.9) 100%)",
          color: "#003366",
          boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
          padding: "0.05rem 0.6rem",
          zIndex: 1300,
          backdropFilter: "blur(6px)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",

            gap: { xs: 0.75, sm: 1.1 },
            minHeight: { xs: 50, sm: 56, md: 56 },
            py: 0.1,
          }}
        >
          {/* LEFT: Shingwauk Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              px: 0.25,
              gap: { xs: 0.6, sm: 0.9 },

              // allow it to shrink more on mobile
              maxWidth: { xs: 140, sm: 185, md: 215 },

              "& img": {
                width: "100%",
                objectFit: "contain",
                transform: "scale(1)",

                // ✅ real mobile sizing (this is the key)
                height: { xs: "3.0rem", sm: "5.0rem", md: "5.4rem" },
                maxHeight: { xs: "3.0rem", sm: "5.0rem", md: "5.4rem" },
              },
            }}
          >
            <a
              href="https://childrenofshingwauk.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/logo-1.png"
                alt="Children of Shingwauk Alumni Association"
              />
            </a>

            {fileLogo && (
              logoNavigationLink ? (
                hasExternalScheme(logoNavigationLink) ? (
                  <a
                    href={logoNavigationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="partner-logo-external-link"
                  >
                    {partnerLogo}
                  </a>
                ) : (
                  <Link to={normalizeInternalPath(logoNavigationLink)}>
                    {partnerLogo}
                  </Link>
                )
              ) : (
                <Box
                  component="button"
                  type="button"
                  onClick={handleContentNavigation}
                  disabled={!selectedFile?.id || contentLoading}
                  aria-label={`${selectedFile?.filename || "Selected file"} content logo`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    cursor: !selectedFile?.id || contentLoading ? "default" : "pointer",
                  }}
                >
                  {partnerLogo}
                </Box>
              )
            )}
          </Box>

          {/* CENTER (Desktop Navigation) */}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1.1,
              flexGrow: 1,
              justifyContent: "center",
            }}
          >
            <NavContainer>
              <HeaderNav />
            </NavContainer>
          </Box>

          {/* RIGHT: Nordik Logo + Logout */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.1 } }}>
            <a
              href="https://nordikinstitute.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center" }}
            >
              <img
                src="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-640x160.png"
                alt="Nordik Institute"
                style={{
                  width: "auto",
                  objectFit: "contain",

                  // ✅ cap the logo so it doesn't overflow on xs
                  maxHeight: isMobile ? "2.2rem" : "2.8rem",
                  maxWidth: isMobile ? "150px" : "260px",
                }}
              />
            </a>

            {/* Logout in header only for non-mobile */}
            {!isMobile && <Logout />}
          </Box>

          {/* Mobile Hamburger */}
          <IconButton
            color="inherit"
            edge="end"
            sx={{ display: { sm: "none" } }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 240,
            marginTop: "2rem",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default AppToolbar;
