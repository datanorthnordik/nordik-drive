"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

import {
  color_primary,
  color_primary_dark,
  color_secondary,
  color_secondary_dark,
  color_white,
  color_white_smoke,
  color_border,
  color_text_primary,
  color_text_secondary,
  color_text_light,
  color_success,
  color_error,
} from "../../../constants/colors";

export type ViewerStatus = "approved" | "rejected" | "pending" | null | undefined;

export interface FormViewerPhoto {
  id: number;
  file_name?: string;
  mime_type?: string;

  // uploader comment
  file_comment?: string;

  // admin review comment
  reviewer_comment?: string;

  status?: ViewerStatus;
  [key: string]: any;
}

export interface FormPhotoViewerModalProps {
  open: boolean;
  onClose: () => void;

  photos: FormViewerPhoto[];
  startIndex?: number;
  title?: string;

  getPhotoUrl: (photo: FormViewerPhoto) => string;
  onDownload?: (photo: FormViewerPhoto) => void;

  onApprove?: (photo: FormViewerPhoto) => void;
  onReject?: (photo: FormViewerPhoto) => void;
  onReviewerCommentChange?: (photo: FormViewerPhoto, value: string) => void;

  showDownloadButton?: boolean;
  showApproveReject?: boolean;
  showCommentsPanel?: boolean;
  showStatusPill?: boolean;
  showThumbnails?: boolean;
  showReviewerCommentField?: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const labelFromStatus = (st?: ViewerStatus) => {
  if (st === "approved") return "Approved";
  if (st === "rejected") return "Rejected";
  return "Pending";
};

const chipSx = (st?: ViewerStatus) => {
  if (st === "approved") {
    return {
      color: color_success,
      backgroundColor: "rgba(39, 174, 96, 0.12)",
      border: "1px solid rgba(39, 174, 96, 0.25)",
      fontWeight: 900,
    };
  }

  if (st === "rejected") {
    return {
      color: color_error,
      backgroundColor: "rgba(231, 76, 60, 0.12)",
      border: "1px solid rgba(231, 76, 60, 0.25)",
      fontWeight: 900,
    };
  }

  return {
    color: color_text_secondary,
    backgroundColor: "rgba(107, 114, 128, 0.12)",
    border: "1px solid rgba(107, 114, 128, 0.25)",
    fontWeight: 900,
  };
};

export default function FormPhotoViewerModal({
  open,
  onClose,
  photos,
  startIndex = 0,
  title = "Photo Viewer",
  getPhotoUrl,
  onDownload,
  onApprove,
  onReject,
  onReviewerCommentChange,
  showDownloadButton = true,
  showApproveReject = false,
  showCommentsPanel = true,
  showStatusPill = false,
  showThumbnails = true,
  showReviewerCommentField = false,
}: FormPhotoViewerModalProps) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const galleryRef = useRef<any>(null);

  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.25;

  const safeStartIndex = useMemo(() => {
    if (!photos.length) return 0;
    return clamp(startIndex, 0, photos.length - 1);
  }, [photos.length, startIndex]);

  const [currentIndex, setCurrentIndex] = useState<number>(safeStartIndex);
  const [zoom, setZoom] = useState<number>(1);
  const [isCommentFocused, setIsCommentFocused] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(safeStartIndex);
    setZoom(1);
    setIsCommentFocused(false);
    setTimeout(() => galleryRef.current?.slideToIndex?.(safeStartIndex), 0);
  }, [open, safeStartIndex]);

  const currentPhoto = photos[currentIndex];

  const uploaderCommentText = useMemo(
    () => (currentPhoto?.file_comment || "").trim(),
    [currentPhoto?.file_comment]
  );

  const reviewerCommentText = useMemo(
    () => currentPhoto?.reviewer_comment || "",
    [currentPhoto?.reviewer_comment]
  );

  const galleryItems = useMemo(
    () =>
      photos.map((photo) => {
        const url = getPhotoUrl(photo);
        return {
          original: url,
          thumbnail: url,
          originalClass: "gallery-image",
        };
      }),
    [photos, getPhotoUrl]
  );

  const zoomIn = () =>
    setZoom((z) => clamp(Number((z + ZOOM_STEP).toFixed(2)), ZOOM_MIN, ZOOM_MAX));

  const zoomOut = () =>
    setZoom((z) => clamp(Number((z - ZOOM_STEP).toFixed(2)), ZOOM_MIN, ZOOM_MAX));

  const resetZoom = () => setZoom(1);

  const handlePrev = () => {
    if (!photos.length) return;
    const next = Math.max(currentIndex - 1, 0);
    setCurrentIndex(next);
    galleryRef.current?.slideToIndex?.(next);
  };

  const handleNext = () => {
    if (!photos.length) return;
    const next = Math.min(currentIndex + 1, photos.length - 1);
    setCurrentIndex(next);
    galleryRef.current?.slideToIndex?.(next);
  };

  const stopGalleryKeyCapture = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    (e.nativeEvent as any).stopImmediatePropagation?.();
  };

  const toolIconBtnSx = {
    width: 44,
    height: 44,
    border: `1px solid ${color_border}`,
    background: color_white,
    "&:hover": { background: color_white_smoke },
  } as const;

  const actionBtnSx = {
    fontWeight: 900,
    textTransform: "uppercase",
    px: isSmDown ? 1.6 : 2.2,
    borderRadius: 999,
    background: color_secondary,
    color: color_white,
    "&:hover": { background: color_secondary_dark },
  } as const;

  const rejectBtnSx = {
    fontWeight: 900,
    textTransform: "uppercase",
    px: isSmDown ? 1.6 : 2.2,
    borderRadius: 999,
    background: color_primary,
    color: color_white,
    "&:hover": { background: color_primary_dark },
  } as const;

  const renderZoomableItem = useCallback(
    (item: any) => (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#000",
          position: "relative",
        }}
      >
        {showStatusPill && currentPhoto && (
          <Chip
            size="small"
            label={labelFromStatus(currentPhoto.status)}
            sx={{
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 5,
              ...chipSx(currentPhoto.status),
            }}
          />
        )}

        <Box sx={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
          <img
            src={item.original}
            alt={currentPhoto?.file_name || "photo"}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: showThumbnails ? "72vh" : "82vh",
              objectFit: "contain",
            }}
          />
        </Box>
      </Box>
    ),
    [currentPhoto, showStatusPill, showThumbnails, zoom]
  );

  const sidePanel = currentPhoto && (showCommentsPanel || showReviewerCommentField);

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle
        sx={{
          py: 0.9,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: color_white,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 16, color: color_text_primary }}>
            {title}
          </Typography>
          <Typography sx={{ color: color_text_light, fontWeight: 700, fontSize: 12 }}>
            {photos.length ? `${currentIndex + 1} / ${photos.length}` : "No photos"}
          </Typography>
        </Box>

        <IconButton onClick={onClose} sx={{ border: `1px solid ${color_border}` }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          background: "#000",
          p: 0,
          display: "flex",
          justifyContent: "stretch",
          alignItems: "stretch",
        }}
      >
        {!photos.length ? (
          <Box sx={{ mt: 4, color: "#fff", px: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>No photos found.</Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", height: "100%", display: "flex", minHeight: 0 }}>
            <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
              <ImageGallery
                ref={galleryRef}
                items={galleryItems}
                startIndex={safeStartIndex}
                showPlayButton={false}
                showFullscreenButton={false}
                showThumbnails={showThumbnails}
                thumbnailPosition="bottom"
                disableKeyDown={isCommentFocused}
                onSlide={(idx) => {
                  setCurrentIndex(idx);
                  setZoom(1);
                  setIsCommentFocused(false);
                }}
                renderItem={renderZoomableItem}
              />

              <Box
                sx={{
                  position: "fixed",
                  bottom: 18,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1400,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  background: color_white,
                  border: `1px solid ${color_border}`,
                  borderRadius: 999,
                  px: 1.25,
                  py: 1,
                  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                  maxWidth: "calc(100vw - 24px)",
                  overflowX: "auto",
                }}
              >
                <Tooltip title="Previous">
                  <span>
                    <IconButton onClick={handlePrev} disabled={currentIndex === 0} sx={toolIconBtnSx}>
                      <NavigateBeforeIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Zoom out">
                  <span>
                    <IconButton onClick={zoomOut} disabled={zoom <= ZOOM_MIN} sx={toolIconBtnSx}>
                      <ZoomOutIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Reset zoom">
                  <IconButton onClick={resetZoom} sx={toolIconBtnSx}>
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Zoom in">
                  <span>
                    <IconButton onClick={zoomIn} disabled={zoom >= ZOOM_MAX} sx={toolIconBtnSx}>
                      <ZoomInIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Box sx={{ px: 0.5, fontWeight: 900, color: color_text_secondary }}>
                  {Math.round(zoom * 100)}%
                </Box>

                {showApproveReject && currentPhoto && (
                  <>
                    <Button
                      variant="contained"
                      sx={actionBtnSx}
                      disabled={!onApprove}
                      onClick={() => onApprove?.(currentPhoto)}
                    >
                      Approve
                    </Button>

                    <Button
                      variant="contained"
                      sx={rejectBtnSx}
                      disabled={!onReject}
                      onClick={() => onReject?.(currentPhoto)}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {showDownloadButton && currentPhoto && (
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={actionBtnSx}
                    disabled={!onDownload}
                    onClick={() => onDownload?.(currentPhoto)}
                  >
                    Download
                  </Button>
                )}

                <Tooltip title="Next">
                  <span>
                    <IconButton
                      onClick={handleNext}
                      disabled={currentIndex === photos.length - 1}
                      sx={toolIconBtnSx}
                    >
                      <NavigateNextIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            {!isSmDown && sidePanel && (
              <Box
                onClick={(e) => e.stopPropagation()}
                onKeyDownCapture={stopGalleryKeyCapture}
                onKeyUpCapture={stopGalleryKeyCapture}
                sx={{
                  width: 360,
                  background: color_white,
                  borderLeft: `1px solid ${color_border}`,
                  p: 2,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
                  Comments
                </Typography>

                <Divider />

                {showCommentsPanel && (
                  <>
                    <Typography sx={{ fontWeight: 800, color: color_text_primary }}>
                      Uploader Comment
                    </Typography>
                    <Typography
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: uploaderCommentText ? color_text_secondary : color_text_light,
                        fontWeight: 650,
                        lineHeight: 1.5,
                      }}
                    >
                      {uploaderCommentText || "No comments"}
                    </Typography>
                  </>
                )}

                {showReviewerCommentField && currentPhoto && (
                  <>
                    <Divider />
                    <Typography sx={{ fontWeight: 800, color: color_text_primary }}>
                      Review
                    </Typography>

                    <Chip
                      size="small"
                      label={labelFromStatus(currentPhoto.status)}
                      sx={{ alignSelf: "flex-start", ...chipSx(currentPhoto.status) }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Review Comment"
                      value={reviewerCommentText}
                      onChange={(e) => onReviewerCommentChange?.(currentPhoto, e.target.value)}
                      onFocus={() => setIsCommentFocused(true)}
                      onBlur={() => setIsCommentFocused(false)}
                      onKeyDownCapture={stopGalleryKeyCapture}
                      onKeyUpCapture={stopGalleryKeyCapture}
                      multiline
                      minRows={4}
                    />
                  </>
                )}
              </Box>
            )}

            {isSmDown && sidePanel && (
              <Box
                onClick={(e) => e.stopPropagation()}
                onKeyDownCapture={stopGalleryKeyCapture}
                onKeyUpCapture={stopGalleryKeyCapture}
                sx={{
                  width: { xs: "100%", md: 340 },
                  flexShrink: 0,
                  borderRadius: 2,
                  border: `1px solid ${color_border}`,
                  background: color_white,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  overflowY: "auto",
                }}
              >
                <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
                  Comments
                </Typography>

                {showCommentsPanel && (
                  <>
                    <Typography sx={{ fontWeight: 800, color: color_text_primary, fontSize: 13 }}>
                      Uploader Comment
                    </Typography>
                    <Typography
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: uploaderCommentText ? color_text_secondary : color_text_light,
                        fontWeight: 650,
                        lineHeight: 1.45,
                      }}
                    >
                      {uploaderCommentText || "No comments"}
                    </Typography>
                  </>
                )}

                {showReviewerCommentField && currentPhoto && (
                  <>
                    <Divider />
                    <Chip
                      size="small"
                      label={labelFromStatus(currentPhoto.status)}
                      sx={{ alignSelf: "flex-start", ...chipSx(currentPhoto.status) }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Review Comment"
                      value={reviewerCommentText}
                      onChange={(e) => onReviewerCommentChange?.(currentPhoto, e.target.value)}
                      onFocus={() => setIsCommentFocused(true)}
                      onBlur={() => setIsCommentFocused(false)}
                      onKeyDownCapture={stopGalleryKeyCapture}
                      onKeyUpCapture={stopGalleryKeyCapture}
                      multiline
                      minRows={4}
                    />
                  </>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}