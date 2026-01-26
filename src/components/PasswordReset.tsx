import React, { use, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { useForm, Controller, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import useFetch from "../hooks/useFetch";

// ✅ Single schema that adapts by step
const schema = yup.object({
  step: yup.string<"email" | "reset">().required(),
  email: yup.string().when("step", {
    is: "email",
    then: (s) => s.email("Invalid email").required("Email is required"),
    otherwise: (s) => s.strip(), // remove field when not needed
  }),
  otp: yup.string().when("step", {
    is: "reset",
    then: (s) => s.required("OTP is required"),
    otherwise: (s) => s.strip(),
  }),
  password: yup.string().when("step", {
    is: "reset",
    then: (s) => s.min(6, "Min 6 characters").required("Password is required"),
    otherwise: (s) => s.strip(),
  }),
});

type FormValues = yup.InferType<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
};

const PasswordResetModal: React.FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");

  const { fetchData, loading, error: otpError, data: otpSend } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/user/send-otp", "POST", false);
  const { fetchData: verifyOtp, loading: verifyLoading, error: otpVerifyError, data: otpVerify } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/user/reset-password", "POST", false);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as Resolver<FormValues>, // ✅ tiny cast
    defaultValues: { step: "email" },
  });

  // Step 1: send OTP
  const handleEmailSubmit = async (data: FormValues) => {
    fetchData({ email: data.email });
    setEmail((data as any).email);
  };

  useEffect(() => {
    if (otpSend) {
      toast.success("OTP sent successfully");
      setStep("reset");
      setValue("step", "reset");
    }
    if (otpError) {
      toast.error((otpError as any)?.message || "Failed to send OTP");
    }
  }, [otpSend, otpError]);

  useEffect(() => {
    if (otpVerify) {
      toast.success("OTP verified successfully");
      onClose();
    }
    if (otpVerifyError) {
      toast.error((otpVerifyError as any)?.message || "Failed to verify OTP");
    }
  }, [otpVerify, otpVerifyError]);

  // Step 2: reset password
  const handleResetSubmit = async (data: FormValues) => {
    verifyOtp({ email, otp: data.otp, password: data.password });
  };


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" data-testid="reset-modal">
      <DialogTitle>Password Reset</DialogTitle>
      <DialogContent>
        <form
          onSubmit={handleSubmit(
            step === "email" ? handleEmailSubmit : handleResetSubmit
          )}
        >
          {step === "email" && (
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  margin="normal"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
          )}

          {step === "reset" && (
            <>
              <Controller
                name="otp"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Enter OTP"
                    margin="normal"
                    fullWidth
                    error={!!errors.otp}
                    helperText={errors.otp?.message}
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="New Password"
                    type="password"
                    margin="normal"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />
            </>
          )}

          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {step === "email" ? "Send OTP" : "Reset Password"}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetModal;