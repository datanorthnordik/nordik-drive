// src/components/models/RequestManagementModal.test.tsx
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import RequestManagementModal from "./RequestManagementModal";

/**
 * ---------------------------
 * CRA-safe mocks (use mock*)
 * ---------------------------
 */

// Loader
jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => (
    <div data-testid="loader">{loading ? "loading" : "idle"}</div>
  ),
}));

// CloseButton
jest.mock("../buttons/Button", () => ({
  __esModule: true,
  CloseButton: ({ children, onClick, ...rest }: any) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

// react-router-dom
const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    __esModule: true,
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

// MUI simplified (no portals; predictable DOM)
jest.mock("@mui/material", () => {
  const React = require("react");

  const Button = ({ children, ...props }: any) => (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={Boolean(props.disabled)}
      aria-disabled={Boolean(props.disabled)}
      {...props}
    >
      {children}
    </button>
  );

  const Checkbox = ({ checked }: any) => (
    <input type="checkbox" aria-label="checkbox" checked={Boolean(checked)} readOnly />
  );

  const Chip = ({ label }: any) => <span data-testid="chip">{label}</span>;

  const FormControl = ({ children }: any) => <div data-testid="form-control">{children}</div>;
  const FormHelperText = ({ children }: any) => <div data-testid="helper-text">{children}</div>;
  const InputLabel = ({ children, id }: any) => <label htmlFor={id}>{children}</label>;

  const MenuItem = ({ children, value }: any) => <option value={value}>{children}</option>;

  const Select = ({ value, onChange, labelId, children }: any) => (
    <select aria-label={labelId || "select"} value={value ?? ""} onChange={onChange}>
      <option value="" />
      {children}
    </select>
  );

  const TextField = ({
    label,
    placeholder,
    error,
    helperText,
    value,
    onChange,
    ...rest
  }: any) => (
    <div>
      <label>{label}</label>
      <input
        aria-label={label}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
        data-testid="text-field"
        {...rest}
      />
      {error && <div data-testid="text-error">{helperText}</div>}
    </div>
  );

  // Minimal Autocomplete supporting multiple select and calling onChange(_, value)
  const Autocomplete = ({
    options = [],
    multiple,
    value = multiple ? [] : null,
    onChange,
    getOptionLabel,
    renderInput,
  }: any) => {
    const selectedArr = Array.isArray(value) ? value : value ? [value] : [];

    const isSelected = (opt: any) => selectedArr.some((v: any) => v?.id === opt?.id);

    const toggle = (opt: any) => {
      if (!multiple) {
        onChange?.(null, opt);
        return;
      }
      const next = isSelected(opt)
        ? selectedArr.filter((v: any) => v?.id !== opt?.id)
        : [...selectedArr, opt];
      onChange?.(null, next);
    };

    return (
      <div data-testid="autocomplete">
        {/* renderInput */}
        {renderInput?.({})}

        {/* Selected tags */}
        <div data-testid="selected-tags">
          {selectedArr.map((opt: any) => (
            <span key={opt.id} data-testid="selected-tag">
              {getOptionLabel ? getOptionLabel(opt) : String(opt)}
            </span>
          ))}
        </div>

        {/* Options */}
        <div role="listbox" aria-label="files-options">
          {options.map((opt: any) => {
            const label = getOptionLabel ? getOptionLabel(opt) : String(opt);
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected(opt)}
                onClick={() => toggle(opt)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return {
    __esModule: true,
    Autocomplete,
    Button,
    Checkbox,
    Chip,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
  };
});

/**
 * useFetch mock (3 calls in component)
 */
type FetchState = {
  loading: boolean;
  data: any;
  error: any;
};

let mockRolesState: FetchState;
let mockFilesState: FetchState;
let mockUpdateState: FetchState;

const mockFetchRoles = jest.fn();
const mockFetchFiles = jest.fn();
const mockFetchUpdate = jest.fn();

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: (url: string) => {
    if (String(url).includes("/api/role")) {
      return {
        data: mockRolesState.data,
        loading: mockRolesState.loading,
        error: mockRolesState.error,
        fetchData: mockFetchRoles,
      };
    }
    if (String(url).includes("/api/file")) {
      return {
        data: mockFilesState.data,
        loading: mockFilesState.loading,
        error: mockFilesState.error,
        fetchData: mockFetchFiles,
      };
    }
    // /api/requests/update
    return {
      data: mockUpdateState.data,
      loading: mockUpdateState.loading,
      error: mockUpdateState.error,
      fetchData: mockFetchUpdate,
    };
  },
}));

function setRoles(next: Partial<FetchState>) {
  mockRolesState = { ...mockRolesState, ...next };
}
function setFiles(next: Partial<FetchState>) {
  mockFilesState = { ...mockFilesState, ...next };
}
function setUpdate(next: Partial<FetchState>) {
  mockUpdateState = { ...mockUpdateState, ...next };
}

describe("RequestManagementModal", () => {
  const selectedRequest = {
    community_name: "Shingwauk",
    user_id: 777,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRolesState = {
      loading: false,
      error: undefined,
      data: { roles: [{ id: 1, role: "viewer" }, { id: 2, role: "admin" }] },
    };

    mockFilesState = {
      loading: false,
      error: undefined,
      data: {
        files: [
          { id: 10, filename: "f1.xlsx" },
          { id: 11, filename: "f2.pdf" },
        ],
      },
    };

    mockUpdateState = { loading: false, error: undefined, data: undefined };
  });

  afterEach(() => cleanup());

  test("mount: calls roles fetchData(null) and files fetchData(null); loader idle", async () => {
    const onClose = jest.fn();
    const onProcess = jest.fn();

    render(
      <RequestManagementModal
        selectedRequest={selectedRequest}
        onClose={onClose}
        onProcess={onProcess}
      />
    );

    expect(screen.getByTestId("loader")).toHaveTextContent("idle");

    await waitFor(() => {
      expect(mockFetchRoles).toHaveBeenCalledWith(null);
      expect(mockFetchFiles).toHaveBeenCalledWith(null);
    });

    // Options present
    expect(screen.getByRole("option", { name: "f1.xlsx" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "f2.pdf" })).toBeInTheDocument();
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  test("validation: submit without selecting files/role shows both errors", async () => {
    const onClose = jest.fn();
    const onProcess = jest.fn();

    render(
      <RequestManagementModal
        selectedRequest={selectedRequest}
        onClose={onClose}
        onProcess={onProcess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(
        screen.getByText("Please select at least one file")
      ).toBeInTheDocument();
      expect(screen.getByText("Please select a role")).toBeInTheDocument();
    });

    expect(mockFetchUpdate).not.toHaveBeenCalled();
  });

  test("select files + role then submit calls PUT fetchData with mapped body; updateRequest triggers onProcess", async () => {
    const onClose = jest.fn();
    const onProcess = jest.fn();

    const { rerender } = render(
      <RequestManagementModal
        selectedRequest={selectedRequest}
        onClose={onClose}
        onProcess={onProcess}
      />
    );

    // select two files (multiple)
    fireEvent.click(screen.getByRole("option", { name: "f1.xlsx" }));
    fireEvent.click(screen.getByRole("option", { name: "f2.pdf" }));

    // select role
    const roleSelect = screen.getByRole("combobox");
    fireEvent.change(roleSelect, { target: { value: "viewer" } });

    // submit
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(mockFetchUpdate).toHaveBeenCalledTimes(1);
    });

    const body = mockFetchUpdate.mock.calls[0][0];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toEqual([
      {
        filename: "f1.xlsx",
        community_name: "Shingwauk",
        user_id: 777,
        status: "approved",
        role: "viewer",
      },
      {
        filename: "f2.pdf",
        community_name: "Shingwauk",
        user_id: 777,
        status: "approved",
        role: "viewer",
      },
    ]);

    // Simulate updateRequest received => onProcess called
    setUpdate({ data: { ok: true } });
    rerender(
      <RequestManagementModal
        selectedRequest={selectedRequest}
        onClose={onClose}
        onProcess={onProcess}
      />
    );

    await waitFor(() => {
      expect(onProcess).toHaveBeenCalledTimes(1);
    });
  });

  test("Close button calls onClose", () => {
    const onClose = jest.fn();
    const onProcess = jest.fn();

    render(
      <RequestManagementModal
        selectedRequest={selectedRequest}
        onClose={onClose}
        onProcess={onProcess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("loader reflects combined loading flags (roles/files/update)", () => {
    const onClose = jest.fn();
    const onProcess = jest.fn();

    setRoles({ loading: true });
    render(
      <RequestManagementModal
        selectedRequest={selectedRequest}
        onClose={onClose}
        onProcess={onProcess}
      />
    );
    expect(screen.getByTestId("loader")).toHaveTextContent("loading");

    cleanup();

    setRoles({ loading: false });
    setFiles({ loading: true });
    render(
      <RequestManagementModal
        selectedRequest={selectedRequest}
        onClose={onClose}
        onProcess={onProcess}
      />
    );
    expect(screen.getByTestId("loader")).toHaveTextContent("loading");

    cleanup();

    setFiles({ loading: false });
    setUpdate({ loading: true });
    render(
      <RequestManagementModal
        selectedRequest={selectedRequest}
        onClose={onClose}
        onProcess={onProcess}
      />
    );
    expect(screen.getByTestId("loader")).toHaveTextContent("loading");
  });
});
