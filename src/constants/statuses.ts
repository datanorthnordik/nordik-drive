type FormSubmissionStatusOption = {
  value: string;
  label: string;
  reviewed_needed: boolean;
};

export const FORM_SUBMISSION_STATUS_OPTIONS: FormSubmissionStatusOption[] = [
  {
    value: "pending",
    label: "Pending",
    reviewed_needed: true,
  },
  {
    value: "approved",
    label: "Approved",
    reviewed_needed: false,
  },
  {
    value: "rejected",
    label: "Rejected",
    reviewed_needed: false,
  },
  {
    value: "needs more information",
    label: "Needs More Information",
    reviewed_needed: true,
  },
];