import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { PhotoGrid } from "./PhotoGrids";
import { normalizeStatus } from "./types";

type AnyPhoto = any;

const makePhotos = (): AnyPhoto[] => [
  {
    id: 11,
    status: "approved",
    photo_comment: "  Nice photo  ",
    reviewer_comment: "Looks good",
  },
  {
    id: 22,
    status: "rejected",
    photo_comment: "   ",
    reviewer_comment: "",
  },
  {
    id: 33,
    status: "pending",
  },
];

const getPhotoUrl = (id: number) => `https://example.com/photo/${id}.jpg`;

function defaultLabelFromStatus(st: "approved" | "rejected" | "pending") {
  return st === "approved" ? "Approved" : st === "rejected" ? "Rejected" : "Pending";
}

describe("PhotoGrid", () => {
  test("renders default title + default emptyText when photos empty", () => {
    render(<PhotoGrid photos={[]} getPhotoUrl={getPhotoUrl} onOpenViewer={jest.fn()} />);
    expect(screen.getByText("Uploaded Photos")).toBeInTheDocument();
    expect(screen.getByText("No photos submitted.")).toBeInTheDocument();
  });

  test("renders loading state", () => {
    render(<PhotoGrid loading photos={[]} getPhotoUrl={getPhotoUrl} onOpenViewer={jest.fn()} />);
    expect(screen.getByText("Loading photos...")).toBeInTheDocument();
  });

  test("renders cards, status label default branch, ID, image url, and uploader comment box with fallback text", () => {
    const photos = makePhotos();

    render(<PhotoGrid photos={photos} getPhotoUrl={getPhotoUrl} onOpenViewer={jest.fn()} />);

    const card11 = screen.getByTestId("photo-card-11");
    const card22 = screen.getByTestId("photo-card-22");
    const card33 = screen.getByTestId("photo-card-33");

    expect(card11).toBeInTheDocument();
    expect(card22).toBeInTheDocument();
    expect(card33).toBeInTheDocument();

    expect(within(card11).getByRole("img")).toHaveAttribute("src", getPhotoUrl(11));
    expect(within(card22).getByRole("img")).toHaveAttribute("src", getPhotoUrl(22));
    expect(within(card33).getByRole("img")).toHaveAttribute("src", getPhotoUrl(33));

    const st11 = normalizeStatus(photos[0].status) as "approved" | "rejected" | "pending";
    const st22 = normalizeStatus(photos[1].status) as "approved" | "rejected" | "pending";
    const st33 = normalizeStatus(photos[2].status) as "approved" | "rejected" | "pending";

    expect(screen.getByTestId("photo-status-11")).toHaveTextContent(defaultLabelFromStatus(st11));
    expect(screen.getByTestId("photo-status-22")).toHaveTextContent(defaultLabelFromStatus(st22));
    expect(screen.getByTestId("photo-status-33")).toHaveTextContent(defaultLabelFromStatus(st33));

    expect(within(card11).getByText("ID: 11")).toBeInTheDocument();
    expect(within(card22).getByText("ID: 22")).toBeInTheDocument();
    expect(within(card33).getByText("ID: 33")).toBeInTheDocument();

    expect(within(card11).getByText("Uploader Comment")).toBeInTheDocument();
    expect(within(card22).getByText("Uploader Comment")).toBeInTheDocument();
    expect(within(card33).getByText("Uploader Comment")).toBeInTheDocument();

    expect(within(card11).getByText("Nice photo")).toBeInTheDocument();
    expect(within(card22).getByText("No uploader comment")).toBeInTheDocument();
    expect(within(card33).getByText("No uploader comment")).toBeInTheDocument();

    expect(within(card11).queryByRole("button", { name: /^download$/i })).not.toBeInTheDocument();
  });

  test("clicking card calls onOpenViewer with correct index", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();

    render(<PhotoGrid photos={makePhotos()} getPhotoUrl={getPhotoUrl} onOpenViewer={onOpenViewer} />);

    await user.click(screen.getByTestId("photo-card-22"));

    expect(onOpenViewer).toHaveBeenCalledTimes(1);
    expect(onOpenViewer).toHaveBeenCalledWith(1);
  });

  test("custom statusLabel is used and statusChipSx called", () => {
    const photos = makePhotos();
    const statusLabel = jest.fn((st: "approved" | "rejected" | "pending") => `LBL:${st}`);
    const statusChipSx = jest.fn((_st: "approved" | "rejected" | "pending") => ({ height: 99 }));

    render(
      <PhotoGrid
        photos={photos}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        statusLabel={statusLabel}
        statusChipSx={statusChipSx}
      />
    );

    const st11 = normalizeStatus(photos[0].status) as "approved" | "rejected" | "pending";
    const st22 = normalizeStatus(photos[1].status) as "approved" | "rejected" | "pending";
    const st33 = normalizeStatus(photos[2].status) as "approved" | "rejected" | "pending";

    expect(screen.getByTestId("photo-status-11")).toHaveTextContent(`LBL:${st11}`);
    expect(screen.getByTestId("photo-status-22")).toHaveTextContent(`LBL:${st22}`);
    expect(screen.getByTestId("photo-status-33")).toHaveTextContent(`LBL:${st33}`);

    expect(statusLabel).toHaveBeenCalled();
    expect(statusChipSx).toHaveBeenCalledTimes(3);
  });

  test("hides status chip when showStatusChip is false", () => {
    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        showStatusChip={false}
      />
    );

    expect(screen.queryByTestId("photo-status-11")).not.toBeInTheDocument();
    expect(screen.queryByTestId("photo-status-22")).not.toBeInTheDocument();
    expect(screen.queryByTestId("photo-status-33")).not.toBeInTheDocument();
  });

  test("download renders when onDownloadSingle is provided, uses custom filename/mime, and does not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();
    const onDownloadSingle = jest.fn();

    const downloadFilename = jest.fn((p: AnyPhoto) => `file_${p.id}.png`);
    const downloadMime = jest.fn((_p: AnyPhoto) => "image/png");

    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={onOpenViewer}
        onDownloadSingle={onDownloadSingle}
        downloadFilename={downloadFilename}
        downloadMime={downloadMime}
        primaryBtnSx={{ fontWeight: 900 }}
      />
    );

    const card11 = screen.getByTestId("photo-card-11");
    const dlBtn = within(card11).getByRole("button", { name: /^download$/i });

    await user.click(dlBtn);

    expect(onDownloadSingle).toHaveBeenCalledTimes(1);
    expect(onDownloadSingle).toHaveBeenCalledWith(11, "file_11.png", "image/png");
    expect(onOpenViewer).not.toHaveBeenCalled();

    expect(downloadFilename).toHaveBeenCalled();
    expect(downloadMime).toHaveBeenCalled();
  });

  test("download renders when showDownload=true even if onDownloadSingle is undefined; click does not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();

    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={onOpenViewer}
        showDownload
      />
    );

    const card11 = screen.getByTestId("photo-card-11");
    const dlBtn = within(card11).getByRole("button", { name: /^download$/i });

    await user.click(dlBtn);

    expect(onOpenViewer).not.toHaveBeenCalled();
  });

  test("default download filename/mime fallbacks are used when custom functions not provided", async () => {
    const user = userEvent.setup();
    const onDownloadSingle = jest.fn();

    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        onDownloadSingle={onDownloadSingle}
      />
    );

    const card33 = screen.getByTestId("photo-card-33");
    const dlBtn = within(card33).getByRole("button", { name: /^download$/i });

    await user.click(dlBtn);

    expect(onDownloadSingle).toHaveBeenCalledWith(33, "photo_33.jpg", "image/jpeg");
  });

  test("renders reviewer comment field with existing values and custom label", () => {
    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        showReviewerCommentField
        reviewerCommentLabel="Admin Review Comment"
      />
    );

    expect(screen.getAllByLabelText("Admin Review Comment")).toHaveLength(3);
    expect(screen.getByDisplayValue("Looks good")).toBeInTheDocument();
  });

  test("changing reviewer comment calls onReviewerCommentChange and does not open viewer", async () => {
  const user = userEvent.setup();
  const onOpenViewer = jest.fn();
  const onReviewerCommentChange = jest.fn();

  function Wrapper() {
    const [photos, setPhotos] = React.useState(makePhotos());

    return (
      <PhotoGrid
        photos={photos}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={onOpenViewer}
        showReviewerCommentField
        onReviewerCommentChange={(id, value) => {
          onReviewerCommentChange(id, value);
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === id ? { ...photo, reviewer_comment: value } : photo
            )
          );
        }}
      />
    );
  }

  render(<Wrapper />);

  const card11 = screen.getByTestId("photo-card-11");
  const textbox = within(card11).getByLabelText("Review Comment");

  await user.clear(textbox);
  await user.type(textbox, "Rejected because blurry");

  expect(onReviewerCommentChange).toHaveBeenCalled();
  expect(onReviewerCommentChange).toHaveBeenLastCalledWith(11, "Rejected because blurry");
  expect(onOpenViewer).not.toHaveBeenCalled();
  expect(textbox).toHaveValue("Rejected because blurry");
});

  test("changing uploader comment calls onUploaderCommentChange and does not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();
    const onUploaderCommentChange = jest.fn();

    function Wrapper() {
      const [photos, setPhotos] = React.useState(makePhotos());

      return (
        <PhotoGrid
          photos={photos}
          getPhotoUrl={getPhotoUrl}
          onOpenViewer={onOpenViewer}
          showUploaderCommentField
          onUploaderCommentChange={(id, value) => {
            onUploaderCommentChange(id, value);
            setPhotos((prev) =>
              prev.map((photo) =>
                photo.id === id ? { ...photo, photo_comment: value } : photo
              )
            );
          }}
        />
      );
    }

    render(<Wrapper />);

    const card11 = screen.getByTestId("photo-card-11");
    const textbox = within(card11).getByLabelText("Uploader Comment");

    await user.clear(textbox);
    await user.type(textbox, "Updated uploader comment");

    expect(onUploaderCommentChange).toHaveBeenCalled();
    expect(onUploaderCommentChange).toHaveBeenLastCalledWith(11, "Updated uploader comment");
    expect(onOpenViewer).not.toHaveBeenCalled();
    expect(textbox).toHaveValue("Updated uploader comment");
  });

  test("renders approve/reject buttons when enabled and clicking them does not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();
    const onApprove = jest.fn();
    const onReject = jest.fn();

    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={onOpenViewer}
        showApproveReject
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    const card22 = screen.getByTestId("photo-card-22");

    await user.click(within(card22).getByRole("button", { name: /^approve$/i }));
    expect(onApprove).toHaveBeenCalledWith(22);

    await user.click(within(card22).getByRole("button", { name: /^reject$/i }));
    expect(onReject).toHaveBeenCalledWith(22);

    expect(onOpenViewer).not.toHaveBeenCalled();
  });

  test("approve/reject buttons still render without handlers", () => {
    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        showApproveReject
      />
    );

    const card11 = screen.getByTestId("photo-card-11");
    expect(within(card11).getByRole("button", { name: /^approve$/i })).toBeInTheDocument();
    expect(within(card11).getByRole("button", { name: /^reject$/i })).toBeInTheDocument();
  });

  test("uses custom props: title, emptyText, imageHeight, containerSx, cardSx", () => {
    render(
      <PhotoGrid
        title="My Photos"
        emptyText="Nothing"
        photos={[]}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        imageHeight={77}
        containerSx={{ p: 3 }}
        cardSx={{ borderRadius: 3 }}
      />
    );

    expect(screen.getByText("My Photos")).toBeInTheDocument();
    expect(screen.getByText("Nothing")).toBeInTheDocument();
  });

  test("clicking approve/reject without handlers does not crash and does not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();

    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={onOpenViewer}
        showApproveReject
      />
    );

    const card = screen.getByTestId("photo-card-11");

    await user.click(within(card).getByRole("button", { name: /^approve$/i }));
    await user.click(within(card).getByRole("button", { name: /^reject$/i }));

    expect(onOpenViewer).not.toHaveBeenCalled();
  });

  test("renders long uploader comment truncated in card", () => {
    const longComment = "A".repeat(150);

    render(
      <PhotoGrid
        photos={[
          {
            id: 99,
            status: "pending",
            photo_comment: longComment,
          },
        ]}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
      />
    );

    const card = screen.getByTestId("photo-card-99");

    expect(within(card).getByText(/A{20,}/)).toBeInTheDocument();
    expect(within(card).getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  test("renders reviewer comment as readonly truncated text when viewReviewerComment is enabled", () => {
    const longReviewerComment = "B".repeat(150);

    render(
      <PhotoGrid
        photos={[
          {
            id: 77,
            status: "pending",
            photo_comment: "Short uploader comment",
            reviewer_comment: longReviewerComment,
          },
        ]}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        viewReviewerComment={true}
      />
    );

    const card = screen.getByTestId("photo-card-77");

    expect(within(card).getByText("Review Comment")).toBeInTheDocument();
    expect(within(card).getByText(/B{20,}/)).toBeInTheDocument();
    expect(within(card).getAllByText(/\.\.\.$/)).toHaveLength(1);
  });
});
