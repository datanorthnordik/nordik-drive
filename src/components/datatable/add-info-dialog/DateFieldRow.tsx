"use client";

import React from "react";
import { Box, TextField } from "@mui/material";
import DropdownDatePicker from "../DropDownPicker";
import { color_border, color_text_primary, color_white } from "../../../constants/colors";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function DateFieldRow({ value, onChange }: Props) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <TextField
        fullWidth
        label="dd.mm.yyyy"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
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
      <DropdownDatePicker value={value || ""} onChange={(v: string) => onChange(v)} />
    </Box>
  );
}
