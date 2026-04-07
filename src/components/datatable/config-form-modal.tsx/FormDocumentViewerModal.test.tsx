import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import useFetch from "../../../hooks/useFetch";
import FormDocumentViewerModal from "./FormDocumentViewerModal";

jest.mock("../../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@mui/material", () => {
  const React = require("react");

  return {
    __esModule: true,
    Box: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    Button: ({
      children,
      onClick,
      disabled,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) =>
      React.createElement(
        "button",
        { type: "button", onClick, disabled },
        children
      ),
    CircularProgress: () => React.createElement("div", { "data-testid": "spinner" }),
    Chip: ({ label }: { label?: React.ReactNode }) =>
      React.createElement("div", null, label),
    Dialog: ({
      open,
      children,
    }: {
      open?: boolean;
      children?: React.ReactNode;
    }) => (open ? React.createElement("div", { role: "dialog" }, children) : null),
    DialogContent: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    Divider: () => React.createElement("hr"),
    Typography: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
  };
});

jest.mock("@mui/icons-material/OpenInNew", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("span", null, "OpenInNewIcon"),
  };
});

jest.mock("@mui/icons-material/Download", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("span", null, "DownloadIcon"),
  };
});

jest.mock("@mui/icons-material/Close", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("span", null, "CloseIcon"),
  };
});

type Props = React.ComponentProps<typeof FormDocumentViewerModal>;

describe("FormDocumentViewerModal", () => {
  const mockedUseFetch = useFetch as jest.Mock;
  let mockFetchFileBlob: jest.Mock;

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const OriginalFileReader = global.FileReader;

  const makeDoc = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 1,
      file_name: "doc1.pdf",
      mime_type: "application/pdf",
      file_category: "general",
      file_size_bytes: 100,
      status: "approved",
      ...overrides,
    }) as Props["docs"][number];

  const makeProps = (overrides: Partial<Props> = {}): Props =>
    ({
      open: true,
      onClose: jest.fn(),
      docs: [makeDoc()],
      startIndex: 0,
      title: "Uploaded Documents",
      apiBase: "/api",
      blobEndpointPath: "/form/answers/upload",
      onOpen: jest.fn(),
      onDownload: jest.fn(),
      onApprove: jest.fn(),
      onReject: jest.fn(),
      showOpenButton: true,
      showDownloadButton: true,
      showApproveReject: false,
      showBottomBar: true,
      showPrevNext: true,
      showBottomOpenButton: true,
      bottomOpenLabel: "View",
      tipText: "If preview doesn’t load for some file types, use Open.",
      maxTextChars: 200000,
      ...overrides,
    }) as Props;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchFileBlob = jest.fn().mockResolvedValue(undefined);

    mockedUseFetch.mockReturnValue({
      data: null,
      fetchData: mockFetchFileBlob,
      loading: false,
      error: null,
    });

    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: jest.fn()
        .mockReturnValueOnce("blob:mock-1")
        .mockReturnValueOnce("blob:mock-2")
        .mockReturnValue("blob:mock-next"),
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: jest.fn(),
    });
  });

  afterAll(() => {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: originalRevokeObjectURL,
    });
    global.FileReader = OriginalFileReader;
  });

  it("fetches the initial document on open and clamps startIndex", async () => {
    const firstDoc = makeDoc({ id: 10, file_name: "one.pdf", mime_type: "application/pdf" });
    const secondDoc = makeDoc({ id: 20, file_name: "two.pdf", mime_type: "application/pdf" });

    render(
      <FormDocumentViewerModal
        {...makeProps({
          docs: [firstDoc, secondDoc],
          startIndex: 99,
        })}
      />
    );

    await waitFor(() => {
      expect(mockFetchFileBlob).toHaveBeenCalledWith(
        undefined,
        undefined,
        false,
        {
          path: 20,
          responseType: "blob",
        }
      );
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("application/pdf • 2/2")).toBeInTheDocument();
    expect(screen.getByText("Document not loaded yet.")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockedUseFetch.mockReturnValue({
      data: null,
      fetchData: mockFetchFileBlob,
      loading: true,
      error: null,
    });

    render(<FormDocumentViewerModal {...makeProps()} />);

    expect(screen.getByText("Loading document...")).toBeInTheDocument();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows error state when loading fails", () => {
    mockedUseFetch.mockReturnValue({
      data: null,
      fetchData: mockFetchFileBlob,
      loading: false,
      error: "Blob fetch failed",
    });

    render(<FormDocumentViewerModal {...makeProps()} />);

    expect(screen.getByText("Failed to load document")).toBeInTheDocument();
    expect(screen.getByText("Blob fetch failed")).toBeInTheDocument();
  });

  it("renders a PDF preview and closes with cleanup", async () => {
    mockedUseFetch.mockReturnValue({
      data: new Blob(["%PDF-1.4"], { type: "application/pdf" }),
      fetchData: mockFetchFileBlob,
      loading: false,
      error: null,
    });

    const props = makeProps({
      docs: [makeDoc({ id: 5, file_name: "sample.pdf", mime_type: "application/pdf" })],
    });

    const { container } = render(<FormDocumentViewerModal {...props} />);

    const iframe = await waitFor(() => container.querySelector('iframe[title="pdf-viewer"]'));
    expect(iframe).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Close/i }));

    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders text preview and respects maxTextChars", async () => {
    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public onload: null | (() => void) = null;
      public onerror: null | (() => void) = null;

      readAsText(_blob: Blob) {
        this.result = "ABCDEFGHIJ";
        if (this.onload) this.onload();
      }
    }

    global.FileReader = MockFileReader as unknown as typeof FileReader;

    mockedUseFetch.mockReturnValue({
      data: new Blob(["ignored"], { type: "text/plain" }),
      fetchData: mockFetchFileBlob,
      loading: false,
      error: null,
    });

    render(
      <FormDocumentViewerModal
        {...makeProps({
          docs: [
            makeDoc({
              id: 7,
              file_name: "notes.txt",
              mime_type: "text/plain",
            }),
          ],
          maxTextChars: 4,
        })}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("ABCD")).toBeInTheDocument();
    });

    expect(screen.queryByText("ABCDEFGHIJ")).not.toBeInTheDocument();
  });

  it("renders DOC/DOCX unsupported preview and uses onOpen callback", async () => {
    const doc = makeDoc({
      id: 9,
      file_name: "letter.docx",
      mime_type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const props = makeProps({
      docs: [doc],
    });

    mockedUseFetch.mockReturnValue({
      data: new Blob(["docx-data"], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      fetchData: mockFetchFileBlob,
      loading: false,
      error: null,
    });

    render(<FormDocumentViewerModal {...props} />);

    await waitFor(() => {
      expect(
        screen.getByText("Preview not supported for DOC/DOCX in browser.")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Open/i })[0]);

    expect(props.onOpen).toHaveBeenCalledWith(doc);
  });

  it("navigates next/prev and triggers approve, reject, and download callbacks", async () => {
    const firstDoc = makeDoc({
      id: 1,
      file_name: "first.pdf",
      mime_type: "application/pdf",
    });

    const secondDoc = makeDoc({
      id: 2,
      file_name: "second.png",
      mime_type: "image/png",
    });

    const props = makeProps({
      docs: [firstDoc, secondDoc],
      showApproveReject: true,
    });

    mockedUseFetch.mockReturnValue({
      data: new Blob(["img-data"], { type: "image/png" }),
      fetchData: mockFetchFileBlob,
      loading: false,
      error: null,
    });

    render(<FormDocumentViewerModal {...props} />);

    await waitFor(() => {
      expect(screen.getByText("application/pdf • 1/2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next ▶" }));

    await waitFor(() => {
      expect(screen.getByText("image/png • 2/2")).toBeInTheDocument();
    });

    expect(mockFetchFileBlob).toHaveBeenLastCalledWith(
      undefined,
      undefined,
      false,
      {
        path: 2,
        responseType: "blob",
      }
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: /Download/i }));

    expect(props.onApprove).toHaveBeenCalledWith(secondDoc);
    expect(props.onReject).toHaveBeenCalledWith(secondDoc);
    expect(props.onDownload).toHaveBeenCalledWith(secondDoc);

    fireEvent.click(screen.getByRole("button", { name: "◀ Prev" }));

    await waitFor(() => {
      expect(screen.getByText("application/pdf • 1/2")).toBeInTheDocument();
    });
  });
  it("shows reviewer comment as readonly text when viewReviewerComment is enabled", async () => {
    mockedUseFetch.mockReturnValue({
      data: new Blob(["%PDF-1.4"], { type: "application/pdf" }),
      fetchData: mockFetchFileBlob,
      loading: false,
      error: null,
    });

    render(
      <FormDocumentViewerModal
        {...makeProps({
          docs: [
            makeDoc({
              id: 15,
              file_name: "reviewed.pdf",
              mime_type: "application/pdf",
              reviewer_comment: "Reviewed and accepted",
              status: "approved",
            }),
          ],
          viewReviewerComment: true,
          showReviewerCommentField: false,
        })}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Review")).toBeInTheDocument();
    });

    expect(screen.getByText("Reviewed and accepted")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });
});
