import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button, TextField, Box, Typography } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
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

import {
  color_secondary,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_border,
  color_background,
} from "../../constants/colors";

import {
  AuthLogosHeader,
  AuthTitle,
  AuthControlledTextField,
  AuthPasswordField,
  AuthPrimaryButton,
  OrDivider,
} from "./AuthShared";

type SignupFormValues = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  community: string[];
};

const schema = yup.object({
  firstname: yup.string().required("First name is required"),
  lastname: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
  community: yup.array().of(yup.string().trim().required("Please select or type a community")).required(),
});

function Signup() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
      community: [""],
    },
  });

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
    communityOptions.some((o: string) => o.trim().toLowerCase() === name.trim().toLowerCase());

  const onSubmit = async (formData: SignupFormValues) => {
    const cleaned = (formData.community || [])
      .map((x) => (x || "").trim())
      .filter((x) => x.length > 0);

    const seen = new Set<string>();
    const unique = cleaned.filter((n) => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const missing = unique.filter((name) => !existsInOptions(name));

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
        <AuthLogosHeader mb={1.25} />

        <AuthTitle fontSize="1.35rem" mb={1.5} fontWeight={800}>
          Create a new account
        </AuthTitle>

        <FormWrapper onSubmit={handleSubmit(onSubmit)}>
          <TextGroup>
            <AuthControlledTextField
              name="firstname"
              control={control as any}
              label="First name"
              errorMessage={errors.firstname?.message}
              textFieldProps={{ style: { width: "50%" } }}
            />

            <AuthControlledTextField
              name="lastname"
              control={control as any}
              label="Last name"
              errorMessage={errors.lastname?.message}
              textFieldProps={{ style: { width: "50%" } }}
            />
          </TextGroup>

          <AuthControlledTextField
            name="email"
            control={control as any}
            label="Email address"
            errorMessage={errors.email?.message}
          />

          <TextGroup>
            <AuthPasswordField
              name="password"
              control={control as any}
              label="Password"
              errorMessage={errors.password?.message}
            />

            <AuthPasswordField
              name="confirmPassword"
              control={control as any}
              label="Confirm Password"
              errorMessage={errors.confirmPassword?.message}
            />
          </TextGroup>

          {/* Community Info Card */}
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
                const cleanedName = normalizeName(raw);
                const next = [...safeItems];
                next[index] = cleanedName;
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

          <AuthPrimaryButton type="submit" sx={{ mt: 2, mb: 1.25, height: "auto", py: 1.3 }}>
            SIGN UP
          </AuthPrimaryButton>

          <OrDivider my={1.75} dividerColor={color_border} textColor={color_text_secondary} />

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
