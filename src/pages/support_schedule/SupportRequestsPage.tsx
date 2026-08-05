import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel,
  MenuItem, Select, Stack, TextField, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import SupportBookingForm from "./SupportBookingForm";
import { SupportRequest, supportScheduleApi } from "./api";

const personName = (person?: { firstname: string; lastname: string }) =>
  person ? `${person.firstname} ${person.lastname}`.trim() : "Not assigned";

const displayDateTime = (value?: string) => value ? new Intl.DateTimeFormat("en-CA", {
  weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto",
}).format(new Date(value)) : "—";

const statusLabel = (status: string) => status.replaceAll("_", " ");
const statusColor = (status: string): "default" | "primary" | "success" | "warning" | "error" => {
  if (status === "approved" || status === "completed") return "success";
  if (status === "rejected" || status === "cancelled") return "error";
  if (status === "alternative_time_proposed") return "warning";
  if (status === "awaiting_assignee_approval") return "primary";
  return "default";
};

export default function SupportRequestsPage() {
  const { user } = useSelector((state: any) => state.auth);
  const role = String(user?.role || "").toLowerCase();
  const isManager = role === "manager";
  const isSupportAdmin = role === "admin";
  const scope = isManager ? "manage" : isSupportAdmin ? "staff" : "mine";
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
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

  const canDecide = (request: SupportRequest) => isSupportAdmin && ["pending", "awaiting_assignee_approval", "alternative_time_proposed"].includes(request.status);
  const ownRequest = (request: SupportRequest) => Number(request.requested_by_user_id) === Number(user?.id || user?.ID);

  const submitDecision = async () => {
    if (!decisionTarget) return;
    if (decision === "reject" && !note.trim()) {
      toast.error("Please include a reason for rejecting the request.");
      return;
    }
    if (decision === "propose_alternative" && (!alternativeStart || !alternativeEnd)) {
      toast.error("Choose both alternative start and end times.");
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
      toast.success("Support request updated.");
      setDecisionTarget(null);
      setNote("");
      setAlternativeStart("");
      setAlternativeEnd("");
      reload();
    } catch (error: any) {
      toast.error(error?.message || "Unable to update the request.");
    } finally {
      setWorking(false);
    }
  };

  const requestSummary = useMemo(() => isManager ? "All support-call requests across the team." : isSupportAdmin
    ? "Requests routed to you, including direct approval requests." : "Your submitted support-call requests and their current status.", [isManager, isSupportAdmin]);

  if (loading) return <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 11, md: 14 }, pb: 6 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
          <Box><Typography variant="h4" fontWeight={900}>Requests</Typography><Typography color="text.secondary">{requestSummary}</Typography></Box>
          <Stack direction="row" spacing={1}><Button variant="outlined" onClick={reload} startIcon={<RefreshRoundedIcon />}>Refresh</Button>{!isSupportAdmin && !isManager && <Button variant="contained" onClick={() => setShowCreate(true)} startIcon={<AddRoundedIcon />}>New request</Button>}</Stack>
        </Stack>

        {requests.length === 0 ? <Alert severity="info">No support-call requests match this view.</Alert> : <Stack spacing={1.5}>
          {requests.map((request) => <Card key={request.id} variant="outlined"><CardContent>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={800}>{request.subject}</Typography><Chip size="small" label={statusLabel(request.status)} color={statusColor(request.status)} /></Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: .7 }}>{displayDateTime(request.preferred_start_time)} · {request.request_type === "specific_support_person" ? "Specific person request" : "Daily support person"}</Typography>
                <Typography variant="body2" color="text.secondary">Assigned: {personName(request.assigned_staff)}{request.requested_staff && ` · Requested: ${personName(request.requested_staff)}`}</Typography>
                {isManager && <Typography variant="caption" color="text.secondary">Submitted by {personName(request.requested_by)}</Typography>}
                {request.description && <Typography variant="body2" sx={{ mt: 1 }}>{request.description}</Typography>}
                {request.rejection_reason && <Alert severity={request.status === "rejected" ? "error" : "info"} sx={{ mt: 1 }}> {request.rejection_reason}</Alert>}
                {request.status === "alternative_time_proposed" && <Alert severity="warning" sx={{ mt: 1 }}>Alternative proposed: {displayDateTime(request.alternative_start_time)}–{displayDateTime(request.alternative_end_time)}</Alert>}
              </Box>
              <Stack direction="row" flexWrap="wrap" gap={1} alignContent="flex-start">
                {canDecide(request) && <Button size="small" variant="contained" onClick={() => { setDecisionTarget(request); setDecision("approve"); }}>Review request</Button>}
                {ownRequest(request) && request.status === "alternative_time_proposed" && <Button size="small" variant="contained" onClick={async () => { try { await supportScheduleApi.acceptAlternative(request.id); toast.success("Alternative time accepted."); reload(); } catch (error: any) { toast.error(error?.message || "Unable to accept the alternative."); } }}>Accept alternative</Button>}
                {ownRequest(request) && !["completed", "cancelled", "rejected"].includes(request.status) && <Button size="small" color="inherit" onClick={async () => { try { await supportScheduleApi.cancelRequest(request.id); toast.success("Request cancelled."); reload(); } catch (error: any) { toast.error(error?.message || "Unable to cancel the request."); } }}>Cancel</Button>}
              </Stack>
            </Stack>
          </CardContent></Card>)}
        </Stack>}
      </Stack>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} fullWidth maxWidth="md"><DialogTitle>New support request</DialogTitle><DialogContent><Box sx={{ pt: 1 }}><SupportBookingForm onRequested={() => { setShowCreate(false); reload(); }} /></Box></DialogContent></Dialog>
      <Dialog open={Boolean(decisionTarget)} onClose={() => !working && setDecisionTarget(null)} fullWidth maxWidth="sm"><DialogTitle>Review support request</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <FormControl fullWidth><InputLabel id="decision-label">Decision</InputLabel><Select labelId="decision-label" label="Decision" value={decision} onChange={(event) => setDecision(String(event.target.value))}><MenuItem value="approve">Approve</MenuItem><MenuItem value="propose_alternative">Propose an alternative time</MenuItem><MenuItem value="reject">Reject</MenuItem></Select></FormControl>
        {decision === "propose_alternative" && <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField label="Alternative start" type="datetime-local" value={alternativeStart} onChange={(event) => setAlternativeStart(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth /><TextField label="Alternative end" type="datetime-local" value={alternativeEnd} onChange={(event) => setAlternativeEnd(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth /></Stack>}
        <TextField label={decision === "reject" ? "Reason" : "Note (optional)"} value={note} onChange={(event) => setNote(event.target.value)} multiline minRows={2} required={decision === "reject"} fullWidth />
      </Stack></DialogContent><DialogActions><Button onClick={() => setDecisionTarget(null)}>Cancel</Button><Button variant="contained" disabled={working} onClick={submitDecision}>Save decision</Button></DialogActions></Dialog>
    </Container>
  );
}
