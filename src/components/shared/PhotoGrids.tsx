"use client";

import React from "react";
import { Box, Button, Card, CardMedia, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

import {
  color_border,
  color_secondary,
  color_text_light,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_success,
  color_primary,
} from "../../constants/colors";

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
  cardWidth = 240,
  imageHeight = 140,
  containerSx,
  cardSx,

  statusLabel,
  statusChipSx,

  primaryBtnSx,
}: PhotoGridProps) {
  const labelOf = (st: "approved" | "rejected" | "pending") =>
    statusLabel ? statusLabel(st) : st === "approved" ? "Approved" : st === "rejected" ? "Rejected" : "Pending";

  const defaultPhotoChipSx = (st: "approved" | "rejected" | "pending") => {
    // photo screenshot looks neutral; keep pending grey.
    if (st === "approved") {
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
    if (st === "rejected") {
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

  const chipSx = (st: "approved" | "rejected" | "pending") =>
    statusChipSx ? statusChipSx(st) : defaultPhotoChipSx(st);

  return (
    <Box>
      <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 900, color: color_text_primary }}>
        {title}
      </Typography>

      {/* container like screenshot */}
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
            <Typography sx={{ fontWeight: 800, color: color_text_primary }}>Loading photos...</Typography>
          </Box>
        ) : photos.length === 0 ? (
          <Typography sx={{ color: color_text_secondary, fontWeight: 800 }}>{emptyText}</Typography>
        ) : (
          <Grid container spacing={1.75}>
            {photos.map((photo, idx) => {
              const st = normalizeStatus(photo.status);
              const url = getPhotoUrl(photo.id);
              const dlName = downloadFilename ? downloadFilename(photo) : `photo_${photo.id}.jpg`;
              const dlMime = downloadMime ? downloadMime(photo) : "image/jpeg";
              const comment = (photo.photo_comment || "").trim();

              return (
                <Grid key={photo.id}>
                  <Card
                    data-testid={`photo-card-${photo.id}`}
                    onClick={() => onOpenViewer(idx)}
                    sx={{
                      width: cardWidth,
                      borderRadius: 2,
                      overflow: "hidden",
                      cursor: "pointer",
                      backgroundColor: color_white,
                      border: `1px solid ${cardBorderColor}`, // blue border
                      boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                      "&:hover": { boxShadow: "0 12px 26px rgba(2,6,23,0.10)" },
                      ...cardSx,
                    }}
                  >
                    <CardMedia component="img" height={imageHeight} image={url} sx={{ objectFit: "cover" }} />

                    {/* Bottom row: Status + ID (like screenshot) */}
                    <Box sx={{ p: 1.2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                      <Chip
                        size="small"
                        label={labelOf(st)}
                        data-testid={`photo-status-${photo.id}`}
                        sx={chipSx(st)}
                      />
                      <Typography sx={{ fontSize: "0.86rem", fontWeight: 900, color: color_text_light }}>
                        ID: {photo.id}
                      </Typography>
                    </Box>

                    {comment && (
                      <Box
                        sx={{
                          mx: 1.2,
                          mb: 1.2,
                          mt: 0.2,
                          p: 1,
                          borderRadius: 2,
                          border: `1px solid ${color_border}`,
                          backgroundColor: "rgba(2, 6, 23, 0.03)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            fontWeight: 900,
                            color: color_text_light,
                            mb: 0.35,
                            letterSpacing: "0.02em",
                          }}
                        >
                          Comment
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: "0.98rem",
                            fontWeight: 800,
                            color: color_text_primary,
                            lineHeight: 1.45,
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {comment}
                        </Typography>
                      </Box>
                    )}


                    {(showDownload || !!onDownloadSingle) && (
                      <Box sx={{ px: 1.2, pb: 1.2 }}>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon fontSize="small" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadSingle?.(photo.id, dlName, dlMime);
                          }}
                          sx={primaryBtnSx}
                        >
                          Download
                        </Button>
                      </Box>
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
