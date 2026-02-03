import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import useFetch from "../../hooks/useFetch";
import DownloadMediaModal, { Clause } from "./DownloadMedias";

// ----------------------
// Mocks
// ----------------------
jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Keep tests deterministic + avoid real MUI portals/complexity
jest.mock("@mui/material", () => {
  const React = require("react");

  const Dialog = ({ open, children, onClose }: any) => {
    if (!open) return null;
    return (
      <div role="dialog" data-testid="dialog">
        {children}
        {/* Lets us explicitly trigger Dialog onClose to test closeSafe */}
        <button
          type="button"
          data-testid="dialog-backdrop"
          onClick={() => onClose?.({}, "backdropClick")}
        >
          backdrop
        </button>
      </div>
    );
  };

  const DialogTitle = ({ children }: any) => <div data-testid="dialog-title">{children}</div>;
  const DialogContent = ({ children }: any) => <div data-testid="dialog-content">{children}</div>;
  const DialogActions = ({ children }: any) => <div data-testid="dialog-actions">{children}</div>;

  const Box = ({ children, ...rest }: any) => (
    <div data-testid="mui-box" {...rest}>
      {children}
    </div>
  );

  const Typography = ({ children }: any) => <div data-testid="mui-typography">{children}</div>;

  const Button = ({ children, onClick, disabled, startIcon, type, ...rest }: any) => (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      data-testid={rest["data-testid"] || undefined}
    >
      {startIcon ? <span data-testid="start-icon">{startIcon}</span> : null}
      {children}
    </button>
  );

  const Chip = ({ label }: any) => <span data-testid="chip">{String(label)}</span>;

  const Divider = () => <hr data-testid="divider" />;

  const FormControl = ({ children }: any) => <div data-testid="form-control">{children}</div>;
  const InputLabel = ({ children }: any) => <label data-testid="input-label">{children}</label>;

  const MenuItem = ({ value, children }: any) => <option value={value}>{children}</option>;

  const Select = ({ value, onChange, disabled, children }: any) => (
    <select
      data-testid="media-type-select"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {children}
    </select>
  );

  const Switch = ({ checked, onChange, disabled }: any) => (
    <input
      data-testid="switch"
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );

  const CircularProgress = () => <span data-testid="progress" />;

  return {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Button,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Typography,
    CircularProgress,
    useTheme: () => ({ palette: { text: { secondary: "#666" } } }),
    useMediaQuery: () => false,
  };
});

// ----------------------
// Helpers
// ----------------------
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("DownloadMediaModal", () => {
  const mockUseFetch = useFetch as unknown as jest.Mock;

  let hookState: {
    data: any;
    fetchData: jest.Mock;
    loading: boolean;
    error: any;
  };

  let onClose: jest.Mock;

  // URL polyfill (JSDOM in CRA often lacks these)
  const originalCreate = (URL as any).createObjectURL;
  const originalRevoke = (URL as any).revokeObjectURL;

  let anchorClickSpy: jest.SpyInstance;
  let createElSpy: jest.SpyInstance;
  let lastAnchor: HTMLAnchorElement | null = null;

  beforeAll(() => {
    // Safe polyfill/mocks
    if (!(URL as any).createObjectURL) {
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        writable: true,
        value: jest.fn(() => "blob:mock"),
      });
    }
    if (!(URL as any).revokeObjectURL) {
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        writable: true,
        value: jest.fn(() => {}),
      });
    }
  });

  afterAll(() => {
    // restore originals if they existed
    if (originalCreate) (URL as any).createObjectURL = originalCreate;
    if (originalRevoke) (URL as any).revokeObjectURL = originalRevoke;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-28T12:34:56.789Z"));

    onClose = jest.fn();

    hookState = {
      data: null,
      fetchData: jest.fn().mockResolvedValue(undefined),
      loading: false,
      error: null,
    };

    mockUseFetch.mockImplementation(() => hookState);

    // Track anchor + click
    anchorClickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const originalCreateElement = document.createElement.bind(document);
    createElSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: any) => {
      const el = originalCreateElement(tagName);
      if (String(tagName).toLowerCase() === "a") {
        lastAnchor = el as HTMLAnchorElement;
      }
      return el;
    });

    // reset URL mocks each test
    (URL as any).createObjectURL.mockClear?.();
    (URL as any).revokeObjectURL.mockClear?.();
    lastAnchor = null;
  });

  afterEach(() => {
    anchorClickSpy.mockRestore();
    createElSpy.mockRestore();
    jest.useRealTimers();
  });

  test("renders defaults + summary chips + shows warning when no filters selected (clauses undefined)", () => {
    render(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={undefined}
      />
    );

    // dialog title text
    expect(screen.getByText("Download Photos & Documents")).toBeInTheDocument();

    // default summary chips
    expect(screen.getByText("Media: all")).toBeInTheDocument();
    expect(screen.getByText("Group by user: Yes")).toBeInTheDocument();
    expect(screen.getByText("Group by type: Yes")).toBeInTheDocument();
    expect(screen.getByText("Only approved: No")).toBeInTheDocument();
    expect(screen.getByText("Filters: 0")).toBeInTheDocument();

    // warning shown when no requestId and 0 filters
    expect(
      screen.getByText("No filters selected. This will download media for all matching requests.")
    ).toBeInTheDocument();
  });

  test("spinner branch: when loading=true, shows Preparing ZIP... and disables close/cancel/download", () => {
    hookState.loading = true;

    render(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={[]}
      />
    );

    expect(screen.getByText("Preparing ZIP...")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();

    // buttons disabled in markup (native disabled prevents click)
    expect(screen.getByText("Close")).toBeDisabled();
    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(screen.getByText("Preparing ZIP...")).toBeDisabled();

    // closeSafe also blocks Dialog onClose while loading
    fireEvent.click(screen.getByTestId("dialog-backdrop"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("zipError surfaces; closeSafe clears localErr and calls onClose when not loading (Cancel button)", async () => {
    hookState.error = "boom-error";

    render(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={[]}
      />
    );

    // zipError useEffect -> localErr visible
    expect(await screen.findByText("boom-error")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);

    // localErr cleared even if parent doesn't close immediately
    expect(screen.queryByText("boom-error")).not.toBeInTheDocument();
  });

  test("download flow (clauses path): builds body, calls fetchZip with blob responseType, then downloads Blob once and closes", async () => {
    const clauses: Clause[] = [
      { id: "c1", field: "status", op: "EQ", value: "Approved" },
    ];

    const { rerender } = render(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={clauses}
      />
    );

    // change mediaType to documents to cover select + buildZipName kind branch
    fireEvent.change(screen.getByTestId("media-type-select"), {
      target: { value: "document" },
    });
    expect(screen.getByText("Media: document")).toBeInTheDocument();

    // toggle Group by User off (covers ToggleRow onChange path)
    const switches = screen.getAllByTestId("switch");
    expect(switches.length).toBeGreaterThanOrEqual(3);
    fireEvent.click(switches[0]); // Group by User
    expect(screen.getByText("Group by user: No")).toBeInTheDocument();

    // click Download
    fireEvent.click(screen.getByText("Download ZIP"));
    await flush();

    // fetchZip called with correct args
    expect(hookState.fetchData).toHaveBeenCalledTimes(1);
    const call = hookState.fetchData.mock.calls[0];
    expect(call[0]).toMatchObject({
      document_type: "document",
      categorize_by_user: false,
      categorize_by_type: true,
      only_approved: false,
      clauses,
    });
    expect(call[1]).toBeUndefined();
    expect(call[2]).toBe(false);
    expect(call[3]).toMatchObject({ responseType: "blob" });

    // simulate blob arrival
    const blob = new Blob(["zip"], { type: "application/zip" });
    hookState.data = blob;

    rerender(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={clauses}
      />
    );

    // download triggered
    expect((URL as any).createObjectURL).toHaveBeenCalledTimes(1);
    expect((URL as any).createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    // file name should be safe (no ':'), should include kind + .zip
    expect(lastAnchor).not.toBeNull();
    expect(lastAnchor!.download).toContain("documents");
    expect(lastAnchor!.download.endsWith(".zip")).toBe(true);
    expect(lastAnchor!.download.includes(":")).toBe(false);
    expect(lastAnchor!.download.includes(" ")).toBe(false);

    // revoke after timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect((URL as any).revokeObjectURL).toHaveBeenCalledTimes(1);

    // rerender again with same nonce/data: should NOT download again
    rerender(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={clauses}
      />
    );
    expect((URL as any).createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
  });

  test("download flow (requestId path): body includes request_ids and summary shows Request: <id>; supports {blob: Blob} shape", async () => {
    const requestId = 77;

    const { rerender } = render(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        requestId={requestId}
        clauses={[{ id: "c1", field: "x", op: "EQ", value: "y" }]}
      />
    );

    expect(screen.getByText(`Request: ${requestId}`)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Download ZIP"));
    await flush();

    const body = hookState.fetchData.mock.calls[0][0];
    expect(body).toMatchObject({
      document_type: "all",
      categorize_by_user: true,
      categorize_by_type: true,
      only_approved: false,
      request_ids: [requestId],
    });
    expect(body.clauses).toBeUndefined();

    // blob response as object { blob: Blob }
    const blob = new Blob(["zip2"], { type: "application/zip" });
    hookState.data = { blob };

    rerender(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        requestId={requestId}
      />
    );

    expect((URL as any).createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("non-blob response after download trigger shows file error and does not close", async () => {
    const { rerender } = render(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={[]}
      />
    );

    fireEvent.click(screen.getByText("Download ZIP"));
    await flush();

    // simulate bad response
    hookState.data = { foo: "bar" };

    rerender(
      <DownloadMediaModal
        open
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={[]}
      />
    );

    expect(
      screen.getByText("ZIP download failed: response was not a file.")
    ).toBeInTheDocument();
    expect((URL as any).createObjectURL).not.toHaveBeenCalled();
    expect(anchorClickSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("when open=false, blob presence does not trigger download effect", () => {
    hookState.data = new Blob(["zip"], { type: "application/zip" });

    render(
      <DownloadMediaModal
        open={false}
        onClose={onClose}
        apiBase="https://example.com/api"
        clauses={[]}
      />
    );

    expect((URL as any).createObjectURL).not.toHaveBeenCalled();
    expect(anchorClickSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
