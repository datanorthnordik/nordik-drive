import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  color_black_light,
  color_border,
  color_primary,
  color_secondary,
  color_text_light,
  color_white,
} from "../../constants/colors";

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
          borderRadius: 3.5,
          overflow: "hidden",
          background: color_white,
          boxShadow: "0 28px 72px rgba(0, 0, 0, 0.22)",
          border: `1px solid ${color_border}`,
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: { xs: 2.5, sm: 3.25 },
            py: { xs: 2.1, sm: 2.65 },
            background: "linear-gradient(135deg, #fffaf3 0%, #ffffff 100%)",
            borderBottom: `1px solid ${color_border}`,
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
                  color: color_primary,
                }}
              >
                Today's Honour
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.98rem",
                  fontWeight: 700,
                  color: color_text_light,
                }}
              >
                Shared with respect
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {date ? (
                <Typography
                  data-testid="daily-honour-date"
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: color_black_light,
                    whiteSpace: "nowrap",
                  }}
                >
                  {date}
                </Typography>
              ) : null}

              <IconButton
                onClick={onClose}
                aria-label="Close today's honour"
                sx={{
                  color: color_black_light,
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3.25 }, py: { xs: 2.75, sm: 3.25 } }}>
        <Box
          sx={{
            borderLeft: `5px solid ${color_secondary}`,
            pl: { xs: 2.25, sm: 2.75 },
          }}
        >
          <Typography
            data-testid={loading ? "daily-honour-loading" : "daily-honour-text"}
            sx={{
              color: color_black_light,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: { xs: "1.16rem", sm: "1.42rem" },
              lineHeight: 1.9,
              fontStyle: loading ? "normal" : "italic",
            }}
          >
            {loading ? "Loading today's honour..." : honourText}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              borderRadius: 999,
              px: 3,
              py: 1.15,
              background: color_primary,
              color: color_white,
              boxShadow: "none",
              fontWeight: 900,
              fontSize: "0.98rem",
              textTransform: "none",
              "&:hover": {
                background: "#8f182c",
                boxShadow: "none",
              },
            }}
          >
            Continue to records
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
