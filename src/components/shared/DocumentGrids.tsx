"use client";

import React from "react";
import { Box, Button, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

import {
  color_border,
  color_secondary,
  color_text_light,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_warning,
  color_success,
  color_primary,
} from "../../constants/colors";

import { DocumentGridProps, categoryLabel, formatBytes, normalizeStatus } from "./types";

export function DocumentGrid({
  title = "Uploaded Documents",
  loading = false,
  emptyText = "No documents submitted.",
  documents,
  onOpenViewer,

  showCategoryChip = true,
  showSizeChip = true,

  showViewButton = true,
  viewLabel = "View",
  viewBtnSx,

  showDownload = false,
  onDownloadSingle,
  resolveFilename,
  resolveMime,

  showApproveReject = false,
  onApprove,
  onReject,
  approveBtnSx,
  rejectBtnSx,

  cardBorderColor = color_secondary,
  cardWidth = 360,
  containerSx,
  cardSx,

  statusLabel,
  statusChipSx,

  primaryBtnSx,
}: DocumentGridProps) {
  const labelOf = (st: "approved" | "rejected" | "pending") =>
    statusLabel ? statusLabel(st) : st.toUpperCase();

  const defaultDocStatusChipSx = (st: "approved" | "rejected" | "pending") => {
    // screenshot: PENDING is orange-ish pill
    if (st === "approved") {
      return {
        height: 30,
        fontSize: "0.85rem",
        fontWeight: 900,
        borderRadius: "999px",
        color: color_success,
        backgroundColor: "rgba(39, 174, 96, 0.12)",
        border: "1px solid rgba(39, 174, 96, 0.25)",
      };
    }
    if (st === "rejected") {
      return {
        height: 30,
        fontSize: "0.85rem",
        fontWeight: 900,
        borderRadius: "999px",
        color: color_primary,
        backgroundColor: "rgba(166, 29, 51, 0.10)",
        border: "1px solid rgba(166, 29, 51, 0.22)",
      };
    }
    return {
      height: 30,
      fontSize: "0.85rem",
      fontWeight: 900,
      borderRadius: "999px",
      color: color_text_primary,
      backgroundColor: "rgba(243, 156, 18, 0.14)",
      border: `1px solid rgba(243, 156, 18, 0.25)`,
    };
  };

  const chipSx = (st: "approved" | "rejected" | "pending") =>
    statusChipSx ? statusChipSx(st) : defaultDocStatusChipSx(st);

  const defaultViewBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    backgroundColor: color_white,
    color: color_text_secondary,
    border: `1px solid ${color_border}`,
    borderRadius: 1,
    px: 2.25,
    "&:hover": { backgroundColor: "rgba(2,6,23,0.03)" },
  };

  const softChipSx = {
    height: 30,
    fontSize: "0.85rem",
    fontWeight: 900,
    borderRadius: "999px",
    color: color_text_primary,
    backgroundColor: "rgba(148, 163, 184, 0.18)",
    border: `1px solid ${color_border}`,
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 900, color: color_text_primary }}>
        {title}
      </Typography>

      {/* container */}
      <Box
        sx={{
          backgroundColor: color_white,
          border: `1px solid ${color_border}`,
          borderRadius: 2,
          p: 2,
          ...containerSx,
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={18} />
            <Typography sx={{ fontWeight: 800, color: color_text_primary }}>Loading documents...</Typography>
          </Box>
        ) : documents.length === 0 ? (
          <Typography sx={{ color: color_text_secondary, fontWeight: 800 }}>{emptyText}</Typography>
        ) : (
          <Grid container spacing={1.75}>
            {documents.map((doc, idx) => {
              const st = normalizeStatus(doc.status);

              const filename =
                resolveFilename?.(doc) ||
                doc.filename ||
                doc.file_name ||
                `document_${doc.id}`;

              const mime =
                resolveMime?.(doc) ||
                doc.mime_type ||
                "";

              return (
                <Grid key={doc.id}>
                  <Box
                    data-testid={`doc-card-${doc.id}`}
                    onClick={() => onOpenViewer(idx)}
                    sx={{
                      width: cardWidth,
                      maxWidth: "85vw",
                      borderRadius: 2,
                      p: 2,
                      backgroundColor: color_white,
                      border: `1px solid ${cardBorderColor}`, // blue border
                      boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                      cursor: "pointer",
                      "&:hover": { boxShadow: "0 12px 26px rgba(2,6,23,0.10)" },
                      ...cardSx,
                    }}
                  >
                    {/* Top chips */}
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                      {showCategoryChip && (
                        <Chip size="small" label={categoryLabel(doc.document_category)} sx={softChipSx} />
                      )}

                      {showSizeChip && (
                        <Chip size="small" label={formatBytes(doc.size_bytes)} sx={softChipSx} />
                      )}

                      <Chip
                        size="small"
                        label={labelOf(st)}
                        data-testid={`doc-status-${doc.id}`}
                        sx={chipSx(st)}
                      />
                    </Box>

                    <Typography sx={{ mt: 1.2, fontWeight: 900, color: color_text_light }}>
                      ID: {doc.id}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.75,
                        fontWeight: 900,
                        fontSize: "1.55rem",
                        color: color_text_primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={filename}
                    >
                      {filename}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, mt: 1.4, flexWrap: "wrap" }}>
                      {showViewButton && (
                        <Button
                          data-testid={`doc-view-${doc.id}`}
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenViewer(idx);
                          }}
                          sx={viewBtnSx || defaultViewBtnSx}
                        >
                          {viewLabel}
                        </Button>
                      )}

                      {(showDownload || !!onDownloadSingle) && (
                        <Button
                          size="small"
                          startIcon={<DownloadIcon fontSize="small" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadSingle?.(doc.id, filename, mime);
                          }}
                          sx={primaryBtnSx}
                        >
                          Download
                        </Button>
                      )}

                      {showApproveReject && (
                        <>
                          <Button
                            data-testid={`doc-approve-${doc.id}`}
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApprove?.(doc.id);
                            }}
                            sx={approveBtnSx}
                          >
                            Approve
                          </Button>

                          <Button
                            data-testid={`doc-reject-${doc.id}`}
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReject?.(doc.id);
                            }}
                            sx={rejectBtnSx}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
