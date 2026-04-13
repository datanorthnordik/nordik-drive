'use client';

import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

import {
  FORM_SUBMISSION_GUARD_CHECKING_MESSAGE,
  FORM_SUBMISSION_GUARD_READONLY_BADGE,
  FORM_SUBMISSION_GUARD_READONLY_HINT,
  FORM_SUBMISSION_GUARD_READONLY_TITLE,
} from "../../../domain/forms/guardMessages";
import {
  color_border,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_text_secondary,
  color_warning,
  color_warning_light,
  color_white,
  shadow_auth_button,
} from "../../../constants/colors";

import type { SubmissionGuardState } from "./hooks/useConfigFormSubmissionGuard";

type Props = {
  guardCheckPending: boolean;
  submissionGuard: SubmissionGuardState;
};

export default function ConfigFormGuardNotice({
  guardCheckPending,
  submissionGuard,
}: Props) {
  if (guardCheckPending) {
    return (
      <div data-testid="submission-guard-loading">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            borderRadius: "14px",
            background: color_white,
            border: `1px solid ${color_border}`,
            px: 2,
            py: 1.5,
          }}
        >
          <CircularProgress size={18} sx={{ color: color_secondary }} />
          <Typography
            sx={{
              color: color_text_primary,
              fontWeight: 800,
              fontSize: "0.9rem",
            }}
          >
            {FORM_SUBMISSION_GUARD_CHECKING_MESSAGE}
          </Typography>
        </Box>
      </div>
    );
  }

  if (submissionGuard.kind === "other-user-active") {
    return (
      <div data-testid="submission-guard-blocked">
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            borderRadius: "14px",
            background: color_warning_light,
            border: `1px solid ${color_border}`,
            borderLeft: `8px solid ${color_warning}`,
            px: { xs: 1.5, md: 2 },
            py: 1.5,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              mt: 0.45,
              borderRadius: "999px",
              background: color_warning,
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              color: color_text_primary,
              fontWeight: 800,
              fontSize: "0.95rem",
              lineHeight: 1.45,
            }}
          >
            {submissionGuard.message}
          </Typography>
        </Box>
      </div>
    );
  }

  if (submissionGuard.kind === "approved") {
    return (
      <div data-testid="submission-guard-warning">
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            borderRadius: "14px",
            background: color_warning_light,
            border: `1px solid ${color_border}`,
            borderLeft: `8px solid ${color_warning}`,
            boxShadow: shadow_auth_button,
            px: { xs: 1.5, md: 2 },
            py: 1.5,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              mt: 0.45,
              borderRadius: "999px",
              background: color_warning,
              flexShrink: 0,
            }}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography
                sx={{
                  color: color_secondary_dark,
                  fontWeight: 900,
                  fontSize: "0.74rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {FORM_SUBMISSION_GUARD_READONLY_TITLE}
              </Typography>
              <Box
                sx={{
                  px: 1,
                  py: 0.4,
                  borderRadius: "999px",
                  background: color_secondary,
                  color: color_white,
                  fontWeight: 900,
                  fontSize: "0.68rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                {FORM_SUBMISSION_GUARD_READONLY_BADGE}
              </Box>
            </Box>
            <Typography
              sx={{
                color: color_text_primary,
                fontWeight: 900,
                fontSize: { xs: "1rem", md: "1.05rem" },
                lineHeight: 1.45,
              }}
            >
              {submissionGuard.message}
            </Typography>
            <Typography
              sx={{
                color: color_text_secondary,
                fontWeight: 700,
                fontSize: "0.82rem",
                lineHeight: 1.45,
              }}
            >
              {FORM_SUBMISSION_GUARD_READONLY_HINT}
            </Typography>
          </Box>
        </Box>
      </div>
    );
  }

  return null;
}
