"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  color_light_gray,
  color_secondary,
  color_secondary_dark,
  color_text_light,
  color_text_primary,
  color_white,
} from "../../constants/colors";

// keep helpers inside module; tests will cover via rendering
const isPdfMime = (m?: string) => m === "application/pdf";
const isImageMime = (m?: string) => !!m && m.startsWith("image/");

function getFileNameFromUrl(url: string) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(last);
  } catch {
    const parts = url.split("?")[0].split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  }
}

function guessMimeFromFilename(name?: string) {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (n.endsWith(".doc")) return "application/msword";
  if (n.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (n.endsWith(".xls")) return "application/vnd.ms-excel";
  if (n.endsWith(".pptx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (n.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (n.endsWith(".txt")) return "text/plain";
  if (n.endsWith(".csv")) return "text/csv";
  if (n.endsWith(".json")) return "application/json";
  return "";
}

function normalizeUrl(raw: string) {
  const s = (raw || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("www.")) return `https://${s}`;
  return s;
}

export default function DocumentUrlViewerModal({
  open,
  url,
  title,
  onClose,
}: {
  open: boolean;
  url: string;
  title?: string;
  onClose: () => void;
}) {
  // ✅ Hooks must be called unconditionally (no early return above them)
  const safeUrl = useMemo(() => normalizeUrl(url), [url]);
  const hasUrl = !!safeUrl;

  const filename = useMemo(() => (safeUrl ? getFileNameFromUrl(safeUrl) : ""), [safeUrl]);
  const mime = useMemo(() => (safeUrl ? guessMimeFromFilename(filename) : ""), [safeUrl, filename]);

  // Zoom (images only)
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.25;

  const [zoom, setZoom] = useState(1);

  // optional: reset zoom every time the modal opens
  useEffect(() => {
    if (open) setZoom(1);
  }, [open]);

  const clamp = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
  const zoomIn = () => setZoom((z) => clamp(Number((z + ZOOM_STEP).toFixed(2))));
  const zoomOut = () => setZoom((z) => clamp(Number((z - ZOOM_STEP).toFixed(2))));
  const resetZoom = () => setZoom(1);

  const openInNewTab = () => {
    if (!hasUrl) return;
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  const download = () => {
    if (!hasUrl) return;
    const a = document.createElement("a");
    a.href = safeUrl;
    a.download = filename || "download";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ✅ Early return AFTER hooks
  if (!open) return null;

  const headerTitle = title || filename || "Document";
  const mimeLabel = mime || "unknown";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          background: color_white,
        },
      }}
    >
      {/* Top header */}
      <Box
        sx={{
          px: { xs: 1.25, sm: 2 },
          py: 1,
          background: color_white,
          borderBottom: `1px solid ${color_white}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 900,
              color: color_text_primary,
              fontSize: 16,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "70vw",
            }}
            title={headerTitle}
          >
            {headerTitle}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: color_text_light,
              fontWeight: 600,
              mt: 0.15,
            }}
          >
            {mimeLabel}
          </Typography>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            onClick={openInNewTab}
            disabled={!hasUrl}
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            sx={{
              fontWeight: 900,
              textTransform: "uppercase",
              borderWidth: 2,
              color: color_white,
              background: color_secondary,
              px: 2,
            }}
          >
            Open
          </Button>

          <Button
            onClick={download}
            disabled={!hasUrl}
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              fontWeight: 900,
              textTransform: "uppercase",
              px: 2,
              background: color_secondary,
            }}
          >
            Download
          </Button>

          <Button
            onClick={onClose}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{
              fontWeight: 900,
              textTransform: "uppercase",
              borderWidth: 2,
              color: color_text_primary,
              backgroundColor: color_white,
              px: 2,
            }}
          >
            Close
          </Button>
        </Box>
      </Box>

      {/* Tip strip */}
      <Box
        sx={{
          px: { xs: 1.25, sm: 2 },
          py: 1,
          background: color_text_primary,
          color: color_white,
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        If preview doesn’t load (some sites block embedding), use “Open”.
      </Box>

      <Divider />

      {/* Preview shell */}
      <Box
        sx={{
          p: { xs: 1.25, sm: 2 },
          height: "calc(100vh - 112px)",
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            height: "100%",
            borderRadius: 2,
            border: `1px solid ${color_white}`,
            background: color_white,
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(15, 30, 60, 0.10)",
          }}
        >
          {!hasUrl && (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                No document URL provided.
              </Typography>
              <Typography sx={{ color: color_text_light }}>
                Please close and try again.
              </Typography>
            </Box>
          )}

          {/* PDF */}
          {hasUrl && isPdfMime(mime) && (
            <iframe
              title="document-preview"
              src={safeUrl}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                background: color_white,
              }}
            />
          )}

          {/* Image */}
          {hasUrl && isImageMime(mime) && (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                background: color_light_gray,
                overflow: "auto",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
                <img
                  src={safeUrl}
                  alt={filename}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  right: 14,
                  bottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  background: color_white,
                  border: `1px solid ${color_white}`,
                  borderRadius: 999,
                  px: 1,
                  py: 0.6,
                  boxShadow: "0 10px 20px rgba(15, 30, 60, 0.12)",
                }}
              >
                <Tooltip title="Zoom out">
                  <span>
                    <IconButton
                      size="small"
                      onClick={zoomOut}
                      disabled={zoom <= ZOOM_MIN}
                      sx={{ color: color_text_primary }}
                    >
                      <ZoomOutIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Reset zoom">
                  <IconButton size="small" onClick={resetZoom} sx={{ color: color_text_primary }}>
                    <RestartAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Zoom in">
                  <span>
                    <IconButton
                      size="small"
                      onClick={zoomIn}
                      disabled={zoom >= ZOOM_MAX}
                      sx={{ color: color_text_primary }}
                    >
                      <ZoomInIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Typography sx={{ fontWeight: 900, color: color_text_primary, ml: 0.5, fontSize: 12 }}>
                  {Math.round(zoom * 100)}%
                </Typography>
              </Box>
            </Box>
          )}

          {/* Fallback */}
          {hasUrl && !isPdfMime(mime) && !isImageMime(mime) && (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                Preview not available for this file type.
              </Typography>
              <Typography sx={{ color: color_text_light, mb: 2 }}>
                Use “Open” or “Download”.
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={openInNewTab}
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  sx={{
                    fontWeight: 900,
                    borderWidth: 2,
                    color: color_white,
                    background: color_secondary,
                  }}
                >
                  Open
                </Button>
                <Button
                  onClick={download}
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  sx={{
                    fontWeight: 900,
                    background: color_secondary,
                    "&:hover": { background: color_secondary_dark },
                  }}
                >
                  Download
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
