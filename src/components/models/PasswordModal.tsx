import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
  Box,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useMemo, useState } from "react";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import toast from "react-hot-toast";
import { password_validation_success } from "../../constants/messages";
import { color_secondary, color_secondary_dark, color_white } from "../../constants/colors";

interface PasswordModalProps {
  open: boolean;
  closePasswordModal: (success: boolean) => void;
}

const PasswordModal = (props: PasswordModalProps) => {
  const { open, closePasswordModal } = props;

  const [passwordError, setPasswordError] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const { loading, error, fetchData, data } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/verify-password",
    "POST"
  );

  const canSubmit = useMemo(() => passwordInput.trim().length > 0 && !loading, [passwordInput, loading]);

  const onCloseModal = () => {
    setPasswordInput("");
    setPasswordError("");
    closePasswordModal(false);
  };

  const verifyPassword = () => {
    if (passwordInput.trim().length > 0) {
      fetchData({ password: passwordInput });
    } else {
      setPasswordError("Please enter your password.");
    }
  };

  useEffect(() => {
    if (data || error) {
      try {
        if (data && !error) {
          toast.success(password_validation_success);
          setPasswordError("");
          closePasswordModal(true);
          setPasswordInput("");
        } else if (error) {
          setPasswordError("Incorrect password. Please try again.");
        }
      } catch {
        setPasswordError("Error verifying password. Please try again.");
      }
    }
  }, [data, error, closePasswordModal]);

  return (
    <>
      <Loader loading={loading} />

      <Dialog
        open={open}
        onClose={onCloseModal}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 18px 60px rgba(0,0,0,0.18)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.25,
            py: 1.75,
            background: "linear-gradient(135deg, rgba(0,75,156,0.10), rgba(0,58,122,0.06))",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box>
              <DialogTitle sx={{ p: 0, fontWeight: 800, fontSize: "1.1rem", color: color_secondary_dark }}>
                Confirm Password
              </DialogTitle>
              <Typography sx={{ mt: 0.4, color: "rgba(0,0,0,0.65)", fontSize: "0.9rem" }}>
                Enter your password to continue.
              </Typography>
            </Box>

            <IconButton
              onClick={onCloseModal}
              size="small"
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.10)",
                background: color_white,
                "&:hover": { background: "rgba(255,255,255,0.9)" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Content */}
        <DialogContent sx={{ pt: 2.25, pb: 1.25 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              if (passwordError) setPasswordError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") verifyPassword();
            }}
            error={Boolean(passwordError)}
            helperText={passwordError || " "}
            FormHelperTextProps={{ sx: { mx: 0, mt: 0.8 } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "rgba(0,0,0,0.02)",
                transition: "box-shadow 120ms ease",
                "&.Mui-focused": {
                  boxShadow: "0 0 0 4px rgba(0,75,156,0.12)",
                },
              },
              "& label.Mui-focused": { color: color_secondary_dark },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.18)" },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: color_secondary,
              },
            }}
          />
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: 2.25, pb: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={onCloseModal}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 2,
              px: 2.2,
              height: 40,
              color: color_secondary,
              borderColor: color_secondary,
              backgroundColor: color_white,
              "&:hover": {
                borderColor: color_secondary_dark,
                color: color_secondary_dark,
                backgroundColor: "rgba(0,75,156,0.04)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={verifyPassword}
            disabled={!canSubmit}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: 2,
              px: 2.6,
              height: 40,
              backgroundColor: color_secondary_dark,
              boxShadow: "0 10px 24px rgba(0,58,122,0.25)",
              "&:hover": {
                backgroundColor: color_secondary,
                boxShadow: "0 12px 26px rgba(0,75,156,0.28)",
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(0,0,0,0.12)",
                color: "rgba(0,0,0,0.35)",
                boxShadow: "none",
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PasswordModal;
