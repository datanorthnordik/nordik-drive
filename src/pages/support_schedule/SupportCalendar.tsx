import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, ButtonBase, Stack, Typography } from "@mui/material";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import { SupportCalendarDay } from "./api";

type Props = {
  days: SupportCalendarDay[];
  selectedDate?: string;
  onSelect: (date: string) => void;
  title?: string;
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dateFromValue = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`);
const toDateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const personName = (person?: { firstname: string; lastname: string }) => person ? `${person.firstname} ${person.lastname}`.trim() : "No support assigned";

const statusLabel: Record<SupportCalendarDay["status"], string> = {
  available: "Available",
  partial_availability: "Partial availability",
  fully_unavailable: "Unavailable",
  fully_booked: "Fully booked",
  uncovered: "No coverage",
  weekend: "Weekend",
};

const statusColor: Record<SupportCalendarDay["status"], string> = {
  available: "success.main",
  partial_availability: "warning.main",
  fully_unavailable: "error.main",
  fully_booked: "error.main",
  uncovered: "text.disabled",
  weekend: "text.disabled",
};

export default function SupportCalendar({ days, selectedDate, onSelect, title = "Support schedule" }: Props) {
  const firstAvailableDate = days[0]?.date;
  const [visibleMonth, setVisibleMonth] = useState(() => dateFromValue(selectedDate || firstAvailableDate || toDateValue(new Date())));

  useEffect(() => {
    if (selectedDate) setVisibleMonth(dateFromValue(selectedDate));
  }, [selectedDate]);

  const dayByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const today = toDateValue(new Date());
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12);
  const firstGridDate = new Date(firstDay);
  firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());
  const gridDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    return date;
  });
  const monthName = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(firstDay);

  return (
    <Box component="section" aria-label={title} sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
        <Box><Typography variant="h6" fontWeight={850}>{title}</Typography><Typography variant="body2" color="text.secondary">Select an available weekday to see its times.</Typography></Box>
        <Stack direction="row" spacing={.25}><Button aria-label="Previous month" size="small" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}><NavigateBeforeRoundedIcon /></Button><Button aria-label="Next month" size="small" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}><NavigateNextRoundedIcon /></Button></Stack>
      </Stack>
      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", bgcolor: "background.paper" }}>
        <Box sx={{ px: { xs: 1.1, sm: 1.8 }, py: 1.25, borderBottom: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}><Typography fontWeight={850}>{monthName}</Typography></Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderBottom: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}>{weekDays.map((weekday) => <Typography key={weekday} variant="caption" align="center" color="text.secondary" fontWeight={800} sx={{ py: .85 }}>{weekday}</Typography>)}</Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
          {gridDays.map((gridDate) => {
            const value = toDateValue(gridDate);
            const day = dayByDate.get(value);
            const inMonth = gridDate.getMonth() === visibleMonth.getMonth();
            const selected = value === selectedDate;
            const isToday = value === today;
            const disabled = !day || !day.is_bookable;
            const assignedToViewer = Boolean(day?.is_assigned_to_viewer);
            const ariaLabel = day ? `${new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric" }).format(gridDate)}: ${personName(day.assigned_staff)}, ${day.status_message}` : `${value}: outside the scheduling range`;
            return <ButtonBase key={value} aria-label={ariaLabel} disabled={disabled} onClick={() => day && onSelect(day.date)} sx={{ display: "block", minWidth: 0, minHeight: { xs: 82, sm: 106, md: 126 }, textAlign: "left", borderRadius: 0, borderRight: "1px solid", borderBottom: "1px solid", borderColor: "divider", p: { xs: .7, sm: 1.1 }, color: "text.primary", alignItems: "stretch", justifyContent: "stretch", opacity: disabled ? .52 : 1, cursor: disabled ? "not-allowed" : "pointer", bgcolor: selected ? "primary.50" : assignedToViewer ? "info.50" : "background.paper", "&.Mui-disabled": { color: "text.disabled", bgcolor: day ? "action.disabledBackground" : "action.hover" }, "&:not(.Mui-disabled):hover": { bgcolor: selected ? "primary.100" : "action.hover" }, ...(isToday ? { boxShadow: "inset 0 0 0 2px", boxShadowColor: "primary.main" } : {}) }}>
              <Stack spacing={.3} sx={{ height: "100%" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="body2" fontWeight={850} color={inMonth ? "inherit" : "text.disabled"}>{gridDate.getDate()}</Typography>{isToday && <Typography variant="caption" color="primary.main" fontWeight={800}>Today</Typography>}</Stack>
                {day && <><Typography variant="caption" fontWeight={750} noWrap title={personName(day.assigned_staff)}>{personName(day.assigned_staff)}</Typography>{assignedToViewer ? <Typography variant="caption" color="info.dark" fontWeight={850}>Assigned to you</Typography> : <Typography variant="caption" color={statusColor[day.status]} fontWeight={800} noWrap>{statusLabel[day.status]}</Typography>}{day.scheduled_call_count > 0 && <Typography variant="caption" color="text.secondary">{day.scheduled_call_count} call{day.scheduled_call_count === 1 ? "" : "s"}</Typography>}</>}
              </Stack>
            </ButtonBase>;
          })}
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: .9 }}>Muted dates are unavailable, fully booked, outside the 14-day range, or weekends.</Typography>
    </Box>
  );
}
