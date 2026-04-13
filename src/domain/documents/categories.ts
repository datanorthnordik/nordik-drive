export const DOCUMENT_CATEGORY_LABELS = {
  birth_certificate: "Birth Certificate",
  death_certificate: "Death Certificate",
  other_document: "Other Document",
} as const;

export type DocumentCategory = keyof typeof DOCUMENT_CATEGORY_LABELS;

export const DOCUMENT_CATEGORY_OPTIONS: {
  value: DocumentCategory;
  label: (typeof DOCUMENT_CATEGORY_LABELS)[DocumentCategory];
}[] = Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => ({
  value: value as DocumentCategory,
  label,
}));

export const getDocumentCategoryLabel = (value?: string) => {
  if (!value) return "Unknown";
  return DOCUMENT_CATEGORY_LABELS[value as DocumentCategory] ?? value;
};
