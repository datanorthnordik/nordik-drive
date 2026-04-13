export const ACTIVITY_ACTION_OPTIONS = [
  { name: "Login", value: "LOGIN" },
  { name: "Signup", value: "SIGNUP" },
  { name: "Password verification", value: "PASSWORD_VERIFICATION" },
  { name: "Upload file", value: "UPLOAD_FILE" },
  { name: "Delete file", value: "DELETE_FILE" },
  { name: "Restore file", value: "RESTORE_FILE" },
  { name: "File access granted", value: "GRAND_FILE_ACCESS" },
  { name: "File access revoked", value: "REVOKE_FILE_ACCESS" },
  { name: "File replaced", value: "REPLACE_FILE" },
  { name: "File reverted to old version", value: "REVERT_FILE" },
] as const;
