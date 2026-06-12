import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { apiUrl } from "../config/api";
import { apiRequest } from "../hooks/useFetch";

export type NiaChatExchangeStatus = "pending" | "completed" | "error";

export interface NiaChatExchange {
  id: string;
  fileName: string;
  question: string;
  answer: string;
  status: NiaChatExchangeStatus;
  askedAt: string;
  answeredAt: string | null;
  errorMessage: string | null;
  selectedCommunitiesSnapshot: string[];
}

export interface NiaChatThread {
  fileKey: string;
  fileName: string;
  unreadCount: number;
  lastCompletedExchangeId: string | null;
  isOpen: boolean;
  isMinimized: boolean;
  exchanges: NiaChatExchange[];
}

export interface NiaChatState {
  threads: Record<string, NiaChatThread>;
}

type NiaChatSelectorState = {
  niaChat?: NiaChatState;
};

const initialState: NiaChatState = {
  threads: {},
};

export const getNiaThreadKey = (fileName?: string | null) =>
  String(fileName || "").trim().toLowerCase();

const ensureThread = (state: NiaChatState, fileName: string) => {
  const normalizedFileName = String(fileName || "").trim();
  const fileKey = getNiaThreadKey(normalizedFileName);

  if (!fileKey) return null;

  if (!state.threads[fileKey]) {
    state.threads[fileKey] = {
      fileKey,
      fileName: normalizedFileName,
      unreadCount: 0,
      lastCompletedExchangeId: null,
      isOpen: false,
      isMinimized: false,
      exchanges: [],
    };
  } else if (normalizedFileName) {
    state.threads[fileKey].fileName = normalizedFileName;
  }

  return state.threads[fileKey];
};

const niaChatSlice = createSlice({
  name: "niaChat",
  initialState,
  reducers: {
    addPendingExchange: (
      state,
      action: PayloadAction<{
        id: string;
        fileName: string;
        question: string;
        askedAt: string;
        selectedCommunitiesSnapshot: string[];
      }>
    ) => {
      const thread = ensureThread(state, action.payload.fileName);
      if (!thread) return;

      thread.exchanges.push({
        id: action.payload.id,
        fileName: thread.fileName,
        question: action.payload.question,
        answer: "",
        status: "pending",
        askedAt: action.payload.askedAt,
        answeredAt: null,
        errorMessage: null,
        selectedCommunitiesSnapshot: action.payload.selectedCommunitiesSnapshot,
      });
    },
    resolveExchange: (
      state,
      action: PayloadAction<{
        fileName: string;
        exchangeId: string;
        answer: string;
        answeredAt: string;
      }>
    ) => {
      const thread = ensureThread(state, action.payload.fileName);
      if (!thread) return;

      const exchange = thread.exchanges.find((item) => item.id === action.payload.exchangeId);
      if (!exchange) return;

      exchange.answer = action.payload.answer;
      exchange.status = "completed";
      exchange.answeredAt = action.payload.answeredAt;
      exchange.errorMessage = null;

      thread.lastCompletedExchangeId = exchange.id;

      if (!thread.isOpen || thread.isMinimized) {
        thread.unreadCount += 1;
      }
    },
    failExchange: (
      state,
      action: PayloadAction<{
        fileName: string;
        exchangeId: string;
        errorMessage: string;
        answeredAt: string;
      }>
    ) => {
      const thread = ensureThread(state, action.payload.fileName);
      if (!thread) return;

      const exchange = thread.exchanges.find((item) => item.id === action.payload.exchangeId);
      if (!exchange) return;

      exchange.status = "error";
      exchange.answeredAt = action.payload.answeredAt;
      exchange.errorMessage = action.payload.errorMessage;
    },
    markThreadRead: (state, action: PayloadAction<{ fileName: string }>) => {
      const thread = ensureThread(state, action.payload.fileName);
      if (!thread) return;

      thread.unreadCount = 0;
    },
    setThreadVisibility: (
      state,
      action: PayloadAction<{
        fileName: string;
        isOpen: boolean;
        isMinimized: boolean;
      }>
    ) => {
      const thread = ensureThread(state, action.payload.fileName);
      if (!thread) return;

      thread.isOpen = action.payload.isOpen;
      thread.isMinimized = action.payload.isMinimized;
    },
  },
});

export const {
  addPendingExchange,
  resolveExchange,
  failExchange,
  markThreadRead,
  setThreadVisibility,
} = niaChatSlice.actions;

export const selectNiaThreadByFileName = (
  state: NiaChatSelectorState,
  fileName?: string | null
): NiaChatThread | null =>
  state?.niaChat?.threads?.[getNiaThreadKey(fileName)] || null;

export const selectNiaUnreadCountForFileName = (
  state: NiaChatSelectorState,
  fileName?: string | null
): number =>
  selectNiaThreadByFileName(state, fileName)?.unreadCount || 0;

export const selectHasAnyPendingNia = (state: NiaChatSelectorState): boolean =>
  Object.values(state?.niaChat?.threads || {}).some((thread) =>
    thread.exchanges.some((exchange) => exchange.status === "pending")
  );

export const selectShouldNotifyForFileName = (
  state: NiaChatSelectorState,
  fileName?: string | null
): boolean => {
  const thread = selectNiaThreadByFileName(state, fileName);
  if (!thread) return true;
  return !thread.isOpen || thread.isMinimized;
};

export const submitNiaQuestion =
  ({
    fileName,
    question,
    selectedCommunitiesSnapshot,
    communityFilter,
  }: {
    fileName: string;
    question: string;
    selectedCommunitiesSnapshot: string[];
    communityFilter: boolean;
  }) =>
  async (dispatch: any, getState: () => any) => {
    const trimmedFileName = String(fileName || "").trim();
    const trimmedQuestion = String(question || "").trim();

    if (!trimmedFileName || !trimmedQuestion || selectHasAnyPendingNia(getState())) {
      return null;
    }

    const exchangeId = nanoid();
    const askedAt = new Date().toISOString();

    dispatch(
      addPendingExchange({
        id: exchangeId,
        fileName: trimmedFileName,
        question: trimmedQuestion,
        askedAt,
        selectedCommunitiesSnapshot: selectedCommunitiesSnapshot || [],
      })
    );

    const body = new FormData();
    body.append("filename", trimmedFileName);
    body.append("question", trimmedQuestion);

    if (communityFilter && selectedCommunitiesSnapshot?.length) {
      body.append("communities", selectedCommunitiesSnapshot as any);
    }

    try {
      const token = getState()?.auth?.token || undefined;
      const response = await apiRequest<{ answer?: string }>(
        apiUrl("chat"),
        "POST",
        body,
        {},
        token
      );

      dispatch(
        resolveExchange({
          fileName: trimmedFileName,
          exchangeId,
          answer: String(response?.answer || ""),
          answeredAt: new Date().toISOString(),
        })
      );

      if (selectShouldNotifyForFileName(getState(), trimmedFileName)) {
        toast.success("NIA answer is ready.");
      }

      return exchangeId;
    } catch (err: any) {
      dispatch(
        failExchange({
          fileName: trimmedFileName,
          exchangeId,
          errorMessage: err?.message || "Something went wrong. Please try again later!",
          answeredAt: new Date().toISOString(),
        })
      );
      toast.error("Something went wrong. Please try again later!");
      return null;
    }
  };

export default niaChatSlice.reducer;
