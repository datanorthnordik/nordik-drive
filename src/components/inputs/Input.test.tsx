import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input } from "./Input"; // ✅ adjust path if needed

// Make cn deterministic + easy to assert
jest.mock("../../lib/utils", () => ({
  __esModule: true,
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

describe("Input", () => {
  test("renders an input and forwards basic props (type, placeholder, disabled)", () => {
    render(
      <Input
        type="email"
        placeholder="Email"
        disabled
        data-testid="input"
      />
    );

    const el = screen.getByTestId("input") as HTMLInputElement;
    expect(el.tagName).toBe("INPUT");
    expect(el).toHaveAttribute("type", "email");
    expect(el).toHaveAttribute("placeholder", "Email");
    expect(el).toBeDisabled();
  });

  test("merges base classes with className via cn()", () => {
    render(<Input data-testid="input" className="my-extra-class" />);

    const el = screen.getByTestId("input");
    // Base class fragment
    expect(el).toHaveClass("flex");
    expect(el).toHaveClass("h-9");
    expect(el).toHaveClass("w-full");
    // Provided extra class
    expect(el).toHaveClass("my-extra-class");
  });

  test("forwards ref to the underlying input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="input" />);

    expect(ref.current).toBe(screen.getByTestId("input"));
    expect(ref.current?.tagName).toBe("INPUT");
  });

  test("passes through arbitrary props (name, value, onChange)", () => {
    const handleChange = jest.fn();
    render(
      <Input
        data-testid="input"
        name="username"
        value="athul"
        onChange={handleChange}
      />
    );

    const el = screen.getByTestId("input") as HTMLInputElement;
    expect(el).toHaveAttribute("name", "username");
    expect(el.value).toBe("athul");
    expect(el).toHaveAttribute("value", "athul");
  });

  test("has displayName set for devtools", () => {
    expect((Input as any).displayName).toBe("Input");
  });
});
