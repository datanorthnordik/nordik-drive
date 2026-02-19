"use client";

import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";

import dayjs from "dayjs";

import {
  RequestDocument,
  RequestPhoto,
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
import { PhotoGrid } from "../shared/PhotoGrids";
import { DocumentGrid } from "../shared/DocumentGrids";

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
            <PhotoGrid
              title="Uploaded Photos"
              loading={false} // you don't have a photosLoading flag here
              emptyText="No photos submitted."
              photos={photos as any}
              getPhotoUrl={(id) => `${apiBase}/file/photo/${id}`}
              onOpenViewer={onOpenPhotoViewer}
              showDownload={true}
              onDownloadSingle={(id) => onDownloadSingle(id, `photo_${id}.jpg`, "image/jpeg")}
              primaryBtnSx={primaryBtnSx}
            />


            {/* Documents */}
            <DocumentGrid
              title="Uploaded Documents"
              loading={false}
              emptyText="No documents submitted."
              documents={documents as any}
              onOpenViewer={onOpenDocViewer}
              showViewButton={true}
              viewLabel="View"
              viewBtnSx={{
                textTransform: "none",
                fontWeight: 900,
                backgroundColor: color_white,
                color: color_text_secondary,
                border: `1px solid ${color_border}`,
                borderRadius: 1,
                px: 2.25,
                "&:hover": { backgroundColor: "rgba(2,6,23,0.03)" },
              }}
              showDownload={true}
              onDownloadSingle={(id:any, filename:any, mime:any) => onDownloadSingle(id, filename, mime)}
              resolveFilename={(d: any) => d.filename || d.file_name || `document_${d.id}`}
              resolveMime={(d: any) => d.mime_type || guessMimeFromFilename(d.filename || d.file_name)}
              primaryBtnSx={primaryBtnSx}
            />

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
