import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import { useMediaQuery } from "@mui/material";
import FormPhotoViewerModal from "./FormPhotoViewerModal.tsx";

jest.mock("@mui/material", () => ({
  __esModule: true,
  Box: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Chip: ({ label }: any) => <div>{label}</div>,
  Dialog: ({ open, children }: any) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  Divider: () => <hr />,
  IconButton: ({ children, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Tooltip: ({ title, children }: any) => (
    <span data-testid={`tooltip-${String(title)}`}>{children}</span>
  ),
  Typography: ({ children }: any) => <div>{children}</div>,
  useMediaQuery: jest.fn(),
  useTheme: () => ({
    breakpoints: {
      down: () => "down-sm",
    },
  }),
}));

jest.mock("@mui/icons-material/Close", () => ({
  __esModule: true,
  default: () => <span>CloseIcon</span>,
}));

jest.mock("@mui/icons-material/Download", () => ({
  __esModule: true,
  default: () => <span>DownloadIcon</span>,
}));

jest.mock("@mui/icons-material/ZoomIn", () => ({
  __esModule: true,
  default: () => <span>ZoomInIcon</span>,
}));

jest.mock("@mui/icons-material/ZoomOut", () => ({
  __esModule: true,
  default: () => <span>ZoomOutIcon</span>,
}));

jest.mock("@mui/icons-material/RestartAlt", () => ({
  __esModule: true,
  default: () => <span>RestartAltIcon</span>,
}));

jest.mock("@mui/icons-material/NavigateBefore", () => ({
  __esModule: true,
  default: () => <span>NavigateBeforeIcon</span>,
}));

jest.mock("@mui/icons-material/NavigateNext", () => ({
  __esModule: true,
  default: () => <span>NavigateNextIcon</span>,
}));

jest.mock("react-image-gallery", () => {
  const React = require("react");

  const MockImageGallery = React.forwardRef((props: any, ref: any) => {
    const [idx, setIdx] = React.useState(props.startIndex || 0);

    React.useImperativeHandle(
      ref,
      () => ({
        slideToIndex: (nextIdx: number) => {
          setIdx(nextIdx);
          props.onSlide?.(nextIdx);
        },
      }),
      [props]
    );

    const currentItem = props.items?.[idx];

    return (
      <div data-testid="image-gallery">
        <div data-testid="gallery-index">{String(idx)}</div>
        {currentItem ? props.renderItem?.(currentItem) : null}
      </div>
    );
  });

  return {
    __esModule: true,
    default: MockImageGallery,
  };
});

type Props = React.ComponentProps<typeof FormPhotoViewerModal>;

describe("FormPhotoViewerModal", () => {
  const mockUseMediaQuery = useMediaQuery as jest.Mock;

  const makePhoto = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 1,
      file_name: "photo-1.jpg",
      mime_type: "image/jpeg",
      file_comment: "First comment",
      status: "approved",
      ...overrides,
    }) as Props["photos"][number];

  const makeProps = (overrides: Partial<Props> = {}): Props =>
    ({
      open: true,
      onClose: jest.fn(),
      photos: [makePhoto()],
      startIndex: 0,
      title: "Uploaded Photos",
      getPhotoUrl: jest.fn((photo) => `/uploads/${photo.id}`),
      onDownload: jest.fn(),
      onApprove: jest.fn(),
      onReject: jest.fn(),
      showDownloadButton: true,
      showApproveReject: false,
      showCommentsPanel: true,
      showStatusPill: false,
      showThumbnails: true,
      ...overrides,
    }) as Props;

  const flushTimers = () => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseMediaQuery.mockReturnValue(false);
  });

  afterEach(() => {
    flushTimers();
    jest.useRealTimers();
  });

  it("renders empty state and closes when close button is clicked", () => {
    const props = makeProps({
      photos: [],
    });

    render(<FormPhotoViewerModal {...props} />);

    flushTimers();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Uploaded Photos")).toBeInTheDocument();
    expect(screen.getByText("No photos")).toBeInTheDocument();
    expect(screen.getByText("No photos found.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "CloseIcon" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("clamps startIndex, shows status pill, desktop comments, and fires action callbacks", () => {
    const firstPhoto = makePhoto({
      id: 11,
      file_name: "one.jpg",
      file_comment: "First comment",
      status: "approved",
    });

    const secondPhoto = makePhoto({
      id: 22,
      file_name: "two.jpg",
      file_comment: "Second comment",
      status: "rejected",
    });

    const props = makeProps({
      photos: [firstPhoto, secondPhoto],
      startIndex: 99,
      showStatusPill: true,
      showApproveReject: true,
    });

    render(<FormPhotoViewerModal {...props} />);

    flushTimers();

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("Second comment")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(props.getPhotoUrl).toHaveBeenCalledWith(firstPhoto);
    expect(props.getPhotoUrl).toHaveBeenCalledWith(secondPhoto);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: /Download/i }));

    expect(props.onApprove).toHaveBeenCalledWith(secondPhoto);
    expect(props.onReject).toHaveBeenCalledWith(secondPhoto);
    expect(props.onDownload).toHaveBeenCalledWith(secondPhoto);
  });

  it("handles zoom and next/previous navigation", () => {
    const firstPhoto = makePhoto({
      id: 1,
      file_name: "one.jpg",
      file_comment: "First comment",
      status: "approved",
    });

    const secondPhoto = makePhoto({
      id: 2,
      file_name: "two.jpg",
      file_comment: "Second comment",
      status: "pending",
    });

    const props = makeProps({
      photos: [firstPhoto, secondPhoto],
    });

    render(<FormPhotoViewerModal {...props} />);

    flushTimers();

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("First comment")).toBeInTheDocument();

    const prevBtn = within(screen.getByTestId("tooltip-Previous")).getByRole("button");
    const nextBtn = within(screen.getByTestId("tooltip-Next")).getByRole("button");
    const zoomInBtn = within(screen.getByTestId("tooltip-Zoom in")).getByRole("button");

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(zoomInBtn);
    expect(screen.getByText("125%")).toBeInTheDocument();

    fireEvent.click(nextBtn);

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("Second comment")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId("tooltip-Previous")).getByRole("button"));

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("First comment")).toBeInTheDocument();
  });

  it("renders mobile comments panel and fallback no comments text", () => {
    mockUseMediaQuery.mockReturnValue(true);

    const props = makeProps({
      photos: [
        makePhoto({
          id: 7,
          file_comment: "   ",
        }),
      ],
    });

    render(<FormPhotoViewerModal {...props} />);

    flushTimers();

    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.getByText("No comments")).toBeInTheDocument();
  });

  it("hides action buttons when disabled by props", () => {
    const props = makeProps({
      showApproveReject: false,
      showDownloadButton: false,
    });

    render(<FormPhotoViewerModal {...props} />);

    flushTimers();

    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download/i })).not.toBeInTheDocument();
  });

  it("shows reviewer comment as readonly text when viewReviewerComment is enabled", () => {
    const props = makeProps({
      photos: [
        makePhoto({
          id: 5,
          reviewer_comment: "Reviewed and accepted",
          status: "approved",
        }),
      ],
      viewReviewerComment: true,
      showReviewerCommentField: false,
    });

    render(<FormPhotoViewerModal {...props} />);

    flushTimers();

    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Reviewed and accepted")).toBeInTheDocument();
    expect(screen.queryByLabelText("Review Comment")).not.toBeInTheDocument();
  });
});
