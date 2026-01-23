"use client";

import React from "react";
import { Box, Button, TextField } from "@mui/material";
import { color_border, color_secondary, color_text_primary, color_white } from "../../../constants/colors";

type Props = {
  values: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
};

export default function MultiValueRow({ values, onChange, addLabel }: Props) {
  const safe = values?.length ? values : [""];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {safe.map((val, idx) => (
        <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
          <TextField
            fullWidth
            value={val || ""}
            onChange={(e) => {
              const next = [...safe];
              next[idx] = e.target.value;
              onChange(next);
            }}
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
          <Button
            onClick={() => {
              const next = safe.filter((_, i) => i !== idx);
              onChange(next.length ? next : [""]);
            }}
            sx={{
              minWidth: 54,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 900,
              border: `1px solid ${color_border}`,
              color: color_text_primary,
              background: color_white,
            }}
          >
            ✕
          </Button>
        </Box>
      ))}

      <Box>
        <Button
          onClick={() => onChange([...safe, ""])}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            border: `1px dashed ${color_secondary}`,
            color: color_secondary,
            background: color_white,
          }}
        >
          + {addLabel}
        </Button>
      </Box>
    </Box>
  );
}
