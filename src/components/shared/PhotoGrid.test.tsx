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
  },
  {
    id: 22,
    status: "rejected",
    photo_comment: "   ", // trimmed => empty => comment block should NOT render
  },
  {
    id: 33,
    status: "pending",
    // photo_comment missing => treated as "" => comment block should NOT render
  },
];

const getPhotoUrl = (id: number) => `https://example.com/photo/${id}.jpg`;

function defaultLabelFromStatus(st: "approved" | "rejected" | "pending") {
  return st === "approved" ? "Approved" : st === "rejected" ? "Rejected" : "Pending";
}

describe("PhotoGrid (100% coverage)", () => {
  test("renders default title + default emptyText when photos empty", () => {
    render(<PhotoGrid photos={[]} getPhotoUrl={getPhotoUrl} onOpenViewer={jest.fn()} />);
    expect(screen.getByText("Uploaded Photos")).toBeInTheDocument();
    expect(screen.getByText("No photos submitted.")).toBeInTheDocument();
  });

  test("renders loading state", () => {
    render(<PhotoGrid loading photos={[]} getPhotoUrl={getPhotoUrl} onOpenViewer={jest.fn()} />);
    expect(screen.getByText("Loading photos...")).toBeInTheDocument();
  });

  test("renders cards, status label default branch, ID, image url, and comment block only when trimmed comment exists", () => {
    const photos = makePhotos();
    render(<PhotoGrid photos={photos} getPhotoUrl={getPhotoUrl} onOpenViewer={jest.fn()} />);

    // Card exists
    const card11 = screen.getByTestId("photo-card-11");
    const card22 = screen.getByTestId("photo-card-22");
    const card33 = screen.getByTestId("photo-card-33");

    expect(card11).toBeInTheDocument();
    expect(card22).toBeInTheDocument();
    expect(card33).toBeInTheDocument();

    // CardMedia renders <img ...> inside Card with src=image
    // MUI CardMedia (component="img") becomes an <img> element with src.
    expect(within(card11).getByRole("img")).toHaveAttribute("src", getPhotoUrl(11));
    expect(within(card22).getByRole("img")).toHaveAttribute("src", getPhotoUrl(22));
    expect(within(card33).getByRole("img")).toHaveAttribute("src", getPhotoUrl(33));

    // Status text (use normalizeStatus output to avoid assumptions)
    const st11 = normalizeStatus(photos[0].status) as "approved" | "rejected" | "pending";
    const st22 = normalizeStatus(photos[1].status) as "approved" | "rejected" | "pending";
    const st33 = normalizeStatus(photos[2].status) as "approved" | "rejected" | "pending";

    expect(screen.getByTestId("photo-status-11")).toHaveTextContent(defaultLabelFromStatus(st11));
    expect(screen.getByTestId("photo-status-22")).toHaveTextContent(defaultLabelFromStatus(st22));
    expect(screen.getByTestId("photo-status-33")).toHaveTextContent(defaultLabelFromStatus(st33));

    // IDs shown
    expect(within(card11).getByText("ID: 11")).toBeInTheDocument();
    expect(within(card22).getByText("ID: 22")).toBeInTheDocument();
    expect(within(card33).getByText("ID: 33")).toBeInTheDocument();

    // Comment block appears only for photo 11 (trimmed non-empty)
    expect(within(card11).getByText("Comment")).toBeInTheDocument();
    expect(within(card11).getByText("Nice photo")).toBeInTheDocument();

    // For others: no "Comment" heading inside their cards
    expect(within(card22).queryByText("Comment")).not.toBeInTheDocument();
    expect(within(card33).queryByText("Comment")).not.toBeInTheDocument();

    // Download button should not be present by default
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

  test("custom statusLabel is used and statusChipSx called (covers override branches)", () => {
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

  test("download renders when onDownloadSingle is provided (even if showDownload=false), uses custom filename/mime, and does NOT open viewer", async () => {
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

    // stopPropagation prevents card click
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

    // no handler, but stopPropagation should still prevent viewer open
    expect(onOpenViewer).not.toHaveBeenCalled();
  });

  test("default downloadFilename/downloadMime fallbacks are used when custom functions not provided", async () => {
    const user = userEvent.setup();
    const onDownloadSingle = jest.fn();

    render(
      <PhotoGrid
        photos={makePhotos()}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        onDownloadSingle={onDownloadSingle}
        // no downloadFilename, no downloadMime => defaults
      />
    );

    const card33 = screen.getByTestId("photo-card-33");
    const dlBtn = within(card33).getByRole("button", { name: /^download$/i });

    await user.click(dlBtn);

    // Defaults: `photo_${id}.jpg` and "image/jpeg"
    expect(onDownloadSingle).toHaveBeenCalledWith(33, "photo_33.jpg", "image/jpeg");
  });

  test("uses custom props: title, emptyText, cardWidth/imageHeight (smoke)", () => {
    render(
      <PhotoGrid
        title="My Photos"
        emptyText="Nothing"
        photos={[]}
        getPhotoUrl={getPhotoUrl}
        onOpenViewer={jest.fn()}
        cardWidth={111}
        imageHeight={77}
        containerSx={{ p: 3 }}
        cardSx={{ borderRadius: 3 }}
      />
    );

    expect(screen.getByText("My Photos")).toBeInTheDocument();
    expect(screen.getByText("Nothing")).toBeInTheDocument();
  });
});
