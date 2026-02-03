import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import PasswordResetModal from "./PasswordReset";

// ---- mock toast ----
import toast from "react-hot-toast";
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  success: jest.fn(),
  error: jest.fn(),
}));

// ---- mock useFetch ----
const mockUseFetch = jest.fn();
jest.mock("../hooks/useFetch", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseFetch(...args),
}));

type FetchState = {
  fetchData: jest.Mock;
  loading: boolean;
  error: any;
  data: any;
};

const setupUseFetchMock = (sendState: FetchState, verifyState: FetchState) => {
  mockUseFetch.mockImplementation((url: string) => {
    if (url.includes("/send-otp")) return sendState;
    if (url.includes("/reset-password")) return verifyState;
    // safe fallback
    return { fetchData: jest.fn(), loading: false, error: null, data: null };
  });
};

describe("PasswordResetModal", () => {
  const renderModal = (props?: Partial<React.ComponentProps<typeof PasswordResetModal>>) => {
    const onClose = jest.fn();
    const utils = render(<PasswordResetModal open={true} onClose={onClose} {...props} />);
    return { ...utils, onClose };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders email step initially", () => {
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    renderModal();

    expect(screen.getByTestId("reset-modal")).toBeInTheDocument();
    expect(screen.getByText("Password Reset")).toBeInTheDocument();

    // Email field visible, OTP/password not visible
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.queryByLabelText("Enter OTP")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("New Password")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Send OTP" })).toBeInTheDocument();
  });

  test("email step validation: required + invalid email; does not call send-otp fetchData", async () => {
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    renderModal();

    // submit empty
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
    });
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(sendState.fetchData).not.toHaveBeenCalled();

    // invalid email
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "abc" } });
      fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
    });
    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
    expect(sendState.fetchData).not.toHaveBeenCalled();
  });

  test("submitting valid email calls send-otp fetchData with {email}", async () => {
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    renderModal();

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "athul@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
    });

    expect(sendState.fetchData).toHaveBeenCalledWith({ email: "athul@example.com" });
  });

  test("when otpSend arrives, shows success toast and moves to reset step (OTP + Password fields)", async () => {
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    const { rerender } = renderModal();

    // submit email first (sets internal email state)
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "athul@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
    });

    // simulate backend success for send-otp
    sendState.data = { ok: true };

    await act(async () => {
      rerender(<PasswordResetModal open={true} onClose={jest.fn()} />);
    });

    expect((toast as any).success).toHaveBeenCalledWith("OTP sent successfully");

    // reset step visible
    expect(screen.queryByLabelText("Email Address")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Enter OTP")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Password" })).toBeInTheDocument();
  });

  test("shows toast error when otp send fails", async () => {
    const sendState: FetchState = {
      fetchData: jest.fn(),
      loading: false,
      error: { message: "User not found" },
      data: null,
    };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    renderModal();

    // effect runs on mount because error is present
    expect((toast as any).error).toHaveBeenCalledWith("User not found");
  });

  test("reset step validation: OTP required + password min length; does not call verifyOtp", async () => {
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: { ok: true } };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    renderModal();

    // we start with otpSend already present => component should move to reset step
    // (effect executes after mount)
    expect(await screen.findByLabelText("Enter OTP")).toBeInTheDocument();

    // submit empty
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));
    });

    expect(await screen.findByText("OTP is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(verifyState.fetchData).not.toHaveBeenCalled();

    // too short password
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Enter OTP"), { target: { value: "1234" } });
      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "123" } });
      fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));
    });

    expect(await screen.findByText("Min 6 characters")).toBeInTheDocument();
    expect(verifyState.fetchData).not.toHaveBeenCalled();
  });

  test("submitting valid OTP + password calls verifyOtp with { email, otp, password }", async () => {
    // Start at email step, submit email, then simulate otpSend to move to reset
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    const { rerender } = renderModal();

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "athul@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
    });

    // move to reset step
    sendState.data = { ok: true };

    await act(async () => {
      rerender(<PasswordResetModal open={true} onClose={jest.fn()} />);
    });

    // fill otp + password
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Enter OTP"), { target: { value: "9999" } });
      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "123456" } });
      fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));
    });

    expect(verifyState.fetchData).toHaveBeenCalledWith({
      email: "athul@example.com",
      otp: "9999",
      password: "123456",
    });
  });

  test("when otpVerify succeeds, shows success toast and calls onClose", async () => {
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: { ok: true } };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    const { onClose, rerender } = renderModal();

    // now simulate verify success
    verifyState.data = { ok: true };

    await act(async () => {
      rerender(<PasswordResetModal open={true} onClose={onClose} />);
    });

    expect((toast as any).success).toHaveBeenCalledWith("OTP verified successfully");
    expect(onClose).toHaveBeenCalled();
  });

  test("when otpVerify fails, shows toast error", async () => {
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: { ok: true } };
    const verifyState: FetchState = {
      fetchData: jest.fn(),
      loading: false,
      error: { message: "Invalid OTP" },
      data: null,
    };
    setupUseFetchMock(sendState, verifyState);

    renderModal();

    // effect runs on mount because otpVerifyError is present
    expect((toast as any).error).toHaveBeenCalledWith("Invalid OTP");
  });

  test("clicking Cancel calls onClose", async () => {
    const sendState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    const verifyState: FetchState = { fetchData: jest.fn(), loading: false, error: null, data: null };
    setupUseFetchMock(sendState, verifyState);

    const { onClose } = renderModal();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });

    expect(onClose).toHaveBeenCalled();
  });
});
