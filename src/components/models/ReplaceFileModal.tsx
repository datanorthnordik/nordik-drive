import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import toast from "react-hot-toast";
import { color_background, color_secondary } from "../../constants/colors";

interface ReplaceFileModalProps {
  open: boolean;
  onClose: () => void;
  file: { id: number; filename: string; version: number } | null;
  refresh: () => void;
}

const COLORS = {
  title: "#0F172A",        // black-ish
  subtext: "#64748B",       // slate
  border: "#CFE0FF",
  borderHover: "#B8D2FF",
  zoneBg: "#F7FAFF",
  iconBg: "#EAF2FF",
  iconBorder: "#D6E6FF",

  
  cancelText: "#0F172A",    // cancel black text
  cancelBorder: "rgba(15, 23, 42, 0.18)",

  divider: "rgba(15, 23, 42, 0.08)",
};

const HiddenInput = styled("input")({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
});

const DropZoneLabel = styled("label")<{ $drag?: boolean }>(({ $drag }) => ({
  width: "100%",
  borderRadius: 10,
  border: `2px dashed ${$drag ? COLORS.borderHover : COLORS.border}`,
  background: COLORS.zoneBg,
  padding: "22px 18px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
  transition: "all 180ms ease",
  userSelect: "none",
}));

const IconCircle = styled("div")({
  width: 44,
  height: 44,
  borderRadius: 999,
  background: COLORS.iconBg,
  border: `1px solid ${COLORS.iconBorder}`,
  display: "grid",
  placeItems: "center",
});

const ReplaceFileModal: React.FC<ReplaceFileModalProps> = ({ open, onClose, file, refresh }) => {
  const { loading, fetchData, data, error } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/replace",
    "POST"
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const inputId = "replace-file-input";

  const title = useMemo(() => (file?.filename ? `Replace ${file.filename}` : "Replace File"), [file]);

  const description = useMemo(() => {
    const name = file?.filename ? ` ${file.filename}` : "";
    return `Please select a new file to replace${name}. This action will update the current version in the archival system.`;
  }, [file]);

  useEffect(() => {
    if (data) {
      onClose();
      refresh();
      toast.success((data as any).message);
      setSelectedFile(null);
      setDragActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
    e.target.value = ""; // allow selecting same file again
  };

  const handleReplace = () => {
    if (!selectedFile || !file) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("id", String(file.id));
    fetchData(formData);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setDragActive(false);
    onClose();
  };

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setSelectedFile(dropped);
  };

  return (
    <>
      <Loader loading={loading} />

      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${COLORS.divider}`,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Typography sx={{ fontWeight: 800, color: COLORS.title, fontSize: "1rem" }}>
            {title}
          </Typography>

          <IconButton
            onClick={handleCancel}
            size="small"
            sx={{
              color: "rgba(15,23,42,0.55)",
              "&:hover": { backgroundColor: "rgba(148,163,184,0.15)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2.25, backgroundColor: "#FFFFFF" }}>
          <Typography sx={{ color: COLORS.subtext, fontSize: "0.84rem", lineHeight: 1.55 }}>
            {description}
          </Typography>

          {/* Dropzone */}
          <Box sx={{ mt: 2 }}>
            <HiddenInput id={inputId} type="file" onChange={handleFileChange} />

            <DropZoneLabel
              htmlFor={inputId}
              $drag={dragActive}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              style={{
                borderColor: dragActive ? COLORS.borderHover : COLORS.border,
                background: COLORS.zoneBg,
              }}
            >
              <IconCircle>
                <CloudUploadOutlinedIcon sx={{ color: color_secondary }} />
              </IconCircle>

              <Typography sx={{ fontWeight: 800, color: COLORS.title, fontSize: "0.9rem" }}>
                {selectedFile ? selectedFile.name : "Click or drag a file here"}
              </Typography>

              <Typography sx={{ color: COLORS.subtext, fontSize: "0.74rem" }}>
                Support for PDF, DOCX, and high-resolution images up to 50MB
              </Typography>
            </DropZoneLabel>
          </Box>
        </DialogContent>

        {/* Footer actions */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${COLORS.divider}`,
            justifyContent: "flex-end",
            gap: 1.25,
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* ✅ Cancel white + black text */}
          <Button
            onClick={handleCancel}
            disabled={loading}
            variant="outlined"
            sx={{
              textTransform: "uppercase",
              fontWeight: 800,
              fontSize: "0.72rem",
              borderRadius: 1,
              px: 2,
              backgroundColor: `${color_background} !important`,
              color: `${COLORS.cancelText} !important`,
              borderColor: `${COLORS.cancelBorder} !important`,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#F8FAFC !important",
                borderColor: "rgba(15, 23, 42, 0.28) !important",
                boxShadow: "none",
              },
              "&.Mui-disabled": {
                backgroundColor: "#FFFFFF !important",
                color: "rgba(15,23,42,0.35) !important",
                borderColor: "rgba(15, 23, 42, 0.10) !important",
              },
            }}
          >
            Cancel
          </Button>

          {/* ✅ Replace blue */}
          <Button
            onClick={handleReplace}
            disabled={!selectedFile || loading}
            variant="contained"
            disableElevation
            sx={{
              textTransform: "uppercase",
              fontWeight: 900,
              fontSize: "0.72rem",
              borderRadius: 1,
              px: 2.2,
              backgroundColor: `${color_secondary} !important`,
              color: "#FFFFFF !important",
              boxShadow: "none !important",
              "&:hover": {
                backgroundColor: `${color_secondary} !important`,
                boxShadow: "none !important",
              },
            }}
          >
            Replace File
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReplaceFileModal;
