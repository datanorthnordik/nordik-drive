import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import dayjs from "dayjs";
import FormSubmissionGrid, { FormSubmissionRow } from "./FormSubmissionGrid";
import { ModuleRegistry } from "ag-grid-community";

let capturedAgGridProps: any = null;


jest.mock("ag-grid-community", () => ({
  __esModule: true,
  AllCommunityModule: { name: "AllCommunityModule" },
  ModuleRegistry: {
    registerModules: jest.fn(),
  },
}));

jest.mock("ag-grid-react", () => ({
  __esModule: true,
  AgGridReact: (props: any) => {
    capturedAgGridProps = props;

    const firstRow = props.rowData?.[0];
    const detailsCol = (props.columnDefs || []).find((col: any) => col.field === "__details__");

    return (
      <div data-testid="ag-grid-react">
        <div data-testid="ag-grid-row-count">{String(props.rowData?.length ?? 0)}</div>

        {(props.columnDefs || []).map((col: any, idx: number) => (
          <div key={`${col.field || col.headerName}-${idx}`} data-testid={`col-${idx}`}>
            {col.headerName}
          </div>
        ))}

        {firstRow && detailsCol?.cellRenderer ? (
          <div data-testid="details-cell">{detailsCol.cellRenderer({ data: firstRow })}</div>
        ) : null}
      </div>
    );
  },
}));

jest.mock("@mui/material", () => ({
  __esModule: true,
  Box: ({ children }: any) => <div>{children}</div>,
  Typography: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("../buttons/Button", () => ({
  __esModule: true,
  FileButton: ({ children, disabled, onClick }: any) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("FormSubmissionGrid", () => {
  const makeRow = (overrides: Partial<FormSubmissionRow> = {}): FormSubmissionRow => ({
    id: 1,
    file_id: 101,
    row_id: 1001,
    file_name: "case-file.pdf",
    form_key: "boarding_form",
    form_label: "Boarding Form",
    first_name: "Athul",
    last_name: "Narayanan",
    created_by: "creator@example.com",
    edited_by: "editor@example.com",
    reviewed_by: "reviewer@example.com",
    status: "pending",
    created_at: "2026-03-12T10:00:00Z",
    updated_at: "2026-03-12T12:34:00Z",
    ...overrides,
  });

  const makeProps = (
    overrides: Partial<React.ComponentProps<typeof FormSubmissionGrid>> = {}
  ) => ({
    title: "Form Submissions",
    rows: [makeRow(), makeRow({ id: 2, row_id: 1002, first_name: "Kavya" })],
    currentPage: 1,
    totalPages: 3,
    onPrev: jest.fn(),
    onNext: jest.fn(),
    onOpenDetails: jest.fn(),
    showCreatedByColumn: true,
    actionLabel: "View Details",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    capturedAgGridProps = null;
  });

  it("renders title, row count, and page info", () => {
    render(<FormSubmissionGrid {...makeProps()} />);

    expect(screen.getByText("Form Submissions")).toBeInTheDocument();
    expect(screen.getByText("2 rows (page 1/3)")).toBeInTheDocument();
    expect(screen.getByTestId("ag-grid-row-count")).toHaveTextContent("2");
  });

  it("disables PREV on first page and enables NEXT", () => {
    const props = makeProps({
      currentPage: 1,
      totalPages: 3,
    });

    render(<FormSubmissionGrid {...props} />);

    const prevBtn = screen.getByRole("button", { name: "PREV" });
    const nextBtn = screen.getByRole("button", { name: "NEXT" });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);

    expect(props.onNext).toHaveBeenCalledTimes(1);
    expect(props.onPrev).not.toHaveBeenCalled();
  });

  it("enables PREV and disables NEXT on last page", () => {
    const props = makeProps({
      currentPage: 3,
      totalPages: 3,
    });

    render(<FormSubmissionGrid {...props} />);

    const prevBtn = screen.getByRole("button", { name: "PREV" });
    const nextBtn = screen.getByRole("button", { name: "NEXT" });

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();

    fireEvent.click(prevBtn);

    expect(props.onPrev).toHaveBeenCalledTimes(1);
    expect(props.onNext).not.toHaveBeenCalled();
  });

  it("passes expected base grid props to AgGridReact", () => {
    render(<FormSubmissionGrid {...makeProps()} />);

    expect(capturedAgGridProps).toBeTruthy();
    expect(capturedAgGridProps.rowData).toHaveLength(2);
    expect(capturedAgGridProps.rowHeight).toBe(42);
    expect(capturedAgGridProps.headerHeight).toBe(46);
    expect(capturedAgGridProps.suppressRowClickSelection).toBe(true);
    expect(capturedAgGridProps.rowSelection).toBe("single");
    expect(capturedAgGridProps.pagination).toBe(false);
    expect(capturedAgGridProps.suppressPaginationPanel).toBe(true);
    expect(capturedAgGridProps.domLayout).toBe("normal");
    expect(capturedAgGridProps.defaultColDef).toEqual({
      resizable: true,
      sortable: true,
      filter: true,
    });
  });

  it("includes the created by column by default", () => {
    render(<FormSubmissionGrid {...makeProps()} />);

    const createdByCol = capturedAgGridProps.columnDefs.find(
      (col: any) => col.field === "created_by"
    );

    expect(createdByCol).toBeTruthy();
    expect(createdByCol.headerName).toBe("Created By");
  });

  it("omits the created by column when showCreatedByColumn is false", () => {
    render(
      <FormSubmissionGrid
        {...makeProps({
          showCreatedByColumn: false,
        })}
      />
    );

    const createdByCol = capturedAgGridProps.columnDefs.find(
      (col: any) => col.field === "created_by"
    );

    expect(createdByCol).toBeUndefined();
    expect(screen.queryByText("Created By")).not.toBeInTheDocument();
  });

  it("uses the default action label and opens details for the clicked row", () => {
    const props = makeProps();

    render(<FormSubmissionGrid {...props} />);

    const btn = screen.getByRole("button", { name: "View Details" });
    fireEvent.click(btn);

    expect(props.onOpenDetails).toHaveBeenCalledTimes(1);
    expect(props.onOpenDetails).toHaveBeenCalledWith(props.rows[0]);
  });

  it("uses a custom action label in both the header and action button", () => {
    const props = makeProps({
      actionLabel: "Review",
    });

    render(<FormSubmissionGrid {...props} />);

    expect(screen.getAllByText("Review").length).toBeGreaterThan(0);

    const actionCol = capturedAgGridProps.columnDefs.find(
      (col: any) => col.field === "__details__"
    );

    expect(actionCol).toBeTruthy();
    expect(actionCol.headerName).toBe("Review");

    fireEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(props.onOpenDetails).toHaveBeenCalledWith(props.rows[0]);
  });

  it("formats updated_at using dayjs and returns dash for empty values", () => {
    render(<FormSubmissionGrid {...makeProps()} />);

    const updatedAtCol = capturedAgGridProps.columnDefs.find(
      (col: any) => col.field === "updated_at"
    );

    expect(updatedAtCol).toBeTruthy();

    expect(
      updatedAtCol.valueFormatter({ value: "2026-03-12T12:34:00Z" })
    ).toBe(dayjs("2026-03-12T12:34:00Z").format("DD-MM-YYYY HH:mm"));

    expect(updatedAtCol.valueFormatter({ value: "" })).toBe("-");
    expect(updatedAtCol.valueFormatter({ value: null })).toBe("-");
    expect(updatedAtCol.valueFormatter({ value: undefined })).toBe("-");
  });

  it("renders all expected column headers in order", () => {
    render(<FormSubmissionGrid {...makeProps()} />);

    const headerNames = capturedAgGridProps.columnDefs.map((col: any) => col.headerName);

    expect(headerNames).toEqual([
      "Form Type",
      "First Name",
      "Last Name",
      "File",
      "Created By",
      "Edited By",
      "Reviewed By",
      "Status",
      "Updated At",
      "View Details",
    ]);
  });

  it("renders correctly with empty rows", () => {
    render(
      <FormSubmissionGrid
        {...makeProps({
          rows: [],
          currentPage: 2,
          totalPages: 5,
        })}
      />
    );

    expect(screen.getByText("0 rows (page 2/5)")).toBeInTheDocument();
    expect(screen.getByTestId("ag-grid-row-count")).toHaveTextContent("0");
    expect(screen.queryByTestId("details-cell")).not.toBeInTheDocument();
  });
});