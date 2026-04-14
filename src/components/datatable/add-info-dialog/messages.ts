import {
  MAX_ADDITIONAL_DOCS,
  MAX_ADDITIONAL_DOCS_TOTAL_MB,
  MAX_COMBINED_UPLOAD_MB,
  MAX_PHOTOS,
  MAX_PHOTO_MB,
} from "./constants";

export const PHOTO_UPLOAD_FALLBACK_TITLE = "Photos";
export const getPhotoUploadDefaultDescription = () =>
  `Upload up to ${MAX_PHOTOS} images or ${MAX_PHOTO_MB} MB total.`;
export const PHOTO_UPLOAD_SELECT_LABEL = "Select Photos";
export const PHOTO_UPLOAD_COMMENT_LABEL = "Comment";
export const PHOTO_UPLOAD_COMMENT_PLACEHOLDER = "Add a comment...";
export const getPhotoUploadAltText = (index: number) => `Photo ${index + 1}`;
export const getPhotoUploadWarningText = (percentUsed: number) => {
  if (percentUsed >= 100) return "You have reached the upload limit.";
  if (percentUsed >= 80) return "You are close to the upload limit.";
  return "";
};
export const getPhotoUploadLimitText = (photoCount: number, totalPhotoMB: number) =>
  `Upload Limit: ${photoCount}/${MAX_PHOTOS} photos (${totalPhotoMB.toFixed(2)} MB of ${MAX_PHOTO_MB} MB)`;
export const getPhotoCombinedUploadText = (totalCombinedMB: number) =>
  `Total upload (photos + docs): ${totalCombinedMB.toFixed(2)} MB / ${MAX_COMBINED_UPLOAD_MB} MB`;

export const ADDITIONAL_DOCS_FALLBACK_TITLE = "Additional Documents";
export const ADDITIONAL_DOCS_UPLOAD_LABEL = "Upload Documents";
export const ADDITIONAL_DOCS_CATEGORY_LABEL = "Document Category";
export const ADDITIONAL_DOCS_CATEGORY_PLACEHOLDER = "Type document category";
export const ADDITIONAL_DOCS_REMOVE_LABEL = "Remove";
export const getAdditionalDocsSummaryText = (
  additionalDocsCount: number,
  totalAdditionalDocsMB: number
) =>
  `Docs: ${additionalDocsCount}/${MAX_ADDITIONAL_DOCS} - ${totalAdditionalDocsMB.toFixed(2)} MB / ${MAX_ADDITIONAL_DOCS_TOTAL_MB} MB`;

export const REVIEW_DIALOG_SUBTITLE =
  "Please review all updates carefully before submitting.";
export const REVIEW_DIALOG_CLOSE_LABEL = "Close";
export const REVIEW_DIALOG_BACK_LABEL = "Back";
export const REVIEW_DIALOG_CHANGES_TITLE = "Review changes";
export const REVIEW_DIALOG_CHANGES_SUBTITLE =
  "Compare the previous value with the new value for each updated field.";
export const REVIEW_DIALOG_EMPTY_CHANGES_TEXT = "No field changes to review.";
export const REVIEW_DIALOG_OLD_VALUE_LABEL = "Old";
export const REVIEW_DIALOG_NEW_VALUE_LABEL = "New";
export const REVIEW_DIALOG_EMPTY_VALUE = "-";
export const REVIEW_DIALOG_ATTACHMENTS_TITLE = "Attachments";
export const REVIEW_DIALOG_ATTACHMENTS_SUBTITLE =
  "These files will be included with your submission.";
export const getReviewDialogPhotosChipLabel = (photosCount: number) =>
  `Photos: ${photosCount} selected`;
export const getReviewDialogDocsChipLabel = (docsCount: number) =>
  `Additional Documents: ${docsCount} selected`;
export const REVIEW_DIALOG_CONSENT_TITLE = "Consent & upload summary";
export const REVIEW_DIALOG_CONSENT_SUBTITLE =
  "Final confirmation details before submission.";
export const getReviewDialogPhotoConsentLabel = (consent: boolean) =>
  `Photo consent: ${consent ? "Yes" : "No"}`;
export const getReviewDialogArchiveConsentLabel = (archiveConsent: boolean) =>
  `Archive consent: ${archiveConsent ? "Yes" : "No"}`;
export const REVIEW_DIALOG_TOTAL_UPLOAD_LABEL = "Total upload";
