import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ConfigFormTableSection from "./ConfigFormTable";

const mockAsBool = jest.fn((v: unknown) => Boolean(v));
const mockBuildHeader = jest.fn();
const mockFlattenCols = jest.fn();
const mockGetLeafColWidth = jest.fn((col: unknown) => (col as { width?: number })?.width ?? 180);
const mockGetOptionLabel = jest.fn(
  (item: unknown) =>
    (item as { label?: string; name?: string; id?: string | number })?.label ??
    (item as { label?: string; name?: string; id?: string | number })?.name ??
    String((item as { id?: string | number })?.id ?? "")
);

jest.mock("./shared", () => ({
  __esModule: true,
  asBool: (v: unknown) => mockAsBool(v),
  buildHeader: (cols: unknown) => mockBuildHeader(cols),
  flattenCols: (cols: unknown) => mockFlattenCols(cols),
  getLeafColWidth: (col: unknown) => mockGetLeafColWidth(col),
  getOptionLabel: (item: unknown) => mockGetOptionLabel(item),
  inputSx: {},
  readOnlyValueSx: {},
  requiredBadge: "*",
}));

jest.mock("../../../constants/colors", () => ({
  color_border: "#ddd",
  color_confidential_card_bg: "#fee",
  color_error: "red",
  color_focus_ring: "blue",
  color_text_primary: "black",
  color_text_secondary: "#555",
  color_white: "white",
  color_white_smoke: "#f5f5f5",
}));

type Props = React.ComponentProps<typeof ConfigFormTableSection>;
type LookupOption = NonNullable<ReturnType<Props["getSelectedLookupOption"]>>;

describe("ConfigFormTableSection", () => {
  const normalizeText = (value: string | null | undefined) =>
    (value || "").replace(/\s+/g, " ").trim();

  const makeLookup = (overrides: Record<string, unknown> = {}): LookupOption =>
    ({
      id: "1",
      name: "Option",
      label: "Option",
      ...overrides,
    }) as unknown as LookupOption;

  const makeCol = (overrides: Record<string, unknown> = {}) =>
    ({
      key: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter name",
      required: false,
      disabled: false,
      is_server: false,
      api: "",
      width: 180,
      ...overrides,
    }) as any;

  const makeTbl = (overrides: Record<string, unknown> = {}) =>
    ({
      key: "tbl1",
      title: "Boarding Homes",
      note: "Add one row per entry",
      columns: [{}],
      allow_add_rows: true,
      add_row_label: "Add row",
      ...overrides,
    }) as unknown as Props["tbl"];

  const setHeaderForCols = (cols: any[], hasGroup = false) => {
    mockFlattenCols.mockReturnValue(cols);

    if (hasGroup) {
      mockBuildHeader.mockReturnValue({
        hasGroup: true,
        row1: [
          {
            label: "Grouped",
            colSpan: cols.length,
            rowSpan: 1,
            width: cols.reduce((sum, c) => sum + (c.width ?? 180), 0),
            required: false,
          },
        ],
        row2: cols.map((c) => ({
          label: c.label,
          width: c.width ?? 180,
          required: Boolean(c.required),
        })),
      });
      return;
    }

    mockBuildHeader.mockReturnValue({
      hasGroup: false,
      row1: cols.map((c) => ({
        label: c.label,
        colSpan: 1,
        rowSpan: 1,
        width: c.width ?? 180,
        required: Boolean(c.required),
      })),
      row2: [],
    });
  };

  const makeProps = (overrides: Partial<Props> = {}): Props =>
    ({
      tbl: makeTbl(),
      sectionTitle: "Section title",
      rows: [{ name: "Athul" }],
      editable: true,
      missingKeys: new Set<string>(),

      lookupOptionsByPath: {},
      lookupLoadingByPath: {},
      lookupErrorsByPath: {},

      getLookupPathForColumn: jest.fn(() => "") as unknown as Props["getLookupPathForColumn"],
      getSelectedLookupOption:
        jest.fn(() => null) as unknown as Props["getSelectedLookupOption"],

      setConfiguredCell: jest.fn() as unknown as Props["setConfiguredCell"],
      addRow: jest.fn() as unknown as Props["addRow"],
      removeRow: jest.fn() as unknown as Props["removeRow"],

      ...overrides,
    }) as Props;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsBool.mockImplementation((v: unknown) => Boolean(v));
    mockGetLeafColWidth.mockImplementation(
      (col: unknown) => (col as { width?: number })?.width ?? 180
    );
    mockGetOptionLabel.mockImplementation(
      (item: unknown) =>
        (item as { label?: string; name?: string; id?: string | number })?.label ??
        (item as { label?: string; name?: string; id?: string | number })?.name ??
        String((item as { id?: string | number })?.id ?? "")
    );
  });

  it("renders title, note, headers, table aria-label, and add button", () => {
    const col = makeCol();
    setHeaderForCols([col]);

    const props = makeProps({
      tbl: makeTbl({
        title: "Boarding Homes",
        note: "Add one row per entry",
        allow_add_rows: true,
        add_row_label: "Add resident",
      }),
    });

    render(<ConfigFormTableSection {...props} />);

    expect(screen.getByText("Boarding Homes")).toBeInTheDocument();
    expect(screen.getByText("Add one row per entry")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Boarding Homes" })).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add resident" })).toBeInTheDocument();
  });

  it("updates a text cell when editable", () => {
    const col = makeCol({
      key: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter name",
    });
    setHeaderForCols([col]);

    const props = makeProps({
      rows: [{ name: "Athul" }],
    });

    render(<ConfigFormTableSection {...props} />);

    const input = screen.getByDisplayValue("Athul");
    fireEvent.change(input, { target: { value: "Kavya" } });

    expect(props.setConfiguredCell).toHaveBeenCalledWith(props.tbl, 0, col, "Kavya");
  });

  it("shows required helper text for a missing text cell", () => {
    const col = makeCol({
      key: "name",
      label: "Name",
      type: "text",
    });
    setHeaderForCols([col]);

    const props = makeProps({
      rows: [{ name: "" }],
      missingKeys: new Set<string>(["t:tbl1:0:name"]),
    });

    render(<ConfigFormTableSection {...props} />);

    expect(screen.getByText("This field is required.")).toBeInTheDocument();
  });

  it("calls removeRow and addRow when editable", () => {
    const col = makeCol();
    setHeaderForCols([col]);

    const props = makeProps({
      tbl: makeTbl({
        allow_add_rows: true,
        add_row_label: "Add resident",
      }),
    });

    render(<ConfigFormTableSection {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "remove row" }));
    expect(props.removeRow).toHaveBeenCalledWith(props.tbl, 0);

    fireEvent.click(screen.getByRole("button", { name: "Add resident" }));
    expect(props.addRow).toHaveBeenCalledWith(props.tbl);
  });

  it("disables remove and add actions when not editable", () => {
    const col = makeCol();
    setHeaderForCols([col]);

    const props = makeProps({
      editable: false,
      tbl: makeTbl({
        allow_add_rows: true,
        add_row_label: "Add resident",
      }),
    });

    render(<ConfigFormTableSection {...props} />);

    const removeBtn = screen.getByRole("button", { name: "remove row" });
    const addBtn = screen.getByRole("button", { name: "Add resident" });

    expect(removeBtn).toBeDisabled();
    expect(addBtn).toBeDisabled();

    fireEvent.click(removeBtn);
    fireEvent.click(addBtn);

    expect(props.removeRow).not.toHaveBeenCalled();
    expect(props.addRow).not.toHaveBeenCalled();
  });

  it("shows dropdown lookup error helper text for editable server-backed dropdown", () => {
    const col = makeCol({
      key: "category",
      label: "Category",
      type: "dropdown",
      is_server: true,
      api: "/api/categories",
    });
    setHeaderForCols([col]);

    const props = makeProps({
      rows: [{ category: "" }],
      getLookupPathForColumn:
        jest.fn(() => "lookup/category") as unknown as Props["getLookupPathForColumn"],
      lookupErrorsByPath: {
        "lookup/category": "boom",
      },
    });

    render(<ConfigFormTableSection {...props} />);

    expect(props.getLookupPathForColumn).toHaveBeenCalledWith(col, { category: "" });
    expect(screen.getByText("Failed to load options.")).toBeInTheDocument();
  });

  it("renders read-only dropdown text using selected lookup option when disabled", () => {
    const col = makeCol({
      key: "category",
      label: "Category",
      type: "dropdown",
      is_server: true,
      api: "/api/categories/{parentId}",
    });
    setHeaderForCols([col]);

    const props = makeProps({
      editable: false,
      rows: [{ category: "99" }],
      getLookupPathForColumn:
        jest.fn(() => "lookup/category/99") as unknown as Props["getLookupPathForColumn"],
      getSelectedLookupOption:
        jest.fn(() =>
          makeLookup({
            id: "99",
            name: "Residential School",
            label: "Residential School",
          })
        ) as unknown as Props["getSelectedLookupOption"],
      lookupOptionsByPath: {
        "lookup/category/99": [
          makeLookup({
            id: "1",
            name: "Hospital",
            label: "Hospital",
          }),
        ],
      },
    });

    render(<ConfigFormTableSection {...props} />);

    expect(props.getLookupPathForColumn).toHaveBeenCalledWith(col, { category: "99" });
    expect(props.getSelectedLookupOption).toHaveBeenCalledWith(col, { category: "99" });
    expect(screen.getByText("Residential School")).toBeInTheDocument();
  });

  it("renders second header row when buildHeader returns grouped headers", () => {
    const col1 = makeCol({ key: "first_name", label: "First Name", required: true });
    const col2 = makeCol({ key: "last_name", label: "Last Name", required: false });
    setHeaderForCols([col1, col2], true);

    const props = makeProps({
      rows: [{ first_name: "A", last_name: "B" }],
    });

    render(<ConfigFormTableSection {...props} />);

    expect(screen.getByText("Grouped")).toBeInTheDocument();

    const headerTexts = screen
      .getAllByRole("columnheader")
      .map((el) => normalizeText(el.textContent));

    expect(headerTexts).toContain("Grouped");
    expect(headerTexts).toContain("First Name *");
    expect(headerTexts).toContain("Last Name");
    expect(headerTexts).toContain("Actions");
  });
});