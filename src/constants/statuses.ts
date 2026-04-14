export const ACTIVITY_STATUS_VALUES = {
  APPROVED: "approved",
  REJECTED: "rejected",
  PENDING: "pending",
  ALL: "all",
} as const;

export const ACTIVITY_STATUS_LABELS = {
  [ACTIVITY_STATUS_VALUES.APPROVED]: "Approved",
  [ACTIVITY_STATUS_VALUES.REJECTED]: "Rejected",
  [ACTIVITY_STATUS_VALUES.PENDING]: "Pending",
  [ACTIVITY_STATUS_VALUES.ALL]: "All",
} as const;

export const ALL_ACTIONS_LABEL = `${ACTIVITY_STATUS_LABELS[ACTIVITY_STATUS_VALUES.ALL]} actions`;
