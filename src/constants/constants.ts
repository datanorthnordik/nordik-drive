export const contact = {
    name: "Community support team",
    address: "1520 Queen St. East",
    street: "Sault Ste. Marie  P6A 2G4",
    telephone: "(705) 949-2301 ext. 4812",
    email: "info@nordikinstitute.com"
}


export const actions = [
    {"name": "Login", "value": "LOGIN"},
    {"name": "Signup", "value": "SIGNUP"},
    {"name": "Password verification", "value": "PASSWORD_VERIFICATION"},
    {"name": "Upload file", "value": "UPLOAD_FILE"},
    {"name": "Delete file", "value": "DELETE_FILE"},
    {"name": "Restore file", "value": "RESTORE_FILE"},
    {"name": "File access granted", "value": "GRAND_FILE_ACCESS"},
    {"name": "File access revoked", "value": "REVOKE_FILE_ACCESS"},
    {"name": "File replaced", "value": "REPLACE_FILE"},
    {"name": "File reverted to old version", "value": "REVERT_FILE"}
]

export const colorSources: Record<string, string> = {
  "FURTHER INVESTIGATION REQUIRED": "#baba58",
  "OFFICE OF THE REGISTRAR GENERAL": "#0070C0",
  "LIBRARY AND ARCHIVES CANADA": "#00B0F0",
  "CIRNAC SOURCE": "#7030A0",
  "NCTR SOURCE": "#FFC000",
  "CORONER'S OFFICE SOURCE": "#FF9999",
  "REPORT COMPLETE": "#00B050",
};

export const API_BASE = "https://nordikdriveapi-724838782318.us-west1.run.app/api";

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


