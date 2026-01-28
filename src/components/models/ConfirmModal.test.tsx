// src/components/models/access_model/ConfirmModal.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmationModal from "./ConfirmModal";
import { color_secondary } from "../../constants/colors";

// ---------- MUI mocks (stable + deterministic) ----------
const mockDialog = jest.fn();
const mockDialogTitle = jest.fn();
const mockDialogContent = jest.fn();
const mockDialogActions = jest.fn();
const mockButton = jest.fn();
const mockTypography = jest.fn();
const mockBox = jest.fn();
const mockUseTheme = jest.fn();
const mockUseMediaQuery = jest.fn();

jest.mock("@mui/material", () => {
  const React = require("react");

  const Dialog = (props: any) => {
    mockDialog(props);
    if (!props.open) return null;

    return (
      <div
        data-testid="mui-dialog"
        role="dialog"
        aria-labelledby={props["aria-labelledby"]}
      >
        {props.children}
      </div>
    );
  };

  const DialogTitle = (props: any) => {
    mockDialogTitle(props);
    return (
      <div data-testid="mui-dialog-title" id={props.id}>
        {props.children}
      </div>
    );
  };

  const DialogContent = (props: any) => {
    mockDialogContent(props);
    return <div data-testid="mui-dialog-content">{props.children}</div>;
  };

  const DialogActions = (props: any) => {
    mockDialogActions(props);
    return <div data-testid="mui-dialog-actions">{props.children}</div>;
  };

  const Button = (props: any) => {
    mockButton(props);
    return (
      <button type="button" onClick={props.onClick}>
        {props.children}
      </button>
    );
  };

  const Typography = (props: any) => {
    mockTypography(props);
    return <div data-testid="mui-typography">{props.children}</div>;
  };

  const Box = (props: any) => {
    mockBox(props);
    return <div data-testid="mui-box">{props.children}</div>;
  };

  return {
    __esModule: true,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    useTheme: (...args: any[]) => mockUseTheme(...args),
    useMediaQuery: (...args: any[]) => mockUseMediaQuery(...args),
  };
});

// Mock icon so we don't depend on @mui/material subpath internals
jest.mock("@mui/icons-material/DeleteOutlineRounded", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => <svg data-testid="DeleteOutlineRoundedIcon" {...props} />,
  };
});

describe("ConfirmationModal", () => {
  const setupTheme = () => {
    const down = jest.fn((k: string) => `down-${k}`);
    mockUseTheme.mockReturnValue({
      palette: { text: { primary: "#111", secondary: "#666" } },
      breakpoints: { down },
    });
    return { down };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupTheme();
  });

  test("when open=false, Dialog is not rendered (and props are still passed)", () => {
    mockUseMediaQuery.mockReturnValue(false);

    render(
      <ConfirmationModal
        open={false}
        text="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByTestId("mui-dialog")).not.toBeInTheDocument();

    // Ensure Dialog got called and received open=false
    expect(mockDialog).toHaveBeenCalled();
    const dialogProps = mockDialog.mock.calls[0][0];
    expect(dialogProps.open).toBe(false);
    expect(dialogProps["aria-labelledby"]).toBe("confirmation-dialog-title");
  });

  test("desktop (isMobile=false): renders defaults + wires buttons + sets desktop sizing styles", async () => {
    const { down } = setupTheme();
    mockUseMediaQuery.mockReturnValue(false);

    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <ConfirmationModal
        open
        text="This will permanently delete the file."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Content rendered
    expect(screen.getByTestId("mui-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("mui-dialog")).toHaveAttribute(
      "aria-labelledby",
      "confirmation-dialog-title"
    );
    expect(screen.getByTestId("DeleteOutlineRoundedIcon")).toBeInTheDocument();

    // Default labels
    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
    expect(screen.getByText("This will permanently delete the file.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();

    // Click handlers
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // useMediaQuery called with theme.breakpoints.down("sm")
    expect(down).toHaveBeenCalledWith("sm");
    expect(mockUseMediaQuery).toHaveBeenCalledWith("down-sm");

    // Dialog props: desktop sizing branch
    const dialogProps = mockDialog.mock.calls[mockDialog.mock.calls.length - 1][0];
    expect(dialogProps.PaperProps?.sx?.width).toBe(520);
    expect(dialogProps.PaperProps?.sx?.px).toBe(4);
    expect(dialogProps.PaperProps?.sx?.pt).toBe(3.5);
    expect(dialogProps.PaperProps?.sx?.pb).toBe(3);
    expect(dialogProps.BackdropProps?.sx?.backgroundColor).toBe("rgba(0,0,0,0.55)");
    expect(dialogProps.onClose).toBe(onCancel);

    // DialogTitle props: desktop fontSize branch + id
    expect(screen.getByTestId("mui-dialog-title")).toHaveAttribute(
      "id",
      "confirmation-dialog-title"
    );
    const titleProps = mockDialogTitle.mock.calls[0][0];
    expect(titleProps.sx?.fontSize).toBe("1.25rem");

    // Typography props: desktop fontSize + theme palette secondary + px
    const typoProps = mockTypography.mock.calls[0][0];
    expect(typoProps.sx?.color).toBe("#666");
    expect(typoProps.sx?.fontSize).toBe("0.95rem");
    expect(typoProps.sx?.px).toBe(1);

    // Buttons: check confirm uses color_secondary and cancel is outlined
    const buttons = mockButton.mock.calls.map((c) => c[0]);

    const cancelBtn = buttons.find((b) => b.children === "Cancel");
    expect(cancelBtn.variant).toBe("outlined");

    const confirmBtn = buttons.find((b) => b.children === "Confirm");
    expect(confirmBtn.variant).toBe("contained");
    expect(confirmBtn.sx?.backgroundColor).toBe(color_secondary);
  });

  test("mobile (isMobile=true): renders custom labels + mobile sizing styles + Dialog onClose triggers onCancel", async () => {
    const { down } = setupTheme();
    mockUseMediaQuery.mockReturnValue(true);

    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <ConfirmationModal
        open
        title="Confirm Action"
        text="Do you want to proceed?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Custom labels
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Do you want to proceed?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();

    // Click handlers
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Dialog onClose should be onCancel; call it directly to cover the path
    const dialogProps = mockDialog.mock.calls[mockDialog.mock.calls.length - 1][0];
    dialogProps.onClose();
    expect(onCancel).toHaveBeenCalledTimes(2);

    // useMediaQuery called with theme.breakpoints.down("sm")
    expect(down).toHaveBeenCalledWith("sm");
    expect(mockUseMediaQuery).toHaveBeenCalledWith("down-sm");

    // Mobile sizing branch
    expect(dialogProps.PaperProps?.sx?.width).toBe("92%");
    expect(dialogProps.PaperProps?.sx?.px).toBe(2.5);
    expect(dialogProps.PaperProps?.sx?.pt).toBe(3);
    expect(dialogProps.PaperProps?.sx?.pb).toBe(2.5);

    // DialogTitle mobile fontSize branch
    const titleProps = mockDialogTitle.mock.calls[0][0];
    expect(titleProps.sx?.fontSize).toBe("1.1rem");

    // Typography mobile fontSize branch + px
    const typoProps = mockTypography.mock.calls[0][0];
    expect(typoProps.sx?.fontSize).toBe("0.9rem");
    expect(typoProps.sx?.px).toBe(0.5);

    // Confirm button uses color_secondary
    const confirmBtn = mockButton.mock.calls
      .map((c) => c[0])
      .find((b) => b.children === "Yes");
    expect(confirmBtn.sx?.backgroundColor).toBe(color_secondary);
  });
});
