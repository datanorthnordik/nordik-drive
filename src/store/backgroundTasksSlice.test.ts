import { configureStore } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import backgroundTasksReducer, {
  runBackgroundTask,
  selectPendingBackgroundTaskCount,
} from "./backgroundTasksSlice";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  success: jest.fn(),
  error: jest.fn(),
}));

const deferredResponse = () => {
  let resolve!: (value: any) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const makeStore = () =>
  configureStore({
    reducer: {
      backgroundTasks: backgroundTasksReducer,
    },
  });

describe("backgroundTasksSlice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("tracks pending work until the background task resolves", async () => {
    const store = makeStore();
    const pending = deferredResponse();

    const dispatchPromise = store.dispatch(
      runBackgroundTask({
        kind: "upload",
        label: "Students.csv",
        request: () => pending.promise,
        getSuccessMessage: () => "Students.csv has been successfully uploaded.",
      }) as any
    );

    expect(selectPendingBackgroundTaskCount(store.getState(), "upload")).toBe(1);

    pending.resolve({ ok: true });
    await dispatchPromise;

    expect(selectPendingBackgroundTaskCount(store.getState(), "upload")).toBe(0);
    expect((toast as any).success).toHaveBeenCalledWith(
      "Students.csv has been successfully uploaded."
    );
  });

  test("supports multiple success messages and clears pending tasks on failure", async () => {
    const store = makeStore();

    await store.dispatch(
      runBackgroundTask({
        kind: "upload",
        label: "batch",
        request: async () => ({ ok: true }),
        getSuccessMessage: () => [
          "File A has been successfully uploaded.",
          "File B has been successfully uploaded.",
        ],
      }) as any
    );

    expect((toast as any).success).toHaveBeenNthCalledWith(
      1,
      "File A has been successfully uploaded."
    );
    expect((toast as any).success).toHaveBeenNthCalledWith(
      2,
      "File B has been successfully uploaded."
    );

    await store.dispatch(
      runBackgroundTask({
        kind: "upload",
        label: "Broken.csv",
        request: async () => {
          throw new Error("Upload failed");
        },
      }) as any
    );

    expect(selectPendingBackgroundTaskCount(store.getState(), "upload")).toBe(0);
    expect((toast as any).error).toHaveBeenCalledWith("Upload failed");
  });
});
