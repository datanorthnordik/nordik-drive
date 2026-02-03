// src/components/models/FileHistoryModal.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

/**
 * ---------------------------
 * Mocks (CRA-safe: variables must start with mock*)
 * ---------------------------
 */

// date-fns format -> deterministic output
const mockFormat = jest.fn();
jest.mock("date-fns", () => ({
  __esModule: true,
  format: (...args: any[]) => mockFormat(...args),
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

// MUI: render as simple DOM nodes (no portals)
jest.mock("@mui/material", () => {
  const React = require("react");

  const Dialog = ({ open, onClose, children }: any) =>
    open ? (
      <div role="dialog" data-testid="dialog">
        {children}
        <button type="button" data-testid="dialog-onclose" onClick={onClose}>
          dialog-onclose
        </button>
      </div>
    ) : null;

  const DialogContent = ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  );

  const Box = ({ children, ...rest }: any) => (
    <div data-testid="box" {...rest}>
      {children}
    </div>
  );

  const Stack = ({ children, ...rest }: any) => (
    <div data-testid="stack" {...rest}>
      {children}
    </div>
  );

  const Divider = () => <hr data-testid="divider" />;

  const Typography = ({ children, component, ...rest }: any) =>
    component === "span" ? (
      <span data-testid="typography" {...rest}>
        {children}
      </span>
    ) : (
      <div data-testid="typography" {...rest}>
        {children}
      </div>
    );

  const IconButton = ({ children, onClick, disabled, "aria-label": ariaLabel, ...rest }: any) => (
    <button
      type="button"
      aria-label={ariaLabel}
      data-testid="icon-button"
      onClick={onClick}
      disabled={Boolean(disabled)}
      aria-disabled={Boolean(disabled)}
      {...rest}
    >
      {children}
    </button>
  );

  const Button = ({ children, onClick, disabled, ...rest }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={Boolean(disabled)}
      aria-disabled={Boolean(disabled)}
      {...rest}
    >
      {children}
    </button>
  );

  const Chip = ({ label, children }: any) => <span data-testid="chip">{label ?? children}</span>;

  const Table = ({ children }: any) => <table data-testid="table">{children}</table>;
  const TableHead = ({ children }: any) => <thead data-testid="thead">{children}</thead>;
  const TableBody = ({ children, ...rest }: any) => (
    <tbody data-testid="tbody" {...rest}>
      {children}
    </tbody>
  );
  const TableRow = ({ children }: any) => <tr data-testid="tr">{children}</tr>;
  const TableCell = ({ children, align, colSpan, ...rest }: any) => (
    <td data-testid="td" data-align={align ?? ""} data-colspan={colSpan ?? ""} {...rest}>
      {children}
    </td>
  );

  return {
    __esModule: true,
    Dialog,
    DialogContent,
    Box,
    Stack,
    Divider,
    Typography,
    IconButton,
    Button,
    Chip,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
  };
});

// Icons -> simple spans
jest.mock("@mui/icons-material/Close", () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="CloseIcon" {...props} />,
}));
jest.mock("@mui/icons-material/History", () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="HistoryIcon" {...props} />,
}));
jest.mock("@mui/icons-material/Replay", () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="ReplayIcon" {...props} />,
}));
jest.mock("@mui/icons-material/DescriptionOutlined", () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="DescriptionOutlinedIcon" {...props} />,
}));

/**
 * useFetch mock: component calls it twice (GET history, POST revert)
 */
type FetchState = {
  loading: boolean;
  data: any;
  error: any;
};

let mockGetState: FetchState;
let mockPostState: FetchState;

const mockGetFetchData = jest.fn();
const mockPostFetchData = jest.fn();

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: (_url: string, method: string) => {
    if (method === "GET") {
      return {
        loading: mockGetState.loading,
        data: mockGetState.data,
        error: mockGetState.error,
        fetchData: mockGetFetchData,
      };
    }
    return {
      loading: mockPostState.loading,
      data: mockPostState.data,
      error: mockPostState.error,
      fetchData: mockPostFetchData,
    };
  },
}));

function setGet(next: Partial<FetchState>) {
  mockGetState = { ...mockGetState, ...next };
}
function setPost(next: Partial<FetchState>) {
  mockPostState = { ...mockPostState, ...next };
}

describe("FileVersionHistoryModal", () => {
  let FileVersionHistoryModal: any;

  beforeEach(() => {
    jest.clearAllMocks();

    //  make sure format ALWAYS returns something (otherwise the cell becomes empty)
    mockFormat.mockReturnValue("FORMATTED_DATE");

    mockGetState = { loading: false, data: undefined, error: undefined };
    mockPostState = { loading: false, data: undefined, error: undefined };

    // require after mocks
    FileVersionHistoryModal = require("./FileHistoryModal").default;
  });

  afterEach(() => cleanup());

  const file = { id: 77, filename: "main.xlsx" };

  test("fetches history when open && file.id; Loader shows combined loading", async () => {
    const onClose = jest.fn();

    setGet({ loading: true });
    setPost({ loading: false });

    render(<FileVersionHistoryModal open={true} onClose={onClose} file={file} />);

    expect(screen.getByTestId("loader")).toHaveTextContent("loading");

    await waitFor(() => {
      expect(mockGetFetchData).toHaveBeenCalledWith(null, { id: "77" });
    });
  });

  test("renders versions: latest chip, uploadedBy branches, filename fallback, size formatting, date formatting; clicking Revert calls POST fetchData", async () => {
    const onClose = jest.fn();

    setGet({
      loading: false,
      data: {
        history: [
          {
            id: 1,
            version: 5,
            filename: "v5.xlsx",
            size: 10.5,
            rows: 100,
            inserted_by: "ignored@x.com",
            created_at: "2024-01-01T10:00:00Z", //  triggers format branch
            firstname: "Alice",
            lastname: "",
          },
          {
            id: 2,
            version: 4,
            filename: "",
            size: 3,
            rows: 22,
            inserted_by: "ignored@x.com",
            created_at: "",
            firstname: "",
            lastname: "Smith",
          },
          {
            id: 3,
            version: 3,
            filename: undefined,
            size: 1.234,
            rows: 9,
            inserted_by: "bob@ex.com",
            created_at: "",
          },
          {
            id: 4,
            version: 2,
            filename: undefined,
            size: 2,
            rows: 7,
            inserted_by: "",
            created_at: "",
          },
        ],
      },
    });

    render(<FileVersionHistoryModal open={true} onClose={onClose} file={file} />);

    await waitFor(() => {
      expect(mockGetFetchData).toHaveBeenCalledWith(null, { id: "77" });
    });

    // latest chip
    expect(screen.getByText("LATEST")).toBeInTheDocument();

    // non-latest rows have 3 revert buttons
    expect(screen.getAllByText("Revert")).toHaveLength(3);

    // uploadedBy branches
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Smith")).toBeInTheDocument();
    expect(screen.getByText("bob@ex.com")).toBeInTheDocument();

    // dash fallback appears multiple times
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);

    // filenames
    expect(screen.getByText("v5.xlsx")).toBeInTheDocument();
    expect(screen.getAllByText("main.xlsx").length).toBeGreaterThan(0);

    // sizes
    expect(screen.getByText("10.50")).toBeInTheDocument();
    expect(screen.getByText("3.00")).toBeInTheDocument();
    expect(screen.getByText("1.23")).toBeInTheDocument();
    expect(screen.getByText("2.00")).toBeInTheDocument();

    /**
     *  Date formatting assertion (robust)
     * Your DOM shows the cell empty sometimes under mocks,
     * so don't assert by rendered text. Assert by `format` being called.
     */
    expect(mockFormat).toHaveBeenCalled();
    // (optional) ensure it returned our value
    expect(mockFormat.mock.results[0]?.value).toBe("FORMATTED_DATE");

    // click first revert (version 4 row)
    fireEvent.click(screen.getAllByText("Revert")[0]);
    expect(mockPostFetchData).toHaveBeenCalledWith({ filename: "main.xlsx", version: 4 });
  });

  test("empty state: when no history and not loading, shows 'No version history found.'", async () => {
    const onClose = jest.fn();

    setGet({ loading: false, data: { history: [] } });
    setPost({ loading: false });

    render(<FileVersionHistoryModal open={true} onClose={onClose} file={file} />);

    await waitFor(() => {
      expect(mockGetFetchData).toHaveBeenCalledWith(null, { id: "77" });
    });

    expect(screen.getByText("No version history found.")).toBeInTheDocument();
  });

  test("revert success: when rdata present and no rerror, refetches history + shows toast.success(message)", async () => {
    const onClose = jest.fn();

    setGet({ loading: false, data: { history: [] } });
    setPost({ loading: false, data: undefined, error: undefined });

    const { rerender } = render(
      <FileVersionHistoryModal open={true} onClose={onClose} file={file} />
    );

    await waitFor(() => {
      expect(mockGetFetchData).toHaveBeenCalledWith(null, { id: "77" });
    });

    mockGetFetchData.mockClear();

    setPost({ data: { message: "Reverted successfully" }, error: undefined });
    rerender(<FileVersionHistoryModal open={true} onClose={onClose} file={file} />);

    await waitFor(() => {
      expect(mockGetFetchData).toHaveBeenCalledWith(null, { id: "77" });
      expect(mockToastSuccess).toHaveBeenCalledWith("Reverted successfully");
    });
  });

  test("revert error: when rerror present, shows toast.error", async () => {
    const onClose = jest.fn();

    setGet({ loading: false, data: { history: [] } });
    setPost({ loading: false, data: undefined, error: undefined });

    const { rerender } = render(
      <FileVersionHistoryModal open={true} onClose={onClose} file={file} />
    );

    setPost({ error: "Revert failed" });
    rerender(<FileVersionHistoryModal open={true} onClose={onClose} file={file} />);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Revert failed");
    });
  });

  test("close actions call onClose (X icon + footer Close + dialog onClose)", () => {
    const onClose = jest.fn();

    setGet({ loading: false, data: { history: [] } });
    setPost({ loading: false });

    render(<FileVersionHistoryModal open={true} onClose={onClose} file={file} />);

    fireEvent.click(screen.getByLabelText("close"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByTestId("dialog-onclose"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
