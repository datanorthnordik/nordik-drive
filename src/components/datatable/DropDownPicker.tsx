import { TextField, MenuItem } from "@mui/material";
import React, { useState, useEffect } from "react";

export default function DropdownDatePicker({ value, onChange }:any) {
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const years = Array.from({ length: 150 }, (_, i) => (new Date().getFullYear() - i).toString());

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // when parent gives dd.mm.yyyy — split it into dropdowns
  useEffect(() => {
    if (!value) return;
    const parts = value.split(".");
    if (parts.length === 3) {
      setDay(parts[0]);
      setMonth(months[parseInt(parts[1], 10) - 1]);
      setYear(parts[2]);
    }
  }, [value]);

  // whenever dropdowns change → send dd.mm.yyyy back
  useEffect(() => {
    if (!day || !month || !year) return;
    const monthIndex = months.indexOf(month) + 1;
    const padMonth = monthIndex.toString().padStart(2, "0");
    onChange(`${day}.${padMonth}.${year}`);
  }, [day, month, year]);

  return (
    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
      <TextField
        select fullWidth value={day} onChange={(e) => setDay(e.target.value)}
        label="Day"
      >
        {days.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>

      <TextField
        select fullWidth value={month} onChange={(e) => setMonth(e.target.value)}
        label="Month"
      >
        {months.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
      </TextField>

      <TextField
        select fullWidth value={year} onChange={(e) => setYear(e.target.value)}
        label="Year"
      >
        {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
      </TextField>
    </div>
  );
}
