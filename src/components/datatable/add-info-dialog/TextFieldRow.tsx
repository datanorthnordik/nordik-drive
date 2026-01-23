"use client";

import React from "react";
import { TextField } from "@mui/material";
import { color_border, color_text_primary, color_white } from "../../../constants/colors";

type Props = {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
};

export default function TextFieldRow({ value, onChange, multiline, rows, placeholder }: Props) {
  return (
    <TextField
      fullWidth
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      multiline={!!multiline}
      rows={multiline ? rows ?? 4 : 1}
      sx={{
        background: color_white,
        borderRadius: "10px",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: color_border },
        "& .MuiInputBase-input": {
          fontSize: "1.05rem",
          fontWeight: 800,
          color: color_text_primary,
          padding: "12px",
        },
      }}
    />
  );
}
