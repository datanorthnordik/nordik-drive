import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import CommunityActionBar from "./CommunityActionBar";

jest.mock("lucide-react", () => ({
  ChevronUp: () => <span data-testid="chevron-up">up</span>,
  ChevronDown: () => <span data-testid="chevron-down">down</span>,
  Plus: () => <span data-testid="plus-icon">plus</span>,
  Info: () => <span data-testid="info-icon">info</span>,
}));

describe("CommunityActionBar", () => {
  const setFilterOpen = jest.fn();
  const onAddStudent = jest.fn();

  const renderComponent = (
    overrides: Partial<React.ComponentProps<typeof CommunityActionBar>> = {}
  ) =>
    render(
      <CommunityActionBar
        filterOpen={false}
        setFilterOpen={setFilterOpen}
        onAddStudent={onAddStudent}
        {...overrides}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders show filter state when filterOpen is false", () => {
    renderComponent({ filterOpen: false });

    const filterButton = screen.getByRole("button", { name: /show filter/i });

    expect(filterButton).toBeInTheDocument();
    expect(filterButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
    expect(screen.queryByTestId("chevron-up")).not.toBeInTheDocument();
  });

  it("renders hide filter state when filterOpen is true", () => {
    renderComponent({ filterOpen: true });

    const filterButton = screen.getByRole("button", { name: /hide filter/i });

    expect(filterButton).toBeInTheDocument();
    expect(filterButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("chevron-up")).toBeInTheDocument();
    expect(screen.queryByTestId("chevron-down")).not.toBeInTheDocument();
  });

  it("calls setFilterOpen with a toggle callback when filter button is clicked", () => {
    renderComponent({ filterOpen: false });

    fireEvent.click(screen.getByRole("button", { name: /show filter/i }));

    expect(setFilterOpen).toHaveBeenCalledTimes(1);
    expect(setFilterOpen).toHaveBeenCalledWith(expect.any(Function));

    const toggleFn = setFilterOpen.mock.calls[0][0];
    expect(toggleFn(false)).toBe(true);
    expect(toggleFn(true)).toBe(false);
  });

  it("renders Add Student button and calls onAddStudent when clicked", () => {
    renderComponent();

    const addButton = screen.getByRole("button", { name: /add student/i });

    expect(addButton).toBeInTheDocument();
    expect(screen.getByTestId("plus-icon")).toBeInTheDocument();

    fireEvent.click(addButton);

    expect(onAddStudent).toHaveBeenCalledTimes(1);
  });

  it("renders the welcome message inside a note region", () => {
    renderComponent();

    const note = screen.getByRole("note");

    expect(note).toBeInTheDocument();
    expect(screen.getByTestId("info-icon")).toBeInTheDocument();
    expect(
      screen.getByText(/we welcome you to add and\/or edit any information/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/chi-miigwetch!/i)
    ).toBeInTheDocument();
  });
});