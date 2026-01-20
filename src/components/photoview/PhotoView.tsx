"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  Divider,
} from "@mui/material";

import useFetch from "../../hooks/useFetch";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";

// ✅ Reusable viewer
import PhotoViewerModal, { ViewerPhoto } from "../../pages/viewers/PhotoViewer"; // adjust path

type PhotoItem = { id: number; filename?: string };
type DocItem = { id: number; filename?: string; mime_type?: string };



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
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return ".docx";
  if (mime === "application/vnd.ms-excel") return ".xls";
  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return ".xlsx";
  if (mime.startsWith("text/")) return ".txt";
  if (mime === "application/json") return ".json";
  return "";
}

function ensureHasExtension(fileName: string, mime?: string) {
  if (!fileName) return fileName;
  if (fileName.includes(".")) return fileName;
  const ext = extensionFromMime(mime);
  return ext ? `${fileName}${ext}` : fileName;
}

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE as string | undefined) ||
  (process.env.REACT_APP_API_BASE as string | undefined) ||
  "https://nordikdriveapi-724838782318.us-west1.run.app/api";

const RequestMediaViewerModal = ({
  open,
  requestId,
  startIndex,
  onClose,
}: {
  open: boolean;
  requestId: number;
  startIndex: number;
  onClose: () => void;
}) => {
  // Tabs: 0 = Photos, 1 = Documents
  const [tab, setTab] = useState<0 | 1>(0);

  // Data
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);

  // ✅ PhotoViewerModal state
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(startIndex || 0);

  // Doc viewer
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerIndex, setDocViewerIndex] = useState(0);

  // Doc blob preview
  const [docBlobUrl, setDocBlobUrl] = useState("");
  const lastDocBlobUrlRef = useRef<string>("");

  // Zoom (doc only)
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.25;
  const [docZoom, setDocZoom] = useState(1);
  const clamp = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
  const zoomInDoc = () => setDocZoom((z) => clamp(Number((z + ZOOM_STEP).toFixed(2))));
  const zoomOutDoc = () => setDocZoom((z) => clamp(Number((z - ZOOM_STEP).toFixed(2))));
  const resetDocZoom = () => setDocZoom(1);

  // -----------------------------
  // useFetch hooks (ONLY)
  // -----------------------------
  const {
    data: photoData,
    fetchData: loadPhotos,
    loading: photosLoading,
    error: photosError,
  } = useFetch(`${API_BASE}/file/photos/${requestId}`, "GET", false);

  const {
    data: docData,
    fetchData: loadDocs,
    loading: docsLoading,
    error: docsError,
  } = useFetch(`${API_BASE}/file/docs/${requestId}`, "GET", false);

  const {
    data: docBlobData,
    fetchData: fetchDocBlob,
    loading: docBlobLoading,
    error: docBlobError,
  } = useFetch<any>(`${API_BASE}/file/doc`, "GET", false);

  const {
    data: downloadBlobData,
    fetchData: fetchDownloadBlob,
    loading: downloading,
    error: downloadError,
  } = useFetch<any>(`${API_BASE}/doc/download`, "POST", false);

  const currentDoc = documents[docViewerIndex];
  const currentDocMime =
    currentDoc?.mime_type || guessMimeFromFilename(currentDoc?.filename) || "";

  // -----------------------------
  // Load data when wrapper opens
  // -----------------------------
  useEffect(() => {
    if (!open) return;
    if (!requestId) return;

    setPhotoViewerIndex(startIndex || 0);

    loadPhotos();
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId, startIndex]);

  useEffect(() => {
    if ((photoData as any)?.photos) {
      setPhotos(
        (photoData as any).photos.map((p: any) => ({
          id: p.id,
          filename: p.filename ?? p.file_name ?? p.name ?? undefined,
        }))
      );
    } else setPhotos([]);
  }, [photoData]);

  useEffect(() => {
    if ((docData as any)?.docs) {
      setDocuments(
        (docData as any).docs.map((d: any) => {
          const filename = d.filename ?? d.file_name ?? d.name ?? undefined;
          const mime = d.mime_type ?? guessMimeFromFilename(filename);
          return { id: d.id, filename, mime_type: mime };
        })
      );
    } else setDocuments([]);
  }, [docData]);

  // -----------------------------
  // ✅ When Photos tab selected, open PhotoViewerModal
  // -----------------------------
  useEffect(() => {
    if (!open) return;
    if (tab !== 0) return;

    // open viewer as soon as Photos tab is active
    setPhotoViewerOpen(true);
  }, [open, tab]);

  // optional: if user closes PhotoViewerModal, keep wrapper open but stay in Photos tab
  const handleClosePhotoViewer = () => {
    setPhotoViewerOpen(false);

    // Option A (recommended): switch to Documents after closing, so user isn't stuck on Photos tab
    // setTab(1);

    // Option B: keep tab=0; user can close the whole wrapper via Close button (already present)
  };

  // -----------------------------
  // Doc preview helpers
  // -----------------------------
  const clearDocPreview = useCallback(() => {
    if (lastDocBlobUrlRef.current) {
      URL.revokeObjectURL(lastDocBlobUrlRef.current);
      lastDocBlobUrlRef.current = "";
    }
    setDocBlobUrl("");
  }, []);

  const openDocAtIndex = useCallback(
    async (idx: number) => {
      const doc = documents[idx];
      if (!doc) return;

      clearDocPreview();

      await fetchDocBlob(undefined, undefined, false, {
        path: doc.id,
        responseType: "blob",
      });
    },
    [documents, clearDocPreview, fetchDocBlob]
  );

  const handleOpenDocViewer = async (idx: number) => {
    setDocViewerIndex(idx);
    setDocViewerOpen(true);
    await openDocAtIndex(idx);
  };

  const handlePrevDoc = async () => {
    const nextIdx = Math.max(docViewerIndex - 1, 0);
    setDocViewerIndex(nextIdx);
    await openDocAtIndex(nextIdx);
  };

  const handleNextDoc = async () => {
    const nextIdx = Math.min(docViewerIndex + 1, documents.length - 1);
    setDocViewerIndex(nextIdx);
    await openDocAtIndex(nextIdx);
  };

  // Convert doc blob to URL
  useEffect(() => {
    if (!docViewerOpen) return;
    if (!docBlobData) return;

    const raw =
      docBlobData instanceof Blob
        ? docBlobData
        : (docBlobData as any)?.blob instanceof Blob
        ? (docBlobData as any).blob
        : null;

    if (!raw) return;

    const forcedType = currentDocMime || raw.type || "application/octet-stream";
    const fixedBlob = new Blob([raw], { type: forcedType });

    if (lastDocBlobUrlRef.current) URL.revokeObjectURL(lastDocBlobUrlRef.current);
    const url = URL.createObjectURL(fixedBlob);
    lastDocBlobUrlRef.current = url;
    setDocBlobUrl(url);
  }, [docBlobData, docViewerOpen, currentDocMime]);

  // Cleanup when wrapper closes
  useEffect(() => {
    if (!open) {
      setDocViewerOpen(false);
      setPhotoViewerOpen(false);
      clearDocPreview();
    }
  }, [open, clearDocPreview]);

  useEffect(() => () => clearDocPreview(), [clearDocPreview]);

  // -----------------------------
  // Download (docs)
  // -----------------------------
  const pendingDownloadRef = useRef<{ filename?: string; mime?: string } | null>(null);

  const downloadById = useCallback(
    async (id: number, filename?: string, mime?: string) => {
      pendingDownloadRef.current = { filename, mime };

      await fetchDownloadBlob(undefined, undefined, false, {
        path: id,
        responseType: "blob",
      });
    },
    [fetchDownloadBlob]
  );

  useEffect(() => {
    if (!downloadBlobData) return;

    const raw =
      downloadBlobData instanceof Blob
        ? downloadBlobData
        : (downloadBlobData as any)?.blob instanceof Blob
        ? (downloadBlobData as any).blob
        : null;

    if (!raw) return;

    const meta = pendingDownloadRef.current || {};
    const forcedType = meta.mime || raw.type || "application/octet-stream";
    const fixedBlob = new Blob([raw], { type: forcedType });

    const objectUrl = URL.createObjectURL(fixedBlob);

    const baseName =
      meta.filename && meta.filename.trim()
        ? ensureHasExtension(meta.filename.trim(), forcedType)
        : `download_${Date.now()}${extensionFromMime(forcedType) || ""}`;

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = baseName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(objectUrl);
    pendingDownloadRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadBlobData]);

  // -----------------------------
  // ✅ build ViewerPhoto[] for PhotoViewerModal
  // -----------------------------
  const viewerPhotos: ViewerPhoto[] = useMemo(() => {
    return (photos || []).map((p) => ({
      id: p.id,
      file_name: p.filename,
      mime_type: guessMimeFromFilename(p.filename) || "image/jpeg",
      request_id: requestId, // ✅ for Download All ZIP inference
    }));
  }, [photos, requestId]);

  const isLoading = photosLoading || docsLoading;
  const anyError = photosError || docsError;

  return (
    <>
      {/* Wrapper dialog */}
      <Dialog open={open} onClose={onClose} fullScreen>
        <DialogTitle
          sx={{
            py: 0.75,
            px: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: "#fff",
          }}
        >
          <Box sx={{ minWidth: 140 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
              Media Viewer
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              ID: {requestId}
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ minHeight: 34, "& .MuiTab-root": { minHeight: 34, py: 0 } }}
          >
            <Tab value={0} label={`Photos (${photos.length})`} />
            <Tab value={1} label={`Documents (${documents.length})`} />
          </Tabs>

          <Box sx={{ flex: 1 }} />

          <Button onClick={onClose} variant="contained" sx={{ fontWeight: 900 }}>
            Close
          </Button>
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{
            background: "#000",
            p: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
          }}
        >
          {isLoading && (
            <Box sx={{ mt: 4, color: "#fff" }}>
              <Typography>Loading...</Typography>
            </Box>
          )}

          {!isLoading && anyError && (
            <Box sx={{ mt: 4, color: "#fff" }}>
              <Typography>Failed to load media.</Typography>
            </Box>
          )}

          {/* ✅ PHOTOS TAB: nothing rendered here, viewer opens full-screen */}
          {!isLoading && !anyError && tab === 0 && (
            <Box sx={{ mt: 4, color: "#fff", px: 2 }}>
              <Typography sx={{ fontWeight: 800 }}>
                Opening photo viewer...
              </Typography>
            </Box>
          )}

          {/* DOCUMENTS TAB (your existing UI stays) */}
          {!isLoading && !anyError && tab === 1 && (
            <>
              {documents.length === 0 ? (
                <Typography sx={{ color: "white", mt: 4 }}>
                  No documents found.
                </Typography>
              ) : (
                <Box sx={{ width: "100%", p: 2 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.5,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(4, 1fr)",
                      },
                      alignItems: "stretch",
                    }}
                  >
                    {documents.map((doc, idx) => {
                      const mime =
                        doc.mime_type ||
                        guessMimeFromFilename(doc.filename) ||
                        "application/octet-stream";

                      const name = doc.filename ?? `Document #${doc.id}`;

                      return (
                        <Card
                          key={doc.id}
                          sx={{
                            borderRadius: 2.5,
                            background: "#0b0b0b",
                            border: "1px solid rgba(255,255,255,0.14)",
                            overflow: "hidden",
                            transition:
                              "transform 120ms ease, border-color 120ms ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              borderColor: "rgba(255,255,255,0.26)",
                            },
                          }}
                        >
                          <Box
                            onClick={() => handleOpenDocViewer(idx)}
                            sx={{
                              cursor: "pointer",
                              p: 1.25,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 2,
                                display: "grid",
                                placeItems: "center",
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                flex: "0 0 auto",
                              }}
                            >
                              <DescriptionIcon
                                sx={{ color: "rgba(255,255,255,0.9)" }}
                              />
                            </Box>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                sx={{
                                  color: "#fff",
                                  fontWeight: 900,
                                  fontSize: 13.5,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={name}
                              >
                                {name}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  color: "rgba(255,255,255,0.65)",
                                  fontWeight: 800,
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={`${mime} • ID: ${doc.id}`}
                              >
                                {mime} • ID: {doc.id}
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

                          <Box
                            sx={{
                              p: 1,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 1,
                              background: "rgba(255,255,255,0.02)",
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocViewer(idx);
                              }}
                              sx={{
                                textTransform: "none",
                                fontWeight: 900,
                                color: "#fff",
                                borderColor: "rgba(255,255,255,0.30)",
                                "&:hover": {
                                  borderColor: "rgba(255,255,255,0.55)",
                                  background: "rgba(255,255,255,0.06)",
                                },
                              }}
                            >
                              View
                            </Button>

                            <Button
                              size="small"
                              variant="contained"
                              startIcon={
                                downloading ? (
                                  <CircularProgress size={14} sx={{ color: "#fff" }} />
                                ) : (
                                  <DownloadIcon />
                                )
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadById(
                                  doc.id,
                                  doc.filename ?? `document_${doc.id}`,
                                  mime
                                );
                              }}
                              disabled={downloading}
                              sx={{ textTransform: "none", fontWeight: 900 }}
                            >
                              Download
                            </Button>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ Photos full-screen viewer (reused) */}
      <PhotoViewerModal
        open={open && tab === 0 && photoViewerOpen}
        onClose={handleClosePhotoViewer}
        photos={viewerPhotos}
        startIndex={photoViewerIndex}
        mode="view"
        showThumbnails={true}
        showStatusPill={false}
        only_approved={true}
      />

      {/* FULLSCREEN DOCUMENT VIEWER (keep yours unchanged) */}
      {docViewerOpen && currentDoc && (
        <Dialog
          open={true}
          onClose={() => {
            setDocViewerOpen(false);
            clearDocPreview();
          }}
          fullScreen
        >
          {/* ... keep your existing doc viewer code exactly as-is ... */}
          <DialogTitle sx={{ background: "#0b1220", color: "#fff" }}>
            <Typography sx={{ fontWeight: 900 }}>
              {currentDoc.filename ?? `Document #${currentDoc.id}`}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ background: "#000" }}>
            {/* keep rest */}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default RequestMediaViewerModal;
