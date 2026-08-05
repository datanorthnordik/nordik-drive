import React, { useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, FormControl, InputLabel, MenuItem,
  Select, Stack, TextField, Typography,
} from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import toast from "react-hot-toast";
import { SupportAvailability, SupportSettings, SupportStaff, supportScheduleApi } from "./api";

type Props = { onScheduled?: () => void; compact?: boolean };

const isoDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const firstWeekday = () => {
  const value = new Date();
  while (value.getDay() === 0 || value.getDay() === 6) value.setDate(value.getDate() + 1);
  return isoDate(value);
};

const staffName = (staff?: { firstname: string; lastname: string }) =>
  staff ? `${staff.firstname} ${staff.lastname}`.trim() : "the support team";

const timeLabel = (value: string) => new Intl.DateTimeFormat("en-CA", {
  hour: "numeric", minute: "2-digit", timeZone: "America/Toronto",
}).format(new Date(value));

export default function SupportBookingForm({ onScheduled, compact = false }: Props) {
  const [settings, setSettings] = useState<SupportSettings>();
  const [staff, setStaff] = useState<SupportStaff[]>([]);
  const [date, setDate] = useState(firstWeekday);
  const [duration, setDuration] = useState(30);
  const [requestedStaff, setRequestedStaff] = useState("");
  const [availability, setAvailability] = useState<SupportAvailability>();
  const [selectedStart, setSelectedStart] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.all([supportScheduleApi.settings(), supportScheduleApi.team()])
      .then(([loadedSettings, loadedStaff]) => {
        if (!live) return;
        setSettings(loadedSettings);
        setStaff(loadedStaff);
        setDuration(loadedSettings.default_duration_minutes);
      })
      .catch((error: Error) => toast.error(error.message || "Unable to load support scheduling."))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!settings || !date || !duration) return;
    let live = true;
    setLoadingSlots(true);
    setSelectedStart("");
    supportScheduleApi.availability(date, duration, requestedStaff ? Number(requestedStaff) : undefined)
      .then((result) => live && setAvailability(result))
      .catch((error: Error) => { if (live) { setAvailability(undefined); toast.error(error.message || "Unable to load available times."); } })
      .finally(() => live && setLoadingSlots(false));
    return () => { live = false; };
  }, [date, duration, requestedStaff, settings]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStart) { toast.error("Choose an available time first."); return; }
    if (!subject.trim()) { toast.error("Add a short subject for the call."); return; }
    setSubmitting(true);
    try {
      const call = await supportScheduleApi.createCall({
        scheduled_start: selectedStart,
        duration_minutes: duration,
        subject: subject.trim(),
        message: message.trim(),
        requested_staff_id: requestedStaff ? Number(requestedStaff) : undefined,
      });
      toast.success(call.status === "awaiting_staff_approval" ? "Request sent for the staff member’s approval." : "Your support call is scheduled.");
      setSubject(""); setMessage(""); setSelectedStart("");
      onScheduled?.();
    } catch (error: any) {
      toast.error(error?.message || "Unable to schedule the call.");
    } finally { setSubmitting(false); }
  };

  if (loading) return <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>;
  if (!settings) return <Alert severity="error">Support scheduling is not available right now.</Alert>;

  return (
    <Box component="form" onSubmit={submit}>
      <Stack spacing={compact ? 1.7 : 2.2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Schedule a call with the team</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
            Weekdays {settings.workday_start}–{settings.workday_end} ({settings.time_zone.replace("_", " ")}). Choose the on-call person, or request a specific team member for approval.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth required />
          <FormControl fullWidth>
            <InputLabel id="support-duration-label">Call length</InputLabel>
            <Select labelId="support-duration-label" label="Call length" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              {settings.allowed_durations.map((minutes) => <MenuItem key={minutes} value={minutes}>{minutes} minutes</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
        <FormControl fullWidth>
          <InputLabel id="support-person-label">Support person</InputLabel>
          <Select labelId="support-person-label" label="Support person" value={requestedStaff} onChange={(event) => setRequestedStaff(String(event.target.value))}>
            <MenuItem value="">Automatic — daily on-call person</MenuItem>
            {staff.map((person) => <MenuItem key={person.user_id} value={String(person.user_id)}>{person.firstname} {person.lastname} (approval required)</MenuItem>)}
          </Select>
        </FormControl>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>Available times with {staffName(availability?.assigned_staff)}</Typography>
          {loadingSlots ? <CircularProgress size={22} sx={{ m: 1 }} /> : (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
              {availability?.slots.map((slot) => <Button key={slot.start_at} type="button" variant={selectedStart === slot.start_at ? "contained" : "outlined"} onClick={() => setSelectedStart(slot.start_at)} startIcon={<CalendarMonthRoundedIcon />}>{timeLabel(slot.start_at)}</Button>)}
              {availability && availability.slots.length === 0 && <Typography variant="body2" color="text.secondary">No times are available for this selection.</Typography>}
            </Stack>
          )}
        </Box>
        <TextField label="What would you like help with?" value={subject} onChange={(event) => setSubject(event.target.value)} inputProps={{ maxLength: 160 }} required fullWidth />
        <TextField label="Details (optional)" value={message} onChange={(event) => setMessage(event.target.value)} multiline minRows={compact ? 2 : 3} inputProps={{ maxLength: 4000 }} fullWidth />
        <Button type="submit" variant="contained" disabled={submitting || !selectedStart} sx={{ alignSelf: "flex-start", px: 3, py: 1.1, fontWeight: 800 }}>
          {submitting ? "Sending…" : "Request support call"}
        </Button>
      </Stack>
    </Box>
  );
}
