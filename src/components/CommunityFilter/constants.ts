import { color_secondary } from "../../constants/colors";

export const COMMUNITY_FILTER_ACCENT = color_secondary;

export const COMMUNITY_FILTER_LAYOUT = {
  panelBorderRadius: 12,
  headerZIndex: 10,
  sectionGap: 8,
  titleFontSize: 16,
  titleFontWeight: 900,
  closeButtonSize: 32,
  closeButtonRadius: 10,
  closeButtonFontSize: 18,
  searchInputHeight: 36,
  searchInputFontSize: 15,
  actionButtonHeight: 34,
  actionButtonFontSize: 14,
  actionButtonBorderRadius: 10,
  countFontSize: 14,
  countFontWeight: 800,
  selectedCountFontWeight: 1000,
  listPadding: 8,
  listItemGap: 10,
  listItemBorderRadius: 10,
  listItemFontSize: 15,
  listItemCheckedFontWeight: 850,
  listItemFontWeight: 650,
  checkboxSize: 16,
  checkboxScale: 1.1,
} as const;

export const COMMUNITY_FILTER_COLORS = {
  surface: "#fff",
  closeButtonText: "#111",
  emptyStateText: "#666",
  selectedItemText: "#0d47a1",
  selectedItemBackground: "#f3f8ff",
} as const;
