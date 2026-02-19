export const EXCLUDED_FIELDS = ["Lat", "Lng", "id", "Mapping Location", "Photos"] as const;

export type FieldType = "text" | "textarea" | "date" | "multi" | "community_multi";

export type DocumentType = "photos" | "document";
export type DocumentCategory = "birth_certificate" | "death_certificate" | "other_document";

export type AdditionalDocItem = {
  id: string;
  file: File;
  document_type: DocumentType; // always "document" for additional docs
  document_category: DocumentCategory;
};

export type ReviewItem = {
  field: string;
  oldValue: string;
  newValue: string;
};

export type PhotoItem = {
  id: string;
  file: File;
  comment: string
};
