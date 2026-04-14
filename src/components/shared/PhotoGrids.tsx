"use client";

import React from "react";
import {
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
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
import {
  REVIEW_STATUS_VALUES,
  getReviewStatusLabel,
  type ReviewStatusValue,
} from "../../constants/statuses";

import { PhotoGridProps, normalizeStatus } from "./types";

export function PhotoGrid({
  title = "Uploaded Photos",
  loading = false,
  emptyText = "No photos submitted.",
  photos,
  getPhotoUrl,
  onOpenViewer,

  showDownload = false,
  onDownloadSingle,
  downloadFilename,
  downloadMime,

  cardBorderColor = color_secondary,
  imageHeight = 140,
  containerSx,
  cardSx,

  statusLabel,
  statusChipSx,

  primaryBtnSx,
  showStatusChip = true,

  showApproveReject = false,
  onApprove,
  onReject,
  approveBtnSx,
  rejectBtnSx,

  showReviewerCommentField = false,
  reviewerCommentLabel = "Review Comment",
  onReviewerCommentChange,
  showUploaderCommentField = false,
  uploaderCommentLabel = "Uploader Comment",
  onUploaderCommentChange,
  disableReviewerCommentField = false,
  viewReviewerComment = false,
}: PhotoGridProps) {
  const labelOf = (st: ReviewStatusValue) =>
    statusLabel ? statusLabel(st) : getReviewStatusLabel(st);

  const defaultPhotoChipSx = (st: ReviewStatusValue) => {
    if (st === REVIEW_STATUS_VALUES.APPROVED) {
      return {
        height: 26,
        fontSize: "0.78rem",
        fontWeight: 900,
        borderRadius: "999px",
        color: color_success,
        backgroundColor: "rgba(39, 174, 96, 0.12)",
        border: "1px solid rgba(39, 174, 96, 0.25)",
      };
    }
    if (st === REVIEW_STATUS_VALUES.REJECTED) {
      return {
        height: 26,
        fontSize: "0.78rem",
        fontWeight: 900,
        borderRadius: "999px",
        color: color_primary,
        backgroundColor: "rgba(166, 29, 51, 0.10)",
        border: "1px solid rgba(166, 29, 51, 0.22)",
      };
    }
    return {
      height: 26,
      fontSize: "0.78rem",
      fontWeight: 900,
      borderRadius: "999px",
      color: color_text_secondary,
      backgroundColor: "rgba(148, 163, 184, 0.18)",
      border: `1px solid ${color_border}`,
    };
  };

  const chipSx = (st: ReviewStatusValue) =>
    statusChipSx ? statusChipSx(st) : defaultPhotoChipSx(st);

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

  const renderCommentCard = (label: string, value: string, emptyTextValue: string) => {
    const trimmed = String(value || "").trim();
    const hasValue = trimmed.length > 0;
    const isLong = trimmed.length > 100;
    const displayValue = hasValue
      ? isLong
        ? `${trimmed.slice(0, 97).trimEnd()}...`
        : trimmed
      : emptyTextValue;

    return (
      <Tooltip
        title={isLong ? trimmed : ""}
        arrow
        placement="top-start"
        disableHoverListener={!isLong}
        disableFocusListener={!isLong}
        disableTouchListener={!isLong}
      >
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            border: `1px solid ${color_border}`,
            backgroundColor: "rgba(2, 6, 23, 0.03)",
            minHeight: 92,
            maxHeight: 92,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 900,
              color: color_text_light,
              mb: 0.35,
              letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              fontSize: "0.98rem",
              fontWeight: 800,
              color: hasValue ? color_text_primary : color_text_secondary,
              lineHeight: 1.45,
              wordBreak: "break-word",
              whiteSpace: "normal",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {displayValue}
          </Typography>
        </Box>
      </Tooltip>
    );
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
              Loading photos...
            </Typography>
          </Box>
        ) : photos.length === 0 ? (
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
            {photos.map((photo, idx) => {
              const st = normalizeStatus(photo.status);
              const url = getPhotoUrl(photo.id);
              const dlName = downloadFilename ? downloadFilename(photo) : `photo_${photo.id}.jpg`;
              const dlMime = downloadMime ? downloadMime(photo) : "image/jpeg";

              const uploaderComment = String(photo.photo_comment || "");
              const reviewerComment = String((photo as any).reviewer_comment || "");

              return (
                <Card
                  key={photo.id}
                  data-testid={`photo-card-${photo.id}`}
                  onClick={() => onOpenViewer(idx)}
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    backgroundColor: color_white,
                    border: `1px solid ${cardBorderColor}`,
                    boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    "&:hover": { boxShadow: "0 12px 26px rgba(2,6,23,0.10)" },
                    ...cardSx,
                  }}
                >
                  <CardMedia
                    component="img"
                    height={imageHeight}
                    image={url}
                    sx={{ objectFit: "cover", flexShrink: 0 }}
                  />

                  <Box
                    sx={{
                      p: 1.2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.1,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                        minHeight: 28,
                      }}
                    >
                      {showStatusChip ? (
                        <Chip
                          size="small"
                          label={labelOf(st)}
                          data-testid={`photo-status-${photo.id}`}
                          sx={chipSx(st)}
                        />
                      ) : (
                        <Box />
                      )}

                      <Typography
                        sx={{
                          fontSize: "0.86rem",
                          fontWeight: 900,
                          color: color_text_light,
                        }}
                      >
                        ID: {photo.id}
                      </Typography>
                    </Box>

                    {showUploaderCommentField ? (
                      <Box onClick={(e) => e.stopPropagation()}>
                        <TextField
                          fullWidth
                          size="small"
                          label={uploaderCommentLabel}
                          value={uploaderComment}
                          onChange={(e) => onUploaderCommentChange?.(photo.id, e.target.value)}
                          multiline
                          minRows={2}
                        />
                      </Box>
                    ) : (
                      renderCommentCard("Uploader Comment", uploaderComment, "No uploader comment")
                    )}

                    {showReviewerCommentField && !disableReviewerCommentField && (
                      <Box onClick={(e) => e.stopPropagation()}>
                        <TextField
                          fullWidth
                          size="small"
                          label={reviewerCommentLabel}
                          value={reviewerComment}
                          onChange={(e) => onReviewerCommentChange?.(photo.id, e.target.value)}
                          multiline
                          minRows={2}
                        />
                      </Box>
                    )}

                    {(viewReviewerComment || (showReviewerCommentField && disableReviewerCommentField)) &&
                      renderCommentCard(reviewerCommentLabel, reviewerComment, "No review comment")}

                    {(showApproveReject || showDownload || !!onDownloadSingle) && (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: 1,
                          mt: "auto",
                          alignItems: "stretch",
                        }}
                      >
                        {showApproveReject && (
                          <>
                            <Button
                              size="small"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                onApprove?.(photo.id);
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
                              size="small"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                onReject?.(photo.id);
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

                        {(showDownload || !!onDownloadSingle) && (
                          <Button
                            size="small"
                            fullWidth
                            startIcon={<DownloadIcon fontSize="small" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownloadSingle?.(photo.id, dlName, dlMime);
                            }}
                            sx={{
                              ...(primaryBtnSx || defaultPrimaryBtnSx),
                              gridColumn: "1 / -1",
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
                      </Box>
                    )}
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
