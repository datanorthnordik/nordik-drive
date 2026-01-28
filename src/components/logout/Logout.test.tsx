import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useFetch from "../../hooks/useFetch";
import { clearAuth, setChecked } from "../../store/auth/authSlics";
import { color_secondary } from "../../constants/colors";

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
let mockUser: any = null;

jest.mock("react-redux", () => ({
  __esModule: true,
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ auth: { user: mockUser } }),
}));

jest.mock("../../store/auth/authSlics", () => ({
  __esModule: true,
  clearAuth: jest.fn(() => ({ type: "auth/clearAuth" })),
  setChecked: jest.fn((value: boolean) => ({
    type: "auth/setChecked",
    payload: value,
  })),
}));

jest.mock("../Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) =>
    loading ? <div data-testid="loader">loading</div> : null,
}));

// Capture props from mocked Toolpad components.
// IMPORTANT: names start with "mock" so Jest allows access inside mock factory.
let mockLastAppProviderProps: any = null;
let mockLastAccountProps: any = null;

// Force Toolpad to be mocked (virtual) so real Toolpad doesn't swallow DOM.
jest.mock(
  "@toolpad/core",
  () => {
    const React = require("react");

    function AppProvider(props: any) {
      mockLastAppProviderProps = props;

      return (
        <div data-testid="app-provider">
          <button
            type="button"
            data-testid="trigger-signout"
            onClick={() => props.authentication?.signOut?.()}
          >
            signout
          </button>

          {props.children}
        </div>
      );
    }

    function Account(props: any) {
      mockLastAccountProps = props;
      return <div data-testid="account" />;
    }

    return {
      __esModule: true,
      AppProvider,
      Account,
    };
  },
  { virtual: true }
);

const Logout = require("./Logout").default;
const useFetchMock = useFetch as unknown as jest.Mock;

function mockUseFetchReturn(opts: {
  data?: any;
  loading?: boolean;
  fetchData?: jest.Mock;
}) {
  useFetchMock.mockReturnValue({
    data: opts.data ?? null,
    loading: opts.loading ?? false,
    fetchData: opts.fetchData ?? jest.fn(),
  });
}

describe("Logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockNavigate.mockClear();
    mockLastAppProviderProps = null;
    mockLastAccountProps = null;
  });

  test("initializes useFetch correctly and passes Account slotProps styles", async () => {
    mockUseFetchReturn({});

    render(<Logout />);

    expect(useFetchMock).toHaveBeenCalledWith(
      "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/logout",
      "POST",
      false
    );

    await waitFor(() => {
      expect(mockLastAccountProps).toBeTruthy();
      expect(mockLastAccountProps).toEqual(
        expect.objectContaining({
          slotProps: {
            signInButton: { sx: { display: "none" } },
            signOutButton: {
              sx: { color: color_secondary, borderColor: color_secondary },
            },
          },
        })
      );
    });
  });

  test("builds session from redux user and passes it to AppProvider", async () => {
    mockUser = {
      firstname: "Athul",
      lastname: "Narayanan",
      email: "athul@test.com",
    };
    mockUseFetchReturn({});

    render(<Logout />);

    await waitFor(() => {
      expect(mockLastAppProviderProps?.session?.user).toEqual({
        name: "Athul Narayanan",
        email: "athul@test.com",
        image:
          "https://ui-avatars.com/api/?name=Athul+Narayanan&background=004B9C&color=fff&size=64",
      });
    });
  });

  test("shows loader when loading=true", () => {
    mockUseFetchReturn({ loading: true });

    render(<Logout />);

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  test("clicking signOut triggers fetchData()", async () => {
    const user = userEvent.setup();
    const fetchData = jest.fn();
    mockUseFetchReturn({ fetchData });

    render(<Logout />);

    await user.click(screen.getByTestId("trigger-signout"));

    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  test("when data exists, dispatches clearAuth + setChecked(true) and resets session", async () => {
    mockUser = {
      firstname: "Athul",
      lastname: "Narayanan",
      email: "athul@test.com",
    };
    mockUseFetchReturn({ data: { ok: true } });

    render(<Logout />);

    await waitFor(() => {
      expect(clearAuth).toHaveBeenCalledTimes(1);
      expect(setChecked).toHaveBeenCalledWith(true);
      expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(mockLastAppProviderProps?.session?.user).toEqual({
        name: "",
        email: "",
        image: "",
      });
    });
  });

  test("if no user in store, keeps initial empty session", async () => {
    mockUser = null;
    mockUseFetchReturn({});

    render(<Logout />);

    await waitFor(() => {
      expect(mockLastAppProviderProps?.session?.user).toEqual({
        name: "",
        email: "",
        image: "",
      });
    });
  });
});
