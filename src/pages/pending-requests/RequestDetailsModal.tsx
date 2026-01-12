import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TextField,
  Typography,
  Grid,
  Card,
  CardMedia,
  Box,
  Chip,
  CircularProgress,
} from "@mui/material";

import useFetch from "../../hooks/useFetch";
import toast from "react-hot-toast";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

interface ApproveRequestModalProps {
  open: boolean;
  request: any;
  onClose: () => void;
  onApproved?: () => void;
}

type ReviewStatus = "approved" | "rejected" | null;

interface RequestPhoto {
  id: number;
  status?: ReviewStatus;
  file_name?: string;
  size_bytes?: number;
  mime_type?: string;
  document_type?: "photo" | "document";
  document_category?: string;
}

interface RequestDoc {
  id: number;
  file_name: string;
  size_bytes: number;
  mime_type: string;
  document_type: "document";
  document_category: string;
  status?: ReviewStatus;
}

const API_BASE = "https://nordikdriveapi-724838782318.us-west1.run.app";

// NOTE:
// For images shown in card grid + ImageGallery we still use direct URL (no auth headers needed if cookie works).
// If you still get 401 for images too, you must load them as blob via useFetch (same way as docs).
const getBinaryUrl = (id: number) => `${API_BASE}/api/file/photo/${id}`;

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
  if (n.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (n.endsWith(".doc")) return "application/msword";
  if (n.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
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
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx";
  if (mime === "application/vnd.ms-excel") return ".xls";
  if (mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return ".xlsx";
  if (mime.startsWith("text/")) return ".txt";
  return "";
}

function ensureHasExtension(fileName: string, mime?: string) {
  const hasDot = fileName.includes(".");
  if (hasDot) return fileName;
  const ext = extensionFromMime(mime);
  return ext ? `${fileName}${ext}` : fileName;
}

const ApproveRequestModal: React.FC<ApproveRequestModalProps> = ({ open, request, onClose, onApproved }) => {
  const [editableDetails, setEditableDetails] = useState<any[]>([]);
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

  // keep last created blob URL so we can revoke it safely
  const [lastBlobUrl, setLastBlobUrl] = useState<string>("");
  const handledApproveRef = React.useRef(false);
  const submitLockRef = React.useRef(false);


  // ---------------------------------------
  // APIs
  // ---------------------------------------
  const { data: approvalResponse, fetchData: approveRequest, loading } = useFetch(
    `${API_BASE}/api/file/approve/request`,
    "PUT",
    false
  );

  const { fetchData: submitReview, loading: reviewLoading } = useFetch(
    `${API_BASE}/api/file/photos/review`,
    "POST",
    false
  );

  const { data: photoData, fetchData: loadPhotos } = useFetch(
    `${API_BASE}/api/file/edit/photos/${request?.request_id}`,
    "GET",
    false
  );

  const { data: docsData, fetchData: loadDocs } = useFetch(
    `${API_BASE}/api/file/edit/docs/${request?.request_id}`,
    "GET",
    false
  );

  // ✅ Fetch doc/photo binary as blob using cookies (auth) — IMPORTANT
  // Change endpoint to your doc endpoint if needed:
  //   const blobEndpointBase = `${API_BASE}/api/file/doc`;
  // Here we’ll use `/api/file/doc` because you created GetDoc.
  const {
    data: fileBlobData,
    fetchData: fetchFileBlob,
    loading: fileBlobLoading,
    error: fileBlobError,
  } = useFetch<any>(`${API_BASE}/api/file/doc`, "GET", false);

  // ---------------------------------------
  // Derived current doc (NO hooks)
  // ---------------------------------------
  const currentDoc: RequestDoc | undefined = docs[docViewerIndex];
  const currentDocMime =
    currentDoc?.mime_type || guessMimeFromFilename(currentDoc?.file_name) || "";

  // ---------------------------------------
  // Effects
  // ---------------------------------------

  useEffect(() => {
    if (!open) return;
    if (!request?.request_id) return;

    loadPhotos();
    loadDocs();
    setEditableDetails(request.details || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?.request_id]);


  useEffect(() => {
    if ((photoData as any)?.photos) {
      setPhotos(
        (photoData as any).photos.map((p: any) => ({
          ...p,
          status: p.status ?? null,
        }))
      );
    } else {
      setPhotos([]);
    }
  }, [photoData]);

  useEffect(() => {
    if ((docsData as any)?.docs) {
      setDocs(
        (docsData as any).docs.map((d: any) => ({
          ...d,
          status: d.status ?? null,
        }))
      );
    } else {
      setDocs([]);
    }
  }, [docsData]);

  useEffect(() => {
    if (!approvalResponse) return;
    if (handledApproveRef.current) return;

    handledApproveRef.current = true;

    toast.success("Request approved successfully.");
    onApproved?.();
    onClose();

  }, [approvalResponse]);


  useEffect(() => {
    if (!open) return;
    handledApproveRef.current = false;
  }, [open, request?.request_id]);
  // cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    };
  }, [lastBlobUrl]);

  // ---------------------------------------
  // Helpers
  // ---------------------------------------
  const updateField = (index: number, value: string) => {
    const updated = [...editableDetails];
    updated[index].new_value = value;
    setEditableDetails(updated);
  };

  const borderForStatus = (status?: ReviewStatus) => {
    if (status === "approved") return "3px solid #2ecc71";
    if (status === "rejected") return "3px solid #e74c3c";
    return "2px solid transparent";
  };

  const shadowForStatus = (status?: ReviewStatus) => {
    if (status === "approved") return "0 0 8px rgba(46, 204, 113, 0.7)";
    if (status === "rejected") return "0 0 8px rgba(231, 76, 60, 0.7)";
    return undefined;
  };

  const readBlobAsText = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsText(blob);
    });

  // ---------------------------------------
  // Approve All
  // ---------------------------------------
  const handleApprove = async () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    try {
      const hasPendingPhoto = photos.some((p) => p.status === null);
      const hasPendingDoc = docs.some((d) => d.status === null);

      if ((photos.length > 0 && hasPendingPhoto) || (docs.length > 0 && hasPendingDoc)) {
        toast.error("Please approve or reject all uploaded photos and documents before approving all changes.");
        return;
      }

      const approvedIds = [...photos, ...docs]
        .filter((x: any) => x.status === "approved")
        .map((x: any) => x.id);

      const rejectedIds = [...photos, ...docs]
        .filter((x: any) => x.status === "rejected")
        .map((x: any) => x.id);

      if (approvedIds.length > 0 || rejectedIds.length > 0) {
        await submitReview({
          approved_photos: approvedIds,
          rejected_photos: rejectedIds,
        });
      }

      approveRequest({
        request_id: request.request_id,
        updates: editableDetails,
      });
    } finally {
      submitLockRef.current = false;
    }

  };

  // ---------------------------------------
  // Photos viewer
  // ---------------------------------------
  const galleryItems = photos.map((photo: RequestPhoto) => ({
    original: getBinaryUrl(photo.id),
    thumbnail: getBinaryUrl(photo.id),
    description: `Photo ID: ${photo.id}`,
    originalClass: "gallery-image",
  }));

  const handleOpenViewer = (idx: number) => {
    setStartIndex(idx);
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  const handleApproveCurrentPhoto = () => {
    setPhotos((prev) => prev.map((p, idx) => (idx === viewerIndex ? { ...p, status: "approved" } : p)));
  };

  const handleRejectCurrentPhoto = () => {
    setPhotos((prev) => prev.map((p, idx) => (idx === viewerIndex ? { ...p, status: "rejected" } : p)));
  };

  // ---------------------------------------
  // Docs viewer: load blob
  // ---------------------------------------
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

      // ✅ IMPORTANT:
      // We use your NEW useFetch param object:
      //   { path: doc.id, responseType: "blob" }
      //
      // This calls GET `${API_BASE}/api/file/doc/<id>` and returns Blob in response.data
      await fetchFileBlob(undefined, undefined, false, { path: doc.id, responseType: "blob" });
    },
    [docs, clearPreview, fetchFileBlob]
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
    const nextIdx = Math.min(docViewerIndex + 1, docs.length - 1);
    setDocViewerIndex(nextIdx);
    await openDocAtIndex(nextIdx);
  };

  const handleApproveCurrentDoc = () => {
    setDocs((prev) => prev.map((d, idx) => (idx === docViewerIndex ? { ...d, status: "approved" } : d)));
  };

  const handleRejectCurrentDoc = () => {
    setDocs((prev) => prev.map((d, idx) => (idx === docViewerIndex ? { ...d, status: "rejected" } : d)));
  };

  // ✅ Convert response to a REAL Blob + attach correct MIME type
  // This is the piece you asked “where to add?”
  useEffect(() => {
    if (!docViewerOpen) return;
    if (!fileBlobData) return;

    const rawBlob =
      fileBlobData instanceof Blob ? fileBlobData : (fileBlobData as any)?.blob instanceof Blob ? (fileBlobData as any).blob : null;

    if (!rawBlob) {
      return;
    }

    const forcedType = currentDocMime || rawBlob.type || "application/octet-stream";

    const fixedBlob = new Blob([rawBlob], { type: forcedType });
    const url = URL.createObjectURL(fixedBlob);

    setDocBlobUrl(url);
    setLastBlobUrl(url);

    // text preview for txt/csv/json
    if (forcedType.startsWith("text/") || forcedType === "application/json") {
      readBlobAsText(fixedBlob)
        .then((txt) => setDocTextPreview(txt.slice(0, 200000)))
        .catch(() => setDocTextPreview(""));
    }
  }, [fileBlobData, docViewerOpen, currentDocMime]);

  // ✅ Open in new tab with correct filename + extension (NO random GUID download name)
  const openDocInNewTab = () => {
    if (!docBlobUrl || !currentDoc) {
      toast.error("Document not loaded yet.");
      return;
    }

    const fileName = ensureHasExtension(currentDoc.file_name || `document_${currentDoc.id}`, currentDocMime);

    // Create <a download> so browser preserves filename
    const a = document.createElement("a");
    a.href = docBlobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = fileName; // if browser decides to download, it will keep proper name
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ---------------------------------------
  // Render conditions
  // ---------------------------------------
  // ✅ Hook rule fix: NO conditional hooks anywhere above this line.
  if (!request) return null;

  return (
    <>
      {/* MAIN MODAL */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: "bold" }}>Approve Edit Request #{request.request_id}</DialogTitle>

        <DialogContent dividers>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            User: <strong>{request.firstname} {request.lastname}</strong>
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            File: <strong>{request.details?.[0]?.filename}</strong>
          </Typography>

          {/* Consent blocks */}
          <Box
            sx={{
              mt: 1,
              mb: 1,
              p: 1.25,
              borderRadius: 1,
              border: "1px solid rgba(0,0,0,0.15)",
              backgroundColor: request?.consent ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>
              {request?.consent
                ? "User has given consent to display additional photos in the CSAA gallery."
                : "User has not given consent to display additional photos in the CSAA gallery."}
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 0,
              mb: 2,
              p: 1.25,
              borderRadius: 1,
              border: "1px solid rgba(0,0,0,0.15)",
              backgroundColor: request?.archive_consent ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>
              {request?.archive_consent
                ? "User has given consent to archive additional information and documents at the Shingwauk Residential Schools Centre."
                : "User has NOT given consent to archive additional information and documents at the Shingwauk Residential Schools Centre."}
            </Typography>
          </Box>

          {/* TABLE – FIELD CHANGES */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Row</strong></TableCell>
                <TableCell><strong>Field Name</strong></TableCell>
                <TableCell><strong>Old Value</strong></TableCell>
                <TableCell><strong>New Value</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {editableDetails.map((d, index) => (
                <TableRow key={d.id}>
                  <TableCell>{d.row_id}</TableCell>
                  <TableCell>{d.field_name}</TableCell>
                  <TableCell>{d.old_value || <i>(empty)</i>}</TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={d.new_value}
                      onChange={(e) => updateField(index, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* PHOTOS SECTION */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: "bold" }}>
            Uploaded Photos
          </Typography>

          {photos.length === 0 && <Typography>No photos submitted.</Typography>}

          <Grid container spacing={2}>
            {photos.map((photo: RequestPhoto, idx: number) => (
              <Grid key={photo.id}>
                <Card
                  sx={{
                    width: 220,
                    borderRadius: "10px",
                    cursor: "pointer",
                    overflow: "hidden",
                    border: borderForStatus(photo.status),
                    boxShadow: shadowForStatus(photo.status),
                  }}
                  onClick={() => handleOpenViewer(idx)}
                >
                  <CardMedia component="img" height="160" image={getBinaryUrl(photo.id)} style={{ objectFit: "cover" }} />
                  <Box sx={{ p: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip
                      size="small"
                      label={photo.status === "approved" ? "Approved" : photo.status === "rejected" ? "Rejected" : "Pending"}
                      color={photo.status === "approved" ? "success" : photo.status === "rejected" ? "error" : "default"}
                    />
                    <Typography variant="caption">ID: {photo.id}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* DOCUMENTS SECTION */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: "bold" }}>
            Uploaded Documents
          </Typography>

          {docs.length === 0 && <Typography>No documents submitted.</Typography>}

          <Grid container spacing={2}>
            {docs.map((doc: RequestDoc, idx: number) => (
              <Grid key={doc.id}>
                <Card
                  sx={{
                    width: 340,
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: borderForStatus(doc.status),
                    boxShadow: shadowForStatus(doc.status),
                  }}
                >
                  <Box sx={{ p: 1.2, display: "flex", flexDirection: "column", gap: 0.8 }}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                      <Chip size="small" label={categoryLabel(doc.document_category)} />
                      <Chip size="small" label={formatBytes(doc.size_bytes)} />
                      <Chip
                        size="small"
                        label={doc.status === "approved" ? "Approved" : doc.status === "rejected" ? "Rejected" : "Pending"}
                        color={doc.status === "approved" ? "success" : doc.status === "rejected" ? "error" : "default"}
                      />
                      <Typography variant="caption">ID: {doc.id}</Typography>
                    </Box>

                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={doc.file_name}
                    >
                      {doc.file_name}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleOpenDocViewer(idx)}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                      >
                        View
                      </Button>

                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, status: "approved" } : d)))}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                      >
                        Approve
                      </Button>

                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, status: "rejected" } : d)))}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={loading || reviewLoading}>
            {loading ? "Approving..." : "Approve All Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FULLSCREEN PHOTO VIEWER */}
      {viewerOpen && (
        <Dialog open={true} onClose={() => setViewerOpen(false)} fullScreen>
          <DialogTitle
            sx={{ fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            Photo Viewer
            <Button onClick={() => setViewerOpen(false)}>Close</Button>
          </DialogTitle>

          <DialogContent sx={{ background: "#000" }}>
            <ImageGallery
              items={galleryItems}
              startIndex={startIndex}
              showPlayButton={false}
              showFullscreenButton={false}
              showThumbnails={false}
              onSlide={(currentIndex) => setViewerIndex(currentIndex)}
            />

            {photos[viewerIndex] && (
              <div
                style={{
                  position: "fixed",
                  top: 80,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "6px 16px",
                  borderRadius: "16px",
                  background:
                    photos[viewerIndex].status === "approved"
                      ? "rgba(46, 204, 113, 0.9)"
                      : photos[viewerIndex].status === "rejected"
                        ? "rgba(231, 76, 60, 0.9)"
                        : "rgba(0,0,0,0.4)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {photos[viewerIndex].status === "approved"
                  ? "Approved"
                  : photos[viewerIndex].status === "rejected"
                    ? "Rejected"
                    : "Pending Review"}
              </div>
            )}

            <div
              style={{
                position: "fixed",
                bottom: "30px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "20px",
              }}
            >
              <Button variant="contained" color="success" sx={{ padding: "12px 32px" }} onClick={handleApproveCurrentPhoto}>
                Approve Photo
              </Button>

              <Button variant="contained" color="error" sx={{ padding: "12px 32px" }} onClick={handleRejectCurrentPhoto}>
                Reject Photo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* FULLSCREEN DOCUMENT VIEWER */}
      {docViewerOpen && currentDoc && (
        <Dialog
          open={true}
          onClose={() => {
            setDocViewerOpen(false);
            clearPreview();
          }}
          fullScreen
        >
          <DialogTitle
            sx={{
              fontWeight: 900,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <span>Document Viewer</span>
              <Chip size="small" label={categoryLabel(currentDoc.document_category)} />
              <Chip size="small" label={formatBytes(currentDoc.size_bytes)} />
              <Chip
                size="small"
                label={currentDoc.status === "approved" ? "Approved" : currentDoc.status === "rejected" ? "Rejected" : "Pending"}
                color={currentDoc.status === "approved" ? "success" : currentDoc.status === "rejected" ? "error" : "default"}
              />
            </Box>

            <Button onClick={() => { setDocViewerOpen(false); clearPreview(); }} variant="contained" color="error" sx={{ fontWeight: 900 }}>
              Close
            </Button>
          </DialogTitle>

          <DialogContent sx={{ background: "#111", color: "#fff" }}>
            <Box sx={{ mb: 1 }}>
              <Typography sx={{ fontWeight: 900 }}>{currentDoc.file_name}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {currentDocMime || currentDoc.mime_type} • ID: {currentDoc.id} • {docViewerIndex + 1}/{docs.length}
              </Typography>
            </Box>

            <Box
              sx={{
                mt: 2,
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#0b0b0b",
                overflow: "hidden",
                minHeight: "70vh",
              }}
            >
              {fileBlobLoading && (
                <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Loading document...</Typography>
                </Box>
              )}

              {!fileBlobLoading && fileBlobError && (
                <Box sx={{ p: 3 }}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Failed to load document</Typography>
                  <Typography sx={{ opacity: 0.85 }}>{String(fileBlobError)}</Typography>
                </Box>
              )}

              {!fileBlobLoading && docBlobUrl && (
                <>
                  {/* PDF */}
                  {isPdfMime(currentDocMime) && (
                    <iframe
                      title="pdf-viewer"
                      src={docBlobUrl}
                      style={{ width: "100%", height: "78vh", border: 0, background: "#fff" }}
                    />
                  )}

                  {/* Images */}
                  {isImageMime(currentDocMime) && (
                    <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                      <img
                        src={docBlobUrl}
                        style={{ maxWidth: "100%", maxHeight: "78vh", objectFit: "contain" }}
                        alt={currentDoc.file_name}
                      />
                    </Box>
                  )}

                  {/* DOC/DOCX + Excel: browser can't render reliably without extra libs.
                      We show message + open in new tab/download. */}
                  {(isDocxMime(currentDocMime) || isExcelMime(currentDocMime)) && (
                    <Box sx={{ p: 3 }}>
                      <Typography sx={{ fontWeight: 800, mb: 1 }}>
                        Preview not supported for {isDocxMime(currentDocMime) ? "DOC/DOCX" : "Excel"} in browser.
                      </Typography>
                      <Typography sx={{ opacity: 0.85, mb: 2 }}>
                        Use “Open in New Tab” to download/open it with your system app.
                      </Typography>
                      <Button variant="contained" onClick={openDocInNewTab} sx={{ fontWeight: 900 }}>
                        Open in New Tab
                      </Button>
                    </Box>
                  )}

                  {/* Text-like (csv/json/txt) */}
                  {!isPdfMime(currentDocMime) &&
                    !isImageMime(currentDocMime) &&
                    !isDocxMime(currentDocMime) &&
                    !isExcelMime(currentDocMime) &&
                    docTextPreview && (
                      <Box sx={{ p: 2 }}>
                        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                          {docTextPreview}
                        </pre>
                      </Box>
                    )}

                  {/* Fallback */}
                  {!isPdfMime(currentDocMime) &&
                    !isImageMime(currentDocMime) &&
                    !isDocxMime(currentDocMime) &&
                    !isExcelMime(currentDocMime) &&
                    !docTextPreview && (
                      <Box sx={{ p: 3 }}>
                        <Typography sx={{ fontWeight: 800, mb: 1 }}>
                          Preview may not be supported for this file type.
                        </Typography>
                        <Typography sx={{ opacity: 0.85, mb: 2 }}>
                          You can still open it in a new tab.
                        </Typography>
                        <Button variant="contained" onClick={openDocInNewTab} sx={{ fontWeight: 900 }}>
                          Open in New Tab
                        </Button>
                      </Box>
                    )}
                </>
              )}
            </Box>

            {/* Bottom controls */}
            <Box
              sx={{
                position: "fixed",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 2,
                alignItems: "center",
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 3,
                p: 1.5,
                backdropFilter: "blur(8px)",
              }}
            >
              <Button variant="contained" onClick={handlePrevDoc} disabled={docViewerIndex === 0 || fileBlobLoading} sx={{ fontWeight: 900 }}>
                ◀ Prev
              </Button>

              <Button variant="contained" color="success" onClick={handleApproveCurrentDoc} sx={{ fontWeight: 900, px: 3 }} disabled={fileBlobLoading}>
                Approve
              </Button>

              <Button variant="contained" color="error" onClick={handleRejectCurrentDoc} sx={{ fontWeight: 900, px: 3 }} disabled={fileBlobLoading}>
                Reject
              </Button>

              <Button
                variant="outlined"
                onClick={openDocInNewTab}
                sx={{ fontWeight: 900, color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
                disabled={!docBlobUrl}
              >
                ↗
              </Button>

              <Button
                variant="contained"
                onClick={handleNextDoc}
                disabled={docViewerIndex === docs.length - 1 || fileBlobLoading}
                sx={{ fontWeight: 900 }}
              >
                Next ▶
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ApproveRequestModal;
