// SourceFilterBar.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import SourceFilterBar from "./SourceFilterBar";
import { colorSources } from "../../constants/constants";
import {
  color_black,
  color_light_gray,
  color_white,
} from "../../constants/colors";

describe("SourceFilterBar", () => {
  const mockSetSourceFilter = jest.fn();
  const sources = ["SourceA", "SourceB"];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when availableSources is empty", () => {
    const { container } = render(
      <SourceFilterBar
        availableSources={[]}
        sourceFilter={null}
        setSourceFilter={mockSetSourceFilter}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders label, All button, and source buttons", () => {
    render(
      <SourceFilterBar
        availableSources={sources}
        sourceFilter={null}
        setSourceFilter={mockSetSourceFilter}
      />
    );

    expect(screen.getByText("Filter by Source:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SourceA" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SourceB" })).toBeInTheDocument();
  });

  it("keeps filters on a single horizontal scrolling row", () => {
    render(
      <SourceFilterBar
        availableSources={sources}
        sourceFilter={null}
        setSourceFilter={mockSetSourceFilter}
      />
    );

    const scrollRail = screen.getByTestId("source-filter-scroll");

    expect(scrollRail).toHaveStyle("overflow-x: auto");
    expect(scrollRail).toHaveStyle("overflow-y: hidden");
    expect(scrollRail).toHaveStyle("flex-wrap: nowrap");
    expect(scrollRail).toHaveStyle("white-space: nowrap");
  });

  it("calls setSourceFilter(null) when All button is clicked", () => {
    render(
      <SourceFilterBar
        availableSources={sources}
        sourceFilter="SourceA"
        setSourceFilter={mockSetSourceFilter}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(mockSetSourceFilter).toHaveBeenCalledTimes(1);
    expect(mockSetSourceFilter).toHaveBeenCalledWith(null);
  });

  it("calls setSourceFilter(source) when a source button is clicked", () => {
    render(
      <SourceFilterBar
        availableSources={sources}
        sourceFilter={null}
        setSourceFilter={mockSetSourceFilter}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "SourceB" }));

    expect(mockSetSourceFilter).toHaveBeenCalledTimes(1);
    expect(mockSetSourceFilter).toHaveBeenCalledWith("SourceB");
  });

  it("applies selected styles to All button when sourceFilter is null", () => {
    render(
      <SourceFilterBar
        availableSources={sources}
        sourceFilter={null}
        setSourceFilter={mockSetSourceFilter}
      />
    );

    const allButton = screen.getByRole("button", { name: "All" });

    expect(allButton).toHaveStyle(`border: 3px solid ${color_black}`);
    expect(allButton).toHaveStyle("box-shadow: 0 0 6px rgba(0,0,0,0.3)");
    expect(allButton).toHaveStyle(`background: ${color_white}`);
    expect(allButton).toHaveStyle(`color: ${color_black}`);
  });

  it("applies unselected styles to All button when a source is selected", () => {
    render(
      <SourceFilterBar
        availableSources={sources}
        sourceFilter="SourceA"
        setSourceFilter={mockSetSourceFilter}
      />
    );

    const allButton = screen.getByRole("button", { name: "All" });

    expect(allButton).toHaveStyle(`border: 1px solid ${color_light_gray}`);
    expect(allButton).toHaveStyle("box-shadow: none");
  });

  it("applies selected styles to the active source button", () => {
    render(
      <SourceFilterBar
        availableSources={sources}
        sourceFilter="SourceA"
        setSourceFilter={mockSetSourceFilter}
      />
    );

    const sourceAButton = screen.getByRole("button", { name: "SourceA" });

    expect(sourceAButton).toHaveStyle("border: 3px solid #000");
    expect(sourceAButton).toHaveStyle("box-shadow: 0 0 6px rgba(0,0,0,0.4)");
    expect(sourceAButton).toHaveStyle(`background: ${colorSources["SourceA"]}`);
    expect(sourceAButton).toHaveStyle(`color: ${color_white}`);
  });

  it("applies unselected styles to inactive source buttons", () => {
    render(
      <SourceFilterBar
        availableSources={sources}
        sourceFilter="SourceA"
        setSourceFilter={mockSetSourceFilter}
      />
    );

    const sourceBButton = screen.getByRole("button", { name: "SourceB" });

    expect(sourceBButton).toHaveStyle("border: 1px solid #ccc");
    expect(sourceBButton).toHaveStyle("box-shadow: none");
    expect(sourceBButton).toHaveStyle(`background: ${colorSources["SourceB"]}`);
    expect(sourceBButton).toHaveStyle(`color: ${color_white}`);
  });
});
