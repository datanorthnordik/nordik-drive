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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

import useFetch from "../../hooks/useFetch"; // ✅ adjust path if needed

// ✅ keep types minimal + compatible with your page
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

export default function DownloadUpdatesModal({
  open,
  onClose,
  apiBase,
  mode,
  clauses,
  dangerBtnSx,
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
    await fetchDownload(
      { mode, clauses, format },
      undefined,
      false,
      { responseType: "blob" } // expects blob
    );
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
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          background: "linear-gradient(90deg, #ffffff, #f8fafc)",
          borderBottom: "1px solid #eef2f7",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DownloadIcon />
          Download Updates
        </Box>

        <IconButton onClick={() => !downloadLoading && onClose()} disabled={downloadLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ background: "#fbfdff" }}>
        <Typography sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
          Export format
        </Typography>

        <ToggleButtonGroup
          exclusive
          value={format}
          onChange={(_, v) => v && setFormat(v)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "12px",
              px: 1.4,
              py: 0.8,
            },
          }}
        >
          <ToggleButton value="excel">Excel (.xlsx)</ToggleButton>
          <ToggleButton value="csv">CSV (.csv)</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ mt: 2 }}>
          <Chip
            label={`Using current filters: ${clauses.length} clause${clauses.length === 1 ? "" : "s"}`}
            size="small"
            sx={{ fontWeight: 900 }}
          />
        </Box>

        {downloadError && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 900, color: "#ef4444" }}>
              Download failed
            </Typography>
            <Typography sx={{ color: "#64748b", fontSize: 13 }}>
              {String(downloadError)}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 1.25, background: "#ffffff" }}>
        <Button onClick={onClose} disabled={downloadLoading} sx={dangerBtnSx}>
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={downloadLoading ? <CircularProgress size={18} /> : <DownloadIcon />}
          onClick={handleDownload}
          disabled={downloadLoading}
          sx={dangerBtnSx}
        >
          {downloadLoading ? "Preparing..." : "Download"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
