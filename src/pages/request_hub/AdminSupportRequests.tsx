"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import MarkEmailUnreadRoundedIcon from "@mui/icons-material/MarkEmailUnreadRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import toast from "react-hot-toast";

import Loader from "../../components/Loader";
import SupportRequestsTable, { SupportRequestsTableColumn } from "../../components/tables/SupportRequestsTable";
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
  SupportRequestStatus,
  formatSupportRequestDate,
  getSupportRequestStatusChip,
  getSupportRequestStatusLabel,
  getSupportRequestTypeLabel,
} from "./supportRequests";
import {
  REQUEST_HUB_CONTENT_SX,
  REQUEST_HUB_DIALOG_ACTIONS_SX,
  REQUEST_HUB_DIALOG_CONTENT_SX,
  REQUEST_HUB_DIALOG_HEADER_SX,
  REQUEST_HUB_DIALOG_PAPER_SX,
  REQUEST_HUB_HEADER_ICON_SX,
  REQUEST_HUB_HEADER_SUBTITLE_SX,
  REQUEST_HUB_HEADER_SX,
  REQUEST_HUB_HEADER_TITLE_SX,
  REQUEST_HUB_PANEL_SX,
  REQUEST_HUB_PRIMARY_BUTTON_SX,
  REQUEST_HUB_SECONDARY_BUTTON_SX,
  REQUEST_HUB_SURFACE_SX,
} from "./styles";

type ManagementDraft = {
  status: SupportRequestStatus;
  assignedTeam: string;
  assignedTeamRecipients: string;
  adminNote: string;
};

const PAGE_SIZE = 20;

const createDraft = (request: SupportRequestItem): ManagementDraft => ({
  status: request.status || SUPPORT_REQUEST_STATUS.OPEN,
  assignedTeam: request.assigned_team || "",
  assignedTeamRecipients: request.assigned_team_recipients || "",
  adminNote: request.admin_note || "",
});

export default function AdminSupportRequests() {
  const [requests, setRequests] = useState<SupportRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportRequestStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeRequest, setActiveRequest] = useState<SupportRequestItem | null>(null);
  const [draft, setDraft] = useState<ManagementDraft | null>(null);

  const fetchRequests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiRequest<SupportRequestListResponse>(
        apiUrl(`support-requests/admin?page=${page}&page_size=${PAGE_SIZE}`),
        "GET"
      );
      const items = Array.isArray(response?.items) ? response.items : [];
      setRequests(items);
      setCurrentPage(response?.page || page);
      setTotalPages(Math.max(response?.total_pages || 1, 1));
      setTotalItems(response?.total_items || items.length);
    } catch (error: any) {
      toast.error(error?.message || "Unable to load support requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests(1);
  }, [fetchRequests]);

  const statusCounts = useMemo(
    () => ({
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

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!normalizedSearch) return true;

      return [
        request.id,
        request.requester_name,
        request.requester_email,
        request.subject,
        request.message,
        request.assigned_team,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [requests, search, statusFilter]);

  const openManager = useCallback((request: SupportRequestItem) => {
    setActiveRequest(request);
    setDraft(createDraft(request));
  }, []);

  const closeManager = () => {
    if (saving) return;
    setActiveRequest(null);
    setDraft(null);
  };

  const saveManagement = async () => {
    if (!activeRequest || !draft) return;
    if (
      draft.status === SUPPORT_REQUEST_STATUS.IN_PROGRESS &&
      (!draft.assignedTeam.trim() || !draft.assignedTeamRecipients.trim())
    ) {
      toast.error(
        "Choose the team and enter at least one forwarding email before marking this In Progress."
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await apiRequest<SupportRequestItem>(
        apiUrl(`support-requests/${activeRequest.id}`),
        "PUT",
        {
          status: draft.status,
          assigned_team: draft.assignedTeam.trim(),
          assigned_team_recipients: draft.assignedTeamRecipients.trim(),
          admin_note: draft.adminNote.trim(),
        }
      );
      setRequests((current) =>
        current.map((request) => (request.id === updated.id ? updated : request))
      );
      toast.success(
        draft.status === SUPPORT_REQUEST_STATUS.IN_PROGRESS
          ? "Request forwarded and the user has been notified."
          : `Request marked ${getSupportRequestStatusLabel(draft.status)} and the user has been notified.`
      );
      closeManager();
    } catch (error: any) {
      toast.error(error?.message || "Unable to update this support request.");
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = <K extends keyof ManagementDraft>(key: K, value: ManagementDraft[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

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
        key: "requester",
        label: "Requester",
        cellSx: { minWidth: 220, whiteSpace: "normal" },
        render: (request) => (
          <Box>
            <Typography sx={{ fontWeight: 800, color: color_text_primary }}>
              {request.requester_name}
            </Typography>
            <Typography sx={{ mt: 0.35, fontSize: "0.76rem", color: color_text_secondary }}>
              {request.requester_email}
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
        render: (request) =>
          request.assigned_team ? (
            <Box>
              <Typography sx={{ fontWeight: 800, color: color_text_primary }}>
                {request.assigned_team}
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: "0.76rem", color: color_text_light }}>
                {request.status === SUPPORT_REQUEST_STATUS.CLOSED ? "Closed" : "Forwarded"}
              </Typography>
            </Box>
          ) : (
            "-"
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
      {
        key: "actions",
        label: "Actions",
        align: "center",
        cellSx: { minWidth: 130 },
        render: (request) => (
          <Button
            onClick={() => openManager(request)}
            variant="contained"
            sx={{
              ...REQUEST_HUB_PRIMARY_BUTTON_SX,
              minWidth: 96,
              borderRadius: "10px",
              fontWeight: 950,
              px: 2.1,
              py: 0.75,
            }}
          >
            Manage
          </Button>
        ),
      },
    ],
    [openManager]
  );

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        p: { xs: 1, md: 1.25 },
        boxSizing: "border-box",
        overflow: "auto",
        background: color_background,
      }}
    >
      <Loader loading={loading || saving} />

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
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={REQUEST_HUB_HEADER_ICON_SX}>
              <SupportAgentRoundedIcon />
            </Box>
            <Box>
              <Typography sx={{ ...REQUEST_HUB_HEADER_TITLE_SX, fontSize: 18 }}>
                Support Request Desk
              </Typography>
              <Typography
                sx={{ ...REQUEST_HUB_HEADER_SUBTITLE_SX, fontSize: 13.5, mt: 0.2 }}
              >
                Review requests, forward work to the right team, and keep users informed.
              </Typography>
            </Box>
          </Box>

          <Button
            onClick={() => void fetchRequests(currentPage)}
            startIcon={<RefreshRoundedIcon />}
            sx={{
              ...REQUEST_HUB_SECONDARY_BUTTON_SX,
              alignSelf: { xs: "stretch", md: "center" },
            }}
          >
            Refresh queue
          </Button>
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
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25}>
            {[
              {
                status: SUPPORT_REQUEST_STATUS.OPEN,
                icon: <MarkEmailUnreadRoundedIcon />,
                helper: "Needs triage",
              },
              {
                status: SUPPORT_REQUEST_STATUS.IN_PROGRESS,
                icon: <SupportAgentRoundedIcon />,
                helper: "With a team",
              },
              {
                status: SUPPORT_REQUEST_STATUS.CLOSED,
                icon: <AssignmentTurnedInRoundedIcon />,
                helper: "Completed",
              },
            ].map(({ status, icon, helper }) => {
              const chip = getSupportRequestStatusChip(status);
              const selected = statusFilter === status;
              return (
                <Button
                  key={status}
                  onClick={() => setStatusFilter(selected ? "all" : status)}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    p: 1.45,
                    borderRadius: "18px",
                    justifyContent: "flex-start",
                    textAlign: "left",
                    textTransform: "none",
                    background: selected
                      ? `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`
                      : color_white,
                    border: `1px solid ${selected ? color_secondary_dark : color_border}`,
                    color: selected ? color_white : color_text_primary,
                    boxShadow: selected ? "0 12px 24px rgba(0, 58, 122, 0.22)" : "none",
                    "&:hover": {
                      background: selected
                        ? `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`
                        : color_white,
                    },
                  }}
                >
                  <Box
                    sx={{
                      mr: 1.15,
                      width: 42,
                      height: 42,
                      borderRadius: "14px",
                      display: "grid",
                      placeItems: "center",
                      color: selected ? color_white : chip.accent,
                      background: selected ? "rgba(255,255,255,0.14)" : chip.sx.backgroundColor,
                      border: `1px solid ${selected ? "rgba(255,255,255,0.22)" : chip.sx.border}`,
                    }}
                  >
                    {icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 950,
                        fontSize: 15,
                        color: selected ? color_white : color_text_primary,
                      }}
                    >
                      {getSupportRequestStatusLabel(status)}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.2,
                        fontWeight: 700,
                        fontSize: 12.5,
                        color: selected ? "rgba(255,255,255,0.84)" : color_text_light,
                      }}
                    >
                      {helper}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      ml: 1,
                      px: 1.05,
                      py: 0.55,
                      borderRadius: "999px",
                      background: selected ? "rgba(255,255,255,0.14)" : color_white_smoke,
                      border: `1px solid ${selected ? "rgba(255,255,255,0.22)" : color_border}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 950,
                        fontSize: 12.5,
                        color: selected ? color_white : color_text_primary,
                      }}
                    >
                      {statusCounts[status]}
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.1} sx={{ alignItems: "stretch" }}>
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              size="small"
              placeholder="Search requester, subject, request number, or team..."
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: color_text_light, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 40,
                  borderRadius: "12px",
                  background: color_white,
                  fontWeight: 700,
                  fontSize: 13.5,
                },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: color_border },
                "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: color_secondary,
                },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: color_secondary,
                },
              }}
            />
            <Button
              onClick={() => setStatusFilter("all")}
              sx={{
                ...REQUEST_HUB_SECONDARY_BUTTON_SX,
                minWidth: { xs: "100%", md: 110 },
                height: 40,
                px: 2,
                color: color_text_secondary,
                whiteSpace: "nowrap",
                alignSelf: "stretch",
              }}
            >
              All ({totalItems})
            </Button>
          </Stack>

          <SupportRequestsTable
            title="Support Tickets"
            rows={filteredRequests}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            emptyText={
              search.trim() || statusFilter !== "all"
                ? "No matching support requests on this page."
                : "No support requests found."
            }
            columns={columns}
            onPrev={() => void fetchRequests(currentPage - 1)}
            onNext={() => void fetchRequests(currentPage + 1)}
          />
        </Box>
      </Box>

      <Dialog
        open={Boolean(activeRequest && draft)}
        onClose={closeManager}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: REQUEST_HUB_DIALOG_PAPER_SX }}
      >
        {activeRequest && draft ? (
          <>
            <DialogTitle
              sx={{
                ...REQUEST_HUB_DIALOG_HEADER_SX,
                px: { xs: 1.8, md: 2.5 },
                py: 1.75,
              }}
            >
              <Typography sx={{ color: color_white, fontWeight: 950, fontSize: 18 }}>
                Manage Support Request #{activeRequest.id}
              </Typography>
              <Typography
                sx={{ color: "rgba(255,255,255,0.84)", fontWeight: 700, fontSize: 13, mt: 0.3 }}
              >
                Updating the request emails the user. Forwarding also emails the selected team.
              </Typography>
            </DialogTitle>
            <DialogContent
              sx={{
                ...REQUEST_HUB_DIALOG_CONTENT_SX,
                px: { xs: 1.8, md: 2.5 },
                py: 2.2,
              }}
            >
              <Stack spacing={1.55}>
                <Box sx={{ ...REQUEST_HUB_PANEL_SX, p: 1.35, borderRadius: "15px" }}>
                  <Typography sx={{ color: color_text_primary, fontWeight: 950, fontSize: 16 }}>
                    {activeRequest.subject}
                  </Typography>
                  <Typography
                    sx={{ color: color_text_secondary, fontWeight: 800, fontSize: 13.2, mt: 0.35 }}
                  >
                    {activeRequest.requester_name} - {activeRequest.requester_email}
                  </Typography>
                  <Typography
                    sx={{ color: color_text_light, fontWeight: 700, fontSize: 12.6, mt: 0.25 }}
                  >
                    {getSupportRequestTypeLabel(activeRequest.request_type)} - Submitted{" "}
                    {formatSupportRequestDate(activeRequest.created_at)}
                  </Typography>
                  <Typography
                    sx={{
                      color: color_text_secondary,
                      fontWeight: 700,
                      fontSize: 13.5,
                      mt: 1.05,
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {activeRequest.message}
                  </Typography>
                  {activeRequest.screenshot_url ? (
                    <Button
                      component="a"
                      href={activeRequest.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      startIcon={<OpenInNewRoundedIcon />}
                      sx={{
                        ...REQUEST_HUB_SECONDARY_BUTTON_SX,
                        mt: 1,
                        color: color_secondary,
                      }}
                    >
                      View screenshot
                      {activeRequest.screenshot_file_name
                        ? `: ${activeRequest.screenshot_file_name}`
                        : ""}
                    </Button>
                  ) : null}
                </Box>

                <Divider sx={{ borderColor: color_border }} />

                <TextField
                  select
                  label="Request status"
                  value={draft.status}
                  onChange={(event) =>
                    updateDraft("status", event.target.value as SupportRequestStatus)
                  }
                  fullWidth
                  size="small"
                  helperText="Use In Progress when you forward it to a team. Use Closed only after the request is complete."
                >
                  <MenuItem value={SUPPORT_REQUEST_STATUS.OPEN}>Open</MenuItem>
                  <MenuItem value={SUPPORT_REQUEST_STATUS.IN_PROGRESS}>In Progress</MenuItem>
                  <MenuItem value={SUPPORT_REQUEST_STATUS.CLOSED}>Closed</MenuItem>
                </TextField>

                <Box
                  sx={{
                    ...REQUEST_HUB_PANEL_SX,
                    p: 1.4,
                    borderRadius: "16px",
                    border: `1px solid ${draft.status === SUPPORT_REQUEST_STATUS.IN_PROGRESS ? color_secondary : color_border}`,
                    background:
                      draft.status === SUPPORT_REQUEST_STATUS.IN_PROGRESS
                        ? "rgba(238,245,255,0.9)"
                        : color_white,
                  }}
                >
                  <Typography sx={{ color: color_text_primary, fontWeight: 950, fontSize: 14.5 }}>
                    Forward to associated team
                  </Typography>
                  <Typography
                    sx={{
                      color: color_text_light,
                      fontWeight: 700,
                      fontSize: 12.8,
                      mt: 0.25,
                      mb: 1.15,
                    }}
                  >
                    Required when moving a request to In Progress. Separate multiple email addresses with commas.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.15}>
                    <TextField
                      label="Team name"
                      value={draft.assignedTeam}
                      onChange={(event) => updateDraft("assignedTeam", event.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ maxLength: 120 }}
                    />
                    <TextField
                      label="Team email recipients"
                      value={draft.assignedTeamRecipients}
                      onChange={(event) =>
                        updateDraft("assignedTeamRecipients", event.target.value)
                      }
                      fullWidth
                      size="small"
                      placeholder="team@example.org, colleague@example.org"
                    />
                  </Stack>
                </Box>

                <TextField
                  label="Update for the user (optional)"
                  value={draft.adminNote}
                  onChange={(event) => updateDraft("adminNote", event.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  inputProps={{ maxLength: 2000 }}
                  helperText={`${draft.adminNote.length}/2000 characters - Included in the user update email.`}
                />
              </Stack>
            </DialogContent>
            <DialogActions
              sx={{
                ...REQUEST_HUB_DIALOG_ACTIONS_SX,
                px: { xs: 1.8, md: 2.5 },
                py: 1.5,
              }}
            >
              <Button
                onClick={closeManager}
                disabled={saving}
                sx={{ ...REQUEST_HUB_SECONDARY_BUTTON_SX, color: color_text_secondary }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void saveManagement()}
                disabled={saving}
                variant="contained"
                sx={{
                  ...REQUEST_HUB_PRIMARY_BUTTON_SX,
                  fontWeight: 950,
                  borderRadius: "10px",
                }}
              >
                {saving
                  ? "Saving..."
                  : draft.status === SUPPORT_REQUEST_STATUS.IN_PROGRESS
                    ? "Forward & notify"
                    : "Save & notify"}
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}
