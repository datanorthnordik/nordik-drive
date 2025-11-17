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
  "NCTR SOURCE": "#FFC000",
  "CORONER'S OFFICE SOURCE": "#FF0000",
  "BAND DOCUMENTS": "#00B0F0",
  "CIRNAC SOURCE": "#7030A0",
  "OFFICE OF THE REGISTRAR GENERAL": "#00B050",
};