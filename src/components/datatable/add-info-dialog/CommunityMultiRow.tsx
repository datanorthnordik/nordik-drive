"use client";

import React from "react";
import { Box, Button, TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import {
  color_border,
  color_secondary,
  color_text_primary,
  color_white,
  color_focus_ring,
} from "../../../constants/colors";

type CommunityMultiConfig = {
  placeholder?: string;
  no_options_text?: string;
  add_label?: string;
};

type Props = {
  values: string[];
  options: string[];
  onChange: (next: string[]) => void;
  onAddNewCommunity: (name: string) => Promise<void>;

  disabled?: boolean;

  config?: CommunityMultiConfig;
};

export default function CommunityMultiRow({
  values,
  options,
  onChange,
  onAddNewCommunity,
  disabled = false,
  config,
}: Props) {
  const safe = values?.length ? values : [""];

  const norm = (v: any) => (typeof v === "string" ? v.trim() : "");

  const safeOptions = Array.isArray(options) ? options : [];
  const exists = (name: string) =>
    safeOptions.some((o) => o.trim().toLowerCase() === name.trim().toLowerCase());

  const commit = async (idx: number, raw: any) => {
    if (disabled) return;

    const cleaned = norm(raw);
    const next = [...safe];
    next[idx] = cleaned;
    onChange(next);

    if (cleaned && !exists(cleaned)) {
      await onAddNewCommunity(cleaned);
    }
  };

  const placeholder =
    config?.placeholder || "Search or type a community (press Enter to add)";
  const noOptionsText =
    config?.no_options_text || "No match — type the name and press Enter to add it";
  const addLabel = config?.add_label || "+ Add Community";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {safe.map((val, idx) => (
        <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
          <Autocomplete
            freeSolo
            fullWidth
            options={safeOptions}
            value={val || ""}
            inputValue={val || ""}
            disabled={disabled}
            onInputChange={(_, newInputValue) => {
              if (disabled) return;
              const next = [...safe];
              next[idx] = newInputValue;
              onChange(next);
            }}
            onChange={(_, newValue) => {
              void commit(idx, newValue);
            }}
            noOptionsText={noOptionsText}
            renderInput={(params) => (
              <TextField
                {...params}
                disabled={disabled}
                placeholder={placeholder}
                onKeyDown={(e) => {
                  if (disabled) return;
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
            )}
          />

          <Button
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
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
              "&:focus-visible": {
                outline: `3px solid ${color_focus_ring}`,
                outlineOffset: "2px",
              },
            }}
          >
            ✕
          </Button>
        </Box>
      ))}

      <Box>
        <Button
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            onChange([...safe, ""]);
          }}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            border: `1px dashed ${color_secondary}`,
            color: color_secondary,
            background: color_white,
            "&:focus-visible": {
              outline: `3px solid ${color_focus_ring}`,
              outlineOffset: "2px",
            },
          }}
        >
          {addLabel}
        </Button>
      </Box>
    </Box>
  );
}