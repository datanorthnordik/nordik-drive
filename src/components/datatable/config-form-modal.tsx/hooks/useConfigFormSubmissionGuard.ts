'use client';

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import useFetch from "../../../../hooks/useFetch";
import {
  buildApprovedFormSubmissionGuardMessage,
  buildOtherUserFormSubmissionGuardMessage,
} from "../../../../constants/constants";

export type GuardAccessMode = "checking" | "load-existing" | "create-new" | "blocked";

export type SubmissionSearchItem = {
  id?: number | string | null;
  status?: string;
  submitted_user?: any;
  submitted_user_id?: number | string | null;
  created_by?: any;
  created_by_id?: number | string | null;
  created_by_email?: string | null;
  requested_by?: number | string | null;
  user_id?: number | string | null;
  details?: any[];
  documents?: any[];
  photos?: any[];
  [key: string]: any;
};

export type SubmissionSearchResp = {
  data?: SubmissionSearchItem | null;
};

export type SubmissionGuardState =
  | { kind: "none"; message: "" }
  | { kind: "approved" | "other-user-active"; message: string };

const EMPTY_SUBMISSION_GUARD: SubmissionGuardState = {
  kind: "none",
  message: "",
};

const normalizeSubmissionStatus = (value: any) => String(value || "").trim().toLowerCase();

const extractSubmissionCreatorEmail = (item: SubmissionSearchItem): string | null => {
  const candidates = [
    typeof item?.created_by === "string" ? item.created_by : null,
    item?.created_by?.email,
    item?.created_by_email,
  ];

  for (const candidate of candidates) {
    const emailStr = String(candidate || "").trim().toLowerCase();
    if (emailStr && emailStr !== "null" && emailStr !== "undefined") return emailStr;
  }

  return null;
};

const isSameUser = (
  submissionItem: SubmissionSearchItem,
  currentEmail: string | null | undefined
): boolean => {
  if (!currentEmail) return false;

  const normalizedCurrentEmail = currentEmail.trim().toLowerCase();
  if (!normalizedCurrentEmail) return false;

  const submissionEmail = extractSubmissionCreatorEmail(submissionItem);
  return Boolean(submissionEmail && normalizedCurrentEmail === submissionEmail);
};

const getActiveSubmission = (
  response: SubmissionSearchResp | null | undefined
): SubmissionSearchItem | null => {
  if (!response || typeof response !== "object") {
    return null;
  }

  if (!response.data || typeof response.data !== "object" || Array.isArray(response.data)) {
    return null;
  }

  return response.data;
};

type Params = {
  apiBase: string;
  requestGuardEnabled: boolean;
  review: boolean;
  open: boolean;
  fileId: number | null;
  rowId: number | null;
  formKey: string;
  formName: string;
  currentUserEmail: string | null;
  guardedFormLabel: string;
  subjectDisplayName: string;
  onBlockedView: () => void;
  onPrepareNewRequest: () => void;
};

export default function useConfigFormSubmissionGuard({
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
  onBlockedView,
  onPrepareNewRequest,
}: Params) {
  const guardManagedView = requestGuardEnabled && !review;
  const blockedGuardIdentityRef = useRef("");
  const [submissionGuard, setSubmissionGuard] = useState<SubmissionGuardState>(
    EMPTY_SUBMISSION_GUARD
  );
  const [guardAccessMode, setGuardAccessMode] = useState<GuardAccessMode>(
    guardManagedView ? "checking" : "load-existing"
  );
  const [submissionSearchCompleted, setSubmissionSearchCompleted] = useState(false);

  const {
    data: submissionSearchRes,
    error: submissionSearchErr,
    loading: submissionSearchLoading,
    fetchData: fetchSubmissionMatches,
  } = useFetch<SubmissionSearchResp>(`${apiBase}/form/answers/active`, "GET", false);

  useEffect(() => {
    if (!requestGuardEnabled || review) {
      blockedGuardIdentityRef.current = "";
      setSubmissionGuard(EMPTY_SUBMISSION_GUARD);
      setGuardAccessMode("load-existing");
      setSubmissionSearchCompleted(false);
      return;
    }

    if (!open || !fileId || !rowId || !formKey) {
      blockedGuardIdentityRef.current = "";
      setSubmissionGuard(EMPTY_SUBMISSION_GUARD);
      setGuardAccessMode("create-new");
      setSubmissionSearchCompleted(false);
      return;
    }

    let isActive = true;

    blockedGuardIdentityRef.current = "";
    setGuardAccessMode("checking");
    setSubmissionSearchCompleted(false);

    Promise.resolve(
      fetchSubmissionMatches(
        undefined,
        {
          row_id: rowId,
          file_id: fileId,
          form_key: formKey,
        },
        false
      )
    ).finally(() => {
      if (isActive) {
        setSubmissionSearchCompleted(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    requestGuardEnabled,
    review,
    open,
    fileId,
    rowId,
    formKey,
    fetchSubmissionMatches,
  ]);

  useEffect(() => {
    if (
      !requestGuardEnabled ||
      review ||
      !submissionSearchCompleted ||
      submissionSearchLoading ||
      submissionSearchErr
    ) {
      return;
    }

    const activeSubmission = getActiveSubmission(submissionSearchRes);

    if (!activeSubmission) {
      setSubmissionGuard(EMPTY_SUBMISSION_GUARD);
      onPrepareNewRequest();
      setGuardAccessMode("create-new");
      return;
    }

    if (!isSameUser(activeSubmission, currentUserEmail)) {
      const blockedMessage = buildOtherUserFormSubmissionGuardMessage(formName);

      setSubmissionGuard({
        kind: "other-user-active",
        message: blockedMessage,
      });
      setGuardAccessMode("blocked");

      const blockedIdentity = `${fileId || ""}:${rowId || ""}:${formKey}:${blockedMessage}`;
      if (blockedGuardIdentityRef.current !== blockedIdentity) {
        blockedGuardIdentityRef.current = blockedIdentity;
        toast.error(blockedMessage);
        onBlockedView();
      }
      return;
    }

    if (normalizeSubmissionStatus(activeSubmission?.status) === "approved") {
      setSubmissionGuard({
        kind: "approved",
        message: buildApprovedFormSubmissionGuardMessage(guardedFormLabel, subjectDisplayName),
      });
      setGuardAccessMode("load-existing");
      return;
    }

    setSubmissionGuard(EMPTY_SUBMISSION_GUARD);
    setGuardAccessMode("load-existing");
  }, [
    requestGuardEnabled,
    review,
    submissionSearchCompleted,
    submissionSearchRes,
    submissionSearchLoading,
    submissionSearchErr,
    currentUserEmail,
    guardedFormLabel,
    subjectDisplayName,
    formKey,
    fileId,
    rowId,
    onBlockedView,
    onPrepareNewRequest,
  ]);

  useEffect(() => {
    if (!guardManagedView || !submissionSearchErr) return;
    setSubmissionSearchCompleted(false);
    setGuardAccessMode("load-existing");
  }, [guardManagedView, submissionSearchErr]);

  return {
    submissionGuard,
    guardAccessMode,
    submissionSearchLoading,
    submissionSearchErr,
  };
}
