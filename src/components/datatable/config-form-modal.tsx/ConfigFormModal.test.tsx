import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";

import ConfigFormModal from "./ConfigFormModal";

const mockUseFetch = jest.fn();
const mockUseConfigFormLookups = jest.fn();

const mockFlattenCols = jest.fn();
const mockNormalizeTable = jest.fn();
const mockIsRequired = jest.fn();
const mockMeets = jest.fn();
const mockResolveFileId = jest.fn();
const mockResolveRowId = jest.fn();
const mockEmptyRowFromColumns = jest.fn();

jest.mock("@mui/material", () => ({
  __esModule: true,
  Box: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  CircularProgress: () => <div data-testid="circular-progress" />,
  Dialog: ({ open, children }: any) => (open ? <div role="dialog">{children}</div> : null),
  DialogActions: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  Divider: () => <hr />,
  Typography: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("../../../hooks/useFetch", () => ({
  __esModule: true,
  default: (url: string, method: string, immediate: boolean) =>
    mockUseFetch(url, method, immediate),
}));

jest.mock("./hooks/useConfigFormLookups", () => ({
  __esModule: true,
  default: (args: any) => mockUseConfigFormLookups(args),
}));

jest.mock("./ConfigFormFieldRenderer", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid={`field-${props.field.key}`}>
      <div data-testid={`value-${props.field.key}`}>{String(props.value ?? "")}</div>
      {props.isMissing ? <div data-testid={`missing-${props.field.key}`}>missing</div> : null}
      <button
        type="button"
        data-testid={`fill-${props.field.key}`}
        onClick={() => props.onSetField(props.field.key, "filled")}
      >
        Fill
      </button>
    </div>
  ),
}));

jest.mock("./ConfigFormTable", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid={`table-${props.tbl.key}`}>table</div>,
}));

jest.mock("./FormPhotoViewerModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("./FormDocumentViewerModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../shared/DocumentGrids", () => ({
  __esModule: true,
  DocumentGrid: () => <div data-testid="document-grid" />,
}));

jest.mock("../../shared/PhotoGrids", () => ({
  __esModule: true,
  PhotoGrid: () => <div data-testid="photo-grid" />,
}));

jest.mock("./shared", () => ({
  __esModule: true,
  emptyRowFromColumns: (columns: any) => mockEmptyRowFromColumns(columns),
  flattenCols: (cols: any) => mockFlattenCols(cols),
  isRequired: (answers: any, field: any) => mockIsRequired(answers, field),
  meets: (answers: any, rule: any) => mockMeets(answers, rule),
  normalizeTable: (next: any, tbl: any) => mockNormalizeTable(next, tbl),
  resolveFileId: (file: any) => mockResolveFileId(file),
  resolveRowId: (row: any) => mockResolveRowId(row),
}));

type Props = React.ComponentProps<typeof ConfigFormModal>;
type FormConfigType = Exclude<Props["formConfig"], null>;

describe("ConfigFormModal", () => {
  let mockHookState: any;
  const mockedToast = toast as any;

  const makeField = (overrides: Record<string, unknown> = {}) =>
    ({
      key: "first_name",
      name: "first_name",
      display_name: "First Name",
      label: "First Name",
      type: "text",
      required: false,
      consent_required: false,
      ...overrides,
    }) as any;

  const makeSection = (overrides: Record<string, unknown> = {}) =>
    ({
      key: "sec1",
      title: "Section 1",
      fields: [makeField()],
      tables: [],
      ...overrides,
    }) as any;

  const makeFormConfig = (overrides: Record<string, unknown> = {}): FormConfigType =>
    ({
      key: "boarding_form",
      name: "Boarding Form",
      display_name: "Boarding Form",
      editable: true,
      consent: "",
      sections: [makeSection()],
      ...overrides,
    }) as FormConfigType;

  const makeProps = (overrides: Partial<Props> = {}): Props =>
    ({
      open: true,
      onClose: jest.fn(),
      row: {
        id: 101,
        first_name: "Athul",
        last_name: "Narayanan",
      },
      file: {
        id: 202,
        filename: "case-file.pdf",
      },
      formConfig: makeFormConfig(),
      apiBase: "/api",
      fetchPath: "/form/answers",
      savePath: "/form/answers",
      onSaved: jest.fn(),
      addInfoConfig: {
        firstname: "first_name",
        lastname: "last_name",
      },
      ...overrides,
    }) as Props;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFlattenCols.mockImplementation((cols: any) => (Array.isArray(cols) ? cols : []));
    mockNormalizeTable.mockImplementation((next: any, tbl: any) => {
      const current = { ...(next || {}) };
      const key = String(tbl?.key || "");
      if (key && !Array.isArray(current[key])) {
        current[key] = [];
      }
      return current;
    });
    mockIsRequired.mockImplementation((_answers: any, field: any) => Boolean(field?.required));
    mockMeets.mockImplementation(() => true);
    mockResolveFileId.mockImplementation((file: any) => file?.id ?? 0);
    mockResolveRowId.mockImplementation((row: any) => row?.id ?? 0);
    mockEmptyRowFromColumns.mockImplementation(() => ({}));

    mockHookState = {
      fetch: {
        data: null,
        error: null,
        loading: false,
        fetchData: jest.fn().mockResolvedValue(undefined),
      },
      save: {
        data: null,
        error: null,
        loading: false,
        fetchData: jest.fn().mockResolvedValue(undefined),
      },
      upload: {
        data: null,
        error: null,
        loading: false,
        fetchData: jest.fn().mockResolvedValue(undefined),
      },
    };

    mockUseFetch.mockImplementation((url: string, method: string) => {
      if (method === "GET" && url === "/api/form/answers") return mockHookState.fetch;
      if (method === "POST" && url === "/api/form/answers") return mockHookState.save;
      if (method === "GET" && url === "/api/form/answers/upload") return mockHookState.upload;
      throw new Error(`Unexpected useFetch call: ${method} ${url}`);
    });

    mockUseConfigFormLookups.mockReturnValue({
      lookupOptionsByPath: {},
      lookupLoadingByPath: {},
      lookupErrorsByPath: {},
      getLookupPathForColumn: jest.fn(() => ""),
      getSelectedLookupOption: jest.fn(() => null),
      applyConfiguredRowRules: jest.fn((_tbl: any, draft: any) => draft),
      resetLookupState: jest.fn(),
    });
  });

  it("returns null when formConfig is null", () => {
    const { container } = render(
      <ConfigFormModal
        {...makeProps({
          formConfig: null,
        })}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("fetches answers on open and renders fetched field value", async () => {
    mockHookState.fetch.data = {
      data: {
        details: [{ detail_key: "first_name", value: "Existing value" }],
        documents: [],
        photos: [],
        consent: true,
      },
    };

    render(<ConfigFormModal {...makeProps()} />);

    await waitFor(() => {
      expect(mockHookState.fetch.fetchData).toHaveBeenCalledWith(
        undefined,
        {
          file_id: 202,
          row_id: 101,
          form_key: "boarding_form",
        },
        false
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("value-first_name")).toHaveTextContent("Existing value");
    });
  });

  it("calls onClose when Cancel is clicked", () => {
    const props = makeProps();

    render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("blocks submit when common consent is required but not checked", async () => {
    const props = makeProps({
      formConfig: makeFormConfig({
        consent: "I agree",
        sections: [
          makeSection({
            fields: [
              makeField({
                key: "first_name",
                consent_required: true,
              }),
            ],
          }),
        ],
      }),
    });

    render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Please provide consent before submitting."
      );
    });

    expect(mockHookState.save.fetchData).not.toHaveBeenCalled();
    expect(props.onSaved).not.toHaveBeenCalled();
  });

  it("shows validation error for required empty fields and does not save", async () => {
    const props = makeProps({
      formConfig: makeFormConfig({
        sections: [
          makeSection({
            fields: [
              makeField({
                key: "first_name",
                required: true,
              }),
            ],
          }),
        ],
      }),
    });

    render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith("Please fill all required fields.");
    });

    expect(screen.getByTestId("missing-first_name")).toBeInTheDocument();
    expect(mockHookState.save.fetchData).not.toHaveBeenCalled();
  });

  it("saves valid data and calls onSaved", async () => {
    const props = makeProps({
      formConfig: makeFormConfig({
        sections: [
          makeSection({
            fields: [
              makeField({
                key: "first_name",
                required: true,
              }),
            ],
          }),
        ],
      }),
    });

    render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByTestId("fill-first_name"));

    await waitFor(() => {
      expect(screen.getByTestId("value-first_name")).toHaveTextContent("filled");
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockHookState.save.fetchData).toHaveBeenCalledTimes(1);
    });

    const saveCall = mockHookState.save.fetchData.mock.calls[0];
    const requestBody = saveCall[0];

    expect(saveCall[1]).toBeUndefined();
    expect(saveCall[2]).toBe(false);

    expect(requestBody).toMatchObject({
      file_id: 202,
      row_id: 101,
      file_name: "case-file.pdf",
      form_key: "boarding_form",
      form_label: "Boarding Form",
      consent_text: "",
      consent: false,
      documents: [],
      photos: [],
    });

    expect(requestBody.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detail_key: "first_name",
          field_type: "text",
          value: "filled",
        }),
      ])
    );

    await waitFor(() => {
      expect(props.onSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "filled",
        })
      );
    });
  });

  it("shows success toast and closes when save response is present", async () => {
    mockHookState.save.data = { ok: true };

    const props = makeProps();

    render(<ConfigFormModal {...props} />);

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Boarding Form details updated successfully"
      );
    });

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});