// UserActivity.test.tsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserActivity from "./UserActivity";
import useFetch from "../../hooks/useFetch";

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useFetchMock = useFetch as unknown as jest.Mock;

/**
 * Mock AG Grid + ag-grid-community so we don't pull real DOM/grid internals.
 * We simulate onGridReady() once (which triggers initial logs fetch in your component).
 */
jest.mock("ag-grid-community", () => ({
  __esModule: true,
  AllCommunityModule: {},
  ModuleRegistry: { registerModules: jest.fn() },
  themeQuartz: { withPart: () => ({}) },
  colorSchemeLightWarm: {},
}));

jest.mock("ag-grid-react", () => {
  const React = require("react");
  return {
    __esModule: true,
    AgGridReact: (props: any) => {
      React.useEffect(() => {
        props.onGridReady?.({ api: {} });
      }, []);
      return <div data-testid="ag-grid" />;
    },
  };
});

/**
 * Mock date pickers to avoid adapter/context/portals.
 */
jest.mock("@mui/x-date-pickers", () => ({
  __esModule: true,
  LocalizationProvider: ({ children }: any) => <>{children}</>,
  DatePicker: ({ label }: any) => <input aria-label={label} />,
}));
jest.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  __esModule: true,
  AdapterDayjs: function AdapterDayjs() {},
}));

/**
 * Mock ActivityVisualization so we can assert props safely.
 */
jest.mock("../activity/ActivityVisualization", () => ({
  __esModule: true,
  default: ({ selectedCommunity, selectedAction, logData }: any) => (
    <div
      data-testid="viz"
      data-community={selectedCommunity || ""}
      data-action={selectedAction || ""}
      data-haslog={logData ? "yes" : "no"}
    />
  ),
}));

/**
 * parsePgTextArray not needed for these tests, but keep safe.
 */
jest.mock("../activity/activityutils", () => ({
  __esModule: true,
  parsePgTextArray: () => [],
}));

/**
 * Mock actions list.
 */
jest.mock("../../constants/constants", () => ({
  __esModule: true,
  actions: [
    { value: "LOGIN", name: "Login" },
    { value: "DOWNLOAD", name: "Download" },
  ],
}));

/**
 * Mock Loader + FileButton
 */
jest.mock("../Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => (loading ? <div data-testid="loader">loading</div> : null),
}));
jest.mock("../buttons/Button", () => ({
  __esModule: true,
  FileButton: ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

/**
 * IMPORTANT:
 * Your component imports Select/MenuItem/ToggleButtonGroup/ToggleButton from "@mui/material".
 * MUI Select uses portals which can cause random timeouts/flakes.
 *
 * This override keeps the rest of MUI real, but replaces Select/MenuItem + toggles
 * with simple HTML elements (stable).
 */
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  const Select = ({ label, value, onChange, children, ...rest }: any) => (
    <select aria-label={label} value={value} onChange={onChange} {...rest}>
      {children}
    </select>
  );

  const MenuItem = ({ value, children }: any) => <option value={value}>{children}</option>;

  const FormControl = ({ children }: any) => <div>{children}</div>;
  const InputLabel = ({ children }: any) => <span>{children}</span>;

  const ToggleButton = ({ children, onClick, ...rest }: any) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  );

  const ToggleButtonGroup = ({ onChange, children }: any) => (
    <div>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, {
          onClick: (e: any) => onChange?.(e, child.props.value),
        })
      )}
    </div>
  );

  return {
    ...actual,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    ToggleButton,
    ToggleButtonGroup,
  };
});

function setupUseFetchForUserActivity(opts: {
  logsData?: any;
  usersData?: any;
  communitiesData?: any;
  filesData?: any;
}) {
  const logsFetch = jest.fn().mockResolvedValue(opts.logsData ?? null);
  const usersFetch = jest.fn().mockResolvedValue(opts.usersData ?? null);
  const communitiesFetch = jest.fn().mockResolvedValue(opts.communitiesData ?? null);
  const filesFetch = jest.fn().mockResolvedValue(opts.filesData ?? null);

  useFetchMock.mockReset();

  useFetchMock.mockImplementation((url: string, method: string) => {
    if (url.includes("/api/logs") && method === "POST") {
      return { loading: false, data: opts.logsData ?? null, error: null, fetchData: logsFetch };
    }
    if (url.includes("/api/user") && method === "GET") {
      return { loading: false, data: opts.usersData ?? null, error: null, fetchData: usersFetch };
    }
    if (url.includes("/api/communities") && method === "GET") {
      return { loading: false, data: opts.communitiesData ?? null, error: null, fetchData: communitiesFetch };
    }
    if (url.includes("/api/file") && method === "GET") {
      return { loading: false, data: opts.filesData ?? null, error: null, fetchData: filesFetch };
    }

    return { loading: false, data: null, error: null, fetchData: jest.fn() };
  });

  return { logsFetch, usersFetch, communitiesFetch, filesFetch };
}

describe("UserActivity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls fetchUsers + fetchCommunities + fetchFiles on mount", async () => {
    const { usersFetch, communitiesFetch, filesFetch } = setupUseFetchForUserActivity({
      usersData: { users: [] },
      communitiesData: { communities: [] },
      filesData: { files: [] },
    });

    render(<UserActivity />);

    await waitFor(() => {
      expect(usersFetch).toHaveBeenCalledTimes(1);
      expect(communitiesFetch).toHaveBeenCalledTimes(1);
      expect(filesFetch).toHaveBeenCalledTimes(1);
    });
  });

  test("onGridReady triggers initial logs fetch for page 1 with default date range fields", async () => {
    const { logsFetch } = setupUseFetchForUserActivity({
      usersData: { users: [] },
      communitiesData: { communities: [] },
      filesData: { files: [] },
      logsData: null,
    });

    render(<UserActivity />);

    await waitFor(() => expect(logsFetch).toHaveBeenCalled());

    const body = logsFetch.mock.calls[0][0];
    expect(body).toEqual(expect.objectContaining({ page: 1, page_size: 20 }));
    expect(body.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("when logsResp exists, it collapses filters and shows chips + Edit search", async () => {
    setupUseFetchForUserActivity({
      usersData: { users: [] },
      communitiesData: { communities: [] },
      filesData: { files: [] },
      logsData: { page: 1, total_pages: 1, data: [{ id: 1 }] },
    });

    render(<UserActivity />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /edit search/i })).toBeInTheDocument();
    });

    // The top chips row should exist
    expect(screen.getByText(/search \(1 filter\)/i)).toBeInTheDocument();
    expect(screen.getByText(/time:/i)).toBeInTheDocument();
  });

  test("Edit search re-opens the expanded filter panel", async () => {
    setupUseFetchForUserActivity({
      usersData: { users: [] },
      communitiesData: { communities: [] },
      filesData: { files: [] },
      logsData: { page: 1, total_pages: 1, data: [{ id: 1 }] },
    });

    render(<UserActivity />);

    await waitFor(() => screen.getByRole("button", { name: /edit search/i }));
    await userEvent.click(screen.getByRole("button", { name: /edit search/i }));

    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  test("Apply builds payload from selected filters and triggers logs fetch", async () => {
    const { logsFetch } = setupUseFetchForUserActivity({
      usersData: { users: [{ id: 2, firstname: "Athul", lastname: "N", community: [] }] },
      communitiesData: { communities: [{ id: 1, name: "Shingwauk", approved: true }] },
      filesData: { files: [{ id: 9, filename: "a.pdf" }] },
      logsData: null,
    });

    render(<UserActivity />);

    // wait for the initial fetchPage(1) caused by onGridReady, then clear for clean asserts
    await waitFor(() => expect(logsFetch).toHaveBeenCalled());
    logsFetch.mockClear();

    // Select filters (stable HTML <select> mocks)
    fireEvent.change(screen.getByRole("combobox", { name: "User" }), { target: { value: "2" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Community" }), { target: { value: "Shingwauk" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Filename" }), { target: { value: "a.pdf" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Action" }), { target: { value: "LOGIN" } });

    // Apply
    await userEvent.click(screen.getByRole("button", { name: /apply/i }));

    await waitFor(() => expect(logsFetch).toHaveBeenCalledTimes(1));

    const body = logsFetch.mock.calls[0][0];
    expect(body).toEqual(
      expect.objectContaining({
        page: 1,
        page_size: 20,
        user_id: 2,
        action: "LOGIN",
        filename: "a.pdf",
        communities: ["Shingwauk"],
      })
    );

    // should have date range set (not ALL)
    expect(body.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Apply collapses filters (top bar appears)
    expect(screen.getByRole("button", { name: /edit search/i })).toBeInTheDocument();
  });

  test("Reset clears filter state and triggers logs fetch again", async () => {
    const { logsFetch } = setupUseFetchForUserActivity({
      usersData: { users: [{ id: 2, firstname: "Athul", lastname: "N", community: [] }] },
      communitiesData: { communities: [{ id: 1, name: "Shingwauk", approved: true }] },
      filesData: { files: [{ id: 9, filename: "a.pdf" }] },
      logsData: null,
    });

    render(<UserActivity />);

    await waitFor(() => expect(logsFetch).toHaveBeenCalled());
    logsFetch.mockClear();

    fireEvent.change(screen.getByRole("combobox", { name: "User" }), { target: { value: "2" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Community" }), { target: { value: "Shingwauk" } });

    await userEvent.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => expect(logsFetch).toHaveBeenCalledTimes(1));

    const body = logsFetch.mock.calls[0][0];
    // reset should not include user_id/communities/action/filename
    expect(body.user_id).toBeUndefined();
    expect(body.communities).toBeUndefined();
    expect(body.action).toBeUndefined();
    expect(body.filename).toBeUndefined();

    // reset should still include default date range
    expect(body.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // selects should reflect reset values
    expect(screen.getByRole("combobox", { name: "User" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Community" })).toHaveValue("");
  });

  test("pagination NEXT/PREV calls logs fetch with correct page numbers", async () => {
    const { logsFetch } = setupUseFetchForUserActivity({
      usersData: { users: [] },
      communitiesData: { communities: [] },
      filesData: { files: [] },
      logsData: { page: 2, total_pages: 3, data: [] },
    });

    render(<UserActivity />);

    // initial grid-ready fetch
    await waitFor(() => expect(logsFetch).toHaveBeenCalled());
    logsFetch.mockClear();

    const nextBtn = screen.getByRole("button", { name: /next/i });
    const prevBtn = screen.getByRole("button", { name: /prev/i });

    expect(nextBtn).not.toBeDisabled();
    expect(prevBtn).not.toBeDisabled();

    await userEvent.click(nextBtn);
    expect(logsFetch).toHaveBeenCalledWith(expect.objectContaining({ page: 3, page_size: 20 }));

    await userEvent.click(prevBtn);
    expect(logsFetch).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 20 }));
  });

  test("clicking File management calls onModeChange(FILE_MANAGEMENT)", async () => {
    const onModeChange = jest.fn();

    setupUseFetchForUserActivity({
      usersData: { users: [] },
      communitiesData: { communities: [] },
      filesData: { files: [] },
      logsData: null,
    });

    render(<UserActivity mode="GENERAL" onModeChange={onModeChange} />);

    // In expanded filter view by default
    await userEvent.click(screen.getByRole("button", { name: /file management/i }));

    expect(onModeChange).toHaveBeenCalledWith("FILE_MANAGEMENT");
  });

  test("passes selected filters to ActivityVisualization", async () => {
    setupUseFetchForUserActivity({
      usersData: { users: [] },
      communitiesData: { communities: [{ id: 1, name: "Shingwauk", approved: true }] },
      filesData: { files: [] },
      logsData: { page: 1, total_pages: 1, data: [] },
    });

    render(<UserActivity />);

    // wait for collapse (logsResp exists)
    await waitFor(() => screen.getByRole("button", { name: /edit search/i }));
    await userEvent.click(screen.getByRole("button", { name: /edit search/i }));

    fireEvent.change(screen.getByRole("combobox", { name: "Community" }), { target: { value: "Shingwauk" } });

    // Apply to push selectedCommunity into visualization props on next render
    await userEvent.click(screen.getByRole("button", { name: /apply/i }));

    // viz is always rendered; assert it receives selectedCommunity
    const viz = await screen.findByTestId("viz");
    expect(viz.getAttribute("data-community")).toBe("Shingwauk");
  });
});
