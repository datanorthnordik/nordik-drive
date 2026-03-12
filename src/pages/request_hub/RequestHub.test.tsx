import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import RequestsHub from "./RequestHub";

const mockAddEventListener = jest.spyOn(window, "addEventListener");
const mockRemoveEventListener = jest.spyOn(window, "removeEventListener");

jest.mock("@mui/material", () => ({
  __esModule: true,
  Box: ({ children, sx, ...rest }: any) => (
    <div data-testid={rest["data-testid"]} data-sx={JSON.stringify(sx || {})}>
      {children}
    </div>
  ),
  Drawer: ({ open, children, onClose, sx }: any) =>
    open ? (
      <div data-testid="drawer" data-sx={JSON.stringify(sx || {})}>
        <button type="button" data-testid="drawer-backdrop-close" onClick={onClose}>
          Backdrop Close
        </button>
        {children}
      </div>
    ) : null,
  IconButton: ({ children, onClick, title, "aria-label": ariaLabel }: any) => (
    <button type="button" onClick={onClick} title={title} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  List: ({ children }: any) => <div>{children}</div>,
  ListItemButton: ({ children, onClick, selected }: any) => (
    <button type="button" onClick={onClick} data-selected={String(!!selected)}>
      {children}
    </button>
  ),
  ListItemIcon: ({ children }: any) => <span>{children}</span>,
  ListItemText: ({ primary }: any) => <span>{primary}</span>,
  Typography: ({ children }: any) => <div>{children}</div>,
  Divider: () => <hr />,
}));

jest.mock("@mui/icons-material/Close", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">close-icon</span>,
}));

jest.mock("@mui/icons-material/MoreVert", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">more-icon</span>,
}));

jest.mock("@mui/icons-material/Assignment", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">assignment-icon</span>,
}));

jest.mock("@mui/icons-material/Description", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">description-icon</span>,
}));

describe("RequestsHub", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("renders add info requests by default", () => {
    render(
      <RequestsHub
        addInfoRequests={<div data-testid="add-info-content">Add Info Content</div>}
        formSubmissionRequests={<div data-testid="form-content">Form Content</div>}
      />
    );

    expect(screen.getByTestId("add-info-content")).toBeInTheDocument();
    expect(screen.queryByTestId("form-content")).not.toBeInTheDocument();
  });

  it("opens navigation drawer when open navigation button is clicked", () => {
    render(
      <RequestsHub
        addInfoRequests={<div>Add Info Content</div>}
        formSubmissionRequests={<div>Form Content</div>}
      />
    );

    expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.getByText("NAVIGATION")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
  });

  it("closes navigation drawer when close button is clicked", () => {
    render(
      <RequestsHub
        addInfoRequests={<div>Add Info Content</div>}
        formSubmissionRequests={<div>Form Content</div>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByTestId("drawer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));

    expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
  });

  it("closes navigation drawer when drawer onClose is triggered", () => {
    render(
      <RequestsHub
        addInfoRequests={<div>Add Info Content</div>}
        formSubmissionRequests={<div>Form Content</div>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByTestId("drawer")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("drawer-backdrop-close"));

    expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
  });

  it("switches to form submission view and closes drawer when form submission item is selected", () => {
    render(
      <RequestsHub
        addInfoRequests={<div data-testid="add-info-content">Add Info Content</div>}
        formSubmissionRequests={<div data-testid="form-content">Form Content</div>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(screen.getByRole("button", { name: /Form Submission Requests/i }));

    expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("add-info-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("form-content")).toBeInTheDocument();
  });

  it("switches back to add info view when add info item is selected", () => {
    render(
      <RequestsHub
        addInfoRequests={<div data-testid="add-info-content">Add Info Content</div>}
        formSubmissionRequests={<div data-testid="form-content">Form Content</div>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(screen.getByRole("button", { name: /Form Submission Requests/i }));
    expect(screen.getByTestId("form-content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(screen.getByRole("button", { name: /Add Info Requests/i }));

    expect(screen.getByTestId("add-info-content")).toBeInTheDocument();
    expect(screen.queryByTestId("form-content")).not.toBeInTheDocument();
  });

  it("shows the default placeholder when formSubmissionRequests is not provided", () => {
    render(
      <RequestsHub addInfoRequests={<div data-testid="add-info-content">Add Info Content</div>} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(screen.getByRole("button", { name: /Form Submission Requests/i }));

    expect(screen.getByText("Form Submission Requests")).toBeInTheDocument();
    expect(
      screen.getByText("This section is kept as a placeholder for now.")
    ).toBeInTheDocument();
  });

  it("marks the currently selected navigation item", () => {
    render(
      <RequestsHub
        addInfoRequests={<div>Add Info Content</div>}
        formSubmissionRequests={<div>Form Content</div>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

    const addInfoBtn = screen.getByRole("button", { name: /Add Info Requests/i });
    const formBtn = screen.getByRole("button", { name: /Form Submission Requests/i });

    expect(addInfoBtn).toHaveAttribute("data-selected", "true");
    expect(formBtn).toHaveAttribute("data-selected", "false");

    fireEvent.click(formBtn);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByRole("button", { name: /Add Info Requests/i })).toHaveAttribute(
      "data-selected",
      "false"
    );
    expect(
      screen.getByRole("button", { name: /Form Submission Requests/i })
    ).toHaveAttribute("data-selected", "true");
  });

  it("registers resize listener on mount and removes it on unmount", () => {
    const { unmount } = render(
      <RequestsHub
        addInfoRequests={<div>Add Info Content</div>}
        formSubmissionRequests={<div>Form Content</div>}
      />
    );

    expect(mockAddEventListener).toHaveBeenCalledWith("resize", expect.any(Function));

    const resizeHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "resize"
    )?.[1];

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith("resize", resizeHandler);
  });

  it("responds to resize changes without breaking rendering", () => {
    render(
      <RequestsHub
        addInfoRequests={<div data-testid="add-info-content">Add Info Content</div>}
        formSubmissionRequests={<div data-testid="form-content">Form Content</div>}
      />
    );

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 700,
    });
    fireEvent(window, new Event("resize"));

    expect(screen.getByTestId("add-info-content")).toBeInTheDocument();

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
    fireEvent(window, new Event("resize"));

    expect(screen.getByTestId("add-info-content")).toBeInTheDocument();
  });
});