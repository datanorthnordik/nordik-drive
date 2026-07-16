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
          borderRadius: 3,
          overflow: "hidden",
          background: color_white,
          boxShadow: "0 22px 60px rgba(0, 0, 0, 0.18)",
          border: `1px solid ${color_border}`,
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: { xs: 2.25, sm: 3 },
            py: { xs: 2, sm: 2.5 },
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
                  fontSize: "0.92rem",
                  fontWeight: 600,
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
                    fontSize: "0.92rem",
                    fontWeight: 600,
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

      <DialogContent sx={{ px: { xs: 2.25, sm: 3 }, py: { xs: 2.5, sm: 3 } }}>
        <Box
          sx={{
            borderLeft: `4px solid ${color_secondary}`,
            pl: { xs: 2, sm: 2.5 },
          }}
        >
          <Typography
            data-testid={loading ? "daily-honour-loading" : "daily-honour-text"}
            sx={{
              color: color_black_light,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: { xs: "1.08rem", sm: "1.28rem" },
              lineHeight: 1.8,
              fontStyle: loading ? "normal" : "italic",
            }}
          >
            {loading ? "Loading today's honour..." : honourText}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 999,
              px: 2.25,
              py: 1,
              borderColor: color_border,
              color: color_black_light,
              fontWeight: 800,
              textTransform: "none",
              "&:hover": {
                borderColor: color_secondary,
                background: "#f8fbff",
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
