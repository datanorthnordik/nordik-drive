import {
  REVIEW_STATUS_VALUES,
  getReviewStatusLabel,
  normalizeReviewStatus,
  type ReviewStatusValue,
} from "../../constants/statuses";

export const PHOTO_VIEWER_TITLE = "Photo Viewer";
export const VIEWER_COMMENTS_TITLE = "Comments";
export const VIEWER_UPLOADER_COMMENT_TITLE = "Uploader Comment";
export const VIEWER_REVIEW_TITLE = "Review";
export const VIEWER_REVIEW_COMMENT_LABEL = "Review Comment";
export const VIEWER_NO_COMMENTS_TEXT = "No comments";
export const VIEWER_NO_PHOTOS_TEXT = "No photos found.";
export const VIEWER_EMPTY_COUNT_TEXT = "No photos";
export const VIEWER_PREVIOUS_TOOLTIP = "Previous";
export const VIEWER_NEXT_TOOLTIP = "Next";
export const VIEWER_ZOOM_OUT_TOOLTIP = "Zoom out";
export const VIEWER_RESET_ZOOM_TOOLTIP = "Reset zoom";
export const VIEWER_ZOOM_IN_TOOLTIP = "Zoom in";
export const VIEWER_APPROVE_LABEL = "Approve";
export const VIEWER_REJECT_LABEL = "Reject";
export const VIEWER_DOWNLOAD_LABEL = "Download";
export const VIEWER_OPEN_LABEL = "Open";
export const VIEWER_CLOSE_LABEL = "Close";
export const VIEWER_DOWNLOAD_ALL_LABEL = "Download All";
export const DOCUMENT_FALLBACK_TITLE = "Document";
export const DOCUMENT_EMPTY_TEXT = "No Documents Available";
export const DOCUMENT_LOADING_TEXT = "Loading document...";
export const DOCUMENT_LOAD_ERROR_TITLE = "Failed to load document";
export const DOCUMENT_NOT_LOADED_TEXT = "Document not loaded yet.";
export const DOCUMENT_UNSUPPORTED_PREVIEW_PREFIX = "Preview not supported for";
export const DOCUMENT_UNSUPPORTED_PREVIEW_SUFFIX = "in browser.";
export const DOCUMENT_UNSUPPORTED_PREVIEW_HELPER =
  'Use "Open" to download/open it with your system app.';
export const DOCUMENT_PREVIEW_NOT_AVAILABLE =
  "Preview not available for this file type.";
export const DOCUMENT_PREVIEW_ACTION_HELPER = 'Use "Open" or "Download".';
export const DOCUMENT_DEFAULT_TIP_TEXT =
  'If preview does not load (some types cannot embed), use "Open".';

export const getViewerStatusLabel = (status?: ReviewStatusValue | null) =>
  getReviewStatusLabel(
    normalizeReviewStatus(status, REVIEW_STATUS_VALUES.PENDING)
  );

export const getViewerRequestSummary = (requestIds: number[]) => {
  if (requestIds.length === 1) return `Request #${requestIds[0]}`;
  if (requestIds.length > 1) return `${requestIds.length} Requests`;
  return "";
};
