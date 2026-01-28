// AccessModalHeader.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccessModalHeader from "./AccessModalHeader";

describe("AccessModalHeader", () => {
  test("renders title + filename + icons, and close button calls onClose", async () => {
    const onClose = jest.fn();
    const fileName = "MyFile.pdf";

    render(<AccessModalHeader fileName={fileName} onClose={onClose} />);

    // Text content
    expect(screen.getByText("Manage File Access")).toBeInTheDocument();
    expect(screen.getByText(fileName)).toBeInTheDocument();

    // Icons from MUI icons-material typically expose these stable testids
    expect(screen.getByTestId("LockOutlinedIcon")).toBeInTheDocument();
    expect(screen.getByTestId("CloseIcon")).toBeInTheDocument();

    // Close action
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
