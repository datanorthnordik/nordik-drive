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

import useFetch from "../../../hooks/useFetch";

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
} from "../../../constants/colors";

export type ViewerStatus = "approved" | "rejected" | "pending" | null | undefined;

export interface FormViewerDoc {
  id: number;
  file_name?: string;
  mime_type?: string;
  file_category?: string;
  file_size_bytes?: number;
  status?: ViewerStatus;
  [key: string]: any;
}

export interface FormDocumentViewerModalProps {
  open: boolean;
  onClose: () => void;

  docs: FormViewerDoc[];
  startIndex?: number;
  title?: string;

  apiBase: string;
  blobEndpointPath?: string;

  /** Parent actions (kept configurable) */
  onOpen?: (doc: FormViewerDoc) => void;
  onDownload?: (doc: FormViewerDoc) => void;

  onApprove?: (doc: FormViewerDoc) => void;
  onReject?: (doc: FormViewerDoc) => void;

  showOpenButton?: boolean;
  showDownloadButton?: boolean;
  showApproveReject?: boolean;
  showBottomBar?: boolean;
  showPrevNext?: boolean;
  showBottomOpenButton?: boolean;
  bottomOpenLabel?: string;
  tipText?: string;

  maxTextChars?: number;
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
  if (n.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (n.endsWith(".doc")) return "application/msword";
  if (n.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
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
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return ".docx";
  }
  if (mime === "application/vnd.ms-excel") return ".xls";
  if (mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return ".xlsx";
  }
  if (mime.startsWith("text/")) return ".txt";
  return "";
}

function ensureHasExtension(fileName: string, mime?: string) {
  if (fileName.includes(".")) return fileName;
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

export default function FormDocumentViewerModal({
  open,
  onClose,
  docs,
  startIndex = 0,
  title = "Document Viewer",
  apiBase,
  blobEndpointPath = "/form/answers/upload",
  onOpen,
  onDownload,
  onApprove,
  onReject,
  showOpenButton = true,
  showDownloadButton = true,
  showApproveReject = false,
  showBottomBar = true,
  showPrevNext = true,
  showBottomOpenButton = true,
  bottomOpenLabel = "View",
  tipText = "If preview doesn’t load for some file types, use Open.",
  maxTextChars = 200000,
}: FormDocumentViewerModalProps) {
  const [index, setIndex] = useState<number>(startIndex || 0);
  const [docBlobUrl, setDocBlobUrl] = useState<string>("");
  const [docTextPreview, setDocTextPreview] = useState<string>("");

  const lastBlobUrlRef = useRef<string>("");

  const {
    data: fileBlobData,
    fetchData: fetchFileBlob,
    loading: fileBlobLoading,
    error: fileBlobError,
  } = useFetch<any>(`${apiBase}${blobEndpointPath}`, "GET", false);

  const currentDoc: FormViewerDoc | undefined = docs[index];

  const currentDocMime = useMemo(() => {
    if (!currentDoc) return "";
    return currentDoc.mime_type || guessMimeFromFilename(currentDoc.file_name) || "";
  }, [currentDoc]);

  const clearPreview = useCallback(() => {
    const prev = lastBlobUrlRef.current;
    if (prev) URL.revokeObjectURL(prev);
    lastBlobUrlRef.current = "";
    setDocBlobUrl("");
    setDocTextPreview("");
  }, []);

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

    const safe = Math.min(Math.max(startIndex || 0, 0), Math.max(docs.length - 1, 0));
    setIndex(safe);
    void openDocAtIndex(safe);
  }, [open, startIndex, docs.length, openDocAtIndex]);

  useEffect(() => {
    return () => {
      const prev = lastBlobUrlRef.current;
      if (prev) URL.revokeObjectURL(prev);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!fileBlobData) return;

    const rawBlob = normalizeBlob(fileBlobData);
    if (!rawBlob) return;

    const forcedType = currentDocMime || rawBlob.type || "application/octet-stream";
    const fixedBlob = new Blob([rawBlob], { type: forcedType });
    const url = URL.createObjectURL(fixedBlob);

    setDocBlobUrl(url);

    const prev = lastBlobUrlRef.current;
    if (prev) URL.revokeObjectURL(prev);
    lastBlobUrlRef.current = url;

    const isText = forcedType.startsWith("text/") || forcedType === "application/json";

    if (isText) {
      readBlobAsText(fixedBlob)
        .then((txt) => setDocTextPreview(txt.slice(0, maxTextChars)))
        .catch(() => setDocTextPreview(""));
    } else {
      setDocTextPreview("");
    }
  }, [fileBlobData, open, currentDocMime, maxTextChars]);

  const setIndexAndLoad = useCallback(
    async (nextIdx: number) => {
      const safe = Math.min(Math.max(nextIdx, 0), Math.max(docs.length - 1, 0));
      setIndex(safe);
      await openDocAtIndex(safe);
    },
    [docs.length, openDocAtIndex]
  );

  const handlePrev = () => void setIndexAndLoad(index - 1);
  const handleNext = () => void setIndexAndLoad(index + 1);

  const openInNewTab = useCallback(() => {
    if (!docBlobUrl || !currentDoc) return;

    const mime = currentDocMime || currentDoc.mime_type || "";
    const fileName = ensureHasExtension(
      currentDoc.file_name || `document_${currentDoc.id}`,
      mime
    );

    const a = document.createElement("a");
    a.href = docBlobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [docBlobUrl, currentDoc, currentDocMime]);

  const downloadFromBlob = useCallback(() => {
    if (!docBlobUrl || !currentDoc) return;

    const mime = currentDocMime || currentDoc.mime_type || "";
    const fileName = ensureHasExtension(
      currentDoc.file_name || `document_${currentDoc.id}`,
      mime
    );

    const a = document.createElement("a");
    a.href = docBlobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [docBlobUrl, currentDoc, currentDocMime]);

  const handleOpenAction = useCallback(() => {
    if (!currentDoc) return;
    if (onOpen) {
      onOpen(currentDoc);
      return;
    }
    openInNewTab();
  }, [currentDoc, onOpen, openInNewTab]);

  const handleDownloadAction = useCallback(() => {
    if (!currentDoc) return;
    if (onDownload) {
      onDownload(currentDoc);
      return;
    }
    downloadFromBlob();
  }, [currentDoc, onDownload, downloadFromBlob]);

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
    >
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
          >
            {title} {currentDoc?.file_name ? `- ${currentDoc.file_name}` : ""}
          </Typography>

          <Typography sx={{ color: color_text_secondary, fontWeight: 700, fontSize: 12 }}>
            {(currentDocMime || "unknown")} • {docs.length ? `${index + 1}/${docs.length}` : "No documents"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {showOpenButton && (
            <Button
              onClick={handleOpenAction}
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              disabled={!currentDoc}
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
              onClick={handleDownloadAction}
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!currentDoc}
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
        {tipText}
      </Box>

      <Divider />

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
        >
          {fileBlobLoading && (
            <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={24} />
              <Typography sx={{ fontWeight: 700, color: color_text_primary }}>
                Loading document...
              </Typography>
            </Box>
          )}

          {!fileBlobLoading && fileBlobError && (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 900, mb: 1, color: color_text_primary }}>
                Failed to load document
              </Typography>
              <Typography sx={{ color: color_text_light }}>{String(fileBlobError)}</Typography>
            </Box>
          )}

          {!fileBlobLoading && docBlobUrl && (
            <>
              {isPdfMime(currentDocMime) && (
                <iframe
                  title="pdf-viewer"
                  src={docBlobUrl}
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
                >
                  <img
                    src={docBlobUrl}
                    alt={currentDoc?.file_name || "document"}
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
                >
                  <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                    Preview not supported for {isDocxMime(currentDocMime) ? "DOC/DOCX" : "Excel"} in browser.
                  </Typography>
                  <Typography sx={{ color: color_text_light, mb: 2 }}>
                    Use Open or Download.
                  </Typography>

                  <Button
                    onClick={handleOpenAction}
                    variant="contained"
                    startIcon={<OpenInNewIcon />}
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
                  <Box sx={{ p: 2 }}>
                    <pre
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
                  >
                    <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                      Preview not available for this file type.
                    </Typography>
                    <Typography sx={{ color: color_text_light, mb: 2 }}>
                      Use Open or Download.
                    </Typography>

                    <Button
                      onClick={handleOpenAction}
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
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
            >
              <Typography sx={{ color: color_text_light, fontWeight: 700 }}>
                Document not loaded yet.
              </Typography>
            </Box>
          )}
        </Box>

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
          >
            {showPrevNext && (
              <Button
                variant="outlined"
                onClick={handlePrev}
                disabled={index === 0 || fileBlobLoading}
                sx={approveBtnSx}
              >
                ◀ Prev
              </Button>
            )}

            {showApproveReject && currentDoc && (
              <>
                <Button
                  variant="contained"
                  onClick={() => onApprove?.(currentDoc)}
                  disabled={!onApprove}
                  sx={approveBtnSx}
                >
                  Approve
                </Button>

                <Button
                  variant="contained"
                  onClick={() => onReject?.(currentDoc)}
                  disabled={!onReject}
                  sx={rejectBtnSx}
                >
                  Reject
                </Button>
              </>
            )}

            {showBottomOpenButton && (
              <Button
                variant="outlined"
                onClick={handleOpenAction}
                disabled={!currentDoc}
                startIcon={<OpenInNewIcon />}
                sx={approveBtnSx}
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
              >
                Next ▶
              </Button>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}