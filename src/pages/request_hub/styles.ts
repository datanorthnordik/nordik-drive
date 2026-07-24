import type { SxProps, Theme } from "@mui/material/styles";

import {
  color_border,
  color_focus_ring,
  color_light_gray,
  color_secondary,
  color_secondary_dark,
  color_text_light,
  color_text_primary,
  color_white,
  color_white_smoke,
  shadow_auth_button,
} from "../../constants/colors";

type RequestHubSx = SxProps<Theme>;

export const REQUEST_HUB_SURFACE_SX: RequestHubSx = {
  minHeight: "100%",
  border: `1px solid ${color_border}`,
  borderRadius: "22px",
  overflow: "hidden",
  background: color_white,
  boxShadow: "0 18px 36px rgba(0, 0, 0, 0.06)",
};

export const REQUEST_HUB_HEADER_SX: RequestHubSx = {
  background: `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`,
  borderBottom: `1px solid ${color_border}`,
};

export const REQUEST_HUB_HEADER_ICON_SX: RequestHubSx = {
  width: 44,
  height: 44,
  minWidth: 44,
  display: "grid",
  placeItems: "center",
  borderRadius: "14px",
  color: color_white,
  background: "rgba(255, 255, 255, 0.15)",
  border: "1px solid rgba(255, 255, 255, 0.22)",
  boxShadow: "0 10px 18px rgba(0, 0, 0, 0.12)",
};

export const REQUEST_HUB_HEADER_TITLE_SX: RequestHubSx = {
  color: color_white,
  fontWeight: 950,
};

export const REQUEST_HUB_HEADER_SUBTITLE_SX: RequestHubSx = {
  color: "rgba(255, 255, 255, 0.84)",
  fontWeight: 700,
};

export const REQUEST_HUB_CONTENT_SX: RequestHubSx = {
  background: color_white_smoke,
};

export const REQUEST_HUB_PANEL_SX: RequestHubSx = {
  border: `1px solid ${color_border}`,
  borderRadius: "18px",
  background: color_white,
};

export const REQUEST_HUB_EMPTY_STATE_SX: RequestHubSx = {
  border: `1px dashed ${color_border}`,
  borderRadius: "18px",
  background: color_white,
};

export const REQUEST_HUB_PRIMARY_BUTTON_SX: RequestHubSx = {
  textTransform: "none",
  fontWeight: 900,
  borderRadius: "12px",
  background: color_secondary,
  color: color_white,
  boxShadow: shadow_auth_button,
  "&:hover": {
    background: color_secondary_dark,
    boxShadow: shadow_auth_button,
  },
  "&:focus-visible": {
    outline: `3px solid ${color_focus_ring}`,
    outlineOffset: "2px",
  },
};

export const REQUEST_HUB_SECONDARY_BUTTON_SX: RequestHubSx = {
  textTransform: "none",
  fontWeight: 900,
  borderRadius: "12px",
  color: color_text_primary,
  border: `1px solid ${color_border}`,
  background: color_white,
  "&:hover": {
    background: color_light_gray,
  },
  "&:focus-visible": {
    outline: `3px solid ${color_focus_ring}`,
    outlineOffset: "2px",
  },
};

export const REQUEST_HUB_DIALOG_PAPER_SX: RequestHubSx = {
  borderRadius: "22px",
  overflow: "hidden",
  border: `1px solid ${color_border}`,
};

export const REQUEST_HUB_DIALOG_HEADER_SX: RequestHubSx = {
  ...REQUEST_HUB_HEADER_SX,
};

export const REQUEST_HUB_DIALOG_CONTENT_SX: RequestHubSx = {
  background: color_white_smoke,
};

export const REQUEST_HUB_DIALOG_ACTIONS_SX: RequestHubSx = {
  background: color_white,
  borderTop: `1px solid ${color_border}`,
};

export const REQUEST_HUB_NAV_HEADER_SX: RequestHubSx = {
  background: `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`,
};

export const REQUEST_HUB_NAV_ITEM_SX: RequestHubSx = {
  borderRadius: "16px",
  py: 1.35,
  border: `1px solid ${color_border}`,
  background: color_white,
  color: color_text_primary,
  "&:hover": {
    background: color_light_gray,
    borderColor: color_secondary,
  },
  "& .MuiListItemIcon-root": {
    color: color_secondary_dark,
  },
  "& .MuiListItemText-primary": {
    color: "inherit",
    fontWeight: 950,
  },
  "&.Mui-selected": {
    background: `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`,
    borderColor: color_secondary_dark,
    color: color_white,
  },
  "&.Mui-selected:hover": {
    background: `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`,
  },
  "&.Mui-selected .MuiListItemIcon-root": {
    color: color_white,
  },
};

export const REQUEST_HUB_SECTION_KICKER_SX: RequestHubSx = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: color_text_light,
};

export const REQUEST_DETAILS_TITLE_SX: RequestHubSx = {
  fontWeight: 950,
  fontSize: 18,
  color: color_text_primary,
  lineHeight: 1.2,
};

export const REQUEST_DETAILS_SUBTITLE_SX: RequestHubSx = {
  mt: 0.35,
  fontSize: 12.8,
  fontWeight: 700,
  color: color_text_light,
  lineHeight: 1.45,
};

export const REQUEST_DETAILS_SECTION_TITLE_SX: RequestHubSx = {
  fontWeight: 900,
  fontSize: 13,
  color: color_text_primary,
  lineHeight: 1.2,
};
