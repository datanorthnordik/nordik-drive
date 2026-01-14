"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  colorSchemeLightWarm,
  GridReadyEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderZipIcon from "@mui/icons-material/FolderZip";


import {
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
  CircularProgress,
} from "@mui/material";

import dayjs, { Dayjs } from "dayjs";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TuneIcon from "@mui/icons-material/Tune";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";

import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import { FileButton } from "../buttons/Button";
import { color_primary, color_white } from "../../constants/colors";
import FileActivityVisualization from "../activity/FileActivityVisualization";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

import DownloadUpdatesModal from "../models/DownloadUpdates";
import DownloadMediaModal from "../models/DownloadMedias";

ModuleRegistry.registerModules([AllCommunityModule]);
const themeLightWarm = themeQuartz.withPart(colorSchemeLightWarm);

type Mode = "CHANGES";

type UserAuth = { id: number; firstname: string; lastname: string };
type FileItem = { id: number; filename: string; ColumnsOrder?: string[] };

type UsersResp = { message: string; users: UserAuth[] };
type FilesResp = { message: string; files: FileItem[] };

type FieldType = "text" | "number" | "date" | "select";
type Operation =
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

type Joiner = "AND" | "OR";

type FieldOption = { key: string; label: string; type: FieldType };

type Clause = {
  id: string;
  joiner?: Joiner;
  field: string;
  op: Operation;
  value?: string;
  values?: string[];
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
};

type SelectOption = { value: string; label: string };

type PhotoStatus = "approved" | "rejected" | null;

type RequestPhoto = {
  id: number;
  is_gallery_photo?: boolean;
  status?: PhotoStatus;
};

type RequestDocument = {
  id: number;
  filename?: string;
  mime_type?: string;
  status?: PhotoStatus;
};

type PendingDownload = {
  id: number;
  filename: string;
  mime?: string;
};


function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Request-level filters
const COMMON_FIELDS: FieldOption[] = [
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
const FILE_CONTENT_FIELDS: FieldOption[] = [
  { key: "field_key", label: "Field Modified (key)", type: "select" },
  { key: "old_value", label: "Old Value", type: "text" },
  { key: "new_value", label: "New Value", type: "text" },
];

const OPS_BY_TYPE: Record<FieldType, { op: Operation; label: string }[]> = {
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

function hasFileClause(clauses: Clause[]): boolean {
  return clauses.some(
    (c) =>
      c.field === "file_id" &&
      (Boolean(c.value) || (c.values && c.values.length > 0))
  );
}

// If multiple file_ids (IN) pick first for field list
function deriveSelectedFileId(
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


function mergeSelectedIntoOptions(options: SelectOption[], selected: string[]) {
  const map = new Map(options.map((o) => [o.value, o]));
  (selected || []).forEach((v) => {
    const s = String(v || "").trim();
    if (s && !map.has(s)) map.set(s, { value: s, label: s });
  });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}


/**
 * Clearer status UI:
 * - big chip with icon
 * - strong border
 * - tinted overlay bar inside thumbnail
 * - viewer badge with icon
 */
function photoStatusMeta(status?: PhotoStatus) {
  if (status === "approved") {
    return {
      label: "APPROVED",
      helper: "This photo is accepted",
      chipColor: "success" as const,
      icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
      border: "3px solid #16a34a",
      shadow: "0 10px 22px rgba(22,163,74,0.22)",
      overlayBg: "rgba(22,163,74,0.92)",
      tint: "linear-gradient(180deg, rgba(22,163,74,0.08), rgba(22,163,74,0.18))",
      viewerBg: "rgba(22,163,74,0.92)",
    };
  }
  if (status === "rejected") {
    return {
      label: "REJECTED",
      helper: "This photo is not accepted",
      chipColor: "error" as const,
      icon: <CancelIcon sx={{ fontSize: 18 }} />,
      border: "3px solid #dc2626",
      shadow: "0 10px 22px rgba(220,38,38,0.22)",
      overlayBg: "rgba(220,38,38,0.92)",
      tint: "linear-gradient(180deg, rgba(220,38,38,0.08), rgba(220,38,38,0.18))",
      viewerBg: "rgba(220,38,38,0.92)",
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
    viewerBg: "rgba(245,158,11,0.92)",
  };
}

const isPdfMime = (m?: string) => m === "application/pdf";
const isImageMime = (m?: string) => !!m && m.startsWith("image/");

function guessMimeFromFilename(name?: string) {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  return "";
}


export default function AdminFileEditRequests({
  onParentModeChange,
}: {
  onParentModeChange?: (mode: any) => void;
}) {
  const API_BASE =
    "https://nordikdriveapi-724838782318.us-west1.run.app/api";

  const [mode, setMode] = useState<Mode>("CHANGES");
  const [fieldList, setFieldList] = useState<SelectOption[]>([]);

  // Split sizes
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [leftPct, setLeftPct] = useState(62);

  // Results
  const [rows, setRows] = useState<any[]>([]);
  const [payload, setPayload] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const totalRequests = payload?.total_rows ?? 0;
  const totalChanges = payload?.total_changes ?? 0;

  // Filter UI collapse
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  // Query builder
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [nextJoiner, setNextJoiner] = useState<Joiner>("AND");

  const [builderField, setBuilderField] = useState<string>("");
  const [builderOp, setBuilderOp] = useState<Operation>("EQ");
  const [builderValue, setBuilderValue] = useState<string>("");
  const [builderValues, setBuilderValues] = useState<string[]>([]);
  const [builderStart, setBuilderStart] = useState<Dayjs | null>(null);
  const [builderEnd, setBuilderEnd] = useState<Dayjs | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ---------- DETAILS MODAL STATE ----------
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const [detailsLoadingLocal, setDetailsLoadingLocal] = useState(false);
  const [detailsRows, setDetailsRows] = useState<any[]>([]); // changes list
  const [photos, setPhotos] = useState<RequestPhoto[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);
  // ✅ 2) ADD STATE (inside component, near photos state)
  const [documents, setDocuments] = useState<RequestDocument[]>([]);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docStartIndex, setDocStartIndex] = useState(0);
  const [docViewerIndex, setDocViewerIndex] = useState(0);

  const [docBlobUrl, setDocBlobUrl] = useState("");
  const lastDocBlobUrlRef = useRef<string>("");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [mediaDownloadOpen, setMediaDownloadOpen] = useState(false);
  const [requestId, setRequestId] = useState<any>(null);
  const [pendingDownload, setPendingDownload] = useState<PendingDownload | null>(null);
  const [detailsZipLoading, setDetailsZipLoading] = useState(false);


  // Prefetch dropdown values
  const { fetchData: fetchUsers, data: usersResp, loading: usersLoading } =
    useFetch(`${API_BASE}/user`, "GET", false);

  const { fetchData: fetchFiles, data: filesResp, loading: filesLoading } =
    useFetch(`${API_BASE}/file`, "GET", false);

  // Main admin search API
  const { loading, fetchData, data: resp } = useFetch(
    `${API_BASE}/admin`,
    "POST"
  );

  // Details API (change list)
  const {
    data: detailsResp,
    fetchData: fetchDetails,
    loading: detailsLoading,
  } = useFetch(`${API_BASE}/admin/details`, "POST", false);

  // Photos for a request
  const { data: photoData, fetchData: loadPhotos } = useFetch(
    `${API_BASE}/file/edit/photos/${selectedRequest?.request_id}`,
    "GET",
    false
  );

  // ✅ 3) ADD API HOOK (near photo hook) — keep same logic pattern
  const { data: docData, fetchData: loadDocs } = useFetch(
    `${API_BASE}/file/edit/docs/${selectedRequest?.request_id}`,
    "GET",
    false
  );

  const {
    data: docBlobData,
    fetchData: fetchDocBlob,
    loading: docBlobLoading,
    error: docBlobError,
  } = useFetch<any>(`${API_BASE}/file/doc`, "GET", false);

  const {
    data: mediaBlobData,
    fetchData: fetchMediaBlob,
    loading: mediaBlobLoading,
    error: mediaBlobError,
  } = useFetch<any>(`${API_BASE}/file/doc/download`, "POST", false);

  const { fetchData: fetchCommunities, data: communitiesResp, loading: communitiesLoading } =
    useFetch(`${API_BASE}/communities`, "GET", false);


  const currentDoc = documents[docViewerIndex];
  const currentDocMime =
    currentDoc?.mime_type || guessMimeFromFilename(currentDoc?.filename) || "";




  useEffect(() => {
    fetchUsers();
    fetchFiles();
    fetchCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When detailsResp arrives -> set read-only detailsRows
  useEffect(() => {
    if (!detailsResp) return;
    const d = detailsResp as any;
    setDetailsRows(d?.data || []);
    setDetailsLoadingLocal(false);
  }, [detailsResp]);

  // Load photos when request changes
  useEffect(() => {
    if (!selectedRequest?.request_id) return;
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest?.request_id]);

  useEffect(() => {
    if ((photoData as any)?.photos) {
      const loaded: RequestPhoto[] = (photoData as any).photos.map((p: any) => ({
        id: p.id,
        is_gallery_photo: p.is_gallery_photo,
        status: (p.status ?? null) as PhotoStatus,
      }));
      setPhotos(loaded);
    } else {
      setPhotos([]);
    }
  }, [photoData]);

  // ✅ 4) LOAD DOCS WHEN REQUEST CHANGES (same as photos)
  useEffect(() => {
    if (!selectedRequest?.request_id) return;
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest?.request_id]);

  // ✅ 5) MAP DOC RESPONSE INTO STATE (same as photoData mapping)
  // Assumes API returns: { documents: [...] }
  // If your key is different (e.g., docs), change ONLY that key below.

  useEffect(() => {
    if ((docData as any)?.docs) {
      const loaded: RequestDocument[] = (docData as any).docs.map((d: any) => ({
        id: d.id,
        filename: d.filename ?? d.file_name ?? d.name ?? undefined,
        mime_type: d.mime_type ?? guessMimeFromFilename(d.filename ?? d.file_name ?? d.name),
        status: (d.status ?? null) as PhotoStatus,
      }));
      setDocuments(loaded);
    } else {
      setDocuments([]);
    }
  }, [docData]);


  const userOptions = useMemo((): SelectOption[] => {
    const r = usersResp as UsersResp | undefined;
    const users = r?.users ?? [];
    return users
      .map((u) => ({
        value: String(u.id),
        label: `${u.firstname} ${u.lastname}`.trim() || `User ${u.id}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [usersResp]);

  const fileOptions = useMemo((): SelectOption[] => {
    const r = filesResp as FilesResp | undefined;
    const files = r?.files ?? [];
    return files
      .map((f) => ({ value: String(f.id), label: f.filename }))
      .filter((x) => x.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filesResp]);

  // ✅ Requested: "Created By" should come from requested_by (user id) -> name
  const createdByName = useMemo(() => {
    if (!selectedRequest) return "-";
    const id = selectedRequest.requested_by;
    if (id === null || id === undefined || id === "") return "-";
    return userOptions.find((u) => u.value === String(id))?.label ?? `User ${id}`;
  }, [selectedRequest, userOptions]);


  function buildStringOptionsFromRows(key: string, list: any[]): SelectOption[] {
    const uniq = new Set<string>();
    for (const r of list || []) {
      const v = r?.[key];
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s) uniq.add(s);
    }
    return Array.from(uniq)
      .map((s) => ({ value: s, label: s }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }


  const normalizeBlob = (x: any): Blob | null => {
    if (!x) return null;
    if (x instanceof Blob) return x;
    if (x?.blob instanceof Blob) return x.blob;
    if (x?.data instanceof Blob) return x.data;
    return null;
  };

  const triggerDownloadFromBlob = (raw: Blob, filename: string, mime?: string) => {
    const blob = mime ? new Blob([raw], { type: mime }) : raw;
    const a = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  };

  // ✅ Public helper: download by ID (works for photo + doc)
  const downloadMediaById = useCallback(
    (id: number, filename?: string, mime?: string) => {
      if (!id || Number.isNaN(id)) return;
      if (mediaBlobLoading) return; // avoid overlap (simple guard)

      setPendingDownload({
        id,
        filename: filename || `media_${id}`,
        mime,
      });

      // POST `${API_BASE}/doc/download/:id` as blob
      fetchMediaBlob(undefined, undefined, false, {
        path: id,
        responseType: "blob",
      });
    },
    [fetchMediaBlob, mediaBlobLoading]
  );

  // when blob arrives -> download it
  useEffect(() => {
    if (!pendingDownload) return;
    const b = normalizeBlob(mediaBlobData);
    if (!b) return;

    try {
      triggerDownloadFromBlob(b, pendingDownload.filename, pendingDownload.mime);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setPendingDownload(null);
    }
  }, [mediaBlobData, pendingDownload]);

  useEffect(() => {
    if (!pendingDownload) return;
    if (!mediaBlobError) return;

    console.error("Download failed", mediaBlobError);
    setPendingDownload(null);
  }, [mediaBlobError, pendingDownload]);




  const statusOptions: SelectOption[] = useMemo(
    () => [
      { value: "pending", label: "pending" },
      { value: "approved", label: "approved" },
      { value: "rejected", label: "rejected" },
    ],
    []
  );

  const boolOptions: SelectOption[] = useMemo(
    () => [
      { value: "true", label: "true" },
      { value: "false", label: "false" },
    ],
    []
  );

  // selected file id (for field_key options)
  const selectedFileId = useMemo(
    () =>
      deriveSelectedFileId(
        clauses,
        builderField,
        builderOp,
        builderValue,
        builderValues
      ),
    [clauses, builderField, builderOp, builderValue, builderValues]
  );

  // Build fieldList from selected file's ColumnsOrder
  useEffect(() => {
    if (!selectedFileId) {
      setFieldList([]);
      return;
    }
    const r = filesResp as FilesResp | undefined;
    const files = r?.files ?? [];
    const file = files.find((f) => String(f.id) === String(selectedFileId));
    const cols = file?.ColumnsOrder || [];
    setFieldList(cols.map((c) => ({ value: c, label: c })));
  }, [selectedFileId, filesResp]);

  const resetFilters = () => {
    setClauses([]);
    setNextJoiner("AND");
    setBuilderField("");
    setBuilderOp("EQ");
    setBuilderValue("");
    setBuilderValues([]);
    setBuilderStart(null);
    setBuilderEnd(null);
    setEditingId(null);

    setFiltersCollapsed(false);
    setHasSearchedOnce(false);

    setRows([]);
    setPayload(null);
    setCurrentPage(1);
    setTotalPages(1);

    // close details
    setDetailsOpen(false);
    setSelectedRequest(null);
    setDetailsRows([]);
    setPhotos([]);
    setViewerOpen(false);
    setStartIndex(0);
    setViewerIndex(0);
    setDocuments([]);
    setDocViewerOpen(false);
    setDocStartIndex(0);
    setDocViewerIndex(0);
    clearDocPreview();
  };

  // Available fields: show detail fields only when file_id exists
  const availableFields = useMemo(() => {
    return hasFileClause(clauses) || selectedFileId
      ? [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS]
      : COMMON_FIELDS;
  }, [clauses, selectedFileId]);

  const selectedField = useMemo(
    () => availableFields.find((f) => f.key === builderField) || null,
    [availableFields, builderField]
  );

  useEffect(() => {
    if (!selectedField) return;
    const ops = OPS_BY_TYPE[selectedField.type];
    if (!ops.some((x) => x.op === builderOp)) setBuilderOp(ops[0].op);

    setBuilderValue("");
    setBuilderValues([]);
    setBuilderStart(null);
    setBuilderEnd(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderField]);

  useEffect(() => {
    if (!selectedField || selectedField.type !== "date") return;
    if (builderOp !== "BETWEEN") {
      setBuilderStart(null);
      setBuilderEnd(null);
    }
  }, [builderOp, selectedField]);

  function selectOptionsForField(fieldKey: string): SelectOption[] {
    if (fieldKey === "status") return statusOptions;
    if (fieldKey === "file_id") return fileOptions;
    if (fieldKey === "requested_by") return userOptions;
    if (fieldKey === "approved_by") return userOptions;

    if (fieldKey === "consent") return boolOptions;

    if (fieldKey === "field_key") return fieldList;

    if (fieldKey === "community") {
      const selected = builderOp === "IN" ? builderValues : builderValue ? [builderValue] : [];
      return mergeSelectedIntoOptions(communityOptions, selected);
    }

    if (fieldKey === "uploader_community") {
      const selected = builderOp === "IN" ? builderValues : builderValue ? [builderValue] : [];
      return mergeSelectedIntoOptions(uploaderCommunityOptions, selected);
    }

    return [];
  }

  function getFieldLabel(fieldKey: string) {
    return (
      [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS].find((f) => f.key === fieldKey)
        ?.label ?? fieldKey
    );
  }

  const communityOptions = useMemo<SelectOption[]>(() => {
    // Expecting: { communities: [{ name: "..." }, ...] }
    const list = (communitiesResp as any)?.communities ?? [];
    const opts = list
      .map((c: any) => String(c?.name ?? "").trim())
      .filter(Boolean)
      .map((name: string) => ({ value: name, label: name }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));

    return opts;
  }, [communitiesResp]);

  const uploaderCommunityOptions = communityOptions;


  function getOpLabel(op: Operation, fieldType: FieldType) {
    return OPS_BY_TYPE[fieldType].find((x) => x.op === op)?.label ?? op;
  }

  function renderValueLabel(c: Clause): string {
    const field =
      [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS].find((f) => f.key === c.field) ||
      null;
    const type = field?.type ?? "text";

    if (type === "date") {
      if (c.op === "BETWEEN") return `${c.start || ""} and ${c.end || ""}`.trim();
      return getOpLabel(c.op, "date");
    }

    if (c.op === "IN") {
      const opts = selectOptionsForField(c.field);
      const labels = (c.values || []).map(
        (v) => opts.find((o) => o.value === v)?.label ?? v
      );
      return labels.join(", ");
    }

    if (type === "select") {
      const opts = selectOptionsForField(c.field);
      return opts.find((o) => o.value === c.value)?.label ?? (c.value || "");
    }

    return c.value || "";
  }

  const chipModels = useMemo(() => {
    return clauses.map((c) => {
      const fieldType =
        [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS].find((f) => f.key === c.field)
          ?.type ?? "text";
      const fieldLabel = getFieldLabel(c.field);
      const opLabel = getOpLabel(c.op, fieldType);
      const valueLabel = renderValueLabel(c);
      const join = c.joiner ? `${c.joiner} ` : "";

      const label =
        fieldType === "date"
          ? `${join}${fieldLabel} ${valueLabel}`
          : `${join}${fieldLabel} ${opLabel} ${valueLabel}`;

      return { clause: c, label };
    });
  }, [
    clauses,
    userOptions,
    fileOptions,
    communityOptions,
    uploaderCommunityOptions,
    fieldList,
  ]);

  const filterSummary = useMemo(() => {
    if (clauses.length === 0) return ["No filters"];
    return [`${clauses.length} filter${clauses.length > 1 ? "s" : ""}`];
  }, [clauses.length]);

  function loadClauseIntoBuilder(c: Clause) {
    setBuilderField(c.field);
    setBuilderOp(c.op);

    const fieldType =
      [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS].find((f) => f.key === c.field)
        ?.type ?? "text";

    if (fieldType === "date") {
      if (c.op === "BETWEEN") {
        setBuilderStart(c.start ? dayjs(c.start) : null);
        setBuilderEnd(c.end ? dayjs(c.end) : null);
      } else {
        setBuilderStart(null);
        setBuilderEnd(null);
      }
      setBuilderValue("");
      setBuilderValues([]);
      return;
    }

    if (c.op === "IN") {
      setBuilderValues(c.values || []);
      setBuilderValue("");
    } else {
      setBuilderValue(c.value || "");
      setBuilderValues([]);
    }
    setBuilderStart(null);
    setBuilderEnd(null);
  }

  function clearBuilder() {
    setBuilderField("");
    setBuilderOp("EQ");
    setBuilderValue("");
    setBuilderValues([]);
    setBuilderStart(null);
    setBuilderEnd(null);
    setEditingId(null);
  }

  function canAddOrUpdate(): boolean {
    if (!builderField || !selectedField) return false;

    if (selectedField.type === "date") {
      if (builderOp === "BETWEEN") return Boolean(builderStart && builderEnd);
      return true;
    }

    if (builderOp === "IN") return (builderValues || []).length > 0;
    return Boolean(builderValue);
  }

  function upsertClause() {
    if (!selectedField || !canAddOrUpdate()) return;

    const fieldType = selectedField.type;

    const updated: Partial<Clause> = {
      field: builderField,
      op: builderOp,
      value: undefined,
      values: undefined,
      start: undefined,
      end: undefined,
    };

    if (fieldType === "date") {
      if (builderOp === "BETWEEN") {
        updated.start = builderStart
          ? builderStart.format("YYYY-MM-DD")
          : undefined;
        updated.end = builderEnd ? builderEnd.format("YYYY-MM-DD") : undefined;
      }
    } else if (builderOp === "IN") {
      updated.values = builderValues;
    } else {
      updated.value = builderValue;
    }

    if (editingId) {
      setClauses((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...(updated as any) } : c))
      );
      clearBuilder();
      return;
    }

    const newClause: Clause = {
      id: uid(),
      joiner: clauses.length === 0 ? undefined : nextJoiner,
      field: builderField,
      op: builderOp,
      ...(updated as any),
    };

    setClauses((prev) => [...prev, newClause]);
    clearBuilder();
  }

  function deleteClause(id: string) {
    setClauses((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length > 0) next[0] = { ...next[0], joiner: undefined };
      return next;
    });
    if (editingId === id) clearBuilder();
  }

  // --------- GRID COLUMNS (ONLY CHANGES) ----------
  const columnDefs = useMemo(() => {
    return [
      { field: "request_id", headerName: "Request ID", width: 120 },
      { field: "file_name", headerName: "File Name", flex: 1, minWidth: 220 },
      { field: "firstname", headerName: "First Name", width: 140 },
      { field: "lastname", headerName: "Last Name", width: 140 },
      { field: "community", headerName: "Community", width: 160 },
      { field: "uploader_community", headerName: "Uploader Community", width: 190 },
      { field: "status", headerName: "Status", width: 120 },
      { field: "requested_by", headerName: "Requested By", width: 180 },
      { field: "approved_by", headerName: "Approved By", width: 180 },
      { field: "consent", headerName: "Consent", width: 110 },
      { field: "change_count", headerName: "Changes", width: 110 },
      {
        field: "created_at",
        headerName: "Created At",
        width: 170,
        valueFormatter: (p: any) =>
          p.value ? dayjs(p.value).format("DD-MM-YYYY HH:mm") : "",
      },
      {
        headerName: "Actions",
        width: 160,
        sortable: false,
        filter: false,
        cellRenderer: (p: any) => {
          return (
            <Button
              size="small"
              startIcon={<InfoOutlinedIcon fontSize="small" />}
              onClick={() => {
                const req = p.data;
                if (!req?.request_id) return;

                setSelectedRequest(req);
                setDetailsOpen(true);

                // reset old modal data
                setDetailsRows([]);
                setPhotos([]);
                setViewerOpen(false);
                setStartIndex(0);
                setViewerIndex(0);

                // load change details for request
                setDetailsLoadingLocal(true);
                fetchDetails({ request_id: Number(req.request_id) });
                setDocuments([]);
                setDocViewerOpen(false);
                setDocStartIndex(0);
                setDocViewerIndex(0);
                clearDocPreview();
              }}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                borderRadius: "10px",
                color: color_white,
                background: "#6d28d9",
                "&:hover": { background: "#5b21b6" },
              }}
            >
              Details
            </Button>
          );
        },
      },
    ];
  }, [fetchDetails]);

  const fetchPage = (page: number, body: any) => {
    fetchData({ page, page_size: 20, ...body });
  };

  const buildRequestBody = () => ({ mode, clauses });

  const handleApply = () => {
    fetchPage(1, buildRequestBody());
    setFiltersCollapsed(true);
  };

  useEffect(() => {
    if (!resp) return;
    const r = resp as any;
    setPayload(r);
    setRows(r.data || []);
    setCurrentPage(r.page || 1);
    setTotalPages(r.total_pages || 1);

    if (!hasSearchedOnce) {
      setHasSearchedOnce(true);
      setFiltersCollapsed(true);
    }
  }, [resp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Splitter drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(80, Math.max(35, (x / rect.width) * 100));
      setLeftPct(pct);
    };
    const onUp = () => (draggingRef.current = false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const opOptions = useMemo(() => {
    if (!selectedField) return [];
    return OPS_BY_TYPE[selectedField.type];
  }, [selectedField]);

  const selectOptions = useMemo(() => {
    if (!selectedField || selectedField.type !== "select") return [];
    return selectOptionsForField(builderField);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedField,
    builderField,
    userOptions,
    fileOptions,
    communityOptions,
    fieldList,
  ]);

  const dangerBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    color: color_white,
    background: color_primary,
    "&:hover": { background: color_primary },
  } as const;

  const rightPct = 100 - leftPct;

  const handleModeSwitch = (_: any, val: any | null) => {
    if (!val) return;
    onParentModeChange?.(val);
  };

  // --------- PHOTOS VIEWER HELPERS ----------
  const galleryItems = useMemo(
    () =>
      photos.map((photo: RequestPhoto) => ({
        original: `${API_BASE}/file/photo/${photo.id}`,
        thumbnail: `${API_BASE}/file/photo/${photo.id}`,
        description: `Photo ID: ${photo.id}`,
        originalClass: "gallery-image",
      })),
    [photos]
  );

  // ✅ 6) VIEWER ITEMS (same ImageGallery usage)
  const docGalleryItems = useMemo(
    () =>
      documents.map((doc: RequestDocument) => ({
        original: `${API_BASE}/file/doc/${doc.id}`,  // ✅ endpoint for viewing
        thumbnail: `${API_BASE}/file/doc/${doc.id}`, // ok even if not image; gallery just needs url
        description: `${doc.filename ?? "Document"} (ID: ${doc.id})`,
        originalClass: "gallery-image",
      })),
    [documents]
  );

  const handleOpenDocViewer = async (idx: number) => {
    setDocViewerIndex(idx);
    setDocViewerOpen(true);
    await openDocAtIndex(idx);
  };

  const handlePrevDoc = async () => {
    const nextIdx = Math.max(docViewerIndex - 1, 0);
    setDocViewerIndex(nextIdx);
    await openDocAtIndex(nextIdx);
  };

  const handleNextDoc = async () => {
    const nextIdx = Math.min(docViewerIndex + 1, documents.length - 1);
    setDocViewerIndex(nextIdx);
    await openDocAtIndex(nextIdx);
  };




  const clearDocPreview = useCallback(() => {
    if (lastDocBlobUrlRef.current) {
      URL.revokeObjectURL(lastDocBlobUrlRef.current);
      lastDocBlobUrlRef.current = "";
    }
    setDocBlobUrl("");
  }, []);

  const openDocAtIndex = useCallback(
    async (idx: number) => {
      const doc = documents[idx];
      if (!doc) return;

      clearDocPreview();

      // GET `${API_BASE}/file/doc/<id>` as blob
      await fetchDocBlob(undefined, undefined, false, {
        path: doc.id,
        responseType: "blob",
      });
    },
    [documents, clearDocPreview, fetchDocBlob]
  );


  useEffect(() => {
    if (!docViewerOpen) return;
    if (!docBlobData) return;

    const raw =
      docBlobData instanceof Blob
        ? docBlobData
        : (docBlobData as any)?.blob instanceof Blob
          ? (docBlobData as any).blob
          : null;

    if (!raw) return;

    const forcedType = currentDocMime || raw.type || "application/octet-stream";
    const fixedBlob = new Blob([raw], { type: forcedType });

    if (lastDocBlobUrlRef.current) URL.revokeObjectURL(lastDocBlobUrlRef.current);
    const url = URL.createObjectURL(fixedBlob);
    lastDocBlobUrlRef.current = url;

    setDocBlobUrl(url);
  }, [docBlobData, docViewerOpen, currentDocMime]);



  const handleOpenViewer = (idx: number) => {
    setStartIndex(idx);
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  return (
    <>
      <Loader loading={loading || usersLoading || filesLoading || detailsLoading || communitiesLoading} />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            height: "100%",
            p: { xs: 1, md: 1.25 },
            boxSizing: "border-box",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minHeight: 0,
          }}
        >
          {/* TOP BAR */}
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              background: color_white,
              px: 1,
              py: 0.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => v && setMode(v)}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: "10px",
                  px: 1.2,
                  py: 0.6,
                },
              }}
            >
              <ToggleButton value="CHANGES">
                <ListAltIcon sx={{ fontSize: 18, mr: 0.75 }} />
                Changes
              </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip
                icon={<TuneIcon />}
                label={`Requests: ${totalRequests} | Changes: ${totalChanges}`}
                size="small"
                sx={{ fontWeight: 900 }}
              />

              <Button
                startIcon={<DownloadIcon />}
                onClick={() => setDownloadOpen(true)}
                sx={dangerBtnSx}
              >
                Download Updates
              </Button>

              <Button
                startIcon={<FolderZipIcon />} // import FolderZipIcon in your page
                onClick={() => {
                  setMediaDownloadOpen(true)
                  setRequestId(null);
                }}
                sx={dangerBtnSx}
              >
                Download Photos & Docs
              </Button>

            </Box>
          </Box>

          {/* FILTER BUILDER */}
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              background: "#f7f9fc",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                px: 1.25,
                py: 0.75,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={filterSummary[0]} size="small" sx={{ fontWeight: 900 }} />

                {chipModels.slice(0, 5).map(({ clause, label }) => (
                  <Chip
                    key={clause.id}
                    label={label}
                    onClick={() => {
                      setEditingId(clause.id);
                      loadClauseIntoBuilder(clause);
                      setFiltersCollapsed(false);
                    }}
                    onDelete={() => deleteClause(clause.id)}
                    deleteIcon={<DeleteIcon />}
                    sx={{
                      fontWeight: 800,
                      maxWidth: 520,
                      "& .MuiChip-label": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 440,
                      },
                    }}
                  />
                ))}
                {chipModels.length > 5 && <Chip label={`+${chipModels.length - 5} more`} size="small" />}
              </Box>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <ToggleButtonGroup
                  value="ADMIN_EDIT_REQUESTS"
                  exclusive
                  onChange={handleModeSwitch}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      fontWeight: 900,
                      borderRadius: "10px",
                      px: 1.2,
                      py: 0.6,
                    },
                  }}
                >
                  <ToggleButton value="GENERAL">
                    <DashboardIcon sx={{ fontSize: 18, mr: 0.75 }} />
                    General
                  </ToggleButton>
                </ToggleButtonGroup>

                {filtersCollapsed ? (
                  <Button
                    startIcon={<InfoOutlinedIcon />}
                    onClick={() => setFiltersCollapsed(false)}
                    sx={dangerBtnSx}
                  >
                    Edit filters
                  </Button>
                ) : (
                  <Button onClick={() => setFiltersCollapsed(true)} sx={dangerBtnSx}>
                    Hide filters
                  </Button>
                )}

                <Button variant="contained" onClick={handleApply} sx={dangerBtnSx}>
                  Apply
                </Button>

                <Button onClick={resetFilters} sx={dangerBtnSx}>
                  Reset
                </Button>

                {!filtersCollapsed && (
                  <IconButton onClick={() => setFiltersCollapsed(true)} size="small" title="Collapse">
                    <ExpandLessIcon />
                  </IconButton>
                )}
              </Box>
            </Box>

            {!filtersCollapsed && (
              <>
                <Divider />
                <Box
                  sx={{
                    px: 1.25,
                    py: 1.0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  {clauses.length > 0 && !editingId && (
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <InputLabel>Join</InputLabel>
                      <Select
                        label="Join"
                        value={nextJoiner}
                        onChange={(e) => setNextJoiner(e.target.value as Joiner)}
                      >
                        <MenuItem value="AND">AND</MenuItem>
                        <MenuItem value="OR">OR</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Field</InputLabel>
                    <Select
                      label="Field"
                      value={builderField}
                      onChange={(e) => setBuilderField(String(e.target.value))}
                    >
                      <MenuItem value="">Select field</MenuItem>
                      {availableFields.map((f) => (
                        <MenuItem key={f.key} value={f.key}>
                          {f.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 190 }} disabled={!selectedField}>
                    <InputLabel>Op</InputLabel>
                    <Select
                      label="Op"
                      value={builderOp}
                      onChange={(e) => setBuilderOp(e.target.value as Operation)}
                    >
                      {opOptions.map((o) => (
                        <MenuItem key={o.op} value={o.op}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Value */}
                  {selectedField ? (
                    selectedField.type === "date" ? (
                      builderOp === "BETWEEN" ? (
                        <>
                          <DatePicker
                            label="Start"
                            value={builderStart}
                            onChange={(val) => setBuilderStart(val)}
                            slotProps={{ textField: { size: "small" } }}
                          />
                          <DatePicker
                            label="End"
                            value={builderEnd}
                            onChange={(val) => setBuilderEnd(val)}
                            slotProps={{ textField: { size: "small" } }}
                          />
                        </>
                      ) : (
                        <Chip
                          label="No date input needed"
                          size="small"
                          sx={{
                            fontWeight: 900,
                            background: color_white,
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      )
                    ) : selectedField.type === "select" ? (
                      builderOp === "IN" ? (
                        <Autocomplete
                          multiple
                          freeSolo
                          options={selectOptions}
                          value={(builderValues || []).map(
                            (v) =>
                              selectOptions.find((o) => o.value === v) ??
                              ({ value: v, label: v } as any)
                          )}
                          onChange={(_, vals) => {
                            const next = (vals || []).map((x: any) =>
                              typeof x === "string" ? x : x.value
                            );
                            setBuilderValues(next);
                          }}
                          disableCloseOnSelect
                          filterSelectedOptions
                          ListboxProps={{ style: { maxHeight: 320, overflow: "auto" } }}
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Values" sx={{ minWidth: 320 }} />
                          )}
                        />
                      ) : (
                        <Autocomplete
                          freeSolo
                          options={selectOptions}
                          value={
                            selectOptions.find((o) => o.value === builderValue) ??
                            (builderValue
                              ? ({ value: builderValue, label: builderValue } as any)
                              : null)
                          }
                          onChange={(_, val: any) => {
                            setBuilderValue(val ? (typeof val === "string" ? val : val.value) : "");
                          }}
                          ListboxProps={{ style: { maxHeight: 320, overflow: "auto" } }}
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Value" sx={{ minWidth: 320 }} />
                          )}
                        />
                      )
                    ) : (
                      <TextField
                        size="small"
                        label="Value"
                        value={builderValue}
                        onChange={(e) => setBuilderValue(e.target.value)}
                        sx={{ minWidth: 260 }}
                      />
                    )
                  ) : (
                    <TextField size="small" label="Value" value={builderValue} disabled sx={{ minWidth: 260 }} />
                  )}

                  <Tooltip title={editingId ? "Update filter" : "Add filter"}>
                    <span>
                      <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={upsertClause}
                        disabled={!canAddOrUpdate()}
                        sx={dangerBtnSx}
                      >
                        {editingId ? "Update" : "Add"}
                      </Button>
                    </span>
                  </Tooltip>

                  {editingId && (
                    <Button
                      onClick={clearBuilder}
                      sx={{
                        ...dangerBtnSx,
                        background: "#6b7280",
                        "&:hover": { background: "#4b5563" },
                      }}
                    >
                      Cancel edit
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Box>

          {/* MAIN SPLIT */}
          <Box
            ref={containerRef}
            sx={{
              flex: 1,
              minHeight: 0,
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 26px rgba(0,0,0,0.08)",
              background: color_white,
              display: "flex",
            }}
          >
            {/* Left grid */}
            <Box
              sx={{
                width: `${leftPct}%`,
                minWidth: 420,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  borderBottom: "1px solid #eef2f7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fbfcfe",
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 900 }}>Requests</Typography>
                  <Chip
                    label={`${totalRequests} requests | ${totalChanges} changes (page ${currentPage}/${totalPages})`}
                    size="small"
                    sx={{ fontWeight: 900 }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FileButton
                    disabled={currentPage <= 1}
                    onClick={() => fetchPage(currentPage - 1, buildRequestBody())}
                  >
                    Prev
                  </FileButton>
                  <FileButton
                    disabled={currentPage >= totalPages}
                    onClick={() => fetchPage(currentPage + 1, buildRequestBody())}
                  >
                    Next
                  </FileButton>
                </Box>
              </Box>

              <Box sx={{ flex: 1, minHeight: 0 }}>
                <div
                  className="ag-theme-quartz"
                  style={{ width: "100%", height: "100%" }}
                  {...themeLightWarm}
                >
                  <AgGridReact
                    rowData={rows}
                    columnDefs={columnDefs}
                    defaultColDef={{ resizable: true, sortable: true, filter: true }}
                    onGridReady={(params: GridReadyEvent) => void params.api}
                    rowHeight={42}
                    headerHeight={46}
                    suppressRowClickSelection
                    rowSelection="single"
                    pagination={false}
                    suppressPaginationPanel={true}
                    domLayout="normal"
                  />
                </div>
              </Box>
            </Box>

            {/* Splitter */}
            <Box
              onMouseDown={() => (draggingRef.current = true)}
              sx={{
                width: 10,
                cursor: "col-resize",
                background: "linear-gradient(to right, #ffffff, #f1f5f9, #ffffff)",
                borderLeft: "1px solid #e5e7eb",
                borderRight: "1px solid #e5e7eb",
              }}
            />

            {/* Right panel */}
            <Box
              sx={{
                width: `${rightPct}%`,
                minWidth: 320,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <FileActivityVisualization mode={mode} payload={payload} clauses={clauses} />
            </Box>

            <style>
              {`
                .ag-theme-quartz .ag-header-cell {
                  background-color: #e8f1fb !important;
                  font-weight: 900 !important;
                  color: #0d47a1 !important;
                }
                .ag-theme-quartz .ag-paging-panel { display: none !important; }
                .ag-theme-quartz .ag-row:hover { background-color: #f1f5f9 !important; }
                .ag-theme-quartz .ag-row-selected { background-color: #dbeafe !important; }
                .ag-theme-quartz .ag-root-wrapper { border: none !important; }
              `}
            </style>
          </Box>
        </Box>

        {/* DETAILS MODAL: changes + photos (READ ONLY) */}
        <Dialog
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedRequest(null);
            setDetailsRows([]);
            setPhotos([]);
            setViewerOpen(false);
            setStartIndex(0);
            setViewerIndex(0);
            setDocuments([]);
            setDocViewerOpen(false);
            setDocStartIndex(0);
            setDocViewerIndex(0);
            clearDocPreview();
          }}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 900,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              background: "linear-gradient(90deg, #ffffff, #f8fafc)",
              borderBottom: "1px solid #eef2f7",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InfoOutlinedIcon />
              Request Details #{selectedRequest?.request_id ?? "-"}
            </Box>

            {/* ✅ RIGHT SIDE ACTIONS */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                startIcon={
                  detailsZipLoading ? (
                    <CircularProgress size={16} sx={{ color: color_white }} />
                  ) : (
                    <DownloadIcon />
                  )
                }
                onClick={() => {
                  setRequestId(selectedRequest?.request_id ?? null)
                  setMediaDownloadOpen(true)
                }}
                disabled={!selectedRequest?.request_id || detailsZipLoading}
                sx={dangerBtnSx}
              >
                {detailsZipLoading ? "Preparing..." : "Download All"}
              </Button>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ background: "#fbfdff" }}>
            {!selectedRequest ? (
              <Typography sx={{ color: "#94a3b8" }}>No request selected.</Typography>
            ) : (
              <>
                {/* Header cards (looks cleaner + uses requested_by) */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 1.25,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: "14px",
                      border: "1px solid #e5e7eb",
                      background: color_white,
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        background: "linear-gradient(180deg, #eef2ff, #e0e7ff)",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid #c7d2fe",
                      }}
                    >
                      <PersonIcon sx={{ color: "#3730a3" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Created By</Typography>
                      <Typography sx={{ fontWeight: 800, color: "#334155" }}>{createdByName}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                        Requested By ID: {selectedRequest.requested_by ?? "-"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: "14px",
                      border: "1px solid #e5e7eb",
                      background: color_white,
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        background: "linear-gradient(180deg, #ecfeff, #cffafe)",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid #a5f3fc",
                      }}
                    >
                      <DescriptionIcon sx={{ color: "#155e75" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>File</Typography>
                      <Typography sx={{ fontWeight: 800, color: "#334155" }}>
                        {selectedRequest.file_name ?? "-"}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                        Created At:{" "}
                        {selectedRequest.created_at
                          ? dayjs(selectedRequest.created_at).format("DD-MM-YYYY HH:mm")
                          : "-"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* CHANGES TABLE (READ ONLY) */}
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 900 }}>
                  Field Changes
                </Typography>

                {detailsLoading || detailsLoadingLocal ? (
                  <Typography sx={{ color: "#94a3b8" }}>Loading changes...</Typography>
                ) : detailsRows.length === 0 ? (
                  <Typography sx={{ color: "#94a3b8" }}>No change rows found.</Typography>
                ) : (
                  <Box
                    sx={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      overflow: "hidden",
                      background: color_white,
                      boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                    }}
                  >
                    <Box sx={{ maxHeight: 340, overflow: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={{ textAlign: "left", padding: 12, fontWeight: 900, color: "#0f172a" }}>
                              Field
                            </th>
                            <th style={{ textAlign: "left", padding: 12, fontWeight: 900, color: "#0f172a" }}>
                              Old
                            </th>
                            <th style={{ textAlign: "left", padding: 12, fontWeight: 900, color: "#0f172a" }}>
                              New
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsRows.map((d, idx) => (
                            <tr key={d.id ?? `${d.field_key}-${idx}`}>
                              <td style={{ padding: 12, borderTop: "1px solid #eef2f7", color: "#0f172a" }}>
                                {d.field_key ?? d.field_name ?? "-"}
                              </td>
                              <td style={{ padding: 12, borderTop: "1px solid #eef2f7", color: "#334155" }}>
                                {d.old_value ?? <i>(empty)</i>}
                              </td>
                              <td style={{ padding: 12, borderTop: "1px solid #eef2f7", color: "#334155" }}>
                                {d.new_value ?? <i>(empty)</i>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                )}

                {/* PHOTOS */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 900 }}>
                  Uploaded Photos
                </Typography>

                {/* Tiny legend to make meaning obvious */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.25 }}>
                  {(["approved", "rejected", null] as PhotoStatus[]).map((s) => {
                    const meta = photoStatusMeta(s);
                    return (
                      <Chip
                        key={String(s)}
                        icon={meta.icon}
                        label={`${meta.label} — ${meta.helper}`}
                        color={meta.chipColor}
                        size="small"
                        sx={{ fontWeight: 900 }}
                      />
                    );
                  })}
                </Box>

                {photos.length === 0 ? (
                  <Typography sx={{ color: "#94a3b8" }}>No photos submitted.</Typography>
                ) : (
                  <Grid container spacing={1.5}>
                    {photos.map((photo, idx) => {
                      const meta = photoStatusMeta(photo.status ?? null);
                      return (
                        <Grid key={photo.id}>
                          <Card
                            sx={{
                              position: "relative",
                              borderRadius: "14px",
                              overflow: "hidden",
                              cursor: "pointer",
                              border: meta.border,
                              boxShadow: meta.shadow,
                              background: color_white,
                              transition: "transform 140ms ease, box-shadow 140ms ease",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: meta.shadow,
                              },
                            }}
                            onClick={() => handleOpenViewer(idx)}
                          >
                            {/* subtle tint layer to make status feel "real" */}
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 1,
                                pointerEvents: "none",
                                background: meta.tint,
                              }}
                            />

                            <CardMedia
                              component="img"
                              height="190"
                              image={`${API_BASE}/file/photo/${photo.id}`}
                              sx={{ objectFit: "cover" }}
                            />

                            {/* Strong status bar */}
                            <Box
                              sx={{
                                position: "absolute",
                                left: 10,
                                right: 10,
                                bottom: 10,
                                zIndex: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                px: 1,
                                py: 0.75,
                                borderRadius: "12px",
                                background: meta.overlayBg,
                                color: color_white,
                                fontWeight: 900,
                                backdropFilter: "blur(6px)",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                {meta.icon}
                                <span>{meta.label}</span>
                              </Box>

                              <span style={{ fontSize: 12, opacity: 0.95 }}>
                                Photo #{photo.id}
                              </span>
                            </Box>

                            {/* Gallery chip */}
                            {photo.is_gallery_photo && (
                              <Box sx={{ position: "absolute", top: 10, right: 10, zIndex: 3 }}>
                                <Chip
                                  label="Gallery"
                                  color="info"
                                  size="small"
                                  sx={{
                                    fontWeight: 900,
                                    background: "rgba(255,255,255,0.92)",
                                  }}
                                />
                              </Box>
                            )}
                          </Card>

                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mt: 0.9,
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Chip
                              icon={meta.icon}
                              label={meta.label}
                              color={meta.chipColor}
                              size="small"
                              sx={{ fontWeight: 900 }}
                            />

                            <Button
                              size="small"
                              startIcon={<DownloadIcon fontSize="small" />}
                              onClick={() => downloadMediaById(photo.id, `photo_${photo.id}.jpg`, "image/jpeg")}

                              sx={dangerBtnSx}
                            >
                              Download
                            </Button>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                {/* DOCUMENTS */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 900 }}>
                  Uploaded Documents
                </Typography>

                {/* Tiny legend (reuse same status UI) */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.25 }}>
                  {(["approved", "rejected", null] as PhotoStatus[]).map((s) => {
                    const meta = photoStatusMeta(s);
                    return (
                      <Chip
                        key={String(s)}
                        icon={meta.icon}
                        label={`${meta.label} — ${meta.helper}`}
                        color={meta.chipColor}
                        size="small"
                        sx={{ fontWeight: 900 }}
                      />
                    );
                  })}
                </Box>

                {documents.length === 0 ? (
                  <Typography sx={{ color: "#94a3b8" }}>No documents submitted.</Typography>
                ) : (
                  <Grid container spacing={1.5}>
                    {documents.map((doc, idx) => {
                      const meta = photoStatusMeta(doc.status ?? null);
                      return (
                        <Grid key={doc.id}>
                          <Card
                            sx={{
                              position: "relative",
                              borderRadius: "14px",
                              overflow: "hidden",
                              cursor: "pointer",
                              border: meta.border,
                              boxShadow: meta.shadow,
                              background: color_white,
                              transition: "transform 140ms ease, box-shadow 140ms ease",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: meta.shadow,
                              },
                            }}
                            onClick={() => handleOpenDocViewer(idx)}
                          >
                            {/* subtle tint layer */}
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 1,
                                pointerEvents: "none",
                                background: meta.tint,
                              }}
                            />

                            {/* Keep same CardMedia pattern but show an icon-ish "preview" area using existing CardMedia */}
                            <CardMedia
                              component="div"
                              sx={{
                                height: 190,
                                display: "grid",
                                placeItems: "center",
                                background: color_white,
                              }}
                            >
                              <DescriptionIcon sx={{ fontSize: 64, color: "#334155" }} />
                            </CardMedia>

                            {/* Strong status bar */}
                            <Box
                              sx={{
                                position: "absolute",
                                left: 10,
                                right: 10,
                                bottom: 10,
                                zIndex: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                px: 1,
                                py: 0.75,
                                borderRadius: "12px",
                                background: meta.overlayBg,
                                color: color_white,
                                fontWeight: 900,
                                backdropFilter: "blur(6px)",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                {meta.icon}
                                <span>{meta.label}</span>
                              </Box>

                              <span style={{ fontSize: 12, opacity: 0.95 }}>
                                Doc #{doc.id}
                              </span>
                            </Box>
                          </Card>

                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mt: 0.9,
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Chip
                              icon={meta.icon}
                              label={meta.label}
                              color={meta.chipColor}
                              size="small"
                              sx={{ fontWeight: 900 }}
                            />

                            <Button
                              size="small"
                              startIcon={<DownloadIcon fontSize="small" />}
                              onClick={() =>
                                downloadMediaById(
                                  doc.id,
                                  doc.filename ?? `document_${doc.id}`,
                                  doc.mime_type || guessMimeFromFilename(doc.filename)
                                )
                              }

                              sx={dangerBtnSx}
                            >
                              Download
                            </Button>
                          </Box>

                          {doc.filename && (
                            <Typography
                              sx={{
                                mt: 0.6,
                                fontSize: 12,
                                fontWeight: 800,
                                color: "#334155",
                                maxWidth: 240,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={doc.filename}
                            >
                              {doc.filename}
                            </Typography>
                          )}
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

              </>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 1.25, background: "#ffffff" }}>
            <Button
              onClick={() => {
                setDetailsOpen(false);
                setSelectedRequest(null);
                setDetailsRows([]);
                setPhotos([]);
                setViewerOpen(false);
                setStartIndex(0);
                setViewerIndex(0);
                setDocuments([]);
                setDocViewerOpen(false);
                setDocStartIndex(0);
                setDocViewerIndex(0);
                clearDocPreview();
              }}
              sx={dangerBtnSx}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* FULLSCREEN VIEWER (READ ONLY) */}
        {viewerOpen && (
          <Dialog open={true} onClose={() => setViewerOpen(false)} fullScreen>
            <DialogTitle
              sx={{
                fontWeight: 900,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#0b1220",
                color: color_white,
              }}
            >
              Photo Viewer
              <Button onClick={() => setViewerOpen(false)} sx={dangerBtnSx}>
                Close
              </Button>
            </DialogTitle>

            <DialogContent sx={{ background: "#000" }}>
              <ImageGallery
                items={galleryItems}
                startIndex={startIndex}
                showPlayButton={false}
                showFullscreenButton={false}
                showThumbnails={false}
                onSlide={(currentIndex) => setViewerIndex(currentIndex)}
              />

              {/* Status label in viewer (icon + clearer) */}
              {photos[viewerIndex] && (() => {
                const meta = photoStatusMeta(photos[viewerIndex].status ?? null);
                return (
                  <div
                    style={{
                      position: "fixed",
                      top: 82,
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "10px 16px",
                      borderRadius: "999px",
                      background: meta.viewerBg,
                      color: color_white,
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <span style={{ display: "grid", placeItems: "center" }}>{meta.icon}</span>
                    <span>{meta.label}</span>
                    <span style={{ opacity: 0.9, fontWeight: 800, fontSize: "0.85rem" }}>
                      — {meta.helper}
                    </span>
                  </div>
                );
              })()}

              {/* Download only */}
              <div
                style={{
                  position: "fixed",
                  bottom: "30px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "20px",
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  sx={{
                    padding: "12px 28px",
                    fontWeight: 900,
                    borderRadius: "12px",
                  }}
                  onClick={() => {
                    const p = photos[viewerIndex];
                    if (!p) return;
                    downloadMediaById(p.id, `photo_${p.id}.jpg`, "image/jpeg");
                  }}
                >
                  Download
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {/* FULLSCREEN DOCUMENT VIEWER (READ ONLY) */}
        {/* FULLSCREEN DOCUMENT VIEWER (READ ONLY) */}
        {docViewerOpen && currentDoc && (
          <Dialog
            open={true}
            onClose={() => {
              setDocViewerOpen(false);
              clearDocPreview();
            }}
            fullScreen
          >
            <DialogTitle
              sx={{
                fontWeight: 900,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#0b1220",
                color: color_white,
              }}
            >
              Document Viewer
              <Button
                onClick={() => {
                  setDocViewerOpen(false);
                  clearDocPreview();
                }}
                sx={dangerBtnSx}
              >
                Close
              </Button>
            </DialogTitle>

            <DialogContent sx={{ background: "#000" }}>
              {/* Header */}
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 900, color: color_white }}>
                  {currentDoc.filename ?? `Document #${currentDoc.id}`}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, color: color_white }}>
                  {currentDocMime || "unknown"} • ID: {currentDoc.id} • {docViewerIndex + 1}/{documents.length}
                </Typography>
              </Box>

              {/* Viewer */}
              <Box
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "#0b0b0b",
                  overflow: "hidden",
                  minHeight: "75vh",
                }}
              >
                {docBlobLoading && (
                  <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, color: color_white }}>
                    <CircularProgress size={24} />
                    <Typography>Loading document...</Typography>
                  </Box>
                )}

                {!docBlobLoading && docBlobError && (
                  <Box sx={{ p: 3, color: color_white }}>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>Failed to load document</Typography>
                    <Typography sx={{ opacity: 0.85 }}>{String(docBlobError)}</Typography>
                  </Box>
                )}

                {!docBlobLoading && docBlobUrl && (
                  <>
                    {isPdfMime(currentDocMime) && (
                      <iframe
                        title="pdf-viewer"
                        src={docBlobUrl}
                        style={{ width: "100%", height: "78vh", border: 0, background: color_white }}
                      />
                    )}

                    {isImageMime(currentDocMime) && (
                      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                        <img
                          src={docBlobUrl}
                          style={{ maxWidth: "100%", maxHeight: "78vh", objectFit: "contain" }}
                          alt={currentDoc.filename}
                        />
                      </Box>
                    )}

                    {!isPdfMime(currentDocMime) && !isImageMime(currentDocMime) && (
                      <Box sx={{ p: 3, color: color_white }}>
                        <Typography sx={{ fontWeight: 800, mb: 2 }}>
                          Preview not supported for this file type.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={() =>
                            downloadMediaById(
                              currentDoc.id,
                              currentDoc.filename ?? `document_${currentDoc.id}`,
                              currentDocMime
                            )
                          }
                          sx={{ fontWeight: 900 }}
                        >
                          Download
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>

              {/* Bottom controls */}
              <Box
                sx={{
                  position: "fixed",
                  bottom: 24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 3,
                  p: 1.5,
                  backdropFilter: "blur(8px)",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handlePrevDoc}
                  disabled={docViewerIndex === 0 || docBlobLoading}
                  sx={{ fontWeight: 900 }}
                >
                  ◀ Prev
                </Button>

                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() =>
                    downloadMediaById(
                      currentDoc.id,
                      currentDoc.filename ?? `document_${currentDoc.id}`,
                      currentDocMime
                    )
                  }

                  sx={{ fontWeight: 900 }}
                  disabled={docBlobLoading}
                >
                  Download
                </Button>

                <Button
                  variant="contained"
                  onClick={handleNextDoc}
                  disabled={docViewerIndex === documents.length - 1 || docBlobLoading}
                  sx={{ fontWeight: 900 }}
                >
                  Next ▶
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        )}

        {downloadOpen && <DownloadUpdatesModal
          open={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          apiBase={API_BASE}
          mode={mode}
          clauses={clauses}
          dangerBtnSx={dangerBtnSx}
        />}

        {mediaDownloadOpen && (
          <DownloadMediaModal
            open={mediaDownloadOpen}
            onClose={() => setMediaDownloadOpen(false)}
            apiBase={API_BASE}
            clauses={requestId ? [] : clauses}
            dangerBtnSx={dangerBtnSx}
            requestId={requestId}
          />
        )}



      </LocalizationProvider>

      {/* Splitter drag handlers already defined above */}
    </>
  );
}
