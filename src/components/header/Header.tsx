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

const AppToolbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
      <Box mt={2}>
        <Logout />
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.9) 100%)",
          color: "#003366",  // deep blue text/icons
          boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
          padding: "0.3rem 1rem",
          zIndex: 1300,
          backdropFilter: "blur(6px)", // frosted effect
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2, // space between left logo and nav
          }}
        >
          {/* LEFT: Shingwauk Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              px: 1,
              maxWidth: { xs: 180, sm: 220, md: 260 },
              "& img": {
                width: "100%",
                height: "7.5rem",
                maxHeight: "7.5rem",
                objectFit: "contain",
                transform: "scale(1)", // subtle scale to pop
              },
            }}
          >
            <a href="https://childrenofshingwauk.org/"
              target="_blank" rel="noopener noreferrer">
              <img
                src="/logo-1.png"
                alt="Children of Shingwauk Alumni Association"
              />
            </a>
          </Box>

          {/* CENTER (Desktop Navigation) */}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 2,
              flexGrow: 1,
              justifyContent: "center",
            }}
          >
            <NavContainer>
              <HeaderNav />
            </NavContainer>
          </Box>

          {/* RIGHT: Nordik Logo + Logout */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <a
              href="https://nordikinstitute.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center" }}
            >
              <img
                src="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-640x160.png"
                alt="Nordik Institute"
                style={{ width: "100%", maxHeight: "4rem", objectFit: "contain" }}
              />
            </a>
            <Logout />
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
