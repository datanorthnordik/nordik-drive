// src/pages/viewers/DocumentViewer.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import DocumentViewerModal, { ViewerDoc } from "./DocumentViewer";
import useFetch from "../../hooks/useFetch";

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useFetchMock = useFetch as unknown as jest.Mock;

const API_BASE = "https://example.com";

let mockFileData: any = null;
let mockFileLoading = false;
let mockFileError: any = null;

let mockZipData: any = null;
let mockZipLoading = false;
let mockZipError: any = null;

let fileFetchSpy: jest.Mock;
let zipFetchSpy: jest.Mock;

function setupUrlMocks() {
  Object.defineProperty(URL, "createObjectURL", {
    value: jest.fn(() => "blob:mock"),
    writable: true,
  });

  Object.defineProperty(URL, "revokeObjectURL", {
    value: jest.fn(),
    writable: true,
  });
}

beforeAll(() => {
  setupUrlMocks();
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  setupUrlMocks();

  mockFileData = null;
  mockFileLoading = false;
  mockFileError = null;

  mockZipData = null;
  mockZipLoading = false;
  mockZipError = null;

  fileFetchSpy = jest.fn().mockResolvedValue(undefined);
  zipFetchSpy = jest.fn().mockResolvedValue(undefined);

  useFetchMock.mockImplementation((url: string) => {
    const isZip = String(url).includes("/admin/download_files");
    if (isZip) {
      return {
        data: mockZipData,
        loading: mockZipLoading,
        error: mockZipError,
        fetchData: zipFetchSpy,
      };
    }
    return {
      data: mockFileData,
      loading: mockFileLoading,
      error: mockFileError,
      fetchData: fileFetchSpy,
    };
  });
});

afterEach(() => {
  cleanup();
});

describe("DocumentViewerModal (lightweight unit tests)", () => {
  test("on open: clamps startIndex and calls fetchFileBlob with correct id", async () => {
    const docs: ViewerDoc[] = [
      { id: 1, file_name: "a.pdf", request_id: 7 },
      { id: 2, file_name: "b.pdf", request_id: 7 },
    ];

    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={docs}
        startIndex={99}
        apiBase={API_BASE}
      />
    );

    await waitFor(() => expect(fileFetchSpy).toHaveBeenCalled());

    // should fetch doc id=2 (clamped)
    expect(fileFetchSpy).toHaveBeenCalledWith(undefined, undefined, false, {
      path: 2,
      responseType: "blob",
    });

    // meta should show 2/2
    expect(screen.getByText(/2\s*\/\s*2/i)).toBeInTheDocument();
  });

  test("PDF preview renders iframe when blob exists", async () => {
    mockFileData = new Blob(["%PDF"], { type: "application/pdf" });

    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[{ id: 1, file_name: "x.pdf", mime_type: "application/pdf" } as ViewerDoc]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());

    const iframe = screen.getByTitle("pdf-viewer") as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute("src")).toBe("blob:mock");
  });

  test("Image preview renders <img> when blob exists", async () => {
    mockFileData = new Blob(["xx"], { type: "image/png" });

    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[{ id: 1, file_name: "img.png", mime_type: "image/png" } as ViewerDoc]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());

    const img = await screen.findByTestId("viewer-image");
    expect(img).toHaveAttribute("src", "blob:mock");
    expect(img).toHaveAttribute("alt", "img.png");
  });

  test("DOCX shows unsupported preview block", async () => {
    mockFileData = new Blob(["xx"], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[
          {
            id: 1,
            file_name: "report.docx",
            mime_type:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          } as ViewerDoc,
        ]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());

    expect(screen.getByTestId("viewer-unsupported-preview")).toBeInTheDocument();
    expect(
      screen.getByText((t) => t.toLowerCase().includes("preview not supported"))
    ).toBeInTheDocument();
  });

  test("Close revokes blob URL and calls onClose", async () => {
    mockFileData = new Blob(["%PDF"], { type: "application/pdf" });
    const onClose = jest.fn();

    render(
      <DocumentViewerModal
        open={true}
        onClose={onClose}
        docs={[{ id: 1, file_name: "x.pdf", mime_type: "application/pdf" } as ViewerDoc]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId("top-close"));

    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
