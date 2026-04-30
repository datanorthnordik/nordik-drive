"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import useFetch from "../../hooks/useFetch";
import toast from "react-hot-toast";
import { API_ORIGIN } from "../../config/api";
import { getDocumentCategoryLabel } from "../../domain/documents/categories";
import {
  getReviewEditRequestTitle,
  REQUEST_DETAILS_NO_DOCUMENTS_TEXT,
  REQUEST_DETAILS_NO_PHOTOS_TEXT,
  REQUEST_DETAILS_REVIEW_COMMENT_HELPER,
  REQUEST_DETAILS_REVIEW_COMMENT_LABEL,
  REQUEST_DETAILS_REVIEW_SUBTITLE,
  REQUEST_DETAILS_UPLOADED_DOCUMENTS_TITLE,
  REQUEST_DETAILS_UPLOADED_PHOTOS_TITLE,
} from "./messages";
import {
  REQUEST_DETAILS_SECTION_TITLE_SX,
  REQUEST_DETAILS_SUBTITLE_SX,
  REQUEST_DETAILS_TITLE_SX,
} from "./styles";

// @ts-ignore
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
  color_warning,
} from "../../constants/colors";
import {
  REVIEW_STATUS_VALUES,
  isReviewDecisionStatus,
  type ReviewDecisionStatus,
} from "../../constants/statuses";
import PhotoViewerModal from "../viewers/PhotoViewer";
import DocumentViewerModal from "../viewers/DocumentViewer";
import { PhotoGrid } from "../../components/shared/PhotoGrids";
import { DocumentGrid } from "../../components/shared/DocumentGrids";

interface ApproveRequestModalProps {
  open: boolean;
  request: any;
  onClose: () => void;
  onApproved?: () => void;
}

type ReviewStatus = ReviewDecisionStatus | null;

interface RequestPhoto {
  id: number;
  status?: ReviewStatus;
  file_name?: string;
  size_bytes?: number;
  mime_type?: string;
  document_type?: "photo" | "document";
  document_category?: string;
  photo_comment?: string;
  reviewer_comment?: string;
}

interface RequestDoc {
  id: number;
  file_name: string;
  size_bytes: number;
  mime_type: string;
  document_type: "document";
  document_category: string;
  status?: ReviewStatus;
  reviewer_comment?: string;
}

type PhotoReviewInput = {
  photo_id: number;
  status: ReviewDecisionStatus;
  reviewer_comment: string;
};

// For images shown in card grid + ImageGallery
const getBinaryUrl = (id: number) => `${API_ORIGIN}/api/file/photo/${id}`;
const getDocumentBinaryUrl = (id: number) => `${API_ORIGIN}/api/file/doc/${id}`;

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const categoryLabel = (cat?: string) => {
  return getDocumentCategoryLabel(cat);
};

const normalizeInitialReviewStatus = (value: any): ReviewStatus => {
  const v = String(value || "").trim().toLowerCase();
  if (isReviewDecisionStatus(v)) return v;
  return null;
};

const normalizeEditableDetail = (detail: any) => ({
  ...detail,
  status: normalizeInitialReviewStatus(detail?.status ?? detail?.review_status),
  reviewer_comment: String(detail?.reviewer_comment ?? detail?.review_comment ?? ""),
});

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

  // request-level review
  const [requestReviewComment, setRequestReviewComment] = useState("");
  const [pendingRequestAction, setPendingRequestAction] = useState<ReviewDecisionStatus | null>(
    null
  );

  // Photo viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  // Doc viewer
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerIndex, setDocViewerIndex] = useState(0);

  // keep last created blob URL so we can revoke it safely
  const [lastBlobUrl, setLastBlobUrl] = useState<string>("");

  const handledApproveRef = useRef(false);
  const submitLockRef = useRef(false);

  // ---------------------------------------
  // APIs
  // ---------------------------------------
  const { data: reviewRequestResponse, fetchData: reviewRequest, loading: requestLoading } = useFetch(
    `${API_ORIGIN}/api/file/approve/request`,
    "PUT",
    false
  );

  const { fetchData: submitReview, loading: mediaReviewLoading } = useFetch(
    `${API_ORIGIN}/api/file/photos/review`,
    "POST",
    false
  );

  const { data: photoData, fetchData: loadPhotos } = useFetch(
    `${API_ORIGIN}/api/file/edit/photos/${request?.request_id}`,
    "GET",
    false
  );

  const { data: docsData, fetchData: loadDocs } = useFetch(
    `${API_ORIGIN}/api/file/edit/docs/${request?.request_id}`,
    "GET",
    false
  );

  // blob fetch (doc viewer) - kept so existing modal-open flow remains unchanged
  const {
    data: fileBlobData,
    fetchData: fetchFileBlob,
    error: fileBlobError,
  } = useFetch<any>(`${API_ORIGIN}/api/file/doc`, "GET", false);

  const handleOpenViewer = (idx: number) => {
    setStartIndex(idx);
    setViewerOpen(true);
  };

  const handleApprovePhotoById = (id: number) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: REVIEW_STATUS_VALUES.APPROVED }
          : p
      )
    );
  };

  const handleRejectPhotoById = (id: number) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: REVIEW_STATUS_VALUES.REJECTED }
          : p
      )
    );
  };

  const handleApproveDocById = (id: number) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: REVIEW_STATUS_VALUES.APPROVED }
          : d
      )
    );
  };

  const handleRejectDocById = (id: number) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: REVIEW_STATUS_VALUES.REJECTED }
          : d
      )
    );
  };

  const setPhotoReviewCommentById = (id: number, value: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, reviewer_comment: value } : p))
    );
  };

  const setDocReviewCommentById = (id: number, value: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, reviewer_comment: value } : d))
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
    setEditableDetails((request.details || []).map(normalizeEditableDetail));
    setRequestReviewComment(String(request?.reviewer_comment || ""));
    setPendingRequestAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?.request_id, request?.reviewer_comment]);

  useEffect(() => {
    if ((photoData as any)?.photos) {
      setPhotos(
        (photoData as any).photos.map((p: any) => ({
          ...p,
          status: normalizeInitialReviewStatus(p.status),
          reviewer_comment: String(p.reviewer_comment || ""),
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
          status: normalizeInitialReviewStatus(d.status),
          reviewer_comment: String(d.reviewer_comment || ""),
        }))
      );
    } else {
      setDocs([]);
    }
  }, [docsData]);

  useEffect(() => {
    if (!reviewRequestResponse) return;
    if (handledApproveRef.current) return;

    handledApproveRef.current = true;
    toast.success(
      pendingRequestAction === REVIEW_STATUS_VALUES.REJECTED
        ? "Request rejected successfully."
        : "Request approved successfully."
    );
    onApproved?.();
    onClose();
  }, [reviewRequestResponse, pendingRequestAction, onApproved, onClose]);

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

  useEffect(() => {
    if (fileBlobError) {
      toast.error(fileBlobError);
    }
  }, [fileBlobError]);

  // ---------------------------------------
  // Helpers
  // ---------------------------------------
  const updateField = (index: number, value: string) => {
    const updated = [...editableDetails];
    updated[index].new_value = value;
    setEditableDetails(updated);
  };

  const setDetailReviewStatus = (index: number, status: ReviewDecisionStatus) => {
    setEditableDetails((prev) =>
      prev.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, status } : detail
      )
    );
  };

  const setDetailReviewComment = (index: number, value: string) => {
    setEditableDetails((prev) =>
      prev.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, reviewer_comment: value } : detail
      )
    );
  };

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

  const statusChipSx = (status: ReviewStatus) => {
    if (status === REVIEW_STATUS_VALUES.APPROVED) {
      return {
        backgroundColor: "rgba(39,174,96,0.14)",
        color: "#166534",
        border: "1px solid rgba(39,174,96,0.28)",
        fontWeight: 900,
      };
    }

    if (status === REVIEW_STATUS_VALUES.REJECTED) {
      return {
        backgroundColor: "rgba(166,29,51,0.12)",
        color: color_primary,
        border: "1px solid rgba(166,29,51,0.24)",
        fontWeight: 900,
      };
    }

    return {
      backgroundColor: color_background,
      color: color_text_light,
      border: `1px solid ${color_border}`,
      fontWeight: 900,
    };
  };

  // ---------------------------------------
  // Request review submission
  // ---------------------------------------
  const validateBeforeSubmit = (requestStatus: ReviewDecisionStatus) => {
    const hasPendingDetail = editableDetails.some((d) => d.status === null);
    const hasPendingPhoto = photos.some((p) => p.status === null);
    const hasPendingDoc = docs.some((d) => d.status === null);

    if (editableDetails.length > 0 && hasPendingDetail) {
      toast.error("Please approve or reject all field changes before submitting the review.");
      return false;
    }

    if ((photos.length > 0 && hasPendingPhoto) || (docs.length > 0 && hasPendingDoc)) {
      toast.error("Please approve or reject all uploaded photos and documents before submitting the review.");
      return false;
    }

    const rejectedDetailWithoutComment = editableDetails.find(
      (d) =>
        d.status === REVIEW_STATUS_VALUES.REJECTED &&
        !String(d.reviewer_comment || "").trim()
    );
    if (rejectedDetailWithoutComment) {
      toast.error("Review comment is required for rejected field changes.");
      return false;
    }

    const rejectedPhotoWithoutComment = photos.find(
      (p) =>
        p.status === REVIEW_STATUS_VALUES.REJECTED &&
        !String(p.reviewer_comment || "").trim()
    );
    if (rejectedPhotoWithoutComment) {
      toast.error("Review comment is required for rejected photos.");
      return false;
    }

    const rejectedDocWithoutComment = docs.find(
      (d) =>
        d.status === REVIEW_STATUS_VALUES.REJECTED &&
        !String(d.reviewer_comment || "").trim()
    );
    if (rejectedDocWithoutComment) {
      toast.error("Review comment is required for rejected documents.");
      return false;
    }

    if (
      requestStatus === REVIEW_STATUS_VALUES.REJECTED &&
      !requestReviewComment.trim()
    ) {
      toast.error("Review comment is required when rejecting the request.");
      return false;
    }

    return true;
  };

  const handleSubmitRequestReview = async (requestStatus: ReviewDecisionStatus) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    try {
      if (!validateBeforeSubmit(requestStatus)) return;

      const reviews: PhotoReviewInput[] = [...photos, ...docs]
        .filter(
          (x: any) =>
            x.status === REVIEW_STATUS_VALUES.APPROVED ||
            x.status === REVIEW_STATUS_VALUES.REJECTED
        )
        .map((x: any) => ({
          photo_id: x.id,
          status: x.status as ReviewDecisionStatus,
          reviewer_comment: String(x.reviewer_comment || "").trim(),
        }));

      if (reviews.length > 0) {
        await submitReview({ reviews });
      }

      setPendingRequestAction(requestStatus);

      await reviewRequest({
        request_id: request.request_id,
        status: requestStatus,
        reviewer_comment: requestReviewComment.trim(),
        updates: editableDetails.map((detail) => ({
          ...detail,
          reviewer_comment: String(detail.reviewer_comment || "").trim(),
        })),
      });
    } finally {
      submitLockRef.current = false;
    }
  };

  // ---------------------------------------
  // Docs viewer: load blob (logic kept)
  // ---------------------------------------
  const clearPreview = useCallback(() => {
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    setLastBlobUrl("");
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
    openDocAtIndex(idx);
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

    setLastBlobUrl(url);
  }, [fileBlobData, docViewerOpen, currentDocMime]);

  const photoGridItems = photos.map((p) => ({
    id: p.id,
    status: p.status ?? null,
    file_name: p.file_name,
    size_bytes: p.size_bytes,
    mime_type: p.mime_type,
    photo_comment: p.photo_comment,
    reviewer_comment: p.reviewer_comment || "",
  }));

  const docGridItems = docs.map((d) => ({
    id: d.id,
    file_name: d.file_name,
    filename: d.file_name,
    size_bytes: d.size_bytes,
    mime_type: d.mime_type,
    document_category: d.document_category,
    status: d.status ?? undefined,
    reviewer_comment: d.reviewer_comment || "",
  }));

  if (!request) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        data-testid="approve-request-dialog"
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
          <Typography sx={REQUEST_DETAILS_TITLE_SX}>
            {getReviewEditRequestTitle(request.request_id)}
          </Typography>
          <Typography sx={REQUEST_DETAILS_SUBTITLE_SX}>
            {REQUEST_DETAILS_REVIEW_SUBTITLE}
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

          {/* FIELD CHANGES */}
          <Box
            sx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
                mb: 1.25,
              }}
            >
              <Typography sx={REQUEST_DETAILS_SECTION_TITLE_SX}>Field Changes</Typography>
              <Chip
                size="small"
                label={`${editableDetails.length} ${editableDetails.length === 1 ? "change" : "changes"}`}
                sx={{
                  backgroundColor: color_background,
                  color: color_text_secondary,
                  border: `1px solid ${color_border}`,
                  fontWeight: 900,
                }}
              />
            </Box>

            {editableDetails.length === 0 ? (
              <Typography sx={{ color: color_text_light, fontWeight: 800 }}>
                No field changes in this request.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {editableDetails.map((d, index) => (
                  <Box
                    key={d.id ?? index}
                    sx={{
                      border: `1px solid ${color_border}`,
                      borderRadius: 1.5,
                      p: 1.25,
                      backgroundColor: color_background,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 1.25,
                        flexWrap: "wrap",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: color_text_light, fontSize: "0.74rem", fontWeight: 900 }}>
                          Row {d.row_id}
                        </Typography>
                        <Typography sx={{ color: color_text_primary, fontWeight: 900, lineHeight: 1.35 }}>
                          {d.field_name}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={
                          d.status === REVIEW_STATUS_VALUES.APPROVED
                            ? "APPROVED"
                            : d.status === REVIEW_STATUS_VALUES.REJECTED
                              ? "REJECTED"
                              : "PENDING"
                        }
                        data-testid={`detail-status-${d.id ?? index}`}
                        sx={statusChipSx(d.status)}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 1,
                        mb: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          border: `1px solid ${color_border}`,
                          borderRadius: 1,
                          p: 1,
                          backgroundColor: color_white,
                          minWidth: 0,
                        }}
                      >
                        <Typography sx={{ color: color_text_light, fontSize: "0.72rem", fontWeight: 900, mb: 0.4 }}>
                          Old Value
                        </Typography>
                        <Typography sx={{ color: color_text_secondary, fontWeight: 800, wordBreak: "break-word" }}>
                          {d.old_value ? d.old_value : <i>(empty)</i>}
                        </Typography>
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <TextField
                          inputProps={{ "data-testid": `field-input-${index}` }}
                          fullWidth
                          size="small"
                          label="New Value"
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
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "220px 1fr" },
                        gap: 1,
                        alignItems: "start",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          size="small"
                          onClick={() => setDetailReviewStatus(index, REVIEW_STATUS_VALUES.APPROVED)}
                          sx={{ ...approveBtnSx, px: 1.4, py: 0.6, fontSize: "0.76rem" }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setDetailReviewStatus(index, REVIEW_STATUS_VALUES.REJECTED)}
                          sx={{ ...rejectBtnSx, px: 1.4, py: 0.6, fontSize: "0.76rem" }}
                        >
                          Reject
                        </Button>
                      </Box>

                      <TextField
                        inputProps={{ "data-testid": `detail-review-comment-${d.id ?? index}` }}
                        fullWidth
                        size="small"
                        label={d.status === REVIEW_STATUS_VALUES.REJECTED ? "Required when rejected" : "Reviewer Comment"}
                        value={d.reviewer_comment || ""}
                        onChange={(e) => setDetailReviewComment(index, e.target.value)}
                        multiline
                        minRows={2}
                        error={
                          d.status === REVIEW_STATUS_VALUES.REJECTED &&
                          !String(d.reviewer_comment || "").trim()
                        }
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
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* PHOTOS SECTION */}
          <PhotoGrid
            title={REQUEST_DETAILS_UPLOADED_PHOTOS_TITLE}
            loading={false}
            emptyText={REQUEST_DETAILS_NO_PHOTOS_TEXT}
            photos={photoGridItems}
            getPhotoUrl={(id) => getBinaryUrl(id)}
            onOpenViewer={(idx) => handleOpenViewer(idx)}
            showDownload={false}
            cardBorderColor={color_secondary}
            containerSx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
              mb: 2,
            }}
            showApproveReject={true}
            onApprove={handleApprovePhotoById}
            onReject={handleRejectPhotoById}
            approveBtnSx={approveBtnSx}
            rejectBtnSx={rejectBtnSx}
            showReviewerCommentField={true}
            reviewerCommentLabel={REQUEST_DETAILS_REVIEW_COMMENT_LABEL}
            onReviewerCommentChange={(id, value) => setPhotoReviewCommentById(Number(id), value)}
          />

          {/* DOCUMENTS SECTION */}
          <DocumentGrid
            title={REQUEST_DETAILS_UPLOADED_DOCUMENTS_TITLE}
            loading={false}
            emptyText={REQUEST_DETAILS_NO_DOCUMENTS_TEXT}
            documents={docGridItems}
            onOpenViewer={(idx) => handleOpenDocViewer(idx)}
            getPreviewUrl={(doc) => getDocumentBinaryUrl(Number(doc.id))}
            showCategoryChip={true}
            showSizeChip={true}
            showViewButton={true}
            viewLabel="View"
            viewBtnSx={viewBtnSx}
            showApproveReject={true}
            onApprove={handleApproveDocById}
            onReject={handleRejectDocById}
            approveBtnSx={approveBtnSx}
            rejectBtnSx={rejectBtnSx}
            showReviewerCommentField={true}
            reviewerCommentLabel={REQUEST_DETAILS_REVIEW_COMMENT_LABEL}
            onReviewerCommentChange={(id, value) => setDocReviewCommentById(Number(id), value)}
            cardBorderColor={color_secondary}
            containerSx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
            }}
          />

          {/* REQUEST REVIEW COMMENT */}
          <Box
            sx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
              mt: 2,
            }}
          >
            <Typography sx={REQUEST_DETAILS_SECTION_TITLE_SX}>
              {REQUEST_DETAILS_REVIEW_COMMENT_LABEL}
            </Typography>

            <TextField
              fullWidth
              size="small"
              label={REQUEST_DETAILS_REVIEW_COMMENT_LABEL}
              value={requestReviewComment}
              onChange={(e) => setRequestReviewComment(e.target.value)}
              multiline
              minRows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  fontWeight: 800,
                  color: color_text_secondary,
                  "& fieldset": { borderColor: color_border },
                  "&:hover fieldset": { borderColor: color_text_secondary },
                  "&.Mui-focused fieldset": { borderColor: color_secondary },
                },
              }}
              helperText={REQUEST_DETAILS_REVIEW_COMMENT_HELPER}
            />
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
          <Button data-testid="cancel-btn" onClick={onClose} sx={cancelBtnSx}>
            Cancel
          </Button>

          <Button
            data-testid="reject-request-btn"
            variant="contained"
            onClick={() =>
              void handleSubmitRequestReview(REVIEW_STATUS_VALUES.REJECTED)
            }
            disabled={requestLoading || mediaReviewLoading}
            sx={rejectBtnSx}
          >
            {requestLoading || mediaReviewLoading ? "Processing..." : "Reject Request"}
          </Button>

          <Button
            data-testid="approve-all-btn"
            variant="contained"
            onClick={() =>
              void handleSubmitRequestReview(REVIEW_STATUS_VALUES.APPROVED)
            }
            disabled={requestLoading || mediaReviewLoading}
            sx={approveBtnSx}
          >
            {requestLoading || mediaReviewLoading ? "Processing..." : "Approve All Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <PhotoViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photos={photos}
        startIndex={startIndex}
        mode="review"
        onApprove={handleApprovePhotoById}
        onReject={handleRejectPhotoById}
        onReviewerCommentChange={(photo, value) =>
          setPhotoReviewCommentById(Number(photo.id), value)
        }
        showThumbnails={false}
        showStatusPill={true}
        showCommentsPanel={true}
        showReviewerCommentField={true}
        only_approved={false}
      />

      <DocumentViewerModal
        open={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        docs={docs}
        startIndex={docViewerIndex}
        mode="review"
        apiBase={API_ORIGIN}
        blobEndpointPath="/api/file/doc"
        showApproveReject={true}
        onApprove={handleApproveDocById}
        onReject={handleRejectDocById}
        onReviewerCommentChange={(doc, value) =>
          setDocReviewCommentById(Number(doc.id), value)
        }
        showReviewerCommentField={true}
        bottomOpenLabel="View"
      />
    </>
  );
};

export default ApproveRequestModal;

// Names constants for test
export const __test__ = {
  formatBytes,
  categoryLabel,
  guessMimeFromFilename,
  extensionFromMime,
  ensureHasExtension,
  isImageMime,
  isPdfMime,
  isDocxMime,
  isExcelMime,
};
