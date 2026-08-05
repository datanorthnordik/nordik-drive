import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Container,
  FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Link as RouterLink } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { StaffAvailability, SupportProfile as SupportProfileData, supportScheduleApi } from "./api";

const isoDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
const localDateTime = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const displayDateTime = (value?: string) => value ? new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(value)) : "—";
const displayDate = (value: string) => new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));

export default function SupportProfile() {
  const { user } = useSelector((state: any) => state.auth);
  const isSupportAdmin = String(user?.role || "").toLowerCase() === "admin";
  const [profile, setProfile] = useState<SupportProfileData>();
  const [loading, setLoading] = useState(true);
  const [fullDay, setFullDay] = useState("yes");
  const [date, setDate] = useState(isoDate(new Date()));
  const [startsAt, setStartsAt] = useState(localDateTime());
  const [endsAt, setEndsAt] = useState(localDateTime(new Date(Date.now() + 60 * 60 * 1000).toISOString()));
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState<StaffAvailability | null>(null);
  const [working, setWorking] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setProfile(await supportScheduleApi.profile());
    } catch (error: any) {
      toast.error(error?.message || "Your support-admin profile is not available.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isSupportAdmin) reload(); else setLoading(false); }, [isSupportAdmin, reload]);

  const resetForm = () => {
    setEditing(null);
    setFullDay("yes");
    setDate(isoDate(new Date()));
    setStartsAt(localDateTime());
    setEndsAt(localDateTime(new Date(Date.now() + 60 * 60 * 1000).toISOString()));
    setReason("");
  };

  const submitAvailability = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) {
      toast.error("Please include a reason.");
      return;
    }
    setWorking(true);
    try {
      const body = fullDay === "yes"
        ? { date, full_day_unavailable: true, reason: reason.trim() }
        : { date, full_day_unavailable: false, starts_at: new Date(startsAt).toISOString(), ends_at: new Date(endsAt).toISOString(), reason: reason.trim() };
      if (editing) await supportScheduleApi.updateAvailability(editing.id, body);
      else await supportScheduleApi.createAvailability(body);
      toast.success(editing ? "Availability updated." : "Availability saved.");
      resetForm();
      reload();
    } catch (error: any) {
      toast.error(error?.message || "Unable to save availability.");
    } finally {
      setWorking(false);
    }
  };

  const editAvailability = (availability: StaffAvailability) => {
    setEditing(availability);
    setFullDay(availability.full_day_unavailable ? "yes" : "no");
    setDate(availability.availability_date);
    setStartsAt(localDateTime(availability.unavailable_start_time));
    setEndsAt(localDateTime(availability.unavailable_end_time));
    setReason(availability.reason);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (!isSupportAdmin) return <Container maxWidth="md" sx={{ pt: { xs: 11, md: 14 } }}><Alert severity="info">Availability management is available only to active support admins in their Profile.</Alert></Container>;

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 11, md: 14 }, pb: 6 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}><Box><Typography variant="h4" fontWeight={900}>Profile</Typography><Typography color="text.secondary">Your support-admin availability, assigned days, calls, and direct requests.</Typography></Box><Button variant="outlined" onClick={reload} startIcon={<RefreshRoundedIcon />}>Refresh</Button></Stack>

        <Card variant="outlined"><CardContent><Typography variant="h6" fontWeight={800}>{editing ? "Edit unavailability" : "Availability"}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>A full-day unavailability immediately removes you from that day’s primary assignment. Partial periods are excluded from future booking slots.</Typography><Box component="form" onSubmit={submitAvailability}><Stack spacing={1.5}>
          <RadioGroup row value={fullDay} onChange={(event) => setFullDay(event.target.value)}><FormControlLabel value="yes" control={<Radio />} label="Unavailable all day" /><FormControlLabel value="no" control={<Radio />} label="Unavailable during a time range" /></RadioGroup>
          {fullDay === "yes" ? <TextField label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} InputLabelProps={{ shrink: true }} required sx={{ maxWidth: 280 }} /> : <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}><TextField label="From" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth required /><TextField label="To" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth required /></Stack>}
          <TextField label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} inputProps={{ maxLength: 1000 }} required fullWidth />
          <Stack direction="row" spacing={1}><Button type="submit" variant="contained" disabled={working}>{editing ? "Update availability" : "Save availability"}</Button>{editing && <Button onClick={resetForm}>Cancel edit</Button>}</Stack>
        </Stack></Box></CardContent></Card>

        <Card variant="outlined"><CardContent><Typography variant="h6" fontWeight={800}>Your unavailable periods</Typography>{(profile?.availability.length || 0) === 0 ? <Alert severity="info" sx={{ mt: 1.5 }}>No upcoming unavailability has been recorded.</Alert> : <Stack spacing={1} sx={{ mt: 1.5 }}>{profile?.availability.map((availability) => <Stack key={availability.id} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.2 }}><Box><Typography fontWeight={700}>{displayDate(availability.availability_date)} · {availability.full_day_unavailable ? "All day" : `${displayDateTime(availability.unavailable_start_time)}–${displayDateTime(availability.unavailable_end_time)}`}</Typography><Typography variant="body2" color="text.secondary">{availability.reason}</Typography></Box><Stack direction="row" spacing={1}><Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => editAvailability(availability)}>Edit</Button><Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={async () => { try { await supportScheduleApi.deleteAvailability(availability.id); toast.success("Availability deleted."); reload(); } catch (error: any) { toast.error(error?.message || "Unable to delete availability."); } }}>Delete</Button></Stack></Stack>)}</Stack>}</CardContent></Card>

        <Card variant="outlined"><CardContent><Typography variant="h6" fontWeight={800}>Assigned support days</Typography>{(profile?.assignments.length || 0) === 0 ? <Alert severity="info" sx={{ mt: 1.5 }}>You have no upcoming primary-support assignments.</Alert> : <Stack direction="row" flexWrap="wrap" gap={1.2} sx={{ mt: 1.5 }}>{profile?.assignments.map((assignment) => <Box key={assignment.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.2, minWidth: 165 }}><Typography fontWeight={700}>{displayDate(assignment.assignment_date)}</Typography><Typography variant="caption" color="text.secondary">{assignment.assignment_source.replaceAll("_", " ")}</Typography></Box>)}</Stack>}</CardContent></Card>
        <Card variant="outlined"><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h6" fontWeight={800}>Upcoming approved calls</Typography><Typography variant="body2" color="text.secondary">Record actual call duration from Support Calls after completion.</Typography></Box><Button component={RouterLink} to="/support-calls">Open Support Calls</Button></Stack>{(profile?.upcoming_calls.length || 0) === 0 ? <Alert severity="info" sx={{ mt: 1.5 }}>No approved calls are currently assigned to you.</Alert> : <Stack spacing={1} sx={{ mt: 1.5 }}>{profile?.upcoming_calls.map((call) => <Typography key={call.id}>{displayDateTime(call.scheduled_start_time)} · {call.status.replaceAll("_", " ")}</Typography>)}</Stack>}</CardContent></Card>
        <Card variant="outlined"><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h6" fontWeight={800}>Direct support requests</Typography><Typography variant="body2" color="text.secondary">Requests that specifically ask for your time need your decision.</Typography></Box><Button component={RouterLink} to="/requests">Review Requests</Button></Stack>{(profile?.direct_requests.length || 0) === 0 ? <Alert severity="info" sx={{ mt: 1.5 }}>No direct requests need your attention.</Alert> : <Stack spacing={1} sx={{ mt: 1.5 }}>{profile?.direct_requests.map((request) => <Typography key={request.id}>{request.subject} · {request.status.replaceAll("_", " ")}</Typography>)}</Stack>}</CardContent></Card>
      </Stack>
    </Container>
  );
}
