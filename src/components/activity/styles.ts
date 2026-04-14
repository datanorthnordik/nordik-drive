import type { SxProps, Theme } from "@mui/material/styles";

import {
  color_background,
  color_border,
  color_secondary,
  color_secondary_dark,
  color_text_light,
  color_text_primary,
  color_white,
} from "../../constants/colors";

type ActivitySx = SxProps<Theme>;

export const ACTIVITY_ROOT_SX: ActivitySx = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

export const ACTIVITY_HEADER_TITLE_SX: ActivitySx = {
  fontWeight: 900,
  color: color_text_primary,
};

export const ACTIVITY_HEADER_SUBTITLE_SX: ActivitySx = {
  color: color_text_light,
};

export const ACTIVITY_SECTION_TITLE_SX: ActivitySx = {
  fontWeight: 900,
  color: color_text_primary,
};

export const ACTIVITY_SECTION_SUBTITLE_SX: ActivitySx = {
  fontSize: 12,
  color: color_text_light,
};

export const ACTIVITY_EMPTY_TEXT_SX: ActivitySx = {
  color: color_text_light,
  fontSize: 13,
};

export const ACTIVITY_EVENTS_CHIP_SX: ActivitySx = {
  fontWeight: 900,
  height: 26,
  borderRadius: "10px",
  backgroundColor: color_background,
  border: `1px solid ${color_border}`,
  color: color_text_primary,
};

export const FILE_ACTIVITY_PENDING_CHIP_SX: ActivitySx = {
  fontWeight: 900,
  borderRadius: "10px",
  background: color_white,
  border: `1px solid ${color_secondary}`,
  color: color_secondary_dark,
};
