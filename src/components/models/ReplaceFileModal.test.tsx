// src/components/models/ReplaceFileModal.test.tsx
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import ReplaceFileModal from "./ReplaceFileModal";

/**
 * ---------------------------
 * Mocks (CRA-safe: use mock*)
 * ---------------------------
 */

// colors
jest.mock("../../constants/colors", () => ({
  __esModule: true,
  color_background: "#FFFFFF",
  color_secondary: "#004B9C",
}));

// toast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

// Loader
jest.mock("../Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => (
    <div data-testid="loader">{loading ? "loading" : "idle"}</div>
  ),
}));

// Icons
jest.mock("@mui/icons-material/Close", () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="CloseIcon" {...props} />,
}));
jest.mock("@mui/icons-material/CloudUploadOutlined", () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="CloudUploadOutlinedIcon" {...props} />,
}));

// styled() mock
jest.mock("@mui/material/styles", () => {
  const React = require("react");

  const styled =
    (Tag: any) =>
    (_styles?: any) => {
      const Comp = React.forwardRef(({ children, ...props }: any, ref: any) => {
        const cleanProps: any = { ...props };
        Object.keys(cleanProps).forEach((k) => {
          // Remove transient props like $drag so they don't leak to DOM
          if (k.startsWith("$")) delete cleanProps[k];
        });

        return React.createElement(Tag, { ref, ...cleanProps }, children);
      });

      Comp.displayName = "MockStyled";
      return Comp;
    };

  return { __esModule: true, styled };
});

// MUI (simplify DOM + no portals)
jest.mock("@mui/material", () => {
  const React = require("react");

  const Dialog = ({ open, onClose, children }: any) =>
    open ? (
      <div role="dialog" data-testid="dialog">
        {children}
        {/* helper to call onClose in tests */}
        <button type="button" data-testid="dialog-onclose" onClick={onClose}>
          dialog-onclose
        </button>
      </div>
    ) : null;

  const DialogTitle = ({ children }: any) => (
    <div data-testid="dialog-title">{children}</div>
  );
  const DialogContent = ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  );
  const DialogActions = ({ children }: any) => (
    <div data-testid="dialog-actions">{children}</div>
  );

  const Typography = ({ children }: any) => (
    <div data-testid="typography">{children}</div>
  );

  const Box = ({ children, ...rest }: any) => (
    <div data-testid="box" {...rest}>
      {children}
    </div>
  );

  const IconButton = ({ children, onClick, ...rest }: any) => (
    <button
      type="button"
      data-testid="icon-button"
      onClick={onClick}
      disabled={Boolean(rest.disabled)}
      aria-disabled={Boolean(rest.disabled)}
      {...rest}
    >
      {children}
    </button>
  );

  // IMPORTANT: forward disabled reliably (CRA/jest-dom toBeDisabled)
  const Button = ({ children, onClick, ...rest }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={Boolean(rest.disabled)}
      aria-disabled={Boolean(rest.disabled)}
      {...rest}
    >
      {children}
    </button>
  );

  return {
    __esModule: true,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
  };
});

/**
 * useFetch mock
 */
type FetchState = {
  loading: boolean;
  data: any;
  error: any;
};

let mockFetchState: FetchState;
const mockFetchData = jest.fn();

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: () => ({
    loading: mockFetchState.loading,
    data: mockFetchState.data,
    error: mockFetchState.error,
    fetchData: mockFetchData,
  }),
}));

function setFetch(next: Partial<FetchState>) {
  mockFetchState = { ...mockFetchState, ...next };
}

describe("ReplaceFileModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchState = { loading: false, data: undefined, error: undefined };
  });

  afterEach(() => cleanup());

  const baseFile = { id: 123, filename: "main.xlsx", version: 5 };

  test("renders title + description; Replace button disabled when no selectedFile", () => {
    const onClose = jest.fn();
    const refresh = jest.fn();

    render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    expect(screen.getByTestId("loader")).toHaveTextContent("idle");
    expect(screen.getByText("Replace main.xlsx")).toBeInTheDocument();

    // description includes file name
    expect(
      screen.getByText(
        /Please select a new file to replace main\.xlsx\./i
      )
    ).toBeInTheDocument();

    // default drop text
    expect(screen.getByText("Click or drag a file here")).toBeInTheDocument();

    const replaceBtn = screen.getByRole("button", { name: "Replace File" });
    expect(replaceBtn).toBeDisabled();
  });

  test("Cancel calls onClose and resets selected file text", () => {
    const onClose = jest.fn();
    const refresh = jest.fn();

    const { container } = render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    const input = container.querySelector("#replace-file-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const f = new File(["hello"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [f] } });

    // selected filename should show
    expect(screen.getByText("doc.pdf")).toBeInTheDocument();

    // cancel should reset local state + call onClose
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // state reset in modal (still rendered because open prop didn't change)
    expect(screen.getByText("Click or drag a file here")).toBeInTheDocument();
  });

  test("handleReplace guard: (1) no selectedFile => disabled and no fetch; (2) file=null => click does nothing", () => {
    const onClose = jest.fn();
    const refresh = jest.fn();

    // (1) file exists, no selectedFile
    const { rerender, container } = render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    const replaceBtn1 = screen.getByRole("button", { name: "Replace File" });
    expect(replaceBtn1).toBeDisabled();
    fireEvent.click(replaceBtn1);
    expect(mockFetchData).not.toHaveBeenCalled();

    // (2) selectedFile exists but file is null -> button enabled, guard prevents fetch
    const input = container.querySelector("#replace-file-input") as HTMLInputElement;
    const f = new File(["x"], "x.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [f] } });

    rerender(<ReplaceFileModal open={true} onClose={onClose} file={null} refresh={refresh} />);

    const replaceBtn2 = screen.getByRole("button", { name: "Replace File" });
    expect(replaceBtn2).not.toBeDisabled();
    fireEvent.click(replaceBtn2);
    expect(mockFetchData).not.toHaveBeenCalled();
  });

  test("handleReplace sends FormData with file + id when selectedFile and file present", () => {
    const onClose = jest.fn();
    const refresh = jest.fn();

    const { container } = render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    const input = container.querySelector("#replace-file-input") as HTMLInputElement;
    const f = new File(["abc"], "new.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [f] } });

    const replaceBtn = screen.getByRole("button", { name: "Replace File" });
    expect(replaceBtn).not.toBeDisabled();

    fireEvent.click(replaceBtn);

    expect(mockFetchData).toHaveBeenCalledTimes(1);
    const arg = mockFetchData.mock.calls[0][0];
    expect(arg).toBeInstanceOf(FormData);
    expect((arg as FormData).get("id")).toBe("123");

    const uploaded = (arg as FormData).get("file") as File;
    expect(uploaded).toBeInstanceOf(File);
    expect(uploaded.name).toBe("new.pdf");
  });

  test("success path: when data returns -> onClose + refresh + toast.success; resets selected file text", async () => {
    const onClose = jest.fn();
    const refresh = jest.fn();

    const { rerender, container } = render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    const input = container.querySelector("#replace-file-input") as HTMLInputElement;
    const f = new File(["abc"], "picked.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [f] } });
    expect(screen.getByText("picked.pdf")).toBeInTheDocument();

    setFetch({ data: { message: "Replaced!" } });
    rerender(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess).toHaveBeenCalledWith("Replaced!");
    });

    // local state reset (still rendered because open prop didn't change)
    expect(screen.getByText("Click or drag a file here")).toBeInTheDocument();
  });

  test("error path: when error returns -> toast.error called", async () => {
    const onClose = jest.fn();
    const refresh = jest.fn();

    const { rerender } = render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    setFetch({ error: "Backend error" });
    rerender(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Backend error");
    });
  });

  test("drag/drop: dropping a file sets selected filename", () => {
    const onClose = jest.fn();
    const refresh = jest.fn();

    render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    const label = screen.getByText("Click or drag a file here").closest("label");
    expect(label).toBeTruthy();

    const dropped = new File(["z"], "drop.pdf", { type: "application/pdf" });

    // dragOver -> should not crash
    fireEvent.dragOver(label as Element, { preventDefault: () => {}, stopPropagation: () => {} });

    // drop -> should select
    fireEvent.drop(label as Element, {
      preventDefault: () => {},
      stopPropagation: () => {},
      dataTransfer: { files: [dropped] },
    });

    expect(screen.getByText("drop.pdf")).toBeInTheDocument();
  });

  test("header close icon triggers onClose via handleCancel", () => {
    const onClose = jest.fn();
    const refresh = jest.fn();

    render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    fireEvent.click(screen.getByTestId("icon-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("loading true disables actions and Loader shows loading", () => {
    const onClose = jest.fn();
    const refresh = jest.fn();
    setFetch({ loading: true });

    render(
      <ReplaceFileModal open={true} onClose={onClose} file={baseFile} refresh={refresh} />
    );

    expect(screen.getByTestId("loader")).toHaveTextContent("loading");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace File" })).toBeDisabled();
  });
});
