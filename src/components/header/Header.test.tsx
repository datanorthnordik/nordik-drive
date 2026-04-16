import * as React from "react";
import { render, screen, fireEvent, within, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import AppToolbar from "./Header"; // adjust if needed

const mockNavigate = jest.fn();
const mockApiRequest = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    __esModule: true,
    useNavigate: () => mockNavigate,
    Link: ({ to, children }: any) => (
      <a href={String(to)} data-testid="router-link">
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  apiRequest: (...args: any[]) => mockApiRequest(...args),
}));

// ---- Make Drawer deterministic in tests ----
// Only render drawer children when open=true
jest.mock("@mui/material/Drawer", () => ({
  __esModule: true,
  default: ({ open, children }: any) => (
    <div data-testid="mui-drawer" data-open={String(!!open)}>
      {open ? <div data-testid="mui-drawer-paper">{children}</div> : null}
    </div>
  ),
}));

// ---- component mocks ----
jest.mock("../header_nav/HeaderNav", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="header-nav" role="button" onClick={() => props?.onLinkClick?.()}>
      HeaderNav
    </div>
  ),
}));

jest.mock("../logout/Logout", () => ({
  __esModule: true,
  default: () => <button data-testid="logout-btn">Logout</button>,
}));

jest.mock("../NavContainer", () => ({
  __esModule: true,
  NavContainer: ({ children }: any) => <div data-testid="nav-container">{children}</div>,
}));

// ---- redux ----
const mockUseSelector = jest.fn();
jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) => mockUseSelector(selector),
}));

// ---- MUI useMediaQuery ----
const mockUseMediaQuery = jest.fn();
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    useMediaQuery: (...args: any[]) => mockUseMediaQuery(...args),
  };
});

function buildState(selectedFile: any = null, apiEntries: Record<string, any> = {}) {
  return {
    file: { selectedFile },
    api: { entries: apiEntries },
  };
}

function renderWithTheme() {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <AppToolbar />
    </ThemeProvider>
  );
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe("AppToolbar", () => {
  test("renders Shingwauk + Nordik logos", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(buildState())
    );

    renderWithTheme();

    expect(
      screen.getByAltText("Children of Shingwauk Alumni Association")
    ).toBeInTheDocument();

    expect(screen.getByAltText("Nordik Institute")).toBeInTheDocument();
  });

  test("does not render a secondary file logo when selectedFile is missing", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(buildState())
    );

    renderWithTheme();

    expect(screen.queryByAltText(/partner logo/i)).not.toBeInTheDocument();
  });

  test("renders the configured file logo when the selected file config has a logo URL", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(
        buildState(
          { id: 42, filename: "Some Other File" },
          {
            "config_Some Other File": {
              data: {
                config: {
                  logo: "https://example.com/logo.png",
                },
              },
            },
          }
        )
      )
    );

    renderWithTheme();

    expect(screen.getByAltText("Some Other File partner logo")).toHaveAttribute(
      "src",
      "https://example.com/logo.png"
    );
  });

  test("fetches file content by selected file id and navigates when html exists", async () => {
    mockApiRequest.mockResolvedValue("<html><body>Uploaded Content</body></html>");
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(
        buildState(
          { id: 123, filename: "Some Other File" },
          {
            "config_Some Other File": {
              data: {
                config: {
                  logo: "https://example.com/logo.png",
                },
              },
            },
          }
        )
      )
    );

    renderWithTheme();

    fireEvent.click(screen.getByAltText("Some Other File partner logo"));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.stringContaining("/logo-content/123"),
        "GET"
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/file-content",
      expect.objectContaining({
        state: expect.objectContaining({
          htmlContent: "<html><body>Uploaded Content</body></html>",
          fileId: 123,
        }),
      })
    );
  });

  test("does not render a file logo when the config logo is empty", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(
        buildState(
          { filename: "Some Other File" },
          {
            "config_Some Other File": {
              data: {
                config: {
                  logo: "",
                },
              },
            },
          }
        )
      )
    );

    renderWithTheme();

    expect(screen.queryByAltText(/partner logo/i)).not.toBeInTheDocument();
  });

  test("uses logo_navigation_link when configured and does not call the content api", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(
        buildState(
          { id: 123, filename: "Some Other File" },
          {
            "config_Some Other File": {
              data: {
                config: {
                  logo: "https://example.com/logo.png",
                  logo_navigation_link: "https://example.com/landing-page",
                },
              },
            },
          }
        )
      )
    );

    renderWithTheme();

    const logo = screen.getByAltText("Some Other File partner logo");
    const link = logo.closest("a");

    expect(link).toHaveAttribute("href", "https://example.com/landing-page");
    expect(link).toHaveAttribute("target", "_blank");
    expect(mockApiRequest).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("uses internal logo_navigation_link when configured", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(
        buildState(
          { id: 123, filename: "Some Other File" },
          {
            "config_Some Other File": {
              data: {
                config: {
                  logo: "https://example.com/logo.png",
                  logo_navigation_link: "contact-us",
                },
              },
            },
          }
        )
      )
    );

    renderWithTheme();

    expect(screen.getByTestId("router-link")).toHaveAttribute("href", "/contact-us");
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  test("does not navigate when the content api returns empty html", async () => {
    mockApiRequest.mockResolvedValue("");
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(
        buildState(
          { id: 321, filename: "Some Other File" },
          {
            "config_Some Other File": {
              data: {
                config: {
                  logo: "https://example.com/logo.png",
                },
              },
            },
          }
        )
      )
    );

    renderWithTheme();

    fireEvent.click(screen.getByAltText("Some Other File partner logo"));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.stringContaining("/logo-content/321"),
        "GET"
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("does not navigate when the content api returns 404 or fails", async () => {
    mockApiRequest.mockRejectedValue(new Error("404"));
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(
        buildState(
          { id: 321, filename: "Some Other File" },
          {
            "config_Some Other File": {
              data: {
                config: {
                  logo: "https://example.com/logo.png",
                },
              },
            },
          }
        )
      )
    );

    renderWithTheme();

    fireEvent.click(screen.getByAltText("Some Other File partner logo"));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.stringContaining("/logo-content/321"),
        "GET"
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("does not render a file logo when the selected file has no config entry", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(buildState({ filename: "Some Other File" }))
    );

    renderWithTheme();

    expect(screen.queryByAltText(/partner logo/i)).not.toBeInTheDocument();
  });

  test("desktop: Logout is in header; drawer is closed", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(buildState())
    );

    renderWithTheme();

    const headerEl = document.querySelector("header") as HTMLElement;
    expect(headerEl).toBeTruthy();

    // Logout should be rendered in header on desktop
    expect(within(headerEl).getByTestId("logout-btn")).toBeInTheDocument();

    // Drawer closed
    expect(screen.getByTestId("mui-drawer")).toHaveAttribute("data-open", "false");
  });

  test("mobile: Logout is NOT in header; opens drawer via hamburger and shows Logout inside drawer", () => {
    mockUseMediaQuery.mockReturnValue(true);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(buildState())
    );

    renderWithTheme();

    const headerEl = document.querySelector("header") as HTMLElement;
    expect(headerEl).toBeTruthy();

    //  IMPORTANT: check header-only (not whole document)
    expect(within(headerEl).queryByTestId("logout-btn")).not.toBeInTheDocument();

    // Drawer initially closed
    expect(screen.getByTestId("mui-drawer")).toHaveAttribute("data-open", "false");

    // open drawer using the hamburger (MenuIcon is stable)
    const hamburgerBtn = screen.getByTestId("MenuIcon").closest("button");
    expect(hamburgerBtn).toBeTruthy();
    fireEvent.click(hamburgerBtn as HTMLButtonElement);

    expect(screen.getByTestId("mui-drawer")).toHaveAttribute("data-open", "true");

    // Logout appears inside drawer only
    const drawerPaper = screen.getByTestId("mui-drawer-paper");
    expect(within(drawerPaper).getByTestId("logout-btn")).toBeInTheDocument();
  });

  test("mobile drawer: clicking drawer HeaderNav triggers onLinkClick and closes drawer", () => {
    mockUseMediaQuery.mockReturnValue(true);
    mockUseSelector.mockImplementation((selector: any) =>
      selector(buildState())
    );

    renderWithTheme();

    // open drawer
    fireEvent.click(screen.getByTestId("MenuIcon").closest("button") as HTMLButtonElement);
    expect(screen.getByTestId("mui-drawer")).toHaveAttribute("data-open", "true");

    const drawerPaper = screen.getByTestId("mui-drawer-paper");

    //  HeaderNav exists in multiple places, so scope to the drawer
    const drawerNav = within(drawerPaper).getByTestId("header-nav");
    fireEvent.click(drawerNav);

    // should close drawer
    expect(screen.getByTestId("mui-drawer")).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("mui-drawer-paper")).not.toBeInTheDocument();
  });
});
