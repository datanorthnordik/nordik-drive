export const SUBMISSION_GUARD_KINDS = {
  NONE: "none",
  APPROVED: "approved",
  OTHER_USER_ACTIVE: "other-user-active",
} as const;

export type SubmissionGuardKind =
  (typeof SUBMISSION_GUARD_KINDS)[keyof typeof SUBMISSION_GUARD_KINDS];
