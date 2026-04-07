'use client';

import React from "react";
import { Button, DialogActions } from "@mui/material";

import {
  color_border,
  color_focus_ring,
  color_primary,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_warning,
  color_white,
  color_white_smoke,
  shadow_auth_button,
} from "../../../constants/colors";

type ReviewUiAction = "approved" | "rejected" | "moreInfo";

type Props = {
  review: boolean;
  editable: boolean;
  isProcessing: boolean;
  saveGuardBusy: boolean;
  onClose: () => void;
  onSave: () => void;
  onReviewAction: (action: ReviewUiAction) => void;
};

export default function ConfigFormModalActions({
  review,
  editable,
  isProcessing,
  saveGuardBusy,
  onClose,
  onSave,
  onReviewAction,
}: Props) {
  return (
    <DialogActions
      sx={{
        p: 2,
        background: color_white,
        borderTop: `1px solid ${color_border}`,
      }}
    >
      <Button
        onClick={onClose}
        disabled={isProcessing}
        sx={{
          textTransform: "none",
          fontWeight: 900,
          borderRadius: "10px",
          px: 3,
          py: 1.1,
          background: color_white,
          border: `1px solid ${color_border}`,
          color: color_text_primary,
          "&:hover": { background: color_white_smoke },
          "&:focus-visible": {
            outline: `3px solid ${color_focus_ring}`,
            outlineOffset: "2px",
          },
        }}
      >
        {editable ? "Cancel" : "Close"}
      </Button>

      {!review && editable ? (
        <Button
          variant="contained"
          onClick={onSave}
          disabled={isProcessing || saveGuardBusy}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 3.2,
            py: 1.1,
            background: color_secondary,
            color: color_white,
            boxShadow: shadow_auth_button,
            "&:hover": { background: color_secondary_dark },
            "&:focus-visible": {
              outline: `3px solid ${color_focus_ring}`,
              outlineOffset: "2px",
            },
          }}
        >
          {isProcessing ? "Saving..." : "Submit"}
        </Button>
      ) : null}

      {review ? (
        <>
          <Button
            variant="contained"
            onClick={() => onReviewAction("moreInfo")}
            disabled={isProcessing}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
              px: 2.8,
              py: 1.1,
              background: color_warning,
              color: color_white,
              "&:hover": { background: color_warning },
            }}
          >
            {isProcessing ? "Processing..." : "Need More Info"}
          </Button>

          <Button
            variant="contained"
            onClick={() => onReviewAction("rejected")}
            disabled={isProcessing}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
              px: 2.6,
              py: 1.1,
              background: color_primary,
              color: color_white,
              "&:hover": { background: color_primary },
            }}
          >
            {isProcessing ? "Processing..." : "Reject"}
          </Button>

          <Button
            variant="contained"
            onClick={() => onReviewAction("approved")}
            disabled={isProcessing}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
              px: 2.8,
              py: 1.1,
              background: color_secondary,
              color: color_white,
              boxShadow: shadow_auth_button,
              "&:hover": { background: color_secondary_dark },
            }}
          >
            {isProcessing ? "Processing..." : "Approve"}
          </Button>
        </>
      ) : null}
    </DialogActions>
  );
}
