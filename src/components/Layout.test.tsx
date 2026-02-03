import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import Layout from "./Layout";

// Mock Header
jest.mock("./header/Header", () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

// Mock LayoutWrapper
jest.mock("./Wrappers", () => ({
  __esModule: true,
  LayoutWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout-wrapper">{children}</div>
  ),
}));

describe("Layout", () => {
  test("renders children inside main", () => {
    render(
      <Layout>
        <div data-testid="child">Hello</div>
      </Layout>
    );

    const child = screen.getByTestId("child");
    expect(child).toBeInTheDocument();

    const main = child.closest("main");
    expect(main).toBeInTheDocument();
  });

  test("does not render Header when showHeader is false/undefined", () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.queryByTestId("header")).not.toBeInTheDocument();
  });

  test("renders Header when showHeader is true", () => {
    render(
      <Layout showHeader>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  test("wraps everything in LayoutWrapper", () => {
    render(
      <Layout showHeader>
        <div data-testid="child">Content</div>
      </Layout>
    );

    const wrapper = screen.getByTestId("layout-wrapper");
    expect(wrapper).toBeInTheDocument();

    // wrapper contains header + main
    expect(within(wrapper).getByTestId("header")).toBeInTheDocument();
    expect(within(wrapper).getByTestId("child")).toBeInTheDocument();
  });

  test("main has boxSizing border-box", () => {
    render(
      <Layout>
        <div data-testid="child">Content</div>
      </Layout>
    );

    const main = screen.getByTestId("child").closest("main");
    expect(main).toHaveStyle({ boxSizing: "border-box" });
  });
});
