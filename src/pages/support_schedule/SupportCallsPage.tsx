import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel,
  MenuItem, Select, Stack, TextField, Typography,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { FairnessStat, SupportAssignment, SupportCall, SupportStaff, supportScheduleApi } from "./api";

const personName = (person?: { firstname: string; lastname: string }) => person ? `${person.firstname} ${person.lastname}`.trim() : "Not assigned";
const displayDateTime = (value: string) => new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(value));
const displayDate = (value: string) => new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
const localDateTime = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

type ReassignTarget = { kind: "call"; call: SupportCall } | { kind: "assignment"; assignment: SupportAssignment } | null;

export default function SupportCallsPage() {
  const { user } = useSelector((state: any) => state.auth);
  const userID = Number(user?.id || user?.ID || 0);
  const role = String(user?.role || "").toLowerCase();
  const isManager = role === "manager";
  const isSupportAdmin = role === "admin";
  const scope = isManager ? "manage" : isSupportAdmin ? "staff" : "mine";
  const [calls, setCalls] = useState<SupportCall[]>([]);
  const [schedule, setSchedule] = useState<SupportAssignment[]>([]);
  const [staff, setStaff] = useState<SupportStaff[]>([]);
  const [fairness, setFairness] = useState<FairnessStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeTarget, setCompleteTarget] = useState<SupportCall | null>(null);
  const [actualStart, setActualStart] = useState("");
  const [actualEnd, setActualEnd] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [reassignTarget, setReassignTarget] = useState<ReassignTarget>(null);
  const [replacement, setReplacement] = useState("");
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const core = await Promise.all([supportScheduleApi.calls(scope), supportScheduleApi.team()]);
      setCalls(core[0]);
      setStaff(core[1]);
      if (isManager) {
        const [loadedSchedule, loadedFairness] = await Promise.all([supportScheduleApi.schedule(), supportScheduleApi.fairness()]);
        setSchedule(loadedSchedule);
        setFairness(loadedFairness);
      } else {
        setSchedule([]);
        setFairness([]);
      }
    } catch (error: any) {
      toast.error(error?.message || "Unable to load support calls.");
    } finally {
      setLoading(false);
    }
  }, [isManager, scope]);

  useEffect(() => { reload(); }, [reload]);

  const openCompletion = (call: SupportCall) => {
    setCompleteTarget(call);
    setActualStart(localDateTime(call.scheduled_start_time));
    setActualEnd(localDateTime(call.scheduled_end_time));
    setInternalNotes("");
  };

  const complete = async () => {
    if (!completeTarget) return;
    setWorking(true);
    try {
      await supportScheduleApi.complete(completeTarget.id, new Date(actualStart).toISOString(), new Date(actualEnd).toISOString(), internalNotes.trim());
      toast.success("Actual call duration recorded.");
      setCompleteTarget(null);
      reload();
    } catch (error: any) {
      toast.error(error?.message || "Unable to record the call completion.");
    } finally {
      setWorking(false);
    }
  };

  const reassign = async () => {
    if (!reassignTarget || !replacement || !reason.trim()) {
      toast.error("Choose a support admin and provide a reason.");
      return;
    }
    setWorking(true);
    try {
      if (reassignTarget.kind === "call") await supportScheduleApi.reassignCall(reassignTarget.call.id, Number(replacement), reason.trim());
      else await supportScheduleApi.reassignDay(reassignTarget.assignment.assignment_date, Number(replacement), reason.trim());
      toast.success("Assignment updated.");
      setReassignTarget(null);
      setReplacement("");
      setReason("");
      reload();
    } catch (error: any) {
      toast.error(error?.message || "Unable to change the assignment.");
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 11, md: 14 }, pb: 6 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
          <Box><Typography variant="h4" fontWeight={900}>Support Calls</Typography><Typography color="text.secondary">{isManager ? "All scheduled, completed, and cancelled support calls." : isSupportAdmin ? "Your upcoming calls and completed-call records." : "Your upcoming, pending, completed, cancelled, and rejected support calls."}</Typography></Box>
          <Button variant="outlined" onClick={reload} startIcon={<RefreshRoundedIcon />}>Refresh</Button>
        </Stack>

        {calls.length === 0 ? <Alert severity="info">No support calls match this view.</Alert> : <Stack spacing={1.5}>{calls.map((call) => {
          const canComplete = call.status === "approved" && (isManager || call.assigned_staff_id === userID);
          return <Card key={call.id} variant="outlined"><CardContent><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box><Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={800}>{displayDateTime(call.scheduled_start_time)}</Typography><Chip size="small" label={call.status.replaceAll("_", " ")} color={call.status === "completed" ? "success" : call.status === "cancelled" || call.status === "rejected" ? "error" : "default"} /></Stack>
              <Typography variant="body2" color="text.secondary">Assigned support person: {personName(call.assigned_staff)}</Typography>
              {call.status === "completed" && <Typography variant="body2" color="text.secondary">Actual duration: {call.actual_duration_minutes} minutes</Typography>}
              {call.internal_notes && <Typography variant="body2" sx={{ mt: .8 }}>Internal notes: {call.internal_notes}</Typography>}
            </Box>
            <Stack direction="row" flexWrap="wrap" gap={1} alignContent="flex-start">
              {canComplete && <Button size="small" startIcon={<CheckCircleOutlineRoundedIcon />} onClick={() => openCompletion(call)}>Record actual duration</Button>}
              {isManager && !["completed", "cancelled", "rejected"].includes(call.status) && <Button size="small" onClick={() => setReassignTarget({ kind: "call", call })}>Reassign call</Button>}
            </Stack>
          </Stack></CardContent></Card>;
        })}</Stack>}

        {isManager && <>
          <Card variant="outlined"><CardContent><Typography variant="h6" fontWeight={800}>Daily support schedule</Typography><Stack direction="row" flexWrap="wrap" gap={1.2} sx={{ mt: 1.5 }}>{schedule.map((assignment) => <Box key={assignment.id} sx={{ minWidth: 185, border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.3 }}><Typography fontWeight={800}>{displayDate(assignment.assignment_date)}</Typography><Typography variant="body2">{personName(assignment.primary_assignee)}</Typography><Chip size="small" sx={{ mt: .7 }} label={assignment.assignment_source.replaceAll("_", " ")} />{assignment.reassignment_reason && <Typography variant="caption" display="block" sx={{ mt: .5 }}>{assignment.reassignment_reason}</Typography>}<Button size="small" sx={{ display: "block", mt: .5, px: 0 }} onClick={() => setReassignTarget({ kind: "assignment", assignment })}>Change assignee</Button></Box>)}</Stack></CardContent></Card>
          <Card variant="outlined"><CardContent><Typography variant="h6" fontWeight={800}>Assignment fairness</Typography><Stack spacing={1} sx={{ mt: 1.5 }}>{fairness.map((entry) => <Stack key={entry.staff.user_id} direction="row" justifyContent="space-between" sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1 }}><Typography>{entry.staff.firstname} {entry.staff.lastname}</Typography><Typography variant="body2" color="text.secondary">{entry.actual_completed_hours.toFixed(2)} actual hrs · {entry.assigned_days} assigned days</Typography></Stack>)}</Stack></CardContent></Card>
        </>}
      </Stack>

      <Dialog open={Boolean(completeTarget)} onClose={() => !working && setCompleteTarget(null)} fullWidth maxWidth="xs"><DialogTitle>Record completed support call</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Actual start" type="datetime-local" value={actualStart} onChange={(event) => setActualStart(event.target.value)} InputLabelProps={{ shrink: true }} /><TextField label="Actual end" type="datetime-local" value={actualEnd} onChange={(event) => setActualEnd(event.target.value)} InputLabelProps={{ shrink: true }} /><TextField label="Internal notes (optional)" value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} multiline minRows={2} inputProps={{ maxLength: 4000 }} /></Stack></DialogContent><DialogActions><Button onClick={() => setCompleteTarget(null)}>Cancel</Button><Button variant="contained" disabled={working} onClick={complete}>Save duration</Button></DialogActions></Dialog>
      <Dialog open={Boolean(reassignTarget)} onClose={() => !working && setReassignTarget(null)} fullWidth maxWidth="xs"><DialogTitle>Change support assignment</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><FormControl fullWidth><InputLabel id="replacement-label">Support admin</InputLabel><Select labelId="replacement-label" label="Support admin" value={replacement} onChange={(event) => setReplacement(String(event.target.value))}>{staff.map((person) => <MenuItem key={person.user_id} value={String(person.user_id)}>{person.firstname} {person.lastname}</MenuItem>)}</Select></FormControl><TextField label="Reason for change" value={reason} onChange={(event) => setReason(event.target.value)} required fullWidth /></Stack></DialogContent><DialogActions><Button onClick={() => setReassignTarget(null)}>Cancel</Button><Button variant="contained" disabled={working} onClick={reassign}>Save assignment</Button></DialogActions></Dialog>
    </Container>
  );
}
