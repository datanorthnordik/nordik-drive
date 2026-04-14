import type { SxProps, Theme } from "@mui/material/styles";

import { color_text_light, color_text_primary } from "../../constants/colors";

type RequestHubSx = SxProps<Theme>;

export const REQUEST_DETAILS_TITLE_SX: RequestHubSx = {
  fontWeight: 900,
  color: color_text_primary,
  fontSize: "1.05rem",
};

export const REQUEST_DETAILS_SUBTITLE_SX: RequestHubSx = {
  mt: 0.5,
  color: color_text_light,
  fontSize: "0.8rem",
  fontWeight: 700,
};

export const REQUEST_DETAILS_SECTION_TITLE_SX: RequestHubSx = {
  fontWeight: 900,
  color: color_text_primary,
  fontSize: "0.95rem",
  mb: 1,
};
