import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

let lastDocumentGridProps: any = null;
let lastPhotoGridProps: any = null;
let lastPhotoViewerProps: any = null;
let lastDocumentViewerProps: any = null;

let mockResetLookupState: jest.Mock;
let mockApplyConfiguredRowRules: jest.Mock;

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
  TextField: ({ label, value, onChange, disabled }: any) => (
    <div>
      <textarea
        aria-label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  ),
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

      {props.isMissing ? (
        <div data-testid={`missing-${props.field.key}`}>missing</div>
      ) : null}

      <button
        type="button"
        data-testid={`fill-${props.field.key}`}
        onClick={() => props.onSetField(props.field.key, "filled")}
      >
        Fill
      </button>

      {props.field.type === "doc_upload" ? (
        <input
          data-testid={`docs-upload-${props.field.key}`}
          type="file"
          multiple
          onChange={props.onDocsUpload}
        />
      ) : null}

      {props.field.type === "photo_upload" ? (
        <input
          data-testid={`photos-upload-${props.field.key}`}
          type="file"
          multiple
          onChange={props.onPhotosUpload}
        />
      ) : null}

      {props.additionalDocs?.length ? (
        <>
          <button
            type="button"
            data-testid={`doc-category-${props.field.key}`}
            onClick={() => props.onDocCategory(props.additionalDocs[0].id, "passport")}
          >
            Set Doc Category
          </button>

          <button
            type="button"
            data-testid={`doc-remove-${props.field.key}`}
            onClick={() => props.onDocRemove(props.additionalDocs[0].id)}
          >
            Remove Doc
          </button>
        </>
      ) : null}

      {props.photos?.length ? (
        <>
          <button
            type="button"
            data-testid={`photo-remove-${props.field.key}`}
            onClick={() => props.onPhotoRemove(0)}
          >
            Remove Photo
          </button>

          <button
            type="button"
            data-testid={`photo-replace-${props.field.key}`}
            onClick={() =>
              props.onPhotosChange([
                {
                  id: "replaced-photo",
                  file: new File(["replaced"], "replaced.jpg", { type: "image/jpeg" }),
                  comment: "updated",
                },
              ])
            }
          >
            Replace Photos
          </button>
        </>
      ) : null}

      {props.renderExistingDocumentsGrid?.(props.field.key)}
      {props.renderExistingPhotosGrid?.(props.field.key)}
    </div>
  ),
}));

jest.mock("./ConfigFormTable", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid={`table-${props.tbl.key}`}>table</div>,
}));

jest.mock("./FormPhotoViewerModal", () => ({
  __esModule: true,
  default: (props: any) => {
    lastPhotoViewerProps = props;

    if (!props.open) return null;

    const current = props.photos?.[props.startIndex ?? 0];

    return (
      <div data-testid="photo-viewer-modal">
        <div data-testid="photo-viewer-current-id">{String(current?.id ?? "")}</div>
        <button
          type="button"
          data-testid="photo-viewer-approve"
          onClick={() => props.onApprove?.(current)}
        >
          Approve Photo Viewer
        </button>
      </div>
    );
  },
}));

jest.mock("./FormDocumentViewerModal", () => ({
  __esModule: true,
  default: (props: any) => {
    lastDocumentViewerProps = props;

    if (!props.open) return null;

    const current = props.docs?.[props.startIndex ?? 0];

    return (
      <div data-testid="document-viewer-modal">
        <div data-testid="document-viewer-current-id">{String(current?.id ?? "")}</div>
        <button
          type="button"
          data-testid="document-viewer-open"
          onClick={() => props.onOpen?.(current)}
        >
          Open Document Viewer
        </button>
      </div>
    );
  },
}));

jest.mock("../../shared/DocumentGrids", () => ({
  __esModule: true,
  DocumentGrid: (props: any) => {
    lastDocumentGridProps = props;
    const first = props.documents?.[0];

    return (
      <div data-testid="document-grid">
        <div data-testid="document-grid-count">{String(props.documents?.length ?? 0)}</div>

        {first ? (
          <>
            <div data-testid="document-grid-status">
              {props.statusLabel?.(first.status)}
            </div>

            <button
              type="button"
              data-testid="open-doc-0"
              onClick={() => props.onOpenViewer?.(0)}
            >
              Open Doc
            </button>

            <button
              type="button"
              data-testid="download-doc-first"
              onClick={() =>
                props.onDownloadSingle?.(first.id, first.file_name, first.mime_type)
              }
            >
              Download Doc
            </button>

            <button
              type="button"
              data-testid="approve-doc-first"
              onClick={() => props.onApprove?.(first.id)}
            >
              Approve Doc
            </button>

            <button
              type="button"
              data-testid="reject-doc-first"
              onClick={() => props.onReject?.(first.id)}
            >
              Reject Doc
            </button>

            <input
              data-testid="comment-doc-first"
              value={first.reviewer_comment ?? ""}
              onChange={(e) =>
                props.onReviewerCommentChange?.(first.id, e.target.value)
              }
            />
          </>
        ) : null}
      </div>
    );
  },
}));

jest.mock("../../shared/PhotoGrids", () => ({
  __esModule: true,
  PhotoGrid: (props: any) => {
    lastPhotoGridProps = props;
    const first = props.photos?.[0];

    return (
      <div data-testid="photo-grid">
        <div data-testid="photo-grid-count">{String(props.photos?.length ?? 0)}</div>

        {first ? (
          <>
            <div data-testid="photo-grid-status">
              {props.statusLabel?.(first.status)}
            </div>

            <button
              type="button"
              data-testid="open-photo-0"
              onClick={() => props.onOpenViewer?.(0)}
            >
              Open Photo
            </button>

            <button
              type="button"
              data-testid="download-photo-first"
              onClick={() => props.onDownloadSingle?.(first.id)}
            >
              Download Photo
            </button>

            <button
              type="button"
              data-testid="approve-photo-first"
              onClick={() => props.onApprove?.(first.id)}
            >
              Approve Photo
            </button>

            <button
              type="button"
              data-testid="reject-photo-first"
              onClick={() => props.onReject?.(first.id)}
            >
              Reject Photo
            </button>

            <input
              data-testid="comment-photo-first"
              value={first.reviewer_comment ?? ""}
              onChange={(e) =>
                props.onReviewerCommentChange?.(first.id, e.target.value)
              }
            />
          </>
        ) : null}
      </div>
    );
  },
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
      reviewPath: "/form/answers/review",
      onSaved: jest.fn(),
      addInfoConfig: {
        firstname: "first_name",
        lastname: "last_name",
      },
      ...overrides,
    }) as Props;

  const rerenderWith = (view: any, props: Props) => {
    view.rerender(<ConfigFormModal {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    lastDocumentGridProps = null;
    lastPhotoGridProps = null;
    lastPhotoViewerProps = null;
    lastDocumentViewerProps = null;

    mockResetLookupState = jest.fn();
    mockApplyConfiguredRowRules = jest.fn((_tbl: any, draft: any) => draft);

    mockFlattenCols.mockImplementation((cols: any) => (Array.isArray(cols) ? cols : []));
    mockNormalizeTable.mockImplementation((next: any, tbl: any) => {
      const current = { ...(next || {}) };
      const key = String(tbl?.key || "");
      if (key && !Array.isArray(current[key])) current[key] = [];
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
      review: {
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
      if (method === "POST" && url === "/api/form/answers/review") return mockHookState.review;
      if (method === "GET" && url === "/api/form/answers/upload") return mockHookState.upload;
      throw new Error(`Unexpected useFetch call: ${method} ${url}`);
    });

    mockUseConfigFormLookups.mockReturnValue({
      lookupOptionsByPath: {},
      lookupLoadingByPath: {},
      lookupErrorsByPath: {},
      getLookupPathForColumn: jest.fn(() => ""),
      getSelectedLookupOption: jest.fn(() => null),
      applyConfiguredRowRules: mockApplyConfiguredRowRules,
      resetLookupState: mockResetLookupState,
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

  it("fetches answers on open and renders fetched field value from details", async () => {
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

  it("renders legacy answers shape and refetches when identity changes", async () => {
    mockHookState.fetch.data = {
      answers: {
        first_name: "Legacy value",
      },
    };

    const props = makeProps();
    const view = render(<ConfigFormModal {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId("value-first_name")).toHaveTextContent("Legacy value");
    });

    const nextProps = makeProps({
      row: {
        id: 999,
        first_name: "Athul",
        last_name: "Narayanan",
      },
    });

    rerenderWith(view, nextProps);

    await waitFor(() => {
      expect(mockHookState.fetch.fetchData).toHaveBeenLastCalledWith(
        undefined,
        {
          file_id: 202,
          row_id: 999,
          form_key: "boarding_form",
        },
        false
      );
    });

    expect(mockResetLookupState).toHaveBeenCalledTimes(2);
  });

  it("calls onClose when Cancel is clicked", () => {
    const props = makeProps();

    render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("shows validation error for required empty text field and does not save", async () => {
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

  it("shows validation error for required doc and photo uploads when none are provided", async () => {
    const props = makeProps({
      formConfig: makeFormConfig({
        sections: [
          makeSection({
            fields: [
              makeField({
                key: "doc_field",
                type: "doc_upload",
                required: true,
              }),
              makeField({
                key: "photo_field",
                type: "photo_upload",
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

    expect(screen.getByTestId("missing-doc_field")).toBeInTheDocument();
    expect(screen.getByTestId("missing-photo_field")).toBeInTheDocument();
    expect(mockHookState.save.fetchData).not.toHaveBeenCalled();
  });

  it("submits consent as false by default and true when checkbox is checked", async () => {
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

    const view = render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockHookState.save.fetchData).toHaveBeenCalledTimes(1);
    });

    expect(mockHookState.save.fetchData.mock.calls[0][0]).toMatchObject({
      consent_text: "I agree",
      consent: false,
    });

    act(() => {
      mockHookState.save.loading = true;
      view.rerender(<ConfigFormModal {...props} />);
    });

    act(() => {
      mockHookState.save.loading = false;
      mockHookState.save.data = { ok: true };
      view.rerender(<ConfigFormModal {...props} />);
    });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockHookState.save.fetchData).toHaveBeenCalledTimes(2);
    });

    expect(mockHookState.save.fetchData.mock.calls[1][0]).toMatchObject({
      consent_text: "I agree",
      consent: true,
    });
  });

  it("shows fetch, save, review, and upload errors as toast errors", async () => {
    mockHookState.fetch.error = "Fetch failed";
    mockHookState.save.error = "Save failed";
    mockHookState.review.error = "Review failed";
    mockHookState.upload.error = "Upload failed";

    render(<ConfigFormModal {...makeProps()} />);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith("Fetch failed");
      expect(mockedToast.error).toHaveBeenCalledWith("Save failed");
      expect(mockedToast.error).toHaveBeenCalledWith("Review failed");
      expect(mockedToast.error).toHaveBeenCalledWith("Upload failed");
    });
  });

  it("saves valid data, shows success toast, calls onSaved, and closes", async () => {
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

    const view = render(<ConfigFormModal {...props} />);

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
      firstname: "Athul",
      lastname: "Narayanan",
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

    act(() => {
      mockHookState.save.loading = true;
      rerenderWith(view, props);
    });

    act(() => {
      mockHookState.save.loading = false;
      mockHookState.save.data = { ok: true };
      rerenderWith(view, props);
    });

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Boarding Form details updated successfully"
      );
    });

    expect(props.onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "filled",
      })
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("uploads new documents and photos and includes base64 payloads", async () => {
    class MockFileReader {
      public result: string | null = null;
      public onload: null | (() => void) = null;
      public onerror: null | (() => void) = null;

      readAsDataURL(file: File) {
        this.result = `data:${file.type};base64,ZmFrZQ==`;
        if (this.onload) this.onload();
      }
    }

    const originalFileReader = (global as any).FileReader;
    (global as any).FileReader = MockFileReader as any;

    const props = makeProps({
      formConfig: makeFormConfig({
        sections: [
          makeSection({
            fields: [
              makeField({
                key: "doc_field",
                type: "doc_upload",
              }),
              makeField({
                key: "photo_field",
                type: "photo_upload",
              }),
            ],
          }),
        ],
      }),
    });

    render(<ConfigFormModal {...props} />);

    const docFile = new File(["doc"], "passport.pdf", {
      type: "application/pdf",
    });
    const photoFile = new File(["photo"], "original.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(screen.getByTestId("docs-upload-doc_field"), {
      target: { files: [docFile] },
    });

    fireEvent.change(screen.getByTestId("photos-upload-photo_field"), {
      target: { files: [photoFile] },
    });

    fireEvent.click(screen.getByTestId("doc-category-doc_field"));
    fireEvent.click(screen.getByTestId("photo-replace-photo_field"));

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockHookState.save.fetchData).toHaveBeenCalledTimes(1);
    });

    const requestBody = mockHookState.save.fetchData.mock.calls[0][0];

    expect(requestBody.documents).toEqual([
      expect.objectContaining({
        detail_key: "doc_field",
        file_name: "passport.pdf",
        mime_type: "application/pdf",
        file_category: "passport",
        data_base64: "data:application/pdf;base64,ZmFrZQ==",
        is_existing: false,
      }),
    ]);

    expect(requestBody.photos).toEqual([
      expect.objectContaining({
        detail_key: "photo_field",
        file_name: "replaced.jpg",
        mime_type: "image/jpeg",
        file_comment: "updated",
        data_base64: "data:image/jpeg;base64,ZmFrZQ==",
        is_existing: false,
      }),
    ]);

    (global as any).FileReader = originalFileReader;
  });

  it("renders existing document and photo grids, opens viewers, and downloads existing media", async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: jest.fn(() => "blob:mock-url"),
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: jest.fn(),
    });

    const anchorClickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => { });

    mockHookState.fetch.data = {
      data: {
        id: 55,
        details: [],
        documents: [
          {
            id: 11,
            detail_key: "doc_field",
            file_name: "existing.pdf",
            mime_type: "application/pdf",
            file_category: "passport",
            file_size_bytes: 100,
            status: "approved",
          },
        ],
        photos: [
          {
            id: 22,
            detail_key: "photo_field",
            file_name: "existing.jpg",
            mime_type: "image/jpeg",
            file_comment: "front view",
            file_size_bytes: 200,
            status: "rejected",
          },
        ],
      },
    };

    const props = makeProps({
      formConfig: makeFormConfig({
        sections: [
          makeSection({
            fields: [
              makeField({
                key: "doc_field",
                type: "doc_upload",
              }),
              makeField({
                key: "photo_field",
                type: "photo_upload",
              }),
            ],
          }),
        ],
      }),
    });

    const view = render(<ConfigFormModal {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-grid")).toBeInTheDocument();
      expect(screen.getByTestId("photo-grid")).toBeInTheDocument();
    });

    expect(screen.getByTestId("document-grid-status")).toHaveTextContent("Approved");
    expect(screen.getByTestId("photo-grid-status")).toHaveTextContent("Rejected");

    fireEvent.click(screen.getByTestId("open-doc-0"));
    fireEvent.click(screen.getByTestId("open-photo-0"));

    await waitFor(() => {
      expect(screen.getByTestId("document-viewer-modal")).toBeInTheDocument();
      expect(screen.getByTestId("photo-viewer-modal")).toBeInTheDocument();
      expect(screen.getByTestId("document-viewer-current-id")).toHaveTextContent("11");
      expect(screen.getByTestId("photo-viewer-current-id")).toHaveTextContent("22");
    });

    fireEvent.click(screen.getByTestId("download-doc-first"));

    await waitFor(() => {
      expect(mockHookState.upload.fetchData).toHaveBeenCalledWith(
        undefined,
        undefined,
        false,
        {
          path: 11,
          responseType: "blob",
        }
      );
    });

    act(() => {
      mockHookState.upload.data = new Blob(["doc"], { type: "application/pdf" });
      view.rerender(<ConfigFormModal {...props} />);
    });

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(anchorClickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    anchorClickSpy.mockRestore();

    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: originalCreateObjectURL,
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: originalRevokeObjectURL,
    });
  });

  it("shows review configuration error when reviewStatuses is missing", async () => {
    const props = makeProps({
      review: true,
      reviewStatuses: undefined,
    });

    render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Review status configuration is missing."
      );
    });

    expect(mockHookState.save.fetchData).not.toHaveBeenCalled();
    expect(mockHookState.review.fetchData).not.toHaveBeenCalled();
  });

  it("shows review error when submission id is missing", async () => {
    const props = makeProps({
      review: true,
      reviewStatuses: {
        approved: "APPROVED",
        rejected: "REJECTED",
        moreInfo: "MORE_INFO",
      },
    });

    render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith("Submission ID not found.");
    });

    expect(mockHookState.save.fetchData).not.toHaveBeenCalled();
  });

  it("requires review comment for rejected and more-info actions", async () => {
    mockHookState.fetch.data = {
      data: {
        id: 88,
        details: [],
        documents: [],
        photos: [],
      },
    };

    const props = makeProps({
      review: true,
      reviewStatuses: {
        approved: "APPROVED",
        rejected: "REJECTED",
        moreInfo: "MORE_INFO",
      },
    });

    render(<ConfigFormModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith("Review comment is required.");
    });

    fireEvent.click(screen.getByRole("button", { name: "Need More Info" }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith("Review comment is required.");
    });

    expect(mockHookState.save.fetchData).not.toHaveBeenCalled();
  });

  it("requires upload review comment for rejected existing files", async () => {
    mockHookState.fetch.data = {
      data: {
        id: 77,
        details: [],
        documents: [
          {
            id: 11,
            detail_key: "doc_field",
            file_name: "existing.pdf",
            mime_type: "application/pdf",
            status: "pending",
          },
        ],
        photos: [],
      },
    };

    const props = makeProps({
      review: true,
      reviewStatuses: {
        approved: "APPROVED",
        rejected: "REJECTED",
        moreInfo: "MORE_INFO",
      },
      formConfig: makeFormConfig({
        sections: [
          makeSection({
            fields: [
              makeField({
                key: "doc_field",
                type: "doc_upload",
              }),
            ],
          }),
        ],
      }),
    });

    render(<ConfigFormModal {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-grid")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reject-doc-first"));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Review comment is required for rejected file #11."
      );
    });

    expect(mockHookState.save.fetchData).not.toHaveBeenCalled();
  });

  it("submits review flow with mapped upload statuses and closes on success", async () => {
    mockHookState.fetch.data = {
      data: {
        id: 77,
        details: [{ detail_key: "first_name", value: "Existing value" }],
        documents: [
          {
            id: 11,
            detail_key: "doc_field",
            file_name: "existing.pdf",
            mime_type: "application/pdf",
            status: "pending",
          },
        ],
        photos: [
          {
            id: 22,
            detail_key: "photo_field",
            file_name: "existing.jpg",
            mime_type: "image/jpeg",
            file_comment: "front view",
            status: "pending",
          },
        ],
      },
    };

    const props = makeProps({
      review: true,
      reviewStatuses: {
        approved: "APPROVED",
        rejected: "REJECTED",
        moreInfo: "MORE_INFO",
      },
      formConfig: makeFormConfig({
        sections: [
          makeSection({
            fields: [
              makeField({
                key: "first_name",
              }),
              makeField({
                key: "doc_field",
                type: "doc_upload",
              }),
              makeField({
                key: "photo_field",
                type: "photo_upload",
              }),
            ],
          }),
        ],
      }),
    });

    const view = render(<ConfigFormModal {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-grid")).toBeInTheDocument();
      expect(screen.getByTestId("photo-grid")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Review Comment"), {
      target: { value: "Need clearer scan" },
    });

    fireEvent.click(screen.getByTestId("approve-doc-first"));
    fireEvent.click(screen.getByTestId("reject-photo-first"));
    fireEvent.change(screen.getByTestId("comment-photo-first"), {
      target: { value: "Too blurry" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Need More Info" }));

    await waitFor(() => {
      expect(mockHookState.save.fetchData).toHaveBeenCalledTimes(1);
    });

    act(() => {
      mockHookState.save.loading = true;
      rerenderWith(view, props);
    });

    act(() => {
      mockHookState.save.loading = false;
      mockHookState.save.data = { ok: true };
      rerenderWith(view, props);
    });

    await waitFor(() => {
      expect(mockHookState.review.fetchData).toHaveBeenCalledTimes(1);
    });

    expect(mockHookState.review.fetchData).toHaveBeenCalledWith(
      {
        submission_id: 77,
        submission_review: {
          status: "MORE_INFO",
          reviewer_comment: "Need clearer scan",
        },
        upload_reviews: [
          {
            upload_id: 11,
            status: "APPROVED",
            reviewer_comment: "",
          },
          {
            upload_id: 22,
            status: "REJECTED",
            reviewer_comment: "Too blurry",
          },
        ],
      },
      undefined,
      false
    );

    act(() => {
      mockHookState.review.loading = true;
      rerenderWith(view, props);
    });

    act(() => {
      mockHookState.review.loading = false;
      mockHookState.review.data = { ok: true };
      rerenderWith(view, props);
    });

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith("Review submitted successfully");
    });

    expect(props.onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Existing value",
      })
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});