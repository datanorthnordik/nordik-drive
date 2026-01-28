"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Grid,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableContainer,
  Paper,
} from "@mui/material";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

import useFetch from "../../hooks/useFetch";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

import {
  color_secondary,
  color_secondary_dark,
  color_border,
  color_white,
  color_background,
  color_text_primary,
  color_text_secondary,
  color_text_light,
  color_success,
  color_warning,
  color_primary,
} from "../../constants/colors";
import PhotoViewerModal from "../viewers/PhotoViewer";
import DocumentViewerModal from "../viewers/DocumentViewer";



interface MyRequestDetailsModalProps {
  open: boolean;
  request: any;
  onClose: () => void;
}

type ReviewStatus = "approved" | "rejected" | "pending";

interface RequestPhoto {
  id: number;
  file_name?: string;
  size_bytes?: number;
  mime_type?: string;
  approved_by?: string;
  approved_at?: string;
  is_approved?: boolean;
}

interface RequestDoc {
  id: number;
  file_name: string;
  size_bytes: number;
  mime_type?: string;
  approved_by?: string;
  approved_at?: string;
  document_category?: string;
  is_approved?: boolean;
}

const API_BASE = "https://nordikdriveapi-724838782318.us-west1.run.app";
const getBinaryUrl = (id: number) => `${API_BASE}/api/file/photo/${id}`;

const isImageMime = (m?: string) => !!m && m.startsWith("image/");
const isPdfMime = (m?: string) => m === "application/pdf";

function guessMimeFromFilename(name?: string) {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
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
  if (mime.startsWith("text/")) return ".txt";
  return "";
}

function ensureHasExtension(fileName: string, mime?: string) {
  const hasDot = fileName.includes(".");
  if (hasDot) return fileName;
  const ext = extensionFromMime(mime);
  return ext ? `${fileName}${ext}` : fileName;
}

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const categoryLabel = (cat?: string) => {
  if (!cat) return "Unknown";
  const map: Record<string, string> = {
    birth_certificate: "Birth Certificate",
    death_certificate: "Death Certificate",
    other_document: "Other Document",
  };
  return map[cat] || cat;
};

const isZeroTime = (iso?: string) => !iso || String(iso).startsWith("0001-01-01");

const deriveStatus = (requestStatus?: string, is_approved?: boolean): ReviewStatus => {
  const req = String(requestStatus || "").toLowerCase();

  // if request is approved/rejected and item still not approved => rejected (your rule)
  const isFinal = req.includes("approved") || req.includes("rejected");
  if (isFinal && !is_approved) return "rejected";

  if (is_approved) return "approved";

  return "pending";
};

// NO RED styling
const chipSx = (st: ReviewStatus) => {
  if (st === "approved") {
    return {
      color: "#166534",
      backgroundColor: "rgba(39, 174, 96, 0.12)",
      border: "1px solid rgba(39, 174, 96, 0.25)",
    };
  }
  if (st === "rejected") {
    return {
      color: color_primary,
      backgroundColor: "#f3967c1f",
      border: "1px solid rgba(107, 114, 128, 0.25)",
    };
  }
  return {
    color: color_text_primary,
    backgroundColor: "rgba(243, 156, 18, 0.14)",
    border: "1px solid rgba(243, 156, 18, 0.25)",
  };
};

// viewer stage uses dark; palette has no black → use text_primary
const stageBg = color_text_primary;

const MyRequestDetailsModal: React.FC<MyRequestDetailsModalProps> = ({ open, request, onClose }) => {
  const requestId = request?.request_id;

  const [photos, setPhotos] = useState<RequestPhoto[]>([]);
  const [docs, setDocs] = useState<RequestDoc[]>([]);

  // Photo viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Doc viewer
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerIndex, setDocViewerIndex] = useState(0);

  // blob preview url + preview text
  const [docBlobUrl, setDocBlobUrl] = useState<string>("");
  const [docTextPreview, setDocTextPreview] = useState<string>("");

  const [lastBlobUrl, setLastBlobUrl] = useState<string>("");

  const { data: photoData, fetchData: loadPhotos, loading: photosLoading } = useFetch(
    `${API_BASE}/api/file/edit/photos/${requestId}`,
    "GET",
    false
  );

  const { data: docsData, fetchData: loadDocs, loading: docsLoading } = useFetch(
    `${API_BASE}/api/file/edit/docs/${requestId}`,
    "GET",
    false
  );

  const {
    data: fileBlobData,
    fetchData: fetchFileBlob,
    loading: fileBlobLoading,
    error: fileBlobError,
  } = useFetch<any>(`${API_BASE}/api/file/doc`, "GET", false);

  const currentDoc: RequestDoc | undefined = docs[docViewerIndex];
  const currentDocMime = currentDoc?.mime_type || guessMimeFromFilename(currentDoc?.file_name) || "";

  useEffect(() => {
    if (!open) return;
    if (!requestId) return;
    loadPhotos();
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId]);

  useEffect(() => {
    setPhotos((photoData as any)?.photos || []);
  }, [photoData]);

  useEffect(() => {
    setDocs((docsData as any)?.docs || []);
  }, [docsData]);

  // cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    };
  }, [lastBlobUrl]);

  const readBlobAsText = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsText(blob);
    });

  const clearPreview = useCallback(() => {
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    setLastBlobUrl("");
    setDocBlobUrl("");
    setDocTextPreview("");
  }, [lastBlobUrl]);

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

  const handleOpenViewer = (idx: number) => {
    setStartIndex(idx);
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  const handleOpenDocViewer = (idx: number) => {
    setDocViewerIndex(idx);
    setDocViewerOpen(true);
  };

  const handlePrevDoc = async () => {
    const nextIdx = Math.max(docViewerIndex - 1, 0);
    setDocViewerIndex(nextIdx);
    await openDocAtIndex(nextIdx);
  };

  const handleNextDoc = async () => {
    const nextIdx = Math.min(docViewerIndex + 1, docs.length - 1);
    setDocViewerIndex(nextIdx);
    await openDocAtIndex(nextIdx);
  };

  useEffect(() => {
    if (!docViewerOpen) return;
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
    setLastBlobUrl(url);

    if (forcedType.startsWith("text/") || forcedType === "application/json") {
      readBlobAsText(fixedBlob)
        .then((txt) => setDocTextPreview(txt.slice(0, 200000)))
        .catch(() => setDocTextPreview(""));
    }
  }, [fileBlobData, docViewerOpen, currentDocMime]);

  const openDocInNewTab = () => {
    if (!docBlobUrl || !currentDoc) return;
    const fileName = ensureHasExtension(currentDoc?.file_name || `document_${currentDoc?.id}`, currentDocMime);

    const a = document.createElement("a");
    a.href = docBlobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Gallery items
  const galleryItems = useMemo(
    () =>
      photos.map((p) => ({
        original: getBinaryUrl(p.id),
        thumbnail: getBinaryUrl(p.id),
        description: `Photo ID: ${p.id}`,
        originalClass: "gallery-image",
      })),
    [photos]
  );

  if (!request) return null;

  // read-only button styles (no red)
  const viewBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    backgroundColor: color_white,
    color: color_text_secondary,
    borderColor: color_border,
    borderRadius: 1,
    px: 2,
    "&:hover": {
      backgroundColor: color_background,
      borderColor: color_text_secondary,
    },
  };

  const primaryBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    backgroundColor: color_secondary,
    color: color_white,
    borderRadius: 1,
    px: 2,
    "&:hover": { backgroundColor: color_secondary_dark },
  };

  const closeBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    backgroundColor: color_white,
    color: color_text_secondary,
    border: `1px solid ${color_border}`,
    borderRadius: 1,
    px: 2.25,
    "&:hover": { backgroundColor: color_background },
  };

  return (
    <>
      {/* MAIN DETAILS MODAL */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: color_white,
            border: `1px solid ${color_border}`,
            boxShadow: "0px 18px 48px rgba(0,0,0,0.18)",
          },
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, color: color_text_primary, fontSize: "1.05rem" }}>
                Request #{request.request_id}
              </Typography>
              <Typography sx={{ mt: 0.5, color: color_text_light, fontSize: "0.8rem", fontWeight: 700 }}>
                Review the changes and uploaded files.
              </Typography>
            </Box>

            <Button onClick={onClose} variant="outlined" startIcon={<CloseIcon />} sx={closeBtnSx}>
              Close
            </Button>
          </Box>
        </DialogTitle>

        <Divider sx={{ borderColor: color_border }} />

        <DialogContent sx={{ p: 2, backgroundColor: color_background }}>
          {/* Changes Table */}
          <Box
            sx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
            }}
          >
            <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: "transparent" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: color_background }}>
                    <TableCell sx={{ fontWeight: 900, color: color_text_secondary, py: 1 }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: color_text_secondary, py: 1 }}>Field</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: color_text_secondary, py: 1 }}>Old</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: color_text_secondary, py: 1 }}>New</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(request.details || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ py: 2 }}>
                        <Typography sx={{ color: color_text_light, fontWeight: 800 }}>
                          No field changes in this request.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (request.details || []).map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell sx={{ py: 1, color: color_text_secondary, fontWeight: 800 }}>{d.row_id}</TableCell>
                        <TableCell sx={{ py: 1, color: color_text_secondary, fontWeight: 800 }}>{d.field_name}</TableCell>
                        <TableCell sx={{ py: 1, color: color_text_light, fontWeight: 800 }}>
                          {d.old_value ? d.old_value : <i>(empty)</i>}
                        </TableCell>
                        <TableCell sx={{ py: 1, color: color_text_primary, fontWeight: 900 }}>
                          {d.new_value ? d.new_value : <i>(empty)</i>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Photos */}
          <Typography sx={{ mt: 0.5, mb: 1, fontWeight: 900, color: color_text_primary, fontSize: "0.95rem" }}>
            Uploaded Photos
          </Typography>

          <Box
            sx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
              mb: 2,
            }}
          >
            {photosLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontWeight: 800, color: color_text_primary }}>Loading photos...</Typography>
              </Box>
            ) : photos.length === 0 ? (
              <Typography sx={{ color: color_text_light, fontWeight: 800 }}>No photos submitted.</Typography>
            ) : (
              <Grid container spacing={1.5}>
                {photos.map((photo, idx) => {
                  const st = deriveStatus(request?.status, photo?.is_approved);
                  return (
                    <Grid key={photo.id}>
                      <Card
                        sx={{
                          width: 160,
                          borderRadius: 2,
                          cursor: "pointer",
                          overflow: "hidden",
                          border: `2px solid ${color_border}`,
                          backgroundColor: color_white,
                          "&:hover": { boxShadow: "0 8px 26px rgba(0,0,0,0.12)" },
                        }}
                        onClick={() => handleOpenViewer(idx)}
                      >
                        <CardMedia component="img" height="110" image={getBinaryUrl(photo.id)} sx={{ objectFit: "cover" }} />
                        <Box sx={{ p: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Chip size="small" label={st.toUpperCase()} sx={{ ...chipSx(st), fontWeight: 900 }} />
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, color: color_text_light }}>
                            ID: {photo.id}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {/* Documents */}
          <Typography sx={{ mt: 0.5, mb: 1, fontWeight: 900, color: color_text_primary, fontSize: "0.95rem" }}>
            Uploaded Documents
          </Typography>

          <Box
            sx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
            }}
          >
            {docsLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontWeight: 800, color: color_text_primary }}>Loading documents...</Typography>
              </Box>
            ) : docs.length === 0 ? (
              <Typography sx={{ color: color_text_light, fontWeight: 800 }}>No documents submitted.</Typography>
            ) : (
              <Grid container spacing={1.5}>
                {docs.map((doc, idx) => {
                  const st = deriveStatus(request?.status, doc?.is_approved);
                  return (
                    <Grid key={doc.id}>
                      <Box
                        sx={{
                          border: `1px solid ${color_border}`,
                          borderRadius: 2,
                          p: 1.5,
                          backgroundColor: color_white,
                          width: 340,
                          maxWidth: "85vw",
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                          <Chip size="small" label={categoryLabel(doc.document_category)} sx={{ fontWeight: 900 }} />
                          <Chip size="small" label={formatBytes(doc.size_bytes)} sx={{ fontWeight: 900 }} />
                          <Chip size="small" label={st.toUpperCase()} sx={{ ...chipSx(st), fontWeight: 900 }} />
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, color: color_text_light }}>
                            ID: {doc.id}
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            mt: 1,
                            fontWeight: 900,
                            color: color_text_secondary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={doc.file_name}
                        >
                          {doc.file_name}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 1, mt: 1.25, flexWrap: "wrap" }}>
                          <Button variant="outlined" onClick={() => handleOpenDocViewer(idx)} sx={viewBtnSx}>
                            View
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <PhotoViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photos={photos}
        startIndex={startIndex}
        mode="view"
        showThumbnails={true}
        showStatusPill={false}
        only_approved={false}
      />

      <DocumentViewerModal
        open={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        docs={docs}
        startIndex={docViewerIndex}
        mode="view"
        apiBase={API_BASE}
        blobEndpointPath="/api/file/doc"
        showApproveReject={false}
        bottomOpenLabel="View"
        only_approved={false}
      />
    </>
  );
};

export default MyRequestDetailsModal;
