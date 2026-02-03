import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ProtectedRoute from "./ProtectedRoute";

// ---- Mock react-redux ----
const mockUseSelector = jest.fn();

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (fn: any) => mockUseSelector(fn),
}));

// ---- Virtual mock for react-router-dom (no package required) ----
const mockUseLocation = jest.fn();

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");

    const Navigate = ({ to, state, replace }: any) => (
      <div data-testid="navigate" data-to={to} data-replace={String(!!replace)}>
        {JSON.stringify(state)}
      </div>
    );

    return {
      Navigate,
      useLocation: () => mockUseLocation(),
    };
  },
  { virtual: true }
);

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: "/protected" });
  });

  test("shows Loading... when auth is not checked yet", () => {
    mockUseSelector.mockImplementation((selectorFn: any) =>
      selectorFn({ auth: { token: null, checked: false } })
    );

    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  test("redirects to / when checked=true and token is missing", () => {
    mockUseSelector.mockImplementation((selectorFn: any) =>
      selectorFn({ auth: { token: null, checked: true } })
    );

    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );

    const nav = screen.getByTestId("navigate");
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute("data-to", "/");
    expect(nav).toHaveAttribute("data-replace", "true");

    // state should include { from: location }
    expect(nav.textContent).toContain('"from"');
    expect(nav.textContent).toContain('"pathname":"/protected"');

    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  test("renders children when checked=true and token exists", () => {
    mockUseSelector.mockImplementation((selectorFn: any) =>
      selectorFn({ auth: { token: "abc", checked: true } })
    );

    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Secret")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
