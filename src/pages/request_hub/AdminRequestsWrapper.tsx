"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import RequestsHub from "./RequestHub";
import PendingEditRequestsTable from "./PendingRequests";
import {
  color_border,
  color_text_primary,
  color_text_secondary,
  color_white,
} from "../../constants/colors";

function AdminFormSubmissionRequestsPlaceholder() {
  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 720,
          border: `1px dashed ${color_border}`,
          borderRadius: "20px",
          background: color_white,
          p: { xs: 3, md: 4 },
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 20, md: 24 },
            fontWeight: 950,
            color: color_text_primary,
            mb: 1,
          }}
        >
          Form Submission Requests
        </Typography>

        <Typography
          sx={{
            fontSize: 14,
            color: color_text_secondary,
            lineHeight: 1.7,
          }}
        >
          This section is kept as a placeholder for now.
        </Typography>
      </Box>
    </Box>
  );
}

export default function AdminRequestsWrapper() {
  return (
    <RequestsHub
      addInfoRequests={<PendingEditRequestsTable />}
      formSubmissionRequests={<AdminFormSubmissionRequestsPlaceholder />}
    />
  );
}