"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import {
  color_border,
  color_light_gray,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_warning_light,
  color_white,
  color_white_smoke,
  dark_grey,
  color_focus_ring,
} from "../../../constants/colors";
import { MAX_COMBINED_UPLOAD_MB, MAX_PHOTOS, MAX_PHOTO_MB } from "./constants";
import { bytesToMB, clamp, getTotalBytes } from "./utils";

export type PhotoItem = {
  id: string;
  file: File;
  comment: string;
};

type UploadConfig = {
  name?: string;
  display_name?: string;
  description?: string;
  consent?: string;
  docs_count_enabled?: boolean;
  total_upload_size?: boolean;
  individual_upload_size?: boolean;
};

type Props = {
  photos: PhotoItem[];
  setPhotos: (next: PhotoItem[]) => void;
  totalCombinedMB: number;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (idx: number) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  disabled?: boolean;
  config?: UploadConfig;
};

function PhotoPreview({
  file,
  alt,
}: {
  file: File;
  alt: string;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      width={140}
      height={110}
      style={{
        borderRadius: 10,
        border: `1px solid ${color_border}`,
        objectFit: "cover",
        background: color_white_smoke,
        display: "block",
      }}
    />
  );
}

export default function PhotoUploadCard({
  photos,
  setPhotos,
  totalCombinedMB,
  onUpload,
  onRemove,
  consent,
  setConsent,
  disabled = false,
  config,
}: Props) {
  const totalPhotoMB = bytesToMB(getTotalBytes(photos.map((p) => p.file)));

  const title = String(config?.display_name || config?.name || "Photos");
  const description = String(
    config?.description || `Upload up to ${MAX_PHOTOS} images or ${MAX_PHOTO_MB} MB total.`
  );
  const consentText = String(config?.consent || "").trim();

  const showCount = config?.docs_count_enabled !== false;
  const showTotal = config?.total_upload_size !== false;

  const warning = useMemo(() => {
    const percentUsed = (photos.length / MAX_PHOTOS) * 100;
    if (percentUsed >= 100) {
      return { bg: color_warning_light, text: "You have reached the upload limit." };
    }
    if (percentUsed >= 80) {
      return { bg: color_warning_light, text: "You are close to the upload limit." };
    }
    return null;
  }, [photos.length]);

  const onChangeComment = (idx: number, value: string) => {
    if (disabled) return;
    setPhotos(photos.map((p, i) => (i === idx ? { ...p, comment: value } : p)));
  };

  return (
    <Box
      sx={{
        border: `1px solid ${color_border}`,
        background: color_white,
        borderRadius: "12px",
        p: 2,
        opacity: disabled ? 0.9 : 1,
      }}
    >
      <Box sx={{ fontWeight: 900, fontSize: "1.1rem", color: color_text_primary, mb: 1 }}>
        {title}
      </Box>

      <Box sx={{ color: color_text_primary, opacity: 0.85, fontSize: "0.95rem", mb: 1.5 }}>
        {description}
        {(showCount || showTotal) && (
          <>
            <br />
            {showTotal ? (
              <>
                <b>Total upload (photos + docs):</b> {totalCombinedMB.toFixed(2)} MB / {MAX_COMBINED_UPLOAD_MB} MB
              </>
            ) : null}
          </>
        )}
      </Box>

      <Button
        disabled={disabled}
        variant="contained"
        component="label"
        sx={{
          background: color_secondary,
          fontWeight: 900,
          textTransform: "none",
          borderRadius: "10px",
          px: 2,
          py: 1.1,
          "&:hover": { background: color_secondary_dark },
          "&:focus-visible": { outline: `3px solid ${color_focus_ring}`, outlineOffset: "2px" },
        }}
      >
        Select Photos
        <input type="file" hidden accept="image/*" multiple onChange={onUpload} />
      </Button>

      {photos.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          {photos.map((p, idx) => (
            <Box key={p.id} sx={{ position: "relative", width: 140 }}>
              <PhotoPreview
                file={p.file}
                alt={p.file?.name || `Photo ${idx + 1}`}
              />

              <Button
                disabled={disabled}
                onClick={() => !disabled && onRemove(idx)}
                sx={{
                  position: "absolute",
                  top: -10,
                  right: -10,
                  minWidth: 34,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  fontWeight: 900,
                  background: color_secondary,
                  color: color_white,
                  border: `1px solid ${color_secondary_dark}`,
                  "&:hover": { background: color_secondary_dark },
                  "&:focus-visible": { outline: `3px solid ${color_focus_ring}`, outlineOffset: "2px" },
                }}
              >
                ✕
              </Button>

              <Box sx={{ mt: 1 }}>
                <TextField
                  disabled={disabled}
                  label="Comment"
                  value={p.comment || ""}
                  onChange={(e) => onChangeComment(idx, e.target.value)}
                  placeholder="Add a comment…"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={3}
                  inputProps={{ maxLength: 100 }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      background: color_white,
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: color_border,
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: color_focus_ring,
                      borderWidth: "2px",
                    },
                    "& .MuiFormHelperText-root": {
                      marginLeft: 0,
                      color: color_light_gray,
                      fontWeight: 800,
                    },
                  }}
                  helperText={`${(p.comment || "").length}/100`}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {showCount && (
        <Box sx={{ mt: 2, color: color_text_primary, fontWeight: 900 }}>
          Upload Limit: {photos.length}/{MAX_PHOTOS} photos ({totalPhotoMB.toFixed(2)} MB of {MAX_PHOTO_MB} MB)
          <Box
            sx={{
              mt: 1,
              height: 10,
              width: "100%",
              background: color_white_smoke,
              borderRadius: 8,
              overflow: "hidden",
              border: `1px solid ${color_border}`,
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${clamp((photos.length / MAX_PHOTOS) * 100, 0, 100)}%`,
                background: color_secondary,
              }}
            />
          </Box>
        </Box>
      )}

      {warning ? (
        <Box
          sx={{
            mt: 1.5,
            p: 1.25,
            borderRadius: "10px",
            background: warning.bg,
            border: `1px solid ${dark_grey}`,
            color: color_text_primary,
            fontWeight: 900,
          }}
        >
          {warning.text}
        </Box>
      ) : null}

      {consentText ? (
        <Box sx={{ mt: 2, display: "flex", gap: 1.25, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={consent}
            onChange={(e) => !disabled && setConsent(e.target.checked)}
            style={{ transform: "scale(1.4)", marginTop: 4 }}
          />
          <Box sx={{ color: color_text_primary, fontSize: "0.98rem", fontWeight: 800 }}>
            {consentText}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}