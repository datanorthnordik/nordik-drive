import React, { useEffect, useMemo, useState } from "react";
import { AdminPanelWrapper } from "../../components/Wrappers";
import FileUploader from "../../components/FileUploader";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import UploadedFiles from "../../components/UploadedFiles";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { setFiles } from "../../store/auth/fileSlice";

import { Box, Tabs, Tab } from "@mui/material";
import { color_primary, header_height, header_mobile_height } from "../../constants/colors";

const AdminPanel = () => {
const [newFile, setNewFile] = useState("");
const [tab, setTab] = useState(0);
const [isMobile, setIsMobile] = useState(false);

const { loading, data: files } = useFetch(
"https://nordikdriveapi-724838782318.us-west1.run.app/api/file",
"GET",
true
);

const dispatch = useDispatch<AppDispatch>();

useEffect(() => {
if (files) dispatch(setFiles({ files: (files as any).files }));
}, [files, dispatch]);

useEffect(() => {
const onResize = () => setIsMobile(window.innerWidth <= 900);
onResize();
window.addEventListener("resize", onResize);
return () => window.removeEventListener("resize", onResize);
}, []);

// ✅ IMPORTANT: prevent outer (page) scroll on this screen
useEffect(() => {
const prev = document.body.style.overflow;
document.body.style.overflow = "hidden";
return () => {
    document.body.style.overflow = prev || "";
};
}, []);

const top = useMemo(() => (isMobile ? header_mobile_height : header_height), [isMobile]);

return (
<>
    <Loader loading={loading} />

    <AdminPanelWrapper>
    {/* ✅ Fixed workspace area below header (no page scroll) */}
    <Box
        sx={{
        position: "fixed",
        top,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        px: { xs: 1.25, md: 3 },
        py: { xs: 1.25, md: 2 },
        boxSizing: "border-box",
        }}
    >
        <Box
        sx={{
            height: "100%",
            maxWidth: 1400,
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
        }}
        >
        {/* ✅ Clean tabs (no big box) */}
        <Box
            sx={{
            flexShrink: 0,
            borderBottom: "1px solid #ddd",
            background: "transparent",
            pb: 0.5,
            }}
        >
            <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
                minHeight: 44,
                "& .MuiTab-root": {
                minHeight: 44,
                fontWeight: 800,
                textTransform: "uppercase",
                px: 2,
                color: "#24425f",
                },
                "& .Mui-selected": { color: color_primary },
                "& .MuiTabs-indicator": {
                backgroundColor: color_primary,
                height: 3,
                borderRadius: 3,
                },
            }}
            >
            <Tab label="Upload File" />
            <Tab label="Uploaded Files" />
            </Tabs>
        </Box>

        {/* ✅ Content region: ONLY this area can scroll internally */}
        <Box
            sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            pt: 1.25,
            }}
        >
            {tab === 0 && (
            <Box sx={{ height: "100%", minHeight: 0, overflow: "auto" }}>
                <FileUploader setNewFile={setNewFile} />
            </Box>
            )}

            {tab === 1 && (
            <Box sx={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
                <UploadedFiles newFile={newFile} />
            </Box>
            )}
        </Box>
        </Box>
    </Box>
    </AdminPanelWrapper>
</>
);
};

export default AdminPanel;
