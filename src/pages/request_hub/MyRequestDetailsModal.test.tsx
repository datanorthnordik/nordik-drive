import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import MyRequestDetailsModal from "./MyRequestDetailsModal";
import useFetch from "../../hooks/useFetch";

// ---- avoid CSS import issues (if your Jest config doesn't map CSS) ----
jest.mock("react-image-gallery/styles/css/image-gallery.css", () => ({}));
jest.mock("react-image-gallery", () => ({
  __esModule: true,
  default: () => <div data-testid="image-gallery-mock" />,
}));

// ---- mock heavy viewer components to keep unit tests stable & memory-safe ----
jest.mock("../viewers/PhotoViewer", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="photo-viewer"
      data-open={String(!!props.open)}
      data-startindex={String(props.startIndex ?? "")}
      data-count={String((props.photos || []).length)}
    />
  ),
}));

jest.mock("../viewers/DocumentViewer", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="document-viewer"
      data-open={String(!!props.open)}
      data-startindex={String(props.startIndex ?? "")}
      data-count={String((props.docs || []).length)}
      data-apibase={String(props.apiBase ?? "")}
    />
  ),
}));

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useFetchMock = useFetch as unknown as jest.Mock;

type HookReturn = {
  data: any;
  loading: boolean;
  error?: any;
  fetchData: jest.Mock;
};

// ---- per-test controllable hook state ----
let photosData: any = null;
let photosLoading = false;

let docsData: any = null;
let docsLoading = false;

// third hook in component (file blob). not used in these unit tests, but must exist.
let blobData: any = null;
let blobLoading = false;
let blobError: any = null;

let loadPhotosSpy: jest.Mock;
let loadDocsSpy: jest.Mock;

function setupUseFetchMock() {
  loadPhotosSpy = jest.fn().mockResolvedValue(undefined);
  loadDocsSpy = jest.fn().mockResolvedValue(undefined);

  useFetchMock.mockImplementation((url: string) => {
    const u = String(url);

    // photos list endpoint
    if (u.includes("/api/file/edit/photos/")) {
      const ret: HookReturn = {
        data: photosData,
        loading: photosLoading,
        fetchData: loadPhotosSpy,
      };
      return ret;
    }

    // docs list endpoint
    if (u.includes("/api/file/edit/docs/")) {
      const ret: HookReturn = {
        data: docsData,
        loading: docsLoading,
        fetchData: loadDocsSpy,
      };
      return ret;
    }

    // blob endpoint (not exercised here)
    if (u.includes("/api/file/doc")) {
      const ret: HookReturn = {
        data: blobData,
        loading: blobLoading,
        error: blobError,
        fetchData: jest.fn().mockResolvedValue(undefined),
      };
      return ret;
    }

    // fallback
    return {
      data: null,
      loading: false,
      fetchData: jest.fn().mockResolvedValue(undefined),
    };
  });
}

const baseRequest = (overrides?: any) => ({
  request_id: 123,
  status: "pending",
  details: [],
  ...overrides,
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();

  photosData = null;
  photosLoading = false;

  docsData = null;
  docsLoading = false;

  blobData = null;
  blobLoading = false;
  blobError = null;

  setupUseFetchMock();
});

afterEach(() => {
  cleanup();
});

describe("MyRequestDetailsModal (unit tests)", () => {
  test("renders header + no-changes row when details empty", () => {
    render(
      <MyRequestDetailsModal open={true} request={baseRequest()} onClose={jest.fn()} />
    );

    expect(screen.getByText(/Request #123/i)).toBeInTheDocument();
    expect(screen.getByText(/No field changes in this request/i)).toBeInTheDocument();

    expect(screen.getByText(/Uploaded Photos/i)).toBeInTheDocument();
    expect(screen.getByText(/Uploaded Documents/i)).toBeInTheDocument();
  });

  test("Close button calls onClose", () => {
    const onClose = jest.fn();

    render(<MyRequestDetailsModal open={true} request={baseRequest()} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test("when opened with requestId: calls loadPhotos() and loadDocs()", async () => {
    render(<MyRequestDetailsModal open={true} request={baseRequest()} onClose={jest.fn()} />);

    // in some setups StrictMode can double-call effects; don't assert exact count
    await waitFor(() => expect(loadPhotosSpy).toHaveBeenCalled());
    await waitFor(() => expect(loadDocsSpy).toHaveBeenCalled());
  });

  test("shows loading states when photosLoading/docsLoading are true", () => {
    photosLoading = true;
    docsLoading = true;
    setupUseFetchMock();

    render(<MyRequestDetailsModal open={true} request={baseRequest()} onClose={jest.fn()} />);

    expect(screen.getByText(/Loading photos/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading documents/i)).toBeInTheDocument();
  });

  test("renders photos; clicking a photo opens PhotoViewerModal at correct index", async () => {
    photosData = {
      photos: [
        { id: 11, file_name: "p1.jpg", is_approved: true },
        { id: 22, file_name: "p2.jpg", is_approved: false },
      ],
    };
    docsData = { docs: [] };
    setupUseFetchMock();

    render(<MyRequestDetailsModal open={true} request={baseRequest()} onClose={jest.fn()} />);

    // Wait for photo cards to appear
    await waitFor(() => expect(screen.getByText(/ID:\s*11/i)).toBeInTheDocument());
    expect(screen.getByText(/ID:\s*22/i)).toBeInTheDocument();

    // PhotoViewer initially closed
    const photoViewer = screen.getByTestId("photo-viewer");
    expect(photoViewer).toHaveAttribute("data-open", "false");

    // Click first photo (clicking the img inside card is enough to bubble to Card onClick)
    const imgs = screen.getAllByRole("img");
    fireEvent.click(imgs[0]);

    await waitFor(() => expect(screen.getByTestId("photo-viewer")).toHaveAttribute("data-open", "true"));
    expect(screen.getByTestId("photo-viewer")).toHaveAttribute("data-startindex", "0");
    expect(screen.getByTestId("photo-viewer")).toHaveAttribute("data-count", "2");
  });

  test("renders documents; clicking View opens DocumentViewerModal at correct index", async () => {
    photosData = { photos: [] };
    docsData = {
      docs: [
        {
          id: 101,
          file_name: "birth.pdf",
          size_bytes: 1024,
          mime_type: "application/pdf",
          document_category: "birth_certificate",
          is_approved: true,
        },
        {
          id: 202,
          file_name: "other.pdf",
          size_bytes: 2048,
          mime_type: "application/pdf",
          document_category: "other_document",
          is_approved: false,
        },
      ],
    };
    setupUseFetchMock();

    render(<MyRequestDetailsModal open={true} request={baseRequest()} onClose={jest.fn()} />);

    await waitFor(() => expect(screen.getByText("birth.pdf")).toBeInTheDocument());
    expect(screen.getByText("other.pdf")).toBeInTheDocument();

    const docViewer = screen.getByTestId("document-viewer");
    expect(docViewer).toHaveAttribute("data-open", "false");

    // there are 2 "View" buttons (one per doc)
    const viewButtons = screen.getAllByRole("button", { name: /^view$/i });
    fireEvent.click(viewButtons[1]); // open second doc

    await waitFor(() =>
      expect(screen.getByTestId("document-viewer")).toHaveAttribute("data-open", "true")
    );
    expect(screen.getByTestId("document-viewer")).toHaveAttribute("data-startindex", "1");
    expect(screen.getByTestId("document-viewer")).toHaveAttribute("data-count", "2");
  });
});
