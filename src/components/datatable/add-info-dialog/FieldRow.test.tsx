import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FieldRow from "./FieldRow";

describe("FieldRow", () => {
  it("renders the label and children", () => {
    render(
      <FieldRow label="First Name">
        <div>Child Content</div>
      </FieldRow>
    );

    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders the required asterisk when required is true", () => {
    render(
      <FieldRow label="Email" required>
        <div>Child</div>
      </FieldRow>
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not render the required asterisk when required is false", () => {
    render(
      <FieldRow label="Email">
        <div>Child</div>
      </FieldRow>
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders helper text when provided", () => {
    render(
      <FieldRow label="Phone" helperText="Enter your primary phone number">
        <div>Child</div>
      </FieldRow>
    );

    expect(screen.getByText("Enter your primary phone number")).toBeInTheDocument();
  });

  it("does not render helper text when not provided", () => {
    render(
      <FieldRow label="Phone">
        <div>Child</div>
      </FieldRow>
    );

    expect(screen.queryByText("Enter your primary phone number")).not.toBeInTheDocument();
  });

  it("renders reset button when onReset is provided", () => {
    const onReset = jest.fn();

    render(
      <FieldRow label="Address" onReset={onReset}>
        <div>Child</div>
      </FieldRow>
    );

    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("does not render reset button when onReset is not provided", () => {
    render(
      <FieldRow label="Address">
        <div>Child</div>
      </FieldRow>
    );

    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });

  it("calls onReset when reset button is clicked", () => {
    const onReset = jest.fn();

    render(
      <FieldRow label="Address" onReset={onReset}>
        <div>Child</div>
      </FieldRow>
    );

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("disables the reset button when resetDisabled is true", () => {
    const onReset = jest.fn();

    render(
      <FieldRow label="Address" onReset={onReset} resetDisabled>
        <div>Child</div>
      </FieldRow>
    );

    const resetButton = screen.getByRole("button", { name: /reset/i });

    expect(resetButton).toBeDisabled();

    fireEvent.click(resetButton);
    expect(onReset).not.toHaveBeenCalled();
  });

  it("keeps the reset button enabled when resetDisabled is false", () => {
    const onReset = jest.fn();

    render(
      <FieldRow label="Address" onReset={onReset} resetDisabled={false}>
        <div>Child</div>
      </FieldRow>
    );

    expect(screen.getByRole("button", { name: /reset/i })).toBeEnabled();
  });
});