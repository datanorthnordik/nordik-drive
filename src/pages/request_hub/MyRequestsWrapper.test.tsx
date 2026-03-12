import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import MyRequests from "./MyRequestsWrapper";

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

jest.mock("./MyRequests", () => ({
  __esModule: true,
  default: () => <div data-testid="user-add-info-requests">User Add Info Requests</div>,
}));

jest.mock("./MyFormSubmissionRequests", () => ({
  __esModule: true,
  default: () => <div data-testid="my-form-submission-requests">My Form Submission Requests</div>,
}));

describe("MyRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders RequestsHub", () => {
    render(<MyRequests />);

    expect(screen.getByTestId("requests-hub")).toBeInTheDocument();
  });

  it("passes UserAddInfoRequests into addInfoRequests prop", () => {
    render(<MyRequests />);

    expect(screen.getByTestId("add-info-slot")).toBeInTheDocument();
    expect(screen.getByTestId("user-add-info-requests")).toBeInTheDocument();
    expect(screen.getByText("User Add Info Requests")).toBeInTheDocument();
  });

  it("passes MyFormSubmissionRequests into formSubmissionRequests prop", () => {
    render(<MyRequests />);

    expect(screen.getByTestId("form-submission-slot")).toBeInTheDocument();
    expect(screen.getByTestId("my-form-submission-requests")).toBeInTheDocument();
    expect(screen.getByText("My Form Submission Requests")).toBeInTheDocument();
  });

  it("calls RequestsHub once with both expected props", () => {
    render(<MyRequests />);

    expect(mockRequestsHub).toHaveBeenCalledTimes(1);

    const props = mockRequestsHub.mock.calls[0][0];

    expect(props.addInfoRequests).toBeTruthy();
    expect(props.formSubmissionRequests).toBeTruthy();
  });

  it("renders both child request sections inside RequestsHub", () => {
    render(<MyRequests />);

    expect(screen.getByTestId("user-add-info-requests")).toBeInTheDocument();
    expect(screen.getByTestId("my-form-submission-requests")).toBeInTheDocument();
  });
});