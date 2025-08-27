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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface ConfirmationModalProps {
  open: boolean;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  text,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          width: isMobile ? "85%" : isTablet ? "60%" : "40%",
          maxWidth: "600px",
          borderRadius: 4,
          boxShadow: 8,
          p: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "1.25rem",
          color: theme.palette.text.primary,
        }}
      >
        Confirmation
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            px: 2,
            pb: 1,
          }}
        >
          <InfoOutlinedIcon
            sx={{ color: theme.palette.primary.main, fontSize: "1.5rem" }}
          />
          <Typography
            variant="body1"
            sx={{
              textAlign: "center",
              color: theme.palette.text.secondary,
              fontSize: "1rem",
            }}
          >
            {text}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          pb: 2,
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, px: 3 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2, px: 3 }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
