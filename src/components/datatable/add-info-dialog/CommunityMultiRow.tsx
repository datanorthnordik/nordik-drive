"use client";

import React from "react";
import { Box, Button, TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { color_border, color_secondary, color_text_primary, color_white } from "../../../constants/colors";

type Props = {
  values: string[];
  options: string[];
  onChange: (next: string[]) => void;

  // called when user types a brand-new community and confirms it
  onAddNewCommunity: (name: string) => Promise<void>;
};

export default function CommunityMultiRow({ values, options, onChange, onAddNewCommunity }: Props) {
  const safe = values?.length ? values : [""];

  const norm = (v: any) => (typeof v === "string" ? v.trim() : "");
  const exists = (name: string) =>
    options.some((o) => o.trim().toLowerCase() === name.trim().toLowerCase());

  const commit = async (idx: number, raw: any) => {
    const cleaned = norm(raw);
    const next = [...safe];
    next[idx] = cleaned;
    onChange(next);

    if (cleaned && !exists(cleaned)) {
      await onAddNewCommunity(cleaned);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {safe.map((val, idx) => (
        <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
          <Autocomplete
            freeSolo
            fullWidth
            options={options}
            value={val || ""}
            inputValue={val || ""}
            onInputChange={(_, newInputValue) => {
              const next = [...safe];
              next[idx] = newInputValue;
              onChange(next);
            }}
            onChange={(_, newValue) => {
              void commit(idx, newValue);
            }}
            noOptionsText="No match — type the name and press Enter to add it"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search or type a community (press Enter to add)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = (e.target as HTMLInputElement).value;
                    void commit(idx, v);
                  }
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
            )}
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
          + Add Community
        </Button>
      </Box>
    </Box>
  );
}
