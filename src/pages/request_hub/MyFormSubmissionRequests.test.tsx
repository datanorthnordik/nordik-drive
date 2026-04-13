import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import MyFormSubmissionRequests from "./MyFormSubmissionRequests";

const mockUseFetch = jest.fn();

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: (url: string, method: string, immediate: boolean) =>
    mockUseFetch(url, method, immediate),
}));

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => <div data-testid="loader">{String(loading)}</div>,
}));

jest.mock("../../config/api", () => ({
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
      <div data-testid="cfg-fetch-submission-id">{String(props.fetchSubmissionId ?? "")}</div>
      <div data-testid="cfg-editable">{String(props.isEditable)}</div>
      <div data-testid="cfg-show-upload-reviewer-comments">
        {String(props.showUploadReviewerComments)}
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

describe("MyFormSubmissionRequests", () => {
  let hookState: any;

  const pendingItem = {
    id: 1,
    file_id: 501,
    row_id: 9001,
    file_name: "boarding-form.csv",
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
  };

  const needsMoreInfoItem = {
    ...pendingItem,
    id: 2,
    row_id: 9002,
    file_id: 502,
    file_name: "needs-more-info.csv",
    status: "needs more information",
  };

  const approvedItem = {
    ...pendingItem,
    id: 3,
    row_id: 9003,
    file_id: 503,
    file_name: "approved-form.csv",
    status: "approved",
  };

  beforeEach(() => {
    jest.clearAllMocks();

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

  const getSearchInput = () => within(screen.getByTestId("search-input")).getByRole("textbox");

  it("fetches once on mount and groups rows into the two local sections", async () => {
    hookState.search.data = {
      page: 1,
      page_size: 1000,
      total_items: 3,
      total_pages: 1,
      items: [pendingItem, needsMoreInfoItem, approvedItem],
    };

    render(<MyFormSubmissionRequests />);

    await waitFor(() => {
      expect(hookState.search.fetchData).toHaveBeenCalledWith({
        page: 1,
        page_size: 1000,
      });
    });

    expect(screen.getByTestId("loader")).toHaveTextContent("false");
    expect(screen.getByTestId("tab-pending")).toHaveTextContent(
      "Pending / Need More Information (2)"
    );
    expect(screen.getByTestId("tab-approved")).toHaveTextContent("Approved / Rejected (1)");

    expect(screen.getByTestId("submission-row-9001")).toBeInTheDocument();
    expect(screen.getByTestId("submission-row-9002")).toBeInTheDocument();
    expect(screen.queryByTestId("submission-row-9003")).not.toBeInTheDocument();
    expect(screen.getByTestId("status-chip-9001")).toHaveTextContent("Pending review");
    expect(screen.getByTestId("status-chip-9002")).toHaveTextContent("Needs more information");

    fireEvent.click(screen.getByTestId("tab-approved"));

    expect(screen.getByTestId("submission-row-9003")).toBeInTheDocument();
    expect(screen.queryByTestId("submission-row-9001")).not.toBeInTheDocument();
  });

  it("filters the active section and refreshes from the empty state", async () => {
    hookState.search.data = {
      page: 1,
      page_size: 1000,
      total_items: 2,
      total_pages: 1,
      items: [pendingItem, needsMoreInfoItem],
    };

    render(<MyFormSubmissionRequests />);

    await waitFor(() => {
      expect(screen.getByTestId("submission-row-9001")).toBeInTheDocument();
    });

    fireEvent.change(getSearchInput(), { target: { value: "9002" } });

    expect(screen.queryByTestId("submission-row-9001")).not.toBeInTheDocument();
    expect(screen.getByTestId("submission-row-9002")).toBeInTheDocument();

    fireEvent.change(getSearchInput(), { target: { value: "missing-value" } });

    expect(screen.getByText("No pending or needs more information requests.")).toBeInTheDocument();

    hookState.search.fetchData.mockClear();
    fireEvent.click(screen.getByTestId("refresh-btn"));

    expect(hookState.search.fetchData).toHaveBeenCalledWith({
      page: 1,
      page_size: 1000,
    });
  });

  it("opens pending and needs more information rows in editable mode", async () => {
    hookState.search.data = {
      page: 1,
      page_size: 1000,
      total_items: 2,
      total_pages: 1,
      items: [pendingItem, needsMoreInfoItem],
    };

    const view = render(<MyFormSubmissionRequests />);

    fireEvent.click(screen.getByTestId("details-btn-9002"));

    await waitFor(() => {
      expect(hookState.config.fetchData).toHaveBeenCalledTimes(1);
    });

    expect(mockUseFetch).toHaveBeenCalledWith(
      "/api/config?file_name=needs-more-info.csv",
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
    expect(screen.getByTestId("cfg-row-id")).toHaveTextContent("9002");
    expect(screen.getByTestId("cfg-row-firstname")).toHaveTextContent("Athul");
    expect(screen.getByTestId("cfg-row-lastname")).toHaveTextContent("Narayanan");
    expect(screen.getByTestId("cfg-file-id")).toHaveTextContent("502");
    expect(screen.getByTestId("cfg-file-name")).toHaveTextContent("needs-more-info.csv");
    expect(screen.getByTestId("cfg-form-key")).toHaveTextContent("boarding_form");
    expect(screen.getByTestId("cfg-fetch-submission-id")).toHaveTextContent("2");
    expect(screen.getByTestId("cfg-editable")).toHaveTextContent("true");
    expect(screen.getByTestId("cfg-show-upload-reviewer-comments")).toHaveTextContent("true");
    expect(screen.getByTestId("cfg-addinfo-firstname")).toHaveTextContent("first_name");
    expect(screen.getByTestId("cfg-addinfo-lastname")).toHaveTextContent("last_name");
  });

  it("opens approved rows in readonly mode and refetches after closing", async () => {
    hookState.search.data = {
      page: 1,
      page_size: 1000,
      total_items: 1,
      total_pages: 1,
      items: [approvedItem],
    };

    const view = render(<MyFormSubmissionRequests />);

    fireEvent.click(screen.getByTestId("tab-approved"));
    fireEvent.click(screen.getByTestId("details-btn-9003"));

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
      expect(screen.getByTestId("cfg-editable")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("cfg-fetch-submission-id")).toHaveTextContent("3");

    hookState.search.fetchData.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Close Modal" }));

    expect(screen.queryByTestId("config-form-modal")).not.toBeInTheDocument();
    expect(hookState.search.fetchData).toHaveBeenCalledWith({
      page: 1,
      page_size: 1000,
    });
  });

  it("logs an error and does not open the modal when the matching form config is missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    hookState.search.data = {
      page: 1,
      page_size: 1000,
      total_items: 1,
      total_pages: 1,
      items: [pendingItem],
    };

    const view = render(<MyFormSubmissionRequests />);

    fireEvent.click(screen.getByTestId("details-btn-9001"));

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
});
