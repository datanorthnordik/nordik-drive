"use client";

import React from "react";
import { Box, Button, Chip, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import TuneIcon from "@mui/icons-material/Tune";
import DownloadIcon from "@mui/icons-material/Download";
import FolderZipIcon from "@mui/icons-material/FolderZip";

import { Mode } from "./FileActivitiesShared";
import { color_border, color_secondary, color_secondary_dark, color_text_primary, color_white } from "../../constants/colors";

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;

  totalRequests: number;
  totalChanges: number;

  onOpenDownloadUpdates: () => void;
  onOpenDownloadMedia: () => void;

  primaryBtnSx: any;
};

export default function FileActivitiesTopBar({
  mode,
  onModeChange,
  totalRequests,
  totalChanges,
  onOpenDownloadUpdates,
  onOpenDownloadMedia,
  primaryBtnSx,
}: Props) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        flexWrap: "wrap",
        background: color_white,
        border: `1px solid ${color_border}`,
        borderRadius: "12px",
        px: 1,
        py: 0.75,
      }}
    >
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && onModeChange(v)}
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 1.2,
            py: 0.6,
            background: color_white,
            border: `1px solid ${color_border}`,
          },
        }}
      >
        <ToggleButton value="CHANGES">
          <ListAltIcon sx={{ fontSize: 18, mr: 0.75 }} />
          Changes
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Chip
          icon={<TuneIcon />}
          label={`Requests: ${totalRequests} | Changes: ${totalChanges}`}
          size="small"
          sx={{
            fontWeight: 900,
            borderRadius: "10px",
            background: color_white,
            border: `1px solid ${color_border}`,
            color: color_text_primary,
          }}
        />

        <Button startIcon={<DownloadIcon />} onClick={onOpenDownloadUpdates} sx={primaryBtnSx}>
          Download Updates
        </Button>

        <Button
          startIcon={<FolderZipIcon />}
          onClick={onOpenDownloadMedia}
          sx={{
            ...primaryBtnSx,
            background: color_secondary,
            "&:hover": { background: color_secondary_dark },
          }}
        >
          Download Photos & Docs
        </Button>
      </Box>
    </Box>
  );
}