import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AdminRequestsWrapper from "./AdminRequestsWrapper";

const mockRequestsHub = jest.fn();

jest.mock("./RequestHub", () => ({
  __esModule: true,
  default: (props: any) => {
    mockRequestsHub(props);

    return (
      <div data-testid="requests-hub">
        <div data-testid="add-info-slot">{props.addInfoRequests}</div>
        <div data-testid="form-submission-slot">{props.formSubmissionRequests}</div>
      </div>
    );
  },
}));

jest.mock("./PendingRequests", () => ({
  __esModule: true,
  default: () => <div data-testid="pending-edit-requests-table">Pending Edit Requests Table</div>,
}));

jest.mock("./FormSubmissionRequest", () => ({
  __esModule: true,
  default: () => <div data-testid="form-submission-requests">Form Submission Requests</div>,
}));

describe("AdminRequestsWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders RequestsHub", () => {
    render(<AdminRequestsWrapper />);

    expect(screen.getByTestId("requests-hub")).toBeInTheDocument();
  });

  it("passes PendingEditRequestsTable into addInfoRequests prop", () => {
    render(<AdminRequestsWrapper />);

    expect(screen.getByTestId("add-info-slot")).toBeInTheDocument();
    expect(screen.getByTestId("pending-edit-requests-table")).toBeInTheDocument();
    expect(screen.getByText("Pending Edit Requests Table")).toBeInTheDocument();
  });

  it("passes FormSubmissionRequests into formSubmissionRequests prop", () => {
    render(<AdminRequestsWrapper />);

    expect(screen.getByTestId("form-submission-slot")).toBeInTheDocument();
    expect(screen.getByTestId("form-submission-requests")).toBeInTheDocument();
    expect(screen.getByText("Form Submission Requests")).toBeInTheDocument();
  });

  it("calls RequestsHub once with both expected props", () => {
    render(<AdminRequestsWrapper />);

    expect(mockRequestsHub).toHaveBeenCalledTimes(1);

    const props = mockRequestsHub.mock.calls[0][0];

    expect(props.addInfoRequests).toBeTruthy();
    expect(props.formSubmissionRequests).toBeTruthy();
  });

  it("renders both child request sections inside RequestsHub", () => {
    render(<AdminRequestsWrapper />);

    expect(screen.getByTestId("pending-edit-requests-table")).toBeInTheDocument();
    expect(screen.getByTestId("form-submission-requests")).toBeInTheDocument();
  });
});