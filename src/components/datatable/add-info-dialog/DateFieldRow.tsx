"use client";

import React from "react";
import { Box, TextField } from "@mui/material";
import DropdownDatePicker from "../DropDownPicker";
import {
  color_border,
  color_text_primary,
  color_white,
  color_focus_ring,
} from "../../../constants/colors";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export default function DateFieldRow({ value, onChange, disabled = false }: Props) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <TextField
        fullWidth
        label="dd.mm.yyyy"
        value={value || ""}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(e.target.value)}
        sx={{
          background: color_white,
          borderRadius: "10px",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: color_border },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: color_focus_ring,
            borderWidth: "2px",
          },
          "& .MuiInputBase-input": {
            fontSize: "1.05rem",
            fontWeight: 800,
            color: color_text_primary,
            padding: "12px",
          },
        }}
      />
      <DropdownDatePicker
        value={value || ""}
        onChange={(v: string) => !disabled && onChange(v)}
        {...({ disabled } as any)}
      />
    </Box>
  );
}