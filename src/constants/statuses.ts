export const REVIEW_STATUS_VALUES = {
  APPROVED: "approved",
  REJECTED: "rejected",
  PENDING: "pending",
} as const;

export type ReviewStatusValue =
  (typeof REVIEW_STATUS_VALUES)[keyof typeof REVIEW_STATUS_VALUES];

export type ReviewDecisionStatus =
  | typeof REVIEW_STATUS_VALUES.APPROVED
  | typeof REVIEW_STATUS_VALUES.REJECTED;

export const REQUEST_STATUS_VALUES = {
  ...REVIEW_STATUS_VALUES,
  ALL: "all",
} as const;

export type RequestStatusValue =
  (typeof REQUEST_STATUS_VALUES)[keyof typeof REQUEST_STATUS_VALUES];

export const FORM_SUBMISSION_STATUS_VALUES = {
  ...REVIEW_STATUS_VALUES,
  NEEDS_MORE_INFORMATION: "needs more information",
} as const;

export type FormSubmissionStatusValue =
  (typeof FORM_SUBMISSION_STATUS_VALUES)[keyof typeof FORM_SUBMISSION_STATUS_VALUES];

export const REVIEW_STATUS_LABELS = {
  [REVIEW_STATUS_VALUES.APPROVED]: "Approved",
  [REVIEW_STATUS_VALUES.REJECTED]: "Rejected",
  [REVIEW_STATUS_VALUES.PENDING]: "Pending",
} as const;

export const REVIEW_STATUS_UPPERCASE_LABELS = {
  [REVIEW_STATUS_VALUES.APPROVED]: "APPROVED",
  [REVIEW_STATUS_VALUES.REJECTED]: "REJECTED",
  [REVIEW_STATUS_VALUES.PENDING]: "PENDING",
} as const;

export const REQUEST_STATUS_LABELS = {
  ...REVIEW_STATUS_LABELS,
  [REQUEST_STATUS_VALUES.ALL]: "All",
} as const;

export const FORM_SUBMISSION_STATUS_LABELS = {
  ...REVIEW_STATUS_LABELS,
  [FORM_SUBMISSION_STATUS_VALUES.NEEDS_MORE_INFORMATION]: "Needs More Information",
} as const;

export const REVIEW_STATUS_FILTER_OPTIONS = [
  {
    value: REVIEW_STATUS_VALUES.PENDING,
    label: REVIEW_STATUS_LABELS[REVIEW_STATUS_VALUES.PENDING],
  },
  {
    value: REVIEW_STATUS_VALUES.APPROVED,
    label: REVIEW_STATUS_LABELS[REVIEW_STATUS_VALUES.APPROVED],
  },
  {
    value: REVIEW_STATUS_VALUES.REJECTED,
    label: REVIEW_STATUS_LABELS[REVIEW_STATUS_VALUES.REJECTED],
  },
] as const;

export const PENDING_REVIEW_STATUS_LABEL = "Pending review";
export const UNKNOWN_STATUS_LABEL = "Unknown";
export const PENDING_STATUS_CSV = REVIEW_STATUS_VALUES.PENDING;
export const APPROVED_REJECTED_STATUS_CSV = `${REVIEW_STATUS_VALUES.APPROVED},${REVIEW_STATUS_VALUES.REJECTED}`;
export const ALL_ACTIONS_LABEL = `${REQUEST_STATUS_LABELS[REQUEST_STATUS_VALUES.ALL]} actions`;

const normalizeStatusInput = (value: unknown) => String(value || "").trim().toLowerCase();

export const isReviewStatusValue = (value: unknown): value is ReviewStatusValue => {
  const normalized = normalizeStatusInput(value);
  return (
    normalized === REVIEW_STATUS_VALUES.APPROVED ||
    normalized === REVIEW_STATUS_VALUES.REJECTED ||
    normalized === REVIEW_STATUS_VALUES.PENDING
  );
};

export const isReviewDecisionStatus = (
  value: unknown
): value is ReviewDecisionStatus => {
  const normalized = normalizeStatusInput(value);
  return (
    normalized === REVIEW_STATUS_VALUES.APPROVED ||
    normalized === REVIEW_STATUS_VALUES.REJECTED
  );
};

export const isFormSubmissionStatusValue = (
  value: unknown
): value is FormSubmissionStatusValue => {
  const normalized = normalizeStatusInput(value);
  return (
    normalized === FORM_SUBMISSION_STATUS_VALUES.APPROVED ||
    normalized === FORM_SUBMISSION_STATUS_VALUES.REJECTED ||
    normalized === FORM_SUBMISSION_STATUS_VALUES.PENDING ||
    normalized === FORM_SUBMISSION_STATUS_VALUES.NEEDS_MORE_INFORMATION
  );
};

export const normalizeReviewStatus = (
  value: unknown,
  fallback: ReviewStatusValue = REVIEW_STATUS_VALUES.PENDING
): ReviewStatusValue => {
  const normalized = normalizeStatusInput(value);
  return isReviewStatusValue(normalized) ? normalized : fallback;
};

export const normalizeFormSubmissionStatus = (
  value: unknown,
  fallback: FormSubmissionStatusValue = FORM_SUBMISSION_STATUS_VALUES.PENDING
): FormSubmissionStatusValue => {
  const normalized = normalizeStatusInput(value);
  return isFormSubmissionStatusValue(normalized) ? normalized : fallback;
};

export const getReviewStatusLabel = (status: ReviewStatusValue) =>
  REVIEW_STATUS_LABELS[status];

export const getReviewStatusUppercaseLabel = (status: ReviewStatusValue) =>
  REVIEW_STATUS_UPPERCASE_LABELS[status];

export const getFormSubmissionStatusLabel = (status: FormSubmissionStatusValue) =>
  FORM_SUBMISSION_STATUS_LABELS[status];

export const isReadonlyFormSubmissionStatus = (value: unknown): boolean => {
  const normalized = normalizeStatusInput(value);
  return (
    normalized === FORM_SUBMISSION_STATUS_VALUES.APPROVED ||
    normalized === FORM_SUBMISSION_STATUS_VALUES.REJECTED
  );
};

export const ACTIVITY_STATUS_VALUES = REQUEST_STATUS_VALUES;
export const ACTIVITY_STATUS_LABELS = REQUEST_STATUS_LABELS;
