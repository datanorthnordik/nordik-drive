// MyRequests.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import {
  color_secondary,
  color_secondary_dark,
  color_border,
  color_background,
  color_text_primary,
  color_text_light,
  color_white,
  color_warning,
  header_height,
  header_mobile_height,
} from "../../constants/colors";

import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import MyRequestDetailsModal from "./MyRequestDetailsModal";
import { useSelector } from "react-redux";


type TabKey = "pending" | "approved";

const API_BASE = "https://nordikdriveapi-724838782318.us-west1.run.app";

const getFilename = (req: any) => String(req?.details?.[0]?.filename || "—");
const getChangeCount = (req: any) => (Array.isArray(req?.details) ? req.details.length : 0);

const formatWhen = (iso?: string) => {
  if (!iso) return "—";
  return String(iso).replace("T", " ").replace("Z", "");
};

// NO RED (Rejected uses neutral/grey)
const statusChipSx = (status?: string) => {
  const s = String(status || "").toLowerCase();

  if (s.includes("approved")) {
    return {
      label: "Approved",
      sx: {
        backgroundColor: "rgba(39, 174, 96, 0.12)",
        border: "1px solid rgba(39, 174, 96, 0.25)",
        color: "#166534",
      },
    };
  }
  if (s.includes("pending")) {
    return {
      label: "Pending review",
      sx: {
        backgroundColor: "rgba(243, 156, 18, 0.14)",
        border: "1px solid rgba(243, 156, 18, 0.25)",
        color: color_text_primary,
      },
    };
  }
  if (s.includes("reject")) {
    return {
      label: "Rejected",
      sx: {
        backgroundColor: "rgba(107, 114, 128, 0.12)",
        border: "1px solid rgba(107, 114, 128, 0.25)",
        color: color_text_primary,
      },
    };
  }
  return {
    label: "Unknown",
    sx: {
      backgroundColor: "rgba(107, 114, 128, 0.12)",
      border: "1px solid rgba(107, 114, 128, 0.25)",
      color: color_text_light,
    },
  };
};

const buildRequestsUrl = (statusCsv: string, id?: string) => {
  const params = new URLSearchParams();
  params.set("status", statusCsv);
  if (id) params.set("user_id", id);
  return `${API_BASE}/api/file/edit/request?${params.toString()}`;
};

const MyRequests: React.FC = () => {

  const [tab, setTab] = useState<TabKey>("pending");
  const [searchText, setSearchText] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const topOffset = isMobile ? header_mobile_height : header_height;
  const user = useSelector((state: any) => state.auth.user);

  // ✅ Separate API calls:
  // - pending list
  // - approved + rejected list together
  const pendingUrl = useMemo(
    () => buildRequestsUrl("pending", user.id || undefined),
    [user.id]
  );
  const approvedRejectedUrl = useMemo(
    () => buildRequestsUrl("approved,rejected", user.id || undefined),
    [user.id]
  );

  const {
    data: pendingData,
    fetchData: fetchPending,
    loading: pendingLoading,
  } = useFetch(pendingUrl, "GET", false);

  const {
    data: approvedRejectedData,
    fetchData: fetchApprovedRejected,
    loading: approvedRejectedLoading,
  } = useFetch(approvedRejectedUrl, "GET", false);

  const loading = pendingLoading || approvedRejectedLoading;

  // ✅ Fetch both whenever the URLs change (email/status)
  useEffect(() => {
    fetchPending();
    fetchApprovedRejected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUrl, approvedRejectedUrl]);

  // ✅ Refresh both (fixes the “refresh makes other tab 0” issue)
  const refreshBoth = useCallback(() => {
    fetchPending();
    fetchApprovedRejected();
  }, [fetchPending, fetchApprovedRejected]);

  const pending: any[] = (pendingData as any)?.requests || [];
  const approvedRejected: any[] = (approvedRejectedData as any)?.requests || [];

  const activeList = tab === "pending" ? pending : approvedRejected;

  const filtered = useMemo(() => {
    const s = searchText.toLowerCase().trim();
    if (!s) return activeList;
    return activeList.filter((r) => {
      const file = getFilename(r).toLowerCase();
      const id = String(r.request_id || "").toLowerCase();
      return file.includes(s) || id.includes(s);
    });
  }, [activeList, searchText]);

  return (
    <Box
      sx={{
        height: `calc(100vh - ${topOffset})`,
        mt: topOffset,
        p: { xs: 1.5, md: 2.5 },
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: color_background,
      }}
    >
      <Loader loading={loading} />

      <Paper
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRadius: "12px",
          border: `1px solid ${color_border}`,
          overflow: "hidden",
          backgroundColor: color_white,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: { xs: 1.75, md: 2.25 },
            py: 1.5,
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            borderBottom: `1px solid ${color_border}`,
            backgroundColor: color_white,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900, color: color_secondary, fontSize: "1rem" }}>
              My Requests
            </Typography>
            <Typography sx={{ mt: 0.25, color: color_text_light, fontSize: "0.8rem", fontWeight: 700 }}>
              Check status, approvals, and uploaded files.
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Search by file or request id..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              width: { xs: "100%", sm: 360 },
              "& .MuiOutlinedInput-root": {
                height: 36,
                borderRadius: "10px",
                backgroundColor: color_background,
                fontSize: "0.82rem",
                color: color_text_primary,
              },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: color_border },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: color_secondary,
                borderWidth: 2,
              },
              "& input::placeholder": { color: color_text_light, opacity: 1 },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon sx={{ fontSize: 18, color: color_text_light }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Tabs */}
        <Box sx={{ px: { xs: 1.25, md: 2.25 }, pt: 1, background: color_white }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                minHeight: 44,
                textTransform: "none",
                fontWeight: 900,
                borderRadius: 2,
                mr: 1,
                color: color_text_light,
                border: `1px solid ${color_border}`,
              },
              "& .Mui-selected": {
                color: color_white,
                backgroundColor: tab === "pending" ? color_warning : color_secondary,
                border: "none",
              },
              "& .MuiTabs-indicator": { display: "none" },
            }}
          >
            <Tab value="pending" label={`Pending (${pending.length})`} />
            <Tab value="approved" label={`Approved/Rejected (${approvedRejected.length})`} />
          </Tabs>

          <Divider sx={{ mt: 1, borderColor: color_border }} />
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            p: { xs: 1.25, md: 2.25 },
            backgroundColor: color_background,
          }}
        >
          {filtered.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px dashed ${color_border}`,
                backgroundColor: color_white,
              }}
            >
              <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
                {tab === "pending" ? "No pending requests." : "No approved/rejected requests."}
              </Typography>
              <Typography sx={{ mt: 0.5, color: color_text_light, fontWeight: 700, fontSize: "0.85rem" }}>
                If you recently submitted something, refresh in a moment.
              </Typography>
              <Button
                onClick={refreshBoth}
                variant="contained"
                sx={{
                  mt: 1.5,
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: 2,
                  backgroundColor: color_secondary,
                  "&:hover": { backgroundColor: color_secondary_dark },
                }}
              >
                Refresh
              </Button>
            </Paper>
          ) : (
            <Stack spacing={1.25}>
              {filtered.map((req) => {
                const chip = statusChipSx(req.status);
                return (
                  <Paper
                    key={req.request_id}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${color_border}`,
                      backgroundColor: color_white,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            color: color_text_primary,
                            fontSize: "0.95rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "65vw",
                          }}
                          title={getFilename(req)}
                        >
                          {getFilename(req)}
                        </Typography>
                        <Typography sx={{ mt: 0.25, color: color_text_light, fontWeight: 800, fontSize: "0.8rem" }}>
                          Request #{req.request_id} • Created {formatWhen(req.created_at)} • {getChangeCount(req)} changes
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={chip.label}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: "0.72rem",
                            fontWeight: 900,
                            borderRadius: "999px",
                            ...chip.sx,
                          }}
                        />
                        <Button
                          onClick={() => setSelectedRequest(req)}
                          variant="contained"
                          sx={{
                            textTransform: "none",
                            fontWeight: 900,
                            borderRadius: 2,
                            backgroundColor: color_secondary,
                            "&:hover": { backgroundColor: color_secondary_dark },
                          }}
                        >
                          Details
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>

      <MyRequestDetailsModal
        open={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </Box>
  );
};

export default MyRequests;
