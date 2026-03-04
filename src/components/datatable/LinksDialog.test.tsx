// LinksDialog.test.tsx
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import LinksDialog from "./LinksDialog";
import { isDocumentUrl, linkLabel } from "../../lib/urlUtils";

jest.mock("../../lib/urlUtils", () => ({
  isDocumentUrl: jest.fn(),
  linkLabel: jest.fn(),
}));

describe("LinksDialog", () => {
  const mockedIsDocumentUrl = isDocumentUrl as jest.MockedFunction<typeof isDocumentUrl>;
  const mockedLinkLabel = linkLabel as jest.MockedFunction<typeof linkLabel>;

  const defaultProps = (
    overrides: Partial<React.ComponentProps<typeof LinksDialog>> = {}
  ): React.ComponentProps<typeof LinksDialog> => ({
    open: true,
    title: "Helpful Links",
    urls: [
      "https://example.com/page",
      "https://example.com/file.pdf",
    ],
    onClose: jest.fn(),
    onOpenWebsite: jest.fn(),
    onOpenDocumentUrl: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockedIsDocumentUrl.mockImplementation((url: string) => url.endsWith(".pdf"));
    mockedLinkLabel.mockImplementation((url: string) => `Label: ${url}`);
  });

  it("renders nothing when open is false", () => {
    render(<LinksDialog {...defaultProps({ open: false })} />);

    expect(screen.queryByText("Helpful Links")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog title and all URLs when open is true", () => {
    render(<LinksDialog {...defaultProps()} />);

    expect(screen.getByText("Helpful Links")).toBeInTheDocument();

    expect(
      screen.getByText("Label: https://example.com/page")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Label: https://example.com/file.pdf")
    ).toBeInTheDocument();

    expect(mockedLinkLabel).toHaveBeenCalledWith("https://example.com/page");
    expect(mockedLinkLabel).toHaveBeenCalledWith("https://example.com/file.pdf");
  });

  it("renders 'View Website' for non-document URLs", () => {
    render(<LinksDialog {...defaultProps()} />);

    expect(
      screen.getByRole("button", { name: "View Website" })
    ).toBeInTheDocument();
  });

  it("renders 'View Document' for document URLs", () => {
    render(<LinksDialog {...defaultProps()} />);

    expect(
      screen.getByRole("button", { name: "View Document" })
    ).toBeInTheDocument();
  });

  it("calls onClose and onOpenWebsite when website button is clicked", () => {
    const onClose = jest.fn();
    const onOpenWebsite = jest.fn();
    const onOpenDocumentUrl = jest.fn();

    render(
      <LinksDialog
        {...defaultProps({
          onClose,
          onOpenWebsite,
          onOpenDocumentUrl,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View Website" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenWebsite).toHaveBeenCalledTimes(1);
    expect(onOpenWebsite).toHaveBeenCalledWith("https://example.com/page");
    expect(onOpenDocumentUrl).not.toHaveBeenCalled();
  });

  it("calls onClose and onOpenDocumentUrl when document button is clicked", () => {
    const onClose = jest.fn();
    const onOpenWebsite = jest.fn();
    const onOpenDocumentUrl = jest.fn();

    render(
      <LinksDialog
        {...defaultProps({
          onClose,
          onOpenWebsite,
          onOpenDocumentUrl,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View Document" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenDocumentUrl).toHaveBeenCalledTimes(1);
    expect(onOpenDocumentUrl).toHaveBeenCalledWith("https://example.com/file.pdf");
    expect(onOpenWebsite).not.toHaveBeenCalled();
  });

  it("sets the full URL in the title attribute for each label", () => {
    render(<LinksDialog {...defaultProps()} />);

    const websiteLabel = screen.getByText("Label: https://example.com/page");
    const documentLabel = screen.getByText("Label: https://example.com/file.pdf");

    expect(websiteLabel).toHaveAttribute("title", "https://example.com/page");
    expect(documentLabel).toHaveAttribute("title", "https://example.com/file.pdf");
  });

  it("renders no link rows when urls is empty", () => {
    render(<LinksDialog {...defaultProps({ urls: [] })} />);

    expect(screen.getByText("Helpful Links")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View Website" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View Document" })
    ).not.toBeInTheDocument();
  });

  it("calls onClose when the dialog requests close", () => {
    const onClose = jest.fn();

    render(<LinksDialog {...defaultProps({ onClose })} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });
});