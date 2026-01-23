"use client";

import React, { useMemo } from "react";
import { Box, Button } from "@mui/material";
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
} from "../../../constants/colors";
import { MAX_COMBINED_UPLOAD_MB, MAX_PHOTOS, MAX_PHOTO_MB } from "./constants";
import { bytesToMB, clamp, getTotalBytes } from "./utils";

type Props = {
  photos: File[];
  setPhotos: (next: File[]) => void;
  totalCombinedMB: number;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (idx: number) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
};

export default function PhotoUploadCard({
  photos,
  totalCombinedMB,
  onUpload,
  onRemove,
  consent,
  setConsent,
}: Props) {
  const totalPhotoMB = bytesToMB(getTotalBytes(photos));

  const warning = useMemo(() => {
    const percentUsed = (photos.length / MAX_PHOTOS) * 100;
    if (percentUsed >= 100) return { bg: color_warning_light, text: "You have reached the upload limit." };
    if (percentUsed >= 80) return { bg: color_warning_light, text: "You are close to the upload limit." };
    return null;
  }, [photos.length]);

  return (
    <Box
      sx={{
        border: `1px solid ${color_border}`,
        background: color_white,
        borderRadius: "12px",
        p: 2,
      }}
    >
      <Box sx={{ fontWeight: 900, fontSize: "1.1rem", color: color_text_primary, mb: 1 }}>
        Photos
      </Box>

      <Box sx={{ color: color_text_primary, opacity: 0.85, fontSize: "0.95rem", mb: 1.5 }}>
        Upload up to <b>{MAX_PHOTOS}</b> images or <b>{MAX_PHOTO_MB} MB</b> total.
        <br />
        <b>Total upload (photos + docs):</b> {totalCombinedMB.toFixed(2)} MB / {MAX_COMBINED_UPLOAD_MB} MB
      </Box>

      <Button
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
        }}
      >
        Select Photos
        <input type="file" hidden accept="image/*" multiple onChange={onUpload} />
      </Button>

      {photos.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          {photos.map((f, idx) => (
            <Box key={idx} sx={{ position: "relative" }}>
              <img
                src={URL.createObjectURL(f)}
                width={140}
                height={110}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${color_border}`,
                  objectFit: "cover",
                  background: color_white_smoke,
                }}
              />
              <Button
                onClick={() => onRemove(idx)}
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
                }}
              >
                ✕
              </Button>
            </Box>
          ))}
        </Box>
      )}

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

      {/* Photo consent */}
      <Box sx={{ mt: 2, display: "flex", gap: 1.25, alignItems: "flex-start" }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ transform: "scale(1.4)", marginTop: 4 }}
        />
        <Box sx={{ color: color_text_primary, fontSize: "0.98rem", fontWeight: 800 }}>
          I consent to have the pictures I upload shared and/or used for CSAA publications (newsletters, photo gallery, social media).
        </Box>
      </Box>
    </Box>
  );
}
