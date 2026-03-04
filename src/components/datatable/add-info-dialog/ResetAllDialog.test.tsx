import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ResetAllDialog from "./ResetAllDialog"; // update path if needed

describe("ResetAllDialog", () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, message, and action buttons when open", () => {
    render(<ResetAllDialog {...baseProps} />);

    expect(screen.getByText("Reset All?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to reset all fields and remove uploaded photos and documents?"
      )
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset all/i })).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<ResetAllDialog {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    expect(baseProps.onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when Reset All is clicked", () => {
    render(<ResetAllDialog {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /reset all/i }));

    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it("does not render content when open is false", () => {
    render(<ResetAllDialog {...baseProps} open={false} />);

    expect(screen.queryByText("Reset All?")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Are you sure you want to reset all fields and remove uploaded photos and documents?"
      )
    ).not.toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reset all/i })).not.toBeInTheDocument();
  });
});