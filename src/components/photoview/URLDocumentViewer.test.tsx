/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import DocumentUrlViewerModal from "./URLDocumentViewer";

/**
 * Mock colors (component imports these)
 */
jest.mock("../../constants/colors", () => ({
  __esModule: true,
  color_light_gray: "#eee",
  color_secondary: "#00f",
  color_secondary_dark: "#009",
  color_text_light: "#666",
  color_text_primary: "#111",
  color_white: "#fff",
}));

/**
 * Mock MUI to avoid portals/Tooltip complexity and keep DOM stable
 */
jest.mock("@mui/material", () => {
  const React = require("react");

  const Dialog = ({ open, children }: any) =>
    open ? (
      <div role="dialog" data-testid="dialog">
        {children}
      </div>
    ) : null;

  const Box = ({ children, ...rest }: any) => (
    <div data-testid="box" {...rest}>
      {children}
    </div>
  );

  const Typography = ({ children, ...rest }: any) => (
    <div data-testid="typography" {...rest}>
      {children}
    </div>
  );

  const Button = ({ children, onClick, disabled, startIcon }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {startIcon ? <span data-testid="startIcon">{startIcon}</span> : null}
      {children}
    </button>
  );

  const Divider = () => <hr data-testid="divider" />;

  const IconButton = ({ children, onClick, disabled, "aria-label": ariaLabel }: any) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );

  const Tooltip = ({ children }: any) => <>{children}</>;

  return {
    __esModule: true,
    Dialog,
    Box,
    Typography,
    Button,
    Divider,
    IconButton,
    Tooltip,
  };
});

/**
 * Mock icons as simple spans
 */
jest.mock("@mui/icons-material/OpenInNew", () => ({
  __esModule: true,
  default: () => <span data-testid="OpenInNewIcon" />,
}));
jest.mock("@mui/icons-material/Download", () => ({
  __esModule: true,
  default: () => <span data-testid="DownloadIcon" />,
}));
jest.mock("@mui/icons-material/Close", () => ({
  __esModule: true,
  default: () => <span data-testid="CloseIcon" />,
}));
jest.mock("@mui/icons-material/ZoomIn", () => ({
  __esModule: true,
  default: () => <span data-testid="ZoomInIcon" />,
}));
jest.mock("@mui/icons-material/ZoomOut", () => ({
  __esModule: true,
  default: () => <span data-testid="ZoomOutIcon" />,
}));
jest.mock("@mui/icons-material/RestartAlt", () => ({
  __esModule: true,
  default: () => <span data-testid="RestartAltIcon" />,
}));

describe("DocumentUrlViewerModal (stable)", () => {
  const onClose = jest.fn();
  const openSpy = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Ensure window.open exists + is spyable in jsdom
    Object.defineProperty(window, "open", {
      writable: true,
      value: openSpy,
    });
  });

  afterEach(() => cleanup());

  function setupDownloadCapture() {
    const realCreate = document.createElement.bind(document);

    let createdA: HTMLAnchorElement | null = null;
    const createSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: any) => {
      const el = realCreate(tagName);
      if (String(tagName).toLowerCase() === "a") createdA = el as HTMLAnchorElement;
      return el;
    });

    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    return {
      getAnchor: () => createdA,
      restore: () => {
        createSpy.mockRestore();
        clickSpy.mockRestore();
      },
      clickSpy,
    };
  }

  test("returns null when url is empty/whitespace", () => {
    render(
      <DocumentUrlViewerModal open={true} url={"   "} onClose={onClose} />
    );
    expect(screen.getByText("No document URL provided.")).toBeInTheDocument();
    expect(screen.getByText("Please close and try again.")).toBeInTheDocument();
  });

  test("PDF: decodes filename, shows mime, renders iframe, Open+Download+Close work", () => {
    const url = "https://example.com/files/Report%20One.pdf?token=123";
    const safeUrl = url; // already https

    const dl = setupDownloadCapture();

    render(<DocumentUrlViewerModal open={true} url={url} onClose={onClose} />);

    expect(screen.getByTestId("dialog")).toBeInTheDocument();

    // header title uses decoded filename (no title prop)
    expect(screen.getByText("Report One.pdf")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();

    // pdf iframe
    const iframe = screen.getByTitle("document-preview") as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute("src")).toBe(safeUrl);

    // Open
    fireEvent.click(screen.getByRole("button", { name: /Open/i }));
    expect(openSpy).toHaveBeenCalledWith(safeUrl, "_blank", "noopener,noreferrer");

    // Download
    fireEvent.click(screen.getByRole("button", { name: /Download/i }));

    expect(dl.clickSpy).toHaveBeenCalled();

    const a = dl.getAnchor();
    expect(a).toBeTruthy();
    expect(a?.download).toBe("Report One.pdf");
    expect(a?.target).toBe("_blank");
    expect(a?.rel).toBe("noopener noreferrer");
    expect(a?.href).toContain("https://example.com/files/Report%20One.pdf?token=123");

    // Close
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onClose).toHaveBeenCalled();

    dl.restore();
  });

  test("Image: www.* normalized to https, renders img, zoom clamp + reset", () => {
    const url = "www.example.com/images/photo.png";
    const safeUrl = "https://www.example.com/images/photo.png";

    render(<DocumentUrlViewerModal open={true} url={url} onClose={onClose} />);

    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(screen.getByText("image/png")).toBeInTheDocument();

    const img = screen.getByAltText("photo.png") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe(safeUrl);

    // Starts at 100%
    expect(screen.getByText("100%")).toBeInTheDocument();

    const zoomInBtn = screen.getByTestId("ZoomInIcon").closest("button")!;
    const zoomOutBtn = screen.getByTestId("ZoomOutIcon").closest("button")!;
    const resetBtn = screen.getByTestId("RestartAltIcon").closest("button")!;

    // At min => zoom out disabled
    expect(zoomOutBtn).toBeDisabled();

    // Zoom in to max (4.0 => 400%)
    for (let i = 0; i < 20; i++) fireEvent.click(zoomInBtn);
    expect(screen.getByText("400%")).toBeInTheDocument();
    expect(zoomInBtn).toBeDisabled();

    // Zoom out some
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText("375%")).toBeInTheDocument();

    // Reset
    fireEvent.click(resetBtn);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(zoomOutBtn).toBeDisabled();
  });

  test("Fallback: non-pdf and non-image shows fallback UI; header+fallback Open/Download call handlers", () => {
    const url = "https://example.com/files/readme.txt";

    const dl = setupDownloadCapture();

    render(<DocumentUrlViewerModal open={true} url={url} onClose={onClose} />);

    expect(screen.getByText("readme.txt")).toBeInTheDocument();
    expect(screen.getByText("text/plain")).toBeInTheDocument();
    expect(screen.getByText("Preview not available for this file type.")).toBeInTheDocument();

    // There are 2 Open and 2 Download buttons (header + fallback)
    const openBtns = screen.getAllByRole("button", { name: /Open/i });
    const downloadBtns = screen.getAllByRole("button", { name: /Download/i });

    fireEvent.click(openBtns[0]);
    fireEvent.click(openBtns[1]);
    expect(openSpy).toHaveBeenCalledTimes(2);

    fireEvent.click(downloadBtns[0]);
    fireEvent.click(downloadBtns[1]);
    expect(dl.clickSpy).toHaveBeenCalledTimes(2);

    dl.restore();
  });

  test("relative url triggers getFileNameFromUrl catch() branch (pdf)", () => {
    render(<DocumentUrlViewerModal open={true} url={"local.pdf"} onClose={onClose} />);

    expect(screen.getByText("local.pdf")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
    expect(screen.getByTitle("document-preview")).toBeInTheDocument();
  });

  test("unknown extension => mime shows 'unknown' and fallback renders", () => {
    render(<DocumentUrlViewerModal open={true} url={"https://x.com/file.bin"} onClose={onClose} />);

    expect(screen.getByText("file.bin")).toBeInTheDocument();
    expect(screen.getByText("unknown")).toBeInTheDocument();
    expect(screen.getByText("Preview not available for this file type.")).toBeInTheDocument();
  });

  test("empty filename (trailing slash) covers guessMimeFromFilename(!name) path", () => {
    render(<DocumentUrlViewerModal open={true} url={"https://example.com/"} onClose={onClose} />);
    expect(screen.getByText("Document")).toBeInTheDocument();
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  test.each([
    ["https://x.com/a.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["https://x.com/a.doc", "application/msword"],
    ["https://x.com/a.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ["https://x.com/a.xls", "application/vnd.ms-excel"],
    ["https://x.com/a.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    ["https://x.com/a.ppt", "application/vnd.ms-powerpoint"],
    ["https://x.com/a.csv", "text/csv"],
    ["https://x.com/a.json", "application/json"],
    ["https://x.com/a.webp", "image/webp"],
    ["https://x.com/a.jpg", "image/jpeg"],
    ["https://x.com/a.jpeg", "image/jpeg"],
  ])("mime detection for %s -> %s", (url, expected) => {
    render(<DocumentUrlViewerModal open={true} url={url} onClose={onClose} />);
    const filename = url.split("/").pop()!;
    expect(screen.getByText(filename)).toBeInTheDocument();
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
