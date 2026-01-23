"use client";

import React from "react";
import { Box, Button } from "@mui/material";
import { RestartAlt } from "@mui/icons-material";
import {
  color_border,
  color_light_gray,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_white,
  color_white_smoke,
} from "../../../constants/colors";

type FieldRowProps = {
  label: string;
  required?: boolean;
  helperText?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
  children: React.ReactNode;
};

export default function FieldRow({
  label,
  required,
  helperText,
  onReset,
  resetDisabled,
  children,
}: FieldRowProps) {
  return (
    <Box
      sx={{
        border: `1px solid ${color_border}`,
        background: color_white,
        borderRadius: "12px",
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 1.25,
        }}
      >
        <Box>
          <Box sx={{ fontWeight: 900, color: color_text_primary, fontSize: "1.05rem" }}>
            {label}
            {required ? <span style={{ color: color_secondary, marginLeft: 6 }}>*</span> : null}
          </Box>
          {helperText ? (
            <Box sx={{ mt: 0.5, color: color_text_primary, opacity: 0.75, fontSize: "0.9rem" }}>
              {helperText}
            </Box>
          ) : null}
        </Box>

        {onReset ? (
          <Button
            onClick={onReset}
            disabled={resetDisabled}
            startIcon={<RestartAlt />}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
              border: `1px solid ${color_secondary}`,
              color: color_secondary,
              background: color_white,
              px: 2,
              "&:hover": { background: color_white_smoke, borderColor: color_secondary_dark },
            }}
          >
            Reset
          </Button>
        ) : null}
      </Box>

      <Box sx={{ background: color_light_gray, borderRadius: "10px", p: 1.25 }}>
        {children}
      </Box>
    </Box>
  );
}
