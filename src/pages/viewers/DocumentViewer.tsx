"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Typography,
} from "@mui/material";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import FolderZipIcon from "@mui/icons-material/FolderZip";

import useFetch from "../../hooks/useFetch";

import {
  color_primary,
  color_secondary,
  color_primary_dark,
  color_secondary_dark,
  color_border,
  color_white,
  color_background,
  color_text_primary,
  color_text_secondary,
  color_text_light,
} from "../../constants/colors";

export type ReviewStatus = "approved" | "rejected" | "pending" | null;

export interface ViewerDoc {
  id: number;
  file_name?: string;
  size_bytes?: number;
  mime_type?: string;
  document_category?: string;
  status?: ReviewStatus;
  request_id?: number;

  // optional metadata (if you want to show later)
  approved_by?: string;
  approved_at?: string;
  is_approved?: boolean;
}

type SupportedText =
  | "text/plain"
  | "text/csv"
  | "text/html"
  | "text/markdown"
  | "application/json";

function safeFilename(name: string) {
  return (name || "download.zip")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .trim();
}

function buildZipName(prefix: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return safeFilename(`${prefix}_${ts}.zip`);
}

const normalizeBlob = (x: any): Blob | null => {
  if (!x) return null;
  if (x instanceof Blob) return x;
  if (x?.blob instanceof Blob) return x.blob;
  if (x?.data instanceof Blob) return x.data;
  return null;
};

const isImageMime = (m?: string) => !!m && m.startsWith("image/");
const isPdfMime = (m?: string) => m === "application/pdf";

const isDocxMime = (m?: string) =>
  m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
  m === "application/msword";

const isExcelMime = (m?: string) =>
  m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  m === "application/vnd.ms-excel";

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
  if (n.endsWith(".txt")) return "text/plain";
  if (n.endsWith(".csv")) return "text/csv";
  if (n.endsWith(".json")) return "application/json";
  return "";
}

function extensionFromMime(mime?: string) {
  if (!mime) return "";
  if (mime === "application/pdf") return ".pdf";
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "application/msword") return ".doc";
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return ".docx";
  if (mime === "application/vnd.ms-excel") return ".xls";
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return ".xlsx";
  if (mime.startsWith("text/")) return ".txt";
  return "";
}

function ensureHasExtension(fileName: string, mime?: string) {
  const hasDot = fileName.includes(".");
  if (hasDot) return fileName;
  const ext = extensionFromMime(mime);
  return ext ? `${fileName}${ext}` : fileName;
}

const readBlobAsText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(blob);
  });

export type DocumentViewerMode = "view" | "review";

export interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;

  // docs list + initial index
  docs: ViewerDoc[];
  startIndex: number;

  // mode controls: view vs review
  mode?: DocumentViewerMode;

  // API config: this reuses your existing blob fetch endpoint
  apiBase: string;
  blobEndpointPath?: string; // default: "/api/file/doc"

  /**
   * If true, the top bar "Download" button uses the same behavior as Open (download attribute).
   * If you want separate behavior, provide `onDownloadOverride`.
   */
  showDownloadButton?: boolean;
  showOpenButton?: boolean;

  // bottom bar controls
  showBottomBar?: boolean;
  showPrevNext?: boolean;
  showBottomOpenButton?: boolean;
  bottomOpenLabel?: string; // default "View"

  // review actions (only used if mode === "review")
  showApproveReject?: boolean;
  onApprove?: (docId: number) => void;
  onReject?: (docId: number) => void;

  // navigation callbacks (optional)
  onIndexChange?: (newIndex: number) => void;

  // optional text strip content
  tipText?: string;

  // override behaviors
  onOpenOverride?: (doc: ViewerDoc, blobUrl: string, mime: string) => void;
  onDownloadOverride?: (doc: ViewerDoc, blobUrl: string, mime: string) => void;

  // advanced: override mime resolution
  resolveMime?: (doc: ViewerDoc) => string;

  // safety: show up to N chars for text preview
  maxTextChars?: number;
  only_approved?: boolean;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  open,
  onClose,
  docs,
  startIndex,
  mode = "view",
  apiBase,
  blobEndpointPath = "/api/file/doc",

  showDownloadButton = true,
  showOpenButton = true,

  showBottomBar = true,
  showPrevNext = true,
  showBottomOpenButton = true,
  bottomOpenLabel = "View",

  showApproveReject = mode === "review",
  onApprove,
  onReject,

  onIndexChange,
  tipText = "If preview doesn’t load (some types can’t embed), use “Open”.",

  onOpenOverride,
  onDownloadOverride,

  resolveMime,
  maxTextChars = 200000,
  only_approved = false,
}) => {
  const [index, setIndex] = useState<number>(startIndex || 0);

  // blob preview url + preview text
  const [docBlobUrl, setDocBlobUrl] = useState<string>("");
  const [docTextPreview, setDocTextPreview] = useState<string>("");

  // keep last created blob URL so we can revoke it safely
  const lastBlobUrlRef = useRef<string>("");

  // blob fetch
  const {
    data: fileBlobData,
    fetchData: fetchFileBlob,
    loading: fileBlobLoading,
    error: fileBlobError,
  } = useFetch<any>(`${apiBase}${blobEndpointPath}`, "GET", false);

  const {
    data: zipBlobData,
    fetchData: fetchZip,
    loading: zipLoading,
    error: zipError,
  } = useFetch<any>(`${apiBase}/admin/download_files`, "POST", false);

  const zipNameRef = useRef<string>("documents.zip");
  const zipNonceRef = useRef<number>(0);
  const zipLastDoneRef = useRef<number>(0);

  const currentDoc: ViewerDoc | undefined = docs[index];

  const currentDocMime = useMemo(() => {
    if (!currentDoc) return "";
    if (resolveMime) return resolveMime(currentDoc) || "";
    return currentDoc.mime_type || guessMimeFromFilename(currentDoc.file_name) || "";
  }, [currentDoc, resolveMime]);

  const clearPreview = useCallback(() => {
    const prev = lastBlobUrlRef.current;
    if (prev) URL.revokeObjectURL(prev);
    lastBlobUrlRef.current = "";
    setDocBlobUrl("");
    setDocTextPreview("");
  }, []);

  const inferredRequestIds = useMemo(() => {
    const set = new Set<number>();

    (docs || []).forEach((d: any) => {
      const rid = (d?.request_id ?? d?.requestId) as unknown;
      if (typeof rid === "number" && Number.isFinite(rid)) set.add(rid);
    });

    return Array.from(set).sort((a, b) => a - b);
  }, [docs]);

  const canDownloadAll = inferredRequestIds.length > 0;

  const handleDownloadAllDocs = useCallback(async () => {
    if (!canDownloadAll || zipLoading) return;

    zipNonceRef.current += 1;

    const label =
      inferredRequestIds.length === 1
        ? `documents_request_${inferredRequestIds[0]}`
        : `documents_requests_${inferredRequestIds.length}`;

    zipNameRef.current = buildZipName(label);

    const body = {
      document_type: "document",
      categorize_by_user: false,
      categorize_by_type: false,
      request_ids: inferredRequestIds,
      only_approved: only_approved,
    };

    await fetchZip(body as any, undefined, false, { responseType: "blob" });
  }, [canDownloadAll, zipLoading, inferredRequestIds, fetchZip, only_approved]);

  const openDocAtIndex = useCallback(
    async (idx: number) => {
      const doc = docs[idx];
      if (!doc) return;
      clearPreview();

      await fetchFileBlob(undefined, undefined, false, {
        path: doc.id,
        responseType: "blob",
      });
    },
    [docs, clearPreview, fetchFileBlob]
  );

  useEffect(() => {
    if (!open) return;
    if (!zipBlobData) return;

    const nonce = zipNonceRef.current;
    if (zipLastDoneRef.current === nonce) return;

    const blob = normalizeBlob(zipBlobData);
    if (!blob) return;

    zipLastDoneRef.current = nonce;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipNameRef.current || "documents.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [zipBlobData, open]);

  useEffect(() => {
    if (!zipError) return;
    console.error("Download all documents ZIP failed", zipError);
  }, [zipError]);

  // initialize index when opened or startIndex changes
  useEffect(() => {
    if (!open) return;
    const safe = Math.min(Math.max(startIndex || 0, 0), Math.max(docs.length - 1, 0));
    setIndex(safe);
    openDocAtIndex(safe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startIndex, docs.length]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      const prev = lastBlobUrlRef.current;
      if (prev) URL.revokeObjectURL(prev);
    };
  }, []);

  // build blob URL + text preview
  useEffect(() => {
    if (!open) return;
    if (!fileBlobData) return;

    const rawBlob =
      fileBlobData instanceof Blob
        ? fileBlobData
        : (fileBlobData as any)?.blob instanceof Blob
          ? (fileBlobData as any).blob
          : null;

    if (!rawBlob) return;

    const forcedType = currentDocMime || rawBlob.type || "application/octet-stream";

    const fixedBlob = new Blob([rawBlob], { type: forcedType });
    const url = URL.createObjectURL(fixedBlob);

    setDocBlobUrl(url);

    // revoke previous
    const prev = lastBlobUrlRef.current;
    if (prev) URL.revokeObjectURL(prev);
    lastBlobUrlRef.current = url;

    const isText = forcedType.startsWith("text/") || forcedType === "application/json";

    if (isText) {
      readBlobAsText(fixedBlob)
        .then((txt) => setDocTextPreview(txt.slice(0, maxTextChars)))
        .catch(() => setDocTextPreview(""));
    }
  }, [fileBlobData, open, currentDocMime, maxTextChars]);

  const setIndexAndLoad = useCallback(
    async (nextIdx: number) => {
      const safe = Math.min(Math.max(nextIdx, 0), Math.max(docs.length - 1, 0));
      setIndex(safe);
      onIndexChange?.(safe);
      await openDocAtIndex(safe);
    },
    [docs.length, onIndexChange, openDocAtIndex]
  );

  const handlePrev = async () => setIndexAndLoad(index - 1);
  const handleNext = async () => setIndexAndLoad(index + 1);

  const openInNewTab = useCallback(() => {
    if (!docBlobUrl || !currentDoc) return;

    const mime = currentDocMime || currentDoc.mime_type || "";
    const fileName = ensureHasExtension(
      currentDoc.file_name || `document_${currentDoc.id}`,
      mime
    );

    if (onOpenOverride) {
      onOpenOverride(currentDoc, docBlobUrl, mime);
      return;
    }

    const a = document.createElement("a");
    a.href = docBlobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [docBlobUrl, currentDoc, currentDocMime, onOpenOverride]);

  const download = useCallback(() => {
    if (!docBlobUrl || !currentDoc) return;

    const mime = currentDocMime || currentDoc.mime_type || "";
    if (onDownloadOverride) {
      onDownloadOverride(currentDoc, docBlobUrl, mime);
      return;
    }

    openInNewTab();
  }, [docBlobUrl, currentDoc, currentDocMime, onDownloadOverride, openInNewTab]);

  const closeAndCleanup = () => {
    clearPreview();
    onClose();
  };

  const approveBtnSx = {
    fontWeight: 900,
    textTransform: "uppercase",
    background: color_secondary,
    "&:hover": { background: color_secondary_dark },
    "&.Mui-disabled": { background: color_secondary, color: color_white, opacity: 0.7 },
  } as const;

  const rejectBtnSx = {
    fontWeight: 900,
    textTransform: "uppercase",
    background: color_primary,
    "&:hover": { background: color_primary_dark },
    "&.Mui-disabled": { background: color_primary, color: color_white, opacity: 0.7 },
  } as const;

  return (
    <Dialog
      open={open}
      onClose={closeAndCleanup}
      fullScreen
      PaperProps={{ sx: { background: color_white } }}
      data-testid="document-viewer-modal"
    >
      {/* ✅ Top header */}
      <Box
        sx={{
          px: { xs: 1.25, sm: 2 },
          py: 1,
          background: color_white,
          borderBottom: `1px solid ${color_border}`,
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
            title={currentDoc?.file_name}
            data-testid="viewer-filename"
          >
            {currentDoc?.file_name || "Document"}
          </Typography>

          <Typography variant="caption" data-testid="viewer-meta">
            {(currentDocMime || currentDoc?.mime_type || "unknown") + " "}
            • ID: {currentDoc?.id} • {index + 1}/{docs.length}
            {inferredRequestIds.length === 1
              ? ` • Request #${inferredRequestIds[0]}`
              : inferredRequestIds.length > 1
                ? ` • ${inferredRequestIds.length} Requests`
                : ""}
          </Typography>
        </Box>

        {/* Header buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {showOpenButton && (
            <Button
              onClick={openInNewTab}
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              disabled={!docBlobUrl}
              data-testid="top-open"
              aria-label="top-open"
              sx={{
                fontWeight: 900,
                textTransform: "uppercase",
                borderWidth: 2,
                color: color_white,
                background: color_secondary,
                px: 2,
                "&:hover": { background: color_secondary_dark, borderWidth: 2 },
                "&.Mui-disabled": {
                  opacity: 0.6,
                  color: color_white,
                  background: color_secondary,
                },
              }}
            >
              Open
            </Button>
          )}

          {showDownloadButton && (
            <Button
              onClick={download}
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!docBlobUrl}
              data-testid="top-download"
              aria-label="top-download"
              sx={{
                fontWeight: 900,
                textTransform: "uppercase",
                px: 2,
                background: color_secondary,
                "&:hover": { background: color_secondary_dark },
                "&.Mui-disabled": { opacity: 0.6, background: color_secondary },
              }}
            >
              Download
            </Button>
          )}

          <Button
            onClick={closeAndCleanup}
            variant="outlined"
            startIcon={<CloseIcon />}
            data-testid="top-close"
            aria-label="top-close"
            sx={{
              fontWeight: 900,
              textTransform: "uppercase",
              borderWidth: 2,
              color: color_text_primary,
              backgroundColor: color_white,
              px: 2,
              "&:hover": { borderWidth: 2, backgroundColor: color_background },
            }}
          >
            Close
          </Button>
        </Box>
      </Box>

      {/* ✅ Tip strip */}
      <Box
        sx={{
          px: { xs: 1.25, sm: 2 },
          py: 1,
          background: color_text_primary,
          color: color_white,
          fontWeight: 700,
          fontSize: 13,
        }}
        data-testid="viewer-tip"
      >
        {tipText}
      </Box>

      <Divider />

      {/* ✅ Preview shell */}
      <DialogContent
        sx={{
          p: { xs: 1.25, sm: 2 },
          height: "calc(100vh - 112px)",
          boxSizing: "border-box",
          background: color_white,
        }}
      >
        <Box
          sx={{
            height: "100%",
            borderRadius: 2,
            border: `1px solid ${color_border}`,
            background: color_white,
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            position: "relative",
          }}
          data-testid="viewer-preview-shell"
        >
          {/* Loading */}
          {fileBlobLoading && (
            <Box
              sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}
              data-testid="viewer-loading"
            >
              <CircularProgress size={24} />
              <Typography sx={{ fontWeight: 700, color: color_text_primary }}>
                Loading document...
              </Typography>
            </Box>
          )}

          {/* Error */}
          {!fileBlobLoading && fileBlobError && (
            <Box sx={{ p: 3 }} data-testid="viewer-error">
              <Typography sx={{ fontWeight: 900, mb: 1, color: color_text_primary }}>
                Failed to load document
              </Typography>
              <Typography sx={{ color: color_text_light }}>{String(fileBlobError)}</Typography>
            </Box>
          )}

          {/* Content */}
          {!fileBlobLoading && docBlobUrl && (
            <>
              {isPdfMime(currentDocMime) && (
                <iframe
                  title="pdf-viewer"
                  src={docBlobUrl}
                  data-testid="viewer-pdf-iframe"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                    background: "#fff",
                  }}
                />
              )}

              {isImageMime(currentDocMime) && (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    background: color_background,
                    overflow: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                  }}
                  data-testid="viewer-image-wrap"
                >
                  <img
                    src={docBlobUrl}
                    alt={currentDoc?.file_name}
                    data-testid="viewer-image"
                    style={{
                      display: "block",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              )}

              {(isDocxMime(currentDocMime) || isExcelMime(currentDocMime)) && (
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
                  data-testid="viewer-unsupported-preview"
                >
                  <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                    Preview not supported for{" "}
                    {isDocxMime(currentDocMime) ? "DOC/DOCX" : "Excel"} in browser.
                  </Typography>
                  <Typography sx={{ color: color_text_light, mb: 2 }}>
                    Use “Open” to download/open it with your system app.
                  </Typography>

                  <Button
                    onClick={openInNewTab}
                    variant="contained"
                    startIcon={<OpenInNewIcon />}
                    data-testid="viewer-unsupported-open"
                    sx={{
                      fontWeight: 900,
                      background: color_secondary,
                      "&:hover": { background: color_secondary_dark },
                    }}
                  >
                    Open
                  </Button>
                </Box>
              )}

              {!isPdfMime(currentDocMime) &&
                !isImageMime(currentDocMime) &&
                !isDocxMime(currentDocMime) &&
                !isExcelMime(currentDocMime) &&
                docTextPreview && (
                  <Box sx={{ p: 2 }} data-testid="viewer-text-wrap">
                    <pre
                      data-testid="viewer-text-pre"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        color: color_text_primary,
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: 13,
                      }}
                    >
                      {docTextPreview}
                    </pre>
                  </Box>
                )}

              {!isPdfMime(currentDocMime) &&
                !isImageMime(currentDocMime) &&
                !isDocxMime(currentDocMime) &&
                !isExcelMime(currentDocMime) &&
                !docTextPreview && (
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
                    data-testid="viewer-unknown-preview"
                  >
                    <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                      Preview not available for this file type.
                    </Typography>
                    <Typography sx={{ color: color_text_light, mb: 2 }}>
                      Use “Open” or “Download”.
                    </Typography>

                    <Button
                      onClick={openInNewTab}
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
                      data-testid="viewer-unknown-open"
                      sx={{
                        fontWeight: 900,
                        background: color_secondary,
                        "&:hover": { background: color_secondary_dark },
                      }}
                    >
                      Open
                    </Button>
                  </Box>
                )}
            </>
          )}

          {!fileBlobLoading && !fileBlobError && !docBlobUrl && (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
              }}
              data-testid="viewer-not-loaded"
            >
              <Typography sx={{ color: color_text_light, fontWeight: 700 }}>
                Document not loaded yet.
              </Typography>
            </Box>
          )}
        </Box>

        {/* ✅ Bottom action bar */}
        {showBottomBar && (
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
              boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
              backdropFilter: "blur(8px)",
              maxWidth: "calc(100vw - 24px)",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              width: "max-content",
            }}
            data-testid="viewer-bottom-bar"
          >
            {showPrevNext && (
              <Button
                variant="outlined"
                onClick={handlePrev}
                disabled={index === 0 || fileBlobLoading}
                sx={approveBtnSx}
                data-testid="bottom-prev"
              >
                ◀ Prev
              </Button>
            )}

            {showApproveReject && mode === "review" && (
              <>
                <Button
                  variant="contained"
                  onClick={() => currentDoc && onApprove?.(currentDoc.id)}
                  disabled={fileBlobLoading || !currentDoc}
                  sx={approveBtnSx}
                  data-testid="review-approve"
                >
                  Approve
                </Button>

                <Button
                  variant="contained"
                  onClick={() => currentDoc && onReject?.(currentDoc.id)}
                  disabled={fileBlobLoading || !currentDoc}
                  sx={rejectBtnSx}
                  data-testid="review-reject"
                >
                  Reject
                </Button>
              </>
            )}

            {showBottomOpenButton && (
              <Button
                variant="outlined"
                onClick={openInNewTab}
                disabled={!docBlobUrl}
                startIcon={<OpenInNewIcon />}
                sx={approveBtnSx}
                data-testid="bottom-open"
              >
                {bottomOpenLabel}
              </Button>
            )}

            {showPrevNext && (
              <Button
                variant="outlined"
                onClick={handleNext}
                disabled={index === docs.length - 1 || fileBlobLoading}
                sx={approveBtnSx}
                data-testid="bottom-next"
              >
                Next ▶
              </Button>
            )}

            <Button
              onClick={handleDownloadAllDocs}
              variant="contained"
              startIcon={
                zipLoading ? (
                  <CircularProgress size={16} sx={{ color: color_white }} />
                ) : (
                  <FolderZipIcon />
                )
              }
              disabled={!canDownloadAll || zipLoading}
              sx={approveBtnSx}
              data-testid="download-all"
            >
              Download All
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;
