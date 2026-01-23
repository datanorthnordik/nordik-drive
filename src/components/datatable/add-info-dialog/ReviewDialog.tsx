"use client";

import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Divider, Box } from "@mui/material";
import { color_primary, color_secondary, color_text_primary, color_white } from "../../../constants/colors";
import { ReviewItem, AdditionalDocItem } from "./types";
import { DOCUMENT_CATEGORY_OPTIONS } from "./constants";

type Props = {
  open: boolean;
  title: string;
  items: ReviewItem[];
  photosCount: number;
  docs: AdditionalDocItem[];
  consent: boolean;
  archiveConsent: boolean;
  totalCombinedMB: number;
  maxCombinedMB: number;
  onBack: () => void;
  onConfirm: () => void;
  confirmLabel: string;
};

export default function ReviewDialog({
  open,
  title,
  items,
  photosCount,
  docs,
  consent,
  archiveConsent,
  totalCombinedMB,
  maxCombinedMB,
  onBack,
  onConfirm,
  confirmLabel,
}: Props) {
  return (
    <Dialog open={open} onClose={onBack} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900, color: color_text_primary }}>{title}</DialogTitle>
      <DialogContent sx={{ color: color_text_primary }}>
        {items.map((it, idx) => (
          <Box key={idx} sx={{ mb: 1.25 }}>
            <b>{it.field}</b>
            <div style={{ marginTop: 4 }}>
              Old: {it.oldValue || "—"} <br />
              New: {it.newValue || "—"}
            </div>
          </Box>
        ))}

        {(photosCount > 0 || docs.length > 0) && <Divider sx={{ my: 2 }} />}

        {photosCount > 0 && (
          <Box sx={{ mb: 1 }}>
            <b>Photos:</b> {photosCount} selected
          </Box>
        )}

        {docs.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <b>Additional Documents:</b> {docs.length} selected
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
              {docs.map((d) => (
                <div key={d.id}>
                  • {d.file.name} —{" "}
                  <b>
                    {DOCUMENT_CATEGORY_OPTIONS.find((x) => x.value === d.document_category)?.label ??
                      d.document_category}
                  </b>
                </div>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 1 }}>
          <b>Photo consent:</b> {consent ? "Yes" : "No"}
        </Box>
        <Box sx={{ mt: 0.5 }}>
          <b>Archive consent:</b> {archiveConsent ? "Yes" : "No"}
        </Box>

        <Box sx={{ mt: 1 }}>
          <b>Total upload:</b> {totalCombinedMB.toFixed(2)} MB / {maxCombinedMB} MB
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1.5 }}>
        <Button onClick={onBack} sx={{ fontWeight: 900, textTransform: "none" }}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{
            background: color_secondary,
            color: color_white,
            fontWeight: 900,
            textTransform: "none",
            borderRadius: "10px",
            px: 2.5,
            "&:hover": { background: color_primary },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
