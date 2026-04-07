'use client';

import React from "react";
import {
  color_border,
  color_confidential_card_bg,
  color_error,
  color_focus_ring,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../../constants/colors";

export type Cond = { field: string; equals: any };
export type UploadOpt = { value: string; label: string };

export type FieldCfg = {
  key: string;
  label: string;
  type: "text" | "textarea" | "checkbox" | "doc_upload" | "photo_upload";
  values?: string[];
  required?: boolean;
  required_if?: Cond;
  visible_if?: Cond;
  placeholder?: string;

  name?: string;
  display_name?: string;
  description?: string;
  consent?: string;
  docs_count_enabled?: boolean;
  total_upload_size?: boolean;
  individual_upload_size?: boolean;
  document_types?: UploadOpt[];
  consent_required?: boolean;
};

export type BoolLike = boolean | "true" | "false";

export type BaseLeafColCfg = {
  key: string;
  label: string;
  type: "text" | "textarea" | "dropdown";
  required?: boolean;
  disabled?: BoolLike;
  placeholder?: string;

  api?: string;
  is_server?: BoolLike;
  value_key?: string;
  value_from?: string;
};

export type SubCol = BaseLeafColCfg;

export type ColCfg =
  | BaseLeafColCfg
  | { key: string; label: string; type: "group"; sub_columns: SubCol[] };

export type TableCfg = {
  key: string;
  type: "table";
  min_rows?: number;
  initial_rows?: number;
  allow_add_rows?: boolean;
  add_row_label?: string;
  visible_if?: Cond;
  note?: string;
  columns: ColCfg[];
  title?: string;
};

export type SectionCfg = {
  key: string;
  title?: string;
  visible_if?: Cond;
  fields?: FieldCfg[];
  tables?: TableCfg[];
};

export type PendingMediaAction = {
  mode: "open" | "download";
  id: number;
  filename?: string;
  mime?: string;
} | null;

export type FormCfg = {
  key: string;
  display_name?: string;
  name?: string;
  type: "form";
  editable?: boolean;
  consent?: string;
  sections: SectionCfg[];
};

export type ExistingDocumentItem = {
  id: string;
  detail_key: string;
  file_name: string;
  mime_type?: string;
  file_size_bytes?: number;
  file_url?: string;
  file_category?: string;
};

export type ExistingPhotoItem = {
  id: string;
  detail_key: string;
  file_name: string;
  mime_type?: string;
  file_size_bytes?: number;
  file_url?: string;
  file_comment?: string;
  original_file_comment?: string;
};

export type LookupItem = {
  id: string | number;
  name: string;
  [key: string]: any;
};

export type ReviewableStatus = "approved" | "rejected" | "pending";

export type PhotoGridItem = {
  id: number;
  status?: ReviewableStatus;
  photo_comment?: string;      // uploader comment
  reviewer_comment?: string;   // admin review comment
  [key: string]: any;
};

export type DocumentGridItem = {
  id: number;
  file_name?: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  document_category?: string;
  status?: ReviewableStatus;
  reviewer_comment?: string;   // admin review comment
  [key: string]: any;
};

export type PhotoGridProps = {
  title?: string;
  loading?: boolean;
  emptyText?: string;
  photos: PhotoGridItem[];
  getPhotoUrl: (id: number) => string;
  onOpenViewer: (idx: number) => void;

  showDownload?: boolean;
  onDownloadSingle?: (id: number, filename: string, mime: string) => void;
  downloadFilename?: (photo: PhotoGridItem) => string;
  downloadMime?: (photo: PhotoGridItem) => string;

  cardBorderColor?: string;
  cardWidth?: number;
  imageHeight?: number;
  containerSx?: any;
  cardSx?: any;

  statusLabel?: (st: ReviewableStatus) => string;
  statusChipSx?: (st: ReviewableStatus) => any;

  primaryBtnSx?: any;
  showStatusChip?: boolean;

  showApproveReject?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  approveBtnSx?: any;
  rejectBtnSx?: any;

  showReviewerCommentField?: boolean;
  reviewerCommentLabel?: string;
  onReviewerCommentChange?: (id: number, value: string) => void | undefined;
  showUploaderCommentField?: boolean;
  uploaderCommentLabel?: string;
  onUploaderCommentChange?: (id: number, value: string) => void | undefined;
};

export type DocumentGridProps = {
  title?: string;
  loading?: boolean;
  emptyText?: string;
  documents: DocumentGridItem[];
  onOpenViewer: (idx: number) => void;

  showCategoryChip?: boolean;
  showSizeChip?: boolean;

  showViewButton?: boolean;
  viewLabel?: string;
  viewBtnSx?: any;

  showDownload?: boolean;
  onDownloadSingle?: (id: number, filename: string, mime: string) => void;
  resolveFilename?: (doc: DocumentGridItem) => string;
  resolveMime?: (doc: DocumentGridItem) => string;

  showApproveReject?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  approveBtnSx?: any;
  rejectBtnSx?: any;

  showReviewerCommentField?: boolean;
  reviewerCommentLabel?: string;
  onReviewerCommentChange?: (id: number, value: string) => void;

  cardBorderColor?: string;
  cardWidth?: number;
  containerSx?: any;
  cardSx?: any;

  statusLabel?: (st: ReviewableStatus) => string;
  statusChipSx?: (st: ReviewableStatus) => any;

  primaryBtnSx?: any;
  showStatusChip?: boolean;
};

export const meets = (answers: any, cond?: Cond) => {
  if (!cond) return true;
  return answers?.[cond.field] === cond.equals;
};

export const isRequired = (answers: any, f: FieldCfg) => {
  if (f.required) return true;
  if (f.required_if) return meets(answers, f.required_if);
  return false;
};

export const asBool = (v?: BoolLike) => v === true || v === "true";

export const flattenCols = (cols: ColCfg[]) => {
  const leaf: BaseLeafColCfg[] = [];
  cols.forEach((c) => {
    if (c.type === "group") c.sub_columns.forEach((s) => leaf.push(s));
    else leaf.push(c);
  });
  return leaf;
};

export const emptyRowFromColumns = (cols: ColCfg[]) => {
  const rowObj: Record<string, any> = {};
  cols.forEach((c) => {
    if (c.type === "group") c.sub_columns.forEach((s) => (rowObj[s.key] = ""));
    else rowObj[c.key] = "";
  });
  return rowObj;
};

export const normalizeTable = (answers: any, tbl: TableCfg) => {
  const minRows = Math.max(0, tbl.min_rows ?? 0);
  const initRows = Math.max(minRows, tbl.initial_rows ?? minRows);

  const cur = Array.isArray(answers?.[tbl.key]) ? answers[tbl.key] : [];
  const next = [...cur];
  while (next.length < initRows) next.push(emptyRowFromColumns(tbl.columns));

  return { ...(answers || {}), [tbl.key]: next };
};

export const getLeafColWidth = (col: BaseLeafColCfg) => {
  const label = String(col.label || "").toLowerCase();

  if (label.includes("location")) return 280;
  if (label.includes("religious")) return 260;
  if (label.includes("opening") || label.includes("closing") || label.includes("date")) return 220;
  if (label.includes("school")) return 240;
  if (label.includes("province")) return 220;
  if (label.includes("name variant")) return 240;

  if (col.type === "textarea") return 260;
  if (col.type === "dropdown") return 220;

  return 220;
};

export const buildHeader = (columns: ColCfg[]) => {
  const row1: {
    label: string;
    colSpan: number;
    rowSpan: number;
    required?: boolean;
    width?: number;
  }[] = [];
  const row2: { label: string; required?: boolean; width?: number }[] = [];
  let hasGroup = false;

  columns.forEach((c) => {
    if (c.type === "group") {
      hasGroup = true;
      row1.push({
        label: c.label,
        colSpan: c.sub_columns.length,
        rowSpan: 1,
        width: c.sub_columns.reduce((sum, s) => sum + getLeafColWidth(s), 0),
      });
      c.sub_columns.forEach((s) =>
        row2.push({ label: s.label, required: s.required, width: getLeafColWidth(s) })
      );
    } else {
      row1.push({
        label: c.label,
        colSpan: 1,
        rowSpan: 2,
        required: c.required,
        width: getLeafColWidth(c),
      });
    }
  });

  return { hasGroup, row1, row2 };
};

export const resolveDynamicPath = (template?: string, rowValues?: Record<string, any>) => {
  if (!template) return "";

  let missingToken = false;

  const resolved = template.replace(/\{([^}]+)\}/g, (_, token: string) => {
    const raw = rowValues?.[token];
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      missingToken = true;
      return "";
    }
    return encodeURIComponent(String(raw));
  });

  return missingToken ? "" : resolved;
};

export const normalizeLookupItems = (payload: any): LookupItem[] => {
  const root = payload?.data ?? payload?.value ?? payload;

  const fallbackArray = Object.values(root || {}).find((v) => Array.isArray(v)) as
    | any[]
    | undefined;

  const list = Array.isArray(root)
    ? root
    : Array.isArray(root?.items)
      ? root.items
      : Array.isArray(root?.options)
        ? root.options
        : fallbackArray || [];

  return (Array.isArray(list) ? list : [])
    .filter((item) => item && typeof item === "object")
    .map((item: any) => {
      const id = item?.id ?? item?.value ?? item?.code ?? "";
      const name =
        item?.name ??
        item?.label ??
        item?.title ??
        item?.display_name ??
        item?.school_name ??
        item?.province_name ??
        item?.community_name ??
        item?.value ??
        id;

      return {
        ...item,
        id,
        name: String(name ?? ""),
      } as LookupItem;
    })
    .filter((item) => item.id !== "" && item.name !== "");
};

export const getOptionLabel = (item: LookupItem) => String(item?.name ?? item?.id ?? "");

export const rowChanged = (a: Record<string, any>, b: Record<string, any>) =>
  JSON.stringify(a || {}) !== JSON.stringify(b || {});

export const resolveFileId = (file: any) => file?.id ?? file?.file_id ?? file?.config?.file_id ?? null;
export const resolveRowId = (row: any) => row?.id ?? null;

export const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: color_white,
  },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
    borderColor: color_focus_ring,
    borderWidth: "2px",
  },
  "& .MuiInputLabel-root": {
    color: color_text_secondary,
    fontWeight: 800,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: color_text_primary,
  },
};

export const missingWrapSx = {
  backgroundColor: color_confidential_card_bg,
  border: `2px solid ${color_error}`,
  borderRadius: 2,
  p: 1.25,
};

export const readOnlyValueSx = {
  height: 72,
  minHeight: 72,
  maxHeight: 72,
  boxSizing: "border-box" as const,
  borderRadius: 2,
  border: `1px solid ${color_border}`,
  background: color_white_smoke,
  px: 1.5,
  py: 1.1,
  color: color_text_primary,
  fontSize: "1rem",
  fontWeight: 700,
  lineHeight: 1.45,
  whiteSpace: "normal" as const,
  wordBreak: "break-word" as const,
  overflowWrap: "anywhere" as const,
  overflow: "hidden" as const,
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
  cursor: "help",
};

export const requiredBadge = (
  <span style={{ color: color_error, fontWeight: 900 }}>* (Required)</span>
);
