import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, FormControl, FormControlLabel, InputLabel,
  MenuItem, Radio, RadioGroup, Select, Stack, TextField, Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import SupportCalendar from "./SupportCalendar";
import { SupportAvailability, SupportCalendarDay, SupportSettings, SupportStaff, supportScheduleApi } from "./api";

type Props = { onRequested?: () => void; compact?: boolean };

const isoDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const nextSupportDate = (date: Date) => {
  const next = new Date(date);
  while ([0, 6].includes(next.getDay())) next.setDate(next.getDate() + 1);
  return next;
};

const displayDate = (value?: string) => value ? new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Toronto" }).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : "Select a date";
const timeLabel = (value: string) => new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(value));
const staffName = (staff?: { firstname: string; lastname: string }) => staff ? `${staff.firstname} ${staff.lastname}`.trim() : "No support person assigned";

export default function SupportBookingForm({ onRequested, compact = false }: Props) {
  const [settings, setSettings] = useState<SupportSettings>();
  const [staff, setStaff] = useState<SupportStaff[]>([]);
  const [calendar, setCalendar] = useState<SupportCalendarDay[]>([]);
  const [date, setDate] = useState(isoDate(nextSupportDate(new Date())));
  const [duration, setDuration] = useState(30);
  const [requestSpecificPerson, setRequestSpecificPerson] = useState("no");
  const [requestedStaff, setRequestedStaff] = useState("");
  const [availability, setAvailability] = useState<SupportAvailability>();
  const [selectedStart, setSelectedStart] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calendarVersion, setCalendarVersion] = useState(0);

  const isSpecificRequest = requestSpecificPerson === "yes";
  const selectedDay = useMemo(() => calendar.find((day) => day.date === date), [calendar, date]);

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
    if (!settings || (isSpecificRequest && !requestedStaff)) {
      setCalendar([]);
      return;
    }
    let live = true;
    setLoadingCalendar(true);
    supportScheduleApi.calendar(duration, isSpecificRequest ? Number(requestedStaff) : undefined)
      .then((result) => {
        if (!live) return;
        setCalendar(result.days);
        setDate((current) => result.days.some((day) => day.date === current && day.is_bookable)
          ? current
          : result.days.find((day) => day.is_bookable)?.date || "");
      })
      .catch((error: Error) => {
        if (live) {
          setCalendar([]);
          toast.error(error.message || "Unable to load the support calendar.");
        }
      })
      .finally(() => live && setLoadingCalendar(false));
    return () => { live = false; };
  }, [settings, duration, isSpecificRequest, requestedStaff, calendarVersion]);

  useEffect(() => {
    if (!settings || !selectedDay?.is_bookable || (isSpecificRequest && !requestedStaff)) {
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
  }, [date, duration, requestedStaff, settings, isSpecificRequest, selectedDay?.is_bookable]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDay?.is_bookable || !selectedStart) {
      toast.error("Choose an available date and time first.");
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
      toast.success(request.status === "awaiting_assignee_approval" ? "Request sent. Your selected support person must approve it." : "Support request submitted to the daily support person.");
      setSubject("");
      setDescription("");
      setSelectedStart("");
      setCalendarVersion((version) => version + 1);
      onRequested?.();
    } catch (error: any) {
      toast.error(error?.message || "Unable to submit the support request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>;
  if (!settings) return <Alert severity="error">Support scheduling is not available right now.</Alert>;

  const slotChoices = [
    ...(availability?.unavailable_slots || []).map((slot) => ({ ...slot, disabled: true })),
    ...(availability?.slots || []).map((slot) => ({ ...slot, disabled: false })),
  ].sort((a, b) => a.start_at.localeCompare(b.start_at));

  return (
    <Box component="form" onSubmit={submit}>
      <Stack spacing={compact ? 2 : 2.75}>
        <Box><Typography variant="h5" fontWeight={900}>Request a support call</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Choose a date from the support calendar, then select one of its available times.</Typography></Box>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <FormControl fullWidth><InputLabel id="support-duration-label">Call length</InputLabel><Select labelId="support-duration-label" label="Call length" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{settings.allowed_durations.map((minutes) => <MenuItem key={minutes} value={minutes}>{minutes} minutes</MenuItem>)}</Select></FormControl>
          <FormControl fullWidth><Typography variant="subtitle2" fontWeight={750}>Who should provide support?</Typography><RadioGroup row value={requestSpecificPerson} onChange={(event) => { setRequestSpecificPerson(event.target.value); setRequestedStaff(""); }}><FormControlLabel value="no" control={<Radio />} label="Daily support person" /><FormControlLabel value="yes" control={<Radio />} label="Specific person" /></RadioGroup></FormControl>
          {isSpecificRequest && <FormControl fullWidth required><InputLabel id="support-person-label">Support person</InputLabel><Select labelId="support-person-label" label="Support person" value={requestedStaff} inputProps={{ "aria-label": "Support person" }} onChange={(event) => setRequestedStaff(String(event.target.value))}>{staff.map((person) => <MenuItem key={person.user_id} value={String(person.user_id)}>{person.firstname} {person.lastname}</MenuItem>)}</Select></FormControl>}
        </Stack>

        {isSpecificRequest && !requestedStaff ? <Alert severity="info">Choose a support person to see that person’s availability calendar.</Alert> : loadingCalendar ? <Box sx={{ py: 7, textAlign: "center" }}><CircularProgress size={30} /></Box> : <Stack direction={{ xs: "column", lg: "row" }} spacing={2.25} alignItems="stretch"><Box sx={{ flex: 1, minWidth: 0 }}><SupportCalendar title={isSpecificRequest ? "Selected support person’s calendar" : "Support calendar"} days={calendar} selectedDate={date} onSelect={(nextDate) => { setDate(nextDate); setSelectedStart(""); }} /></Box><Card variant="outlined" sx={{ width: { lg: 360 }, flexShrink: 0, alignSelf: "stretch" }}><CardContent><Stack spacing={1.5}><Box><Typography variant="overline" color="text.secondary">Selected day</Typography><Typography variant="h6" fontWeight={850}>{displayDate(date)}</Typography></Box>{selectedDay ? <><Typography fontWeight={750}>{staffName(availability?.assigned_staff || selectedDay.assigned_staff)}</Typography><Alert severity={selectedDay.is_bookable ? selectedDay.status === "partial_availability" ? "warning" : "success" : "info"} icon={false} sx={{ py: .6 }}>{availability ? `${availability.slots.length} available time${availability.slots.length === 1 ? "" : "s"}` : selectedDay.status_message}</Alert><Typography variant="subtitle2" fontWeight={800}>Available time slots</Typography>{loadingSlots ? <CircularProgress size={24} /> : <Stack direction="row" flexWrap="wrap" gap={.8}>{slotChoices.map((slot) => <Button key={slot.start_at} type="button" size="small" disabled={slot.disabled} variant={selectedStart === slot.start_at ? "contained" : "outlined"} onClick={() => !slot.disabled && setSelectedStart(slot.start_at)} sx={{ textTransform: "none" }}>{timeLabel(slot.start_at)}{slot.disabled ? " · unavailable" : ""}</Button>)}{availability && slotChoices.length === 0 && <Typography variant="body2" color="text.secondary">No times are available for this day.</Typography>}</Stack>}<Typography variant="caption" color="text.secondary">Unavailable and booked times are shown muted and cannot be selected.</Typography></> : <Alert severity="info">No bookable support date is currently available.</Alert>}</Stack></CardContent></Card></Stack>}

        <TextField label="Support topic" value={subject} onChange={(event) => setSubject(event.target.value)} inputProps={{ maxLength: 160 }} required fullWidth />
        <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={compact ? 2 : 3} inputProps={{ maxLength: 4000 }} fullWidth />
        <Button type="submit" variant="contained" disabled={submitting || !selectedStart || !selectedDay?.is_bookable} sx={{ alignSelf: "flex-start", px: 3, py: 1.1, fontWeight: 800 }}>{submitting ? "Submitting…" : "Submit support request"}</Button>
      </Stack>
    </Box>
  );
}
