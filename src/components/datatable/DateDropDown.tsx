"use client";

import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export default function DatePickerComponent({ label, value, onChange }: Props) {
  const parsed =
    value && value.includes(".")
      ? dayjs(value, "DD.MM.YYYY")
      : null;

  const handleChange = (newValue: Dayjs | null) => {
    if (!newValue) return onChange("");
    onChange(newValue.format("DD.MM.YYYY"));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={parsed}
        onChange={handleChange}
        format="DD.MM.YYYY"
        openTo="day"
        views={["year", "month", "day"]} // <— enables month + year dropdowns
        sx={{
          width: "100%",
          "& .MuiInputBase-root": {
            background: "#fff",
            borderRadius: "12px",
            fontSize: "1.3rem",
            padding: "4px 10px",
          },
          "& .MuiButtonBase-root": {
            fontSize: "1.3rem",
            padding: "12px",
          },
        }}
        slotProps={{
          desktopPaper: {
            sx: {
              // Entire popup styling
              padding: "12px",
              borderRadius: "14px",

              // MONTH DROPDOWN
              "& .MuiPickersCalendarHeader-label": {
                fontSize: "1.4rem",
                fontWeight: "700",
              },
              "& .MuiPickersCalendarHeader-switchViewButton": {
                padding: "12px",
                fontSize: "1.4rem",
              },
              "& .MuiPickersFadeTransitionGroup-root": {
                fontSize: "1.5rem",
              },

              // MONTH GRID
              "& .MuiPickersMonth-monthButton": {
                padding: "14px",
                fontSize: "1.3rem",
                width: "100%",
              },

              // YEAR GRID
              "& .MuiPickersYear-yearButton": {
                fontSize: "1.3rem",
                padding: "10px",
                margin: "5px",
                width: "90px",
              },

              // DAY GRID (calendar days)
              "& .MuiPickersDay-root": {
                fontSize: "1.3rem",
                width: "48px",
                height: "48px",
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}
