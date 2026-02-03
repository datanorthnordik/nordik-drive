import * as React from "react";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import AppToolbar from "./Header"; // adjust if needed

// ---- virtual react-router-dom (because module isn't installed) ----
jest.mock(
  "react-router-dom",
  () => ({
    __esModule: true,
    Link: ({ to, children }: any) => (
      <a href={String(to)} data-testid="router-link">
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

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
      selector({ file: { selectedFile: null } })
    );

    renderWithTheme();

    expect(
      screen.getByAltText("Children of Shingwauk Alumni Association")
    ).toBeInTheDocument();

    expect(screen.getByAltText("Nordik Institute")).toBeInTheDocument();
  });

  test("coroner logo renders when selectedFile is missing", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ file: { selectedFile: null } })
    );

    renderWithTheme();

    expect(
      screen.getByAltText("Ontario Office of the Chief Coroner")
    ).toBeInTheDocument();
  });

  test('coroner logo renders when selectedFile.filename is "Confirmed- Shingwauk (Wawanosh)"', () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ file: { selectedFile: { filename: "Confirmed- Shingwauk (Wawanosh)" } } })
    );

    renderWithTheme();

    expect(
      screen.getByAltText("Ontario Office of the Chief Coroner")
    ).toBeInTheDocument();
  });

  test("coroner logo does NOT render when selectedFile.filename is different", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ file: { selectedFile: { filename: "Some Other File" } } })
    );

    renderWithTheme();

    expect(
      screen.queryByAltText("Ontario Office of the Chief Coroner")
    ).not.toBeInTheDocument();
  });

  test("desktop: Logout is in header; drawer is closed", () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ file: { selectedFile: null } })
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
      selector({ file: { selectedFile: null } })
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
      selector({ file: { selectedFile: null } })
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
