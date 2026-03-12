"use client";

import React from "react";
import { Box, Button, Chip, CircularProgress, TextField, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

import {
  color_border,
  color_secondary,
  color_secondary_dark,
  color_text_light,
  color_text_primary,
  color_text_secondary,
  color_white,
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

  showReviewerCommentField = false,
  reviewerCommentLabel = "Review Comment",
  onReviewerCommentChange,

  cardBorderColor = color_secondary,
  containerSx,
  cardSx,

  statusLabel,
  statusChipSx,

  primaryBtnSx,
  showStatusChip = true,
}: DocumentGridProps) {
  const labelOf = (st: "approved" | "rejected" | "pending") =>
    statusLabel ? statusLabel(st) : st.toUpperCase();

  const defaultDocStatusChipSx = (st: "approved" | "rejected" | "pending") => {
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
    borderRadius: "10px",
    px: 1,
    py: 0.7,
    fontSize: "0.82rem",
    whiteSpace: "nowrap",
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

  const defaultApproveBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    background: color_secondary,
    color: color_white,
    "&:hover": { background: color_secondary_dark },
  };

  const defaultRejectBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    background: color_primary,
    color: color_white,
    "&:hover": { background: color_primary },
  };

  const defaultPrimaryBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    background: color_secondary,
    color: color_white,
    "&:hover": { background: color_secondary_dark },
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 900, color: color_text_primary }}>
        {title}
      </Typography>

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
            <Typography sx={{ fontWeight: 800, color: color_text_primary }}>
              Loading documents...
            </Typography>
          </Box>
        ) : documents.length === 0 ? (
          <Typography sx={{ color: color_text_secondary, fontWeight: 800 }}>
            {emptyText}
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(1, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
                xl: "repeat(5, minmax(0, 1fr))",
              },
              gap: 1.75,
              alignItems: "stretch",
            }}
          >
            {documents.map((doc, idx) => {
              const st = normalizeStatus(doc.status);

              const filename =
                resolveFilename?.(doc) ||
                doc.filename ||
                doc.file_name ||
                `document_${doc.id}`;

              const mime = resolveMime?.(doc) || doc.mime_type || "";
              const reviewerComment = String((doc as any).reviewer_comment || "");

              const hasActions = showViewButton || showDownload || !!onDownloadSingle || showApproveReject;

              return (
                <Box
                  key={doc.id}
                  data-testid={`doc-card-${doc.id}`}
                  onClick={() => onOpenViewer(idx)}
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    minHeight: "100%",
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: color_white,
                    border: `1px solid ${cardBorderColor}`,
                    boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": { boxShadow: "0 12px 26px rgba(2,6,23,0.10)" },
                    ...cardSx,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                    {showCategoryChip && (
                      <Chip
                        size="small"
                        label={categoryLabel(doc.document_category)}
                        sx={softChipSx}
                      />
                    )}

                    {showSizeChip && (
                      <Chip size="small" label={formatBytes(doc.size_bytes)} sx={softChipSx} />
                    )}

                    {showStatusChip && (
                      <Chip
                        size="small"
                        label={labelOf(st)}
                        data-testid={`doc-status-${doc.id}`}
                        sx={chipSx(st)}
                      />
                    )}
                  </Box>

                  <Typography sx={{ mt: 1.2, fontWeight: 900, color: color_text_light }}>
                    ID: {doc.id}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.75,
                      fontWeight: 900,
                      fontSize: "1.25rem",
                      color: color_text_primary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={filename}
                  >
                    {filename}
                  </Typography>

                  {showReviewerCommentField && (
                    <Box sx={{ mt: 1.2 }} onClick={(e) => e.stopPropagation()}>
                      <TextField
                        fullWidth
                        size="small"
                        label={reviewerCommentLabel}
                        value={reviewerComment}
                        onChange={(e) => onReviewerCommentChange?.(doc.id, e.target.value)}
                        multiline
                        minRows={2}
                      />
                    </Box>
                  )}

                  {hasActions && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 1,
                        mt: 1.4,
                        alignItems: "stretch",
                      }}
                    >
                      {showViewButton && (
                        <Button
                          data-testid={`doc-view-${doc.id}`}
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenViewer(idx);
                          }}
                          sx={{
                            ...(viewBtnSx || defaultViewBtnSx),
                            minWidth: 0,
                            px: 1.25,
                            py: 0.8,
                            fontSize: "0.88rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {viewLabel}
                        </Button>
                      )}

                      {(showDownload || !!onDownloadSingle) && (
                        <Button
                          size="small"
                          fullWidth
                          startIcon={<DownloadIcon fontSize="small" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadSingle?.(doc.id, filename, mime);
                          }}
                          sx={{
                            ...(primaryBtnSx || defaultPrimaryBtnSx),
                            minWidth: 0,
                            px: 1.25,
                            py: 0.8,
                            fontSize: "0.88rem",
                            whiteSpace: "nowrap",
                            "& .MuiButton-startIcon": {
                              mr: 0.6,
                              ml: 0,
                            },
                          }}
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
                            sx={{
                              ...(approveBtnSx || defaultApproveBtnSx),
                              minWidth: 0,
                              px: 1.25,
                              py: 0.8,
                              fontSize: "0.88rem",
                              whiteSpace: "nowrap",
                            }}
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
                            sx={{
                              ...(rejectBtnSx || defaultRejectBtnSx),
                              minWidth: 0,
                              px: 1.25,
                              py: 0.8,
                              fontSize: "0.88rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}