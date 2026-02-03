import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useFetch from "../../hooks/useFetch";
import toast from "react-hot-toast";

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

const useFetchMock = useFetch as unknown as jest.Mock;

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("../../components/Wrappers", () => ({
  __esModule: true,
  AuthWrapper: ({ children }: any) => <div>{children}</div>,
  FormWrapper: ({ children, onSubmit }: any) => (
    <form onSubmit={onSubmit}>{children}</form>
  ),
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
  default: () => null,
}));

jest.mock("../../components/TextGroup", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }: any) => <div>{children}</div>,
  };
});

jest.mock("@mui/material/Autocomplete", () => {
  const React = require("react");

  return function MockAutocomplete(props: any) {
    const { value, onInputChange, onChange } = props;

    return (
      <div>
        <input
          placeholder="Search or type a community"
          value={value ?? ""}
          onChange={(e) => onInputChange?.(e, (e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onChange?.(e, (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>
    );
  };
});


const Signup = require("./Signup").default;

function setupUseFetchForSignup(opts: {
  signupData?: any;
  signupError?: string | null;
  communitiesData?: any; // initial hook state
}) {
  // IMPORTANT: return Promises because component likely does: await fetchData(...)
  const signupFetch = jest.fn().mockResolvedValue(opts.signupData ?? { ok: true });
  const fetchCommunities = jest
    .fn()
    .mockResolvedValue(opts.communitiesData ?? { communities: [] });
  const addCommunity = jest.fn().mockResolvedValue({ ok: true });

  useFetchMock.mockReset();

  useFetchMock.mockImplementation((url: string, method: string) => {
    if (url.includes("/api/user/signup")) {
      return {
        data: opts.signupData ?? null,
        loading: false,
        error: opts.signupError ?? null,
        fetchData: signupFetch,
      };
    }

    if (url.includes("/api/communities") && method === "GET") {
      return {
        data: opts.communitiesData ?? null,
        loading: false,
        error: null,
        fetchData: fetchCommunities,
      };
    }

    if (url.includes("/api/communities") && method === "POST") {
      return {
        data: null,
        loading: false,
        error: null,
        fetchData: addCommunity,
      };
    }

    return { data: null, loading: false, error: null, fetchData: jest.fn() };
  });

  return { signupFetch, fetchCommunities, addCommunity };
}

describe("Signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test("calls fetchCommunities on mount", async () => {
    const { fetchCommunities } = setupUseFetchForSignup({
      communitiesData: { communities: [{ name: "Shingwauk" }] },
    });

    render(<Signup />);

    await waitFor(() => {
      expect(fetchCommunities).toHaveBeenCalled();
    });
  });

  test("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    setupUseFetchForSignup({ communitiesData: { communities: [] } });

    render(<Signup />);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(await screen.findByText("Last name is required")).toBeInTheDocument();
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(await screen.findByText("Confirm Password is required")).toBeInTheDocument();
  });

  test("validates password min length and confirm password match", async () => {
    const user = userEvent.setup();
    setupUseFetchForSignup({ communitiesData: { communities: [] } });

    render(<Signup />);

    await user.type(screen.getByLabelText(/first name/i), "Athul");
    await user.type(screen.getByLabelText(/last name/i), "N");
    await user.type(screen.getByLabelText(/email address/i), "athul@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "123");
    await user.type(screen.getByLabelText(/confirm password/i), "456");

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(await screen.findByText("Passwords must match")).toBeInTheDocument();
  });

  test("adds missing community (POST) then submits signup with unique cleaned community list (stable)", async () => {
    // optional, but helps on slow CI:
    jest.setTimeout(15000);

    const { signupFetch, addCommunity } = setupUseFetchForSignup({
      communitiesData: { communities: [{ name: "Shingwauk" }] },
    });

    const { container } = render(<Signup />);

    // Fill required fields FAST (no userEvent.type)
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Athul" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "N" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "athul@test.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "secret12" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "secret12" } });

    // Community row #1: type + Enter (your mocked Autocomplete handles Enter -> onChange)
    const inputs1 = screen.getAllByPlaceholderText(/search or type a community/i);
    fireEvent.change(inputs1[0], { target: { value: "  NewComm  " } });
    fireEvent.keyDown(inputs1[0], { key: "Enter", code: "Enter" });

    // Add row #2 and enter duplicate with different casing
    fireEvent.click(screen.getByRole("button", { name: /\+ add another community/i }));
    const inputs2 = screen.getAllByPlaceholderText(/search or type a community/i);
    fireEvent.change(inputs2[1], { target: { value: "newcomm" } });
    fireEvent.keyDown(inputs2[1], { key: "Enter", code: "Enter" });

    // Submit (clicking submit button is enough because your FormWrapper mock renders a real <form>)
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Wait for calls (real completion signals)
    await waitFor(() => expect(addCommunity).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(signupFetch).toHaveBeenCalledTimes(1));

    // addCommunity called once with trimmed + unique
    expect(addCommunity).toHaveBeenCalledWith({ communities: ["NewComm"] }, null, true);

    // signup called with unique cleaned community list
    expect(signupFetch).toHaveBeenCalledWith(
      expect.objectContaining({ community: ["NewComm"] }),
      null,
      true
    );
  });

  test("shows toast success and navigates to '/' when signup returns data", async () => {
    setupUseFetchForSignup({
      signupData: { ok: true },
      communitiesData: { communities: [] },
    });

    render(<Signup />);

    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("shows toast error when error exists", async () => {
    setupUseFetchForSignup({
      signupError: "Signup failed",
      communitiesData: { communities: [] },
    });

    render(<Signup />);

    await waitFor(() => {
      expect((toast as any).error).toHaveBeenCalledWith("Signup failed");
    });
  });
});
