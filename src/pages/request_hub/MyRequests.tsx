"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Paper,
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
  color_error,
} from "../../constants/colors";
import {
  APPROVED_REJECTED_STATUS_CSV,
  PENDING_REVIEW_STATUS_LABEL,
  PENDING_STATUS_CSV,
  REVIEW_STATUS_VALUES,
  UNKNOWN_STATUS_LABEL,
  getReviewStatusLabel,
} from "../../constants/statuses";
import { API_ORIGIN } from "../../config/api";

import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import MyRequestDetailsModal from "./MyRequestDetailsModal";
import { useSelector } from "react-redux";
import RequestStatusSummary from "./RequestStatusSummary";

const API_BASE = API_ORIGIN;

const getFilename = (req: any) => String(req?.details?.[0]?.filename || "—");
const getChangeCount = (req: any) => (Array.isArray(req?.details) ? req.details.length : 0);

const formatWhen = (iso?: string) => {
  if (!iso) return "—";
  return String(iso).replace("T", " ").replace("Z", "");
};

const statusChipSx = (status?: string) => {
  const s = String(status || "").toLowerCase();

  if (s.includes(REVIEW_STATUS_VALUES.APPROVED)) {
    return {
      label: getReviewStatusLabel(REVIEW_STATUS_VALUES.APPROVED),
      sx: {
        backgroundColor: "rgba(39, 174, 96, 0.12)",
        border: "1px solid rgba(39, 174, 96, 0.25)",
        color: "#166534",
      },
    };
  }
  if (s.includes(REVIEW_STATUS_VALUES.PENDING)) {
    return {
      label: PENDING_REVIEW_STATUS_LABEL,
      sx: {
        backgroundColor: "rgba(243, 156, 18, 0.14)",
        border: "1px solid rgba(243, 156, 18, 0.25)",
        color: color_text_primary,
      },
    };
  }
  if (s.includes(REVIEW_STATUS_VALUES.REJECTED)) {
    return {
      label: getReviewStatusLabel(REVIEW_STATUS_VALUES.REJECTED),
      sx: {
        backgroundColor: "rgba(231, 76, 60, 0.12)",
        border: "1px solid rgba(231, 76, 60, 0.25)",
        color: "#991b1b",
      },
    };
  }
  return {
    label: UNKNOWN_STATUS_LABEL,
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

const getStatusCount = (requests: any[], status: string) =>
  requests.filter((request) => String(request?.status || "").trim().toLowerCase() === status)
    .length;

const MyRequests: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>(REVIEW_STATUS_VALUES.PENDING);
  const [searchText, setSearchText] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const user = useSelector((state: any) => state.auth.user);

  const pendingUrl = useMemo(
    () => buildRequestsUrl(PENDING_STATUS_CSV, user?.id || undefined),
    [user?.id]
  );

  const approvedRejectedUrl = useMemo(
    () => buildRequestsUrl(APPROVED_REJECTED_STATUS_CSV, user?.id || undefined),
    [user?.id]
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

  useEffect(() => {
    fetchPending();
    fetchApprovedRejected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUrl, approvedRejectedUrl]);

  const refreshBoth = useCallback(() => {
    fetchPending();
    fetchApprovedRejected();
  }, [fetchPending, fetchApprovedRejected]);

  const pending: any[] = useMemo(
    () => ((pendingData as any)?.requests || []),
    [pendingData]
  );
  const approvedRejected: any[] = useMemo(
    () => ((approvedRejectedData as any)?.requests || []),
    [approvedRejectedData]
  );
  const allRequests = useMemo(
    () => [...pending, ...approvedRejected],
    [pending, approvedRejected]
  );
  const requestTotal = allRequests.length;
  const statusSummaryItems = useMemo(
    () => [
      {
        key: REVIEW_STATUS_VALUES.PENDING,
        label: "Pending",
        count: getStatusCount(allRequests, REVIEW_STATUS_VALUES.PENDING),
        total: requestTotal,
        accent: color_warning,
        background: "rgba(243, 156, 18, 0.10)",
      },
      {
        key: REVIEW_STATUS_VALUES.APPROVED,
        label: "Approved",
        count: getStatusCount(allRequests, REVIEW_STATUS_VALUES.APPROVED),
        total: requestTotal,
        accent: "#166534",
        background: "rgba(39, 174, 96, 0.10)",
      },
      {
        key: REVIEW_STATUS_VALUES.REJECTED,
        label: "Rejected",
        count: getStatusCount(allRequests, REVIEW_STATUS_VALUES.REJECTED),
        total: requestTotal,
        accent: color_error,
        background: "rgba(231, 76, 60, 0.10)",
      },
    ],
    [allRequests, requestTotal]
  );
  const activeList = allRequests;
  const statusFilteredList = useMemo(
    () =>
      activeList.filter(
        (request) =>
          String(request?.status || "").trim().toLowerCase() === selectedStatus
      ),
    [activeList, selectedStatus]
  );

  const filtered = useMemo(() => {
    const s = searchText.toLowerCase().trim();
    if (!s) return statusFilteredList;

    return statusFilteredList.filter((r) => {
      const file = getFilename(r).toLowerCase();
      const id = String(r.request_id || "").toLowerCase();
      return file.includes(s) || id.includes(s);
    });
  }, [statusFilteredList, searchText]);

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        p: { xs: 1, md: 1.25 },
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: color_background,
        display: "flex",
        flexDirection: "column",
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
            <Typography
              sx={{
                mt: 0.25,
                color: color_text_light,
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              Check status, approvals, and uploaded files.
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Search by file or request id..."
            value={searchText}
            data-testid="search-input"
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

        <Box sx={{ px: { xs: 1.25, md: 2.25 }, pt: 1, background: color_white, flexShrink: 0 }}>
          <RequestStatusSummary
            items={statusSummaryItems}
            selectedKey={selectedStatus}
            onSelect={setSelectedStatus}
          />

          <Divider sx={{ mt: 1, borderColor: color_border }} />
        </Box>

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
                No {selectedStatus} requests found.
              </Typography>
              <Typography
                sx={{
                  mt: 0.5,
                  color: color_text_light,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                If you recently submitted something, refresh in a moment.
              </Typography>
              <Button
                onClick={refreshBoth}
                variant="contained"
                data-testid="refresh-btn"
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
                    data-testid={`request-row-${req.request_id}`}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${color_border}`,
                      backgroundColor: color_white,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
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

                        <Typography
                          sx={{
                            mt: 0.25,
                            color: color_text_light,
                            fontWeight: 800,
                            fontSize: "0.8rem",
                          }}
                        >
                          Request #{req.request_id} • Created {formatWhen(req.created_at)} •{" "}
                          {getChangeCount(req)} changes
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          data-testid={`status-chip-${req.request_id}`}
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
                          data-testid={`details-btn-${req.request_id}`}
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
