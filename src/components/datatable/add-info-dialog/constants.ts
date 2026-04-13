export { DOCUMENT_CATEGORY_OPTIONS } from "../../../domain/documents/categories";

export const baseFields = ["input", "textarea", "date", "multi", "community_multi"]

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_MB = 5;

export const MAX_ADDITIONAL_DOCS = 10;
export const MAX_ADDITIONAL_DOCS_TOTAL_MB = 10;

// Safety cap (base64 JSON can blow up size)
export const MAX_COMBINED_UPLOAD_MB = 15;

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
