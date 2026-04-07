import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ConfigFormGuardNotice from "./ConfigFormGuardNotice";

jest.mock("@mui/material", () => ({
  __esModule: true,
  Box: ({ children }: any) => <div>{children}</div>,
  CircularProgress: () => <div data-testid="circular-progress" />,
  Typography: ({ children }: any) => <div>{children}</div>,
}));

describe("ConfigFormGuardNotice", () => {
  it("renders a loading notice while the submission guard is checking", () => {
    render(
      <ConfigFormGuardNotice
        guardCheckPending={true}
        submissionGuard={{ kind: "none", message: "" }}
      />
    );

    expect(screen.getByTestId("submission-guard-loading")).toBeInTheDocument();
    expect(screen.getByTestId("circular-progress")).toBeInTheDocument();
    expect(
      screen.getByText("Checking for existing form requests. Please wait.")
    ).toBeInTheDocument();
  });

  it("renders the blocked notice for another user's active request", () => {
    render(
      <ConfigFormGuardNotice
        guardCheckPending={false}
        submissionGuard={{
          kind: "other-user-active",
          message: "A request for boarding_form has been already created by someone else.",
        }}
      />
    );

    expect(screen.getByTestId("submission-guard-blocked")).toBeInTheDocument();
    expect(
      screen.getByText("A request for boarding_form has been already created by someone else.")
    ).toBeInTheDocument();
  });

  it("renders the approved readonly warning", () => {
    render(
      <ConfigFormGuardNotice
        guardCheckPending={false}
        submissionGuard={{
          kind: "approved",
          message: "Boarding Form for Athul Narayanan is already approved.",
        }}
      />
    );

    expect(screen.getByTestId("submission-guard-warning")).toBeInTheDocument();
    expect(screen.getByText("Already Approved")).toBeInTheDocument();
    expect(screen.getByText("Read Only")).toBeInTheDocument();
    expect(
      screen.getByText("Boarding Form for Athul Narayanan is already approved.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You can still review this submission here, but you can't create another request from this flow."
      )
    ).toBeInTheDocument();
  });

  it("renders nothing when there is no guard state to show", () => {
    const { container } = render(
      <ConfigFormGuardNotice
        guardCheckPending={false}
        submissionGuard={{ kind: "none", message: "" }}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
