import type { SxProps, Theme } from "@mui/material/styles";

import {
  color_black_light,
  color_border,
  color_focus_ring,
  color_secondary,
  color_secondary_dark,
  color_warning,
  color_warning_light,
  color_text_light,
  color_text_primary,
  color_white,
} from "../../../constants/colors";

type AddInfoSx = SxProps<Theme>;

export const ADD_INFO_CARD_SX: AddInfoSx = {
  border: `1px solid ${color_border}`,
  background: color_white,
  borderRadius: "12px",
  p: 2,
};

export const ADD_INFO_CARD_TITLE_SX: AddInfoSx = {
  fontWeight: 900,
  fontSize: "1.1rem",
  color: color_text_primary,
  mb: 1,
};

export const ADD_INFO_CARD_DESCRIPTION_SX: AddInfoSx = {
  color: color_text_primary,
  opacity: 0.85,
  fontSize: "0.95rem",
  mb: 1.5,
};

export const ADD_INFO_PRIMARY_ACTION_BUTTON_SX: AddInfoSx = {
  background: color_secondary,
  fontWeight: 900,
  textTransform: "none",
  borderRadius: "10px",
  px: 2,
  py: 1.1,
  "&:hover": { background: color_secondary_dark },
  "&:focus-visible": {
    outline: `3px solid ${color_focus_ring}`,
    outlineOffset: "2px",
  },
};

export const ADD_INFO_CONSENT_TEXT_SX: AddInfoSx = {
  color: color_text_primary,
  fontSize: "0.98rem",
  fontWeight: 800,
};

export const ADD_INFO_DISCLAIMER_BOX_SX: AddInfoSx = {
  mt: 1.5,
  p: 1.75,
  display: "flex",
  gap: 1.5,
  alignItems: "flex-start",
  borderRadius: "16px",
  border: `3px solid ${color_warning}`,
  background: `linear-gradient(90deg, ${color_white} 0%, ${color_warning_light} 100%)`,
  boxShadow: "0 8px 22px rgba(243, 156, 18, 0.10)",
};

export const ADD_INFO_DISCLAIMER_KICKER_SX: AddInfoSx = {
  color: color_text_primary,
  fontSize: "1.22rem",
  fontWeight: 900,
  lineHeight: 1.3,
  mb: 0.5,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export const ADD_INFO_DISCLAIMER_TEXT_SX: AddInfoSx = {
  color: color_text_primary,
  fontSize: "1.08rem",
  fontWeight: 700,
  lineHeight: 1.7,
};

export const ADD_INFO_REVIEW_SECTION_TITLE_SX: AddInfoSx = {
  fontWeight: 900,
  fontSize: 13,
  color: color_text_primary,
  lineHeight: 1.2,
};

export const ADD_INFO_REVIEW_SECTION_SUBTITLE_SX: AddInfoSx = {
  mt: 0.35,
  fontSize: 11.5,
  fontWeight: 700,
  color: color_text_light,
  lineHeight: 1.35,
};

export const ADD_INFO_REVIEW_DIALOG_TITLE_SX: AddInfoSx = {
  fontWeight: 900,
  fontSize: 16,
  color: color_black_light,
  lineHeight: 1.2,
};
