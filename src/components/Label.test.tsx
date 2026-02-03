import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Label } from "./Label"; // adjust import if your file is elsewhere

describe("Label", () => {
  test("renders a label and children", () => {
    render(<Label>Username</Label>);

    const el = screen.getByText("Username");
    expect(el).toBeInTheDocument();
    // Radix LabelPrimitive.Root renders a <label>
    expect(el.tagName.toLowerCase()).toBe("label");
  });

  test("applies default base classes", () => {
    render(<Label>Username</Label>);

    const el = screen.getByText("Username");
    expect(el).toHaveClass("text-sm");
    expect(el).toHaveClass("font-medium");
    expect(el).toHaveClass("leading-none");
    expect(el).toHaveClass("peer-disabled:cursor-not-allowed");
    expect(el).toHaveClass("peer-disabled:opacity-70");
  });

  test("merges className with base classes", () => {
    render(<Label className="custom-class another">Username</Label>);

    const el = screen.getByText("Username");
    expect(el).toHaveClass("text-sm"); // from cva
    expect(el).toHaveClass("custom-class");
    expect(el).toHaveClass("another");
  });

  test("forwards props to underlying element (htmlFor, id, data-*)", () => {
    render(
      <Label htmlFor="email" id="email-label" data-testid="the-label">
        Email
      </Label>
    );

    const el = screen.getByTestId("the-label");
    expect(el).toHaveAttribute("for", "email");
    expect(el).toHaveAttribute("id", "email-label");
  });

  test("forwards ref to the underlying DOM element", () => {
    const ref = React.createRef<HTMLLabelElement>();

    render(<Label ref={ref}>Name</Label>);

    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current?.tagName.toLowerCase()).toBe("label");
    expect(ref.current).toHaveTextContent("Name");
  });
});
