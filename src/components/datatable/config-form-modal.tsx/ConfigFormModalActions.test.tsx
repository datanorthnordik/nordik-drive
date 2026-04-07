import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ConfigFormModalActions from "./ConfigFormModalActions";

jest.mock("@mui/material", () => ({
  __esModule: true,
  Button: ({ children, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  DialogActions: ({ children }: any) => <div>{children}</div>,
}));

describe("ConfigFormModalActions", () => {
  const makeProps = (
    overrides: Partial<React.ComponentProps<typeof ConfigFormModalActions>> = {}
  ): React.ComponentProps<typeof ConfigFormModalActions> => ({
    review: false,
    editable: true,
    isProcessing: false,
    saveGuardBusy: false,
    onClose: jest.fn(),
    onSave: jest.fn(),
    onReviewAction: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders cancel and submit actions for editable non-review mode", () => {
    const props = makeProps();

    render(<ConfigFormModalActions {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect(props.onReviewAction).not.toHaveBeenCalled();
  });

  it("disables submit and shows saving state when processing", () => {
    const props = makeProps({
      isProcessing: true,
    });

    render(<ConfigFormModalActions {...props} />);

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("hides submit and shows close when the form is not editable", () => {
    render(
      <ConfigFormModalActions
        {...makeProps({
          editable: false,
        })}
      />
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
  });

  it("renders review actions and forwards the selected action", () => {
    const props = makeProps({
      review: true,
      editable: false,
    });

    render(<ConfigFormModalActions {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Need More Info" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(props.onReviewAction).toHaveBeenNthCalledWith(1, "moreInfo");
    expect(props.onReviewAction).toHaveBeenNthCalledWith(2, "rejected");
    expect(props.onReviewAction).toHaveBeenNthCalledWith(3, "approved");
  });

  it("disables the submit button when the save guard is still busy", () => {
    render(
      <ConfigFormModalActions
        {...makeProps({
          saveGuardBusy: true,
        })}
      />
    );

    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});
