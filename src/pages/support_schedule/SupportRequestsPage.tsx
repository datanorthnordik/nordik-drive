import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import SupportBookingForm from "./SupportBookingForm";
import { SupportRequest, supportScheduleApi } from "./api";

const personName = (person?: { firstname: string; lastname: string }) =>
  person ? `${person.firstname} ${person.lastname}`.trim() : "Not assigned";

const displayDateTime = (value?: string) => value ? new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Toronto",
}).format(new Date(value)) : "Not confirmed";

const statusLabel = (status: string) => status.replaceAll("_", " ");
const statusColor = (status: string): "default" | "primary" | "success" | "warning" | "error" => {
  if (status === "approved" || status === "completed") return "success";
  if (status === "rejected" || status === "cancelled") return "error";
  if (status === "alternative_time_proposed") return "warning";
  if (status === "awaiting_assignee_approval") return "primary";
  return "default";
};

const requestTypeLabel = (request: SupportRequest) => {
  if (request.request_type !== "specific_support_person") return "Daily support assignment";
  return request.status === "awaiting_assignee_approval"
    ? "Selected support person - approval needed"
    : "Selected support person";
};

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>{children}</Typography>
    </Box>
  );
}

type SupportRequestsPageProps = { embedded?: boolean };

export default function SupportRequestsPage({ embedded = false }: SupportRequestsPageProps) {
  const { user } = useSelector((state: any) => state.auth);
  const userID = Number(user?.id || user?.ID || 0);
  const role = String(user?.role || "").toLowerCase();
  const isManager = role === "manager";
  const isSupportAdmin = role === "admin";
  const scope = isManager ? "manage" : isSupportAdmin ? "staff" : "mine";
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<SupportRequest | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<SupportRequest | null>(null);
  const [decision, setDecision] = useState("approve");
  const [note, setNote] = useState("");
  const [alternativeStart, setAlternativeStart] = useState("");
  const [alternativeEnd, setAlternativeEnd] = useState("");
  const [working, setWorking] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await supportScheduleApi.requests(scope));
    } catch (error: any) {
      toast.error(error?.message || "Unable to load support requests.");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => { reload(); }, [reload]);

  const canDecide = (request: SupportRequest) => isSupportAdmin
    && request.status === "awaiting_assignee_approval"
    && Number(request.assigned_staff_id) === userID;
  const ownRequest = (request: SupportRequest) => Number(request.requested_by_user_id) === userID;

  const openReview = (request: SupportRequest) => {
    setDecisionTarget(request);
    setDecision("approve");
    setNote("");
    setAlternativeStart("");
    setAlternativeEnd("");
  };

  const submitDecision = async () => {
    if (!decisionTarget) return;
    if (decision === "reject" && !note.trim()) {
      toast.error("Please include a reason for declining the request.");
      return;
    }
    if (decision === "propose_alternative" && (!alternativeStart || !alternativeEnd)) {
      toast.error("Choose both the alternative start and end time.");
      return;
    }
    setWorking(true);
    try {
      await supportScheduleApi.decideRequest(decisionTarget.id, {
        decision,
        note: note.trim(),
        alternative_start: alternativeStart ? new Date(alternativeStart).toISOString() : undefined,
        alternative_end: alternativeEnd ? new Date(alternativeEnd).toISOString() : undefined,
      });
      toast.success(decision === "approve" ? "Support call confirmed." : "Support request updated.");
      setDecisionTarget(null);
      setDetailsTarget(null);
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "Unable to update the request.");
    } finally {
      setWorking(false);
    }
  };

  const requestSummary = useMemo(() => isManager
    ? "All support-call requests across the team."
    : isSupportAdmin
      ? "Support-call requests assigned to you. Only off-day requests need your approval."
      : "Your submitted support-call requests and their current status.", [isManager, isSupportAdmin]);

  if (loading) {
    return <Box sx={{ height: embedded ? "100%" : "50vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <Container
      maxWidth={embedded ? false : "lg"}
      sx={embedded ? { height: "100%", overflowY: "auto", py: 2 } : { pt: { xs: 11, md: 14 }, pb: 6 }}
    >
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
          <Box>
            <Typography variant="h4" fontWeight={900}>Support Calls</Typography>
            <Typography color="text.secondary">{requestSummary}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={reload}>Refresh</Button>
            {!isSupportAdmin && !isManager && <Button variant="contained" onClick={() => setShowCreate(true)}>New request</Button>}
          </Stack>
        </Stack>

        {requests.length === 0 ? (
          <Alert severity="info">No support-call requests are assigned to this view.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
            <Table size="small" aria-label="Support-call requests" sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "action.hover" }}>
                  <TableCell sx={{ fontWeight: 800 }}>Support needed</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Requested by</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Scheduled time</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Support person</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" fontWeight={800} noWrap>{request.subject}</Typography>
                      <Typography variant="caption" color="text.secondary">{requestTypeLabel(request)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{personName(request.requested_by)}</Typography>
                      {request.requested_by?.email && <Typography variant="caption" color="text.secondary">{request.requested_by.email}</Typography>}
                    </TableCell>
                    <TableCell>{displayDateTime(request.call?.scheduled_start_time || request.preferred_start_time)}</TableCell>
                    <TableCell>{personName(request.assigned_staff)}</TableCell>
                    <TableCell><Chip size="small" label={statusLabel(request.status)} color={statusColor(request.status)} sx={{ textTransform: "capitalize" }} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Button size="small" onClick={() => setDetailsTarget(request)}>View details</Button>
                        {canDecide(request) && <Button size="small" variant="contained" onClick={() => openReview(request)}>Review</Button>}
                        {ownRequest(request) && request.status === "alternative_time_proposed" && (
                          <Button size="small" variant="contained" onClick={async () => {
                            try {
                              await supportScheduleApi.acceptAlternative(request.id);
                              toast.success("Alternative time accepted.");
                              reload();
                            } catch (error: any) {
                              toast.error(error?.message || "Unable to accept the alternative.");
                            }
                          }}>Accept time</Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog open={Boolean(detailsTarget)} onClose={() => setDetailsTarget(null)} fullWidth maxWidth="md">
        {detailsTarget && <>
          <DialogTitle>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
              <Box>
                <Typography variant="h6" fontWeight={850}>{detailsTarget.subject}</Typography>
                <Typography variant="body2" color="text.secondary">Support-call details</Typography>
              </Box>
              <Chip size="small" label={statusLabel(detailsTarget.status)} color={statusColor(detailsTarget.status)} sx={{ textTransform: "capitalize", alignSelf: { xs: "flex-start", sm: "center" } }} />
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.25}>
              {detailsTarget.status === "awaiting_assignee_approval" && (
                <Alert severity="info">This request is for a date when the selected person is not the daily support assignee, so approval is required.</Alert>
              )}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <DetailItem label="Requested by">{personName(detailsTarget.requested_by)}{detailsTarget.requested_by?.email ? ` (${detailsTarget.requested_by.email})` : ""}</DetailItem>
                <DetailItem label="Scheduled time">{displayDateTime(detailsTarget.call?.scheduled_start_time || detailsTarget.preferred_start_time)}</DetailItem>
                <DetailItem label="Assigned support person">{personName(detailsTarget.assigned_staff)}</DetailItem>
                <DetailItem label="Request route">{requestTypeLabel(detailsTarget)}</DetailItem>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>What support is needed</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, whiteSpace: "pre-wrap", color: "text.secondary" }}>
                  {detailsTarget.description || "No additional details were provided."}
                </Paper>
              </Box>
              {detailsTarget.rejection_reason && <Alert severity={detailsTarget.status === "rejected" ? "error" : "info"}>{detailsTarget.rejection_reason}</Alert>}
              {detailsTarget.status === "alternative_time_proposed" && (
                <Alert severity="warning">Proposed time: {displayDateTime(detailsTarget.alternative_start_time)} to {displayDateTime(detailsTarget.alternative_end_time)}</Alert>
              )}
              {detailsTarget.status === "approved" && detailsTarget.call?.zoom_join_url && (
                <Alert severity="success" icon={false}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                    <Box>
                      <Typography variant="body2" fontWeight={800}>Zoom meeting is ready</Typography>
                      {detailsTarget.call.zoom_passcode && <Typography variant="caption">Passcode: {detailsTarget.call.zoom_passcode}</Typography>}
                    </Box>
                    <Button component="a" href={detailsTarget.call.zoom_join_url} target="_blank" rel="noopener noreferrer" variant="outlined" size="small">Open participant link</Button>
                  </Stack>
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsTarget(null)}>Close</Button>
            {canDecide(detailsTarget) && <Button variant="contained" onClick={() => { setDetailsTarget(null); openReview(detailsTarget); }}>Review request</Button>}
          </DialogActions>
        </>}
      </Dialog>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} fullWidth maxWidth="xl" scroll="paper" PaperProps={{ sx: { minHeight: { lg: "min(760px, calc(100vh - 6rem))" } } }}>
        <DialogTitle>New support request</DialogTitle>
        <DialogContent><Box sx={{ pt: 1 }}><SupportBookingForm onRequested={() => { setShowCreate(false); reload(); }} /></Box></DialogContent>
      </Dialog>

      <Dialog open={Boolean(decisionTarget)} onClose={() => !working && setDecisionTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Review support request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {decisionTarget && <Alert severity="info" icon={false}><strong>{decisionTarget.subject}</strong><br />{personName(decisionTarget.requested_by)} - {displayDateTime(decisionTarget.preferred_start_time)}</Alert>}
            <FormControl fullWidth>
              <InputLabel id="decision-label">Decision</InputLabel>
              <Select labelId="decision-label" label="Decision" value={decision} onChange={(event) => setDecision(String(event.target.value))}>
                <MenuItem value="approve">Approve and schedule</MenuItem>
                <MenuItem value="propose_alternative">Propose another time</MenuItem>
                <MenuItem value="reject">Decline</MenuItem>
              </Select>
            </FormControl>
            {decision === "propose_alternative" && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField label="Alternative start" type="datetime-local" value={alternativeStart} onChange={(event) => setAlternativeStart(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="Alternative end" type="datetime-local" value={alternativeEnd} onChange={(event) => setAlternativeEnd(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              </Stack>
            )}
            <TextField label={decision === "reject" ? "Reason" : "Note (optional)"} value={note} onChange={(event) => setNote(event.target.value)} multiline minRows={2} required={decision === "reject"} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionTarget(null)}>Cancel</Button>
          <Button variant="contained" disabled={working} onClick={submitDecision}>{working ? "Saving..." : "Save decision"}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
