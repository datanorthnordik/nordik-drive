import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import HeaderNav from "./HeaderNav"; // ✅ adjust if needed

// -----------------------------
// Virtual react-router-dom mock (same pattern as your fix)
// -----------------------------
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

// -----------------------------
// Mocks for wrappers/links to avoid ambiguity & external deps
// -----------------------------
jest.mock("../Wrappers", () => ({
  __esModule: true,
  NavWrapper: ({ children }: any) => <nav data-testid="nav-wrapper">{children}</nav>,
}));

jest.mock("../Links", () => ({
  __esModule: true,
  HeaderLink: ({ to, onClick, children }: any) => (
    <a
      href={String(to)}
      data-testid={`header-link-${String(to)}`}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </a>
  ),
}));

// -----------------------------
// Redux mock: role-driven rendering
// -----------------------------
let mockRole: "Admin" | "User" | "Other" = "User";

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) =>
    selector({
      auth: {
        user: { role: mockRole },
      },
    }),
}));

// -----------------------------
// MUI responsiveness + Stack props capture
// -----------------------------
const mockUseMediaQuery = jest.fn();

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    useMediaQuery: (...args: any[]) => mockUseMediaQuery(...args),
    // Replace Stack with a simple div so we can assert direction/spacing/alignItems
    Stack: ({ direction, spacing, alignItems, children }: any) => (
      <div
        data-testid="mui-stack"
        data-direction={String(direction)}
        data-spacing={String(spacing)}
        data-alignitems={String(alignItems)}
      >
        {children}
      </div>
    ),
  };
});

function renderWithTheme(ui: React.ReactElement) {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe("HeaderNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRole = "User";
    mockUseMediaQuery.mockReturnValue(false);
  });

  test("desktop (isMobile=false): renders Files + Requests always; Admin role shows admin links; no User-only links; Stack layout is row/stretch/spacing=3", async () => {
    const user = userEvent.setup();
    mockRole = "Admin";
    mockUseMediaQuery.mockReturnValue(false); // desktop

    const onLinkClick = jest.fn();
    renderWithTheme(<HeaderNav onLinkClick={onLinkClick} />);

    // Stack props (desktop)
    const stack = screen.getByTestId("mui-stack");
    expect(stack).toHaveAttribute("data-direction", "row");
    expect(stack).toHaveAttribute("data-spacing", "3");
    expect(stack).toHaveAttribute("data-alignitems", "stretch");

    // Always visible
    expect(screen.getByTestId("header-link-/files")).toBeInTheDocument();
    expect(screen.getByTestId("header-link-/requests")).toBeInTheDocument();

    // Admin-only visible
    expect(screen.getByTestId("header-link-/adminpanel")).toBeInTheDocument();
    expect(screen.getByTestId("header-link-/useractivity")).toBeInTheDocument();

    // User-only NOT visible
    expect(screen.queryByTestId("header-link-/contact-us")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-link-/acknowledgement")).not.toBeInTheDocument();

    // Click a few links -> onLinkClick called each time
    await user.click(screen.getByTestId("header-link-/files"));
    await user.click(screen.getByTestId("header-link-/adminpanel"));
    await user.click(screen.getByTestId("header-link-/requests"));

    expect(onLinkClick).toHaveBeenCalledTimes(3);
  });

  test("mobile (isMobile=true): renders Files + Requests always; User role shows Contact/Acknowledgement; no Admin links; Stack layout is column/flex-start/spacing=1.5", async () => {
    const user = userEvent.setup();
    mockRole = "User";
    mockUseMediaQuery.mockReturnValue(true); // mobile

    const onLinkClick = jest.fn();
    renderWithTheme(<HeaderNav onLinkClick={onLinkClick} />);

    // Stack props (mobile)
    const stack = screen.getByTestId("mui-stack");
    expect(stack).toHaveAttribute("data-direction", "column");
    expect(stack).toHaveAttribute("data-spacing", "1.5");
    expect(stack).toHaveAttribute("data-alignitems", "flex-start");

    // Always visible
    expect(screen.getByTestId("header-link-/files")).toBeInTheDocument();
    expect(screen.getByTestId("header-link-/requests")).toBeInTheDocument();

    // User-only visible
    expect(screen.getByTestId("header-link-/contact-us")).toBeInTheDocument();
    expect(screen.getByTestId("header-link-/acknowledgement")).toBeInTheDocument();

    // Admin-only NOT visible
    expect(screen.queryByTestId("header-link-/adminpanel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-link-/useractivity")).not.toBeInTheDocument();

    // Click user-only links -> onLinkClick called each time
    await user.click(screen.getByTestId("header-link-/contact-us"));
    await user.click(screen.getByTestId("header-link-/acknowledgement"));
    expect(onLinkClick).toHaveBeenCalledTimes(2);
  });

  test("does not crash when onLinkClick is not provided", async () => {
    const user = userEvent.setup();
    mockRole = "Other";
    mockUseMediaQuery.mockReturnValue(false);

    renderWithTheme(<HeaderNav />);

    // Only Files + Requests when role isn't Admin or User
    expect(screen.getByTestId("header-link-/files")).toBeInTheDocument();
    expect(screen.getByTestId("header-link-/requests")).toBeInTheDocument();
    expect(screen.queryByTestId("header-link-/adminpanel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-link-/useractivity")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-link-/contact-us")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-link-/acknowledgement")).not.toBeInTheDocument();

    // Clicking should not throw
    await user.click(screen.getByTestId("header-link-/files"));
    await user.click(screen.getByTestId("header-link-/requests"));
  });
});
