"use client";

import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import TableViewIcon from "@mui/icons-material/TableView";
import DescriptionIcon from "@mui/icons-material/Description";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

import useFetch from "../../hooks/useFetch";

//  use ONLY these colors (import from your constants file)
import {
  color_secondary,
  color_secondary_dark,
  color_border,
  color_white,
  color_light_gray,
  color_white_smoke,
  color_text_primary,
  color_text_secondary,
  color_text_light,
} from "../../constants/colors";

//  keep types minimal + compatible with your page
export type Mode = "CHANGES";

export type Operation =
  | "EQ"
  | "NEQ"
  | "CONTAINS"
  | "IN"
  | "BETWEEN"
  | "LAST_7"
  | "LAST_30"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "ALL_TIME";

export type Joiner = "AND" | "OR";

export type Clause = {
  id: string;
  joiner?: Joiner;
  field: string;
  op: Operation;
  value?: string;
  values?: string[];
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
};

type DownloadFormat = "excel" | "csv";

function formatTileLabel(fmt: DownloadFormat) {
  return fmt === "excel" ? "Excel (.xlsx)" : "CSV (.csv)";
}

export default function DownloadUpdatesModal({
  open,
  onClose,
  apiBase,
  mode,
  clauses,
  dangerBtnSx, // kept for compatibility but not required for styling now
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  mode: Mode;
  clauses: Clause[];
  dangerBtnSx: any;
}) {
  const [format, setFormat] = useState<DownloadFormat>("excel");
  const lastBlobUrlRef = useRef<string>("");

  const {
    data: downloadData,
    fetchData: fetchDownload,
    loading: downloadLoading,
    error: downloadError,
  } = useFetch<any>(`${apiBase}/admin/download`, "POST", false);

  const handleDownload = async () => {
    // same payload style as admin search; backend can reuse logic later
    await fetchDownload({ mode, clauses, format }, undefined, false, {
      responseType: "blob",
    });
  };

  useEffect(() => {
    if (!open) return;
    if (!downloadData) return;

    const blob =
      downloadData instanceof Blob
        ? downloadData
        : (downloadData as any)?.blob instanceof Blob
        ? (downloadData as any).blob
        : null;

    const urlFromApi = (downloadData as any)?.url; // fallback if backend returns url

    const ext = format === "csv" ? "csv" : "xlsx";
    const filename = `updates_${dayjs().format("YYYYMMDD_HHmm")}.${ext}`;

    if (blob) {
      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = "";
      }

      const objectUrl = URL.createObjectURL(blob);
      lastBlobUrlRef.current = objectUrl;

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      onClose();
      return;
    }

    if (typeof urlFromApi === "string" && urlFromApi.length > 0) {
      window.open(urlFromApi, "_blank");
      onClose();
    }
  }, [downloadData, open, format, onClose]);

  useEffect(() => {
    // cleanup on close
    if (!open && lastBlobUrlRef.current) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = "";
    }
  }, [open]);

  const selectedTileSx = {
    border: `2px solid ${color_secondary}`,
    background: color_light_gray,
  } as const;

  const unselectedTileSx = {
    border: `2px solid ${color_border}`,
    background: color_white,
  } as const;

  const primaryBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    background: color_secondary,
    color: color_white,
    px: 2.2,
    "&:hover": { background: color_secondary_dark },
  } as const;

  const cancelBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    background: color_white,
    color: color_text_primary,
    border: `1px solid ${color_border}`,
    px: 2.2,
    "&:hover": { background: color_white_smoke },
  } as const;

  const tileBaseSx = {
    flex: 1,
    minWidth: 220,
    borderRadius: "12px",
    p: 1.35,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1,
    cursor: downloadLoading ? "not-allowed" : "pointer",
    userSelect: "none",
    transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
    "&:hover": downloadLoading
      ? {}
      : {
          transform: "translateY(-1px)",
          boxShadow: "0 10px 18px rgba(0,0,0,0.08)",
        },
  } as const;

  return (
    <Dialog
      open={open}
      onClose={() => !downloadLoading && onClose()}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
          border: `1px solid ${color_border}`,
          background: color_white,
        },
      }}
    >
      {/* Header (matches screenshot: icon + title + X) */}
      <DialogTitle
        sx={{
          fontWeight: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          background: color_white,
          borderBottom: `1px solid ${color_border}`,
          py: 1.25,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DownloadIcon sx={{ color: color_secondary }} />
          <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
            Download Updates
          </Typography>
        </Box>

        <IconButton
          onClick={() => !downloadLoading && onClose()}
          disabled={downloadLoading}
          sx={{
            borderRadius: "10px",
            border: `1px solid ${color_border}`,
            background: color_white,
            "&:hover": { background: color_white_smoke },
          }}
        >
          <CloseIcon sx={{ color: color_text_secondary }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ background: color_white, py: 2 }}>
        <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 1 }}>
          Export format
        </Typography>

        {/* Two big tiles like screenshot */}
        <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
          <Box
            role="button"
            aria-label="Select Excel format"
            tabIndex={0}
            onClick={() => !downloadLoading && setFormat("excel")}
            onKeyDown={(e) => {
              if (downloadLoading) return;
              if (e.key === "Enter" || e.key === " ") setFormat("excel");
            }}
            sx={{
              ...tileBaseSx,
              ...(format === "excel" ? selectedTileSx : unselectedTileSx),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TableViewIcon sx={{ color: color_secondary }} />
              <Box>
                <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
                  Excel (.xlsx)
                </Typography>
                <Typography sx={{ fontSize: 12, color: color_text_light }}>
                  Best for analysis
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2px solid ${
                  format === "excel" ? color_secondary : color_border
                }`,
                background: format === "excel" ? color_secondary : color_white,
              }}
            />
          </Box>

          <Box
            role="button"
            aria-label="Select CSV format"
            tabIndex={0}
            onClick={() => !downloadLoading && setFormat("csv")}
            onKeyDown={(e) => {
              if (downloadLoading) return;
              if (e.key === "Enter" || e.key === " ") setFormat("csv");
            }}
            sx={{
              ...tileBaseSx,
              ...(format === "csv" ? selectedTileSx : unselectedTileSx),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DescriptionIcon sx={{ color: color_secondary }} />
              <Box>
                <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
                  CSV (.csv)
                </Typography>
                <Typography sx={{ fontSize: 12, color: color_text_light }}>
                  Lightweight export
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2px solid ${format === "csv" ? color_secondary : color_border}`,
                background: format === "csv" ? color_secondary : color_white,
              }}
            />
          </Box>
        </Box>

        {/* Filter chip like screenshot */}
        <Box sx={{ mt: 1.75 }}>
          <Chip
            icon={<FilterAltIcon sx={{ color: color_text_secondary }} />}
            label={`USING CURRENT FILTERS: ${clauses.length} CLAUSE${
              clauses.length === 1 ? "" : "S"
            }`}
            size="small"
            sx={{
              fontWeight: 900,
              letterSpacing: "0.02em",
              borderRadius: "999px",
              background: color_light_gray,
              border: `1px solid ${color_border}`,
              color: color_text_secondary,
              px: 0.5,
              "& .MuiChip-icon": { ml: 1 },
            }}
          />
        </Box>

        {downloadError && (
          <Box
            sx={{
              mt: 2,
              border: `1px solid ${color_border}`,
              background: color_white_smoke,
              borderRadius: "12px",
              p: 1.25,
            }}
          >
            <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
              Download failed
            </Typography>
            <Typography sx={{ color: color_text_secondary, fontSize: 13, mt: 0.25 }}>
              {String(downloadError)}
            </Typography>
          </Box>
        )}

        {/* Small hint line (kept subtle) */}
        <Typography sx={{ mt: 2, fontSize: 12, color: color_text_light }}>
          Selected: <b>{formatTileLabel(format)}</b>
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          p: 1.5,
          background: color_white,
          borderTop: `1px solid ${color_border}`,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.25,
        }}
      >
        <Button onClick={onClose} disabled={downloadLoading} sx={cancelBtnSx}>
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={
            downloadLoading ? (
              <CircularProgress size={18} sx={{ color: color_white }} />
            ) : (
              <DownloadIcon />
            )
          }
          onClick={handleDownload}
          disabled={downloadLoading}
          sx={primaryBtnSx}
        >
          {downloadLoading ? "Preparing..." : "Download"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
