import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

export type BackgroundTaskKind = string;

export interface PendingBackgroundTask {
  id: string;
  kind: BackgroundTaskKind;
  label: string;
  startedAt: string;
}

export interface BackgroundTasksState {
  pending: Record<string, PendingBackgroundTask>;
}

type BackgroundTaskSelectorState = {
  backgroundTasks?: BackgroundTasksState;
};

type BackgroundTaskDispatch = (action: any) => any;
type BackgroundTaskGetState = () => any;

interface BackgroundTaskRunHelpers {
  dispatch: BackgroundTaskDispatch;
  getState: BackgroundTaskGetState;
  taskId: string;
}

type BackgroundTaskMessages<TResult> =
  | string
  | string[]
  | null
  | undefined
  | ((result: TResult) => string | string[] | null | undefined);

interface RunBackgroundTaskOptions<TResult> {
  kind: BackgroundTaskKind;
  label: string;
  request: () => Promise<TResult>;
  getSuccessMessage?: BackgroundTaskMessages<TResult>;
  getErrorMessage?: (error: any) => string;
  onSuccess?: (result: TResult, helpers: BackgroundTaskRunHelpers) => void | Promise<void>;
  onError?: (error: any, helpers: BackgroundTaskRunHelpers) => void | Promise<void>;
}

const initialState: BackgroundTasksState = {
  pending: {},
};

const normalizeMessages = <TResult,>(
  messages: BackgroundTaskMessages<TResult>,
  result: TResult
): string[] => {
  const resolved = typeof messages === "function" ? messages(result) : messages;

  if (!resolved) return [];

  if (Array.isArray(resolved)) {
    return resolved.map((message) => String(message || "").trim()).filter(Boolean);
  }

  const message = String(resolved || "").trim();
  return message ? [message] : [];
};

const backgroundTasksSlice = createSlice({
  name: "backgroundTasks",
  initialState,
  reducers: {
    registerPendingTask: (state, action: PayloadAction<PendingBackgroundTask>) => {
      state.pending[action.payload.id] = action.payload;
    },
    clearPendingTask: (state, action: PayloadAction<{ id: string }>) => {
      delete state.pending[action.payload.id];
    },
  },
});

export const { registerPendingTask, clearPendingTask } = backgroundTasksSlice.actions;

export const selectPendingBackgroundTaskCount = (
  state: BackgroundTaskSelectorState,
  kind?: BackgroundTaskKind
): number =>
  Object.values(state?.backgroundTasks?.pending || {}).filter(
    (task) => !kind || task.kind === kind
  ).length;

export const selectHasPendingBackgroundTaskKind = (
  state: BackgroundTaskSelectorState,
  kind: BackgroundTaskKind
): boolean => selectPendingBackgroundTaskCount(state, kind) > 0;

export const runBackgroundTask =
  <TResult,>(options: RunBackgroundTaskOptions<TResult>) =>
  async (dispatch: BackgroundTaskDispatch, getState: BackgroundTaskGetState) => {
    const taskId = nanoid();

    dispatch(
      registerPendingTask({
        id: taskId,
        kind: options.kind,
        label: String(options.label || "").trim(),
        startedAt: new Date().toISOString(),
      })
    );

    try {
      const result = await options.request();

      dispatch(clearPendingTask({ id: taskId }));

      normalizeMessages(options.getSuccessMessage, result).forEach((message) => {
        toast.success(message);
      });

      if (options.onSuccess) {
        try {
          await options.onSuccess(result, { dispatch, getState, taskId });
        } catch {
          // Keep the original task outcome even if a follow-up side effect fails.
        }
      }

      return result;
    } catch (error: any) {
      dispatch(clearPendingTask({ id: taskId }));

      const errorMessage =
        options.getErrorMessage?.(error) ||
        error?.message ||
        "Something went wrong. Please try again later!";

      toast.error(errorMessage);

      if (options.onError) {
        try {
          await options.onError(error, { dispatch, getState, taskId });
        } catch {
          // Preserve the original failure signal.
        }
      }

      return null;
    }
  };

export default backgroundTasksSlice.reducer;
