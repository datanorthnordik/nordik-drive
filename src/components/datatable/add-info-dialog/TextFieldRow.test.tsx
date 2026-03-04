// TextFieldRow.test.tsx
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import TextFieldRow from "./TextFieldRow"; // update path if needed

describe("TextFieldRow", () => {
  it("renders a single-line text input with value and placeholder", () => {
    render(
      <TextFieldRow
        value="Hello"
        onChange={jest.fn()}
        placeholder="Enter text"
      />
    );

    const input = screen.getByPlaceholderText("Enter text") as HTMLInputElement;

    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
    expect(input.value).toBe("Hello");
  });

  it("calls onChange with the updated value", () => {
    const onChange = jest.fn();

    render(<TextFieldRow value="" onChange={onChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Updated value" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("Updated value");
  });

  it("falls back to an empty string when value is undefined", () => {
    render(<TextFieldRow value={undefined as any} onChange={jest.fn()} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("renders a textarea when multiline is true", () => {
    render(<TextFieldRow value="Multi line text" onChange={jest.fn()} multiline />);

    const textbox = screen.getByRole("textbox");
    expect(textbox.tagName).toBe("TEXTAREA");
  });

  it("uses 4 rows by default when multiline is true and rows is not provided", () => {
    render(<TextFieldRow value="" onChange={jest.fn()} multiline />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("rows", "4");
  });

  it("uses the provided rows value when multiline is true", () => {
    render(<TextFieldRow value="" onChange={jest.fn()} multiline rows={6} />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("rows", "6");
  });

  it("renders a single-line input when multiline is false even if rows is passed", () => {
    render(<TextFieldRow value="" onChange={jest.fn()} multiline={false} rows={8} />);

    const textbox = screen.getByRole("textbox");
    expect(textbox.tagName).toBe("INPUT");
  });
});