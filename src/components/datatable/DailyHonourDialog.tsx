import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  color_black_light,
  color_border,
  color_focus_ring,
  color_secondary,
  color_text_primary,
  color_white,
} from "../../constants/colors";
import {
  ADD_INFO_DIALOG_ACTIONS_SX,
  ADD_INFO_DIALOG_CONTENT_SX,
  ADD_INFO_DIALOG_HEADER_SX,
  ADD_INFO_DIALOG_PAPER_SX,
  ADD_INFO_PRIMARY_ACTION_BUTTON_SX,
  ADD_INFO_SECONDARY_ACTION_BUTTON_SX,
} from "./add-info-dialog/styles";

type DailyHonourDialogProps = {
  open: boolean;
  loading: boolean;
  honourText: string;
  date?: string;
  onClose: () => void;
};

export default function DailyHonourDialog({
  open,
  loading,
  honourText,
  date,
  onClose,
}: DailyHonourDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="daily-honour-dialog-title"
      PaperProps={{
        sx: {
          ...ADD_INFO_DIALOG_PAPER_SX,
          boxShadow: "0 28px 72px rgba(0, 0, 0, 0.22)",
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            ...ADD_INFO_DIALOG_HEADER_SX,
            px: { xs: 2.5, sm: 3.25 },
            py: { xs: 2.1, sm: 2.65 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography
                id="daily-honour-dialog-title"
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: color_white,
                }}
              >
                Today's Honour
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.98rem",
                  fontWeight: 700,
                  color: "rgba(255, 255, 255, 0.88)",
                }}
              >
                Shared with respect
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {date ? (
                <Box
                  sx={{
                    px: 1.4,
                    py: 0.65,
                    borderRadius: "999px",
                    background: "rgba(255, 255, 255, 0.14)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <Typography
                    data-testid="daily-honour-date"
                    sx={{
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: color_white,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {date}
                  </Typography>
                </Box>
              ) : null}

              <IconButton
                onClick={onClose}
                aria-label="Close today's honour"
                sx={{
                  color: color_white,
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.12)",
                  },
                  "&:focus-visible": {
                    outline: `3px solid ${color_focus_ring}`,
                    outlineOffset: "2px",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          ...ADD_INFO_DIALOG_CONTENT_SX,
          px: { xs: 2.5, sm: 3.25 },
          py: { xs: 2.75, sm: 3.25 },
        }}
      >
        <Box
          sx={{
            background: color_white,
            border: `1px solid ${color_border}`,
            borderLeft: `5px solid ${color_secondary}`,
            borderRadius: "14px",
            px: { xs: 2.25, sm: 2.75 },
            py: { xs: 2.15, sm: 2.65 },
          }}
        >
          <Typography
            data-testid={loading ? "daily-honour-loading" : "daily-honour-text"}
            sx={{
              color: loading ? color_black_light : color_text_primary,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: { xs: "1.14rem", sm: "1.36rem" },
              lineHeight: 1.9,
              fontStyle: loading ? "normal" : "italic",
              whiteSpace: "pre-line",
            }}
          >
            {loading ? "Loading today's honour..." : honourText}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          ...ADD_INFO_DIALOG_ACTIONS_SX,
          px: { xs: 2.5, sm: 3.25 },
          py: 2,
          gap: 1.25,
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            ...ADD_INFO_SECONDARY_ACTION_BUTTON_SX,
            background: color_white,
            px: 2.25,
            py: 1,
          }}
        >
          Close
        </Button>

        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            ...ADD_INFO_PRIMARY_ACTION_BUTTON_SX,
            px: 3,
            py: 1,
          }}
        >
          Continue to records
        </Button>
      </DialogActions>
    </Dialog>
  );
}
