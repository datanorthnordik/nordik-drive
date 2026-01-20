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
  Divider,
  TableContainer,
  Paper,
} from "@mui/material";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import useFetch from "../../hooks/useFetch";
import toast from "react-hot-toast";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

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
  color_success,
  color_error,
  color_warning,
} from "../../constants/colors";
import PhotoViewerModal from "../viewers/PhotoViewer";
import DocumentViewerModal from "../viewers/DocumentViewer";

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

// For images shown in card grid + ImageGallery
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

const ApproveRequestModal: React.FC<ApproveRequestModalProps> = ({
  open,
  request,
  onClose,
  onApproved,
}) => {
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

  // blob fetch (doc viewer)
  const {
    data: fileBlobData,
    fetchData: fetchFileBlob,
    loading: fileBlobLoading,
    error: fileBlobError,
  } = useFetch<any>(`${API_BASE}/api/file/doc`, "GET", false);


  const handleOpenViewer = (idx: number) => {
    setStartIndex(idx);
    setViewerOpen(true);
  };



  const handleApprovePhotoById = (id: number) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
    );
  };

  const handleRejectPhotoById = (id: number) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "rejected" } : p))
    );
  };


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
  }, [approvalResponse, onApproved, onClose]);

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
    if (status === "approved") return `3px solid ${color_success}`;
    if (status === "rejected") return `3px solid ${color_error}`;
    return "2px solid transparent";
  };

  const shadowForStatus = (status?: ReviewStatus) => {
    if (status === "approved") return "0 0 8px rgba(39, 174, 96, 0.35)";
    if (status === "rejected") return "0 0 8px rgba(231, 76, 60, 0.35)";
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
  // Button styles (palette locked to your constants)
  // ---------------------------------------
  const approveBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    backgroundColor: color_secondary,
    color: color_white,
    borderRadius: 1,
    px: 2.25,
    "&:hover": { backgroundColor: color_secondary_dark },
  };

  const rejectBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    backgroundColor: color_primary,
    color: color_white,
    borderRadius: 1,
    px: 2.25,
    "&:hover": { backgroundColor: color_primary_dark },
  };

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

  const cancelBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    backgroundColor: color_white,
    color: color_text_secondary,
    border: `1px solid ${color_border}`,
    borderRadius: 1,
    px: 2.25,
    "&:hover": { backgroundColor: color_background },
  };

  const statusChipSx = (status?: ReviewStatus) => ({
    height: 22,
    fontSize: "0.72rem",
    fontWeight: 900,
    borderRadius: "999px",
    color:
      status === "approved"
        ? color_success
        : status === "rejected"
          ? color_primary
          : color_text_light,
    backgroundColor:
      status === "approved"
        ? "rgba(39, 174, 96, 0.12)"
        : status === "rejected"
          ? "rgba(166, 29, 51, 0.12)"
          : "rgba(107, 114, 128, 0.12)",
    border:
      status === "approved"
        ? `1px solid rgba(39, 174, 96, 0.25)`
        : status === "rejected"
          ? `1px solid rgba(166, 29, 51, 0.25)`
          : `1px solid rgba(107, 114, 128, 0.25)`,
  });

  const infoRowSx = {
    display: "flex",
    gap: 1,
    alignItems: "baseline",
    flexWrap: "wrap" as const,
  };

  const labelSx = {
    fontSize: "0.78rem",
    fontWeight: 900,
    color: color_text_light,
    minWidth: 42,
  };

  const valueSx = {
    fontSize: "0.86rem",
    fontWeight: 900,
    color: color_text_primary,
  };

  const noticeBoxSx = (type: "warn" | "ok") => ({
    mt: 1,
    p: 1.1,
    borderRadius: 1,
    border: `1px solid ${type === "warn" ? "rgba(243,156,18,0.35)" : "rgba(39,174,96,0.35)"
      }`,
    backgroundColor:
      type === "warn" ? "rgba(243,156,18,0.18)" : "rgba(39,174,96,0.12)",
    display: "flex",
    gap: 1,
    alignItems: "flex-start",
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

      if (
        (photos.length > 0 && hasPendingPhoto) ||
        (docs.length > 0 && hasPendingDoc)
      ) {
        toast.error(
          "Please approve or reject all uploaded photos and documents before approving all changes."
        );
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
  // Photos viewer (logic kept)
  // ---------------------------------------
  const galleryItems = photos.map((photo: RequestPhoto) => ({
    original: getBinaryUrl(photo.id),
    thumbnail: getBinaryUrl(photo.id),
    description: `Photo ID: ${photo.id}`,
    originalClass: "gallery-image",
  }));




  // ---------------------------------------
  // Docs viewer: load blob (logic kept)
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
      await fetchFileBlob(undefined, undefined, false, {
        path: doc.id,
        responseType: "blob",
      });
    },
    [docs, clearPreview, fetchFileBlob]
  );


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

  const handleApproveCurrentDoc = () => {
    setDocs((prev) =>
      prev.map((d, idx) =>
        idx === docViewerIndex ? { ...d, status: "approved" } : d
      )
    );
  };

  const handleRejectCurrentDoc = () => {
    setDocs((prev) =>
      prev.map((d, idx) =>
        idx === docViewerIndex ? { ...d, status: "rejected" } : d
      )
    );
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
    if (!docBlobUrl || !currentDoc) {
      toast.error("Document not loaded yet.");
      return;
    }

    const fileName = ensureHasExtension(
      currentDoc?.file_name || `document_${currentDoc?.id}`,
      currentDocMime
    );

    const a = document.createElement("a");
    a.href = docBlobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ✅ Hook rule safe: NO conditional hooks above
  if (!request) return null;

  // ---------------------------
  // MAIN MODAL (REDESIGNED)
  // ---------------------------
  return (
    <>
      {/* MAIN MODAL */}
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
          <Typography sx={{ fontWeight: 900, color: color_text_primary, fontSize: "1.05rem" }}>
            Approve Edit Request #{request.request_id}
          </Typography>
          <Typography sx={{ mt: 0.5, color: color_text_light, fontSize: "0.8rem", fontWeight: 700 }}>
            Review the changes and uploaded files before approving.
          </Typography>
        </DialogTitle>

        <Divider sx={{ borderColor: color_border }} />

        <DialogContent
          sx={{
            p: 2,
            backgroundColor: color_background,
          }}
        >
          {/* Top Info */}
          <Box
            sx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
              mb: 1.5,
            }}
          >
            <Box sx={infoRowSx}>
              <Typography sx={labelSx}>User:</Typography>
              <Typography sx={valueSx}>
                {request.firstname} {request.lastname}
              </Typography>
            </Box>

            <Box sx={{ ...infoRowSx, mt: 0.6 }}>
              <Typography sx={labelSx}>File:</Typography>
              <Typography sx={{ ...valueSx, fontWeight: 800 }}>
                {request.details?.[0]?.filename || "(unknown file)"}
              </Typography>
            </Box>

            {/* Consent blocks (UX-style notices) */}
            <Box sx={{ mt: 1 }}>
              <Box sx={noticeBoxSx(request?.consent ? "ok" : "warn")}>
                {!request?.consent && (
                  <WarningAmberRoundedIcon sx={{ color: color_warning, mt: "1px" }} fontSize="small" />
                )}
                <Typography sx={{ fontWeight: 800, color: color_text_secondary, fontSize: "0.82rem" }}>
                  {request?.consent
                    ? "User has given consent to display additional photos in the CSAA gallery."
                    : "User has not given consent to display additional photos in the CSAA gallery."}
                </Typography>
              </Box>

              <Box sx={noticeBoxSx(request?.archive_consent ? "ok" : "warn")}>
                {!request?.archive_consent && (
                  <WarningAmberRoundedIcon sx={{ color: color_warning, mt: "1px" }} fontSize="small" />
                )}
                <Typography sx={{ fontWeight: 800, color: color_text_secondary, fontSize: "0.82rem" }}>
                  {request?.archive_consent
                    ? "User has given consent to archive additional information and documents at the Shingwauk Residential Schools Centre."
                    : "User has NOT given consent to archive additional information and documents at the Shingwauk Residential Schools Centre."}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* FIELD CHANGES TABLE */}
          <Box
            sx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: "transparent" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: color_background }}>
                    <TableCell sx={{ fontWeight: 900, color: color_text_secondary, py: 1 }}>
                      Row
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, color: color_text_secondary, py: 1 }}>
                      Field Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, color: color_text_secondary, py: 1 }}>
                      Old Value
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, color: color_text_secondary, py: 1 }}>
                      New Value
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {editableDetails.map((d, index) => (
                    <TableRow key={d.id}>
                      <TableCell sx={{ py: 1, color: color_text_secondary, fontWeight: 800 }}>
                        {d.row_id}
                      </TableCell>

                      <TableCell sx={{ py: 1, color: color_text_secondary, fontWeight: 800 }}>
                        {d.field_name}
                      </TableCell>

                      <TableCell sx={{ py: 1, color: color_text_light, fontWeight: 800 }}>
                        {d.old_value ? d.old_value : <i>(empty)</i>}
                      </TableCell>

                      <TableCell sx={{ py: 0.75 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={d.new_value}
                          onChange={(e) => updateField(index, e.target.value)}
                          sx={{
                            backgroundColor: color_white,
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                              fontWeight: 800,
                              color: color_text_secondary,
                              "& fieldset": { borderColor: color_border },
                              "&:hover fieldset": { borderColor: color_text_secondary },
                              "&.Mui-focused fieldset": { borderColor: color_secondary },
                            },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* PHOTOS SECTION */}
          <Typography
            sx={{
              mt: 2,
              mb: 1,
              fontWeight: 900,
              color: color_text_primary,
              fontSize: "0.95rem",
            }}
          >
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
            {photos.length === 0 ? (
              <Typography sx={{ color: color_text_light, fontWeight: 800 }}>
                No photos submitted.
              </Typography>
            ) : (
              <Grid container spacing={1.5}>
                {photos.map((photo: RequestPhoto, idx: number) => (
                  <Grid key={photo.id}>
                    <Card
                      sx={{
                        width: 160,
                        borderRadius: 2,
                        cursor: "pointer",
                        overflow: "hidden",
                        border: borderForStatus(photo.status),
                        boxShadow: shadowForStatus(photo.status),
                        backgroundColor: color_white,
                      }}
                      onClick={() => handleOpenViewer(idx)}
                    >
                      <CardMedia
                        component="img"
                        height="110"
                        image={getBinaryUrl(photo.id)}
                        sx={{ objectFit: "cover" }}
                      />
                      <Box sx={{ p: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Chip
                          size="small"
                          label={
                            photo.status === "approved"
                              ? "Approved"
                              : photo.status === "rejected"
                                ? "Rejected"
                                : "Pending"
                          }
                          sx={statusChipSx(photo.status)}
                        />
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, color: color_text_light }}>
                          ID: {photo.id}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* DOCUMENTS SECTION */}
          <Typography
            sx={{
              mt: 0.5,
              mb: 1,
              fontWeight: 900,
              color: color_text_primary,
              fontSize: "0.95rem",
            }}
          >
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
            {docs.length === 0 ? (
              <Typography sx={{ color: color_text_light, fontWeight: 800 }}>
                No documents submitted.
              </Typography>
            ) : (
              <Grid container spacing={1.5}>
                {docs.map((doc: RequestDoc, idx: number) => (
                  <Grid key={doc.id}>
                    <Box
                      sx={{
                        border: `1px solid ${color_border}`,
                        borderRadius: 2,
                        p: 1.5,
                        backgroundColor: color_white,
                        boxShadow: shadowForStatus(doc.status),
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                        <Chip size="small" label={categoryLabel(doc.document_category)} sx={{ fontWeight: 900 }} />
                        <Chip size="small" label={formatBytes(doc.size_bytes)} sx={{ fontWeight: 900 }} />
                        <Chip
                          size="small"
                          label={
                            doc.status === "approved"
                              ? "Approved"
                              : doc.status === "rejected"
                                ? "Rejected"
                                : "Pending"
                          }
                          sx={statusChipSx(doc.status)}
                        />
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
                        <Button
                          variant="outlined"
                          onClick={() => handleOpenDocViewer(idx)}
                          sx={viewBtnSx}
                        >
                          View
                        </Button>

                        <Button
                          variant="contained"
                          onClick={() =>
                            setDocs((prev) =>
                              prev.map((d, i) =>
                                i === idx ? { ...d, status: "approved" } : d
                              )
                            )
                          }
                          sx={approveBtnSx}
                        >
                          Approve
                        </Button>

                        <Button
                          variant="contained"
                          onClick={() =>
                            setDocs((prev) =>
                              prev.map((d, i) =>
                                i === idx ? { ...d, status: "rejected" } : d
                              )
                            )
                          }
                          sx={rejectBtnSx}
                        >
                          Reject
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            backgroundColor: color_white,
            borderTop: `1px solid ${color_border}`,
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button onClick={onClose} sx={cancelBtnSx}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleApprove}
            disabled={loading || reviewLoading}
            sx={approveBtnSx}
          >
            {loading ? "Approving..." : "Approve All Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PHOTO VIEWER (unchanged UI for now) */}

      <PhotoViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photos={photos}
        startIndex={startIndex}
        mode="review"
        onApprove={handleApprovePhotoById}
        onReject={handleRejectPhotoById}
        showThumbnails={false}
        showStatusPill={true}
        only_approved={false}
      />



      <DocumentViewerModal
        open={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        docs={docs}
        startIndex={docViewerIndex}
        mode="review"
        apiBase={API_BASE}
        blobEndpointPath="/api/file/doc"
        showApproveReject={true}
        onApprove={(id) =>
          setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "approved" } : d)))
        }
        onReject={(id) =>
          setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "rejected" } : d)))
        }
        bottomOpenLabel="View"
      />



    </>
  );
};

export default ApproveRequestModal;
