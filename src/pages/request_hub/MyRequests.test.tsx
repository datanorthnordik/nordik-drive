// src/pages/pending-requests/MyRequests.test.tsx
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor, act, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import MyRequests from "./MyRequests";
import useFetch from "../../hooks/useFetch";

// --------------------
// Mocks
// --------------------
jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading }: { loading: boolean }) => (
    <div data-testid="loader" data-loading={String(loading)} />
  ),
}));

/**
 * NOTE: jest.mock is hoisted; cannot reference out-of-scope variables.
 * Use globalThis for the spy.
 */
(globalThis as any).mockModalSpy = jest.fn();

jest.mock("./MyRequestDetailsModal", () => ({
  __esModule: true,
  default: (props: any) => {
    (globalThis as any).mockModalSpy(props);
    return (
      <div
        data-testid="details-modal"
        data-open={String(!!props.open)}
        data-requestid={String(props?.request?.request_id ?? "")}
      >
        {props.open ? (
          <button data-testid="modal-close" onClick={props.onClose}>
            CloseModal
          </button>
        ) : null}
      </div>
    );
  },
}));

import { useSelector } from "react-redux";
const useFetchMock = useFetch as unknown as jest.Mock;
const useSelectorMock = useSelector as unknown as jest.Mock;

type UseFetchReturn = {
  data: any;
  fetchData: jest.Mock;
  loading: boolean;
};

let pendingFetchSpy: jest.Mock;
let approvedFetchSpy: jest.Mock;

let pendingDataNext: any = null;
let approvedDataNext: any = null;
let pendingLoadingNext = false;
let approvedLoadingNext = false;

function setupUseFetchMock() {
  pendingFetchSpy = jest.fn();
  approvedFetchSpy = jest.fn();

  useFetchMock.mockImplementation((url: string) => {
    const isPending = String(url).includes("status=pending");
    const ret: UseFetchReturn = isPending
      ? { data: pendingDataNext, fetchData: pendingFetchSpy, loading: pendingLoadingNext }
      : { data: approvedDataNext, fetchData: approvedFetchSpy, loading: approvedLoadingNext };
    return ret;
  });
}

const mkReq = (over: Partial<any>) => ({
  request_id: over.request_id ?? 1,
  status: over.status ?? "pending",
  created_at: over.created_at ?? "2026-01-01T10:11:12Z",
  details: over.details,
});

const getSearchInput = () => {
  // data-testid is on TextField root, input is inside it
  const root = screen.getByTestId("search-input");
  return within(root).getByRole("textbox");
};

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();

  (globalThis as any).mockModalSpy = jest.fn();

  useSelectorMock.mockImplementation((selFn: any) => selFn({ auth: { user: { id: "26" } } }));

  pendingDataNext = { requests: [] };
  approvedDataNext = { requests: [] };
  pendingLoadingNext = false;
  approvedLoadingNext = false;

  setupUseFetchMock();

  Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
});

afterEach(() => {
  cleanup();
});

describe("MyRequests (100% coverage)", () => {
  test("mount: calls both fetchers; loader uses OR; empty pending state + refresh calls both", async () => {
    pendingLoadingNext = true;
    approvedLoadingNext = false;

    render(<MyRequests />);

    expect(screen.getByTestId("loader")).toHaveAttribute("data-loading", "true");

    await waitFor(() => {
      expect(pendingFetchSpy).toHaveBeenCalledTimes(1);
      expect(approvedFetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("No pending requests.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("refresh-btn"));
    expect(pendingFetchSpy).toHaveBeenCalledTimes(2);
    expect(approvedFetchSpy).toHaveBeenCalledTimes(2);
  });

  test("mobile branch: resize listener registered, reacts to resize, cleanup removes listener", async () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = render(<MyRequests />);

    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    await waitFor(() => {
      expect(pendingFetchSpy).toHaveBeenCalled();
      expect(approvedFetchSpy).toHaveBeenCalled();
    });

    act(() => {
      (window as any).innerWidth = 700;
      window.dispatchEvent(new Event("resize"));
    });

    // smoke check still rendered
    expect(screen.getByTestId("myrequests-tabs")).toBeInTheDocument();

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test("renders rows + all statusChipSx branches + helper outputs (no brittle long-text match)", async () => {
    pendingDataNext = {
      requests: [
        mkReq({
          request_id: 1,
          status: "pending",
          created_at: "2026-01-01T01:02:03Z",
          details: [{ id: 1, filename: "alpha.csv" }, { id: 2, filename: "alpha.csv" }],
        }),
        mkReq({
          request_id: 2,
          status: "APPROVED",
          created_at: "2026-01-02T10:20:30Z",
          details: [{ id: 1, filename: "beta.pdf" }],
        }),
        mkReq({
          request_id: 3,
          status: "rejected",
          created_at: "2026-01-03T11:22:33Z",
          details: [{ id: 1, filename: "gamma.txt" }],
        }),
        // unknown + no created_at + details not array -> filename "—", changes 0, created "—"
        mkReq({
          request_id: 4,
          status: "some-other",
          created_at: undefined,
          details: null,
        }),
      ],
    };

    render(<MyRequests />);

    // rows exist
    expect(screen.getByTestId("request-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("request-row-2")).toBeInTheDocument();
    expect(screen.getByTestId("request-row-3")).toBeInTheDocument();
    expect(screen.getByTestId("request-row-4")).toBeInTheDocument();

    // status chip labels via testid (no ambiguity with tabs)
    expect(screen.getByTestId("status-chip-1")).toHaveTextContent("Pending review");
    expect(screen.getByTestId("status-chip-2")).toHaveTextContent("Approved");
    expect(screen.getByTestId("status-chip-3")).toHaveTextContent("Rejected");
    expect(screen.getByTestId("status-chip-4")).toHaveTextContent("Unknown");

    // helper output: filename appears (for request 4 it should be "—")
    expect(within(screen.getByTestId("request-row-1")).getByText("alpha.csv")).toBeInTheDocument();
    expect(within(screen.getByTestId("request-row-2")).getByText("beta.pdf")).toBeInTheDocument();
    expect(within(screen.getByTestId("request-row-3")).getByText("gamma.txt")).toBeInTheDocument();

    // request 4 has filename fallback "—"
    expect(within(screen.getByTestId("request-row-4")).getByText("—")).toBeInTheDocument();

    // formatWhen + getChangeCount: assert against row container text (avoids split-node issues)
    const row1Text = screen.getByTestId("request-row-1").textContent || "";
    expect(row1Text).toContain("Request #1");
    expect(row1Text).toContain("Created 2026-01-01 01:02:03");
    expect(row1Text).toContain("2 changes");

    const row4Text = screen.getByTestId("request-row-4").textContent || "";
    expect(row4Text).toContain("Request #4");
    expect(row4Text).toContain("Created");
    expect(row4Text).toContain("0 changes");
  });

  test("search filters by filename and by request id; empty filtered shows empty state + refresh", async () => {
    pendingDataNext = {
      requests: [
        mkReq({
          request_id: 10,
          status: "pending",
          created_at: "2026-01-01T01:02:03Z",
          details: [{ id: 1, filename: "report.pdf" }],
        }),
        mkReq({
          request_id: 11,
          status: "pending",
          created_at: "2026-01-01T04:05:06Z",
          details: [{ id: 1, filename: "notes.txt" }],
        }),
      ],
    };

    render(<MyRequests />);

    expect(screen.getByTestId("request-row-10")).toBeInTheDocument();
    expect(screen.getByTestId("request-row-11")).toBeInTheDocument();

    // filter by filename
    fireEvent.change(getSearchInput(), { target: { value: "report" } });
    expect(screen.getByTestId("request-row-10")).toBeInTheDocument();
    expect(screen.queryByTestId("request-row-11")).not.toBeInTheDocument();

    // filter by request id
    fireEvent.change(getSearchInput(), { target: { value: "11" } });
    expect(screen.getByTestId("request-row-11")).toBeInTheDocument();
    expect(screen.queryByTestId("request-row-10")).not.toBeInTheDocument();

    // filter to none -> empty state (pending tab)
    fireEvent.change(getSearchInput(), { target: { value: "zzz" } });
    expect(screen.getByText("No pending requests.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("refresh-btn"));
    expect(pendingFetchSpy).toHaveBeenCalledTimes(2); // mount + refresh
    expect(approvedFetchSpy).toHaveBeenCalledTimes(2);
  });

  test("tab switch uses approved/rejected list; empty copy when filtered to none", async () => {
    approvedDataNext = {
      requests: [
        mkReq({
          request_id: 21,
          status: "approved",
          created_at: "2026-01-09T09:09:09Z",
          details: [{ id: 1, filename: "ok.pdf" }],
        }),
      ],
    };

    render(<MyRequests />);

    fireEvent.click(screen.getByTestId("tab-approved"));
    expect(await screen.findByTestId("request-row-21")).toBeInTheDocument();

    fireEvent.change(getSearchInput(), { target: { value: "nope" } });
    expect(screen.getByText("No approved/rejected requests.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tab-pending"));
    expect(screen.getByText("No pending requests.")).toBeInTheDocument();
  });

  test("Details open/close drives MyRequestDetailsModal props and closes via modal callback", async () => {
    pendingDataNext = {
      requests: [
        mkReq({
          request_id: 31,
          status: "pending",
          created_at: "2026-01-01T01:02:03Z",
          details: [{ id: 1, filename: "alpha.csv" }],
        }),
      ],
    };

    render(<MyRequests />);

    expect(screen.getByTestId("details-modal")).toHaveAttribute("data-open", "false");

    fireEvent.click(screen.getByTestId("details-btn-31"));
    expect(screen.getByTestId("details-modal")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("details-modal")).toHaveAttribute("data-requestid", "31");

    fireEvent.click(screen.getByTestId("modal-close"));
    expect(screen.getByTestId("details-modal")).toHaveAttribute("data-open", "false");

    const calls = (globalThis as any).mockModalSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
  });

  test("buildRequestsUrl: when user.id falsy, useFetch URLs exclude user_id", () => {
    useSelectorMock.mockImplementation((selFn: any) => selFn({ auth: { user: { id: "" } } }));
    setupUseFetchMock();

    render(<MyRequests />);

    const urls = useFetchMock.mock.calls.map((c: any[]) => String(c[0]));
    const pendingUrl = urls.find((u) => u.includes("status=pending"))!;
    const arUrl = urls.find((u) => u.includes("status=approved%2Crejected"))!;

    expect(pendingUrl).toContain("status=pending");
    expect(pendingUrl).not.toContain("user_id=");
    expect(arUrl).toContain("status=approved%2Crejected");
    expect(arUrl).not.toContain("user_id=");
  });
});
