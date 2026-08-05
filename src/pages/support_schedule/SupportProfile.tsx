import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack,
  TextField, Typography,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import SupportBookingForm from "./SupportBookingForm";
import { DailyAssignment, SupportCall, SupportStaff, supportScheduleApi } from "./api";

type ReassignTarget = { kind: "call"; call: SupportCall } | { kind: "day"; day: DailyAssignment } | null;

const userName = (person?: { firstname: string; lastname: string }) => person ? `${person.firstname} ${person.lastname}`.trim() : "Unassigned";
const localDateTime = (value: Date) => {
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};
const displayDateTime = (value: string) => new Intl.DateTimeFormat("en-CA", {
  weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto",
}).format(new Date(value));
const displayDate = (value: string) => new Intl.DateTimeFormat("en-CA", {
  weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto",
}).format(new Date(`${value.slice(0, 10)}T12:00:00`));

export default function SupportProfile() {
  const { user } = useSelector((state: any) => state.auth);
  const userID = Number(user?.id || user?.ID || 0);
  const isManager = ["admin", "manager"].includes(String(user?.role || "").toLowerCase());
  const [calls, setCalls] = useState<SupportCall[]>([]);
  const [schedule, setSchedule] = useState<DailyAssignment[]>([]);
  const [staff, setStaff] = useState<SupportStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeCall, setCompleteCall] = useState<SupportCall | null>(null);
  const [actualStart, setActualStart] = useState("");
  const [actualEnd, setActualEnd] = useState("");
  const [reassignTarget, setReassignTarget] = useState<ReassignTarget>(null);
  const [replacement, setReplacement] = useState("");
  const [reason, setReason] = useState("");
  const [startsAt, setStartsAt] = useState(localDateTime(new Date()));
  const [endsAt, setEndsAt] = useState(localDateTime(new Date(Date.now() + 60 * 60 * 1000)));
  const [allTeam, setAllTeam] = useState(false);
  const [availabilityReason, setAvailabilityReason] = useState("");
  const [working, setWorking] = useState(false);

  const isSupportStaff = useMemo(() => staff.some((person) => person.user_id === userID), [staff, userID]);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedCalls, loadedSchedule, loadedStaff] = await Promise.all([
        supportScheduleApi.calls(isManager ? "manage" : "mine"), supportScheduleApi.schedule(), supportScheduleApi.team(),
      ]);
      setCalls(loadedCalls); setSchedule(loadedSchedule); setStaff(loadedStaff);
    } catch (error: any) { toast.error(error?.message || "Unable to load your support profile."); }
    finally { setLoading(false); }
  }, [isManager]);

  useEffect(() => { reload(); }, [reload]);

  const approve = async (call: SupportCall, approved: boolean) => {
    try { await supportScheduleApi.approve(call.id, approved); toast.success(approved ? "Call approved." : "Call declined."); reload(); }
    catch (error: any) { toast.error(error?.message || "Unable to update the request."); }
  };

  const openCompletion = (call: SupportCall) => {
    setCompleteCall(call); setActualStart(localDateTime(new Date(call.scheduled_start))); setActualEnd(localDateTime(new Date(call.scheduled_end)));
  };
  const complete = async () => {
    if (!completeCall) return;
    setWorking(true);
    try {
      await supportScheduleApi.complete(completeCall.id, new Date(actualStart).toISOString(), new Date(actualEnd).toISOString());
      toast.success("Completed support time has been recorded."); setCompleteCall(null); reload();
    } catch (error: any) { toast.error(error?.message || "Unable to complete the call."); }
    finally { setWorking(false); }
  };

  const reassign = async () => {
    if (!reassignTarget || !replacement || !reason.trim()) { toast.error("Choose a team member and provide a reason."); return; }
    setWorking(true);
    try {
      if (reassignTarget.kind === "call") await supportScheduleApi.reassignCall(reassignTarget.call.id, Number(replacement), reason.trim());
      else await supportScheduleApi.reassignDay(reassignTarget.day.schedule_date.slice(0, 10), Number(replacement), reason.trim());
      toast.success("Assignment updated."); setReassignTarget(null); setReplacement(""); setReason(""); reload();
    } catch (error: any) { toast.error(error?.message || "Unable to update the assignment."); }
    finally { setWorking(false); }
  };

  const saveUnavailability = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!availabilityReason.trim()) { toast.error("Please include a reason."); return; }
    setWorking(true);
    try {
      await supportScheduleApi.createUnavailability({ all_team: allTeam, starts_at: new Date(startsAt).toISOString(), ends_at: new Date(endsAt).toISOString(), reason: availabilityReason.trim() });
      toast.success(allTeam ? "Team unavailability saved and the rota was checked." : "Your unavailability was saved and the rota was checked.");
      setAvailabilityReason(""); reload();
    } catch (error: any) { toast.error(error?.message || "Unable to save availability."); }
    finally { setWorking(false); }
  };

  if (loading) return <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 11, md: 14 }, pb: 6 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
          <Box><Typography variant="h4" fontWeight={900}>My support</Typography><Typography color="text.secondary">Schedule a call, follow your requests, and manage your availability in one place.</Typography></Box>
          <Button variant="outlined" onClick={reload} startIcon={<RefreshRoundedIcon />}>Refresh</Button>
        </Stack>

        <Card variant="outlined"><CardContent><SupportBookingForm compact onScheduled={reload} /></CardContent></Card>

        <Card variant="outlined"><CardContent>
          <Typography variant="h6" fontWeight={800} gutterBottom>{isManager ? "Support calls" : "My calls and requests"}</Typography>
          {calls.length === 0 ? <Alert severity="info">No support calls are recorded yet.</Alert> : <Stack spacing={1.3}>
            {calls.map((call) => {
              const canApprove = call.status === "awaiting_staff_approval" && call.requested_staff_id === userID;
              const canComplete = call.status === "scheduled" && call.assigned_user_id === userID;
              return <Box key={call.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.6 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                  <Box><Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={800}>{call.subject}</Typography><Chip size="small" label={call.status.replaceAll("_", " ")} /></Stack>
                    <Typography variant="body2" color="text.secondary">{displayDateTime(call.scheduled_start)} · {call.duration_minutes} min · with {userName(call.assigned_user)}</Typography>
                    {isManager && <Typography variant="caption" color="text.secondary">Requested by {userName(call.created_by)}</Typography>}</Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap"><>{canApprove && <><Button size="small" variant="contained" onClick={() => approve(call, true)}>Approve</Button><Button size="small" onClick={() => approve(call, false)}>Decline</Button></>}</>
                    {canComplete && <Button size="small" startIcon={<CheckCircleOutlineRoundedIcon />} onClick={() => openCompletion(call)}>Mark done</Button>}
                    {isManager && call.status !== "completed" && <Button size="small" onClick={() => setReassignTarget({ kind: "call", call })}>Reassign</Button>}</Stack>
                </Stack>
              </Box>;
            })}
          </Stack>}
        </CardContent></Card>

        {(isSupportStaff || isManager) && <Card variant="outlined"><CardContent>
          <Typography variant="h6" fontWeight={800}>Availability</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Unavailable time is removed from bookable slots. A full-day absence automatically rebalances the on-call rota.</Typography>
          <Box component="form" onSubmit={saveUnavailability}><Stack spacing={1.5}>
            {isManager && <FormControlLabel control={<Checkbox checked={allTeam} onChange={(event) => setAllTeam(event.target.checked)} />} label="Whole support team is unavailable" />}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}><TextField label="From" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth required /><TextField label="To" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth required /></Stack>
            <TextField label="Reason" value={availabilityReason} onChange={(event) => setAvailabilityReason(event.target.value)} inputProps={{ maxLength: 1000 }} required fullWidth />
            <Button type="submit" variant="outlined" disabled={working} sx={{ alignSelf: "flex-start" }}>Save unavailability</Button>
          </Stack></Box>
        </CardContent></Card>}

        <Card variant="outlined"><CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={800}>Two-week support rota</Typography>{isManager && <Button size="small" onClick={async () => { try { await supportScheduleApi.runMaintenance(); toast.success("Schedule checked."); reload(); } catch (error: any) { toast.error(error?.message || "Unable to check the schedule."); } }}>Check schedule</Button>}</Stack>
          <Stack direction="row" flexWrap="wrap" gap={1.2} sx={{ mt: 1.5 }}>{schedule.map((day) => <Box key={day.id} sx={{ minWidth: 168, border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.3 }}><Typography fontWeight={800}>{displayDate(day.schedule_date)}</Typography><Typography variant="body2">{userName(day.assigned_user)}</Typography><Chip size="small" sx={{ mt: .7 }} label={day.status} />{isManager && <Button size="small" sx={{ display: "block", mt: .5, px: 0 }} onClick={() => setReassignTarget({ kind: "day", day })}>Change person</Button>}</Box>)}</Stack>
        </CardContent></Card>
      </Stack>

      <Dialog open={Boolean(completeCall)} onClose={() => setCompleteCall(null)} fullWidth maxWidth="xs"><DialogTitle>Record completed support time</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}><TextField label="Actual start" type="datetime-local" value={actualStart} onChange={(event) => setActualStart(event.target.value)} InputLabelProps={{ shrink: true }} /><TextField label="Actual end" type="datetime-local" value={actualEnd} onChange={(event) => setActualEnd(event.target.value)} InputLabelProps={{ shrink: true }} /></Stack></DialogContent><DialogActions><Button onClick={() => setCompleteCall(null)}>Cancel</Button><Button variant="contained" disabled={working} onClick={complete}>Save completed time</Button></DialogActions></Dialog>
      <Dialog open={Boolean(reassignTarget)} onClose={() => setReassignTarget(null)} fullWidth maxWidth="xs"><DialogTitle>Change support assignment</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}><FormControl fullWidth><InputLabel id="replacement-label">Team member</InputLabel><Select labelId="replacement-label" label="Team member" value={replacement} onChange={(event) => setReplacement(String(event.target.value))}>{staff.map((person) => <MenuItem key={person.user_id} value={String(person.user_id)}>{person.firstname} {person.lastname}</MenuItem>)}</Select></FormControl><TextField label="Reason for change" value={reason} onChange={(event) => setReason(event.target.value)} required fullWidth /></Stack></DialogContent><DialogActions><Button onClick={() => setReassignTarget(null)}>Cancel</Button><Button variant="contained" disabled={working} onClick={reassign}>Save assignment</Button></DialogActions></Dialog>
    </Container>
  );
}
