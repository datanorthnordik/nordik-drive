import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DateFieldRow from "./DateFieldRow";

jest.mock("../DropDownPicker", () => ({
  __esModule: true,
  default: ({ value, onChange, disabled }: any) => (
    <button
      type="button"
      data-testid="dropdown-date-picker"
      data-value={value}
      data-disabled={disabled ? "true" : "false"}
      onClick={() => onChange("05.03.2026")}
    >
      Mock picker
    </button>
  ),
}));

describe("DateFieldRow", () => {
  it("renders text field with value and passes value to dropdown", () => {
    render(<DateFieldRow value="12.02.2026" onChange={jest.fn()} />);

    expect(screen.getByDisplayValue("12.02.2026")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-date-picker")).toHaveAttribute(
      "data-value",
      "12.02.2026"
    );
  });

  it("calls onChange when typing in the text field", () => {
    const onChange = jest.fn();

    render(<DateFieldRow value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "15.03.2026" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("15.03.2026");
  });

  it("calls onChange when dropdown date picker changes", () => {
    const onChange = jest.fn();

    render(<DateFieldRow value="" onChange={onChange} />);

    fireEvent.click(screen.getByTestId("dropdown-date-picker"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("05.03.2026");
  });

  it("disables the text field and passes disabled to dropdown", () => {
    render(<DateFieldRow value="01.01.2026" onChange={jest.fn()} disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByTestId("dropdown-date-picker")).toHaveAttribute(
      "data-disabled",
      "true"
    );
  });

  it("does not call onChange from dropdown when disabled", () => {
    const onChange = jest.fn();

    render(<DateFieldRow value="" onChange={onChange} disabled />);

    fireEvent.click(screen.getByTestId("dropdown-date-picker"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the text field enabled by default", () => {
    render(<DateFieldRow value="" onChange={jest.fn()} />);

    expect(screen.getByRole("textbox")).toBeEnabled();
  });
});