import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, Stack, TextField, Typography,
  useMediaQuery, useTheme,
} from "@mui/material";
import toast from "react-hot-toast";
import SupportCalendar from "./SupportCalendar";
import { SupportAvailability, SupportCalendarDay, SupportSettings, SupportStaff, supportScheduleApi } from "./api";

type Props = { onRequested?: () => void; compact?: boolean };

const displayDate = (value?: string) => value ? new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Toronto" }).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : "No date selected";
const timeLabel = (value: string) => new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(value));
const staffName = (staff?: { firstname: string; lastname: string }) => staff ? `${staff.firstname} ${staff.lastname}`.trim() : "No support person assigned";

export default function SupportBookingForm({ onRequested, compact = false }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [settings, setSettings] = useState<SupportSettings>();
  const [staff, setStaff] = useState<SupportStaff[]>([]);
  const [calendar, setCalendar] = useState<SupportCalendarDay[]>([]);
  const [date, setDate] = useState("");
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

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
        setDate((current) => {
          if (current && result.days.some((day) => day.date === current && day.is_bookable)) return current;
          return isMobile ? "" : result.days.find((day) => day.is_bookable)?.date || "";
        });
      })
      .catch((error: Error) => live && toast.error(error.message || "Unable to load the support calendar."))
      .finally(() => live && setLoadingCalendar(false));
    return () => { live = false; };
  }, [settings, duration, isSpecificRequest, requestedStaff, calendarVersion, isMobile]);

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
      .catch((error: Error) => live && toast.error(error.message || "Unable to load available times."))
      .finally(() => live && setLoadingSlots(false));
    return () => { live = false; };
  }, [date, duration, requestedStaff, settings, isSpecificRequest, selectedDay?.is_bookable]);

  const selectDate = (nextDate: string) => {
    setDate(nextDate);
    setSelectedStart("");
    if (isMobile) {
      setCalendarOpen(false);
      setAvailabilityOpen(true);
    }
  };

  const openCalendar = () => {
    if (isSpecificRequest && !requestedStaff) {
      toast.error("Choose a support person before choosing a date.");
      return;
    }
    setCalendarOpen(true);
  };

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

  const schedulingControls = <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
    <FormControl fullWidth><InputLabel id="support-duration-label">Call length</InputLabel><Select labelId="support-duration-label" label="Call length" value={duration} onChange={(event) => { setDuration(Number(event.target.value)); setSelectedStart(""); }}>{settings.allowed_durations.map((minutes) => <MenuItem key={minutes} value={minutes}>{minutes} minutes</MenuItem>)}</Select></FormControl>
    <FormControl fullWidth><Typography variant="subtitle2" fontWeight={750}>Who should provide support?</Typography><RadioGroup row value={requestSpecificPerson} onChange={(event) => { setRequestSpecificPerson(event.target.value); setRequestedStaff(""); setDate(""); setSelectedStart(""); }}><FormControlLabel value="no" control={<Radio />} label="Daily support person" /><FormControlLabel value="yes" control={<Radio />} label="Specific person" /></RadioGroup></FormControl>
    {isSpecificRequest && <FormControl fullWidth required><InputLabel id="support-person-label">Support person</InputLabel><Select labelId="support-person-label" label="Support person" value={requestedStaff} inputProps={{ "aria-label": "Support person" }} onChange={(event) => { setRequestedStaff(String(event.target.value)); setDate(""); setSelectedStart(""); }}>{staff.map((person) => <MenuItem key={person.user_id} value={String(person.user_id)}>{person.firstname} {person.lastname}</MenuItem>)}</Select></FormControl>}
  </Stack>;

  return <Box component="form" onSubmit={submit}><Stack spacing={compact ? 2 : 2.75}>
    <Box><Typography variant="h5" fontWeight={900}>Request a support call</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Choose a support date and then an available time.</Typography></Box>
    {schedulingControls}

    {isMobile ? <Card variant="outlined"><CardContent><Stack spacing={1.25}><Box><Typography variant="overline" color="text.secondary">1. Choose date and time</Typography><Typography fontWeight={800}>{selectedStart ? `${displayDate(date)} at ${timeLabel(selectedStart)}` : date ? displayDate(date) : "No date or time selected"}</Typography><Typography variant="body2" color="text.secondary">{selectedDay ? `${staffName(availability?.assigned_staff || selectedDay.assigned_staff)} · ${selectedDay.status_message}` : "Open the calendar to choose an available support date."}</Typography></Box><Stack direction="row" spacing={1}><Button type="button" variant="outlined" onClick={openCalendar} disabled={loadingCalendar}>{date ? "Change date" : "Choose date"}</Button>{date && <Button type="button" variant="contained" onClick={() => setAvailabilityOpen(true)} disabled={loadingSlots || !selectedDay?.is_bookable}>{selectedStart ? "Change time" : "Choose time"}</Button>}</Stack></Stack></CardContent></Card> : <DesktopSchedule calendar={calendar} selectedDate={date} selectedDay={selectedDay} availability={availability} loadingCalendar={loadingCalendar} loadingSlots={loadingSlots} slotChoices={slotChoices} isSpecificRequest={isSpecificRequest} requestedStaff={requestedStaff} onSelectDate={selectDate} onSelectTime={setSelectedStart} selectedStart={selectedStart} />}

    <TextField label="Support topic" value={subject} onChange={(event) => setSubject(event.target.value)} inputProps={{ maxLength: 160 }} required fullWidth />
    <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={compact ? 2 : 3} inputProps={{ maxLength: 4000 }} fullWidth />
    <Button type="submit" variant="contained" disabled={submitting || !selectedStart || !selectedDay?.is_bookable} sx={{ alignSelf: "flex-start", px: 3, py: 1.1, fontWeight: 800 }}>{submitting ? "Submitting…" : "Submit support request"}</Button>
  </Stack>

  <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)} fullScreen={isMobile} fullWidth maxWidth="xl" scroll="paper"><DialogTitle>1. Choose an available support date</DialogTitle><DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>{loadingCalendar ? <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box> : <SupportCalendar title={isSpecificRequest ? "Selected support person’s calendar" : "Support calendar"} days={calendar} selectedDate={date} onSelect={selectDate} />}</DialogContent><DialogActions><Button onClick={() => setCalendarOpen(false)}>Cancel</Button></DialogActions></Dialog>
  <Dialog open={availabilityOpen} onClose={() => setAvailabilityOpen(false)} fullScreen={isMobile} fullWidth maxWidth="sm" scroll="paper"><DialogTitle>2. Choose an available time</DialogTitle><DialogContent dividers><Stack spacing={1.5}><Box><Typography variant="h6" fontWeight={850}>{displayDate(date)}</Typography><Typography color="text.secondary">{staffName(availability?.assigned_staff || selectedDay?.assigned_staff)}</Typography></Box>{selectedDay && <Alert severity={selectedDay.status === "partial_availability" ? "warning" : "success"} icon={false}>{availability ? `${availability.slots.length} available time${availability.slots.length === 1 ? "" : "s"}` : selectedDay.status_message}</Alert>}{loadingSlots ? <Box sx={{ py: 5, textAlign: "center" }}><CircularProgress /></Box> : <Stack direction="row" flexWrap="wrap" gap={.8}>{slotChoices.map((slot) => <Button key={slot.start_at} type="button" disabled={slot.disabled} variant="outlined" onClick={() => { if (!slot.disabled) { setSelectedStart(slot.start_at); setAvailabilityOpen(false); } }} sx={{ textTransform: "none" }}>{timeLabel(slot.start_at)}{slot.disabled ? " · unavailable" : ""}</Button>)}{availability && slotChoices.length === 0 && <Typography variant="body2" color="text.secondary">No times are available for this day.</Typography>}</Stack>}<Typography variant="caption" color="text.secondary">Unavailable and booked times are muted and cannot be selected.</Typography></Stack></DialogContent><DialogActions><Button onClick={() => { setAvailabilityOpen(false); setCalendarOpen(true); }}>Change date</Button><Button onClick={() => setAvailabilityOpen(false)}>Cancel</Button></DialogActions></Dialog>
  </Box>;
}

function DesktopSchedule({ calendar, selectedDate, selectedDay, availability, loadingCalendar, loadingSlots, slotChoices, isSpecificRequest, requestedStaff, onSelectDate, onSelectTime, selectedStart }: { calendar: SupportCalendarDay[]; selectedDate: string; selectedDay?: SupportCalendarDay; availability?: SupportAvailability; loadingCalendar: boolean; loadingSlots: boolean; slotChoices: Array<{ start_at: string; end_at: string; unavailable_reason?: string; disabled: boolean }>; isSpecificRequest: boolean; requestedStaff: string; onSelectDate: (date: string) => void; onSelectTime: (time: string) => void; selectedStart: string }) {
  if (isSpecificRequest && !requestedStaff) return <Alert severity="info">Choose a support person to see that person’s availability calendar.</Alert>;
  if (loadingCalendar) return <Box sx={{ py: 7, textAlign: "center" }}><CircularProgress size={30} /></Box>;
  return <Stack direction={{ xs: "column", lg: "row" }} spacing={2.25} alignItems="stretch"><Box sx={{ flex: 1, minWidth: 0 }}><SupportCalendar title={isSpecificRequest ? "Selected support person’s calendar" : "Support calendar"} days={calendar} selectedDate={selectedDate} onSelect={onSelectDate} /></Box><Card variant="outlined" sx={{ width: { lg: 360 }, flexShrink: 0 }}><CardContent><Stack spacing={1.5}><Box><Typography variant="overline" color="text.secondary">Selected day</Typography><Typography variant="h6" fontWeight={850}>{displayDate(selectedDate)}</Typography></Box>{selectedDay ? <><Typography fontWeight={750}>{staffName(availability?.assigned_staff || selectedDay.assigned_staff)}</Typography><Alert severity={selectedDay.status === "partial_availability" ? "warning" : "success"} icon={false} sx={{ py: .6 }}>{availability ? `${availability.slots.length} available time${availability.slots.length === 1 ? "" : "s"}` : selectedDay.status_message}</Alert><Typography variant="subtitle2" fontWeight={800}>Available time slots</Typography>{loadingSlots ? <CircularProgress size={24} /> : <Stack direction="row" flexWrap="wrap" gap={.8}>{slotChoices.map((slot) => <Button key={slot.start_at} type="button" size="small" disabled={slot.disabled} variant={selectedStart === slot.start_at ? "contained" : "outlined"} onClick={() => !slot.disabled && onSelectTime(slot.start_at)} sx={{ textTransform: "none" }}>{timeLabel(slot.start_at)}{slot.disabled ? " · unavailable" : ""}</Button>)}</Stack>}<Typography variant="caption" color="text.secondary">Unavailable and booked times are muted and cannot be selected.</Typography></> : <Alert severity="info">No bookable support date is currently available.</Alert>}</Stack></CardContent></Card></Stack>;
}
