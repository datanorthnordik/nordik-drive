'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import useFetch from "../../../hooks/useFetch";
import {
  FORM_SUBMISSION_GUARD_CHECKING_MESSAGE,
  FORM_SUBMISSION_GUARD_LOOKUP_ERROR_MESSAGE,
} from "../../../constants/constants";

import { AdditionalDocItem } from "../../datatable/add-info-dialog/types";
import { PhotoItem } from "../../datatable/add-info-dialog/PhotoUploadCard";
import { DocumentGrid } from "../../shared/DocumentGrids";
import { PhotoGrid } from "../../shared/PhotoGrids";

import ConfigFormGuardNotice from "./ConfigFormGuardNotice";
import ConfigFormModalActions from "./ConfigFormModalActions";
import FormPhotoViewerModal, { FormViewerPhoto } from "./FormPhotoViewerModal";
import FormDocumentViewerModal, { FormViewerDoc } from "./FormDocumentViewerModal";
import ConfigFormFieldRenderer from "./ConfigFormFieldRenderer";
import ConfigFormTableSection from "./ConfigFormTable";
import useConfigFormLookups from "./hooks/useConfigFormLookups";
import useConfigFormSubmissionGuard from "./hooks/useConfigFormSubmissionGuard";

import {
  color_border,
  color_primary,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
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

type ReviewUiAction = "approved" | "rejected" | "moreInfo";
type UploadReviewStatus = "approved" | "rejected" | "pending";

type UploadReviewDraft = {
  status: UploadReviewStatus;
  reviewer_comment: string;
};

type PendingAction =
  | null
  | { type: "save" }
  | {
      type: "review";
      reviewBody: {
        submission_id: number;
        submission_review: {
          status: string;
          reviewer_comment: string;
        };
        upload_reviews: {
          upload_id: number;
          status: string;
          reviewer_comment: string;
        }[];
      };
    };

type RequestPhase = "idle" | "starting" | "waiting";

const GRID_PRIMARY_BTN_SX = {
  textTransform: "none",
  fontWeight: 900,
  borderRadius: "10px",
  px: 1.8,
  py: 0.7,
  background: color_secondary,
  color: color_white,
  "&:hover": { background: color_secondary_dark },
};

const GRID_VIEW_BTN_SX = {
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

const GRID_APPROVE_BTN_SX = {
  textTransform: "none",
  fontWeight: 900,
  borderRadius: "10px",
  background: color_secondary,
  color: color_white,
  "&:hover": { background: color_secondary_dark },
};

const GRID_REJECT_BTN_SX = {
  textTransform: "none",
  fontWeight: 900,
  borderRadius: "10px",
  background: color_primary,
  color: color_white,
  "&:hover": { background: color_primary },
};

type Props = {
  open: boolean;
  onClose: () => void;

  row: any;
  file: any;
  formConfig: FormCfg | null;

  apiBase: string;
  fetchPath?: string;
  savePath?: string;
  fetchSubmissionId?: number | string | null;

  onSaved?: (answers: Record<string, any>) => void;
  addInfoConfig?: any;

  isEditable?: boolean;

  review?: boolean;
  reviewPath?: string;
  reviewStatuses?: {
    approved: string;
    rejected: string;
    moreInfo: string;
  };
  showUploadReviewerComments?: boolean;
  requestGuardEnabled?: boolean;
  currentUserEmail?: string | null;
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
  fetchSubmissionId = null,
  onSaved,
  addInfoConfig,
  isEditable = true,
  review = false,
  reviewPath = "/form/answers/review",
  reviewStatuses,
  showUploadReviewerComments = false,
  requestGuardEnabled = false,
  currentUserEmail = null,
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
  const [existingPhotoViewerFieldKey, setExistingPhotoViewerFieldKey] = useState("");

  const [existingDocViewerOpen, setExistingDocViewerOpen] = useState(false);
  const [existingDocViewerIndex, setExistingDocViewerIndex] = useState(0);
  const [existingDocViewerFieldKey, setExistingDocViewerFieldKey] = useState("");

  const [submissionID, setSubmissionID] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");

  const [uploadReviewDrafts, setUploadReviewDrafts] = useState<Record<number, UploadReviewDraft>>(
    {}
  );

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [savePhase, setSavePhase] = useState<RequestPhase>("idle");
  const [reviewPhase, setReviewPhase] = useState<RequestPhase>("idle");

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
  const formName = useMemo(() => (formConfig?.display_name ? String(formConfig.display_name) : ""), [formConfig]);
  const guardManagedView = requestGuardEnabled && !review;
  const resolvedFetchSubmissionId = useMemo(() => {
    if (fetchSubmissionId === null || fetchSubmissionId === undefined) return null;

    const nextId = String(fetchSubmissionId).trim();
    return nextId ? nextId : null;
  }, [fetchSubmissionId]);
  const effectiveFetchPath = useMemo(() => {
    if (guardManagedView && !resolvedFetchSubmissionId) {
      return "/form/answers/active";
    }

    return fetchPath;
  }, [guardManagedView, resolvedFetchSubmissionId, fetchPath]);

  const {
    data: fetchDataRes,
    error: fetchErr,
    loading: fetching,
    fetchData: fetchAnswers,
  } = useFetch(`${apiBase}${effectiveFetchPath}`, "GET", false);

  const {
    error: saveErr,
    loading: saving,
    fetchData: saveAnswers,
  } = useFetch(`${apiBase}${savePath}`, "POST", false);

  const {
    error: reviewErr,
    loading: reviewing,
    fetchData: submitReview,
  } = useFetch(`${apiBase}${reviewPath}`, "POST", false);

  const {
    data: uploadBlobData,
    fetchData: fetchUploadBlob,
    loading: uploadBlobLoading,
    error: uploadBlobError,
  } = useFetch<any>(`${apiBase}/form/answers/upload`, "GET", false);

  const title = formConfig?.display_name || formConfig?.name || "Form";
  const firstNameFieldKey =
    typeof addInfoConfig?.firstname === "string" ? addInfoConfig.firstname : "";
  const lastNameFieldKey =
    typeof addInfoConfig?.lastname === "string" ? addInfoConfig.lastname : "";

  const currentFirstName = useMemo(() => {
    if (firstNameFieldKey) {
      const value = answers?.[firstNameFieldKey] ?? row?.[firstNameFieldKey];
      return String(value || "").trim();
    }
    return String(row?.first_name || "").trim();
  }, [answers, row, firstNameFieldKey]);

  const currentLastName = useMemo(() => {
    if (lastNameFieldKey) {
      const value = answers?.[lastNameFieldKey] ?? row?.[lastNameFieldKey];
      return String(value || "").trim();
    }
    return String(row?.last_name || "").trim();
  }, [answers, row, lastNameFieldKey]);

  const subjectDisplayName = useMemo(
    () => [currentFirstName, currentLastName].filter(Boolean).join(" ").trim(),
    [currentFirstName, currentLastName]
  );

  const guardedFormLabel = title || formKey || "form";
  const isProcessing = saving || reviewing || savePhase !== "idle" || reviewPhase !== "idle";

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

  const normalizeUploadStatus = useCallback((value: any): UploadReviewStatus => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "approved") return "approved";
    if (normalized === "rejected") return "rejected";
    return "pending";
  }, []);

  const reviewStatusToApiStatus = useCallback(
    (status: UploadReviewStatus) => {
      if (status === "approved") return reviewStatuses?.approved || "approved";
      if (status === "rejected") return reviewStatuses?.rejected || "rejected";
      return "";
    },
    [reviewStatuses]
  );

  const uiActionToApiStatus = useCallback(
    (action: ReviewUiAction) => {
      if (!reviewStatuses) return "";
      if (action === "approved") return reviewStatuses.approved;
      if (action === "rejected") return reviewStatuses.rejected;
      return reviewStatuses.moreInfo;
    },
    [reviewStatuses]
  );

  const getUploadReviewDraft = useCallback(
    (uploadId: number): UploadReviewDraft => {
      return uploadReviewDrafts[uploadId] || { status: "pending", reviewer_comment: "" };
    },
    [uploadReviewDrafts]
  );

  const setUploadReviewStatus = useCallback((uploadId: number, status: UploadReviewStatus) => {
    setUploadReviewDrafts((prev) => ({
      ...prev,
      [uploadId]: {
        ...(prev[uploadId] || { reviewer_comment: "" }),
        status,
      },
    }));
  }, []);

  const setUploadReviewerComment = useCallback((uploadId: number, value: string) => {
    setUploadReviewDrafts((prev) => ({
      ...prev,
      [uploadId]: {
        ...(prev[uploadId] || { status: "pending" }),
        reviewer_comment: value,
      },
    }));
  }, []);

  const existingPhotoViewerItems = useMemo<FormViewerPhoto[]>(() => {
    const items = existingPhotosByField[existingPhotoViewerFieldKey] || [];
    return items
      .map((p) => {
        const id = Number(p.id);
        if (!id || Number.isNaN(id)) return null;
        const draft = getUploadReviewDraft(id);
        return {
          id,
          file_name: p.file_name,
          mime_type: p.mime_type || "",
          file_comment: p.file_comment || "",
          reviewer_comment: draft.reviewer_comment || "",
          status: draft.status,
        } as FormViewerPhoto;
      })
      .filter(Boolean) as FormViewerPhoto[];
  }, [existingPhotosByField, existingPhotoViewerFieldKey, getUploadReviewDraft]);

  const existingDocViewerItems = useMemo<FormViewerDoc[]>(() => {
    const items = existingDocsByField[existingDocViewerFieldKey] || [];
    return items
      .map((d) => {
        const id = Number(d.id);
        if (!id || Number.isNaN(id)) return null;
        const draft = getUploadReviewDraft(id);
        return {
          id,
          file_name: d.file_name,
          mime_type: d.mime_type || "",
          file_category: d.file_category || "",
          file_size_bytes: d.file_size_bytes || 0,
          reviewer_comment: draft.reviewer_comment || "",
          status: draft.status,
        } as FormViewerDoc;
      })
      .filter(Boolean) as FormViewerDoc[];
  }, [existingDocsByField, existingDocViewerFieldKey, getUploadReviewDraft]);

  const resetDraftToEmpty = useCallback(() => {
    let next: Record<string, any> = {};

    formConfig?.sections?.forEach((sec) => {
      (sec.tables || []).forEach((t) => {
        next = normalizeTable(next, t);
      });
    });

    setAnswers(next);
    setAdditionalDocsByField({});
    setPhotosByField({});
    setExistingDocsByField({});
    setExistingPhotosByField({});
    setUploadReviewDrafts({});
    setMissingKeys(new Set());
    setConsentGiven(false);
    setSubmissionID(0);
    setReviewComment("");
    setExistingPhotoViewerOpen(false);
    setExistingPhotoViewerIndex(0);
    setExistingPhotoViewerFieldKey("");
    setExistingDocViewerOpen(false);
    setExistingDocViewerIndex(0);
    setExistingDocViewerFieldKey("");
  }, [formConfig]);

  const {
    submissionGuard,
    guardAccessMode,
    submissionSearchLoading,
    submissionSearchErr,
  } = useConfigFormSubmissionGuard({
    apiBase,
    requestGuardEnabled,
    review,
    open,
    fileId,
    rowId,
    formKey,
    formName,
    currentUserEmail,
    guardedFormLabel,
    subjectDisplayName,
    onBlockedView: onClose,
    onPrepareNewRequest: resetDraftToEmpty,
  });

  const approvedGuardActive = requestGuardEnabled && submissionGuard.kind === "approved";
  const otherUserGuardActive =
    requestGuardEnabled && submissionGuard.kind === "other-user-active";
  const editable =
    isEditable && formConfig?.editable !== false && !approvedGuardActive && !otherUserGuardActive;
  const saveGuardBusy = requestGuardEnabled && !review && submissionSearchLoading;
  const guardCheckPending = guardManagedView && guardAccessMode === "checking";

  useEffect(() => {
    if (!open) return;
    setMissingKeys(new Set());
  }, [open]);

  useEffect(() => {
    if (!open || !formConfig) return;

    const identity = `${resolvedFetchSubmissionId || ""}:${fileId || ""}:${rowId || ""}:${formKey}`;
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
      setSubmissionID(0);
      setReviewComment("");
      setUploadReviewDrafts({});
      setPendingAction(null);
      setSavePhase("idle");
      setReviewPhase("idle");
      setExistingPhotoViewerOpen(false);
      setExistingDocViewerOpen(false);
      setExistingPhotoViewerFieldKey("");
      setExistingDocViewerFieldKey("");
      resetLookupState();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    resolvedFetchSubmissionId,
    fileId,
    rowId,
    formKey,
    formConfig,
    guardManagedView,
    resetLookupState,
  ]);

  useEffect(() => {
    const fetchQueryParams = resolvedFetchSubmissionId
      ? { id: resolvedFetchSubmissionId }
      : fileId && rowId && formKey
        ? {
            file_id: fileId,
            row_id: rowId,
            form_key: formKey,
          }
        : null;

    if (!open || !fetchQueryParams) return;
    if (guardManagedView && guardAccessMode !== "load-existing") return;
    if (guardManagedView && submissionSearchErr) return;

    fetchAnswers(undefined, fetchQueryParams, false);
  }, [
    open,
    resolvedFetchSubmissionId,
    fileId,
    rowId,
    formKey,
    guardManagedView,
    guardAccessMode,
    submissionSearchErr,
    fetchAnswers,
  ]);

  useEffect(() => {
    if (guardManagedView && guardAccessMode !== "load-existing") return;
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
    const photosMap: Record<string, ExistingPhotoItem[]> = {};
    const draftMap: Record<number, UploadReviewDraft> = {};

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

      const uploadId = Number(d?.id || 0);
      if (uploadId > 0) {
        draftMap[uploadId] = {
          status: normalizeUploadStatus(d?.status),
          reviewer_comment: String(d?.reviewer_comment || ""),
        };
      }
    });

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
        original_file_comment: p?.file_comment || p?.doc_comment || "",
      });

      const uploadId = Number(p?.id || 0);
      if (uploadId > 0) {
        draftMap[uploadId] = {
          status: normalizeUploadStatus(p?.status),
          reviewer_comment: String(p?.reviewer_comment || ""),
        };
      }
    });

    setAnswers(next);
    setExistingDocsByField(docsMap);
    setExistingPhotosByField(photosMap);
    setUploadReviewDrafts(draftMap);
    setMissingKeys(new Set());
    setConsentGiven(
      Boolean(root?.consent ?? root?.consent_given ?? next?.consent ?? next?.archive_consent)
    );
    setSubmissionID(Number(root?.id || 0));
    setReviewComment(String(root?.reviewer_comment || ""));
  }, [fetchDataRes, formConfig, guardManagedView, guardAccessMode, normalizeUploadStatus]);

  useEffect(() => {
    if (fetchErr) toast.error(fetchErr);
  }, [fetchErr]);

  useEffect(() => {
    if (saveErr) toast.error(saveErr);
  }, [saveErr]);

  useEffect(() => {
    if (reviewErr) toast.error(reviewErr);
  }, [reviewErr]);

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

  useEffect(() => {
    if (savePhase === "starting" && saving) {
      setSavePhase("waiting");
    }
  }, [savePhase, saving]);

  useEffect(() => {
    if (reviewPhase === "starting" && reviewing) {
      setReviewPhase("waiting");
    }
  }, [reviewPhase, reviewing]);

  useEffect(() => {
    if (savePhase !== "waiting" || saving) return;

    if (saveErr) {
      setSavePhase("idle");
      setReviewPhase("idle");
      setPendingAction(null);
      return;
    }

    if (pendingAction?.type === "review") {
      setSavePhase("idle");
      setReviewPhase("starting");
      void submitReview(pendingAction.reviewBody, undefined, false);
      return;
    }

    toast.success(`${formConfig?.display_name} details updated successfully`);
    onSaved?.(answers);
    setSavePhase("idle");
    setPendingAction(null);
    onClose();
  }, [
    savePhase,
    saving,
    saveErr,
    pendingAction,
    submitReview,
    formConfig,
    answers,
    onSaved,
    onClose,
  ]);

  useEffect(() => {
    if (reviewPhase !== "waiting" || reviewing) return;

    if (reviewErr) {
      setReviewPhase("idle");
      setPendingAction(null);
      return;
    }

    toast.success("Review submitted successfully");
    onSaved?.(answers);
    setReviewPhase("idle");
    setPendingAction(null);
    onClose();
  }, [reviewPhase, reviewing, reviewErr, answers, onSaved, onClose]);

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

  const needsConsent = useMemo(() => {
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
      const items = existingPhotosByField[fieldKey] || [];
      if (!items.length) return;
      const safeIdx = Math.min(Math.max(idx, 0), items.length - 1);
      setExistingPhotoViewerFieldKey(fieldKey);
      setExistingPhotoViewerIndex(safeIdx);
      setExistingPhotoViewerOpen(true);
    },
    [existingPhotosByField]
  );

  const openExistingDocModal = useCallback(
    (fieldKey: string, idx: number) => {
      const items = existingDocsByField[fieldKey] || [];
      if (!items.length) return;
      const safeIdx = Math.min(Math.max(idx, 0), items.length - 1);
      setExistingDocViewerFieldKey(fieldKey);
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

  const handleExistingPhotoCommentChange = useCallback(
    (fieldKey: string, id: number, value: string) => {
      setExistingPhotosByField((prev) => ({
        ...prev,
        [fieldKey]: (prev[fieldKey] || []).map((photo) =>
          Number(photo.id) === id ? { ...photo, file_comment: value } : photo
        ),
      }));
    },
    []
  );

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
    const newPhotos = await Promise.all(
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

    const existingPhotos = Object.entries(existingPhotosByField).flatMap(([fieldKey, items]) =>
      items
        .filter((photo) => String(photo.file_comment || "") !== String(photo.original_file_comment || ""))
        .map((photo) => ({
          id: Number(photo.id) || photo.id,
          detail_key: fieldKey,
          file_name: photo.file_name || "",
          mime_type: photo.mime_type || "",
          file_size_bytes: photo.file_size_bytes || 0,
          file_url: photo.file_url || "",
          file_comment: photo.file_comment || "",
          data_base64: "",
          is_existing: true,
        }))
    );

    return [...newPhotos, ...existingPhotos];
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

  const validateReview = (submissionAction: ReviewUiAction) => {
    if (!reviewStatuses) {
      toast.error("Review status configuration is missing.");
      return false;
    }

    if (!submissionID) {
      toast.error("Submission ID not found.");
      return false;
    }

    if ((submissionAction === "rejected" || submissionAction === "moreInfo") && !reviewComment.trim()) {
      toast.error("Review comment is required.");
      return false;
    }

    const hasPendingUploadReview = Object.values(uploadReviewDrafts).some(
      (draft) => draft.status === "pending"
    );

    if (hasPendingUploadReview) {
      toast.error(
        "Please approve or reject all uploaded photos and documents before submitting the review."
      );
      return false;
    }

    for (const [uploadId, draft] of Object.entries(uploadReviewDrafts)) {
      if (draft.status === "rejected" && !draft.reviewer_comment.trim()) {
        toast.error(`Review comment is required for rejected file #${uploadId}.`);
        return false;
      }
    }

    return true;
  };

  const buildSaveRequestBody = async () => {
    const documents = await buildDocumentsPayload();
    const photos = await buildPhotosPayload();

    return {
      file_id: fileId,
      row_id: rowId,
      file_name: String(file?.filename || ""),
      form_key: formKey,
      form_label: String(formConfig?.display_name || ""),
      consent_text: needsConsent ? String(formConfig?.consent || "") : "",
      consent: needsConsent ? consentGiven : false,
      details: buildDetailsPayload(),
      documents,
      photos,
      firstname: row?.[addInfoConfig?.firstname] || "",
      lastname: row?.[addInfoConfig?.lastname] || "",
    };
  };

  const startSaveFlow = async (action: PendingAction) => {
    if (!formConfig) return;
    if (action?.type === "save" && requestGuardEnabled && !review) {
      if (submissionSearchLoading) {
        toast.error(FORM_SUBMISSION_GUARD_CHECKING_MESSAGE);
        return;
      }

      if (submissionSearchErr) {
        toast.error(FORM_SUBMISSION_GUARD_LOOKUP_ERROR_MESSAGE);
        return;
      }

      if (submissionGuard.kind !== "none") {
        toast.error(submissionGuard.message);
        return;
      }
    }
    if (action?.type === "save" && !editable) return;
    if (!validate()) return;

    const requestBody = await buildSaveRequestBody();

    if (!fileId || !rowId || !formKey) {
      toast.error("Missing file, row, or form identity.");
      return;
    }

    setPendingAction(action);
    setSavePhase("starting");
    setReviewPhase("idle");

    await saveAnswers(requestBody, undefined, false);
  };

  const handleSave = async () => {
    await startSaveFlow({ type: "save" });
  };

  const handleReviewAction = async (submissionAction: ReviewUiAction) => {
    if (!validateReview(submissionAction)) return;

    const upload_reviews = Object.entries(uploadReviewDrafts)
      .filter(([, draft]) => draft.status !== "pending")
      .map(([uploadId, draft]) => ({
        upload_id: Number(uploadId),
        status: reviewStatusToApiStatus(draft.status),
        reviewer_comment: draft.reviewer_comment.trim(),
      }));

    const reviewBody = {
      submission_id: submissionID,
      submission_review: {
        status: uiActionToApiStatus(submissionAction),
        reviewer_comment: reviewComment.trim(),
      },
      upload_reviews,
    };

    await startSaveFlow({
      type: "review",
      reviewBody,
    });
  };

  const renderExistingDocumentsGrid = useCallback(
    (fieldKey: string) => {
      const items = existingDocsByField[fieldKey] || [];
      if (!items.length) return null;

      const documents = items
        .map((d) => {
          const id = Number(d.id);
          if (!id || Number.isNaN(id)) return null;
          const draft = getUploadReviewDraft(id);

          return {
            id,
            file_name: d.file_name,
            filename: d.file_name,
            mime_type: d.mime_type || "",
            size_bytes: d.file_size_bytes || 0,
            document_category: d.file_category || "",
            status: draft.status,
            reviewer_comment: draft.reviewer_comment || "",
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
          onOpenViewer={(idx: any) => openExistingDocModal(fieldKey, Number(idx))}
          onDownloadSingle={(id: any, filename: any, mime: any) =>
            void handleDownloadExistingDoc(Number(id), filename, mime)
          }
          statusLabel={(st) => (st === "approved" ? "Approved" : st === "rejected" ? "Rejected" : "Pending")}
          statusChipSx={ undefined }
          primaryBtnSx={GRID_PRIMARY_BTN_SX}
          viewBtnSx={GRID_VIEW_BTN_SX}
          showApproveReject={review}
          onApprove={(id) => setUploadReviewStatus(Number(id), "approved")}
          onReject={(id) => setUploadReviewStatus(Number(id), "rejected")}
          approveBtnSx={GRID_APPROVE_BTN_SX}
          rejectBtnSx={GRID_REJECT_BTN_SX}
          showReviewerCommentField={review}
          reviewerCommentLabel="Review Comment"
          onReviewerCommentChange={(id:any, value:any) => setUploadReviewerComment(Number(id), value)}
          viewReviewerComment={!review}
          disableReviewerCommentField={!review}
        />
      );
    },
    [
      existingDocsByField,
      getUploadReviewDraft,
      openExistingDocModal,
      handleDownloadExistingDoc,
      review,
      setUploadReviewStatus,
      setUploadReviewerComment,
    ]
  );

  const renderExistingPhotosGrid = useCallback(
    (fieldKey: string) => {
      const items = existingPhotosByField[fieldKey] || [];
      if (!items.length) return null;

      const photos = items
        .map((p) => {
          const id = Number(p.id);
          if (!id || Number.isNaN(id)) return null;
          const draft = getUploadReviewDraft(id);

          return {
            id,
            status: draft.status,
            photo_comment: p.file_comment || "",
            reviewer_comment: draft.reviewer_comment || "",
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
          showStatusChip={true}
          statusLabel={(st) =>  (st === "approved" ? "Approved" : st === "rejected" ? "Rejected" : "Pending") }
          statusChipSx={undefined}
          primaryBtnSx={GRID_PRIMARY_BTN_SX}
          showUploaderCommentField={!review && editable}
          uploaderCommentLabel="Uploader Comment"
          onUploaderCommentChange={(id:any, value:any) =>
            handleExistingPhotoCommentChange(fieldKey, Number(id), value)
          }
          showApproveReject={review}
          onApprove={(id:any) => setUploadReviewStatus(Number(id), "approved")}
          onReject={(id:any) => setUploadReviewStatus(Number(id), "rejected")}
          approveBtnSx={GRID_APPROVE_BTN_SX}
          rejectBtnSx={GRID_REJECT_BTN_SX}
          showReviewerCommentField={review}
          reviewerCommentLabel="Review Comment"
          onReviewerCommentChange={(id:any, value:any) => setUploadReviewerComment(Number(id), value)}
          viewReviewerComment={!review}
          disableReviewerCommentField={!review}
        />
      );
    },
    [
      existingPhotosByField,
      apiBase,
      getUploadReviewDraft,
      openExistingPhotoModal,
      handleDownloadExistingPhoto,
      review,
      editable,
      handleExistingPhotoCommentChange,
      setUploadReviewStatus,
      setUploadReviewerComment,
    ]
  );

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
        {fetching || saveGuardBusy ? <CircularProgress size={18} sx={{ color: color_white }} /> : null}
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
        <ConfigFormGuardNotice
          guardCheckPending={guardCheckPending}
          submissionGuard={submissionGuard}
        />

        {!guardCheckPending && !otherUserGuardActive
          ? (formConfig.sections || []).map((sec) => {
              if (!meets(answers, sec.visible_if)) return null;

              return (
                <Box key={sec.key} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {sec.title ? (
                    <Typography
                      sx={{ fontWeight: 900, fontSize: "1rem", color: color_text_primary }}
                    >
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
            })
          : null}

        {(review || reviewComment.trim()) ? (
          <Box
            sx={{
              mt: 0.5,
              p: 1.5,
              borderRadius: "12px",
              border: `1px solid ${color_border}`,
              background: color_white,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
              Review Comment
            </Typography>

            {review ? (
              <TextField
                fullWidth
                size="small"
                label="Review Comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                multiline
                minRows={3}
                helperText="Required when rejecting or asking for more information."
                disabled={isProcessing}
              />
            ) : (
              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: color_text_secondary,
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                {reviewComment}
              </Typography>
            )}
          </Box>
        ) : null}

        {!review && needsConsent ? (
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
              disabled={!editable || isProcessing}
              style={{ transform: "scale(1.4)", marginTop: 4 }}
            />
            <Box sx={{ color: color_text_primary, fontSize: "0.98rem", fontWeight: 800 }}>
              {formConfig?.consent}
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <ConfigFormModalActions
        review={review}
        editable={editable}
        isProcessing={isProcessing}
        saveGuardBusy={saveGuardBusy}
        onClose={onClose}
        onSave={() => void handleSave()}
        onReviewAction={(action) => void handleReviewAction(action)}
      />

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
        onApprove={review ? (photo) => setUploadReviewStatus(Number(photo.id), "approved") : undefined}
        onReject={review ? (photo) => setUploadReviewStatus(Number(photo.id), "rejected") : undefined}
        onReviewerCommentChange={
          review ? (photo:any, value:any) => setUploadReviewerComment(Number(photo.id), value) : undefined
        }
        showDownloadButton={true}
        showApproveReject={review}
        showCommentsPanel={true}
        showStatusPill={review}
        showThumbnails={true}
        showReviewerCommentField={review}
        viewReviewerComment={showUploadReviewerComments && !review}
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
        onApprove={review ? (doc) => setUploadReviewStatus(Number(doc.id), "approved") : undefined}
        onReject={review ? (doc) => setUploadReviewStatus(Number(doc.id), "rejected") : undefined}
        onReviewerCommentChange={
          review ? (doc, value) => setUploadReviewerComment(Number(doc.id), value) : undefined
        }
        showOpenButton={true}
        showDownloadButton={true}
        showApproveReject={review}
        showBottomBar={true}
        showPrevNext={true}
        showBottomOpenButton={true}
        bottomOpenLabel="View"
        showReviewerCommentField={review}
        viewReviewerComment={showUploadReviewerComments && !review}
      />
    </Dialog>
  );
}
