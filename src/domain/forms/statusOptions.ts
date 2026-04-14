import {
  FORM_SUBMISSION_STATUS_LABELS,
  FORM_SUBMISSION_STATUS_VALUES,
} from "../../constants/statuses";

type FormSubmissionStatusOption = {
  value: string;
  label: string;
  reviewed_needed: boolean;
};

export const FORM_SUBMISSION_STATUS_OPTIONS: FormSubmissionStatusOption[] = [
  {
    value: FORM_SUBMISSION_STATUS_VALUES.PENDING,
    label: FORM_SUBMISSION_STATUS_LABELS[FORM_SUBMISSION_STATUS_VALUES.PENDING],
    reviewed_needed: true,
  },
  {
    value: FORM_SUBMISSION_STATUS_VALUES.APPROVED,
    label: FORM_SUBMISSION_STATUS_LABELS[FORM_SUBMISSION_STATUS_VALUES.APPROVED],
    reviewed_needed: false,
  },
  {
    value: FORM_SUBMISSION_STATUS_VALUES.REJECTED,
    label: FORM_SUBMISSION_STATUS_LABELS[FORM_SUBMISSION_STATUS_VALUES.REJECTED],
    reviewed_needed: false,
  },
  {
    value: FORM_SUBMISSION_STATUS_VALUES.NEEDS_MORE_INFORMATION,
    label:
      FORM_SUBMISSION_STATUS_LABELS[
        FORM_SUBMISSION_STATUS_VALUES.NEEDS_MORE_INFORMATION
      ],
    reviewed_needed: true,
  },
];
