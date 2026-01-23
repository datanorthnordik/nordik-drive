import { DocumentCategory, FieldType } from "./types";

export const fieldTypeMap: Record<string, FieldType> = {
  Notes: "textarea",
  "Additional Information": "textarea",
  Admitted: "date",
  Discharged: "date",
  "Date of Birth": "date",
  Siblings: "multi",
  "Parents Names": "multi",

  // Community variants
  "First Nation/Community": "community_multi",
  "First Nation / Community": "community_multi",
};

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_MB = 5;

export const MAX_ADDITIONAL_DOCS = 10;
export const MAX_ADDITIONAL_DOCS_TOTAL_MB = 10;

// Safety cap (base64 JSON can blow up size)
export const MAX_COMBINED_UPLOAD_MB = 15;

export const DOCUMENT_CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "death_certificate", label: "Death Certificate" },
  { value: "other_document", label: "Other Document" },
];

export const ALLOWED_DOC_MIME = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const ACCEPT_DOCS =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";
