'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import useFetch from "../../../hooks/useFetch";

import { AdditionalDocItem } from "../../datatable/add-info-dialog/types";
import { PhotoItem } from "../../datatable/add-info-dialog/PhotoUploadCard";
import { DocumentGrid } from "../../shared/DocumentGrids";
import { PhotoGrid } from "../../shared/PhotoGrids";

import FormPhotoViewerModal, { FormViewerPhoto } from "./FormPhotoViewerModal";
import FormDocumentViewerModal, { FormViewerDoc } from "./FormDocumentViewerModal";
import ConfigFormFieldRenderer from "./ConfigFormFieldRenderer";
import ConfigFormTableSection from "./ConfigFormTable";
import useConfigFormLookups from "./hooks/useConfigFormLookups";

import {
  color_border,
  color_focus_ring,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_white,
  color_white_smoke,
  shadow_auth_button,
} from "../../../constants/colors";

import {
  BaseLeafColCfg,
  ExistingDocumentItem,
  ExistingPhotoItem,
  FormCfg,
  PendingMediaAction,
  TableCfg,
  emptyRowFromColumns,
  flattenCols,
  isRequired,
  meets,
  normalizeTable,
  resolveFileId,
  resolveRowId,
} from "./shared";

type Props = {
  open: boolean;
  onClose: () => void;

  row: any;
  file: any;
  formConfig: FormCfg | null;

  apiBase: string;
  fetchPath?: string;
  savePath?: string;

  onSaved?: (answers: Record<string, any>) => void;
  addInfoConfig?: any;
};

export default function ConfigFormModal({
  open,
  onClose,
  row,
  file,
  formConfig,
  apiBase,
  fetchPath = "/form/answers",
  savePath = "/form/answers",
  onSaved,
  addInfoConfig,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const identityRef = useRef<string>("");

  const [missingKeys, setMissingKeys] = useState<Set<string>>(new Set());

  const [additionalDocsByField, setAdditionalDocsByField] = useState<
    Record<string, AdditionalDocItem[]>
  >({});
  const [photosByField, setPhotosByField] = useState<Record<string, PhotoItem[]>>({});

  const [existingDocsByField, setExistingDocsByField] = useState<
    Record<string, ExistingDocumentItem[]>
  >({});
  const [existingPhotosByField, setExistingPhotosByField] = useState<
    Record<string, ExistingPhotoItem[]>
  >({});

  const [consentGiven, setConsentGiven] = useState(false);
  const [pendingMediaAction, setPendingMediaAction] = useState<PendingMediaAction>(null);

  const [existingPhotoViewerOpen, setExistingPhotoViewerOpen] = useState(false);
  const [existingPhotoViewerIndex, setExistingPhotoViewerIndex] = useState(0);
  const [existingPhotoViewerItems, setExistingPhotoViewerItems] = useState<FormViewerPhoto[]>([]);

  const [existingDocViewerOpen, setExistingDocViewerOpen] = useState(false);
  const [existingDocViewerIndex, setExistingDocViewerIndex] = useState(0);
  const [existingDocViewerItems, setExistingDocViewerItems] = useState<FormViewerDoc[]>([]);

  const missField = (k: string) => `f:${k}`;
  const missCell = (t: string, r: number, c: string) => `t:${t}:${r}:${c}`;

  const clearMissing = (id: string) => {
    setMissingKeys((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const fileId = useMemo(() => resolveFileId(file), [file]);
  const rowId = useMemo(() => resolveRowId(row), [row]);
  const formKey = useMemo(() => (formConfig?.key ? String(formConfig.key) : ""), [formConfig]);

  const title = formConfig?.display_name || formConfig?.name || "Form";
  const editable = formConfig?.editable !== false;

  const {
    data: fetchDataRes,
    error: fetchErr,
    loading: fetching,
    fetchData: fetchAnswers,
  } = useFetch(`${apiBase}${fetchPath}`, "GET", false);

  const {
    data: saveDataRes,
    error: saveErr,
    loading: saving,
    fetchData: saveAnswers,
  } = useFetch(`${apiBase}${savePath}`, "POST", false);

  const {
    data: uploadBlobData,
    fetchData: fetchUploadBlob,
    loading: uploadBlobLoading,
    error: uploadBlobError,
  } = useFetch<any>(`${apiBase}/form/answers/upload`, "GET", false);

  const {
    lookupOptionsByPath,
    lookupLoadingByPath,
    lookupErrorsByPath,
    getLookupPathForColumn,
    getSelectedLookupOption,
    applyConfiguredRowRules,
    resetLookupState,
  } = useConfigFormLookups({
    formConfig,
    answers,
    setAnswers,
  });

  useEffect(() => {
    if (!open) return;
    setMissingKeys(new Set());
  }, [open]);


  useEffect(() => {
    if (!open || !formConfig) return;

    const identity = `${fileId || ""}:${rowId || ""}:${formKey}`;
    const sameOpen = identityRef.current === identity;
    identityRef.current = identity;

    if (!sameOpen) {
      let next: Record<string, any> = {};
      formConfig.sections?.forEach((sec) =>
        (sec.tables || []).forEach((t) => {
          next = normalizeTable(next, t);
        })
      );

      setAnswers(next);
      setAdditionalDocsByField({});
      setPhotosByField({});
      setExistingDocsByField({});
      setExistingPhotosByField({});
      setConsentGiven(false);
      setPendingMediaAction(null);
      resetLookupState();
    }

    if (!fileId || !rowId || !formKey) return;

    fetchAnswers(undefined, { file_id: fileId, row_id: rowId, form_key: formKey }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId, rowId, formKey, formConfig, resetLookupState]);

  useEffect(() => {
    if (!fetchDataRes || !formConfig) return;

    const root = (fetchDataRes as any)?.data || (fetchDataRes as any)?.value || fetchDataRes;

    const incomingDetails = Array.isArray(root?.details) ? root.details : null;
    const incomingDocuments = Array.isArray(root?.documents) ? root.documents : [];
    const incomingPhotos = Array.isArray(root?.photos) ? root.photos : [];

    let next: Record<string, any> = {};

    if (incomingDetails) {
      incomingDetails.forEach((d: any) => {
        if (!d?.detail_key) return;
        next[d.detail_key] = d?.value ?? null;
      });
    } else {
      const legacyAnswers = root?.answers || root?.data?.answers || root?.value?.answers || root;
      next = { ...(legacyAnswers || {}) };
    }

    formConfig.sections?.forEach((sec) => {
      (sec.tables || []).forEach((t) => {
        next = normalizeTable(next, t);
      });
    });

    const docsMap: Record<string, ExistingDocumentItem[]> = {};
    incomingDocuments.forEach((d: any, idx: number) => {
      const key = String(d?.detail_key || "");
      if (!key) return;
      if (!docsMap[key]) docsMap[key] = [];
      docsMap[key].push({
        id: String(d?.id || `existing-doc-${key}-${idx}`),
        detail_key: key,
        file_name: String(d?.file_name || d?.doc_name || "Document"),
        mime_type: d?.mime_type || d?.doc_type || "",
        file_size_bytes: Number(d?.file_size_bytes || d?.doc_size || 0),
        file_url: d?.file_url || d?.doc_link || "",
        file_category: d?.file_category || d?.doc_category || "",
      });
    });

    const photosMap: Record<string, ExistingPhotoItem[]> = {};
    incomingPhotos.forEach((p: any, idx: number) => {
      const key = String(p?.detail_key || "");
      if (!key) return;
      if (!photosMap[key]) photosMap[key] = [];
      photosMap[key].push({
        id: String(p?.id || `existing-photo-${key}-${idx}`),
        detail_key: key,
        file_name: String(p?.file_name || p?.doc_name || "Photo"),
        mime_type: p?.mime_type || p?.doc_type || "",
        file_size_bytes: Number(p?.file_size_bytes || p?.doc_size || 0),
        file_url: p?.file_url || p?.doc_link || "",
        file_comment: p?.file_comment || p?.doc_comment || "",
      });
    });

    setAnswers(next);
    setExistingDocsByField(docsMap);
    setExistingPhotosByField(photosMap);
    setMissingKeys(new Set());
    setConsentGiven(
      Boolean(root?.consent ?? root?.consent_given ?? next?.consent ?? next?.archive_consent)
    );
  }, [fetchDataRes, formConfig]);

  useEffect(() => {
    if (fetchErr) toast.error(fetchErr);
  }, [fetchErr]);

  useEffect(() => {
    if (saveErr) toast.error(saveErr);
  }, [saveErr]);

  useEffect(() => {
    if (saveDataRes && !saveErr)  {
        toast.success(`${formConfig?.display_name} details updated successfully`)
        onClose();
    }
  }, [saveDataRes, saveErr]);

  useEffect(() => {
    if (uploadBlobError) toast.error(uploadBlobError);
  }, [uploadBlobError]);

  useEffect(() => {
    if (!uploadBlobData || !pendingMediaAction) return;

    const blobCandidate =
      uploadBlobData instanceof Blob
        ? uploadBlobData
        : (uploadBlobData as any)?.data instanceof Blob
          ? (uploadBlobData as any).data
          : null;

    if (!blobCandidate) return;

    const objectUrl = URL.createObjectURL(blobCandidate);

    if (pendingMediaAction.mode === "open") {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } else {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = pendingMediaAction.filename || `file_${pendingMediaAction.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    }

    setPendingMediaAction(null);
  }, [uploadBlobData, pendingMediaAction]);

  const setField = (k: string, v: any) => {
    setAnswers((prev) => ({ ...prev, [k]: v }));

    if (
      Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== ""
    ) {
      clearMissing(missField(k));
    }
  };

  const setConfiguredCell = (tbl: TableCfg, rowIdx: number, col: BaseLeafColCfg, value: any) => {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[tbl.key]) ? prev[tbl.key] : [];

      const next = cur.map((r: any, i: number) => {
        if (i !== rowIdx) return r;
        const draft = { ...(r || {}), [col.key]: value };
        return applyConfiguredRowRules(tbl, draft);
      });

      return { ...prev, [tbl.key]: next };
    });

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      clearMissing(missCell(tbl.key, rowIdx, col.key));
    }
  };

  const totalDocsBytes = useMemo(
    () =>
      Object.values(additionalDocsByField)
        .flat()
        .reduce((sum, d) => sum + (d.file?.size || 0), 0),
    [additionalDocsByField]
  );

  const totalPhotosBytes = useMemo(
    () =>
      Object.values(photosByField)
        .flat()
        .reduce((sum, p) => sum + (p.file?.size || 0), 0),
    [photosByField]
  );

  const totalCombinedMB = useMemo(
    () => (totalDocsBytes + totalPhotosBytes) / (1024 * 1024),
    [totalDocsBytes, totalPhotosBytes]
  );

  const needsCommonConsent = useMemo(() => {
    if (!formConfig?.consent) return false;

    return (formConfig.sections || []).some(
      (sec) =>
        meets(answers, sec.visible_if) &&
        (sec.fields || []).some((f) => meets(answers, f.visible_if) && f.consent_required)
    );
  }, [formConfig, answers]);

  const makeLocalId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const getDocsMB = (items: AdditionalDocItem[]) =>
    items.reduce((sum, d) => sum + (d.file?.size || 0), 0) / (1024 * 1024);

  const statusChipHiddenSx = () => ({ display: "none" });

  const gridPrimaryBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    px: 1.8,
    py: 0.7,
    background: color_secondary,
    color: color_white,
    "&:hover": { background: color_secondary_dark },
  };

  const gridViewBtnSx = {
    textTransform: "none",
    fontWeight: 900,
    borderRadius: "10px",
    px: 1.8,
    py: 0.7,
    background: color_white,
    color: color_text_primary,
    border: `1px solid ${color_border}`,
    "&:hover": { background: color_white_smoke },
  };

  const syncAdditionalDocsAnswer = (fieldKey: string, docs: AdditionalDocItem[]) => {
    setField(
      fieldKey,
      docs.map((d) => ({
        id: d.id,
        name: d.file?.name || "",
        size: d.file?.size || 0,
        type: d.file?.type || "",
        document_type: (d as any).document_type || "",
        document_category: (d as any).document_category || "",
      }))
    );
  };

  const syncPhotosAnswer = (fieldKey: string, items: PhotoItem[]) => {
    setField(
      fieldKey,
      items.map((p) => ({
        id: p.id,
        name: p.file?.name || "",
        size: p.file?.size || 0,
        type: p.file?.type || "",
        comment: p.comment || "",
      }))
    );
  };

  const triggerExistingMedia = useCallback(
    async (mode: "open" | "download", id: number, filename?: string, mime?: string) => {
      if (!id || Number.isNaN(id) || uploadBlobLoading) return;

      setPendingMediaAction({
        mode,
        id,
        filename,
        mime,
      });

      await fetchUploadBlob(undefined, undefined, false, {
        path: id,
        responseType: "blob",
      });
    },
    [fetchUploadBlob, uploadBlobLoading]
  );

  const buildExistingUploadUrl = useCallback(
    (id: number) => `${apiBase}/form/answers/upload/${id}`,
    [apiBase]
  );

  const openExistingPhotoModal = useCallback(
    (fieldKey: string, idx: number) => {
      const items = (existingPhotosByField[fieldKey] || [])
        .map((p) => {
          const id = Number(p.id);
          if (!id || Number.isNaN(id)) return null;

          return {
            id,
            file_name: p.file_name,
            mime_type: p.mime_type || "",
            file_comment: p.file_comment || "",
          } as FormViewerPhoto;
        })
        .filter(Boolean) as FormViewerPhoto[];

      if (!items.length) return;

      const safeIdx = Math.min(Math.max(idx, 0), items.length - 1);
      setExistingPhotoViewerItems(items);
      setExistingPhotoViewerIndex(safeIdx);
      setExistingPhotoViewerOpen(true);
    },
    [existingPhotosByField]
  );

  const openExistingDocModal = useCallback(
    (fieldKey: string, idx: number) => {
      const items = (existingDocsByField[fieldKey] || [])
        .map((d) => {
          const id = Number(d.id);
          if (!id || Number.isNaN(id)) return null;

          return {
            id,
            file_name: d.file_name,
            mime_type: d.mime_type || "",
            file_category: d.file_category || "",
            file_size_bytes: d.file_size_bytes || 0,
          } as FormViewerDoc;
        })
        .filter(Boolean) as FormViewerDoc[];

      if (!items.length) return;

      const safeIdx = Math.min(Math.max(idx, 0), items.length - 1);
      setExistingDocViewerItems(items);
      setExistingDocViewerIndex(safeIdx);
      setExistingDocViewerOpen(true);
    },
    [existingDocsByField]
  );

  const handleDownloadExistingDoc = useCallback(
    async (id: number, filename?: string, mime?: string) => {
      if (!id || Number.isNaN(id)) return;

      await triggerExistingMedia(
        "download",
        id,
        filename || `document_${id}`,
        mime || "application/octet-stream"
      );
    },
    [triggerExistingMedia]
  );

  const handleDownloadExistingPhoto = useCallback(
    async (id: number, filename?: string, mime?: string) => {
      if (!id || Number.isNaN(id)) return;

      await triggerExistingMedia(
        "download",
        id,
        filename || `photo_${id}.jpg`,
        mime || "image/jpeg"
      );
    },
    [triggerExistingMedia]
  );

  const handleAdditionalDocsUpload =
    (fieldKey: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const next = [
        ...(additionalDocsByField[fieldKey] || []),
        ...files.map(
          (file) =>
            ({
              id: makeLocalId(),
              file,
              document_type: "" as any,
              document_category: "" as any,
            }) as AdditionalDocItem
        ),
      ];

      setAdditionalDocsByField((prev) => ({ ...prev, [fieldKey]: next }));
      syncAdditionalDocsAnswer(fieldKey, next);
      e.target.value = "";
    };

  const handleAdditionalDocRemove = (fieldKey: string, id: string) => {
    const next = (additionalDocsByField[fieldKey] || []).filter((d) => d.id !== id);
    setAdditionalDocsByField((prev) => ({ ...prev, [fieldKey]: next }));
    syncAdditionalDocsAnswer(fieldKey, next);
  };

  const handleAdditionalDocCategory = (fieldKey: string, id: string, category: string) => {
    const next = (additionalDocsByField[fieldKey] || []).map((d) =>
      d.id === id
        ? ({
            ...d,
            document_category: category as any,
            document_type: category as any,
          } as AdditionalDocItem)
        : d
    );
    setAdditionalDocsByField((prev) => ({ ...prev, [fieldKey]: next }));
    syncAdditionalDocsAnswer(fieldKey, next);
  };

  const handlePhotosUpload = (fieldKey: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;

    const next = [
      ...(photosByField[fieldKey] || []),
      ...files.map((file) => ({
        id: makeLocalId(),
        file,
        comment: "",
      })),
    ];

    setPhotosByField((prev) => ({ ...prev, [fieldKey]: next }));
    syncPhotosAnswer(fieldKey, next);
    e.target.value = "";
  };

  const handlePhotoRemove = (fieldKey: string, idx: number) => {
    const next = (photosByField[fieldKey] || []).filter((_, i) => i !== idx);
    setPhotosByField((prev) => ({ ...prev, [fieldKey]: next }));
    syncPhotosAnswer(fieldKey, next);
  };

  const handlePhotosChange = (fieldKey: string, next: PhotoItem[]) => {
    setPhotosByField((prev) => ({ ...prev, [fieldKey]: next }));
    syncPhotosAnswer(fieldKey, next);
  };

  const addRow = (tbl: TableCfg) => {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[tbl.key]) ? prev[tbl.key] : [];
      const newRow = applyConfiguredRowRules(tbl, emptyRowFromColumns(tbl.columns));
      return { ...prev, [tbl.key]: [...cur, newRow] };
    });
  };

  const removeRow = (tbl: TableCfg, idx: number) => {
    const minRows = Math.max(0, tbl.min_rows ?? 0);
    setAnswers((prev) => {
      const cur = Array.isArray(prev[tbl.key]) ? prev[tbl.key] : [];
      const next = cur.filter((_: any, i: number) => i !== idx);
      while (next.length < minRows) next.push(emptyRowFromColumns(tbl.columns));
      return { ...prev, [tbl.key]: next };
    });
  };

  const fileToDataURL = (fileObj: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error(`Failed to read file: ${fileObj.name}`));
        }
      };

      reader.onerror = () => reject(new Error(`Failed to read file: ${fileObj.name}`));
      reader.readAsDataURL(fileObj);
    });

  const buildDetailsPayload = () => {
    if (!formConfig) return [];

    const details: Array<{
      detail_key: string;
      detail_label: string;
      field_type: string;
      consent_required: boolean;
      value: any;
    }> = [];

    (formConfig.sections || []).forEach((sec) => {
      if (!meets(answers, sec.visible_if)) return;

      (sec.fields || []).forEach((f) => {
        if (!meets(answers, f.visible_if)) return;

        let value: any = answers?.[f.key] ?? null;

        if (f.type === "doc_upload" || f.type === "photo_upload") {
          value = null;
        }

        details.push({
          detail_key: f.key,
          detail_label: String(f.label || f.display_name || f.name || f.key),
          field_type: f.type,
          consent_required: Boolean(f.consent_required),
          value,
        });
      });

      (sec.tables || []).forEach((tbl) => {
        if (!meets(answers, tbl.visible_if)) return;

        details.push({
          detail_key: tbl.key,
          detail_label: String(tbl.title || sec.title || tbl.key),
          field_type: "table",
          consent_required: false,
          value: Array.isArray(answers?.[tbl.key]) ? answers[tbl.key] : [],
        });
      });
    });

    return details;
  };

  const buildDocumentsPayload = async () => {
    return Promise.all(
      Object.entries(additionalDocsByField).flatMap(([fieldKey, items]) =>
        items.map(async (d) => ({
          detail_key: fieldKey,
          file_name: d.file?.name || "",
          mime_type: d.file?.type || "",
          file_size_bytes: d.file?.size || 0,
          file_url: "",
          file_category: (d as any).document_category || (d as any).document_type || "",
          data_base64: d.file ? await fileToDataURL(d.file) : "",
          is_existing: false,
        }))
      )
    );
  };

  const buildPhotosPayload = async () => {
    return Promise.all(
      Object.entries(photosByField).flatMap(([fieldKey, items]) =>
        items.map(async (p) => ({
          detail_key: fieldKey,
          file_name: p.file?.name || "",
          mime_type: p.file?.type || "",
          file_size_bytes: p.file?.size || 0,
          file_url: "",
          file_comment: p.comment || "",
          data_base64: p.file ? await fileToDataURL(p.file) : "",
          is_existing: false,
        }))
      )
    );
  };

  const validate = () => {
    if (!formConfig) return true;

    const missing = new Set<string>();

    for (const sec of formConfig.sections || []) {
      if (!meets(answers, sec.visible_if)) continue;

      for (const f of sec.fields || []) {
        if (!meets(answers, f.visible_if)) continue;

        const req = isRequired(answers, f);
        if (!req) continue;

        const v = answers?.[f.key];

        if (f.type === "checkbox") {
          if (v === undefined || v === null || String(v).trim() === "") {
            missing.add(missField(f.key));
          }
          continue;
        }

        if (f.type === "doc_upload") {
          const count =
            (additionalDocsByField[f.key]?.length || 0) +
            (existingDocsByField[f.key]?.length || 0);
          if (count <= 0) {
            missing.add(missField(f.key));
          }
          continue;
        }

        if (f.type === "photo_upload") {
          const count =
            (photosByField[f.key]?.length || 0) +
            (existingPhotosByField[f.key]?.length || 0);
          if (count <= 0) {
            missing.add(missField(f.key));
          }
          continue;
        }

        if (v === undefined || v === null || String(v).trim() === "") {
          missing.add(missField(f.key));
        }
      }

      for (const t of sec.tables || []) {
        if (!meets(answers, t.visible_if)) continue;

        const rows = Array.isArray(answers[t.key]) ? answers[t.key] : [];
        const leaf = flattenCols(t.columns);

        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const r = rows[rIdx] || {};
          for (const c of leaf) {
            if (!c.required) continue;
            const v = r?.[c.key];
            if (v === undefined || v === null || String(v).trim() === "") {
              missing.add(missCell(t.key, rIdx, c.key));
            }
          }
        }
      }
    }

    if (missing.size > 0) {
      setMissingKeys(missing);
      toast.error("Please fill all required fields.");
      return false;
    }

    setMissingKeys(new Set());
    return true;
  };

  const renderExistingDocumentsGrid = useCallback(
    (fieldKey: string) => {
      const items = existingDocsByField[fieldKey] || [];
      if (!items.length) return null;

      const documents = items
        .map((d) => {
          const id = Number(d.id);
          if (!id || Number.isNaN(id)) return null;

          return {
            id,
            file_name: d.file_name,
            filename: d.file_name,
            mime_type: d.mime_type || "",
            size_bytes: d.file_size_bytes || 0,
            document_category: d.file_category || "",
            status: "approved",
          };
        })
        .filter(Boolean) as any[];

      if (!documents.length) return null;

      return (
        <DocumentGrid
          title="Previously Uploaded Documents"
          loading={false}
          emptyText="No documents submitted."
          documents={documents}
          showCategoryChip={true}
          showSizeChip={true}
          showViewButton={true}
          showDownload={true}
          showApproveReject={false}
          onOpenViewer={(idx: any) => openExistingDocModal(fieldKey, Number(idx))}
          onDownloadSingle={(id: any, filename: any, mime: any) =>
            void handleDownloadExistingDoc(Number(id), filename, mime)
          }
          statusLabel={() => ""}
          statusChipSx={statusChipHiddenSx}
          primaryBtnSx={gridPrimaryBtnSx}
          viewBtnSx={gridViewBtnSx}
        />
      );
    },
    [existingDocsByField, openExistingDocModal, handleDownloadExistingDoc]
  );

  const renderExistingPhotosGrid = useCallback(
    (fieldKey: string) => {
      const items = existingPhotosByField[fieldKey] || [];
      if (!items.length) return null;

      const photos = items
        .map((p) => {
          const id = Number(p.id);
          if (!id || Number.isNaN(id)) return null;

          return {
            id,
            status: "approved",
            photo_comment: p.file_comment || "",
          };
        })
        .filter(Boolean) as any[];

      if (!photos.length) return null;

      return (
        <PhotoGrid
          title="Previously Uploaded Photos"
          loading={false}
          emptyText="No photos submitted."
          photos={photos}
          getPhotoUrl={(id: number) => `${apiBase}/form/answers/upload/${id}`}
          onOpenViewer={(idx: any) => openExistingPhotoModal(fieldKey, Number(idx))}
          showDownload={true}
          onDownloadSingle={(id: any) =>
            void handleDownloadExistingPhoto(Number(id), `photo_${id}.jpg`)
          }
          statusLabel={() => ""}
          statusChipSx={statusChipHiddenSx}
          primaryBtnSx={gridPrimaryBtnSx}
        />
      );
    },
    [existingPhotosByField, apiBase, openExistingPhotoModal, handleDownloadExistingPhoto]
  );

  const handleSave = async () => {
    if (!formConfig) return;

    if (needsCommonConsent && !consentGiven) {
      toast.error("Please provide consent before submitting.");
      return;
    }

    if (!validate()) return;

    const documents = await buildDocumentsPayload();
    const photos = await buildPhotosPayload();

    const requestBody = {
      file_id: fileId,
      row_id: rowId,
      file_name: String(file?.filename || ""),
      form_key: formKey,
      form_label: String(formConfig?.display_name),
      consent_text: needsCommonConsent ? String(formConfig?.consent || "") : "",
      consent: needsCommonConsent ? consentGiven : false,
      details: buildDetailsPayload(),
      documents,
      photos,
    };

    if (fileId && rowId && formKey) {
      await saveAnswers(requestBody, undefined, false);
    }

    onSaved?.(answers);
  };

  if (!formConfig) return null;

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "14px",
          border: `1px solid ${color_border}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          fontSize: "1.15rem",
          color: color_white,
          background: `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <span>
          {title} - {row?.[addInfoConfig?.firstname] || ""} {row?.[addInfoConfig?.lastname] || ""}
        </span>
        {fetching ? <CircularProgress size={18} sx={{ color: color_white }} /> : null}
      </DialogTitle>

      <DialogContent
        sx={{
          background: color_white_smoke,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          pt: 2,
        }}
      >
        {(formConfig.sections || []).map((sec) => {
          if (!meets(answers, sec.visible_if)) return null;

          return (
            <Box key={sec.key} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {sec.title ? (
                <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: color_text_primary }}>
                  {sec.title}
                </Typography>
              ) : null}

              {(sec.fields || []).map((f: any) => {
                if (!meets(answers, f.visible_if)) return null;

                const req = isRequired(answers, f);
                const val = answers?.[f.key] ?? "";
                const isMissing = missingKeys.has(missField(f.key));

                return (
                  <ConfigFormFieldRenderer
                    key={f.key}
                    field={f}
                    formConsentText={formConfig?.consent}
                    editable={editable}
                    value={val}
                    required={req}
                    isMissing={isMissing}
                    consentGiven={consentGiven}
                    setConsentGiven={setConsentGiven}
                    additionalDocs={additionalDocsByField[f.key] || []}
                    photos={photosByField[f.key] || []}
                    totalCombinedMB={totalCombinedMB}
                    onSetField={setField}
                    onDocsUpload={handleAdditionalDocsUpload(f.key)}
                    onDocRemove={(id) => handleAdditionalDocRemove(f.key, id)}
                    onDocCategory={(id, cat) => handleAdditionalDocCategory(f.key, id, cat)}
                    onPhotosUpload={handlePhotosUpload(f.key)}
                    onPhotoRemove={(idx) => handlePhotoRemove(f.key, idx)}
                    onPhotosChange={(next) => handlePhotosChange(f.key, next)}
                    getDocsMB={getDocsMB}
                    renderExistingDocumentsGrid={renderExistingDocumentsGrid}
                    renderExistingPhotosGrid={renderExistingPhotosGrid}
                  />
                );
              })}

              {(sec.tables || []).map((tbl) => {
                if (!meets(answers, tbl.visible_if)) return null;

                return (
                  <ConfigFormTableSection
                    key={tbl.key}
                    tbl={tbl}
                    sectionTitle={sec.title}
                    rows={Array.isArray(answers[tbl.key]) ? answers[tbl.key] : []}
                    editable={editable}
                    missingKeys={missingKeys}
                    lookupOptionsByPath={lookupOptionsByPath}
                    lookupLoadingByPath={lookupLoadingByPath}
                    lookupErrorsByPath={lookupErrorsByPath}
                    getLookupPathForColumn={getLookupPathForColumn}
                    getSelectedLookupOption={getSelectedLookupOption}
                    setConfiguredCell={setConfiguredCell}
                    addRow={addRow}
                    removeRow={removeRow}
                  />
                );
              })}

              <Divider sx={{ mt: 1.5, borderColor: color_border }} />
            </Box>
          );
        })}

        {needsCommonConsent ? (
          <Box
            sx={{
              mt: 0.5,
              p: 1.5,
              borderRadius: "12px",
              border: `1px solid ${color_border}`,
              background: color_white,
              display: "flex",
              gap: 1.25,
              alignItems: "flex-start",
            }}
          >
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              style={{ transform: "scale(1.4)", marginTop: 4 }}
            />
            <Box sx={{ color: color_text_primary, fontSize: "0.98rem", fontWeight: 800 }}>
              {formConfig?.consent}
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          background: color_white,
          borderTop: `1px solid ${color_border}`,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 3,
            py: 1.1,
            background: color_white,
            border: `1px solid ${color_border}`,
            color: color_text_primary,
            "&:hover": { background: color_white_smoke },
            "&:focus-visible": {
              outline: `3px solid ${color_focus_ring}`,
              outlineOffset: "2px",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 3.2,
            py: 1.1,
            background: color_secondary,
            color: color_white,
            boxShadow: shadow_auth_button,
            "&:hover": { background: color_secondary_dark },
            "&:focus-visible": {
              outline: `3px solid ${color_focus_ring}`,
              outlineOffset: "2px",
            },
          }}
        >
          {saving ? "Saving..." : "Submit"}
        </Button>
      </DialogActions>

      <FormPhotoViewerModal
        open={existingPhotoViewerOpen}
        onClose={() => setExistingPhotoViewerOpen(false)}
        photos={existingPhotoViewerItems}
        startIndex={existingPhotoViewerIndex}
        title="Uploaded Photos"
        getPhotoUrl={(photo) => buildExistingUploadUrl(photo.id)}
        onDownload={(photo) =>
          void handleDownloadExistingPhoto(
            Number(photo.id),
            photo.file_name || `photo_${photo.id}.jpg`
          )
        }
        showDownloadButton={true}
        showApproveReject={false}
        showCommentsPanel={true}
        showStatusPill={false}
        showThumbnails={true}
      />

      <FormDocumentViewerModal
        open={existingDocViewerOpen}
        onClose={() => setExistingDocViewerOpen(false)}
        docs={existingDocViewerItems}
        startIndex={existingDocViewerIndex}
        title="Uploaded Documents"
        apiBase={apiBase}
        blobEndpointPath="/form/answers/upload"
        onOpen={(doc) =>
          window.open(`${apiBase}/form/answers/upload/${doc.id}`, "_blank", "noopener,noreferrer")
        }
        onDownload={(doc) =>
          void handleDownloadExistingDoc(
            Number(doc.id),
            doc.file_name || `document_${doc.id}`,
            doc.mime_type || "application/octet-stream"
          )
        }
        showOpenButton={true}
        showDownloadButton={true}
        showApproveReject={false}
        showBottomBar={true}
        showPrevNext={true}
        showBottomOpenButton={true}
        bottomOpenLabel="View"
      />
    </Dialog>
  );
}