import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import PhotoViewerModal, { ViewerPhoto } from "./PhotoViewer";
import useFetch from "../../hooks/useFetch";

// --------------------
// Mock: useFetch (2 calls inside component)
// --------------------
jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useFetchMock = useFetch as unknown as jest.Mock;

// per-test mutable hook outputs
let mockMediaData: any = null;
let mockMediaLoading = false;
let mockMediaError: any = null;
const mockFetchMediaBlob = jest.fn();

let mockZipData: any = null;
let mockZipLoading = false;
let mockZipError: any = null;
const mockFetchZip = jest.fn();

// --------------------
// Mock: react-image-gallery
// - exposes ref.slideToIndex()
// - renders current item via renderItem()
// --------------------
const mockSlideToIndexSpy = jest.fn();

jest.mock("react-image-gallery", () => {
  const React = require("react");

  function MockImageGallery(props: any, ref: any) {
    const [idx, setIdx] = React.useState(props.startIndex ?? 0);

    const slideToIndex = (n: number) => {
      mockSlideToIndexSpy(n);
      setIdx(n);
      props.onSlide?.(n);
    };

    React.useImperativeHandle(ref, () => ({
      slideToIndex,
    }));

    const current = props.items?.[idx];

    return (
      <div data-testid="mock-gallery">
        <button
          data-testid="mock-gallery-prev"
          onClick={() => {
            const next = Math.max(idx - 1, 0);
            setIdx(next);
            props.onSlide?.(next);
          }}
        >
          prev
        </button>

        <button
          data-testid="mock-gallery-next"
          onClick={() => {
            const next = Math.min(idx + 1, (props.items?.length ?? 1) - 1);
            setIdx(next);
            props.onSlide?.(next);
          }}
        >
          next
        </button>

        <div data-testid="mock-gallery-item">{props.renderItem?.(current)}</div>
      </div>
    );
  }

  return {
    __esModule: true,
    default: React.forwardRef(MockImageGallery),
  };
});

function setupUseFetchMock() {
  useFetchMock.mockImplementation((url: string) => {
    if (String(url).includes("/file/doc/download")) {
      return {
        data: mockMediaData,
        loading: mockMediaLoading,
        error: mockMediaError,
        fetchData: mockFetchMediaBlob,
      };
    }

    if (String(url).includes("/admin/download_files")) {
      return {
        data: mockZipData,
        loading: mockZipLoading,
        error: mockZipError,
        fetchData: mockFetchZip,
      };
    }

    return {
      data: null,
      loading: false,
      error: null,
      fetchData: jest.fn(),
    };
  });
}

beforeAll(() => {
  Object.defineProperty(URL, "createObjectURL", {
    value: jest.fn(() => "blob:mock"),
    writable: true,
  });

  Object.defineProperty(URL, "revokeObjectURL", {
    value: jest.fn(),
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();

  mockMediaData = null;
  mockMediaLoading = false;
  mockMediaError = null;
  mockFetchMediaBlob.mockReset();

  mockZipData = null;
  mockZipLoading = false;
  mockZipError = null;
  mockFetchZip.mockReset();

  mockSlideToIndexSpy.mockClear();

  setupUseFetchMock();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

// helper to click iconbutton by svg testid
function clickIconButtonBySvgTestId(svgTestId: string) {
  const svg = screen.getByTestId(svgTestId);
  const btn = svg.closest("button");
  expect(btn).toBeTruthy();
  fireEvent.click(btn as HTMLButtonElement);
}

describe("PhotoViewerModal", () => {
  test("renders empty state when no photos", () => {
    render(<PhotoViewerModal open={true} onClose={jest.fn()} photos={[]} />);

    expect(screen.getByText(/no photos found/i)).toBeInTheDocument();
    expect(screen.getByText(/^photo viewer$/i)).toBeInTheDocument();
    expect(screen.getByText(/^no photos$/i)).toBeInTheDocument();
  });

  test("clamps startIndex and resets gallery on open (calls slideToIndex)", async () => {
    jest.useFakeTimers();

    const photos: ViewerPhoto[] = [{ id: 1 }, { id: 2 }];
    const { rerender } = render(
      <PhotoViewerModal open={false} onClose={jest.fn()} photos={photos} startIndex={99} />
    );

    rerender(<PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} startIndex={99} />);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(mockSlideToIndexSpy).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  test("respects showThumbnails by changing image maxHeight (72vh vs 82vh)", async () => {
    const photos: ViewerPhoto[] = [{ id: 1, status: "approved" }];

    // ✅ IMPORTANT: Dialog renders in a portal, so use baseElement (document.body), not container
    const { baseElement, rerender } = render(
      <PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} showThumbnails={true} />
    );

    await waitFor(() => {
      expect(baseElement.querySelector("img")).toBeTruthy();
    });

    const img1 = baseElement.querySelector("img") as HTMLImageElement;
    expect(img1.style.maxHeight).toBe("72vh");

    rerender(
      <PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} showThumbnails={false} />
    );

    await waitFor(() => {
      const img2 = baseElement.querySelector("img") as HTMLImageElement | null;
      expect(img2).toBeTruthy();
      expect((img2 as HTMLImageElement).style.maxHeight).toBe("82vh");
    });
  });

  test("shows request info in caption: single request_id => 'Request #X'", () => {
    const photos: ViewerPhoto[] = [{ id: 1, request_id: 7 }];
    render(<PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} />);
    expect(screen.getByText(/request #7/i)).toBeInTheDocument();
  });

  test("shows request info in caption: multiple request ids => 'N Requests'", () => {
    const photos: ViewerPhoto[] = [
      { id: 1, request_id: 9 },
      { id: 2, requestId: 3 },
    ];
    render(<PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} />);
    expect(screen.getByText(/2 requests/i)).toBeInTheDocument();
  });

  test("showStatusPill=false hides the status chip even if photo has status", () => {
    const photos: ViewerPhoto[] = [{ id: 1, status: "approved" }];
    render(
      <PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} showStatusPill={false} />
    );
    expect(screen.queryByText(/approved/i)).not.toBeInTheDocument();
  });

  test("prev/next buttons update header count and reset zoom to 100% on slide", () => {
    const photos: ViewerPhoto[] = [{ id: 1 }, { id: 2 }];
    render(<PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} startIndex={0} />);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    clickIconButtonBySvgTestId("ZoomInIcon");
    expect(screen.getByText("125%")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mock-gallery-next"));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  test("close button calls onClose", () => {
    const onClose = jest.fn();
    const photos: ViewerPhoto[] = [{ id: 1 }];
    render(<PhotoViewerModal open={true} onClose={onClose} photos={photos} />);
    clickIconButtonBySvgTestId("CloseIcon");
    expect(onClose).toHaveBeenCalled();
  });

  test("single download: clicking Download calls fetchMediaBlob with correct options", () => {
    const photos: ViewerPhoto[] = [{ id: 5 }];
    render(<PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} />);
    fireEvent.click(screen.getByRole("button", { name: /^download$/i }));
    expect(mockFetchMediaBlob).toHaveBeenCalledWith(undefined, undefined, false, {
      path: 5,
      responseType: "blob",
    });
  });

  test("download all ZIP: infers request ids (request_id/requestId), sorts/uniques, calls fetchZip with correct body", () => {
    const photos: ViewerPhoto[] = [
      { id: 1, request_id: 9 },
      { id: 2, requestId: 3 },
      { id: 3, request_id: 9 },
      { id: 4 },
    ];

    render(
      <PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} only_approved={false} />
    );
    clickIconButtonBySvgTestId("FolderZipIcon");

    const [body, , , cfg] = mockFetchZip.mock.calls[0];
    expect(body).toEqual({
      document_type: "photos",
      categorize_by_user: false,
      categorize_by_type: false,
      only_approved: false,
      request_ids: [3, 9],
    });
    expect(cfg).toEqual({ responseType: "blob" });
  });

  test("download all ZIP button is disabled when request IDs cannot be inferred", () => {
    const photos: ViewerPhoto[] = [{ id: 1 }, { id: 2 }];
    render(<PhotoViewerModal open={true} onClose={jest.fn()} photos={photos} />);
    const zipBtn = screen.getByTestId("FolderZipIcon").closest("button");
    expect(zipBtn).toBeDisabled();
  });
});
