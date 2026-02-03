"use client";

import React from "react";
import {
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";

import dayjs from "dayjs";

import {
  PhotoStatus,
  RequestDocument,
  RequestPhoto,
  photoStatusMeta,
  guessMimeFromFilename,
} from "./FileActivitiesShared";

import {
  color_border,
  color_text_light,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../constants/colors";

type Props = {
  open: boolean;
  onClose: () => void;

  apiBase: string;

  selectedRequest: any;
  createdByName: string;

  detailsLoading: boolean;
  detailsRows: any[];

  photos: RequestPhoto[];
  onOpenPhotoViewer: (idx: number) => void;

  documents: RequestDocument[];
  onOpenDocViewer: (idx: number) => void;

  detailsZipLoading: boolean;
  onDownloadAll: () => void;

  onDownloadSingle: (id: number, filename?: string, mime?: string) => void;

  primaryBtnSx: any;
  secondaryBtnSx: any;
};

export default function RequestDetailsDialog({
  open,
  onClose,
  apiBase,
  selectedRequest,
  createdByName,
  detailsLoading,
  detailsRows,
  photos,
  onOpenPhotoViewer,
  documents,
  onOpenDocViewer,
  detailsZipLoading,
  onDownloadAll,
  onDownloadSingle,
  primaryBtnSx,
  secondaryBtnSx,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: { borderRadius: "16px", overflow: "hidden", boxShadow: "0 18px 50px rgba(0,0,0,0.18)" },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          background: color_white,
          borderBottom: `1px solid ${color_border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InfoOutlinedIcon />
          Request Details #{selectedRequest?.request_id ?? "-"}
        </Box>

        <Button
          startIcon={detailsZipLoading ? <CircularProgress size={16} sx={{ color: color_white }} /> : <DownloadIcon />}
          onClick={onDownloadAll}
          disabled={!selectedRequest?.request_id || detailsZipLoading}
          sx={primaryBtnSx}
        >
          {detailsZipLoading ? "Preparing..." : "Download All"}
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ background: color_white_smoke }}>
        {!selectedRequest ? (
          <Typography sx={{ color: color_text_secondary }}>No request selected.</Typography>
        ) : (
          <>
            {/* Header cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1.25,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: "14px",
                  border: `1px solid ${color_border}`,
                  background: color_white,
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "12px",
                    background: color_white_smoke,
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${color_border}`,
                  }}
                >
                  <PersonIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, color: color_text_primary }}>Created By</Typography>
                  <Typography sx={{ fontWeight: 800, color: color_text_secondary }}>{createdByName}</Typography>
                  <Typography sx={{ fontSize: 12, color: color_text_light }}>
                    Requested By ID: {selectedRequest.requested_by ?? "-"}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 1.25,
                  borderRadius: "14px",
                  border: `1px solid ${color_border}`,
                  background: color_white,
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "12px",
                    background: color_white_smoke,
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${color_border}`,
                  }}
                >
                  <DescriptionIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, color: color_text_primary }}>File</Typography>
                  <Typography sx={{ fontWeight: 800, color: color_text_secondary }}>
                    {selectedRequest.file_name ?? "-"}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: color_text_light }}>
                    Created At:{" "}
                    {selectedRequest.created_at ? dayjs(selectedRequest.created_at).format("DD-MM-YYYY HH:mm") : "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Changes table */}
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 900 }}>
              Field Changes
            </Typography>

            {detailsLoading ? (
              <Typography sx={{ color: color_text_secondary }}>Loading changes...</Typography>
            ) : detailsRows.length === 0 ? (
              <Typography sx={{ color: color_text_secondary }}>No change rows found.</Typography>
            ) : (
              <Box
                sx={{
                  border: `1px solid ${color_border}`,
                  borderRadius: "14px",
                  overflow: "hidden",
                  background: color_white,
                  boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                }}
              >
                <Box sx={{ maxHeight: 340, overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: color_white_smoke }}>
                        <th style={{ textAlign: "left", padding: 12, fontWeight: 900, color: color_text_primary }}>
                          Field
                        </th>
                        <th style={{ textAlign: "left", padding: 12, fontWeight: 900, color: color_text_primary }}>
                          Old
                        </th>
                        <th style={{ textAlign: "left", padding: 12, fontWeight: 900, color: color_text_primary }}>
                          New
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsRows.map((d, idx) => (
                        <tr key={d.id ?? `${d.field_key}-${idx}`}>
                          <td style={{ padding: 12, borderTop: `1px solid ${color_border}`, color: color_text_primary }}>
                            {d.field_key ?? d.field_name ?? "-"}
                          </td>
                          <td style={{ padding: 12, borderTop: `1px solid ${color_border}`, color: color_text_secondary }}>
                            {d.old_value ?? <i>(empty)</i>}
                          </td>
                          <td style={{ padding: 12, borderTop: `1px solid ${color_border}`, color: color_text_secondary }}>
                            {d.new_value ?? <i>(empty)</i>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}

            {/* Photos */}
            <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 900 }}>
              Uploaded Photos
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.25 }}>
              {(["approved", "rejected", null] as PhotoStatus[]).map((s) => {
                const meta = photoStatusMeta(s);
                return (
                  <Chip
                    key={String(s)}
                    icon={meta.icon}
                    label={`${meta.label} — ${meta.helper}`}
                    color={meta.chipColor}
                    size="small"
                    sx={{ fontWeight: 900, borderRadius: "10px" }}
                  />
                );
              })}
            </Box>

            {photos.length === 0 ? (
              <Typography sx={{ color: color_text_secondary }}>No photos submitted.</Typography>
            ) : (
              <Grid container spacing={1.5}>
                {photos.map((photo, idx) => {
                  const meta = photoStatusMeta(photo.status ?? null);
                  return (
                    <Grid key={photo.id} >
                      <Card
                        sx={{
                          position: "relative",
                          borderRadius: "14px",
                          overflow: "hidden",
                          cursor: "pointer",
                          border: meta.border,
                          boxShadow: meta.shadow,
                          background: color_white,
                        }}
                        onClick={() => onOpenPhotoViewer(idx)}
                      >
                        <Box sx={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: meta.tint }} />

                        <CardMedia component="img" height="190" image={`${apiBase}/file/photo/${photo.id}`} sx={{ objectFit: "cover" }} />

                        <Box
                          sx={{
                            position: "absolute",
                            left: 10,
                            right: 10,
                            bottom: 10,
                            zIndex: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            px: 1,
                            py: 0.75,
                            borderRadius: "12px",
                            background: meta.overlayBg,
                            color: color_white,
                            fontWeight: 900,
                            backdropFilter: "blur(6px)",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            {meta.icon}
                            <span>{meta.label}</span>
                          </Box>
                          <span style={{ fontSize: 12, opacity: 0.95 }}>Photo #{photo.id}</span>
                        </Box>
                      </Card>

                      <Box sx={{ display: "flex", gap: 1, mt: 0.9, alignItems: "center", justifyContent: "space-between" }}>
                        <Chip icon={meta.icon} label={meta.label} color={meta.chipColor} size="small" sx={{ fontWeight: 900, borderRadius: "10px" }} />
                        <Button
                          size="small"
                          startIcon={<DownloadIcon fontSize="small" />}
                          onClick={() => onDownloadSingle(photo.id, `photo_${photo.id}.jpg`, "image/jpeg")}
                          sx={primaryBtnSx}
                        >
                          Download
                        </Button>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {/* Documents */}
            <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 900 }}>
              Uploaded Documents
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.25 }}>
              {(["approved", "rejected", null] as PhotoStatus[]).map((s) => {
                const meta = photoStatusMeta(s);
                return (
                  <Chip
                    key={String(s)}
                    icon={meta.icon}
                    label={`${meta.label} — ${meta.helper}`}
                    color={meta.chipColor}
                    size="small"
                    sx={{ fontWeight: 900, borderRadius: "10px" }}
                  />
                );
              })}
            </Box>

            {documents.length === 0 ? (
              <Typography sx={{ color: color_text_secondary }}>No documents submitted.</Typography>
            ) : (
              <Grid container spacing={1.5}>
                {documents.map((doc, idx) => {
                  const meta = photoStatusMeta(doc.status ?? null);
                  const mime = doc.mime_type || guessMimeFromFilename(doc.filename);
                  return (
                    <Grid key={doc.id}>
                      <Card
                        sx={{
                          position: "relative",
                          borderRadius: "14px",
                          overflow: "hidden",
                          cursor: "pointer",
                          border: meta.border,
                          boxShadow: meta.shadow,
                          background: color_white,
                        }}
                        onClick={() => onOpenDocViewer(idx)}
                      >
                        <Box sx={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: meta.tint }} />
                        <CardMedia component="div" sx={{ height: 190, display: "grid", placeItems: "center", background: color_white }}>
                          <DescriptionIcon sx={{ fontSize: 64, color: color_text_secondary }} />
                        </CardMedia>

                        <Box
                          sx={{
                            position: "absolute",
                            left: 10,
                            right: 10,
                            bottom: 10,
                            zIndex: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            px: 1,
                            py: 0.75,
                            borderRadius: "12px",
                            background: meta.overlayBg,
                            color: color_white,
                            fontWeight: 900,
                            backdropFilter: "blur(6px)",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            {meta.icon}
                            <span>{meta.label}</span>
                          </Box>
                          <span style={{ fontSize: 12, opacity: 0.95 }}>Doc #{doc.id}</span>
                        </Box>
                      </Card>

                      <Box sx={{ display: "flex", gap: 1, mt: 0.9, alignItems: "center", justifyContent: "space-between" }}>
                        <Chip icon={meta.icon} label={meta.label} color={meta.chipColor} size="small" sx={{ fontWeight: 900, borderRadius: "10px" }} />
                        <Button
                          size="small"
                          startIcon={<DownloadIcon fontSize="small" />}
                          onClick={() => onDownloadSingle(doc.id, doc.filename ?? `document_${doc.id}`, mime)}
                          sx={primaryBtnSx}
                        >
                          Download
                        </Button>
                      </Box>

                      {doc.filename && (
                        <Typography
                          sx={{
                            mt: 0.6,
                            fontSize: 12,
                            fontWeight: 800,
                            color: color_text_secondary,
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={doc.filename}
                        >
                          {doc.filename}
                        </Typography>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 1.25, background: color_white }}>
        <Button onClick={onClose} sx={secondaryBtnSx}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
