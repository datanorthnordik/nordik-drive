"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Card, Chip, CircularProgress, TextField, Tooltip, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

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
  getReviewStatusUppercaseLabel,
  type ReviewStatusValue,
} from "../../constants/statuses";

import { DocumentGridItem, DocumentGridProps, categoryLabel, formatBytes, normalizeStatus } from "./types";
import { renderDocxPreview } from "../../lib/docxPreview";

const isImageMime = (m?: string) => !!m && m.startsWith("image/");
const isPdfMime = (m?: string) => m === "application/pdf";
const isDocxMime = (m?: string) =>
  m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const isLegacyWordMime = (m?: string) => m === "application/msword";
const isExcelMime = (m?: string) =>
  m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  m === "application/vnd.ms-excel";
const isTextPreviewMime = (m?: string) =>
  !!m && (m.startsWith("text/") || m === "application/json");

function guessPreviewMimeFromFilename(name?: string) {
  if (!name) return "";
  const normalized = name.toLowerCase();
  if (normalized.endsWith(".pdf")) return "application/pdf";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (normalized.endsWith(".doc")) return "application/msword";
  if (normalized.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (normalized.endsWith(".xls")) return "application/vnd.ms-excel";
  if (normalized.endsWith(".txt")) return "text/plain";
  if (normalized.endsWith(".csv")) return "text/csv";
  if (normalized.endsWith(".json")) return "application/json";
  return "";
}

function extensionLabel(name?: string, mime?: string) {
  const trimmed = String(name || "").trim();
  const ext = trimmed.includes(".") ? trimmed.split(".").pop() || "" : "";
  if (ext) return ext.toUpperCase();
  if (isPdfMime(mime)) return "PDF";
  if (isImageMime(mime)) return "IMAGE";
  if (isDocxMime(mime)) return "DOCX";
  if (isLegacyWordMime(mime)) return "DOC";
  if (isExcelMime(mime)) return "SHEET";
  if (isTextPreviewMime(mime)) return "TEXT";
  return "FILE";
}

function previewTitle(mime?: string) {
  if (isImageMime(mime)) return "Image preview";
  if (isPdfMime(mime)) return "PDF preview";
  if (isDocxMime(mime) || isLegacyWordMime(mime)) return "Word preview";
  if (isExcelMime(mime)) return "Spreadsheet";
  if (isTextPreviewMime(mime)) return "Text preview";
  return "Document preview";
}

function resolvePreviewUrlValue(doc: DocumentGridItem, getPreviewUrl?: (d: DocumentGridItem) => string) {
  return (
    getPreviewUrl?.(doc) ||
    String(doc.preview_url || doc.file_url || doc.url || "").trim()
  );
}

type DocumentPreviewSurfaceProps = {
  docId: number;
  filename: string;
  mime: string;
  previewUrl: string;
  previewHeight: number;
};

function DocumentPreviewSurface({
  docId,
  filename,
  mime,
  previewUrl,
  previewHeight,
}: DocumentPreviewSurfaceProps) {
  const previewMime = useMemo(
    () => guessPreviewMimeFromFilename(filename) || mime,
    [mime, filename]
  );
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [textPreview, setTextPreview] = useState("");
  const [blobPreviewUrl, setBlobPreviewUrl] = useState("");
  const [resolvedPreviewMime, setResolvedPreviewMime] = useState(previewMime);
  const docxPreviewRef = useRef<HTMLDivElement | null>(null);
  const blobPreviewUrlRef = useRef("");

  useEffect(() => {
    const container = docxPreviewRef.current;
    const clearBlobPreviewUrl = () => {
      const existing = blobPreviewUrlRef.current;
      if (existing) {
        URL.revokeObjectURL(existing);
        blobPreviewUrlRef.current = "";
      }
    };

    if (container) container.innerHTML = "";
    clearBlobPreviewUrl();
    setBlobPreviewUrl("");
    setResolvedPreviewMime(previewMime);
    setRemoteLoading(false);
    setRemoteError("");
    setTextPreview("");

    const requiresFetchedPreview =
      !!previewUrl &&
      (isImageMime(previewMime) ||
        isPdfMime(previewMime) ||
        isDocxMime(previewMime) ||
        isTextPreviewMime(previewMime));

    if (!requiresFetchedPreview) return;
    if (!container && isDocxMime(previewMime)) return;

    const controller = new AbortController();
    let cancelled = false;

    setRemoteLoading(true);

    void fetch(previewUrl, { signal: controller.signal, credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const normalizedMime =
          previewMime ||
          (blob.type && blob.type !== "application/octet-stream" ? blob.type : "");
        const normalizedBlob =
          normalizedMime && blob.type !== normalizedMime
            ? new Blob([blob], { type: normalizedMime })
            : blob;

        if (normalizedMime) {
          setResolvedPreviewMime(normalizedMime);
        }

        if (isDocxMime(previewMime)) {
          await renderDocxPreview(normalizedBlob, container as HTMLElement);
          return;
        }

        if (isImageMime(previewMime) || isPdfMime(previewMime)) {
          const nextBlobUrl = URL.createObjectURL(normalizedBlob);
          if (cancelled) {
            URL.revokeObjectURL(nextBlobUrl);
            return;
          }
          blobPreviewUrlRef.current = nextBlobUrl;
          setBlobPreviewUrl(nextBlobUrl);
          return;
        }

        const text = await blob.text();
        const normalizedText = text.trim();
        setTextPreview(normalizedText.slice(0, 420));
      })
      .then(() => {
        if (cancelled) return;
        setRemoteLoading(false);
      })
      .catch((error) => {
        if (cancelled || error?.name === "AbortError") return;
        if (container) container.innerHTML = "";
        setRemoteLoading(false);
        setRemoteError(error instanceof Error ? error.message : "Preview unavailable.");
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (container) container.innerHTML = "";
      clearBlobPreviewUrl();
    };
  }, [previewUrl, previewMime]);

  useEffect(() => {
    return () => {
      const existing = blobPreviewUrlRef.current;
      if (existing) {
        URL.revokeObjectURL(existing);
        blobPreviewUrlRef.current = "";
      }
    };
  }, []);

  const renderPlaceholder = (accent: string, body: string) => {
    const Icon = isImageMime(resolvedPreviewMime)
      ? ImageOutlinedIcon
      : isPdfMime(resolvedPreviewMime)
        ? PictureAsPdfOutlinedIcon
        : isDocxMime(resolvedPreviewMime) || isLegacyWordMime(resolvedPreviewMime)
          ? ArticleOutlinedIcon
          : isExcelMime(resolvedPreviewMime)
            ? TableChartOutlinedIcon
            : isTextPreviewMime(resolvedPreviewMime)
              ? DescriptionOutlinedIcon
              : InsertDriveFileOutlinedIcon;

    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 1,
          px: 2,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: "18px",
            display: "grid",
            placeItems: "center",
            background: accent,
            color: color_white,
            boxShadow: "0 14px 28px rgba(15, 23, 42, 0.14)",
          }}
        >
          <Icon fontSize="medium" />
        </Box>

        <Typography sx={{ fontWeight: 900, color: color_text_primary, fontSize: "0.98rem" }}>
          {previewTitle(resolvedPreviewMime)}
        </Typography>

        <Typography sx={{ color: color_text_light, fontWeight: 700, fontSize: "0.84rem" }}>
          {body}
        </Typography>
      </Box>
    );
  };

  const previewBody = () => {
    if (blobPreviewUrl && isImageMime(resolvedPreviewMime)) {
      return (
        <img
          src={blobPreviewUrl}
          alt={filename}
          data-testid={`doc-preview-image-${docId}`}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      );
    }

    if (blobPreviewUrl && isPdfMime(resolvedPreviewMime)) {
      return (
        <iframe
          title={`document-card-preview-${docId}`}
          data-testid={`doc-preview-pdf-${docId}`}
          src={`${blobPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            background: color_white,
            pointerEvents: "none",
          }}
        />
      );
    }

    if (previewUrl && isDocxMime(resolvedPreviewMime) && !remoteError) {
      return (
        <Box
          data-testid={`doc-preview-docx-${docId}`}
          sx={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
          }}
        >
          <Box
            ref={docxPreviewRef}
            sx={{
              width: "333.333%",
              transform: "scale(0.3)",
              transformOrigin: "top left",
              pointerEvents: "none",
              "& .docx-wrapper": {
                background: "transparent",
                padding: 0,
              },
              "& .docx-wrapper > section": {
                boxShadow: "none",
                marginBottom: 0,
              },
            }}
          />
        </Box>
      );
    }

    if (previewUrl && isTextPreviewMime(resolvedPreviewMime) && textPreview && !remoteError) {
      return (
        <Box
          data-testid={`doc-preview-text-${docId}`}
          sx={{
            height: "100%",
            p: 1.5,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <Typography
            component="pre"
            sx={{
              m: 0,
              fontSize: "0.8rem",
              fontWeight: 700,
              lineHeight: 1.5,
              color: color_text_primary,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: 8,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {textPreview}
          </Typography>
        </Box>
      );
    }

    if (previewUrl && (isLegacyWordMime(resolvedPreviewMime) || isExcelMime(resolvedPreviewMime))) {
      return renderPlaceholder(
        "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
        "Open the full viewer for a readable preview."
      );
    }

    return renderPlaceholder(
      "linear-gradient(135deg, #1d4ed8 0%, #0f766e 100%)",
      previewUrl ? "Tap to open the full document viewer." : "Preview URL is not available."
    );
  };

  return (
    <Box
      data-testid={`doc-preview-shell-${docId}`}
      sx={{
        position: "relative",
        height: previewHeight,
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${color_border}`,
        background:
          "linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.94) 100%)",
        flexShrink: 0,
      }}
    >
      {previewBody()}

      {(remoteLoading || remoteError) && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 1,
            p: 2,
            textAlign: "center",
            background: remoteError ? "rgba(255,255,255,0.84)" : "rgba(255,255,255,0.72)",
          }}
        >
          {remoteLoading ? (
            <>
              <CircularProgress size={20} />
              <Typography sx={{ color: color_text_light, fontWeight: 800, fontSize: "0.82rem" }}>
                Preparing preview...
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ color: color_text_primary, fontWeight: 900, fontSize: "0.9rem" }}>
                Preview unavailable
              </Typography>
              <Typography sx={{ color: color_text_light, fontWeight: 700, fontSize: "0.8rem" }}>
                {remoteError}
              </Typography>
            </>
          )}
        </Box>
      )}

      <Chip
        size="small"
        label={extensionLabel(filename, resolvedPreviewMime)}
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          height: 28,
          borderRadius: "999px",
          fontWeight: 900,
          color: color_text_primary,
          backgroundColor: "rgba(255,255,255,0.9)",
          border: `1px solid rgba(148, 163, 184, 0.28)`,
          backdropFilter: "blur(8px)",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          p: 1.25,
          background: "linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.78) 100%)",
          pointerEvents: "none",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.76rem",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          {previewTitle(resolvedPreviewMime)}
        </Typography>
      </Box>
    </Box>
  );
}

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
  getPreviewUrl,

  showApproveReject = false,
  onApprove,
  onReject,
  approveBtnSx,
  rejectBtnSx,

  showReviewerCommentField = false,
  reviewerCommentLabel = "Review Comment",
  onReviewerCommentChange,

  cardBorderColor = color_secondary,
  previewHeight = 190,
  containerSx,
  cardSx,

  statusLabel,
  statusChipSx,

  primaryBtnSx,
  showStatusChip = true,
  viewReviewerComment = false,
  disableReviewerCommentField = false,
}: DocumentGridProps) {
  const labelOf = (st: ReviewStatusValue) =>
    statusLabel ? statusLabel(st) : getReviewStatusUppercaseLabel(st);

  const defaultDocStatusChipSx = (st: ReviewStatusValue) => {
    if (st === REVIEW_STATUS_VALUES.APPROVED) {
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
    if (st === REVIEW_STATUS_VALUES.REJECTED) {
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
      border: "1px solid rgba(243, 156, 18, 0.25)",
    };
  };

  const chipSx = (st: ReviewStatusValue) =>
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

  const metaChipSx = {
    height: 28,
    fontSize: "0.78rem",
    fontWeight: 900,
    borderRadius: "999px",
    color: color_text_secondary,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
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
            mt: 1.2,
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
              const previewMime = mime || guessPreviewMimeFromFilename(filename);
              const previewUrl = resolvePreviewUrlValue(doc, getPreviewUrl);
              const reviewerComment = String((doc as any).reviewer_comment || "");

              const hasActions =
                showViewButton || showDownload || !!onDownloadSingle || showApproveReject;

              return (
                <Card
                  key={doc.id}
                  data-testid={`doc-card-${doc.id}`}
                  onClick={() => onOpenViewer(idx)}
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    minHeight: "100%",
                    borderRadius: 2.5,
                    p: 1.2,
                    backgroundColor: color_white,
                    border: `1px solid ${cardBorderColor}`,
                    boxShadow: "0 10px 24px rgba(2,6,23,0.08)",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    "&:hover": { boxShadow: "0 16px 34px rgba(2,6,23,0.14)" },
                    ...cardSx,
                  }}
                >
                  <DocumentPreviewSurface
                    docId={doc.id}
                    filename={filename}
                    mime={previewMime}
                    previewUrl={previewUrl}
                    previewHeight={previewHeight}
                  />

                  <Box
                    sx={{
                      p: 0.2,
                      pt: 1.15,
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                        alignItems: "center",
                        minHeight: 30,
                      }}
                    >
                      {showStatusChip && (
                        <Chip
                          size="small"
                          label={labelOf(st)}
                          data-testid={`doc-status-${doc.id}`}
                          sx={chipSx(st)}
                        />
                      )}

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
                    </Box>

                    <Typography
                      sx={{
                        mt: 1.15,
                        fontWeight: 900,
                        fontSize: "1.08rem",
                        lineHeight: 1.35,
                        color: color_text_primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={filename}
                    >
                      {filename}
                    </Typography>

                    <Box
                      sx={{
                        mt: 0.75,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, color: color_text_light, fontSize: "0.84rem" }}>
                        ID: {doc.id}
                      </Typography>

                      <Chip size="small" label={extensionLabel(filename, previewMime)} sx={metaChipSx} />
                    </Box>

                    <Typography
                      sx={{
                        mt: 0.75,
                        color: color_text_secondary,
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {previewMime || "Unknown file type"}
                    </Typography>

                    {showReviewerCommentField && !disableReviewerCommentField && (
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

                    {(viewReviewerComment || (showReviewerCommentField && disableReviewerCommentField)) &&
                      renderCommentCard(reviewerCommentLabel, reviewerComment, "No review comment")}

                    {hasActions && (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: 1,
                          mt: "auto",
                          pt: 1.4,
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
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
