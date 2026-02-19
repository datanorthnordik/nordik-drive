import dayjs, { Dayjs } from "dayjs";
import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";

export type Mode = "CHANGES";

export type UserAuth = { id: number; firstname: string; lastname: string };
export type FileItem = { id: number; filename: string; ColumnsOrder?: string[] };

export type UsersResp = { message: string; users: UserAuth[] };
export type FilesResp = { message: string; files: FileItem[] };

export type FieldType = "text" | "number" | "date" | "select";
export type Operation =
  | "EQ"
  | "NEQ"
  | "CONTAINS"
  | "IN"
  | "BETWEEN"
  | "LAST_7"
  | "LAST_30"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "ALL_TIME";

export type Joiner = "AND" | "OR";

export type FieldOption = { key: string; label: string; type: FieldType };

export type Clause = {
  id: string;
  joiner?: Joiner;
  field: string;
  op: Operation;
  value?: string;
  values?: string[];
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
};

export type SelectOption = { value: string; label: string };

export type PhotoStatus = "approved" | "rejected" | null;

export type RequestPhoto = {
  id: number;
  is_gallery_photo?: boolean;
  status?: PhotoStatus;
  photo_comment: string
};

export type RequestDocument = {
  id: number;
  filename?: string;
  mime_type?: string;
  status?: PhotoStatus;
};

export type PendingDownload = {
  id: number;
  filename: string;
  mime?: string;
};

// Request-level filters
export const COMMON_FIELDS: FieldOption[] = [
  { key: "created_at", label: "Created Date", type: "date" },
  { key: "status", label: "Status", type: "select" },
  { key: "file_id", label: "File", type: "select" },

  { key: "firstname", label: "First Name", type: "text" },
  { key: "lastname", label: "Last Name", type: "text" },

  { key: "community", label: "Community", type: "select" },
  { key: "uploader_community", label: "Uploader Community", type: "select" },

  { key: "requested_by", label: "Requested By", type: "select" },
  { key: "approved_by", label: "Approved By", type: "select" },
  { key: "consent", label: "Consent", type: "select" },
];

// Detail-level filters (only shown when file is selected)
export const FILE_CONTENT_FIELDS: FieldOption[] = [
  { key: "field_key", label: "Field Modified (key)", type: "select" },
  { key: "old_value", label: "Old Value", type: "text" },
  { key: "new_value", label: "New Value", type: "text" },
];

export const OPS_BY_TYPE: Record<FieldType, { op: Operation; label: string }[]> = {
  text: [
    { op: "CONTAINS", label: "contains" },
    { op: "EQ", label: "=" },
    { op: "NEQ", label: "!=" },
  ],
  number: [
    { op: "EQ", label: "=" },
    { op: "NEQ", label: "!=" },
  ],
  date: [
    { op: "LAST_7", label: "Last 7 days" },
    { op: "LAST_30", label: "Last 30 days" },
    { op: "THIS_MONTH", label: "This month" },
    { op: "LAST_MONTH", label: "Last month" },
    { op: "ALL_TIME", label: "All time" },
    { op: "BETWEEN", label: "Between" },
  ],
  select: [
    { op: "EQ", label: "=" },
    { op: "IN", label: "in" },
  ],
};

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function hasFileClause(clauses: Clause[]): boolean {
  return clauses.some(
    (c) => c.field === "file_id" && (Boolean(c.value) || (c.values && c.values.length > 0))
  );
}

// If multiple file_ids (IN) pick first for field list
export function deriveSelectedFileId(
  clauses: Clause[],
  builderField: string,
  builderOp: Operation,
  builderValue: string,
  builderValues: string[]
) {
  const c = clauses.find((x) => x.field === "file_id");
  if (c) {
    if (c.op === "EQ" && c.value) return c.value;
    if (c.op === "IN" && c.values && c.values.length > 0) return c.values[0];
  }
  if (builderField === "file_id") {
    if (builderOp === "EQ" && builderValue) return builderValue;
    if (builderOp === "IN" && builderValues.length > 0) return builderValues[0];
  }
  return "";
}

export function mergeSelectedIntoOptions(options: SelectOption[], selected: string[]) {
  const map = new Map(options.map((o) => [o.value, o]));
  (selected || []).forEach((v) => {
    const s = String(v || "").trim();
    if (s && !map.has(s)) map.set(s, { value: s, label: s });
  });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function photoStatusMeta(status?: PhotoStatus) {
  if (status === "approved") {
    return {
      label: "APPROVED",
      helper: "This item is accepted",
      chipColor: "success" as const,
      icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
      border: "3px solid #16a34a",
      shadow: "0 10px 22px rgba(22,163,74,0.22)",
      overlayBg: "rgba(22,163,74,0.92)",
      tint: "linear-gradient(180deg, rgba(22,163,74,0.08), rgba(22,163,74,0.18))",
    };
  }
  if (status === "rejected") {
    return {
      label: "REJECTED",
      helper: "This item is not accepted",
      chipColor: "error" as const,
      icon: <CancelIcon sx={{ fontSize: 18 }} />,
      border: "3px solid #dc2626",
      shadow: "0 10px 22px rgba(220,38,38,0.22)",
      overlayBg: "rgba(220,38,38,0.92)",
      tint: "linear-gradient(180deg, rgba(220,38,38,0.08), rgba(220,38,38,0.18))",
    };
  }
  return {
    label: "PENDING",
    helper: "Waiting for review",
    chipColor: "warning" as const,
    icon: <HourglassTopIcon sx={{ fontSize: 18 }} />,
    border: "3px dashed #f59e0b",
    shadow: "0 10px 22px rgba(245,158,11,0.18)",
    overlayBg: "rgba(245,158,11,0.92)",
    tint: "linear-gradient(180deg, rgba(245,158,11,0.08), rgba(245,158,11,0.18))",
  };
}

export const isPdfMime = (m?: string) => m === "application/pdf";
export const isImageMime = (m?: string) => !!m && m.startsWith("image/");

export function guessMimeFromFilename(name?: string) {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  return "";
}

export function formatDateTime(value?: string) {
  return value ? dayjs(value).format("DD-MM-YYYY HH:mm") : "";
}

export function toYYYYMMDD(d: Dayjs) {
  return d.format("YYYY-MM-DD");
}
