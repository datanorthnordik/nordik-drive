export const FORM_SUBMISSION_GUARD_READONLY_TITLE = "Already Approved";
export const FORM_SUBMISSION_GUARD_READONLY_BADGE = "Read Only";
export const FORM_SUBMISSION_GUARD_READONLY_HINT =
  "You can still review this submission here, but you can't create another request from this flow.";
export const FORM_SUBMISSION_GUARD_CHECKING_MESSAGE =
  "Checking for existing form requests. Please wait.";
export const FORM_SUBMISSION_GUARD_LOOKUP_ERROR_MESSAGE =
  "Unable to verify existing form requests. Please try again.";

export const buildApprovedFormSubmissionGuardMessage = (
  formLabel: string,
  subjectDisplayName?: string
) =>
  `${formLabel}${subjectDisplayName ? ` for ${subjectDisplayName}` : ""} is already approved.`;

export const buildOtherUserFormSubmissionGuardMessage = (formKey: string) =>
  `A request for ${formKey} has been already created by someone else.`;
