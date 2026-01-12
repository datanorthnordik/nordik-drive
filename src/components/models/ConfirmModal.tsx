import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  Box,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { color_secondary } from "../../constants/colors";

interface ConfirmationModalProps {
  open: boolean;
  title?: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title = "Confirm Delete",
  text,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirmation-dialog-title"
      PaperProps={{
        sx: {
          width: isMobile ? "92%" : 520,
          maxWidth: "92vw",
          borderRadius: 3,
          px: isMobile ? 2.5 : 4,
          pt: isMobile ? 3 : 3.5,
          pb: isMobile ? 2.5 : 3,
          boxShadow: "0px 18px 55px rgba(0,0,0,0.20)",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0,0,0,0.55)", // closer to screenshot
        },
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 0.5,
          mb: 2,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            backgroundColor: "rgba(239, 68, 68, 0.12)", // soft red tint
          }}
        >
          <DeleteOutlineRoundedIcon
            sx={{
              fontSize: 22,
              color: "#ef4444",
            }}
          />
        </Box>
      </Box>

      <DialogTitle
        id="confirmation-dialog-title"
        sx={{
          textAlign: "center",
          fontWeight: 800,
          fontSize: isMobile ? "1.1rem" : "1.25rem",
          lineHeight: 1.2,
          p: 0,
          mb: 1,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ p: 0, mb: 2.5 }}>
        <Typography
          sx={{
            color: theme.palette.text.secondary,
            fontSize: isMobile ? "0.9rem" : "0.95rem",
            lineHeight: 1.45,
            px: isMobile ? 0.5 : 1,
          }}
        >
          {text}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          p: 0,
          display: "flex",
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            minWidth: 140,
            height: 40,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            color: theme.palette.text.primary,
            borderColor: "rgba(0,0,0,0.12)",
            backgroundColor: "#fff",
            "&:hover": {
              borderColor: "rgba(0,0,0,0.20)",
              backgroundColor: "rgba(0,0,0,0.02)",
            },
          }}
        >
          {cancelText}
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            minWidth: 140,
            height: 40,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
            backgroundColor: `${color_secondary}`, // deep blue like screenshot
            "&:hover": {
              backgroundColor: `${color_secondary}`,
              boxShadow: "none",
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
