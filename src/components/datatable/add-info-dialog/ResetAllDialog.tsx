"use client";

import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";
import { RestartAlt } from "@mui/icons-material";
import { color_primary, color_secondary, color_text_primary, color_white } from "../../../constants/colors";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ResetAllDialog({ open, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 900, color: color_text_primary }}>Reset All?</DialogTitle>
      <DialogContent sx={{ color: color_text_primary, fontWeight: 700 }}>
        Are you sure you want to reset all fields and remove uploaded photos and documents?
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 900, textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          startIcon={<RestartAlt />}
          sx={{
            fontWeight: 900,
            textTransform: "none",
            background: color_secondary,
            color: color_white,
            "&:hover": { background: color_primary },
            px: 2,
            borderRadius: "10px",
          }}
        >
          Reset All
        </Button>
      </DialogActions>
    </Dialog>
  );
}
