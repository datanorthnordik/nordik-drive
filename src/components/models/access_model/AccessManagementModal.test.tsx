import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

/**
 * IMPORTANT:
 * jest.mock factories cannot reference out-of-scope vars unless prefixed with "mock".
 * So we name it mockUseFetch (allowed by Jest).
 */
const mockUseFetch = jest.fn();

// ---- Mock useFetch for ALL likely import paths (relative + aliases) ----
jest.mock("../../../hooks/useFetch", () => ({
  __esModule: true,
  default: mockUseFetch,
}));

// If your project has TS/Jest path aliases, these might be used in the component build output.
// Mark as virtual so tests won't fail even if these modules don't physically exist.
jest.mock(
  "src/hooks/useFetch",
  () => ({
    __esModule: true,
    default: mockUseFetch,
  }),
  { virtual: true } as any
);

jest.mock(
  "@/hooks/useFetch",
  () => ({
    __esModule: true,
    default: mockUseFetch,
  }),
  { virtual: true } as any
);

// ------------------ MUI mocks ------------------
jest.mock("@mui/material", () => {
  const React = require("react");
  return {
    __esModule: true,
    Dialog: ({ open, children }: any) =>
      open ? <div data-testid="mui-dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => (
      <div data-testid="mui-dialog-content">{children}</div>
    ),
    Divider: () => <hr data-testid="mui-divider" />,
    Box: ({ children }: any) => <div data-testid="mui-box">{children}</div>,
  };
});

// ------------------ toast mock ------------------
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

// ------------------ child component mocks ------------------
jest.mock("../../Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) =>
    loading ? <div data-testid="loader">loading</div> : null,
}));

jest.mock("./../ConfirmModal", () => ({
  __esModule: true,
  default: ({ text, open, onConfirm, onCancel, title }: any) => {
    const id = String(title).toLowerCase().replace(/\s+/g, "-");
    if (!open) return null;
    return (
      <div data-testid={`confirmation-modal-${id}`}>
        <div data-testid={`confirmation-title-${id}`}>{title}</div>
        <div data-testid={`confirmation-text-${id}`}>{text}</div>
        <button data-testid={`confirm-${id}`} onClick={onConfirm}>
          confirm
        </button>
        <button data-testid={`cancel-${id}`} onClick={onCancel}>
          cancel
        </button>
      </div>
    );
  },
}));

jest.mock("./AccessModalHeader", () => ({
  __esModule: true,
  default: ({ fileName, onClose }: any) => (
    <div data-testid="header">
      <div data-testid="header-filename">{fileName}</div>
      <button data-testid="header-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

jest.mock("./AssignAccessSection", () => ({
  __esModule: true,
  default: ({
    users,
    selectedUsers,
    setSelectedUsers,
    openAssignModal,
    loading,
  }: any) => (
    <div data-testid="assign-section">
      <div data-testid="assign-users-count">{(users || []).length}</div>
      <div data-testid="assign-selected-count">
        {(selectedUsers || []).length}
      </div>
      <div data-testid="assign-loading">{String(loading)}</div>

      <button
        data-testid="select-users"
        onClick={() =>
          setSelectedUsers([
            { id: 11, firstname: "John", lastname: "Doe" },
            { id: 22, firstname: "Jane", lastname: "Roe" },
          ])
        }
      >
        select-users
      </button>

      <button data-testid="open-assign" onClick={openAssignModal}>
        open-assign
      </button>
    </div>
  ),
}));

jest.mock("./RevokeAccessSection", () => ({
  __esModule: true,
  default: ({
    searchQuery,
    setSearchQuery,
    filteredAccesses,
    openRevokeModalFn,
  }: any) => (
    <div data-testid="revoke-section">
      <div data-testid="search-query">{searchQuery}</div>
      <div data-testid="filtered-count">{(filteredAccesses || []).length}</div>

      <button data-testid="set-search" onClick={() => setSearchQuery("john")}>
        set-search
      </button>

      <button
        data-testid="open-revoke-99"
        onClick={() => openRevokeModalFn(99)}
      >
        open-revoke-99
      </button>

      <button
        data-testid="open-revoke-null"
        onClick={() => openRevokeModalFn(null)}
      >
        open-revoke-null
      </button>
    </div>
  ),
}));

jest.mock("./AccessModalFooter", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <button data-testid="footer-close" onClick={onClose}>
      close
    </button>
  ),
}));

// ✅ Import component AFTER mocks
const AccessModal = require("./AccessManagementModal").default;

/**
 * Build a stable useFetch mock that NEVER returns undefined.
 * Uses URL matching (endsWith/includes) to avoid brittle full URL string issues.
 */
function setupUseFetch(opts?: {
  userData?: any;
  uloading?: boolean;
  fetchUser?: jest.Mock;

  newAccessData?: any;
  aloading?: boolean;
  assignAccess?: jest.Mock;
  aerror?: string | null;

  accessesData?: any;
  galoading?: boolean;
  getAccess?: jest.Mock;

  deletedAccessData?: any;
  daloading?: boolean;
  deleteAccess?: jest.Mock;
  derror?: string | null;
}) {
  const fetchUser = opts?.fetchUser ?? jest.fn();
  const assignAccess = opts?.assignAccess ?? jest.fn();
  const getAccess = opts?.getAccess ?? jest.fn();
  const deleteAccess = opts?.deleteAccess ?? jest.fn();

  mockUseFetch.mockImplementation((url: any, method: any) => {
    const u = String(url || "");
    const m = String(method || "").toUpperCase();

    // GET users
    if (m === "GET" && u.includes("/api/user")) {
      return {
        loading: opts?.uloading ?? false,
        data: opts?.userData ?? null,
        fetchData: fetchUser,
      };
    }

    // POST assign access
    if (m === "POST" && u.includes("/api/file/access")) {
      return {
        loading: opts?.aloading ?? false,
        data: opts?.newAccessData ?? null,
        fetchData: assignAccess,
        error: opts?.aerror ?? null,
      };
    }

    // GET file access list
    if (m === "GET" && u.includes("/api/file/access")) {
      return {
        loading: opts?.galoading ?? false,
        data: opts?.accessesData ?? null,
        fetchData: getAccess,
      };
    }

    // DELETE access
    if (m === "DELETE" && u.includes("/api/file/access")) {
      return {
        loading: opts?.daloading ?? false,
        data: opts?.deletedAccessData ?? null,
        fetchData: deleteAccess,
        error: opts?.derror ?? null,
      };
    }

    // SAFE FALLBACK: never allow undefined (prevents destructure crash forever)
    return { loading: false, data: null, fetchData: jest.fn(), error: null };
  });

  return { fetchUser, assignAccess, getAccess, deleteAccess };
}

describe("AccessModal (AccessManagementModal default export)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFetch.mockReset();

    // default safe impl so even if a test forgets setupUseFetch, it won't crash
    mockUseFetch.mockImplementation(() => ({
      loading: false,
      data: null,
      fetchData: jest.fn(),
      error: null,
    }));
  });

  test("when open=false, does not fetch users or accesses and dialog is not rendered", () => {
    const { fetchUser, getAccess } = setupUseFetch({
      userData: { users: [] },
      accessesData: { access: [] },
    });

    render(
      <AccessModal
        open={false}
        onClose={jest.fn()}
        file={{ fileId: 123, fileName: "Test.pdf" }}
      />
    );

    expect(screen.queryByTestId("mui-dialog")).not.toBeInTheDocument();
    expect(fetchUser).not.toHaveBeenCalled();
    expect(getAccess).not.toHaveBeenCalled();
  });

  test("when open=true, fetches users and fetches access list for fileId", async () => {
    const { fetchUser, getAccess } = setupUseFetch({
      userData: { users: [] },
      accessesData: { access: [] },
    });

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 123, fileName: "File.pdf" }}
      />
    );

    await waitFor(() => expect(fetchUser).toHaveBeenCalled());
    await waitFor(() => expect(getAccess).toHaveBeenCalledWith(null, { id: 123 }));
    expect(screen.getByTestId("mui-dialog")).toBeInTheDocument();
  });

  test("does not call getAccess when fileId is falsy (0) even if open=true", async () => {
    const { fetchUser, getAccess } = setupUseFetch({
      userData: { users: [] },
      accessesData: { access: [] },
    });

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 0, fileName: "Zero.pdf" }}
      />
    );

    await waitFor(() => expect(fetchUser).toHaveBeenCalled());
    expect(getAccess).not.toHaveBeenCalled();
  });

  test("filters available users when accesses + user exist (removes already assigned)", async () => {
    setupUseFetch({
      userData: {
        users: [
          { id: 1, firstname: "A", lastname: "One" },
          { id: 2, firstname: "B", lastname: "Two" },
        ],
      },
      accessesData: {
        access: [
          { user_id: 1, firstname: "A", lastname: "One" },
          { user_id: 99, firstname: "X", lastname: "Y" },
        ],
      },
    });

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 555, fileName: "Doc.pdf" }}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("assign-users-count")).toHaveTextContent("1")
    );
  });

  test("when accesses is null but user exists, uses all users and filteredAccesses returns []", async () => {
    setupUseFetch({
      userData: {
        users: [
          { id: 1, firstname: "A", lastname: "One" },
          { id: 2, firstname: "B", lastname: "Two" },
        ],
      },
      accessesData: null,
    });

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 10, fileName: "All.pdf" }}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("assign-users-count")).toHaveTextContent("2")
    );
    expect(screen.getByTestId("filtered-count")).toHaveTextContent("0");
  });

  test("assign flow: opens assign confirmation and confirm calls assignAccess(body)", async () => {
    const { assignAccess } = setupUseFetch({
      userData: { users: [] },
      accessesData: { access: [] },
    });

    const user = userEvent.setup();

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 77, fileName: "Assign.pdf" }}
      />
    );

    await user.click(screen.getByTestId("select-users"));
    expect(screen.getByTestId("assign-selected-count")).toHaveTextContent("2");

    await user.click(screen.getByTestId("open-assign"));

    expect(screen.getByTestId("confirmation-modal-assign-access")).toBeInTheDocument();
    expect(screen.getByTestId("confirmation-text-assign-access")).toHaveTextContent(
      "John Doe, Jane Roe"
    );

    await user.click(screen.getByTestId("confirm-assign-access"));

    expect(assignAccess).toHaveBeenCalledWith([
      { user_id: 11, file_id: 77 },
      { user_id: 22, file_id: 77 },
    ]);
  });

  test("revoke flow: opens revoke confirmation, cancel closes; confirm calls deleteAccess(null,{id})", async () => {
    const { deleteAccess } = setupUseFetch({
      userData: { users: [] },
      accessesData: {
        access: [
          { user_id: 99, firstname: "John", lastname: "Doe" },
          { user_id: 100, firstname: "Alice", lastname: "Smith" },
        ],
      },
    });

    const user = userEvent.setup();

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 500, fileName: "Revoke.pdf" }}
      />
    );

    await user.click(screen.getByTestId("set-search"));
    await waitFor(() =>
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("1")
    );

    await user.click(screen.getByTestId("open-revoke-99"));
    expect(screen.getByTestId("confirmation-modal-revoke-access")).toBeInTheDocument();

    await user.click(screen.getByTestId("cancel-revoke-access"));
    expect(screen.queryByTestId("confirmation-modal-revoke-access")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-revoke-99"));
    await user.click(screen.getByTestId("confirm-revoke-access"));

    expect(deleteAccess).toHaveBeenCalledWith(null, { id: 99 });
  });

  test("handleRevoke early return: when selectedId is null, confirm does not call deleteAccess", async () => {
    const { deleteAccess } = setupUseFetch({
      userData: { users: [] },
      accessesData: { access: [{ user_id: 1, firstname: "X", lastname: "Y" }] },
    });

    const user = userEvent.setup();

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 2, fileName: "Null.pdf" }}
      />
    );

    await user.click(screen.getByTestId("open-revoke-null"));
    expect(screen.getByTestId("confirmation-modal-revoke-access")).toBeInTheDocument();

    await user.click(screen.getByTestId("confirm-revoke-access"));
    expect(deleteAccess).not.toHaveBeenCalled();
  });

  test("loader shows when any fetch is loading=true (combined loading)", () => {
    setupUseFetch({
      uloading: true,
      userData: null,
      accessesData: null,
    });

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 1, fileName: "Load.pdf" }}
      />
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  test("newAccess triggers success toast, closes modals, refetches, and resets selectedUsers + searchQuery", async () => {
    const fetchUser = jest.fn();
    const getAccess = jest.fn();

    setupUseFetch({
      fetchUser,
      getAccess,
      userData: {
        users: [
          { id: 11, firstname: "John", lastname: "Doe" },
          { id: 22, firstname: "Jane", lastname: "Roe" },
        ],
      },
      accessesData: {
        access: [
          { user_id: 99, firstname: "John", lastname: "Doe" },
          { user_id: 100, firstname: "Alice", lastname: "Smith" },
        ],
      },
      newAccessData: null,
      deletedAccessData: null,
    });

    const user = userEvent.setup();

    const { rerender } = render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 900, fileName: "N.pdf" }}
      />
    );

    await user.click(screen.getByTestId("select-users"));
    await user.click(screen.getByTestId("open-assign"));
    await user.click(screen.getByTestId("open-revoke-99"));
    await user.click(screen.getByTestId("set-search"));

    expect(screen.getByTestId("confirmation-modal-assign-access")).toBeInTheDocument();
    expect(screen.getByTestId("confirmation-modal-revoke-access")).toBeInTheDocument();
    expect(screen.getByTestId("assign-selected-count")).toHaveTextContent("2");
    expect(screen.getByTestId("search-query")).toHaveTextContent("john");

    setupUseFetch({
      fetchUser,
      getAccess,
      userData: {
        users: [
          { id: 11, firstname: "John", lastname: "Doe" },
          { id: 22, firstname: "Jane", lastname: "Roe" },
        ],
      },
      accessesData: {
        access: [
          { user_id: 99, firstname: "John", lastname: "Doe" },
          { user_id: 100, firstname: "Alice", lastname: "Smith" },
        ],
      },
      newAccessData: { message: "Access assigned" },
      deletedAccessData: null,
    });

    rerender(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 900, fileName: "N.pdf" }}
      />
    );

    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalledWith("Access assigned");
    });

    await waitFor(() => {
      expect(screen.queryByTestId("confirmation-modal-assign-access")).not.toBeInTheDocument();
      expect(screen.queryByTestId("confirmation-modal-revoke-access")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("assign-selected-count")).toHaveTextContent("0");
      expect(screen.getByTestId("search-query")).toHaveTextContent("");
    });

    await waitFor(() => {
      expect(fetchUser).toHaveBeenCalled();
      expect(getAccess).toHaveBeenCalledWith(null, { id: 900 });
    });
  });

  test("deletedAccess triggers success toast and derror/aerror trigger error toast", async () => {
    setupUseFetch({
      userData: { users: [] },
      accessesData: { access: [] },
      aerror: "Assign failed",
      derror: "Delete failed",
      deletedAccessData: { message: "Access revoked" },
    });

    render(
      <AccessModal
        open={true}
        onClose={jest.fn()}
        file={{ fileId: 321, fileName: "D.pdf" }}
      />
    );

    await waitFor(() => {
      expect((toast as any).error).toHaveBeenCalledWith("Assign failed");
      expect((toast as any).error).toHaveBeenCalledWith("Delete failed");
      expect((toast as any).success).toHaveBeenCalledWith("Access revoked");
    });
  });

  test("header/footer close buttons call onClose", async () => {
    setupUseFetch({
      userData: { users: [] },
      accessesData: { access: [] },
    });

    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <AccessModal
        open={true}
        onClose={onClose}
        file={{ fileId: 1, fileName: "Close.pdf" }}
      />
    );

    await user.click(screen.getByTestId("header-close"));
    await user.click(screen.getByTestId("footer-close"));

    expect(onClose).toHaveBeenCalled();
  });
});
