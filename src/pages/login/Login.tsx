import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  FormControlLabel,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AuthWrapper, FormWrapper } from "../../components/Wrappers";
import { LinkButton } from "../../components/Links";
import { useNavigate } from "react-router-dom";

import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import { setAuth } from "../../store/auth/authSlics";
import { AuthContainer } from "../../components/containers/Containers";
import { CheckBoxWrapper } from "../../components/TextGroup";
import toast from "react-hot-toast";
import PasswordResetModal from "../../components/PasswordReset";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {color_secondary, color_secondary_dark, color_text_light, color_text_primary, color_white } from "../../constants/colors";


const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
  remember: yup.boolean(),
});

function Login() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [openReset, setOpenReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { token } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { data, loading, error, fetchData } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/login",
    "POST",
    false
  );

  const onSubmit = (formData: any) => {
    fetchData(formData, null, true);
  };

  useEffect(() => {
    if ((data as any)?.data) {
      const { firstname, id, email, lastname, phonenumber, role } = (data as any).data;
      dispatch(
        setAuth({
          token: "cookies",
          user: { id, firstname, lastname, email, phonenumber, role },
        })
      );
      navigate("/files");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (token && !data) navigate("/files");
  }, [token]);

  return (
    <AuthContainer>
      <Loader loading={loading} />
      <PasswordResetModal open={openReset} onClose={() => setOpenReset(false)} />

      <AuthWrapper>
        {/* ✅ Logos Section — SAME SIZE as your previous code */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap",
            mb: 3,
          }}
        >
          <Box sx={{ height: "120px", maxWidth: "200px" }}>
            <img
              src="/logo-1.png"
              alt="Children of Shingwauk Alumni Association"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Box>

          <Box sx={{ height: "60px", maxWidth: "220px" }}>
            <img
              src="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-640x160.png"
              alt="Nordik Institute"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Box>
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: 22, mb: 2, color: `${color_text_primary}`, textAlign: "center" }}>
          Sign in with Email Address
        </Typography>

        <FormWrapper onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                placeholder="Email address"
                variant="outlined"
                fullWidth
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                InputLabelProps={{ shrink: false }}
                sx={{
                  mt: 0,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    height: 48,
                    backgroundColor: `${color_white}`,
                  },
                }}
              />
            )}
          />

          {/* Password */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputLabelProps={{ shrink: false }}
                sx={{
                  mt: 1.25,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    height: 48,
                    backgroundColor: `${color_white}`,
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((p) => !p)}
                        edge="end"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          {/* Remember Me */}
          <Box sx={{ display: "flex", justifyContent: "flex-start", alignSelf: "flex-start", mt: 0.5 }}>
            <Controller
              name="remember"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<CheckBoxWrapper {...field} checked={field.value} />}
                  label={
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: `${color_text_primary}` }}>
                      Remember Me
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              )}
            />
          </Box>

          {/* Sign in */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              mb: 1.5,
              height: 46,
              borderRadius: 2,
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              boxShadow: "0 10px 18px rgba(0,0,0,0.14)",
              backgroundColor: `${color_secondary} !important`,
              "&:hover": { backgroundColor: `${color_secondary_dark} !important` },
            }}
          >
            Sign In
          </Button>

          {/* Forgot password */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <LinkButton type="button" onClick={() => setOpenReset(true)} role="button">
              Forgot password
            </LinkButton>
          </Box>

          {/* OR divider */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 2 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: `${color_text_light}` }}>
              OR
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {/* Create account */}
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate("/signup")}
            sx={{
              height: 44,
              borderRadius: 2,
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              boxShadow: "none",
              backgroundColor: `${color_secondary} !important`,
              "&:hover": { backgroundColor: `${color_secondary_dark} !important` },
            }}
          >
            Create New Account
          </Button>
        </FormWrapper>
      </AuthWrapper>
    </AuthContainer>
  );
}

export default Login;
