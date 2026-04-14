import type { SxProps, Theme } from "@mui/material/styles";

import {
  color_error,
  color_success,
  color_text_primary,
  color_text_secondary,
} from "../../constants/colors";

type ViewerSx = SxProps<Theme>;

export const VIEWER_TITLE_SX: ViewerSx = {
  fontWeight: 900,
  color: color_text_primary,
};

export const VIEWER_SECTION_TITLE_SX: ViewerSx = {
  fontWeight: 900,
  color: color_text_primary,
};

export const VIEWER_SUBSECTION_TITLE_SX: ViewerSx = {
  fontWeight: 800,
  color: color_text_primary,
};

export const getViewerStatusChipSx = (status?: string | null) => {
  if (status === "approved") {
    return {
      color: color_success,
      backgroundColor: "rgba(39, 174, 96, 0.12)",
      border: "1px solid rgba(39, 174, 96, 0.25)",
      fontWeight: 900,
    };
  }
  if (status === "rejected") {
    return {
      color: color_error,
      backgroundColor: "rgba(231, 76, 60, 0.12)",
      border: "1px solid rgba(231, 76, 60, 0.25)",
      fontWeight: 900,
    };
  }
  return {
    color: color_text_secondary,
    backgroundColor: "rgba(107, 114, 128, 0.12)",
    border: "1px solid rgba(107, 114, 128, 0.25)",
    fontWeight: 900,
  };
};
