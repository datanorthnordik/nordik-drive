// Buttons.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Make tests stable even if your cn() implementation changes internally
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.flat().filter(Boolean).join(" "),
}));

import {
  ButtonComponent,
  buttonVariants,
  FileButton,
  CloseButton,
} from "./Button";

describe("buttonVariants", () => {
  test("returns default variant + default size classes", () => {
    const cls = buttonVariants({});
    expect(cls).toContain("bg-primary");
    expect(cls).toContain("h-9");
  });

  test("returns specific variant + size classes", () => {
    const cls = buttonVariants({ variant: "link", size: "sm" });
    expect(cls).toContain("underline-offset-4");
    expect(cls).toContain("h-8");
  });

  test("includes custom className", () => {
    const cls = buttonVariants({ className: "my-extra" });
    expect(cls).toContain("my-extra");
  });
});

describe("ButtonComponent", () => {
  test("renders a native button by default with default classes", () => {
    render(<ButtonComponent>Save</ButtonComponent>);

    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toBeInTheDocument();

    //  toHaveClass doesn't accept stringContaining; check className text instead
    expect(btn.className).toMatch(/\bbg-primary\b/);
    expect(btn.className).toMatch(/\bh-9\b/);
  });

  test("applies variant and size classes + merges className", () => {
    render(
      <ButtonComponent variant="outline" size="sm" className="my-extra">
        Edit
      </ButtonComponent>
    );

    const btn = screen.getByRole("button", { name: "Edit" });
    expect(btn.className).toMatch(/\bborder-input\b/);
    expect(btn.className).toMatch(/\bh-8\b/);
    expect(btn.className).toMatch(/\bmy-extra\b/);
  });

  test("forwards props like onClick and disabled", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <ButtonComponent onClick={onClick} disabled>
        Disabled
      </ButtonComponent>
    );

    const btn = screen.getByRole("button", { name: "Disabled" });
    expect(btn).toBeDisabled();

    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("forwards ref to the underlying button", () => {
    const ref = React.createRef<HTMLButtonElement>();

    render(<ButtonComponent ref={ref}>RefBtn</ButtonComponent>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  test("asChild renders the child element (via Radix Slot) and forwards className/props", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    // Cast to any to avoid TS complaining about anchor attrs on ButtonHTMLAttributes
    render(
      <ButtonComponent asChild onClick={onClick} className="xtra" {...({} as any)}>
        <a href="/go">Go</a>
      </ButtonComponent>
    );

    const link = screen.getByRole("link", { name: "Go" });
    expect(link).toHaveAttribute("href", "/go");

    //  className text assertions
    expect(link.className).toMatch(/\bbg-primary\b/);
    expect(link.className).toMatch(/\bh-9\b/);
    expect(link.className).toMatch(/\bxtra\b/);

    await user.click(link);
    expect(onClick).toHaveBeenCalled();
  });
});

describe("styled MUI buttons", () => {
  test("FileButton renders and clicks", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<FileButton onClick={onClick}>Files</FileButton>);

    const btn = screen.getByRole("button", { name: "Files" });
    await user.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  test("CloseButton renders and clicks", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<CloseButton onClick={onClick}>Close</CloseButton>);

    const btn = screen.getByRole("button", { name: "Close" });
    await user.click(btn);
    expect(onClick).toHaveBeenCalled();
  });
});
