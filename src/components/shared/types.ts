export type FileReviewStatus = "approved" | "rejected" | "pending" | null;

export const normalizeStatus = (s?: FileReviewStatus): "approved" | "rejected" | "pending" => {
  if (s === "approved" || s === "rejected" || s === "pending") return s;
  return "pending";
};

export const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export const categoryLabel = (cat?: string) => {
  if (!cat) return "Unknown";
  const map: Record<string, string> = {
    birth_certificate: "Birth Certificate",
    death_certificate: "Death Certificate",
    other_document: "Other Document",
  };
  return map[cat] || cat;
};

export type PhotoGridItem = {
  id: number;
  status?: FileReviewStatus;
  file_name?: string;
  size_bytes?: number;
  mime_type?: string;

  // uploader comment
  photo_comment?: string;

  // reviewer/admin comment
  reviewer_comment?: string;
};

export type PhotoGridProps = {
  title?: string;
  loading?: boolean;
  emptyText?: string;

  photos: PhotoGridItem[];
  getPhotoUrl: (id: number) => string;
  onOpenViewer: (idx: number) => void;

  // optional download
  showDownload?: boolean;
  onDownloadSingle?: (id: number, filename?: string, mime?: string) => void;
  downloadFilename?: (p: PhotoGridItem) => string;
  downloadMime?: (p: PhotoGridItem) => string;

  // review actions
  showApproveReject?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  approveBtnSx?: any;
  rejectBtnSx?: any;

  // reviewer comment
  showReviewerCommentField?: boolean;
  reviewerCommentLabel?: string;
  onReviewerCommentChange?: (id: number, value: string) => void;
  showUploaderCommentField?: boolean;
  uploaderCommentLabel?: string;
  onUploaderCommentChange?: (id: number, value: string) => void;

  // styling
  cardBorderColor?: string; // default: color_secondary
  cardWidth?: number;       // default: 240
  imageHeight?: number;     // default: 140
  containerSx?: any;
  cardSx?: any;

  // optional override
  statusLabel?: (st: "approved" | "rejected" | "pending") => string;
  statusChipSx?: (st: "approved" | "rejected" | "pending") => any;

  primaryBtnSx?: any;
  showStatusChip?: boolean;
  disableReviewerCommentField?: boolean;
  viewReviewerComment?: boolean;
};

export type DocumentGridItem = {
  id: number;
  file_name?: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  document_category?: string;
  status?: "approved" | "rejected" | "pending";
  reviewer_comment?: string;
  [key: string]: any;
};

export type DocumentGridProps = {
  title?: string;
  loading?: boolean;
  emptyText?: string;

  documents: DocumentGridItem[];
  onOpenViewer: (idx: number) => void;

  // show chips
  showCategoryChip?: boolean; // default true
  showSizeChip?: boolean;     // default true

  // view/download/actions
  showViewButton?: boolean;   // default true
  viewLabel?: string;         // default "View"
  viewBtnSx?: any;

  showDownload?: boolean;
  onDownloadSingle?: (id: number, filename?: string, mime?: string) => void;
  resolveFilename?: (d: DocumentGridItem) => string;
  resolveMime?: (d: DocumentGridItem) => string;

  showApproveReject?: boolean; // default false
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  approveBtnSx?: any;
  rejectBtnSx?: any;

  // reviewer comment
  showReviewerCommentField?: boolean;
  reviewerCommentLabel?: string;
  onReviewerCommentChange?: (id: number, value: string) => void;

  // styling
  cardBorderColor?: string; // default: color_secondary
  cardWidth?: number;       // default: 360
  containerSx?: any;
  cardSx?: any;

  // optional override
  statusLabel?: (st: "approved" | "rejected" | "pending") => string;
  statusChipSx?: (st: "approved" | "rejected" | "pending") => any;

  primaryBtnSx?: any;
  showStatusChip?: boolean;
  disableReviewerCommentField?: boolean;
  viewReviewerComment?: boolean;
};
