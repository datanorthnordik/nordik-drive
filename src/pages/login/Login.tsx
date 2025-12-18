import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Button,
  FormControlLabel,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthWrapper, FormWrapper } from '../../components/Wrappers';
import { LinkButton } from "../../components/Links";
import BorderLine from '../../components/BorderLine';
import { useNavigate } from 'react-router-dom';

import useFetch from '../../hooks/useFetch';
import Loader from '../../components/Loader';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { setAuth } from '../../store/auth/authSlics';
import { AuthContainer } from '../../components/containers/Containers';
import { CheckBoxWrapper } from '../../components/TextGroup';
import toast from 'react-hot-toast';
import PasswordResetModal from '../../components/PasswordReset';

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  remember: yup.boolean()
});

function Login() {
  const { handleSubmit, control, formState: { errors } } = useForm({
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
      dispatch(setAuth({ token: "cookies", user: { id, firstname, lastname, email, phonenumber, role } }));
      navigate("/files");
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (token && !data) {
      navigate("/files");
    }
  }, [token]);

  return (
    <AuthContainer>
      <Loader loading={loading} />
      <PasswordResetModal open={openReset} onClose={() => setOpenReset(false)} />
      <AuthWrapper>
        {/* Logos Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ height: "120px", maxWidth: "200px" }}>
            <img
              src="/logo-1.png"
              alt="Children of Shingwauk Alumni Association"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>

          <div style={{ height: "60px", maxWidth: "220px" }}>
            <img
              src="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-640x160.png"
              alt="Nordik Institute"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        </div>

        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
          Sign in with Email Address
        </h2>

        <FormWrapper onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email address"
                variant="outlined"
                fullWidth
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          {/* Password with Eye Icon */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
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

          {/* Remember me */}
          <Controller
            name="remember"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <FormControlLabel
                style={{ alignSelf: "flex-start" }}
                control={<CheckBoxWrapper {...field} checked={field.value} />}
                label="Remember Me"
              />
            )}
          />

          <Button
            style={{ width: "100%", margin: "1rem 0rem" }}
            type="submit"
            variant="contained"
            color="primary"
          >
            SIGN IN
          </Button>

          <LinkButton type="button" onClick={() => setOpenReset(true)} role="button">
            Forgot password
          </LinkButton>

          <BorderLine />

          <Button
            style={{ margin: "1rem" }}
            onClick={() => navigate("/signup")}
          >
            Create new account
          </Button>
        </FormWrapper>
      </AuthWrapper>
    </AuthContainer>
  );
}

export default Login;
