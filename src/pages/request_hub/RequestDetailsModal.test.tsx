import React from "react";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import ApproveRequestModal, { __test__ } from "./RequestDetailsModal";
import useFetch from "../../hooks/useFetch";
import toast from "react-hot-toast";

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../viewers/PhotoViewer", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="photo-viewer" data-open={String(!!props.open)}>
      {props.open ? (
        <>
          <button data-testid="photo-viewer-close" onClick={props.onClose}>
            close
          </button>
          <button
            data-testid="photo-viewer-approve-first"
            onClick={() => props.onApprove?.(props.photos?.[0]?.id)}
          >
            approve-first
          </button>
          <button
            data-testid="photo-viewer-reject-first"
            onClick={() => props.onReject?.(props.photos?.[0]?.id)}
          >
            reject-first
          </button>
        </>
      ) : null}
    </div>
  ),
}));

jest.mock("../viewers/DocumentViewer", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="doc-viewer" data-open={String(!!props.open)}>
      {props.open ? (
        <>
          <button data-testid="doc-viewer-close" onClick={props.onClose}>
            close
          </button>
          <button
            data-testid="doc-viewer-approve-first"
            onClick={() => props.onApprove?.(props.docs?.[0]?.id)}
          >
            approve-first
          </button>
          <button
            data-testid="doc-viewer-reject-first"
            onClick={() => props.onReject?.(props.docs?.[0]?.id)}
          >
            reject-first
          </button>
        </>
      ) : null}
    </div>
  ),
}));

const useFetchMock = useFetch as unknown as jest.Mock;

let approvalResponseNext: any = null;
let approveLoadingNext = false;

let reviewLoadingNext = false;

let photoDataNext: any = null;
let docsDataNext: any = null;

let fileBlobDataNext: any = null;
let fileBlobLoadingNext = false;
let fileBlobErrorNext: any = null;

let approveRequestSpy: jest.Mock;
let submitReviewSpy: jest.Mock;
let loadPhotosSpy: jest.Mock;
let loadDocsSpy: jest.Mock;
let fetchFileBlobSpy: jest.Mock;

function setupUseFetchRoutingMock() {
  // fresh spies each time except submitReviewSpy (we may set it as deferred in a test)
  approveRequestSpy = jest.fn();
  submitReviewSpy = submitReviewSpy ?? jest.fn(() => Promise.resolve());
  loadPhotosSpy = jest.fn();
  loadDocsSpy = jest.fn();
  fetchFileBlobSpy = jest.fn();

  useFetchMock.mockImplementation((url: string) => {
    if (String(url).includes("/api/file/approve/request")) {
      return { data: approvalResponseNext, fetchData: approveRequestSpy, loading: approveLoadingNext };
    }
    if (String(url).includes("/api/file/photos/review")) {
      return { data: null, fetchData: submitReviewSpy, loading: reviewLoadingNext };
    }
    if (String(url).includes("/api/file/edit/photos/")) {
      return { data: photoDataNext, fetchData: loadPhotosSpy, loading: false };
    }
    if (String(url).includes("/api/file/edit/docs/")) {
      return { data: docsDataNext, fetchData: loadDocsSpy, loading: false };
    }
    if (String(url).includes("/api/file/doc")) {
      return {
        data: fileBlobDataNext,
        fetchData: fetchFileBlobSpy,
        loading: fileBlobLoadingNext,
        error: fileBlobErrorNext,
      };
    }
    return { data: null, fetchData: jest.fn(), loading: false };
  });
}

const baseRequest = (over: Partial<any> = {}) => ({
  request_id: 55,
  firstname: "Athul",
  lastname: "N",
  consent: false,
  archive_consent: true,
  details: [
    { id: 1, row_id: 1, field_name: "name", old_value: "", new_value: "new1" },
    { id: 2, row_id: 2, field_name: "city", old_value: "old2", new_value: "new2" },
  ],
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();

  approvalResponseNext = null;
  approveLoadingNext = false;
  reviewLoadingNext = false;

  photoDataNext = null;
  docsDataNext = null;

  fileBlobDataNext = null;
  fileBlobLoadingNext = false;
  fileBlobErrorNext = null;

  // default submitReview spy (can be replaced by a test before calling setupUseFetchRoutingMock)
  submitReviewSpy = jest.fn(() => Promise.resolve());

  setupUseFetchRoutingMock();

  (global as any).URL.createObjectURL = jest.fn(() => "blob:mock-url");
  (global as any).URL.revokeObjectURL = jest.fn();

  class FR {
    result: any = null;
    onload: any = null;
    onerror: any = null;
    readAsText(_blob: Blob) {
      this.result = "hello world";
      if (this.onload) this.onload();
    }
  }
  (global as any).FileReader = FR;
});

afterEach(() => cleanup());

describe("ApproveRequestModal helpers (__test__)", () => {
  test("formatBytes branches", () => {
    expect(__test__.formatBytes(undefined)).toBe("0 B");
    expect(__test__.formatBytes(0)).toBe("0 B");
    expect(__test__.formatBytes(9)).toBe("9 B"); // i === 0 branch
    expect(__test__.formatBytes(1024)).toBe("1.0 KB"); //  fixed
    expect(__test__.formatBytes(10 * 1024)).toBe("10 KB"); // val >= 10 branch
  });

  test("categoryLabel branches", () => {
    expect(__test__.categoryLabel(undefined)).toBe("Unknown");
    expect(__test__.categoryLabel("birth_certificate")).toBe("Birth Certificate");
    expect(__test__.categoryLabel("random_cat")).toBe("random_cat");
  });

  test("mime helpers + extension + ensureHasExtension branches", () => {
    expect(__test__.guessMimeFromFilename("a.pdf")).toBe("application/pdf");
    expect(__test__.guessMimeFromFilename("a.JPG")).toBe("image/jpeg");
    expect(__test__.guessMimeFromFilename("a.doc")).toBe("application/msword");
    expect(__test__.guessMimeFromFilename("a.xlsx")).toContain("spreadsheetml");
    expect(__test__.guessMimeFromFilename("a.unknown")).toBe("");

    expect(__test__.extensionFromMime("application/pdf")).toBe(".pdf");
    expect(__test__.extensionFromMime("image/png")).toBe(".png");
    expect(__test__.extensionFromMime("application/msword")).toBe(".doc");
    expect(__test__.extensionFromMime("text/plain")).toBe(".txt");
    expect(__test__.extensionFromMime("application/octet-stream")).toBe("");

    expect(__test__.ensureHasExtension("file.pdf", "application/pdf")).toBe("file.pdf");
    expect(__test__.ensureHasExtension("file", "application/pdf")).toBe("file.pdf");
    expect(__test__.ensureHasExtension("file", "application/octet-stream")).toBe("file");

    expect(__test__.isImageMime("image/png")).toBe(true);
    expect(__test__.isImageMime("application/pdf")).toBe(false);
    expect(__test__.isPdfMime("application/pdf")).toBe(true);
    expect(__test__.isDocxMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
    expect(__test__.isExcelMime("application/vnd.ms-excel")).toBe(true);
  });
});

describe("ApproveRequestModal UI", () => {
  test("returns null when request is missing", () => {
    const { container } = render(<ApproveRequestModal open={true} request={null} onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("open loads photos + docs, renders consent texts, renders details table and edits field", async () => {
    photoDataNext = { photos: [] };
    docsDataNext = { docs: [] };

    render(
      <ApproveRequestModal open={true} request={baseRequest({ consent: false, archive_consent: true })} onClose={jest.fn()} />
    );

    await waitFor(() => {
      expect(loadPhotosSpy).toHaveBeenCalled();
      expect(loadDocsSpy).toHaveBeenCalled();
    });

    expect(screen.getByText(/User has not given consent/i)).toBeInTheDocument();
    expect(screen.getByText(/has given consent to archive/i)).toBeInTheDocument();

    expect(screen.getByText("Row")).toBeInTheDocument();
    expect(screen.getByText("Field Name")).toBeInTheDocument();

    expect(screen.getByText("(empty)")).toBeInTheDocument();

    const input0 = screen.getByTestId("field-input-0") as HTMLInputElement;
    expect(input0.value).toBe("new1");
    fireEvent.change(input0, { target: { value: "updated" } });
    expect((screen.getByTestId("field-input-0") as HTMLInputElement).value).toBe("updated");

    expect(screen.getByText("No photos submitted.")).toBeInTheDocument();
    expect(screen.getByText("No documents submitted.")).toBeInTheDocument();
  });

  test("photo approve/reject via viewer updates status chip label", async () => {
    photoDataNext = { photos: [{ id: 101, mime_type: "image/png", status: null }] };
    docsDataNext = { docs: [] };

    render(<ApproveRequestModal open={true} request={baseRequest()} onClose={jest.fn()} />);

    await waitFor(() => expect(loadPhotosSpy).toHaveBeenCalled());

    expect(screen.getByTestId("photo-status-101")).toHaveTextContent("Pending");

    fireEvent.click(screen.getByTestId("photo-card-101"));
    expect(screen.getByTestId("photo-viewer")).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByTestId("photo-viewer-approve-first"));
    expect(screen.getByTestId("photo-status-101")).toHaveTextContent("Approved");

    fireEvent.click(screen.getByTestId("photo-viewer-reject-first"));
    expect(screen.getByTestId("photo-status-101")).toHaveTextContent("Rejected");
  });

  test("docs render category + bytes; doc approve/reject buttons update status; doc viewer open triggers blob URL + cleanup revoke", async () => {
    photoDataNext = { photos: [] };
    docsDataNext = {
      docs: [
        {
          id: 201,
          file_name: "readme",
          size_bytes: 1024,
          mime_type: "",
          document_type: "document",
          document_category: "birth_certificate",
          status: null,
        },
        {
          id: 202,
          file_name: "notes.txt",
          size_bytes: 0,
          mime_type: "",
          document_type: "document",
          document_category: undefined,
          status: "approved",
        },
      ],
    };

    fileBlobDataNext = new Blob(["hello"], { type: "" });

    const { unmount } = render(<ApproveRequestModal open={true} request={baseRequest()} onClose={jest.fn()} />);

    await waitFor(() => expect(loadDocsSpy).toHaveBeenCalled());

    expect(screen.getByText("Birth Certificate")).toBeInTheDocument();
    expect(screen.getByText("1.0 KB")).toBeInTheDocument(); //  fixed
    expect(screen.getByText("0 B")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();

    expect(screen.getByTestId("doc-status-201")).toHaveTextContent("PENDING");

    fireEvent.click(screen.getByTestId("doc-approve-201"));
    expect(screen.getByTestId("doc-status-201")).toHaveTextContent("APPROVED");

    fireEvent.click(screen.getByTestId("doc-reject-201"));
    expect(screen.getByTestId("doc-status-201")).toHaveTextContent("REJECTED");

    fireEvent.click(screen.getByTestId("doc-view-202"));
    expect(screen.getByTestId("doc-viewer")).toHaveAttribute("data-open", "true");

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  test("approve all blocked when any photo/doc pending -> toast.error and no submit", async () => {
    photoDataNext = { photos: [{ id: 1, status: null }] };
    docsDataNext = {
      docs: [
        {
          id: 2,
          file_name: "x.pdf",
          size_bytes: 1,
          mime_type: "application/pdf",
          document_type: "document",
          document_category: "other_document",
          status: "approved",
        },
      ],
    };

    render(<ApproveRequestModal open={true} request={baseRequest()} onClose={jest.fn()} />);

    await waitFor(() => expect(loadPhotosSpy).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId("approve-all-btn"));

    expect((toast as any).error).toHaveBeenCalled();
    expect(submitReviewSpy).not.toHaveBeenCalled();
    expect(approveRequestSpy).not.toHaveBeenCalled();
  });

  test("approve all submits review + approveRequest; submit-lock prevents double click while pending", async () => {
    photoDataNext = { photos: [{ id: 11, status: "approved" }] };
    docsDataNext = {
      docs: [
        {
          id: 22,
          file_name: "doc.pdf",
          size_bytes: 10,
          mime_type: "application/pdf",
          document_type: "document",
          document_category: "other_document",
          status: "rejected",
        },
      ],
    };

    let resolveReview!: () => void;
    submitReviewSpy = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveReview = resolve;
        })
    );

    setupUseFetchRoutingMock();

    render(<ApproveRequestModal open={true} request={baseRequest()} onClose={jest.fn()} />);

    await waitFor(() => expect(loadPhotosSpy).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId("approve-all-btn"));
    fireEvent.click(screen.getByTestId("approve-all-btn")); // locked

    expect(submitReviewSpy).toHaveBeenCalledTimes(1);

    act(() => resolveReview());

    await waitFor(() => {
      expect(approveRequestSpy).toHaveBeenCalledTimes(1);
    });

    expect(submitReviewSpy).toHaveBeenCalledWith({
      approved_photos: [11],
      rejected_photos: [22],
    });

    expect(approveRequestSpy).toHaveBeenCalledWith({
      request_id: 55,
      updates: expect.any(Array),
    });
  });

  test("approvalResponse effect -> toast.success + onApproved + onClose only once; resets on reopen", async () => {
    photoDataNext = { photos: [] };
    docsDataNext = { docs: [] };

    const onClose = jest.fn();
    const onApproved = jest.fn();

    const { rerender } = render(
      <ApproveRequestModal open={true} request={baseRequest()} onClose={onClose} onApproved={onApproved} />
    );

    expect((toast as any).success).not.toHaveBeenCalled();

    // deliver approval response
    approvalResponseNext = { ok: true };
    setupUseFetchRoutingMock();

    rerender(<ApproveRequestModal open={true} request={baseRequest()} onClose={onClose} onApproved={onApproved} />);

    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalledTimes(1);
      expect(onApproved).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    // rerender same state -> should not double fire
    rerender(<ApproveRequestModal open={true} request={baseRequest()} onClose={onClose} onApproved={onApproved} />);
    expect((toast as any).success).toHaveBeenCalledTimes(1);

    // close
    rerender(<ApproveRequestModal open={false} request={baseRequest()} onClose={onClose} onApproved={onApproved} />);

    //  reopen with NO approvalResponse (allows reset effect to run)
    approvalResponseNext = null;
    setupUseFetchRoutingMock();

    rerender(<ApproveRequestModal open={true} request={baseRequest()} onClose={onClose} onApproved={onApproved} />);

    //  now deliver new approval response after reopen
    approvalResponseNext = { ok: true, again: true };
    setupUseFetchRoutingMock();

    rerender(<ApproveRequestModal open={true} request={baseRequest()} onClose={onClose} onApproved={onApproved} />);

    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalledTimes(2);
    });
  });
});
