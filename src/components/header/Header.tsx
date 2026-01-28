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
import { Link } from "react-router-dom";

import { useTheme, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";

const AppToolbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const {selectedFile} = useSelector((state: any) => state.file);

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

            {(!selectedFile || selectedFile.filename == "Confirmed- Shingwauk (Wawanosh)") &&<Link to="/coroner">
              <img
                src="/image001.png"
                alt="Ontario Office of the Chief Coroner"
                // ✅ responsive height for the 2nd logo too
                style={{ height: isMobile ? "2.7rem" : "4.9rem" }}
              />
            </Link>}
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
