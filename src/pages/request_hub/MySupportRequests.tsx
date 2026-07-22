"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MarkEmailUnreadRoundedIcon from "@mui/icons-material/MarkEmailUnreadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import toast from "react-hot-toast";

import Loader from "../../components/Loader";
import SupportRequestCard from "../contact_us/SupportRequestCard";
import { apiUrl } from "../../config/api";
import { apiRequest } from "../../hooks/useFetch";
import {
  color_background,
  color_border,
  color_secondary,
  color_secondary_dark,
  color_text_light,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../constants/colors";
import {
  SUPPORT_REQUEST_STATUS,
  SupportRequestItem,
  SupportRequestListResponse,
  formatSupportRequestDate,
  getSupportRequestStatusChip,
  getSupportRequestTypeLabel,
} from "./supportRequests";

type StatusFilter = "all" | (typeof SUPPORT_REQUEST_STATUS)[keyof typeof SUPPORT_REQUEST_STATUS];

const filterOptions: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All requests" },
  { key: SUPPORT_REQUEST_STATUS.OPEN, label: "Open" },
  { key: SUPPORT_REQUEST_STATUS.IN_PROGRESS, label: "In Progress" },
  { key: SUPPORT_REQUEST_STATUS.CLOSED, label: "Closed" },
];

export default function MySupportRequests() {
  const [requests, setRequests] = useState<SupportRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>("all");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<SupportRequestListResponse>(
        apiUrl("support-requests/mine?page=1&page_size=100"),
        "GET"
      );
      setRequests(Array.isArray(response?.items) ? response.items : []);
    } catch (error: any) {
      toast.error(error?.message || "Unable to load your support requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const counts = useMemo(
    () => ({
      all: requests.length,
      [SUPPORT_REQUEST_STATUS.OPEN]: requests.filter(
        (request) => request.status === SUPPORT_REQUEST_STATUS.OPEN
      ).length,
      [SUPPORT_REQUEST_STATUS.IN_PROGRESS]: requests.filter(
        (request) => request.status === SUPPORT_REQUEST_STATUS.IN_PROGRESS
      ).length,
      [SUPPORT_REQUEST_STATUS.CLOSED]: requests.filter(
        (request) => request.status === SUPPORT_REQUEST_STATUS.CLOSED
      ).length,
    }),
    [requests]
  );

  const visibleRequests = useMemo(
    () =>
      selectedFilter === "all"
        ? requests
        : requests.filter((request) => request.status === selectedFilter),
    [requests, selectedFilter]
  );

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        p: { xs: 1, md: 1.25 },
        boxSizing: "border-box",
        background: color_background,
        overflow: "auto",
      }}
    >
      <Loader loading={loading} />

      <Paper
        elevation={0}
        sx={{
          minHeight: "100%",
          border: `1px solid ${color_border}`,
          borderRadius: "22px",
          overflow: "hidden",
          background: color_white,
        }}
      >
        <Box
          sx={{
            px: { xs: 1.75, md: 2.5 },
            py: { xs: 1.65, md: 2 },
            borderBottom: `1px solid ${color_border}`,
            background:
              "linear-gradient(120deg, rgba(238,245,255,0.95) 0%, rgba(255,255,255,1) 62%)",
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                display: "grid",
                placeItems: "center",
                color: color_white,
                background: color_secondary_dark,
                boxShadow: "0 10px 18px rgba(0,58,122,0.18)",
              }}
            >
              <SupportAgentRoundedIcon />
            </Box>
            <Box>
              <Typography sx={{ color: color_text_primary, fontWeight: 950, fontSize: 18 }}>
                My Support Requests
              </Typography>
              <Typography sx={{ color: color_text_secondary, fontWeight: 700, fontSize: 13.5, mt: 0.2 }}>
                Submit a question or technical issue, then follow every update here.
              </Typography>
            </Box>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              onClick={() => void fetchRequests()}
              startIcon={<RefreshRoundedIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                borderRadius: "12px",
                color: color_secondary_dark,
                border: `1px solid ${color_border}`,
                background: color_white,
              }}
            >
              Refresh
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
              sx={{
                textTransform: "none",
                fontWeight: 950,
                borderRadius: "12px",
                background: color_secondary_dark,
                boxShadow: "0 10px 18px rgba(0,58,122,0.18)",
                "&:hover": { background: color_secondary },
              }}
            >
              New support request
            </Button>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 1.25, md: 2.25 }, background: color_background }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.75 }}>
            {filterOptions.map((option) => {
              const selected = selectedFilter === option.key;
              return (
                <Button
                  key={option.key}
                  onClick={() => setSelectedFilter(option.key)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: "12px",
                    px: 1.35,
                    py: 0.75,
                    color: selected ? color_white : color_text_secondary,
                    background: selected ? color_secondary_dark : color_white,
                    border: `1px solid ${selected ? color_secondary_dark : color_border}`,
                    "&:hover": {
                      background: selected ? color_secondary_dark : color_white_smoke,
                    },
                  }}
                >
                  {option.label} ({counts[option.key]})
                </Button>
              );
            })}
          </Stack>

          {visibleRequests.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                py: { xs: 4, md: 5 },
                px: 2,
                borderRadius: "18px",
                border: `1px dashed ${color_border}`,
                background: color_white,
                textAlign: "center",
              }}
            >
              <MarkEmailUnreadRoundedIcon sx={{ color: color_secondary_dark, fontSize: 34, mb: 0.75 }} />
              <Typography sx={{ color: color_text_primary, fontWeight: 950, fontSize: 17 }}>
                No support requests to show
              </Typography>
              <Typography sx={{ color: color_text_light, fontWeight: 700, mt: 0.5, fontSize: 13.5 }}>
                Start a request when you need help, and its progress will appear here.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.15}>
              {visibleRequests.map((request) => {
                const status = getSupportRequestStatusChip(request.status);
                return (
                  <Paper
                    key={request.id}
                    elevation={0}
                    sx={{
                      p: { xs: 1.4, md: 1.7 },
                      borderRadius: "18px",
                      border: `1px solid ${color_border}`,
                      borderLeft: `5px solid ${status.accent}`,
                      background: color_white,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.25,
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ color: color_text_primary, fontWeight: 950, fontSize: 16 }}>
                          {request.subject}
                        </Typography>
                        <Typography sx={{ color: color_text_light, fontWeight: 800, fontSize: 12.8, mt: 0.25 }}>
                          #{request.id} · {getSupportRequestTypeLabel(request.request_type)} · Submitted {formatSupportRequestDate(request.created_at)}
                        </Typography>
                      </Box>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{ fontWeight: 950, borderRadius: "999px", ...status.sx }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        color: color_text_secondary,
                        fontWeight: 700,
                        fontSize: 13.5,
                        lineHeight: 1.65,
                        mt: 1.15,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {request.message}
                    </Typography>

                    {(request.assigned_team || request.admin_note) && (
                      <Box
                        sx={{
                          mt: 1.25,
                          p: 1.1,
                          borderRadius: "12px",
                          background: color_white_smoke,
                          border: `1px solid ${color_border}`,
                        }}
                      >
                        {request.assigned_team ? (
                          <Typography sx={{ color: color_text_primary, fontWeight: 900, fontSize: 13.2 }}>
                            Assigned team: {request.assigned_team}
                          </Typography>
                        ) : null}
                        {request.admin_note ? (
                          <Typography sx={{ color: color_text_secondary, fontWeight: 700, fontSize: 13.2, mt: request.assigned_team ? 0.45 : 0, whiteSpace: "pre-wrap" }}>
                            {request.admin_note}
                          </Typography>
                        ) : null}
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "22px",
            overflow: "hidden",
            background: color_white,
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 1.6, md: 2.2 },
            py: 1.1,
            borderBottom: `1px solid ${color_border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: color_white_smoke,
          }}
        >
          <Typography sx={{ color: color_text_primary, fontWeight: 950 }}>
            New Support Request
          </Typography>
          <IconButton aria-label="Close support request" onClick={() => setCreateOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          <SupportRequestCard
            surface="dialog"
            titleId="new-support-request-title"
            onSubmitted={() => {
              setCreateOpen(false);
              void fetchRequests();
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
