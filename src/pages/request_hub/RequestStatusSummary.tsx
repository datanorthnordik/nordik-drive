import React from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";

import {
  color_background,
  color_border,
  color_text_light,
  color_text_primary,
  color_white,
} from "../../constants/colors";

type StatusSummaryItem = {
  key: string;
  label: string;
  count: number;
  total: number;
  accent: string;
  background: string;
};

type RequestStatusSummaryProps = {
  items: StatusSummaryItem[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
};

export default function RequestStatusSummary({
  items,
  selectedKey,
  onSelect,
}: RequestStatusSummaryProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      flexWrap="wrap"
      sx={{
        py: 1,
        alignItems: "stretch",
      }}
    >
      {items.map((item) => (
        <ButtonBase
          key={item.key}
          type="button"
          data-testid={`status-summary-${item.key}`}
          aria-pressed={selectedKey === item.key}
          onClick={() => onSelect?.(item.key)}
          sx={{
            minWidth: { xs: "calc(50% - 4px)", sm: 148 },
            flex: { xs: "1 1 calc(50% - 4px)", sm: "0 1 170px" },
            display: "block",
            textAlign: "left",
            px: 1.25,
            py: 1,
            borderRadius: 2,
            border:
              selectedKey === item.key
                ? `2px solid ${item.accent}`
                : `1px solid ${color_border}`,
            background: `linear-gradient(180deg, ${item.background}, ${color_white})`,
            boxShadow:
              selectedKey === item.key
                ? "0 6px 14px rgba(15, 23, 42, 0.12)"
                : "0 1px 2px rgba(15, 23, 42, 0.05)",
            cursor: onSelect ? "pointer" : "default",
            transition: "border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
            "&:hover": onSelect
              ? {
                  boxShadow: "0 6px 14px rgba(15, 23, 42, 0.12)",
                  transform: "translateY(-1px)",
                }
              : undefined,
          }}
        >
          <Typography
            sx={{
              color: color_text_light,
              fontSize: "0.72rem",
              fontWeight: 900,
              lineHeight: 1.1,
              textTransform: "uppercase",
            }}
          >
            {item.label}
          </Typography>
          <Box sx={{ mt: 0.75, display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <Typography
              component="span"
              sx={{ color: item.accent, fontSize: "1.25rem", fontWeight: 950, lineHeight: 1 }}
            >
              {item.count}
            </Typography>
            <Typography
              component="span"
              sx={{ color: color_text_primary, fontSize: "0.86rem", fontWeight: 900 }}
            >
              / {item.total}
            </Typography>
          </Box>
        </ButtonBase>
      ))}
      {items.length === 0 ? (
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: color_background,
            color: color_text_light,
            fontWeight: 800,
            fontSize: "0.8rem",
          }}
        >
          No request counts available.
        </Box>
      ) : null}
    </Stack>
  );
}
