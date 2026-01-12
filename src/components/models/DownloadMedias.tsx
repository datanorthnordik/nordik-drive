"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from "@mui/material";

import FolderZipIcon from "@mui/icons-material/FolderZip";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

import useFetch from "../../hooks/useFetch";

type Operation =
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

type Joiner = "AND" | "OR";

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

type MediaType = "all" | "photos" | "document";

type Props = {
  open: boolean;
  onClose: () => void;

  apiBase: string; // e.g. https://.../api
  clauses?: Clause[];

  // later (not used now):
  requestId?: number;

  dangerBtnSx?: any;
};

function safeFilename(name: string) {
  return (name || "download.zip")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .trim();
}

function buildZipName(mediaType: MediaType) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const kind =
    mediaType === "photos"
      ? "photos"
      : mediaType === "document"
      ? "documents"
      : "all_media";
  return safeFilename(`media_${kind}_${ts}.zip`);
}

export default function DownloadMediaModal({
  open,
  onClose,
  apiBase,
  clauses,
  requestId, // kept for later
  dangerBtnSx,
}: Props) {
  const [mediaType, setMediaType] = useState<MediaType>("all");
  const [groupByUser, setGroupByUser] = useState(true);
  const [groupByType, setGroupByType] = useState(true);
  const [onlyApproved, setOnlyApproved] = useState(false);

  const [localErr, setLocalErr] = useState("");

  // ✅ IMPORTANT: useFetch so auth headers/credentials match your app behavior
  const {
    data: zipBlobData,
    fetchData: fetchZip,
    loading: zipLoading,
    error: zipError,
  } = useFetch<any>(`${apiBase}/admin/download_files`, "POST", false);

  // prevent duplicate downloads if state re-renders
  const lastDownloadedRef = useRef<number>(0);
  const downloadNonceRef = useRef<number>(0);
  const pendingNameRef = useRef<string>("media.zip");

  const filterCount = clauses?.length ?? 0;
  const useRequest = Boolean(requestId);

  const summary = useMemo(() => {
    return [
      `Media: ${mediaType}`,
      `Group by user: ${groupByUser ? "Yes" : "No"}`,
      `Group by type: ${groupByType ? "Yes" : "No"}`,
      `Only approved: ${onlyApproved ? "Yes" : "No"}`,
      useRequest ? `Request: ${requestId}` : `Filters: ${filterCount}`,
    ];
  }, [mediaType, groupByUser, groupByType, onlyApproved, useRequest, requestId, filterCount]);

  const closeSafe = () => {
    if (zipLoading) return;
    setLocalErr("");
    onClose();
  };

  const handleDownload = async () => {
    setLocalErr("");

    // ✅ As requested: "download all first" -> use clauses (requestId later)
    const body: any = {
      // NOTE: if your backend expects "all" differently, adjust here.
      document_type: mediaType, // "all" | "photos" | "document"
      categorize_by_user: groupByUser,
      categorize_by_type: groupByType,
      only_approved: onlyApproved,
    };

    if (useRequest) {
      body.request_id = requestId;
    } else {
      body.clauses = clauses || [];
    }

    // track this specific download trigger
    downloadNonceRef.current += 1;
    pendingNameRef.current = buildZipName(mediaType);

    // ✅ responseType blob (same pattern you used for docs)
    await fetchZip(body, undefined, false, { responseType: "blob" });
  };

  // surface hook error
  useEffect(() => {
    if (!zipError) return;
    setLocalErr(String(zipError));
  }, [zipError]);

  // when blob arrives -> download
  useEffect(() => {
    if (!open) return;
    if (!zipBlobData) return;

    const nonce = downloadNonceRef.current;
    if (lastDownloadedRef.current === nonce) return;

    const blob =
      zipBlobData instanceof Blob
        ? zipBlobData
        : (zipBlobData as any)?.blob instanceof Blob
        ? (zipBlobData as any).blob
        : null;

    if (!blob) {
      setLocalErr("ZIP download failed: response was not a file.");
      return;
    }

    lastDownloadedRef.current = nonce;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pendingNameRef.current || "media.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipBlobData, open]);

  return (
    <Dialog
      open={open}
      onClose={closeSafe}
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
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          background: "linear-gradient(90deg, #ffffff, #f8fafc)",
          borderBottom: "1px solid #eef2f7",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FolderZipIcon />
          Download Photos & Documents
        </Box>

        <Button
          onClick={closeSafe}
          disabled={zipLoading}
          startIcon={<CloseIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            color: "#111827",
            background: "#e5e7eb",
            "&:hover": { background: "#d1d5db" },
          }}
        >
          Close
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ background: "#fbfdff" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
            Options
          </Typography>

          <FormControl size="small" fullWidth>
            <InputLabel>Download</InputLabel>
            <Select
              label="Download"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as MediaType)}
              disabled={zipLoading}
            >
              <MenuItem value="all">All (photos + documents)</MenuItem>
              <MenuItem value="photos">Photos only</MenuItem>
              <MenuItem value="document">Documents only</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={groupByUser}
                onChange={(e) => setGroupByUser(e.target.checked)}
                disabled={zipLoading}
              />
            }
            label={<Typography sx={{ fontWeight: 800 }}>Group by User</Typography>}
          />

          <FormControlLabel
            control={
              <Switch
                checked={groupByType}
                onChange={(e) => setGroupByType(e.target.checked)}
                disabled={zipLoading}
              />
            }
            label={
              <Typography sx={{ fontWeight: 800 }}>
                Group by Document Type
              </Typography>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={onlyApproved}
                onChange={(e) => setOnlyApproved(e.target.checked)}
                disabled={zipLoading}
              />
            }
            label={<Typography sx={{ fontWeight: 800 }}>Only Approved</Typography>}
          />

          <Divider />

          <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
            Summary
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {summary.map((s) => (
              <Chip key={s} label={s} size="small" sx={{ fontWeight: 900 }} />
            ))}
          </Box>

          {!useRequest && filterCount === 0 && (
            <Box
              sx={{
                mt: 0.5,
                p: 1,
                borderRadius: "12px",
                border: "1px solid #fde68a",
                background: "#fffbeb",
                color: "#92400e",
                fontWeight: 800,
              }}
            >
              No filters selected. This will download media for all matching requests.
            </Box>
          )}

          {localErr && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: "12px",
                border: "1px solid #fecaca",
                background: "#fff1f2",
                color: "#991b1b",
                fontWeight: 800,
                whiteSpace: "pre-wrap",
              }}
            >
              {localErr}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.25, background: "#ffffff" }}>
        <Button
          onClick={closeSafe}
          disabled={zipLoading}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            color: "#111827",
            background: "#e5e7eb",
            "&:hover": { background: "#d1d5db" },
          }}
        >
          Cancel
        </Button>

        <Button
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={zipLoading}
          sx={
            dangerBtnSx || {
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
              color: "#fff",
              background: "#dc2626",
              "&:hover": { background: "#b91c1c" },
            }
          }
        >
          {zipLoading ? "Preparing ZIP..." : "Download ZIP"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
