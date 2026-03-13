import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import MyFormSubmissionRequests from "./MyFormSubmissionRequests";

const mockUseFetch = jest.fn();
let lastGridProps: any = null;

jest.mock("@mui/material", () => ({
  __esModule: true,
  Box: ({ children }: any) => <div>{children}</div>,
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
      <div data-testid="cfg-editable">{String(props.isEditable)}</div>
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

describe("MyFormSubmissionRequests", () => {
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
      if (method === "POST" && url === "/api/form/my-requests") return hookState.search;
      if (method === "GET" && url.startsWith("/api/config")) return hookState.config;

      throw new Error(`Unexpected useFetch call: ${method} ${url}`);
    });
  });

  it("fetches my requests on mount and shows loader from search loading", async () => {
    hookState.search.loading = true;

    render(<MyFormSubmissionRequests />);

    expect(screen.getByTestId("loader")).toHaveTextContent("true");

    await waitFor(() => {
      expect(hookState.search.fetchData).toHaveBeenCalledWith({
        page: 1,
        page_size: 20,
      });
    });
  });

  it("shows loader when config loading is true", () => {
    hookState.config.loading = true;

    render(<MyFormSubmissionRequests />);

    expect(screen.getByTestId("loader")).toHaveTextContent("true");
  });

  it("renders grid data from search response", async () => {
    hookState.search.data = {
      page: 2,
      page_size: 20,
      total_items: 1,
      total_pages: 5,
      items: searchItems,
    };

    render(<MyFormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByTestId("grid-title")).toHaveTextContent(
        "My Form Submission Requests"
      );
    });

    expect(screen.getByTestId("grid-page")).toHaveTextContent("2/5");
    expect(screen.getByTestId("grid-rows")).toHaveTextContent("1");
    expect(screen.getByTestId("grid-action-label")).toHaveTextContent("Open Form");
    expect(screen.getByTestId("grid-show-created-by")).toHaveTextContent("false");
  });

  it("uses fallback values when search response fields are missing", async () => {
    hookState.search.data = {
      items: [],
    };

    render(<MyFormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByTestId("grid-page")).toHaveTextContent("1/1");
    });

    expect(screen.getByTestId("grid-rows")).toHaveTextContent("0");
  });

  it("uses grid prev and next callbacks to fetch adjacent pages", async () => {
    hookState.search.data = {
      page: 2,
      page_size: 20,
      total_items: 1,
      total_pages: 3,
      items: searchItems,
    };

    render(<MyFormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByTestId("grid-page")).toHaveTextContent("2/3");
    });

    hookState.search.fetchData.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Grid Prev" }));
    fireEvent.click(screen.getByRole("button", { name: "Grid Next" }));

    expect(hookState.search.fetchData).toHaveBeenNthCalledWith(1, {
      page: 1,
      page_size: 20,
    });
    expect(hookState.search.fetchData).toHaveBeenNthCalledWith(2, {
      page: 3,
      page_size: 20,
    });
  });

  it("opens modal when config contains a matching form config", async () => {
    hookState.search.data = {
      page: 1,
      page_size: 20,
      total_items: 1,
      total_pages: 1,
      items: searchItems,
    };

    const view = render(<MyFormSubmissionRequests />);

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
      view.rerender(<MyFormSubmissionRequests />);
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
    expect(screen.getByTestId("cfg-editable")).toHaveTextContent("true");
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

    const view = render(<MyFormSubmissionRequests />);

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
      view.rerender(<MyFormSubmissionRequests />);
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

    const view = render(<MyFormSubmissionRequests />);

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
      view.rerender(<MyFormSubmissionRequests />);
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
    render(<MyFormSubmissionRequests />);

    expect(hookState.config.fetchData).not.toHaveBeenCalled();
    expect(screen.queryByTestId("config-form-modal")).not.toBeInTheDocument();
  });
});