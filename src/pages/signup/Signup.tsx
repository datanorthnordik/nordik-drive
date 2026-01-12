import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  TextField,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AuthWrapper, FormWrapper } from "../../components/Wrappers";
import { LinkButton } from "../../components/Links";
import TextGroup from "../../components/TextGroup";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { AuthContainer } from "../../components/containers/Containers";
import toast from "react-hot-toast";
import { signup_success } from "../../constants/messages";

// ✅ use ONLY constants (no hardcoded colors)
import {
  color_secondary,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_border,
  color_background,
} from "../../constants/colors";

/* ===========================
   Validation Schema
=========================== */
const schema = yup.object().shape({
  firstname: yup.string().required("First name is required"),
  lastname: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required").min(4, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
  community: yup.array().of(yup.string().trim().required("Please select or type a community")),
});

function Signup() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      community: [""],
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data, loading, error, fetchData } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/signup",
    "POST",
    false
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const communityOptions = useMemo(() => {
    return (communitiesData as any)?.communities?.map((c: any) => c.name) || [];
  }, [communitiesData]);

  const normalizeName = (v: any) => (typeof v === "string" ? v.trim() : "");
  const existsInOptions = (name: string) =>
    communityOptions.some(
      (o: string) => o.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const onSubmit = async (formData: any) => {
    const cleaned = (formData.community || [])
      .map((x: string) => (x || "").trim())
      .filter((x: string) => x.length > 0);

    const seen = new Set<string>();
    const unique = cleaned.filter((n: string) => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const missing = unique.filter((name: string) => !existsInOptions(name));

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
    if (error) toast.error(error);
  }, [error]);

  return (
    <AuthContainer>
      <Loader loading={loading} />

      <AuthWrapper>
        {/* Logos Section (keep previous sizes) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap",
            marginBottom: "1.25rem",
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

        {/* Title (center like UX) */}
        <Typography
          sx={{
            textAlign: "center",
            fontWeight: 800,
            fontSize: "1.35rem",
            color: color_text_primary,
            mb: 1.5,
          }}
        >
          Create a new account
        </Typography>

        <FormWrapper onSubmit={handleSubmit(onSubmit)}>
          {/* First/Last in a row like UX */}
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
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: color_white,
                    },
                  }}
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
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: color_white,
                    },
                  }}
                />
              )}
            />
          </TextGroup>

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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: color_white,
                  },
                }}
              />
            )}
          />

          {/* Passwords side-by-side like UX */}
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
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: color_white,
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
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: color_white,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          edge="end"
                          aria-label={
                            showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                          }
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

          {/* Community Info Card (like UX blue-header section but using constants only) */}
          <Box
            sx={{
              width: "100%",
              mt: 1.5,
              mb: 0.75,
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${color_border}`,
              backgroundColor: color_background,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 900,
                color: color_text_primary,
                lineHeight: 1.35,
              }}
            >
              First Nation / Community (you can add more than one)
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", color: color_text_secondary, mt: 0.5, lineHeight: 1.4 }}>
              Start typing to search the dropdown. If you don’t see it, type the name and press Enter to add.
            </Typography>
          </Box>

          {/* Community Rows */}
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

              const addRow = () => field.onChange([...safeItems, ""]);

              const removeRow = (index: number) => {
                const next = safeItems.filter((_, i) => i !== index);
                field.onChange(next.length === 0 ? [""] : next);
              };

              return (
                <Box sx={{ width: "100%", mt: 0.5 }}>
                  {safeItems.map((val, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        mt: 1,
                      }}
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
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: color_white,
                              },
                            }}
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

                      {/* X button like UX (using only constants) */}
                      <Button
                        onClick={() => removeRow(idx)}
                        aria-label="Remove community"
                        sx={{
                          minWidth: 46,
                          height: 46,
                          borderRadius: 2,
                          textTransform: "none",
                          border: `1px solid ${color_border}`,
                          fontWeight: 900,
                          color: color_text_primary,
                          backgroundColor: color_white,
                        }}
                      >
                        ✕
                      </Button>
                    </Box>
                  ))}

                  {/* Add another community row like UX */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
                    <Button
                      onClick={addRow}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 900,
                        px: 2,
                        border: `1px solid ${color_secondary}`,
                        color: color_secondary,
                        backgroundColor: color_white,
                      }}
                    >
                      + Add another community
                    </Button>

                    <Typography sx={{ fontSize: "0.85rem", color: color_text_secondary }}>
                      If not listed, type and press Enter.
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />

          {/* SIGN UP button (blue, full width like UX) */}
          <Button
            type="submit"
            variant="contained"
            sx={{
              width: "100%",
              mt: 2,
              mb: 1.25,
              borderRadius: 2,
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              py: 1.3,
              backgroundColor: `${color_secondary} !important`,
              boxShadow: "none",
            }}
          >
            SIGN UP
          </Button>

          {/* OR divider like UX */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 1.75 }}>
            <Divider sx={{ flex: 1, borderColor: color_border }} />
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: color_text_secondary }}>
              OR
            </Typography>
            <Divider sx={{ flex: 1, borderColor: color_border }} />
          </Box>

          {/* Already have an account link */}
          <Box sx={{ textAlign: "center", mb: 0.5 }}>
            <LinkButton role="button" onClick={() => navigate("/")}>
              Already have an account?
            </LinkButton>
          </Box>
        </FormWrapper>
      </AuthWrapper>
    </AuthContainer>
  );
}

export default Signup;