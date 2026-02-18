// src/components/models/PasswordModal.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import PasswordModal from "./PasswordModal";

/**
 * ---------------------------
 * Mocks (CRA-safe: use mock*)
 * ---------------------------
 */

// constants
jest.mock("../../constants/messages", () => ({
  __esModule: true,
  password_validation_success: "Password validated successfully",
}));

// colors (component imports these)
jest.mock("../../constants/colors", () => ({
  __esModule: true,
  color_secondary: "#004B9C",
  color_secondary_dark: "#003A7A",
  color_white: "#FFFFFF",
}));

// toast
const mockToastSuccess = jest.fn();
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}));

// Loader
jest.mock("../Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => (
    <div data-testid="loader">{loading ? "loading" : "idle"}</div>
  ),
}));

// Close icon
jest.mock("@mui/icons-material/Close", () => ({
  __esModule: true,
  default: () => <span data-testid="close-icon">x</span>,
}));

// react-router-dom (even if unused, keep stable)
const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({ __esModule: true, useNavigate: () => mockNavigate }),
  { virtual: true }
);

// MUI: simplify DOM (no portals)
jest.mock("@mui/material", () => {
  const React = require("react");

  const Dialog = ({ open, onClose, children }: any) =>
    open ? (
      <div role="dialog" data-testid="dialog">
        {children}
        {/* helper to call onClose (simulates backdrop/escape) */}
        <button type="button" data-testid="dialog-onclose" onClick={onClose}>
          dialog-onclose
        </button>
      </div>
    ) : null;

  const DialogTitle = ({ children }: any) => (
    <div data-testid="dialog-title">{children}</div>
  );
  const DialogContent = ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  );
  const DialogActions = ({ children }: any) => (
    <div data-testid="dialog-actions">{children}</div>
  );

  const Typography = ({ children }: any) => (
    <div data-testid="typography">{children}</div>
  );

  const Box = ({ children }: any) => <div data-testid="box">{children}</div>;

  const Divider = () => <div data-testid="divider" />;

  const IconButton = ({ children, onClick, ...rest }: any) => (
    <button type="button" data-testid="icon-button" onClick={onClick} {...rest}>
      {children}
    </button>
  );

  const TextField = ({
    label,
    value,
    onChange,
    onKeyDown,
    helperText,
    error,
  }: any) => (
    <div>
      <input
        aria-label={label}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        data-testid="password-input"
      />
      {/* mimic helper text output */}
      <div data-testid="helper-text" data-error={error ? "true" : "false"}>
        {helperText}
      </div>
    </div>
  );

  const Button = ({ children, onClick, disabled, ...rest }: any) => (
    <button type="button" onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );

  return {
    __esModule: true,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Button,
    Box,
    IconButton,
    Divider,
  };
});

/**
 * useFetch mock
 */
type FetchState = {
  loading: boolean;
  error: any;
  data: any;
};

let mockFetchState: FetchState;
const mockFetchData = jest.fn();

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: () => ({
    loading: mockFetchState.loading,
    error: mockFetchState.error,
    data: mockFetchState.data,
    fetchData: mockFetchData,
  }),
}));

function setFetch(next: Partial<FetchState>) {
  mockFetchState = { ...mockFetchState, ...next };
}

describe("PasswordModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchState = { loading: false, error: undefined, data: undefined };
  });

  afterEach(() => cleanup());

  test("renders dialog + title + input + buttons; Loader reflects loading", () => {
    const closePasswordModal = jest.fn();
    setFetch({ loading: true });

    render(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    expect(screen.getByTestId("loader")).toHaveTextContent("loading");
    expect(screen.getByText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  test("Cancel calls closePasswordModal(false) and resets input + helperText error", async () => {
    const closePasswordModal = jest.fn();

    const { rerender } = render(
      <PasswordModal open={true} closePasswordModal={closePasswordModal} />
    );

    const input = screen.getByLabelText("Password");
    fireEvent.change(input, { target: { value: "wrong" } });

    // simulate error coming from useFetch
    setFetch({ error: "bad", data: undefined });
    rerender(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    expect(screen.getByTestId("helper-text")).toHaveTextContent(
      "Incorrect password. Please try again."
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(closePasswordModal).toHaveBeenCalledWith(false);

    await waitFor(() => {
      expect(screen.getByTestId("password-input")).toHaveValue("");
      expect(screen.getByTestId("helper-text")).not.toHaveTextContent(
        "Incorrect password. Please try again."
      );
    });
  });

  test("Top-right close (IconButton) also closes the modal with false", () => {
    const closePasswordModal = jest.fn();

    render(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    fireEvent.click(screen.getByTestId("icon-button"));
    expect(closePasswordModal).toHaveBeenCalledWith(false);
  });

  test("Submit is disabled when password is empty", () => {
    const closePasswordModal = jest.fn();

    render(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(mockFetchData).not.toHaveBeenCalled();
  });

  test("Pressing Enter on empty input shows 'Please enter your password.'", async () => {
    const closePasswordModal = jest.fn();

    render(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    const input = screen.getByLabelText("Password");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("helper-text")).toHaveTextContent(
        "Please enter your password."
      );
    });
    expect(mockFetchData).not.toHaveBeenCalled();
  });

  test("Submit calls fetchData when password present; Enter key also triggers verify", () => {
    const closePasswordModal = jest.fn();

    render(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    const input = screen.getByLabelText("Password");
    fireEvent.change(input, { target: { value: "secret" } });

    const submitBtn = screen.getByRole("button", { name: "Submit" });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(mockFetchData).toHaveBeenCalledWith({ password: "secret" });

    mockFetchData.mockClear();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockFetchData).toHaveBeenCalledWith({ password: "secret" });
  });

  test("success path: when data exists and no error -> toast.success + closePasswordModal(true)", async () => {
    const closePasswordModal = jest.fn();
    const { rerender } = render(
      <PasswordModal open={true} closePasswordModal={closePasswordModal} />
    );

    setFetch({ data: { ok: true }, error: undefined });
    rerender(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Password validated successfully");
      expect(closePasswordModal).toHaveBeenCalledWith(true);
    });
  });

  test("error path: when error exists -> shows incorrect password message via helperText", async () => {
    const closePasswordModal = jest.fn();
    const { rerender } = render(
      <PasswordModal open={true} closePasswordModal={closePasswordModal} />
    );

    setFetch({ data: undefined, error: "Invalid" });
    rerender(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    await waitFor(() => {
      expect(screen.getByTestId("helper-text")).toHaveTextContent(
        "Incorrect password. Please try again."
      );
    });
  });

  test("catch branch: if toast.success throws, shows 'Error verifying password...'", async () => {
    const closePasswordModal = jest.fn();
    const { rerender } = render(
      <PasswordModal open={true} closePasswordModal={closePasswordModal} />
    );

    mockToastSuccess.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    setFetch({ data: { ok: true }, error: undefined });
    rerender(<PasswordModal open={true} closePasswordModal={closePasswordModal} />);

    await waitFor(() => {
      expect(screen.getByTestId("helper-text")).toHaveTextContent(
        "Error verifying password. Please try again."
      );
    });
  });
});
