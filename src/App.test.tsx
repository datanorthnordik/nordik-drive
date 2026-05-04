import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import App from "./App";

const mockUseSelector = jest.fn();

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    const RouterContext = React.createContext("/");

    const MemoryRouter = ({ initialEntries = ["/"], children }: any) => (
      <RouterContext.Provider value={initialEntries[0] || "/"}>
        {children}
      </RouterContext.Provider>
    );

    const Route = () => null;

    const Routes = ({ children }: any) => {
      const pathname = React.useContext(RouterContext);
      const routeElements = React.Children.toArray(children).filter(React.isValidElement);

      const exactMatch = routeElements.find((child: any) => child.props.path === pathname);
      const wildcardMatch = routeElements.find((child: any) => child.props.path === "*");
      const match: any = exactMatch || wildcardMatch || null;

      return match ? <>{match.props.element}</> : null;
    };

    return {
      __esModule: true,
      MemoryRouter,
      Routes,
      Route,
    };
  },
  { virtual: true }
);

jest.mock("react-redux", () => {
  const actual = jest.requireActual("react-redux");
  return {
    ...actual,
    useSelector: (selector: any) => mockUseSelector(selector),
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  Toaster: () => <div data-testid="toaster" />,
}));

jest.mock("./components/AuthInitializer", () => ({
  __esModule: true,
  default: () => <div data-testid="auth-initializer" />,
}));

jest.mock("./components/Loader", () => ({
  __esModule: true,
  default: ({ loading, text }: any) =>
    loading ? <div data-testid="loader">{text || "Loading..."}</div> : null,
}));

jest.mock("./components/Layout", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock("./components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="protected-route">{children}</div>,
}));

jest.mock("./pages/auth/Login", () => ({
  __esModule: true,
  default: () => <div>Login Page</div>,
}));

jest.mock("./pages/auth/Signup", () => ({
  __esModule: true,
  default: () => <div>Signup Page</div>,
}));

jest.mock("./pages/file_list/FileList", () => ({
  __esModule: true,
  default: () => <div>File List Page</div>,
}));

jest.mock("./components/NotFound", () => ({
  __esModule: true,
  default: () => <div>Not Found Page</div>,
}));

jest.mock("./pages/dataview/DataView", () => ({
  __esModule: true,
  default: () => <div>Data View Page</div>,
}));

jest.mock("./pages/contact_us/ContactUs", () => ({
  __esModule: true,
  default: () => <div>Contact Us Page</div>,
}));

jest.mock("./pages/contact_us/FaqPage", () => ({
  __esModule: true,
  default: () => <div>FAQ Page</div>,
}));

jest.mock("./pages/Acknowledgement/Acknowledgement", () => ({
  __esModule: true,
  default: () => <div>Acknowledgement Page</div>,
}));

jest.mock("./pages/FileContentPage/FileContentPage", () => ({
  __esModule: true,
  default: () => <div>File Content Page</div>,
}));

jest.mock("./components/tables/ActivityLogs", () => ({
  __esModule: true,
  default: () => <div>Activity Logs Page</div>,
}));

jest.mock("./pages/adminpanel/AdminPanel", () => ({
  __esModule: true,
  default: () => <div>Admin Panel Page</div>,
}));

jest.mock("./pages/request_hub/AdminRequestsWrapper", () => ({
  __esModule: true,
  default: () => <div>Admin Requests Page</div>,
}));

jest.mock("./pages/request_hub/MyRequestsWrapper", () => ({
  __esModule: true,
  default: () => <div>My Requests Page</div>,
}));

const renderAt = (pathname: string, role: string = "User") => {
  mockUseSelector.mockImplementation((selector: any) =>
    selector({
      auth: {
        user: role ? { role } : null,
      },
    })
  );

  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <App />
    </MemoryRouter>
  );
};

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the login route without protected wrappers", () => {
    renderAt("/");

    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(screen.getByTestId("auth-initializer")).toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-route")).not.toBeInTheDocument();
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument();
  });

  it("renders the signup route without protected wrappers", () => {
    renderAt("/signup");

    expect(screen.getByText("Signup Page")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-route")).not.toBeInTheDocument();
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument();
  });

  it("renders the eager protected file list route inside protected wrappers", async () => {
    renderAt("/files");

    expect(await screen.findByText("File List Page")).toBeInTheDocument();
    expect(screen.getByTestId("protected-route")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("renders a lazy protected route inside protected wrappers", async () => {
    renderAt("/dataview");

    expect(await screen.findByText("Data View Page")).toBeInTheDocument();
    expect(screen.getByTestId("protected-route")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("renders the faq route inside protected wrappers", async () => {
    renderAt("/faq");

    expect(await screen.findByText("FAQ Page")).toBeInTheDocument();
    expect(screen.getByTestId("protected-route")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("renders the admin requests route for admin users", async () => {
    renderAt("/requests", "Admin");

    expect(await screen.findByText("Admin Requests Page")).toBeInTheDocument();
    expect(screen.queryByText("My Requests Page")).not.toBeInTheDocument();
  });

  it("renders the user requests route for non-admin users", async () => {
    renderAt("/requests", "User");

    expect(await screen.findByText("My Requests Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Requests Page")).not.toBeInTheDocument();
  });

  it("renders the generic file content route inside protected wrappers", async () => {
    renderAt("/file-content");

    expect(await screen.findByText("File Content Page")).toBeInTheDocument();
    expect(screen.getByTestId("protected-route")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("renders the not found route for unknown paths", async () => {
    renderAt("/missing");

    expect(await screen.findByText("Not Found Page")).toBeInTheDocument();
  });
});
