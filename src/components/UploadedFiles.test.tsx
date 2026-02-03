import React from "react";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import UploadedFiles from "./UploadedFiles";
import useFetch from "../hooks/useFetch";
import { useDispatch, useSelector } from "react-redux";
import { setFiles } from "../store/auth/fileSlice";

// ---- mocks
const mockDispatch = jest.fn();
const mockUseFetch = useFetch as unknown as jest.Mock;
const mockSetFiles = setFiles as unknown as jest.Mock;

jest.mock("react-redux", () => ({
  __esModule: true,
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(),
}));

jest.mock("../store/auth/fileSlice", () => ({
  __esModule: true,
  setFiles: jest.fn(), // <-- implementation set in beforeEach
}));

jest.mock("../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("./Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => <div data-testid="loader" data-loading={String(!!loading)} />,
}));

// ---- test helpers
let mockNewFilesData: any = null;

const setSelectorState = (rows: any[]) => {
  (useSelector as unknown as jest.Mock).mockImplementation((sel: any) =>
    sel({ file: { files: rows } })
  );
};

const wireUseFetch = () => {
  mockUseFetch.mockImplementation((url: string, method: string) => {
    if (url.endsWith("/api/file") && method === "GET") {
      return { data: mockNewFilesData, fetchData: jest.fn(), loading: false };
    }
    // other hooks used by component
    return { data: null, fetchData: jest.fn(), loading: false };
  });
};

describe("UploadedFiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // ✅ FORCE action creator to return an action object
    mockSetFiles.mockImplementation((payload: any) => ({
      type: "file/setFiles",
      payload,
    }));

    mockNewFilesData = null;
    setSelectorState([]);
    wireUseFetch();
  });

  test("dispatches setFiles when GET hook has data", async () => {
    mockNewFilesData = { files: [{ id: 10, filename: "FromAPI.csv" }] };

    render(<UploadedFiles newFile="" />);

    await waitFor(() => {
      expect(mockSetFiles).toHaveBeenCalledWith({
        files: [{ id: 10, filename: "FromAPI.csv" }],
      });

      // ✅ dispatch receives EXACT action returned by setFiles
      const actionReturned = mockSetFiles.mock.results[0].value;
      expect(mockDispatch).toHaveBeenCalledWith(actionReturned);

      // optional strict check
      expect(actionReturned).toEqual({
        type: "file/setFiles",
        payload: { files: [{ id: 10, filename: "FromAPI.csv" }] },
      });
    });
  });
});
