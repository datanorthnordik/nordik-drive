import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CloseRounded,
  ImageOutlined,
  SendRounded,
  SupportAgentRounded,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

import { apiUrl } from "../../config/api";
import { apiRequest } from "../../hooks/useFetch";
import {
  color_border,
  color_error,
  color_secondary_dark,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../constants/colors";
import { normalizeEmail } from "../auth/authValidation";
import {
  SUPPORT_REQUEST_TYPES,
  SUPPORT_SCREENSHOT_ACCEPT,
  SupportRequestFormErrors,
  SupportRequestFormValues,
  createDefaultSupportRequestForm,
  getSupportRequestTypeMeta,
  validateSupportRequestForm,
  validateSupportScreenshot,
} from "./supportRequest";

const buildUserDisplayName = (user: any) =>
  `${String(user?.firstname || "").trim()} ${String(user?.lastname || "").trim()}`.trim();

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SupportRequestCard = () => {
  const user = useSelector((state: any) => state.auth?.user ?? null);
  const defaultName = buildUserDisplayName(user);
  const defaultEmail = normalizeEmail(String(user?.email || ""));

  const [formValues, setFormValues] = useState<SupportRequestFormValues>(() =>
    createDefaultSupportRequestForm(defaultName, defaultEmail)
  );
  const [errors, setErrors] = useState<SupportRequestFormErrors>({});
  const [selectedScreenshot, setSelectedScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const requestTypeMeta = getSupportRequestTypeMeta(formValues.requestType);

  useEffect(() => {
    setFormValues((current) => ({
      ...current,
      name: current.name || defaultName,
      email: current.email || defaultEmail,
    }));
  }, [defaultEmail, defaultName]);

  useEffect(() => {
    if (!selectedScreenshot) {
      setPreviewUrl("");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedScreenshot);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedScreenshot]);

  const updateField = <K extends keyof SupportRequestFormValues>(
    key: K,
    value: SupportRequestFormValues[K]
  ) => {
    setFormValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleScreenshotChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    event.target.value = "";

    const screenshotError = validateSupportScreenshot(nextFile);
    if (screenshotError) {
      setSelectedScreenshot(null);
      setErrors((current) => ({ ...current, screenshot: screenshotError }));
      setSuccessMessage("");
      return;
    }

    setSelectedScreenshot(nextFile);
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors.screenshot;
      return nextErrors;
    });
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const clearScreenshot = () => {
    setSelectedScreenshot(null);
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors.screenshot;
      return nextErrors;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateSupportRequestForm(formValues, selectedScreenshot);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSuccessMessage("");
      return;
    }

    setSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    const normalizedEmail = normalizeEmail(formValues.email);
    const payload = new FormData();
    payload.append("request_type", formValues.requestType);
    payload.append("requester_name", formValues.name.trim());
    payload.append("requester_email", normalizedEmail);
    payload.append("subject", formValues.subject.trim());
    payload.append("message", formValues.message.trim());

    if (selectedScreenshot) {
      payload.append("screenshot", selectedScreenshot);
    }

    try {
      const response = await apiRequest<{ message?: string }>(
        apiUrl("support-requests"),
        "POST",
        payload
      );

      const nextSuccessMessage =
        String(response?.message || "").trim() ||
        "Your request has been sent. Our support team will follow up soon.";

      const retainedName = defaultName || formValues.name.trim();
      const retainedEmail = defaultEmail || normalizedEmail;

      setFormValues(createDefaultSupportRequestForm(retainedName, retainedEmail));
      setSelectedScreenshot(null);
      setSuccessMessage(nextSuccessMessage);
      toast.success(nextSuccessMessage);
    } catch (error: any) {
      toast.error(error?.message || "We couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        background: color_white,
        border: `1px solid ${color_border}`,
        boxShadow: "0 16px 30px rgba(0,0,0,0.08)",
      }}
    >
      <CardContent sx={{ px: { xs: 2.2, md: 2.6 }, py: { xs: 2.3, md: 2.7 } }}>
        <Stack spacing={2}>
          <Box
            sx={{
              p: { xs: 1.6, md: 1.8 },
              borderRadius: "18px",
              background: color_white_smoke,
              border: `1px solid ${color_border}`,
            }}
          >
            <Box sx={{ display: "flex", gap: 1.4, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  borderRadius: "16px",
                  background: color_white,
                  border: `1px solid ${color_border}`,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 8px 16px rgba(0, 58, 122, 0.08)",
                }}
              >
                <SupportAgentRounded sx={{ color: color_secondary_dark, fontSize: 26 }} />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: { xs: 20, md: 22 },
                    fontWeight: 900,
                    color: color_text_primary,
                    lineHeight: 1.25,
                    mb: 0.55,
                  }}
                >
                  Ask a question or report an issue
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: 13.8, md: 14.4 },
                    lineHeight: 1.7,
                    color: color_text_secondary,
                    fontWeight: 700,
                  }}
                >
                  Use this form to send product questions, technical issues, or a screenshot that
                  helps explain what you&apos;re seeing.
                </Typography>
              </Box>
            </Box>
          </Box>

          {successMessage ? (
            <Box
              role="status"
              sx={{
                px: 1.6,
                py: 1.2,
                borderRadius: "14px",
                border: `1px solid rgba(22, 101, 52, 0.16)`,
                background: "rgba(240, 253, 244, 0.95)",
              }}
            >
              <Typography sx={{ color: "#166534", fontWeight: 800, fontSize: 14.2 }}>
                {successMessage}
              </Typography>
            </Box>
          ) : null}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.6}>
              <TextField
                select
                label="Request type"
                value={formValues.requestType}
                onChange={(event) =>
                  updateField("requestType", event.target.value as SupportRequestFormValues["requestType"])
                }
                fullWidth
                size="small"
                helperText={requestTypeMeta.helperText}
              >
                {SUPPORT_REQUEST_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4}>
                <TextField
                  label="Your name"
                  value={formValues.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  error={Boolean(errors.name)}
                  helperText={errors.name || " "}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Email address"
                  value={formValues.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  error={Boolean(errors.email)}
                  helperText={errors.email || " "}
                  fullWidth
                  size="small"
                />
              </Stack>

              <TextField
                label="Subject"
                value={formValues.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                error={Boolean(errors.subject)}
                helperText={errors.subject || " "}
                fullWidth
                size="small"
                inputProps={{ maxLength: 140 }}
              />

              <TextField
                label="How can we help?"
                value={formValues.message}
                onChange={(event) => updateField("message", event.target.value)}
                error={Boolean(errors.message)}
                helperText={
                  errors.message ||
                  `${formValues.message.trim().length}/2000 characters`
                }
                fullWidth
                multiline
                minRows={5}
                placeholder={requestTypeMeta.messagePlaceholder}
              />

              <Box
                sx={{
                  p: 1.6,
                  borderRadius: "18px",
                  background: color_white_smoke,
                  border: `1px dashed ${errors.screenshot ? color_error : color_border}`,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.2}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 14.5,
                        fontWeight: 900,
                        color: color_text_primary,
                        mb: 0.35,
                      }}
                    >
                      Screenshot (optional)
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13.2,
                        lineHeight: 1.6,
                        color: color_text_secondary,
                        fontWeight: 700,
                      }}
                    >
                      Attach a PNG, JPG, or WEBP image up to 5 MB if it helps explain the issue.
                    </Typography>
                  </Box>

                  <Button
                    component="label"
                    startIcon={<ImageOutlined />}
                    sx={{
                      alignSelf: { xs: "stretch", sm: "center" },
                      textTransform: "none",
                      borderRadius: "14px",
                      px: 2.1,
                      py: 1,
                      fontWeight: 900,
                      color: color_secondary_dark,
                      border: `1px solid ${color_border}`,
                      background: color_white,
                      "&:hover": { background: color_white },
                    }}
                  >
                    Attach screenshot
                    <input
                      hidden
                      type="file"
                      accept={SUPPORT_SCREENSHOT_ACCEPT}
                      aria-label="Attach a screenshot"
                      onChange={handleScreenshotChange}
                    />
                  </Button>
                </Stack>

                {errors.screenshot ? (
                  <Typography role="alert" sx={{ color: color_error, fontWeight: 700, mt: 1.1 }}>
                    {errors.screenshot}
                  </Typography>
                ) : null}

                {selectedScreenshot ? (
                  <Box
                    sx={{
                      mt: 1.4,
                      p: 1.2,
                      borderRadius: "16px",
                      background: color_white,
                      border: `1px solid ${color_border}`,
                      display: "flex",
                      gap: 1.2,
                      alignItems: "center",
                    }}
                  >
                    {previewUrl ? (
                      <Box
                        component="img"
                        src={previewUrl}
                        alt="Selected screenshot preview"
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: "12px",
                          objectFit: "cover",
                          border: `1px solid ${color_border}`,
                          background: color_white_smoke,
                        }}
                      />
                    ) : null}

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 900,
                          color: color_text_primary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {selectedScreenshot.name}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.3,
                          fontSize: 12.8,
                          color: color_text_secondary,
                          fontWeight: 700,
                        }}
                      >
                        {formatFileSize(selectedScreenshot.size)}
                      </Typography>
                    </Box>

                    <IconButton
                      aria-label="Remove screenshot"
                      onClick={clearScreenshot}
                      sx={{ color: color_text_secondary }}
                    >
                      <CloseRounded />
                    </IconButton>
                  </Box>
                ) : null}
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Typography
                  sx={{
                    fontSize: 12.8,
                    color: color_text_secondary,
                    fontWeight: 700,
                  }}
                >
                  We&apos;ll send your request to the support team and follow up by email.
                </Typography>

                <Button
                  type="submit"
                  disabled={submitting}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={18} sx={{ color: color_white }} />
                    ) : (
                      <SendRounded />
                    )
                  }
                  sx={{
                    alignSelf: { xs: "stretch", sm: "center" },
                    minWidth: 170,
                    textTransform: "none",
                    borderRadius: "14px",
                    px: 2.4,
                    py: 1.05,
                    fontWeight: 900,
                    fontSize: 15.2,
                    background: color_secondary_dark,
                    color: color_white,
                    boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
                    "&:hover": { background: color_secondary_dark },
                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.82)",
                      background: "rgba(0, 58, 122, 0.68)",
                    },
                  }}
                >
                  {submitting ? "Sending..." : "Send request"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SupportRequestCard;
