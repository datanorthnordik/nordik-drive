import React, { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { FormControlLabel, Box, Typography } from "@mui/material";
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

//  use ONLY constants (no hardcoded colors)
import {
  color_text_light,
  color_text_primary,
  color_border,
  shadow_auth_button,
} from "../../constants/colors";

import {
  AuthLogosHeader,
  AuthTitle,
  AuthControlledTextField,
  AuthPasswordField,
  AuthPrimaryButton,
  OrDivider,
} from "./AuthShared";

type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean; //  make it required (fixes resolver mismatch)
};

//  Explicitly type schema to LoginFormValues
const schema: yup.ObjectSchema<LoginFormValues> = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
  remember: yup.boolean().required(), //  required boolean
});

function Login() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
    mode: "onSubmit",
  });

  const [openReset, setOpenReset] = useState(false);

  const { token } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { data, loading, error, fetchData } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/login",
    "POST",
    false
  );

  const onSubmit: SubmitHandler<LoginFormValues> = (formData) => {
    fetchData(formData, null, true);
  };

  useEffect(() => {
    if ((data as any)?.data) {
      const { firstname, id, email, lastname, phonenumber, role, community } = (data as any).data;
      dispatch(
        setAuth({
          token: "cookies",
          user: { id, firstname, lastname, email, phonenumber, role, community },
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
        <AuthLogosHeader mb={3} />

        <AuthTitle fontSize={22} mb={2}>
          Sign in with Email Address
        </AuthTitle>

        <FormWrapper onSubmit={handleSubmit(onSubmit)}>
          <AuthControlledTextField
            name="email"
            control={control as any}
            placeholder="Email address"
            errorMessage={errors.email?.message}
            inputHeight={48}
            sx={{ mt: 0 }}
            textFieldProps={{ InputLabelProps: { shrink: false } }}
          />

          <AuthPasswordField
            name="password"
            control={control as any}
            placeholder="Password"
            errorMessage={errors.password?.message}
            inputHeight={48}
            sx={{ mt: 1.25 }}
            textFieldProps={{ InputLabelProps: { shrink: false } }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-start", alignSelf: "flex-start", mt: 0.5 }}>
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<CheckBoxWrapper {...field} checked={!!field.value} />}
                  label={
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: color_text_primary }}>
                      Remember Me
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              )}
            />
          </Box>

          <AuthPrimaryButton
            type="submit"
            sx={{
              mt: 2,
              mb: 1.5,
              boxShadow: shadow_auth_button,
            }}
          >
            Sign In
          </AuthPrimaryButton>

          <Box sx={{ textAlign: "center", mb: 2 }}>
            <LinkButton type="button" onClick={() => setOpenReset(true)} role="button">
              Forgot password
            </LinkButton>
          </Box>

          <OrDivider my={2} dividerColor={color_border} textColor={color_text_light} />

          <AuthPrimaryButton type="button" onClick={() => navigate("/signup")} sx={{ height: 44, boxShadow: "none" }}>
            Create New Account
          </AuthPrimaryButton>
        </FormWrapper>
      </AuthWrapper>
    </AuthContainer>
  );
}

export default Login;
