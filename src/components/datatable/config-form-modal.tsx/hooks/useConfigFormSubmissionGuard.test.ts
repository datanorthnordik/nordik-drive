import { renderHook, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";

import useFetch from "../../../../hooks/useFetch";
import useConfigFormSubmissionGuard from "./useConfigFormSubmissionGuard";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

jest.mock("../../../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseFetch = useFetch as jest.Mock;
const mockedToast = toast as any;

describe("useConfigFormSubmissionGuard", () => {
  let searchState: {
    data: any;
    error: any;
    loading: boolean;
    fetchData: jest.Mock;
  };

  const makeProps = (
    overrides: Partial<Parameters<typeof useConfigFormSubmissionGuard>[0]> = {}
  ): Parameters<typeof useConfigFormSubmissionGuard>[0] => ({
    apiBase: "/api",
    requestGuardEnabled: true,
    review: false,
    open: true,
    fileId: 202,
    rowId: 101,
    formKey: "boarding_form",
    formName: "Boarding Form",
    currentUserEmail: "owner@nordik.test",
    guardedFormLabel: "Boarding Form",
    subjectDisplayName: "Athul Narayanan",
    onBlockedView: jest.fn(),
    onPrepareNewRequest: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    searchState = {
      data: null,
      error: null,
      loading: false,
      fetchData: jest.fn().mockResolvedValue(undefined),
    };

    mockedUseFetch.mockImplementation((url: string, method: string) => {
      if (url === "/api/form/answers/active" && method === "GET") return searchState;
      throw new Error(`Unexpected useFetch call: ${method} ${url}`);
    });
  });

  it("does not fetch or block when the guard is disabled", () => {
    const { result } = renderHook(() =>
      useConfigFormSubmissionGuard(
        makeProps({
          requestGuardEnabled: false,
        })
      )
    );

    expect(searchState.fetchData).not.toHaveBeenCalled();
    expect(result.current.guardAccessMode).toBe("load-existing");
    expect(result.current.submissionGuard).toEqual({ kind: "none", message: "" });
  });

  it("allows creating a new request when the active lookup returns empty", async () => {
    searchState.data = {};

    const props = makeProps();

    const { result } = renderHook(() => useConfigFormSubmissionGuard(props));

    await waitFor(() => {
      expect(searchState.fetchData).toHaveBeenCalledWith(
        undefined,
        {
          row_id: 101,
          file_id: 202,
          form_key: "boarding_form",
        },
        false
      );
    });

    await waitFor(() => {
      expect(props.onPrepareNewRequest).toHaveBeenCalledTimes(1);
      expect(result.current.guardAccessMode).toBe("create-new");
    });
  });

  it("still allows creating a new request when a legacy rejected-only response is returned", async () => {
    searchState.data = {
      items: [
        { id: 1, status: "rejected", created_by: "other@nordik.test" },
        { id: 2, status: "rejected", created_by: "owner@nordik.test" },
      ],
    };

    const props = makeProps();

    const { result } = renderHook(() => useConfigFormSubmissionGuard(props));

    await waitFor(() => {
      expect(props.onPrepareNewRequest).toHaveBeenCalledTimes(1);
      expect(result.current.guardAccessMode).toBe("create-new");
    });

    expect(result.current.submissionGuard).toEqual({ kind: "none", message: "" });
    expect(props.onBlockedView).not.toHaveBeenCalled();
  });

  it("blocks viewing when a non-rejected request belongs to a different creator", async () => {
    searchState.data = {
      data: {
        id: 3,
        status: "pending",
        created_by: "other@nordik.test",
        submitted_user: {
          email: "owner@nordik.test",
        },
      },
    };

    const props = makeProps();

    const { result } = renderHook(() => useConfigFormSubmissionGuard(props));

    await waitFor(() => {
      expect(props.onBlockedView).toHaveBeenCalledTimes(1);
    });

    expect(mockedToast.error).toHaveBeenCalledWith(
      "A request for Boarding Form has been already created by someone else."
    );
    expect(result.current.guardAccessMode).toBe("blocked");
    expect(result.current.submissionGuard).toEqual({
      kind: "other-user-active",
      message: "A request for Boarding Form has been already created by someone else.",
    });
  });

  it("shows readonly mode for an approved request created by the current user", async () => {
    searchState.data = {
      data: {
        id: 4,
        status: "approved",
        created_by: {
          email: "owner@nordik.test",
        },
      },
    };

    const props = makeProps();

    const { result } = renderHook(() => useConfigFormSubmissionGuard(props));

    await waitFor(() => {
      expect(result.current.guardAccessMode).toBe("load-existing");
    });

    expect(result.current.submissionGuard).toEqual({
      kind: "approved",
      message: "Boarding Form for Athul Narayanan is already approved.",
    });
    expect(props.onBlockedView).not.toHaveBeenCalled();
    expect(props.onPrepareNewRequest).not.toHaveBeenCalled();
  });
});
