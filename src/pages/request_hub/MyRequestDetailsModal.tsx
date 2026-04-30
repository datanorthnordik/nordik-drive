"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Chip,
  Typography,
  Divider,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import useFetch from "../../hooks/useFetch";
import { API_ORIGIN } from "../../config/api";
import {
  getRequestDetailsTitle,
  REQUEST_DETAILS_NO_DOCUMENTS_TEXT,
  REQUEST_DETAILS_NO_PHOTOS_TEXT,
  REQUEST_DETAILS_REVIEW_COMMENT_LABEL,
  REQUEST_DETAILS_UPLOADED_DOCUMENTS_TITLE,
  REQUEST_DETAILS_UPLOADED_PHOTOS_TITLE,
  REQUEST_DETAILS_VIEW_SUBTITLE,
} from "./messages";
import {
  REQUEST_DETAILS_SECTION_TITLE_SX,
  REQUEST_DETAILS_SUBTITLE_SX,
  REQUEST_DETAILS_TITLE_SX,
} from "./styles";

import "react-image-gallery/styles/css/image-gallery.css";

import {
  color_secondary,
  color_border,
  color_background,
  color_text_primary,
  color_text_secondary,
  color_text_light,
  color_white,
} from "../../constants/colors";
import {
  getReviewStatusUppercaseLabel,
  normalizeReviewStatus,
  type ReviewStatusValue,
} from "../../constants/statuses";
import PhotoViewerModal from "../viewers/PhotoViewer";
import DocumentViewerModal from "../viewers/DocumentViewer";
import { PhotoGrid } from "../../components/shared/PhotoGrids";
import { DocumentGrid } from "../../components/shared/DocumentGrids";



interface MyRequestDetailsModalProps {
  open: boolean;
  request: any;
  onClose: () => void;
}

type ReviewStatus = ReviewStatusValue;

interface RequestPhoto {
  id: number;
  file_name?: string;
  size_bytes?: number;
  mime_type?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  status: ReviewStatus;
  photo_comment?: string
  reviewer_comment?: string;
}

interface RequestDoc {
  id: number;
  file_name: string;
  size_bytes: number;
  mime_type?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  document_category?: string;
  status: ReviewStatus;
  reviewer_comment?: string;
}

const getBinaryUrl = (id: number) => `${API_ORIGIN}/api/file/photo/${id}`;
const getDocumentBinaryUrl = (id: number) => `${API_ORIGIN}/api/file/doc/${id}`;

const getDetailReviewStatus = (detail: any): ReviewStatusValue =>
  normalizeReviewStatus(detail?.status ?? detail?.review_status);

const getDetailReviewerComment = (detail: any) =>
  String(detail?.reviewer_comment ?? detail?.review_comment ?? "").trim();

// viewer stage uses dark; palette has no black → use text_primary
const MyRequestDetailsModal: React.FC<MyRequestDetailsModalProps> = ({ open, request, onClose }) => {
  const requestId = request?.request_id;
  const requestReviewerComment = String(request?.reviewer_comment || "").trim();

  const [photos, setPhotos] = useState<RequestPhoto[]>([]);
  const [docs, setDocs] = useState<RequestDoc[]>([]);

  // Photo viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  // Doc viewer
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerIndex, setDocViewerIndex] = useState(0);

  const { data: photoData, fetchData: loadPhotos, loading: photosLoading } = useFetch(
    `${API_ORIGIN}/api/file/edit/photos/${requestId}`,
    "GET",
    false
  );

  const { data: docsData, fetchData: loadDocs, loading: docsLoading } = useFetch(
    `${API_ORIGIN}/api/file/edit/docs/${requestId}`,
    "GET",
    false
  );

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

  const handleOpenViewer = (idx: number) => {
    setStartIndex(idx);
    setViewerOpen(true);
  };

  const handleOpenDocViewer = (idx: number) => {
    setDocViewerIndex(idx);
    setDocViewerOpen(true);
  };

  const photoGridItems = useMemo(
    () =>
      photos.map((p) => ({
        id: p.id,
        file_name: p.file_name,
        size_bytes: p.size_bytes,
        mime_type: p.mime_type,
        status: p.status,
        photo_comment: p.photo_comment,
        reviewer_comment: p.reviewer_comment
      })),
    [photos]
  );

  const docGridItems = useMemo(
    () =>
      docs.map((d) => ({
        id: d.id,
        file_name: d.file_name,
        filename: d.file_name,
        size_bytes: d.size_bytes,
        mime_type: d.mime_type,
        document_category: d.document_category,
        status: d.status,
        reviewer_comment: d.reviewer_comment,
      })),
    [docs]
  );

  const detailStatusChipSx = (status: ReviewStatusValue) => {
    if (status === "approved") {
      return {
        backgroundColor: "rgba(39,174,96,0.14)",
        color: "#166534",
        border: "1px solid rgba(39,174,96,0.28)",
        fontWeight: 900,
      };
    }

    if (status === "rejected") {
      return {
        backgroundColor: "rgba(166,29,51,0.12)",
        color: "#A61D33",
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


  if (!request) return null;

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
              <Typography sx={REQUEST_DETAILS_TITLE_SX}>
                {getRequestDetailsTitle(request.request_id)}
              </Typography>
              <Typography sx={REQUEST_DETAILS_SUBTITLE_SX}>
                {REQUEST_DETAILS_VIEW_SUBTITLE}
              </Typography>
            </Box>

            <Button onClick={onClose} variant="outlined" startIcon={<CloseIcon />} sx={closeBtnSx}>
              Close
            </Button>
          </Box>
        </DialogTitle>

        <Divider sx={{ borderColor: color_border }} />

        <DialogContent sx={{ p: 2, backgroundColor: color_background }}>
          {/* Changes */}
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
                label={`${(request.details || []).length} ${(request.details || []).length === 1 ? "change" : "changes"}`}
                sx={{
                  backgroundColor: color_background,
                  color: color_text_secondary,
                  border: `1px solid ${color_border}`,
                  fontWeight: 900,
                }}
              />
            </Box>

            {(request.details || []).length === 0 ? (
              <Typography sx={{ color: color_text_light, fontWeight: 800 }}>
                No field changes in this request.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {(request.details || []).map((d: any) => {
                  const status = getDetailReviewStatus(d);
                  const reviewerComment = getDetailReviewerComment(d);

                  return (
                    <Box
                      key={d.id}
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
                          label={getReviewStatusUppercaseLabel(status)}
                          data-testid={`readonly-detail-status-${d.id}`}
                          sx={detailStatusChipSx(status)}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                          gap: 1,
                          mb: 1,
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
                            New Value
                          </Typography>
                          <Typography sx={{ color: color_text_primary, fontWeight: 900, wordBreak: "break-word" }}>
                            {d.new_value ? d.new_value : <i>(empty)</i>}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          border: `1px solid ${color_border}`,
                          borderRadius: 1,
                          p: 1,
                          backgroundColor: color_white,
                        }}
                      >
                        <Typography sx={{ color: color_text_light, fontSize: "0.72rem", fontWeight: 900, mb: 0.4 }}>
                          Reviewer Comment
                        </Typography>
                        {reviewerComment ? (
                          <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: color_text_secondary, fontWeight: 800 }}>
                            {reviewerComment}
                          </Typography>
                        ) : (
                          <Typography sx={{ color: color_text_light, fontStyle: "italic", fontWeight: 700 }}>
                            No review comment
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Photos */}
          <PhotoGrid
            title={REQUEST_DETAILS_UPLOADED_PHOTOS_TITLE}
            loading={photosLoading}
            emptyText={REQUEST_DETAILS_NO_PHOTOS_TEXT}
            photos={photoGridItems}
            getPhotoUrl={(id) => getBinaryUrl(id)}
            onOpenViewer={(idx) => handleOpenViewer(idx)}
            cardBorderColor={color_secondary} // blue border
            containerSx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
              mb: 2,
            }}
            // optional: keep your "UPPERCASE" style like old UI
            statusLabel={getReviewStatusUppercaseLabel}
            viewReviewerComment={true}
            disableReviewerCommentField={true}
          />

          {/* Documents */}
          <DocumentGrid
            title={REQUEST_DETAILS_UPLOADED_DOCUMENTS_TITLE}
            loading={docsLoading}
            emptyText={REQUEST_DETAILS_NO_DOCUMENTS_TEXT}
            documents={docGridItems}
            onOpenViewer={(idx) => handleOpenDocViewer(idx)}
            getPreviewUrl={(doc) => getDocumentBinaryUrl(Number(doc.id))}
            cardBorderColor={color_secondary} // blue border
            containerSx={{
              backgroundColor: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 2,
              p: 1.5,
            }}
            showCategoryChip={true}
            showSizeChip={true}
            showViewButton={true}
            viewLabel="View"
            viewBtnSx={viewBtnSx}
            showApproveReject={false}
            statusLabel={getReviewStatusUppercaseLabel}
            viewReviewerComment={true}
          />

          {requestReviewerComment ? (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${color_border}`,
                backgroundColor: color_white,
              }}
            >
              <Typography sx={REQUEST_DETAILS_SECTION_TITLE_SX}>
                {REQUEST_DETAILS_REVIEW_COMMENT_LABEL}
              </Typography>

              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: color_text_secondary,
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                {requestReviewerComment}
              </Typography>
            </Box>
          ) : null}

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
        apiBase={API_ORIGIN}
        blobEndpointPath="/api/file/doc"
        showApproveReject={false}
        bottomOpenLabel="View"
        only_approved={false}
      />
    </>
  );
};

export default MyRequestDetailsModal;
