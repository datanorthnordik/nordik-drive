import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import FileActivitiesTopBar from "./FileActivitiesTopBar";

jest.mock("@mui/material", () => {
  const React = require("react");

  return {
    __esModule: true,
    Box: ({ children }: any) => <div>{children}</div>,
    Button: ({ children, onClick }: any) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    Chip: ({ label }: any) => <div>{label}</div>,
    ToggleButtonGroup: ({ children, value, onChange }: any) => (
      <div data-testid="toggle-group" data-value={value}>
        {React.Children.map(children, (child: any) =>
          React.cloneElement(child, {
            __groupOnChange: onChange,
            __groupValue: value,
          })
        )}
        <button
          type="button"
          data-testid="toggle-clear"
          onClick={() => onChange?.(null, null)}
        >
          clear
        </button>
      </div>
    ),
    ToggleButton: ({ children, value, __groupOnChange, __groupValue }: any) => (
      <button
        type="button"
        data-testid={`toggle-${value}`}
        data-selected={String(__groupValue === value)}
        onClick={() => __groupOnChange?.(null, value)}
      >
        {children}
      </button>
    ),
  };
});

jest.mock("@mui/icons-material/ListAlt", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">list-icon</span>,
}));

jest.mock("@mui/icons-material/Tune", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">tune-icon</span>,
}));

jest.mock("@mui/icons-material/Download", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">download-icon</span>,
}));

jest.mock("@mui/icons-material/FolderZip", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">zip-icon</span>,
}));

describe("FileActivitiesTopBar", () => {
  const makeProps = (
    overrides: Partial<React.ComponentProps<typeof FileActivitiesTopBar>> = {}
  ) => ({
    mode: "CHANGES" as const,
    onModeChange: jest.fn(),
    totalRequests: 12,
    totalChanges: 34,
    onOpenDownloadUpdates: jest.fn(),
    onOpenDownloadMedia: jest.fn(),
    primaryBtnSx: { background: "blue" },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the changes toggle, counts chip, and action buttons", () => {
    render(<FileActivitiesTopBar {...makeProps()} />);

    expect(screen.getByTestId("toggle-group")).toHaveAttribute("data-value", "CHANGES");
    expect(screen.getByTestId("toggle-CHANGES")).toBeInTheDocument();
    expect(screen.getByText("Changes")).toBeInTheDocument();
    expect(screen.getByText("Requests: 12 | Changes: 34")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Updates/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Download Photos & Docs/i })
    ).toBeInTheDocument();
  });

  it("marks the current mode as selected", () => {
    render(<FileActivitiesTopBar {...makeProps({ mode: "CHANGES" })} />);

    expect(screen.getByTestId("toggle-CHANGES")).toHaveAttribute("data-selected", "true");
  });

  it("calls onModeChange when a valid mode is selected", () => {
    const props = makeProps();

    render(<FileActivitiesTopBar {...props} />);

    fireEvent.click(screen.getByTestId("toggle-CHANGES"));

    expect(props.onModeChange).toHaveBeenCalledTimes(1);
    expect(props.onModeChange).toHaveBeenCalledWith("CHANGES");
  });

  it("does not call onModeChange when toggle group returns null", () => {
    const props = makeProps();

    render(<FileActivitiesTopBar {...props} />);

    fireEvent.click(screen.getByTestId("toggle-clear"));

    expect(props.onModeChange).not.toHaveBeenCalled();
  });

  it("calls onOpenDownloadUpdates when download updates button is clicked", () => {
    const props = makeProps();

    render(<FileActivitiesTopBar {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /Download Updates/i }));

    expect(props.onOpenDownloadUpdates).toHaveBeenCalledTimes(1);
    expect(props.onOpenDownloadMedia).not.toHaveBeenCalled();
  });

  it("calls onOpenDownloadMedia when download photos and docs button is clicked", () => {
    const props = makeProps();

    render(<FileActivitiesTopBar {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /Download Photos & Docs/i }));

    expect(props.onOpenDownloadMedia).toHaveBeenCalledTimes(1);
    expect(props.onOpenDownloadUpdates).not.toHaveBeenCalled();
  });

  it("renders zero counts correctly", () => {
    render(
      <FileActivitiesTopBar
        {...makeProps({
          totalRequests: 0,
          totalChanges: 0,
        })}
      />
    );

    expect(screen.getByText("Requests: 0 | Changes: 0")).toBeInTheDocument();
  });
});