import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Button,
  TextField,
  Box,
  Typography,
  InputAdornment,
  IconButton
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthWrapper, FormWrapper } from '../../components/Wrappers';
import { LinkButton } from "../../components/Links";
import TextGroup from "../../components/TextGroup";
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/Loader';
import { AuthContainer } from '../../components/containers/Containers';
import BorderLine from '../../components/BorderLine';
import toast from "react-hot-toast";
import { signup_success } from '../../constants/messages';

/* ===========================
   Validation Schema
=========================== */
const schema = yup.object().shape({
  firstname: yup.string().required('First name is required'),
  lastname: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(
    4,
    "Password must be at least 6 characters",
  ),
  confirmPassword: yup.string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
  community: yup
    .array()
    .of(yup.string().trim().required("Please select or type a community"))
});

function Signup() {
  const { handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      community: [""] // row-based UI: start with one row
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ===========================
     Existing Signup API
  =========================== */
  const { data, loading, error, fetchData } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/signup",
    "POST",
    false
  );

  /* ===========================
     Communities APIs
  =========================== */
  const { data: communitiesData, fetchData: fetchCommunities } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/communities",
    "GET",
    false
  );

  const { fetchData: addCommunity } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/communities",
    "POST",
    false
  );

  const navigate = useNavigate();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const communityOptions = useMemo(() => {
    return (communitiesData as any)?.communities?.map((c: any) => c.name) || [];
  }, [communitiesData]);

  const normalizeName = (v: any) => (typeof v === "string" ? v.trim() : "");
  const existsInOptions = (name: string) =>
    communityOptions.some((o: string) => o.trim().toLowerCase() === name.trim().toLowerCase());

  /* ===========================
     Submit Signup
  =========================== */
  const onSubmit = async (formData: any) => {
    const cleaned = (formData.community || [])
      .map((x: string) => (x || "").trim())
      .filter((x: string) => x.length > 0);

    // case-insensitive dedupe
    const seen = new Set<string>();
    const unique = cleaned.filter((n: string) => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // names not in dropdown
    const missing = unique.filter((name: string) => !existsInOptions(name));

    // ✅ single call
    if (missing.length > 0) {
      await addCommunity({ communities: missing }, null, true);
      await fetchCommunities();
    }

    fetchData({ ...formData, community: unique }, null, true);
  };

  useEffect(() => {
    if (data) {
      toast.success(signup_success);
      navigate("/");
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <AuthContainer>
      <Loader loading={loading} />
      <AuthWrapper>

        {/* Logos Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
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

        <h2>Create a new account</h2>

        <FormWrapper onSubmit={handleSubmit(onSubmit)}>
          <TextGroup>
            <Controller
              name="firstname"
              control={control}
              render={({ field }) => (
                <TextField
                  style={{ width: "50%" }}
                  {...field}
                  label="First name"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  error={!!errors.firstname}
                  helperText={errors.firstname?.message}
                />
              )}
            />

            <Controller
              name="lastname"
              control={control}
              render={({ field }) => (
                <TextField
                  style={{ width: "50%" }}
                  {...field}
                  label="Last name"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  error={!!errors.lastname}
                  helperText={errors.lastname?.message}
                />
              )}
            />
          </TextGroup>

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

          <TextGroup>
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

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          edge="end"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </TextGroup>

          {/* ===========================
             Community
          =========================== */}
          <Box
            sx={{
              width: "100%",
              mt: 2,
              mb: 0.5,
              p: 1.25,
              borderRadius: 1,
              border: "1px solid rgba(0,0,0,0.15)",
              backgroundColor: "rgba(0,0,0,0.03)"
            }}
          >
            <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.35 }}>
              First Nation / Community (you can add more than one)
            </Typography>
            <Typography sx={{ fontSize: "1.05rem", lineHeight: 1.4, mt: 0.25 }}>
              Start typing to <b>search</b> the dropdown. If you don’t see it, type the name and press <b>Enter</b> to add.
            </Typography>
          </Box>

          <Controller
            name="community"
            control={control}
            render={({ field }) => {
              const items: string[] = Array.isArray(field.value) ? field.value : [];
              const safeItems = items.length === 0 ? [""] : items;

              const setAtIndex = (index: number, raw: any) => {
                const cleaned = normalizeName(raw);
                const next = [...safeItems];
                next[index] = cleaned;
                field.onChange(next);
              };

              const addRow = () => {
                field.onChange([...safeItems, ""]);
              };

              const removeRow = (index: number) => {
                const next = safeItems.filter((_, i) => i !== index);
                field.onChange(next.length === 0 ? [""] : next);
              };

              return (
                <Box sx={{ width: "100%", mt: 1 }}>
                  {safeItems.map((val, idx) => (
                    <Box
                      key={idx}
                      sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}
                    >
                      <Autocomplete
                        freeSolo
                        fullWidth
                        options={communityOptions}
                        value={val || ""}
                        onInputChange={(_, newInputValue) => {
                          const next = [...safeItems];
                          next[idx] = newInputValue;
                          field.onChange(next);
                        }}
                        onChange={(_, newValue) => setAtIndex(idx, newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={idx === 0 ? "Community" : ""}
                            placeholder="Search or type a community"
                            margin="normal"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const v = (e.target as HTMLInputElement).value;
                                setAtIndex(idx, v);
                              }
                            }}
                          />
                        )}
                      />

                      <Button
                        onClick={() => removeRow(idx)}
                        sx={{
                          minWidth: 48,
                          height: 48,
                          borderRadius: "10px",
                          textTransform: "none",
                          border: "1px solid #999",
                          fontWeight: 700,
                          fontSize: "1.1rem"
                        }}
                      >
                        ✕
                      </Button>
                    </Box>
                  ))}

                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
                    <Button
                      onClick={addRow}
                      sx={{
                        textTransform: "none",
                        borderRadius: "10px",
                        border: "1px dashed rgba(0,0,0,0.4)",
                        fontWeight: 700,
                        padding: "8px 14px",
                        fontSize: "1.05rem"
                      }}
                    >
                      + Add another community
                    </Button>

                    <Typography sx={{ fontSize: "1rem", opacity: 0.85 }}>
                      If not listed, type and press Enter.
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />

          <Button
            style={{ width: "100%", margin: "1rem 0" }}
            type="submit"
            variant="contained"
            color="primary"
          >
            SIGN UP
          </Button>

          <BorderLine />

          <LinkButton role="button" onClick={() => navigate("/")}>
            Already have an account
          </LinkButton>
        </FormWrapper>
      </AuthWrapper>
    </AuthContainer>
  );
}

export default Signup;
