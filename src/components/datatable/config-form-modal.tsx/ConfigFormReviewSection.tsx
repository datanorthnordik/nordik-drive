"use client";

import React, { useMemo } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

import {
  color_border,
  color_primary,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../../constants/colors";

export type ReviewUiAction = "" | "approved" | "rejected" | "moreInfo";

export type UploadReviewDraft = {
  uploadId: number;
  kind: "photo" | "document";
  fieldKey: string;
  fileName: string;
  mimeType?: string;
  fileCategory?: string;
  fileSizeBytes?: number;
  originalComment?: string;

  reviewStatus: ReviewUiAction;
  reviewerComment: string;
  rejectionReason: string;
};

type Props = {
  uploads: UploadReviewDraft[];
  submissionComment: string;
  submissionRejectionReason: string;
  onChangeSubmissionComment: (value: string) => void;
  onChangeSubmissionRejectionReason: (value: string) => void;
  onChangeUpload: (uploadId: number, patch: Partial<UploadReviewDraft>) => void;
};

const actionBtnSx = (active: boolean, tone: "approve" | "reject" | "more") => {
  const bg =
    tone === "approve" ? color_secondary : tone === "reject" ? color_primary : color_white;
  const hover =
    tone === "approve" ? color_secondary_dark : tone === "reject" ? color_primary : color_white_smoke;
  const color = tone === "more" ? color_text_primary : color_white;

  return {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    px: 1.6,
    py: 0.7,
    minWidth: 120,
    border: `1px solid ${active ? bg : color_border}`,
    background: active ? bg : tone === "more" ? color_white : `${bg}18`,
    color,
    "&:hover": {
      background: active ? hover : tone === "more" ? color_white_smoke : `${bg}26`,
    },
  };
};

function UploadCard({
  item,
  onChange,
}: {
  item: UploadReviewDraft;
  onChange: (uploadId: number, patch: Partial<UploadReviewDraft>) => void;
}) {
  const showRejectionReason = item.reviewStatus === "rejected";

  return (
    <Box
      sx={{
        border: `1px solid ${color_border}`,
        borderRadius: "12px",
        background: color_white,
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
            {item.fileName || `${item.kind} #${item.uploadId}`}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: color_text_secondary }}>
            Upload ID: {item.uploadId} • {item.kind === "photo" ? "Photo" : "Document"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            onClick={() => onChange(item.uploadId, { reviewStatus: "approved", rejectionReason: "" })}
            sx={actionBtnSx(item.reviewStatus === "approved", "approve")}
          >
            Approve
          </Button>

          <Button
            onClick={() => onChange(item.uploadId, { reviewStatus: "rejected" })}
            sx={actionBtnSx(item.reviewStatus === "rejected", "reject")}
          >
            Reject
          </Button>

          <Button
            onClick={() => onChange(item.uploadId, { reviewStatus: "moreInfo", rejectionReason: "" })}
            sx={actionBtnSx(item.reviewStatus === "moreInfo", "more")}
          >
            Need More Info
          </Button>
        </Box>
      </Box>

      {(item.originalComment || "").trim() ? (
        <Box
          sx={{
            border: `1px solid ${color_border}`,
            borderRadius: "10px",
            background: "rgba(2, 6, 23, 0.03)",
            px: 1.25,
            py: 1,
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, color: color_text_secondary, mb: 0.25 }}>
            Original Comment
          </Typography>
          <Typography sx={{ fontWeight: 700, color: color_text_primary, whiteSpace: "pre-wrap" }}>
            {item.originalComment}
          </Typography>
        </Box>
      ) : null}

      <TextField
        fullWidth
        size="small"
        label="Reviewer Comment"
        value={item.reviewerComment}
        onChange={(e) => onChange(item.uploadId, { reviewerComment: e.target.value })}
        multiline
        minRows={2}
      />

      {showRejectionReason ? (
        <TextField
          fullWidth
          required
          size="small"
          label="Rejection Reason"
          value={item.rejectionReason}
          onChange={(e) => onChange(item.uploadId, { rejectionReason: e.target.value })}
          multiline
          minRows={2}
        />
      ) : null}
    </Box>
  );
}

export default function ConfigFormReviewSection({
  uploads,
  submissionComment,
  submissionRejectionReason,
  onChangeSubmissionComment,
  onChangeSubmissionRejectionReason,
  onChangeUpload,
}: Props) {
  const photos = useMemo(() => uploads.filter((u) => u.kind === "photo"), [uploads]);
  const documents = useMemo(() => uploads.filter((u) => u.kind === "document"), [uploads]);

  return (
    <Box
      sx={{
        mt: 1,
        border: `1px solid ${color_border}`,
        borderRadius: "14px",
        background: color_white_smoke,
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: color_text_primary }}>
        Review
      </Typography>

      <Box
        sx={{
          border: `1px solid ${color_border}`,
          borderRadius: "12px",
          background: color_white,
          p: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 1.25,
        }}
      >
        <TextField
          fullWidth
          size="small"
          label="Common Reviewer Comment"
          value={submissionComment}
          onChange={(e) => onChangeSubmissionComment(e.target.value)}
          multiline
          minRows={3}
        />

        <TextField
          fullWidth
          size="small"
          label="Common Rejection Reason"
          value={submissionRejectionReason}
          onChange={(e) => onChangeSubmissionRejectionReason(e.target.value)}
          multiline
          minRows={3}
        />
      </Box>

      {documents.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
            Document Reviews
          </Typography>

          <Box sx={{ display: "grid", gap: 1 }}>
            {documents.map((item) => (
              <UploadCard key={item.uploadId} item={item} onChange={onChangeUpload} />
            ))}
          </Box>
        </Box>
      ) : null}

      {photos.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
            Photo Reviews
          </Typography>

          <Box sx={{ display: "grid", gap: 1 }}>
            {photos.map((item) => (
              <UploadCard key={item.uploadId} item={item} onChange={onChangeUpload} />
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}