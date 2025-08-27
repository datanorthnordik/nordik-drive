// AppToolbar.tsx
import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { useNavigate } from "react-router-dom";
import "./Header.scss";
import HeaderNav from "../header_nav/HeaderNav";
import Logout from "../logout/Logout";
import { NavContainer } from "../NavContainer";
import { Box } from "@mui/material";

const AppToolbar = () => {
    return (
        <AppBar
            position="fixed"
            sx={{
                backgroundColor: "#ffffff",
                color: "#003366",
                boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
                padding: "0.3rem 1rem",
                zIndex: 1300,
            }}
        >
            <Toolbar
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                        className="toolbar_brand"
                        fetchPriority="high"
                        src="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-1280x320.png"
                        alt="Nordik Institute"
                        srcSet="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-1280x320.png 1280w, 
          https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-640x160.png 640w, 
          https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-768x192.png 768w, 
          https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-1536x384.png 1536w, 
          https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo.png 1656w"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                    />


                </Box>

                <NavContainer>
                    <HeaderNav />
                    <Logout />
                </NavContainer>
            </Toolbar>
        </AppBar>
    );
};

export default AppToolbar;
