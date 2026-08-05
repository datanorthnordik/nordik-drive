import React, { useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel,
  MenuItem, Radio, RadioGroup, Select, Stack, TextField, Typography,
} from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import toast from "react-hot-toast";
import { SupportAvailability, SupportSettings, SupportStaff, supportScheduleApi } from "./api";

type Props = { onRequested?: () => void; compact?: boolean };

const isoDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const timeLabel = (value: string) => new Intl.DateTimeFormat("en-CA", {
  hour: "numeric", minute: "2-digit", timeZone: "America/Toronto",
}).format(new Date(value));

const staffName = (staff?: { firstname: string; lastname: string }) =>
  staff ? `${staff.firstname} ${staff.lastname}`.trim() : "the daily support person";

export default function SupportBookingForm({ onRequested, compact = false }: Props) {
  const [settings, setSettings] = useState<SupportSettings>();
  const [staff, setStaff] = useState<SupportStaff[]>([]);
  const [date, setDate] = useState(isoDate(new Date()));
  const [duration, setDuration] = useState(30);
  const [requestSpecificPerson, setRequestSpecificPerson] = useState("no");
  const [requestedStaff, setRequestedStaff] = useState("");
  const [availability, setAvailability] = useState<SupportAvailability>();
  const [selectedStart, setSelectedStart] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSpecificRequest = requestSpecificPerson === "yes";

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
    if (!settings || !date || !duration || (isSpecificRequest && !requestedStaff)) {
      setAvailability(undefined);
      setSelectedStart("");
      return;
    }
    let live = true;
    setLoadingSlots(true);
    setSelectedStart("");
    supportScheduleApi.availability(date, duration, isSpecificRequest ? Number(requestedStaff) : undefined)
      .then((result) => live && setAvailability(result))
      .catch((error: Error) => {
        if (live) {
          setAvailability(undefined);
          toast.error(error.message || "Unable to load available times.");
        }
      })
      .finally(() => live && setLoadingSlots(false));
    return () => { live = false; };
  }, [date, duration, requestedStaff, settings, isSpecificRequest]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStart) {
      toast.error("Choose an available time first.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Add a short support topic.");
      return;
    }
    setSubmitting(true);
    try {
      const request = await supportScheduleApi.createRequest({
        scheduled_start: selectedStart,
        duration_minutes: duration,
        subject: subject.trim(),
        message: description.trim(),
        requested_staff_id: isSpecificRequest ? Number(requestedStaff) : undefined,
      });
      toast.success(request.status === "awaiting_assignee_approval"
        ? "Request sent. Your selected support person must approve it."
        : "Support request submitted to the daily support person.");
      setSubject("");
      setDescription("");
      setSelectedStart("");
      onRequested?.();
    } catch (error: any) {
      toast.error(error?.message || "Unable to submit the support request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>;
  if (!settings) return <Alert severity="error">Support scheduling is not available right now.</Alert>;

  return (
    <Box component="form" onSubmit={submit}>
      <Stack spacing={compact ? 1.7 : 2.2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Request a support call</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
            Select an available time. Requests for a specific person require that person’s approval before the call is confirmed.
          </Typography>
        </Box>
        <TextField label="Support topic" value={subject} onChange={(event) => setSubject(event.target.value)} inputProps={{ maxLength: 160 }} required fullWidth />
        <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={compact ? 2 : 3} inputProps={{ maxLength: 4000 }} fullWidth />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField label="Preferred date" type="date" value={date} onChange={(event) => setDate(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth required />
          <FormControl fullWidth>
            <InputLabel id="support-duration-label">Call length</InputLabel>
            <Select labelId="support-duration-label" label="Call length" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              {settings.allowed_durations.map((minutes) => <MenuItem key={minutes} value={minutes}>{minutes} minutes</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
        <FormControl component="fieldset">
          <Typography variant="subtitle2" fontWeight={700}>Do you need support from a specific person?</Typography>
          <RadioGroup row value={requestSpecificPerson} onChange={(event) => { setRequestSpecificPerson(event.target.value); setRequestedStaff(""); }}>
            <FormControlLabel value="no" control={<Radio />} label="No, assign the available support person" />
            <FormControlLabel value="yes" control={<Radio />} label="Yes, request a specific person" />
          </RadioGroup>
        </FormControl>
        {isSpecificRequest && <FormControl fullWidth required>
          <InputLabel id="support-person-label">Support person</InputLabel>
          <Select labelId="support-person-label" label="Support person" value={requestedStaff} inputProps={{ "aria-label": "Support person" }} onChange={(event) => setRequestedStaff(String(event.target.value))}>
            {staff.map((person) => <MenuItem key={person.user_id} value={String(person.user_id)}>{person.firstname} {person.lastname}</MenuItem>)}
          </Select>
        </FormControl>}
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>Available time slots with {staffName(availability?.assigned_staff)}</Typography>
          {loadingSlots ? <CircularProgress size={22} sx={{ m: 1 }} /> : (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
              {availability?.slots.map((slot) => <Button key={slot.start_at} type="button" variant={selectedStart === slot.start_at ? "contained" : "outlined"} onClick={() => setSelectedStart(slot.start_at)} startIcon={<CalendarMonthRoundedIcon />}>{timeLabel(slot.start_at)}</Button>)}
              {availability && availability.slots.length === 0 && <Typography variant="body2" color="text.secondary">No times are available for this selection.</Typography>}
            </Stack>
          )}
        </Box>
        <Button type="submit" variant="contained" disabled={submitting || !selectedStart} sx={{ alignSelf: "flex-start", px: 3, py: 1.1, fontWeight: 800 }}>
          {submitting ? "Submitting…" : "Submit support request"}
        </Button>
      </Stack>
    </Box>
  );
}
