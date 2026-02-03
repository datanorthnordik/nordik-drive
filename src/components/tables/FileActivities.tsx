"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  colorSchemeLightWarm,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { Box, Button } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import dayjs from "dayjs";

import PhotoViewerModal, { ViewerPhoto } from "../../pages/viewers/PhotoViewer";
import DocumentViewerModal from "../../pages/viewers/DocumentViewer";

import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import DownloadUpdatesModal from "../models/DownloadUpdates";
import DownloadMediaModal from "../models/DownloadMedias";

import FileActivitiesTopBar from "./FileActivitiesTopBar";
import FileActivitiesFilters from "./FileActivitiesFilters";
import FileActivitiesSplitView from "./FileActivitiesSplitView";
import RequestDetailsDialog from "./RequestDetailsDialog";

import {
  Clause,
  FilesResp,
  Mode,
  PendingDownload,
  PhotoStatus,
  RequestDocument,
  RequestPhoto,
  SelectOption,
  UsersResp,
  deriveSelectedFileId,
  guessMimeFromFilename,
} from "./FileActivitiesShared";

import {
  color_background,
  color_border,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_white,
  color_white_smoke,
} from "../../constants/colors";

ModuleRegistry.registerModules([AllCommunityModule]);
const themeLightWarm = themeQuartz.withPart(colorSchemeLightWarm);

export default function FileActivities({
  onParentModeChange,
}: {
  onParentModeChange?: (mode: any) => void;
}) {
  const API_BASE = "https://nordikdriveapi-724838782318.us-west1.run.app/api";

  const [mode, setMode] = useState<Mode>("CHANGES");

  // results
  const [rows, setRows] = useState<any[]>([]);
  const [payload, setPayload] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // clauses shared with visualization/download modals
  const [clauses, setClauses] = useState<Clause[]>([]);

  // DETAILS MODAL STATE
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsRows, setDetailsRows] = useState<any[]>([]);
  const [photos, setPhotos] = useState<RequestPhoto[]>([]);
  const [documents, setDocuments] = useState<RequestDocument[]>([]);
  const [detailsZipLoading, setDetailsZipLoading] = useState(false);

  // photo viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  // doc viewer
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerIndex, setDocViewerIndex] = useState(0);
  const [docBlobUrl, setDocBlobUrl] = useState("");
  const lastDocBlobUrlRef = useRef<string>("");

  // download modals
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [mediaDownloadOpen, setMediaDownloadOpen] = useState(false);
  const [requestId, setRequestId] = useState<any>(null);

  const [pendingDownload, setPendingDownload] = useState<PendingDownload | null>(null);

  // Prefetch dropdown values
  const { fetchData: fetchUsers, data: usersResp, loading: usersLoading } = useFetch(
    `${API_BASE}/user`,
    "GET",
    false
  );

  const { fetchData: fetchFiles, data: filesResp, loading: filesLoading } = useFetch(
    `${API_BASE}/file`,
    "GET",
    false
  );

  const { fetchData: fetchCommunities, data: communitiesResp, loading: communitiesLoading } =
    useFetch(`${API_BASE}/communities`, "GET", false);

  // Main search API
  const { loading, fetchData, data: resp } = useFetch(`${API_BASE}/admin`, "POST");

  // Details API (change list)
  const { data: detailsResp, fetchData: fetchDetails, loading: detailsLoading } = useFetch(
    `${API_BASE}/admin/details`,
    "POST",
    false
  );

  // Photos for request
  const { data: photoData, fetchData: loadPhotos } = useFetch(
    `${API_BASE}/file/edit/photos/${selectedRequest?.request_id}`,
    "GET",
    false
  );

  // Docs for request
  const { data: docData, fetchData: loadDocs } = useFetch(
    `${API_BASE}/file/edit/docs/${selectedRequest?.request_id}`,
    "GET",
    false
  );

  const {
    data: docBlobData,
    fetchData: fetchDocBlob,
    loading: docBlobLoading,
  } = useFetch<any>(`${API_BASE}/file/doc`, "GET", false);

  const {
    data: mediaBlobData,
    fetchData: fetchMediaBlob,
    loading: mediaBlobLoading,
    error: mediaBlobError,
  } = useFetch<any>(`${API_BASE}/file/doc/download`, "POST", false);

  useEffect(() => {
    fetchUsers();
    fetchFiles();
    fetchCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // main search response
  useEffect(() => {
    if (!resp) return;
    const r = resp as any;
    setPayload(r);
    setRows(r.data || []);
    setCurrentPage(r.page || 1);
    setTotalPages(r.total_pages || 1);
  }, [resp]);

  // details response
  useEffect(() => {
    if (!detailsResp) return;
    const d = detailsResp as any;
    setDetailsRows(d?.data || []);
  }, [detailsResp]);

  // load photos/docs when request changes
  useEffect(() => {
    if (!selectedRequest?.request_id) return;
    loadPhotos();
    loadDocs();
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

  // options
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

  const communityOptions = useMemo<SelectOption[]>(() => {
    const list = (communitiesResp as any)?.communities ?? [];
    return list
      .map((c: any) => String(c?.name ?? "").trim())
      .filter(Boolean)
      .map((name: string) => ({ value: name, label: name }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
  }, [communitiesResp]);

  const uploaderCommunityOptions = communityOptions;

  // fieldList for "field_key": needs selected file id based on clauses
  const selectedFileId = useMemo(() => deriveSelectedFileId(clauses, "", "EQ", "", []), [clauses]);

  const [fieldList, setFieldList] = useState<SelectOption[]>([]);
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

  const totalRequests = payload?.total_rows ?? 0;
  const totalChanges = payload?.total_changes ?? 0;

  // styles
  const primaryBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    background: color_secondary,
    color: color_white,
    "&:hover": { background: color_secondary_dark },
  } as const;

  const secondaryBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    backgroundColor: color_white,
    border: `1px solid ${color_secondary_dark}`,
    color: color_text_primary,
    "&:hover": { backgroundColor: color_white_smoke },
  } as const;

  // helpers
  const buildRequestBody = () => ({ mode, clauses });
  const fetchPage = (page: number) => fetchData({ page, page_size: 20, ...buildRequestBody() });

  const resetAll = () => {
    setClauses([]);
    setRows([]);
    setPayload(null);
    setCurrentPage(1);
    setTotalPages(1);

    // close details
    setDetailsOpen(false);
    setSelectedRequest(null);
    setDetailsRows([]);
    setPhotos([]);
    setDocuments([]);
    setViewerOpen(false);
    setDocViewerOpen(false);
    setDocViewerIndex(0);
    clearDocPreview();
  };

  const handleApply = () => fetchPage(1);

  // Details open handler used by grid column
  const handleOpenDetails = (req: any) => {
    if (!req?.request_id) return;

    setSelectedRequest(req);
    setDetailsOpen(true);

    setDetailsRows([]);
    setPhotos([]);
    setDocuments([]);

    setViewerOpen(false);
    setDocViewerOpen(false);
    setDocViewerIndex(0);
    clearDocPreview();

    fetchDetails({ request_id: Number(req.request_id) });
  };

  // Grid columns
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
        valueFormatter: (p: any) => (p.value ? dayjs(p.value).format("DD-MM-YYYY HH:mm") : ""),
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
              onClick={() => handleOpenDetails(p.data)}
              sx={primaryBtnSx}
            >
              Details
            </Button>
          );
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryBtnSx]);

  // createdByName
  const createdByName = useMemo(() => {
    if (!selectedRequest) return "-";
    const id = selectedRequest.requested_by;
    if (id === null || id === undefined || id === "") return "-";
    return userOptions.find((u) => u.value === String(id))?.label ?? `User ${id}`;
  }, [selectedRequest, userOptions]);

  // Viewer photos mapping
  const viewerPhotos = useMemo<ViewerPhoto[]>(() => {
    return (photos || []).map((p) => ({
      id: p.id,
      file_name: `photo_${p.id}.jpg`,
      mime_type: "image/jpeg",
      status: (p.status ?? null) as any,
      is_gallery_photo: p.is_gallery_photo,
      request_id: selectedRequest?.request_id,
    }));
  }, [photos, selectedRequest?.request_id]);

  const handleOpenPhotoViewer = (idx: number) => {
    setStartIndex(idx);
    setViewerOpen(true);
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
      await fetchDocBlob(undefined, undefined, false, {
        path: doc.id,
        responseType: "blob",
      });
    },
    [documents, clearDocPreview, fetchDocBlob]
  );

  const handleOpenDocViewer = async (idx: number) => {
    setDocViewerIndex(idx);
    setDocViewerOpen(true);
    await openDocAtIndex(idx);
  };

  // doc blob -> url
  const currentDoc = documents[docViewerIndex];
  const currentDocMime = currentDoc?.mime_type || guessMimeFromFilename(currentDoc?.filename) || "";

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

  // download single media (photo/doc)
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

  const downloadMediaById = useCallback(
    (id: number, filename?: string, mime?: string) => {
      if (!id || Number.isNaN(id)) return;
      if (mediaBlobLoading) return;

      setPendingDownload({ id, filename: filename || `media_${id}`, mime });

      fetchMediaBlob(undefined, undefined, false, {
        path: id,
        responseType: "blob",
      });
    },
    [fetchMediaBlob, mediaBlobLoading]
  );

  useEffect(() => {
    if (!pendingDownload) return;
    const b = normalizeBlob(mediaBlobData);
    if (!b) return;

    try {
      triggerDownloadFromBlob(b, pendingDownload.filename, pendingDownload.mime);
    } finally {
      setPendingDownload(null);
    }
  }, [mediaBlobData, pendingDownload]);

  useEffect(() => {
    if (!pendingDownload) return;
    if (!mediaBlobError) return;
    setPendingDownload(null);
  }, [mediaBlobError, pendingDownload]);

  return (
    <>
      <Loader loading={loading || usersLoading || filesLoading || detailsLoading || communitiesLoading || docBlobLoading} />

      <Box
        sx={{
          height: "100%",
          p: { xs: 1, md: 1.25 },
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          gap: 1,
          background: color_background,
        }}
      >
        <FileActivitiesTopBar
          mode={mode}
          onModeChange={setMode}
          totalRequests={totalRequests}
          totalChanges={totalChanges}
          onOpenDownloadUpdates={() => setDownloadOpen(true)}
          onOpenDownloadMedia={() => {
            setMediaDownloadOpen(true);
            setRequestId(null);
          }}
          primaryBtnSx={primaryBtnSx}
        />

        <FileActivitiesFilters
          clauses={clauses}
          setClauses={setClauses}
          userOptions={userOptions}
          fileOptions={fileOptions}
          communityOptions={communityOptions}
          uploaderCommunityOptions={uploaderCommunityOptions}
          fieldList={fieldList}
          onApply={handleApply}
          onReset={resetAll}
          onModeSwitchToGeneral={(v) => onParentModeChange?.(v)}
          primaryBtnSx={primaryBtnSx}
          secondaryBtnSx={secondaryBtnSx}
        />

        <FileActivitiesSplitView
          themeLightWarm={themeLightWarm}
          rows={rows}
          columnDefs={columnDefs}
          totalRequests={totalRequests}
          totalChanges={totalChanges}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => fetchPage(currentPage - 1)}
          onNext={() => fetchPage(currentPage + 1)}
          payload={payload}
          mode={mode}
          clauses={clauses}
        />
      </Box>

      <RequestDetailsDialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedRequest(null);
          setDetailsRows([]);
          setPhotos([]);
          setDocuments([]);
          setViewerOpen(false);
          setDocViewerOpen(false);
          setDocViewerIndex(0);
          clearDocPreview();
        }}
        apiBase={API_BASE}
        selectedRequest={selectedRequest}
        createdByName={createdByName}
        detailsLoading={detailsLoading}
        detailsRows={detailsRows}
        photos={photos}
        onOpenPhotoViewer={handleOpenPhotoViewer}
        documents={documents}
        onOpenDocViewer={handleOpenDocViewer}
        detailsZipLoading={detailsZipLoading}
        onDownloadAll={() => {
          setRequestId(selectedRequest?.request_id ?? null);
          setMediaDownloadOpen(true);
        }}
        onDownloadSingle={downloadMediaById}
        primaryBtnSx={primaryBtnSx}
        secondaryBtnSx={secondaryBtnSx}
      />

      {/* Fullscreen photo viewer */}
      <PhotoViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photos={viewerPhotos}
        startIndex={startIndex}
        mode="view"
        showThumbnails={true}
        showStatusPill={true}
        only_approved={false}
      />

      {/* Fullscreen document viewer */}
      <DocumentViewerModal
        open={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        docs={(documents || []).map((d) => ({
          id: d.id,
          file_name: d.filename,
          mime_type: d.mime_type || guessMimeFromFilename(d.filename),
          status: (d.status ?? null) as any,
        }))}
        startIndex={docViewerIndex}
        mode="view"
        apiBase={API_BASE}
        blobEndpointPath="/file/doc"
        showApproveReject={false}
        showPrevNext={true}
        showBottomBar={true}
        showBottomOpenButton={true}
        bottomOpenLabel="View"
        tipText="If preview doesn’t load (some types can’t embed), use “Open” or “Download”."
      />

      {downloadOpen && (
        <DownloadUpdatesModal
          open={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          apiBase={API_BASE}
          mode={mode}
          clauses={clauses}
          dangerBtnSx={primaryBtnSx}
        />
      )}

      {mediaDownloadOpen && (
        <DownloadMediaModal
          open={mediaDownloadOpen}
          onClose={() => setMediaDownloadOpen(false)}
          apiBase={API_BASE}
          clauses={requestId ? [] : clauses}
          dangerBtnSx={primaryBtnSx}
          requestId={requestId}
        />
      )}
    </>
  );
}
