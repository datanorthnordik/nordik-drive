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
  Paper,
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
import { apiUrl } from "../../config/api";
import { apiRequest } from "../../hooks/useFetch";
import {
  color_background,
  color_border,
  color_secondary,
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
  REQUEST_HUB_EMPTY_STATE_SX,
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
  const [activeRequest, setActiveRequest] = useState<SupportRequestItem | null>(null);
  const [draft, setDraft] = useState<ManagementDraft | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<SupportRequestListResponse>(
        apiUrl("support-requests/admin?page=1&page_size=100"),
        "GET"
      );
      setRequests(Array.isArray(response?.items) ? response.items : []);
    } catch (error: any) {
      toast.error(error?.message || "Unable to load support requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
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

  const openManager = (request: SupportRequestItem) => {
    setActiveRequest(request);
    setDraft(createDraft(request));
  };

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

      <Paper elevation={0} sx={REQUEST_HUB_SURFACE_SX}>
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
            onClick={() => void fetchRequests()}
            startIcon={<RefreshRoundedIcon />}
            sx={{
              ...REQUEST_HUB_SECONDARY_BUTTON_SX,
              alignSelf: { xs: "stretch", md: "center" },
            }}
          >
            Refresh queue
          </Button>
        </Box>

        <Box sx={{ ...REQUEST_HUB_CONTENT_SX, p: { xs: 1.25, md: 2.25 } }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ mb: 1.75 }}>
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
                    p: 1.5,
                    borderRadius: "18px",
                    justifyContent: "flex-start",
                    textAlign: "left",
                    textTransform: "none",
                    background: selected
                      ? `linear-gradient(180deg, ${color_secondary} 0%, ${color_white_smoke} 220%)`
                      : color_white,
                    border: `1px solid ${selected ? color_secondary : color_border}`,
                    color: selected ? color_secondary : color_text_primary,
                    boxShadow: selected ? "0 12px 24px rgba(0, 75, 156, 0.14)" : "none",
                    "&:hover": {
                      background: selected
                        ? `linear-gradient(180deg, ${color_secondary} 0%, ${color_white_smoke} 220%)`
                        : color_white,
                    },
                  }}
                >
                  <Box
                    sx={{
                      mr: 1.2,
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
                    <Typography sx={{ fontWeight: 950, fontSize: 15 }}>
                      {getSupportRequestStatusLabel(status)}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 12.5,
                        color: selected ? "rgba(255,255,255,0.85)" : color_text_light,
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

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.1} sx={{ mb: 1.5 }}>
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
                color: color_text_secondary,
              }}
            >
              All ({requests.length})
            </Button>
          </Stack>

          {filteredRequests.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                ...REQUEST_HUB_EMPTY_STATE_SX,
                py: { xs: 4, md: 5 },
                px: 2,
                textAlign: "center",
              }}
            >
              <Typography sx={{ color: color_text_primary, fontWeight: 950, fontSize: 17 }}>
                No matching support requests
              </Typography>
              <Typography
                sx={{ color: color_text_light, fontWeight: 700, mt: 0.5, fontSize: 13.5 }}
              >
                Try another search or select a different request status.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.15}>
              {filteredRequests.map((request) => {
                const status = getSupportRequestStatusChip(request.status);
                return (
                  <Paper
                    key={request.id}
                    elevation={0}
                    sx={{
                      ...REQUEST_HUB_PANEL_SX,
                      p: { xs: 1.35, md: 1.65 },
                      borderLeft: `5px solid ${status.accent}`,
                      transition: "transform 140ms ease, box-shadow 140ms ease",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.08)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 1.2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ color: color_text_primary, fontWeight: 950, fontSize: 16 }}>
                          {request.subject}
                        </Typography>
                        <Typography
                          sx={{
                            color: color_text_secondary,
                            fontWeight: 800,
                            fontSize: 13.2,
                            mt: 0.25,
                          }}
                        >
                          {request.requester_name} · {request.requester_email}
                        </Typography>
                        <Typography
                          sx={{
                            color: color_text_light,
                            fontWeight: 700,
                            fontSize: 12.5,
                            mt: 0.25,
                          }}
                        >
                          #{request.id} - {getSupportRequestTypeLabel(request.request_type)} -{" "}
                          {formatSupportRequestDate(request.created_at)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{ borderRadius: "999px", fontWeight: 950, ...status.sx }}
                        />
                        <Button
                          onClick={() => openManager(request)}
                          variant="contained"
                          sx={{
                            ...REQUEST_HUB_PRIMARY_BUTTON_SX,
                            borderRadius: "10px",
                            fontWeight: 950,
                          }}
                        >
                          Manage
                        </Button>
                      </Stack>
                    </Box>

                    <Typography
                      sx={{
                        mt: 1.05,
                        color: color_text_secondary,
                        fontWeight: 700,
                        fontSize: 13.4,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {request.message}
                    </Typography>

                    {request.assigned_team ? (
                      <Typography
                        sx={{ mt: 1, color: color_text_light, fontWeight: 850, fontSize: 12.8 }}
                      >
                        Assigned to {request.assigned_team} -{" "}
                        {request.status === SUPPORT_REQUEST_STATUS.CLOSED ? "Closed" : "Forwarded"}{" "}
                        {formatSupportRequestDate(request.closed_at || request.assigned_at)}
                      </Typography>
                    ) : null}
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>

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
                    {activeRequest.requester_name} · {activeRequest.requester_email}
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
                    sx={{ color: color_text_light, fontWeight: 700, fontSize: 12.8, mt: 0.25, mb: 1.15 }}
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
