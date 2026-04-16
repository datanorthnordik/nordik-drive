import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import FileContentPage from "./FileContentPage";

let mockSelectedFile: any = null;
let mockLocationState: any = null;
let mockData: any = null;
let mockLoading = false;
let mockError: string | null = null;

const mockFetchData = jest.fn();

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: () => ({
    data: mockData,
    loading: mockLoading,
    error: mockError,
    fetchData: mockFetchData,
  }),
}));

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) =>
    selector({
      file: { selectedFile: mockSelectedFile },
    }),
}));

jest.mock("react-router-dom", () => ({
  __esModule: true,
  useLocation: () => ({
    state: mockLocationState,
  }),
}), { virtual: true });

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading, text }: any) => (
    <div data-testid="loader">{loading ? text || "loading" : "idle"}</div>
  ),
}));

describe("FileContentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedFile = null;
    mockLocationState = null;
    mockData = null;
    mockLoading = false;
    mockError = null;
  });

  test("does not fetch when no file is selected", () => {
    render(<FileContentPage />);

    expect(mockFetchData).not.toHaveBeenCalled();
    expect(screen.queryByText("File Content")).not.toBeInTheDocument();
  });

  test("fetches uploaded html when the selected file has an id", async () => {
    mockSelectedFile = { id: 123, filename: "Some File.csv" };

    render(<FileContentPage />);

    await waitFor(() => {
      expect(mockFetchData).toHaveBeenCalledTimes(1);
    });
  });

  test("renders prefetched html from navigation state without refetching", () => {
    mockSelectedFile = { id: 123, filename: "Some File.csv" };
    mockLocationState = {
      htmlContent: "<!DOCTYPE html><html><body><h1>Prefetched Content</h1></body></html>",
      pageTitle: "Prefetched Title",
      fileId: 123,
    };

    render(<FileContentPage />);

    const frame = screen.getByTitle("Prefetched Title");
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveAttribute("srcdoc", mockLocationState.htmlContent);
    expect(mockFetchData).not.toHaveBeenCalled();
    expect(screen.queryByText("File Content")).not.toBeInTheDocument();
  });

  test("renders the fetched html inside an iframe", () => {
    mockSelectedFile = { id: 123, filename: "Some File.csv" };
    mockData = "<!DOCTYPE html><html><body><h1>Uploaded Content</h1></body></html>";

    render(<FileContentPage />);

    const frame = screen.getByTitle("Some File.csv content page");
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveAttribute("srcdoc", mockData);
    expect(screen.queryByText("File Content")).not.toBeInTheDocument();
  });

  test("stays blank when the api errors", () => {
    mockSelectedFile = { id: 123, filename: "Some File.csv" };
    mockError = "Request failed";

    render(<FileContentPage />);

    expect(screen.queryByText("Request failed")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Some File.csv content page")).not.toBeInTheDocument();
  });

  test("stays blank when selected file content is not configured", async () => {
    mockSelectedFile = { id: 123, filename: "Some File.csv" };

    render(<FileContentPage />);

    await waitFor(() => {
      expect(mockFetchData).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByTitle("Some File.csv content page")).not.toBeInTheDocument();
  });
});
