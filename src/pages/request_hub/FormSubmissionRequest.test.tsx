import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import FormSubmissionRequests from "./FormSubmissionRequest";

const mockUseFetch = jest.fn();
let lastGridProps: any = null;

jest.mock("@mui/material", () => ({
  __esModule: true,
  Box: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick, disabled, startIcon }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {startIcon}
      {children}
    </button>
  ),
  Chip: ({ label }: any) => <div>{label}</div>,
}));

jest.mock("@mui/icons-material/Refresh", () => ({
  __esModule: true,
  default: () => <span data-testid="refresh-icon">refresh-icon</span>,
}));

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: (url: string, method: string, immediate: boolean) =>
    mockUseFetch(url, method, immediate),
}));

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => <div data-testid="loader">{String(loading)}</div>,
}));

jest.mock("../../constants/constants", () => ({
  __esModule: true,
  API_BASE: "/api",
}));

jest.mock("../../constants/statuses", () => ({
  __esModule: true,
  FORM_SUBMISSION_STATUS_OPTIONS: [
    { value: "pending", label: "Pending", reviewed_needed: true },
    { value: "approved", label: "Approved", reviewed_needed: false },
    { value: "needs review", label: "Needs Review", reviewed_needed: true },
    { value: "rejected", label: "Rejected", reviewed_needed: false },
  ],
}));

jest.mock("../../components/datatable/config-form-modal.tsx/ConfigFormModal", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="config-form-modal">
      <div data-testid="cfg-open">{String(props.open)}</div>
      <div data-testid="cfg-row-id">{String(props.row?.id ?? "")}</div>
      <div data-testid="cfg-row-firstname">{String(props.row?.first_name ?? "")}</div>
      <div data-testid="cfg-row-lastname">{String(props.row?.last_name ?? "")}</div>
      <div data-testid="cfg-file-id">{String(props.file?.id ?? "")}</div>
      <div data-testid="cfg-file-name">{String(props.file?.filename ?? "")}</div>
      <div data-testid="cfg-form-key">{String(props.formConfig?.key ?? "")}</div>
      <div data-testid="cfg-fetch-submission-id">{String(props.fetchSubmissionId ?? "")}</div>
      <div data-testid="cfg-editable">{String(props.isEditable)}</div>
      <div data-testid="cfg-review">{String(props.review)}</div>
      <div data-testid="cfg-review-path">{String(props.reviewPath ?? "")}</div>
      <div data-testid="cfg-review-approved">
        {String(props.reviewStatuses?.approved ?? "")}
      </div>
      <div data-testid="cfg-review-rejected">
        {String(props.reviewStatuses?.rejected ?? "")}
      </div>
      <div data-testid="cfg-review-moreinfo">
        {String(props.reviewStatuses?.moreInfo ?? "")}
      </div>
      <div data-testid="cfg-addinfo-firstname">
        {String(props.addInfoConfig?.firstname ?? "")}
      </div>
      <div data-testid="cfg-addinfo-lastname">
        {String(props.addInfoConfig?.lastname ?? "")}
      </div>
      <button type="button" onClick={props.onClose}>
        Close Modal
      </button>
    </div>
  ),
}));

jest.mock("../../components/tables/FormSubmissionGrid", () => ({
  __esModule: true,
  default: (props: any) => {
    lastGridProps = props;

    return (
      <div data-testid="form-submission-grid">
        <div data-testid="grid-title">{props.title}</div>
        <div data-testid="grid-page">
          {String(props.currentPage)}/{String(props.totalPages)}
        </div>
        <div data-testid="grid-rows">{String(props.rows?.length ?? 0)}</div>
        <div data-testid="grid-action-label">{props.actionLabel}</div>
        <div data-testid="grid-show-created-by">
          {String(props.showCreatedByColumn)}
        </div>
        <button type="button" onClick={props.onPrev}>
          Grid Prev
        </button>
        <button type="button" onClick={props.onNext}>
          Grid Next
        </button>
        <button
          type="button"
          onClick={() => props.rows?.[0] && props.onOpenDetails(props.rows[0])}
        >
          Open First Details
        </button>
      </div>
    );
  },
}));

describe("FormSubmissionRequests", () => {
  let hookState: any;

  const searchItems = [
    {
      id: 1,
      file_id: 501,
      row_id: 9001,
      file_name: "z file.csv",
      form_key: "boarding_form",
      form_label: "Boarding Form",
      first_name: "Athul",
      last_name: "Narayanan",
      created_by: "creator@example.com",
      edited_by: "editor@example.com",
      reviewed_by: "reviewer@example.com",
      status: "pending",
      created_at: "2026-03-12T10:00:00Z",
      updated_at: "2026-03-12T12:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    lastGridProps = null;

    hookState = {
      search: {
        loading: false,
        data: null,
        fetchData: jest.fn(),
      },
      config: {
        loading: false,
        data: null,
        fetchData: jest.fn(),
      },
    };

    mockUseFetch.mockImplementation((url: string, method: string) => {
      if (method === "POST" && url === "/api/form/search") return hookState.search;
      if (method === "GET" && url.startsWith("/api/config")) return hookState.config;

      throw new Error(`Unexpected useFetch call: ${method} ${url}`);
    });
  });

  it("fetches review-required submissions on mount and shows loader from search loading", async () => {
    hookState.search.loading = true;

    render(<FormSubmissionRequests />);

    expect(screen.getByTestId("loader")).toHaveTextContent("true");

    await waitFor(() => {
      expect(hookState.search.fetchData).toHaveBeenCalledWith({
        page: 1,
        page_size: 20,
        status: ["pending", "needs review"],
      });
    });
  });

  it("shows loader when config loading is true", () => {
    hookState.config.loading = true;

    render(<FormSubmissionRequests />);

    expect(screen.getByTestId("loader")).toHaveTextContent("true");
  });

  it("renders summary chips and grid data from search response", async () => {
    hookState.search.data = {
      page: 2,
      page_size: 20,
      total_items: 17,
      total_pages: 5,
      items: searchItems,
    };

    render(<FormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByText("Total Requests: 17")).toBeInTheDocument();
    });

    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    expect(screen.getByTestId("grid-title")).toHaveTextContent(
      "Form Submission Review Requests"
    );
    expect(screen.getByTestId("grid-page")).toHaveTextContent("2/5");
    expect(screen.getByTestId("grid-rows")).toHaveTextContent("1");
    expect(screen.getByTestId("grid-action-label")).toHaveTextContent("View / Review");
    expect(screen.getByTestId("grid-show-created-by")).toHaveTextContent("true");
    expect(screen.getByTestId("refresh-icon")).toBeInTheDocument();
  });

  it("uses fallback values when search response fields are missing", async () => {
    hookState.search.data = {
      items: [],
    };

    render(<FormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByText("Total Requests: 0")).toBeInTheDocument();
    });

    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.getByTestId("grid-page")).toHaveTextContent("1/1");
    expect(screen.getByTestId("grid-rows")).toHaveTextContent("0");
  });

  it("refreshes the current page", async () => {
    hookState.search.data = {
      page: 3,
      page_size: 20,
      total_items: 17,
      total_pages: 5,
      items: searchItems,
    };

    render(<FormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
    });

    hookState.search.fetchData.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /Refresh/i }));

    expect(hookState.search.fetchData).toHaveBeenCalledWith({
      page: 3,
      page_size: 20,
      status: ["pending", "needs review"],
    });
  });

  it("uses grid prev and next callbacks to fetch adjacent pages", async () => {
    hookState.search.data = {
      page: 2,
      page_size: 20,
      total_items: 17,
      total_pages: 3,
      items: searchItems,
    };

    render(<FormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByTestId("grid-page")).toHaveTextContent("2/3");
    });

    hookState.search.fetchData.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Grid Prev" }));
    fireEvent.click(screen.getByRole("button", { name: "Grid Next" }));

    expect(hookState.search.fetchData).toHaveBeenNthCalledWith(1, {
      page: 1,
      page_size: 20,
      status: ["pending", "needs review"],
    });
    expect(hookState.search.fetchData).toHaveBeenNthCalledWith(2, {
      page: 3,
      page_size: 20,
      status: ["pending", "needs review"],
    });
  });

  it("opens review modal when config contains a matching form config", async () => {
    hookState.search.data = {
      page: 1,
      page_size: 20,
      total_items: 1,
      total_pages: 1,
      items: searchItems,
    };

    const view = render(<FormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open First Details" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open First Details" }));

    await waitFor(() => {
      expect(hookState.config.fetchData).toHaveBeenCalledTimes(1);
    });

    expect(mockUseFetch).toHaveBeenCalledWith(
      "/api/config?file_name=z%20file.csv",
      "GET",
      false
    );

    act(() => {
      hookState.config.data = {
        config: {
          addInfo: {
            firstname: "first_name",
            lastname: "last_name",
          },
          columns: [
            {
              type: "form",
              key: "boarding_form",
              display_name: "Boarding Form",
            },
          ],
        },
      };
      view.rerender(<FormSubmissionRequests />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("config-form-modal")).toBeInTheDocument();
    });

    expect(screen.getByTestId("cfg-open")).toHaveTextContent("true");
    expect(screen.getByTestId("cfg-row-id")).toHaveTextContent("9001");
    expect(screen.getByTestId("cfg-row-firstname")).toHaveTextContent("Athul");
    expect(screen.getByTestId("cfg-row-lastname")).toHaveTextContent("Narayanan");
    expect(screen.getByTestId("cfg-file-id")).toHaveTextContent("501");
    expect(screen.getByTestId("cfg-file-name")).toHaveTextContent("z file.csv");
    expect(screen.getByTestId("cfg-form-key")).toHaveTextContent("boarding_form");
    expect(screen.getByTestId("cfg-fetch-submission-id")).toHaveTextContent("1");
    expect(screen.getByTestId("cfg-editable")).toHaveTextContent("true");
    expect(screen.getByTestId("cfg-review")).toHaveTextContent("true");
    expect(screen.getByTestId("cfg-review-path")).toHaveTextContent("/form/answers/review");
    expect(screen.getByTestId("cfg-review-approved")).toHaveTextContent("approved");
    expect(screen.getByTestId("cfg-review-rejected")).toHaveTextContent("rejected");
    expect(screen.getByTestId("cfg-review-moreinfo")).toHaveTextContent(
      "needs more information"
    );
    expect(screen.getByTestId("cfg-addinfo-firstname")).toHaveTextContent("first_name");
    expect(screen.getByTestId("cfg-addinfo-lastname")).toHaveTextContent("last_name");
  });

  it("closes the modal, clears active state, and refetches the current page", async () => {
    hookState.search.data = {
      page: 4,
      page_size: 20,
      total_items: 1,
      total_pages: 4,
      items: searchItems,
    };

    const view = render(<FormSubmissionRequests />);

    fireEvent.click(screen.getByRole("button", { name: "Open First Details" }));

    await waitFor(() => {
      expect(hookState.config.fetchData).toHaveBeenCalledTimes(1);
    });

    act(() => {
      hookState.config.data = {
        config: {
          addInfo: {
            firstname: "first_name",
            lastname: "last_name",
          },
          columns: [
            {
              type: "form",
              key: "boarding_form",
              display_name: "Boarding Form",
            },
          ],
        },
      };
      view.rerender(<FormSubmissionRequests />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("config-form-modal")).toBeInTheDocument();
    });

    hookState.search.fetchData.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Close Modal" }));

    expect(screen.queryByTestId("config-form-modal")).not.toBeInTheDocument();
    expect(hookState.search.fetchData).toHaveBeenCalledWith({
      page: 4,
      page_size: 20,
      status: ["pending", "needs review"],
    });
  });

  it("logs an error and does not open modal when matching form config is missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    hookState.search.data = {
      page: 1,
      page_size: 20,
      total_items: 1,
      total_pages: 1,
      items: searchItems,
    };

    const view = render(<FormSubmissionRequests />);

    fireEvent.click(screen.getByRole("button", { name: "Open First Details" }));

    await waitFor(() => {
      expect(hookState.config.fetchData).toHaveBeenCalledTimes(1);
    });

    act(() => {
      hookState.config.data = {
        config: {
          addInfo: {
            firstname: "first_name",
            lastname: "last_name",
          },
          columns: [
            {
              type: "form",
              key: "other_form",
              display_name: "Other Form",
            },
          ],
        },
      };
      view.rerender(<FormSubmissionRequests />);
    });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "No matching form config found for form_key:",
        "boarding_form"
      );
    });

    expect(screen.queryByTestId("config-form-modal")).not.toBeInTheDocument();

    errorSpy.mockRestore();
  });

  it("does not fetch config when there is no pending details row", () => {
    render(<FormSubmissionRequests />);

    expect(hookState.config.fetchData).not.toHaveBeenCalled();
    expect(screen.queryByTestId("config-form-modal")).not.toBeInTheDocument();
  });
});
