// src/pages/pending-requests/PendingRequests.test.tsx
import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import PendingRequests from "./PendingRequests";
import useFetch from "../../hooks/useFetch";

// --------------------
// Mocks
// --------------------
jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading }: { loading: boolean }) => (
    <div data-testid="loader" data-loading={String(loading)} />
  ),
}));

/**
 * IMPORTANT:
 * jest.mock is hoisted; do NOT reference local variables inside.
 * Use globalThis for spies to avoid "out-of-scope variables" error.
 */
(globalThis as any).mockRequestModalSpy = jest.fn();

jest.mock("./RequestDetailsModal", () => ({
  __esModule: true,
  default: (props: any) => {
    (globalThis as any).mockRequestModalSpy(props);
    return (
      <div
        data-testid="request-details-modal"
        data-open={String(!!props.open)}
        data-requestid={String(props?.request?.request_id ?? "")}
      >
        {props.open ? (
          <>
            <button data-testid="modal-close" onClick={props.onClose}>
              Close
            </button>
            <button
              data-testid="modal-approved"
              onClick={() => props.onApproved?.()}
            >
              Approved
            </button>
          </>
        ) : null}
      </div>
    );
  },
}));

const useFetchMock = useFetch as unknown as jest.Mock;

type UseFetchReturn = {
  data: any;
  fetchData: jest.Mock;
  loading: boolean;
};

let fetchSpy: jest.Mock;
let dataNext: any = null;
let loadingNext = false;

function setupUseFetchMock() {
  fetchSpy = jest.fn();
  useFetchMock.mockImplementation((): UseFetchReturn => {
    return { data: dataNext, fetchData: fetchSpy, loading: loadingNext };
  });
}

const getSearchInput = () =>
  screen.getByPlaceholderText("Search by user/file...");

const mkReq = (over: Partial<any>) => ({
  request_id: over.request_id ?? 1,
  firstname: over.firstname ?? "Creator",
  lastname: over.lastname ?? "One",
  efirstname: over.efirstname ?? "User",
  elastname: over.elastname ?? "One",
  created_at: over.created_at ?? "2026-01-01T01:02:03Z",
  details: over.details ?? [{ id: 1, filename: "file.pdf" }],
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();

  (globalThis as any).mockRequestModalSpy = jest.fn();

  dataNext = null;
  loadingNext = false;
  setupUseFetchMock();

  // default desktop
  Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
});

afterEach(() => {
  cleanup();
});

describe("PendingRequests (100% coverage)", () => {
  test("mount: calls fetchData once; loader reflects loading flag; empty state shown when no requests", async () => {
    loadingNext = true;
    dataNext = { requests: [] };

    render(<PendingRequests />);

    expect(screen.getByTestId("loader")).toHaveAttribute(
      "data-loading",
      "true"
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    expect(screen.getByText("No pending requests")).toBeInTheDocument();

    // modal closed
    expect(screen.getByTestId("request-details-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  test("renders table rows + change chip count + spacer row; clicking view opens modal; modal close closes it", async () => {
    loadingNext = false;
    dataNext = {
      requests: [
        mkReq({
          request_id: 10,
          firstname: "Athul",
          lastname: "N",
          efirstname: "Kavya",
          elastname: "G",
          created_at: "2026-01-05T12:00:00Z",
          details: [{ filename: "report.pdf" }, { filename: "x" }],
        }),
      ],
    };

    render(<PendingRequests />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // row content
    expect(screen.getByText("Kavya G")).toBeInTheDocument();
    expect(screen.getByText("Athul N")).toBeInTheDocument();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();

    // chip count (covers req.details?.length || 0)
    expect(screen.getByText("2 changes")).toBeInTheDocument();

    // spacer row branch (filtered.length > 0)
    expect(screen.queryByText("No pending requests")).not.toBeInTheDocument();

    // IconButton has aria-label="View Request"
    const viewBtn = screen.getByRole("button", { name: /view request/i });
    fireEvent.click(viewBtn);

    // modal open and request id set
    expect(screen.getByTestId("request-details-modal")).toHaveAttribute(
      "data-open",
      "true"
    );
    expect(screen.getByTestId("request-details-modal")).toHaveAttribute(
      "data-requestid",
      "10"
    );

    // close modal
    fireEvent.click(screen.getByTestId("modal-close"));
    expect(screen.getByTestId("request-details-modal")).toHaveAttribute(
      "data-open",
      "false"
    );

    // ensure mock saw props
    expect((globalThis as any).mockRequestModalSpy).toHaveBeenCalled();
  });

  test("search filters by createdBy OR userName OR filename; whitespace/trim/lowercase path covered", async () => {
    dataNext = {
      requests: [
        mkReq({
          request_id: 1,
          firstname: "John",
          lastname: "Smith",
          efirstname: "Alice",
          elastname: "Wonder",
          details: [{ filename: "Budget.xlsx" }],
        }),
        mkReq({
          request_id: 2,
          firstname: "Mary",
          lastname: "Jane",
          efirstname: "Bob",
          elastname: "Builder",
          details: [{ filename: "notes.txt" }],
        }),
      ],
    };

    render(<PendingRequests />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    expect(screen.getByText("Budget.xlsx")).toBeInTheDocument();
    expect(screen.getByText("notes.txt")).toBeInTheDocument();

    const input = getSearchInput();

    // createdBy
    fireEvent.change(input, { target: { value: "  john  " } });
    expect(screen.getByText("Budget.xlsx")).toBeInTheDocument();
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();

    // userName
    fireEvent.change(input, { target: { value: "builder" } });
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    expect(screen.queryByText("Budget.xlsx")).not.toBeInTheDocument();

    // filename
    fireEvent.change(input, { target: { value: "budget" } });
    expect(screen.getByText("Budget.xlsx")).toBeInTheDocument();
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();

    // none -> empty table message row
    fireEvent.change(input, { target: { value: "nope" } });
    expect(screen.getByText("No pending requests")).toBeInTheDocument();
  });

  test("RequestDetailsModal onApproved calls fetchData again (refresh)", async () => {
    dataNext = {
      requests: [mkReq({ request_id: 77, details: [{ filename: "x.pdf" }] })],
    };

    render(<PendingRequests />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // open modal
    fireEvent.click(screen.getByRole("button", { name: /view request/i }));
    expect(screen.getByTestId("request-details-modal")).toHaveAttribute(
      "data-open",
      "true"
    );

    // approved -> refresh (onApproved = fetchData)
    fireEvent.click(screen.getByTestId("modal-approved"));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test("mobile resize branch + listener cleanup", async () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = render(<PendingRequests />);

    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    act(() => {
      (window as any).innerWidth = 700;
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByText("Pending Edit Requests")).toBeInTheDocument();

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test("data effect guard: when data is null, requests stays empty -> empty view", async () => {
    dataNext = null;

    render(<PendingRequests />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    expect(screen.getByText("No pending requests")).toBeInTheDocument();
  });
});
