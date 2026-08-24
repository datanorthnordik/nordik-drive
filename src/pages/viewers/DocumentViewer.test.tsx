// src/pages/viewers/DocumentViewer.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import DocumentViewerModal, { ViewerDoc } from "./DocumentViewer";
import useFetch from "../../hooks/useFetch";
import { renderDocxPreview } from "../../lib/docxPreview";

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../lib/docxPreview", () => ({
  __esModule: true,
  renderDocxPreview: jest.fn(),
}));

const useFetchMock = useFetch as unknown as jest.Mock;
const renderDocxPreviewMock = renderDocxPreview as jest.MockedFunction<typeof renderDocxPreview>;

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
  renderDocxPreviewMock.mockReset();
  renderDocxPreviewMock.mockImplementation(async (_blob, container) => {
    container.innerHTML = "<p>DOCX preview</p>";
  });

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

  test("DOCX renders inline preview when blob exists", async () => {
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

    await waitFor(() => expect(renderDocxPreviewMock).toHaveBeenCalled());

    expect(screen.getByTestId("viewer-docx-preview")).toBeInTheDocument();
    expect(screen.getByText("DOCX preview")).toBeInTheDocument();
  });

  test("DOCX preview uses blob MIME when document metadata is incomplete", async () => {
    mockFileData = new Blob(["xx"], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[{ id: 1, file_name: "report" } as ViewerDoc]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    await waitFor(() => expect(renderDocxPreviewMock).toHaveBeenCalled());

    expect(screen.getByTestId("viewer-meta")).toHaveTextContent(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(screen.queryByTestId("viewer-unknown-preview")).not.toBeInTheDocument();
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

  test("renders a text achiever story and its source details without downloading a file", async () => {
    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[
          {
            id: 1,
            story_type: "text",
            story_text: "A written survivor story.",
            google_details: "Google research detail",
            ancestry_details: "Ancestry research detail",
            derivation_sources: ["google", "ancestry"],
          },
        ]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    expect(await screen.findByTestId("viewer-story-text")).toHaveTextContent("A written survivor story.");
    expect(screen.getByTestId("viewer-story-details")).toHaveTextContent("Google research detail");
    expect(screen.getByTestId("viewer-story-details")).toHaveTextContent("Ancestry research detail");
    expect(screen.getByTestId("viewer-story-details")).toHaveTextContent("google, ancestry");
    expect(fileFetchSpy).not.toHaveBeenCalled();
  });

  test("navigates from a text story to an embedded video story", async () => {
    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[
          { id: 1, story_type: "text", story_text: "First story" },
          { id: 2, story_type: "video", video_url: "https://www.youtube.com/watch?v=story123" },
        ]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    fireEvent.click(screen.getByTestId("bottom-next"));

    const video = await screen.findByTitle("achiever-story-video");
    expect(video).toHaveAttribute("src", "https://www.youtube.com/embed/story123");
    expect(screen.getByTestId("viewer-meta")).toHaveTextContent("2/2");
    expect(fileFetchSpy).not.toHaveBeenCalled();
  });

  test("loads a generated text-story PDF through the existing viewer", async () => {
    mockFileData = new Blob(["%PDF"], { type: "application/pdf" });

    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[
          {
            id: 11,
            story_type: "text",
            story_text: "The original submitted text remains available as metadata.",
            file_name: "Jane_Doe_story.pdf",
            mime_type: "application/pdf",
          },
        ]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    await waitFor(() => expect(fileFetchSpy).toHaveBeenCalledWith(undefined, undefined, false, {
      path: 11,
      responseType: "blob",
    }));
    expect(await screen.findByTitle("pdf-viewer")).toHaveAttribute("src", "blob:mock");
    expect(screen.queryByTestId("viewer-story-text")).not.toBeInTheDocument();
  });

  test("loads and plays an uploaded story video through the existing viewer", async () => {
    mockFileData = new Blob(["video"], { type: "video/mp4" });

    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[
          {
            id: 12,
            story_type: "video",
            file_name: "story.mp4",
            mime_type: "video/mp4",
          },
        ]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    await waitFor(() => expect(fileFetchSpy).toHaveBeenCalledWith(undefined, undefined, false, {
      path: 12,
      responseType: "blob",
    }));
    expect(await screen.findByTestId("viewer-uploaded-video")).toHaveAttribute("src", "blob:mock");
  });

  test("tries to play a non-embed video link inside the viewer", async () => {
    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[
          {
            id: 13,
            story_type: "video",
            video_url: "https://media.example.org/play/13",
          },
        ]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    expect(await screen.findByTestId("viewer-linked-video")).toHaveAttribute(
      "src",
      "https://media.example.org/play/13"
    );
    expect(fileFetchSpy).not.toHaveBeenCalled();
  });

  test("empty docs show a no documents state and disable actions", () => {
    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[]}
        startIndex={0}
        apiBase={API_BASE}
      />
    );

    expect(fileFetchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("viewer-filename")).toHaveTextContent("No Documents Available");
    expect(screen.getByTestId("viewer-meta")).toHaveTextContent("No Documents Available");
    expect(screen.getByTestId("viewer-empty")).toHaveTextContent("No Documents Available");
    expect(screen.getByTestId("top-open")).toBeDisabled();
    expect(screen.getByTestId("top-download")).toBeDisabled();
    expect(screen.getByTestId("bottom-prev")).toBeDisabled();
    expect(screen.getByTestId("bottom-open")).toBeDisabled();
    expect(screen.getByTestId("bottom-next")).toBeDisabled();
    expect(screen.getByTestId("download-all")).toBeDisabled();
  });

  test("opens the achiever story submission form inside the existing viewer", () => {
    render(
      <DocumentViewerModal
        open={true}
        onClose={jest.fn()}
        docs={[]}
        startIndex={0}
        apiBase={API_BASE}
        storySubmission={{ fileId: 49, rowId: 120739 }}
      />
    );

    fireEvent.click(screen.getByTestId("add-achiever-story"));

    expect(screen.getByTestId("achiever-story-submission-form")).toBeInTheDocument();
    expect(screen.getByText("Submit an Achiever Story")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit for approval" })).toBeInTheDocument();
  });
});
