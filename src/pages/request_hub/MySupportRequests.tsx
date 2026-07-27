"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import toast from "react-hot-toast";

import Loader from "../../components/Loader";
import SupportRequestsTable, { SupportRequestsTableColumn } from "../../components/tables/SupportRequestsTable";
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
import {
  REQUEST_HUB_CONTENT_SX,
  REQUEST_HUB_DIALOG_CONTENT_SX,
  REQUEST_HUB_DIALOG_HEADER_SX,
  REQUEST_HUB_DIALOG_PAPER_SX,
  REQUEST_HUB_HEADER_ICON_SX,
  REQUEST_HUB_HEADER_SUBTITLE_SX,
  REQUEST_HUB_HEADER_SX,
  REQUEST_HUB_HEADER_TITLE_SX,
  REQUEST_HUB_PRIMARY_BUTTON_SX,
  REQUEST_HUB_SECONDARY_BUTTON_SX,
  REQUEST_HUB_SURFACE_SX,
} from "./styles";

type StatusFilter = "all" | (typeof SUPPORT_REQUEST_STATUS)[keyof typeof SUPPORT_REQUEST_STATUS];

const PAGE_SIZE = 20;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchRequests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiRequest<SupportRequestListResponse>(
        apiUrl(`support-requests/mine?page=${page}&page_size=${PAGE_SIZE}`),
        "GET"
      );
      const items = Array.isArray(response?.items) ? response.items : [];
      setRequests(items);
      setCurrentPage(response?.page || page);
      setTotalPages(Math.max(response?.total_pages || 1, 1));
      setTotalItems(response?.total_items || items.length);
    } catch (error: any) {
      toast.error(error?.message || "Unable to load your support requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests(1);
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

  const columns = useMemo<SupportRequestsTableColumn[]>(
    () => [
      {
        key: "subject",
        label: "Subject",
        cellSx: { minWidth: 220, whiteSpace: "normal" },
        render: (request) => (
          <Box>
            <Typography sx={{ fontWeight: 900, color: color_text_primary, lineHeight: 1.35 }}>
              {request.subject}
            </Typography>
            <Typography sx={{ mt: 0.4, fontSize: "0.76rem", color: color_text_light }}>
              #{request.id}
            </Typography>
          </Box>
        ),
      },
      {
        key: "type",
        label: "Type",
        cellSx: { minWidth: 150, whiteSpace: "normal" },
        render: (request) => getSupportRequestTypeLabel(request.request_type),
      },
      {
        key: "submitted",
        label: "Submitted",
        cellSx: { minWidth: 180, whiteSpace: "normal" },
        render: (request) => formatSupportRequestDate(request.created_at),
      },
      {
        key: "status",
        label: "Status",
        align: "center",
        cellSx: { minWidth: 130 },
        render: (request) => {
          const status = getSupportRequestStatusChip(request.status);
          return (
            <Chip
              label={status.label}
              size="small"
              sx={{ borderRadius: "999px", fontWeight: 900, ...status.sx }}
            />
          );
        },
      },
      {
        key: "assigned_team",
        label: "Assigned Team",
        cellSx: { minWidth: 180, whiteSpace: "normal" },
        render: (request) => request.assigned_team || "-",
      },
      {
        key: "latest_update",
        label: "Latest Update",
        cellSx: { minWidth: 240, maxWidth: 320, whiteSpace: "normal" },
        render: (request) => (
          <Typography
            sx={{
              color: request.admin_note ? color_text_secondary : color_text_light,
              lineHeight: 1.55,
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {request.admin_note ||
              (request.assigned_team
                ? `Assigned to ${request.assigned_team}.`
                : "No update yet.")}
          </Typography>
        ),
      },
      {
        key: "message",
        label: "Message",
        cellSx: { minWidth: 280, maxWidth: 360, whiteSpace: "normal" },
        render: (request) => (
          <Typography
            sx={{
              color: color_text_secondary,
              lineHeight: 1.55,
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {request.message}
          </Typography>
        ),
      },
    ],
    []
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

      <Box
        sx={{
          ...REQUEST_HUB_SURFACE_SX,
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
        }}
      >
        <Box
          sx={{
            ...REQUEST_HUB_HEADER_SX,
            px: { xs: 1.75, md: 2.5 },
            py: { xs: 1.65, md: 2 },
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
            <Box sx={{ ...REQUEST_HUB_HEADER_ICON_SX, width: 42, height: 42, minWidth: 42 }}>
              <SupportAgentRoundedIcon />
            </Box>
            <Box>
              <Typography sx={{ ...REQUEST_HUB_HEADER_TITLE_SX, fontSize: 18 }}>
                My Support Requests
              </Typography>
              <Typography
                sx={{ ...REQUEST_HUB_HEADER_SUBTITLE_SX, fontSize: 13.5, mt: 0.2 }}
              >
                Submit a question or technical issue, then follow every update here.
              </Typography>
            </Box>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              onClick={() => void fetchRequests(currentPage)}
              startIcon={<RefreshRoundedIcon />}
              sx={REQUEST_HUB_SECONDARY_BUTTON_SX}
            >
              Refresh
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
              sx={REQUEST_HUB_PRIMARY_BUTTON_SX}
            >
              New Support Request
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            ...REQUEST_HUB_CONTENT_SX,
            p: { xs: 1.25, md: 2.25 },
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
            flex: 1,
            minHeight: 0,
          }}
        >
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
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
                    px: 1.5,
                    py: 0.8,
                    color: selected ? color_white : color_text_secondary,
                    background: selected
                      ? `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`
                      : color_white,
                    border: `1px solid ${selected ? color_secondary_dark : color_border}`,
                    "&:hover": {
                      background: selected
                        ? `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`
                        : color_white_smoke,
                    },
                  }}
                >
                  {option.label} ({counts[option.key]})
                </Button>
              );
            })}
          </Stack>

          <SupportRequestsTable
            title="My Support Tickets"
            rows={visibleRequests}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            emptyText={
              selectedFilter === "all"
                ? "No support requests found."
                : "No support requests with this status on this page."
            }
            columns={columns}
            onPrev={() => void fetchRequests(currentPage - 1)}
            onNext={() => void fetchRequests(currentPage + 1)}
          />
        </Box>
      </Box>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            ...REQUEST_HUB_DIALOG_PAPER_SX,
            background: color_white,
          },
        }}
      >
        <Box
          sx={{
            ...REQUEST_HUB_DIALOG_HEADER_SX,
            px: { xs: 1.6, md: 2.2 },
            py: 1.2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: color_white, fontWeight: 950 }}>
            Create Support Request
          </Typography>
          <IconButton
            aria-label="Close support request"
            onClick={() => setCreateOpen(false)}
            sx={{
              color: color_white,
              "&:hover": { background: "rgba(255,255,255,0.12)" },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ ...REQUEST_HUB_DIALOG_CONTENT_SX, p: 0 }}>
          <SupportRequestCard
            surface="dialog"
            titleId="new-support-request-title"
            onSubmitted={() => {
              setCreateOpen(false);
              void fetchRequests(1);
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
