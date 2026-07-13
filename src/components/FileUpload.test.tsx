import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import FileUploader from "./FileUploader";
import { MAX_UPLOAD_FILENAME_LENGTH } from "../constants/fileUpload";
import toast from "react-hot-toast";
import { apiRequest } from "../hooks/useFetch";
import fileReducer from "../store/auth/fileSlice";
import backgroundTasksReducer from "../store/backgroundTasksSlice";

jest.mock("../hooks/useFetch", () => ({
  __esModule: true,
  apiRequest: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  success: jest.fn(),
  error: jest.fn(),
}));

class MockFormData {
  public entries: Array<{ key: string; value: any }> = [];

  append(key: string, value: any) {
    this.entries.push({ key, value });
  }
}

const apiRequestMock = apiRequest as unknown as jest.Mock;
const originalFormData = global.FormData;

const deferredResponse = () => {
  let resolve!: (value: any) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const makeStore = () => {
  const authReducer = (
    state = { token: "token", user: null, checked: true }
  ) => state;

  return configureStore({
    reducer: {
      auth: authReducer as any,
      file: fileReducer,
      backgroundTasks: backgroundTasksReducer,
    },
  });
};

const renderWithStore = () => {
  const store = makeStore();

  return {
    store,
    ...render(
      <Provider store={store}>
        <FileUploader />
      </Provider>
    ),
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  global.FormData = MockFormData as any;
});

afterEach(() => {
  global.FormData = originalFormData;
});

describe("FileUploader", () => {
  test("renders initial UI and shows 'No files selected'", () => {
    renderWithStore();

    expect(screen.getByText("Document Upload")).toBeInTheDocument();
    expect(screen.getByText("Selected Files")).toBeInTheDocument();
    expect(screen.getByText("No files selected")).toBeInTheDocument();
  });

  test("clicking 'Select Files from Device' triggers inputRef.click", () => {
    const { container } = renderWithStore();
    const input = container.querySelector("#archival-file-input") as HTMLInputElement;

    expect(input).toBeTruthy();

    const clickSpy = jest.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "Select Files from Device" }));

    expect(clickSpy).toHaveBeenCalled();
  });

  test("selecting files shows preview items and upload button", async () => {
    const { container } = renderWithStore();
    const input = container.querySelector("#archival-file-input") as HTMLInputElement;

    const file1 = new File(["a"], "a.csv", { type: "text/csv" });
    const file2 = new File(["b"], "b.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1, file2] } });
    });

    expect(screen.getByRole("button", { name: "Upload Files" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("File name")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Remove a.csv" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove b.xlsx" })).toBeInTheDocument();
  });

  test("removing a file updates the list", async () => {
    const { container } = renderWithStore();
    const input = container.querySelector("#archival-file-input") as HTMLInputElement;

    const file1 = new File(["a"], "a.csv", { type: "text/csv" });
    const file2 = new File(["b"], "b.csv", { type: "text/csv" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1, file2] } });
    });

    expect(screen.getAllByLabelText("File name")).toHaveLength(2);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Remove a.csv" }));
    });

    expect(screen.getAllByLabelText("File name")).toHaveLength(1);
  });

  test("submitting with empty file name shows validation error", async () => {
    const { container } = renderWithStore();
    const input = container.querySelector("#archival-file-input") as HTMLInputElement;
    const file1 = new File(["a"], "a.csv", { type: "text/csv" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1] } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload Files" }));
    });

    expect(await screen.findByText("File name is required")).toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  test("submitting with a file name longer than the max shows validation error", async () => {
    const { container } = renderWithStore();
    const input = container.querySelector("#archival-file-input") as HTMLInputElement;
    const file1 = new File(["a"], "a.csv", { type: "text/csv" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1] } });
    });

    const nameField = screen.getByLabelText("File name");
    const tooLongName = "a".repeat(MAX_UPLOAD_FILENAME_LENGTH + 1);

    await act(async () => {
      fireEvent.change(nameField, { target: { value: tooLongName } });
    });

    expect(nameField).toHaveValue(tooLongName);
    expect(
      await screen.findByText(
        `File name must be ${MAX_UPLOAD_FILENAME_LENGTH} characters or fewer`
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload Files" })).toBeDisabled();
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  test("upload button is enabled again when the file name returns to the allowed length", async () => {
    const { container } = renderWithStore();
    const input = container.querySelector("#archival-file-input") as HTMLInputElement;
    const file1 = new File(["a"], "a.csv", { type: "text/csv" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1] } });
    });

    const nameField = screen.getByLabelText("File name");
    const uploadButton = screen.getByRole("button", { name: "Upload Files" });

    await act(async () => {
      fireEvent.change(nameField, {
        target: { value: "a".repeat(MAX_UPLOAD_FILENAME_LENGTH + 1) },
      });
    });

    expect(uploadButton).toBeDisabled();

    await act(async () => {
      fireEvent.change(nameField, {
        target: { value: "a".repeat(MAX_UPLOAD_FILENAME_LENGTH) },
      });
    });

    expect(
      screen.queryByText(
        `File name must be ${MAX_UPLOAD_FILENAME_LENGTH} characters or fewer`
      )
    ).not.toBeInTheDocument();
    expect(uploadButton).toBeEnabled();
  });

  test("submitting valid data uses background upload, clears the selection, and shows a background notice", async () => {
    const pending = deferredResponse();
    apiRequestMock.mockReturnValueOnce(pending.promise);
    apiRequestMock.mockResolvedValueOnce({ files: [] });

    const { container } = renderWithStore();
    const input = container.querySelector("#archival-file-input") as HTMLInputElement;
    const file1 = new File(["a"], "a.csv", { type: "text/csv" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1] } });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText("File name"), {
        target: { value: "My Display Name" },
      });
    });

    fireEvent.click(screen.getByLabelText("Mark as Confidential"));
    fireEvent.click(screen.getByLabelText("Enable Community Filter"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload Files" }));
    });

    expect(apiRequestMock).toHaveBeenCalledTimes(1);

    const [uploadUrl, uploadMethod, formDataArg, uploadHeaders, uploadToken] =
      apiRequestMock.mock.calls[0];

    expect(uploadUrl).toContain("file/upload");
    expect(uploadMethod).toBe("POST");
    expect(uploadHeaders).toEqual({});
    expect(uploadToken).toBe("token");

    const entries = (formDataArg as MockFormData).entries;
    expect(entries.some((entry) => entry.key === "files" && entry.value === file1)).toBe(true);
    expect(
      entries.some((entry) => entry.key === "filenames" && entry.value === "My Display Name")
    ).toBe(true);
    expect(entries.some((entry) => entry.key === "private" && entry.value === "true")).toBe(true);
    expect(
      entries.some((entry) => entry.key === "community_filter" && entry.value === "true")
    ).toBe(true);

    expect(screen.getByText("No files selected")).toBeInTheDocument();
    expect(
      screen.getByText("1 upload is running in the background.")
    ).toBeInTheDocument();

    pending.resolve({ message: "Uploaded!" });

    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalledWith(
        "My Display Name has been successfully uploaded."
      );
    });

    expect(apiRequestMock).toHaveBeenCalledTimes(2);
    expect(apiRequestMock.mock.calls[1][0]).toContain("file");

    await waitFor(() => {
      expect(
        screen.queryByText("1 upload is running in the background.")
      ).not.toBeInTheDocument();
    });
  });

  test("shows an error toast when the background upload fails", async () => {
    apiRequestMock.mockRejectedValueOnce(new Error("Upload failed"));

    const { container } = renderWithStore();
    const input = container.querySelector("#archival-file-input") as HTMLInputElement;
    const file1 = new File(["a"], "a.csv", { type: "text/csv" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1] } });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText("File name"), {
        target: { value: "My Display Name" },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload Files" }));
    });

    await waitFor(() => {
      expect((toast as any).error).toHaveBeenCalledWith("Upload failed");
    });
  });
});
