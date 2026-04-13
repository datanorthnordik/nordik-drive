export const COMMUNITY_FILTER_MESSAGES = {
  panelAriaLabel: "Community filter panel",
  title: "Community Filter",
  closeLabel: "Close filter",
  closeButtonText: "X",
  searchAriaLabel: "Search communities",
  searchPlaceholder: "Search...",
  clearLabel: "Clear",
  clearAriaLabel: "Clear selected communities",
  selectedLabel: "Selected:",
  emptyState: "No communities found.",
  listboxAriaLabel: "Community list",
} as const;

export const getSelectVisibleLabel = (count: number) => `Select (${count})`;

export const getSelectVisibleAriaLabel = (count: number) =>
  `Select visible communities (${count})`;

export const getSelectedCountAriaLabel = (count: number) => `Selected count ${count}`;
