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
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
  CircularProgress,
} from "@mui/material";

import FolderZipIcon from "@mui/icons-material/FolderZip";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

import useFetch from "../../hooks/useFetch";

// ✅ ONLY use colors from your constants file (adjust import path)
import {
  color_primary,
  color_secondary,
  color_primary_dark,
  color_secondary_dark,
  color_border,
  color_white,
  color_light_gray,
  color_white_smoke,
  color_text_primary,
  color_text_secondary,
  color_text_light,
  color_warning_light,
  color_black_light,
} from "../../constants/colors";

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
      `Media: ${mediaType === "all" ? "all" : mediaType}`,
      `Group by user: ${groupByUser ? "Yes" : "No"}`,
      `Group by type: ${groupByType ? "Yes" : "No"}`,
      `Only approved: ${onlyApproved ? "Yes" : "No"}`,
      useRequest ? `Request: ${requestId}` : `Filters: ${filterCount}`,
    ];
  }, [
    mediaType,
    groupByUser,
    groupByType,
    onlyApproved,
    useRequest,
    requestId,
    filterCount,
  ]);

  const closeSafe = () => {
    if (zipLoading) return;
    setLocalErr("");
    onClose();
  };

  const handleDownload = async () => {
    setLocalErr("");

    // ✅ As requested: "download all first" -> use clauses (requestId later)
    const body: any = {
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

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <Typography
      sx={{
        fontWeight: 900,
        fontSize: 12,
        color: color_text_secondary,
        textTransform: "none",
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );

  const ToggleRow = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 0.6,
      }}
    >
      <Typography sx={{ fontWeight: 800, color: color_text_primary, fontSize: 13 }}>
        {label}
      </Typography>

      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={zipLoading}
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": { color: color_secondary },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: color_secondary,
          },
          "& .MuiSwitch-track": {
            backgroundColor: color_border,
            opacity: 1,
          },
        }}
      />
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={closeSafe}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "14px",
          overflow: "hidden",
          border: `1px solid ${color_border}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
          background: color_white,
        },
      }}
    >
      {/* Header like screenshot: left icon+title, right CLOSE pill */}
      <DialogTitle
        sx={{
          py: 1.15,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          background: color_white,
          borderBottom: `1px solid ${color_border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FolderZipIcon sx={{ color: color_text_secondary }} />
          <Typography sx={{ fontWeight: 900, color: color_black_light, fontSize: 14 }}>
            Download Photos & Documents
          </Typography>
        </Box>

        <Button
          onClick={closeSafe}
          disabled={zipLoading}
          startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontWeight: 900,
            fontSize: 12,
            borderRadius: "8px",
            px: 1.2,
            py: 0.65,
            color: color_text_secondary,
            background: color_white,
            border: `1px solid ${color_border}`,
            "&:hover": { background: color_white_smoke },
          }}
        >
          Close
        </Button>
      </DialogTitle>

      <DialogContent sx={{ background: color_white, p: 1.75 }}>
        {/* Options block */}
        <SectionTitle>Options</SectionTitle>

        <Box
          sx={{
            border: `1px solid ${color_border}`,
            borderRadius: "10px",
            p: 1.25,
            background: color_white,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 900, color: color_text_secondary, mb: 0.5 }}>
            Download
          </Typography>

          <FormControl size="small" fullWidth>
            <InputLabel>All (photos + documents)</InputLabel>
            <Select
              label="All (photos + documents)"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as MediaType)}
              disabled={zipLoading}
              sx={{
                background: color_white,
                borderRadius: "8px",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: color_border },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: color_secondary },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: color_secondary },
              }}
            >
              <MenuItem value="all">All (photos + documents)</MenuItem>
              <MenuItem value="photos">Photos only</MenuItem>
              <MenuItem value="document">Documents only</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 1.25, borderColor: color_border }} />

          {/* Toggle rows (label left, switch right) */}
          <ToggleRow
            label="Group by User"
            checked={groupByUser}
            onChange={setGroupByUser}
          />
          <ToggleRow
            label="Group by Document Type"
            checked={groupByType}
            onChange={setGroupByType}
          />
          <ToggleRow
            label="Only Approved"
            checked={onlyApproved}
            onChange={setOnlyApproved}
          />
        </Box>

        {/* Summary */}
        <Box sx={{ mt: 1.75 }}>
          <SectionTitle>Summary</SectionTitle>

          <Box
            sx={{
              border: `1px solid ${color_border}`,
              borderRadius: "10px",
              p: 1.25,
              background: color_white,
            }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {summary.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    background: color_light_gray,
                    border: `1px solid ${color_border}`,
                    color: color_text_secondary,
                  }}
                />
              ))}
            </Box>

            {!useRequest && filterCount === 0 && (
              <Box
                sx={{
                  mt: 1.25,
                  p: 1.1,
                  borderRadius: "10px",
                  border: `1px solid ${color_border}`,
                  background: color_warning_light,
                  color: color_text_primary,
                  fontWeight: 800,
                  fontSize: 12.5,
                  textAlign: "center",
                }}
              >
                No filters selected. This will download media for all matching requests.
              </Box>
            )}

            {localErr && (
              <Box
                sx={{
                  mt: 1.25,
                  p: 1.1,
                  borderRadius: "10px",
                  border: `1px solid ${color_border}`,
                  background: color_white_smoke,
                  color: color_text_primary,
                  fontWeight: 800,
                  fontSize: 12.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {localErr}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Footer like screenshot: Cancel (white) + Download (blue) */}
      <DialogActions
        sx={{
          px: 1.5,
          py: 1.25,
          background: color_white_smoke,
          borderTop: `1px solid ${color_border}`,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.25,
        }}
      >
        <Button
          onClick={closeSafe}
          disabled={zipLoading}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 2.2,
            background: color_white,
            border: `1px solid ${color_border}`,
            color: color_text_primary,
            "&:hover": { background: color_white_smoke },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={
            zipLoading ? (
              <CircularProgress size={18} sx={{ color: color_white }} />
            ) : (
              <DownloadIcon />
            )
          }
          onClick={handleDownload}
          disabled={zipLoading}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 2.2,
            background: color_secondary,
            color: color_white,
            "&:hover": { background: color_secondary_dark },
            ...(dangerBtnSx || {}), // keep compatibility if you still pass sx from parent
          }}
        >
          {zipLoading ? "Preparing ZIP..." : "Download ZIP"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
