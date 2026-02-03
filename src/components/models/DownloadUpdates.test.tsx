// src/components/models/DownloadUpdates.test.tsx
import React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import useFetch from "../../hooks/useFetch";
import DownloadUpdatesModal, { Clause } from "./DownloadUpdates";

// ---------- mocks ----------
jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// (optional) lightweight MUI mocks if you already have them. If not, remove this block.
// The key is: ensure your Dialog mock renders ONE backdrop per dialog instance.
jest.mock("@mui/material", () => {
  const React = require("react");
  const Dialog = ({ open, children, onClose }: any) => {
    if (!open) return null;
    return (
      <div role="dialog" data-testid="dialog">
        {children}
        <button data-testid="dialog-backdrop" type="button" onClick={() => onClose?.({}, "backdropClick")}>
          backdrop
        </button>
      </div>
    );
  };
  const DialogTitle = ({ children }: any) => <div data-testid="dialog-title">{children}</div>;
  const DialogContent = ({ children }: any) => <div data-testid="dialog-content">{children}</div>;
  const DialogActions = ({ children }: any) => <div data-testid="dialog-actions">{children}</div>;
  const Box = ({ children, ...rest }: any) => <div data-testid="mui-box" {...rest}>{children}</div>;
  const Typography = ({ children }: any) => <div data-testid="mui-typography">{children}</div>;
  const Button = ({ children, onClick, disabled, startIcon, type }: any) => (
    <button type={type || "button"} onClick={onClick} disabled={disabled}>
      {startIcon ? <span data-testid="start-icon">{startIcon}</span> : null}
      {children}
    </button>
  );
  const IconButton = ({ children, onClick, disabled }: any) => (
    <button data-testid="icon-button" type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
  const Chip = ({ label, icon }: any) => (
    <div data-testid="chip">
      {icon ? <span data-testid="chip-icon">{icon}</span> : null}
      <span data-testid="chip-label">{label}</span>
    </div>
  );
  const CircularProgress = () => <span data-testid="progress" />;
  return {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    IconButton,
    Chip,
    CircularProgress,
  };
});

jest.mock("@mui/icons-material/Download", () => ({ __esModule: true, default: (p: any) => <span data-testid="DownloadIcon" /> }));
jest.mock("@mui/icons-material/Close", () => ({ __esModule: true, default: (p: any) => <span data-testid="CloseIcon" /> }));
jest.mock("@mui/icons-material/TableView", () => ({ __esModule: true, default: (p: any) => <span data-testid="TableViewIcon" /> }));
jest.mock("@mui/icons-material/Description", () => ({ __esModule: true, default: (p: any) => <span data-testid="DescriptionIcon" /> }));
jest.mock("@mui/icons-material/FilterAlt", () => ({ __esModule: true, default: (p: any) => <span data-testid="FilterAltIcon" /> }));

// ---------- helpers ----------
const mockUseFetch = useFetch as unknown as jest.Mock;

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

function getSelectedHintContainer() {
  // This line is rendered as a Typography containing "Selected:" and <b>LABEL</b>
  // Safer than getByText("Excel (.xlsx)") because that text appears twice.
  return screen.getByText(/Selected:/).closest('[data-testid="mui-typography"]') as HTMLElement;
}

describe("DownloadUpdatesModal", () => {
  const hookState = {
    data: null as any,
    fetchData: jest.fn(),
    loading: false,
    error: null as any,
  };

  const baseClauses: Clause[] = [
    { id: "1", field: "x", op: "EQ", value: "1" },
    { id: "2", field: "y", op: "EQ", value: "2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    hookState.data = null;
    hookState.loading = false;
    hookState.error = null;
    hookState.fetchData = jest.fn();
    mockUseFetch.mockImplementation(() => hookState);
  });

  afterEach(() => {
    cleanup(); // IMPORTANT: prevents multiple dialogs/backdrops from previous tests
  });

  test("renders default (excel) + chip pluralization + selected hint", () => {
    render(
      <DownloadUpdatesModal
        open
        onClose={jest.fn()}
        apiBase="https://api"
        mode="CHANGES"
        clauses={baseClauses}
        dangerBtnSx={{}}
      />
    );

    // chip pluralization
    expect(screen.getByTestId("chip-label")).toHaveTextContent("USING CURRENT FILTERS: 2 CLAUSES");

    // default selected hint: assert within the 'Selected:' line only
    const hint = getSelectedHintContainer();
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent("Selected:");
    expect(hint).toHaveTextContent("Excel (.xlsx)");

    // also ensure the Excel tile exists (don’t assert by text)
    expect(screen.getByRole("button", { name: "Select Excel format" })).toBeInTheDocument();
  });

  test("selecting CSV via click + keyboard; other key does nothing", () => {
    render(
      <DownloadUpdatesModal
        open
        onClose={jest.fn()}
        apiBase="https://api"
        mode="CHANGES"
        clauses={[baseClauses[0]]}
        dangerBtnSx={{}}
      />
    );

    // singular clause
    expect(screen.getByTestId("chip-label")).toHaveTextContent("USING CURRENT FILTERS: 1 CLAUSE");

    const excelTile = screen.getByRole("button", { name: "Select Excel format" });
    const csvTile = screen.getByRole("button", { name: "Select CSV format" });

    // click CSV -> selected hint becomes csv (assert inside Selected line only)
    fireEvent.click(csvTile);
    expect(getSelectedHintContainer()).toHaveTextContent("CSV (.csv)");

    // keydown "Enter" on excel -> back to excel
    fireEvent.keyDown(excelTile, { key: "Enter" });
    expect(getSelectedHintContainer()).toHaveTextContent("Excel (.xlsx)");

    // keydown other key on csv -> should NOT change away from excel
    fireEvent.keyDown(csvTile, { key: "Escape" });
    expect(getSelectedHintContainer()).toHaveTextContent("Excel (.xlsx)");

    // keydown Space on csv -> change to csv
    fireEvent.keyDown(csvTile, { key: " " });
    expect(getSelectedHintContainer()).toHaveTextContent("CSV (.csv)");
  });

  test("handleDownload builds payload with current format and uses blob responseType", async () => {
    render(
      <DownloadUpdatesModal
        open
        onClose={jest.fn()}
        apiBase="https://api"
        mode="CHANGES"
        clauses={baseClauses}
        dangerBtnSx={{}}
      />
    );

    // switch to csv
    fireEvent.click(screen.getByRole("button", { name: "Select CSV format" }));
    expect(getSelectedHintContainer()).toHaveTextContent("CSV (.csv)");

    fireEvent.click(screen.getByText("Download"));
    await flush();

    expect(hookState.fetchData).toHaveBeenCalledTimes(1);
    const [payload, _p2, _p3, options] = hookState.fetchData.mock.calls[0];

    expect(payload).toEqual({ mode: "CHANGES", clauses: baseClauses, format: "csv" });
    expect(options).toEqual({ responseType: "blob" });
  });

  test("downloadError renders error panel; close/backdrop works when not loading", () => {
    hookState.error = "Some backend error";
    render(
      <DownloadUpdatesModal
        open
        onClose={jest.fn()}
        apiBase="https://api"
        mode="CHANGES"
        clauses={baseClauses}
        dangerBtnSx={{}}
      />
    );

    expect(screen.getByText("Download failed")).toBeInTheDocument();
    expect(screen.getByText("Some backend error")).toBeInTheDocument();
  });

  test("loading blocks close and format changes; backdrop click does not close (onClose not called)", () => {
    const onClose = jest.fn();
    hookState.loading = true;

    render(
      <DownloadUpdatesModal
        open
        onClose={onClose}
        apiBase="https://api"
        mode="CHANGES"
        clauses={baseClauses}
        dangerBtnSx={{}}
      />
    );

    // only one dialog/backdrop exists because cleanup() runs between tests
    const backdrop = screen.getByTestId("dialog-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    // IconButton should be disabled in loading
    expect(screen.getByTestId("icon-button")).toBeDisabled();

    // clicking tile should not change selection while loading
    fireEvent.click(screen.getByRole("button", { name: "Select CSV format" }));
    expect(getSelectedHintContainer()).toHaveTextContent("Excel (.xlsx)");
  });

  test("Blob download path: creates object URL + clicks anchor + closes; then cleanup revoke on open=false", async () => {
    const onClose = jest.fn();

    // Ensure URL methods exist in jsdom and are spyable
    if (!("createObjectURL" in URL)) {
      // @ts-expect-error
      URL.createObjectURL = jest.fn();
    }
    if (!("revokeObjectURL" in URL)) {
      // @ts-expect-error
      URL.revokeObjectURL = jest.fn();
    }

    const createSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const clickMock = jest.fn();
    const origCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: any) => {
      const el = origCreateElement(tagName);
      if (tagName === "a") {
        (el as any).click = clickMock;
      }
      return el;
    });

    const { rerender } = render(
      <DownloadUpdatesModal
        open
        onClose={onClose}
        apiBase="https://api"
        mode="CHANGES"
        clauses={baseClauses}
        dangerBtnSx={{}}
      />
    );

    // choose CSV so filename ext is csv
    fireEvent.click(screen.getByRole("button", { name: "Select CSV format" }));
    expect(getSelectedHintContainer()).toHaveTextContent("CSV (.csv)");

    // deliver blob
    hookState.data = new Blob(["one"], { type: "text/csv" });
    rerender(
      <DownloadUpdatesModal
        open
        onClose={onClose}
        apiBase="https://api"
        mode="CHANGES"
        clauses={baseClauses}
        dangerBtnSx={{}}
      />
    );

    await flush();

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    // close cleanup: rerender with open=false triggers revoke
    rerender(
      <DownloadUpdatesModal
        open={false}
        onClose={onClose}
        apiBase="https://api"
        mode="CHANGES"
        clauses={baseClauses}
        dangerBtnSx={{}}
      />
    );

    await flush();
    expect(revokeSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
