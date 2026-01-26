import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useFetch from "../../hooks/useFetch";
import toast from "react-hot-toast";
import { setAuth } from "../../store/auth/authSlics";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({ __esModule: true, useNavigate: () => mockNavigate }),
  { virtual: true }
);

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockDispatch = jest.fn();
let mockToken: string | null = null;

jest.mock("react-redux", () => ({
  __esModule: true,
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ auth: { token: mockToken } }),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("../../components/Wrappers", () => ({
  __esModule: true,
  AuthWrapper: ({ children }: any) => <div>{children}</div>,
  FormWrapper: ({ children, onSubmit }: any) => <form onSubmit={onSubmit}>{children}</form>,
}));

jest.mock("../../components/containers/Containers", () => ({
  __esModule: true,
  AuthContainer: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("../../components/Links", () => ({
  __esModule: true,
  LinkButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => (loading ? <div data-testid="loader">loading</div> : null),
}));

jest.mock("../../components/PasswordReset", () => ({
  __esModule: true,
  default: ({ open }: any) => (open ? <div data-testid="reset-modal">reset-open</div> : null),
}));

jest.mock("../../components/TextGroup", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }: any) => <div>{children}</div>,
    CheckBoxWrapper: (props: any) => <input aria-label="remember" type="checkbox" {...props} />,
  };
});

const Login = require("./Login").default;

const useFetchMock = useFetch as unknown as jest.Mock;

function mockUseFetchReturn(opts: {
  data?: any;
  loading?: boolean;
  error?: string | null;
  fetchData?: jest.Mock;
}) {
  useFetchMock.mockReturnValue({
    data: opts.data ?? null,
    loading: opts.loading ?? false,
    error: opts.error ?? null,
    fetchData: opts.fetchData ?? jest.fn(),
  });
}

describe("Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToken = null;
    mockNavigate.mockClear();
  });

  test("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    mockUseFetchReturn({});

    render(<Login />);
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
  });

  test("submits valid form and calls fetchData with payload (remember default false)", async () => {
    const user = userEvent.setup();
    const fetchData = jest.fn();
    mockUseFetchReturn({ fetchData });

    render(<Login />);

    await user.type(screen.getByPlaceholderText(/email address/i), "a@b.com");
    await user.type(screen.getByPlaceholderText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(
        { email: "a@b.com", password: "secret123", remember: false },
        null,
        true
      );
    });
  });

  test("sets remember=true when checkbox is clicked and submits", async () => {
    const user = userEvent.setup();
    const fetchData = jest.fn();
    mockUseFetchReturn({ fetchData });

    render(<Login />);

    await user.type(screen.getByPlaceholderText(/email address/i), "a@b.com");
    await user.type(screen.getByPlaceholderText(/password/i), "secret123");
    await user.click(screen.getByLabelText("remember"));
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(
        { email: "a@b.com", password: "secret123", remember: true },
        null,
        true
      );
    });
  });

  test("opens password reset modal when clicking 'Forgot password'", async () => {
    const user = userEvent.setup();
    mockUseFetchReturn({});

    render(<Login />);
    await user.click(screen.getByRole("button", { name: /forgot password/i }));

    expect(screen.getByTestId("reset-modal")).toBeInTheDocument();
  });

  test("on success data, dispatches setAuth and navigates to /files", async () => {
    const successData = {
      data: {
        firstname: "Athul",
        lastname: "N",
        id: 26,
        email: "athul@test.com",
        phonenumber: "123",
        role: "admin",
        community: ["A"],
      },
    };
    mockUseFetchReturn({ data: successData });

    render(<Login />);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setAuth({
          token: "cookies",
          user: {
            id: 26,
            firstname: "Athul",
            lastname: "N",
            email: "athul@test.com",
            phonenumber: "123",
            role: "admin",
            community: ["A"],
          },
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/files");
    });
  });

  test("shows toast error when error exists", async () => {
    mockUseFetchReturn({ error: "Invalid credentials" });

    render(<Login />);

    await waitFor(() => {
      expect((toast as any).error).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  test("if token exists and no data yet, navigates to /files", async () => {
    mockToken = "already-logged-in";
    mockUseFetchReturn({ data: null });

    render(<Login />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/files");
    });
  });
});
