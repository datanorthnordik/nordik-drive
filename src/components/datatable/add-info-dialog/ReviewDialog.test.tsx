
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("./constants", () => ({
  DOCUMENT_CATEGORY_OPTIONS: [
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "death_certificate", label: "Death Certificate" },
    { value: "other_document", label: "Other Document" },
  ],
}));

import ReviewDialog from "./ReviewDialog"; // update path if needed

describe("ReviewDialog", () => {
  const baseProps = {
    open: true,
    title: "Review Submission",
    items: [
      { field: "Name", oldValue: "Old Name", newValue: "New Name" },
      { field: "Notes", oldValue: "", newValue: "" },
    ],
    photosCount: 2,
    docs: [
      {
        id: "1",
        file: new File(["a"], "birth.pdf"),
        document_type: "document" as const,
        document_category: "birth_certificate" as const,
      },
      {
        id: "2",
        file: new File(["b"], "other.pdf"),
        document_type: "document" as const,
        document_category: "other_document" as const,
      },
    ],
    consent: true,
    archiveConsent: false,
    totalCombinedMB: 12.345,
    maxCombinedMB: 25,
    onBack: jest.fn(),
    onConfirm: jest.fn(),
    confirmLabel: "Submit for Approval",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, review sections, items, attachments, consent, and upload summary", () => {
    render(<ReviewDialog {...baseProps} />);

    expect(screen.getByText("Review Submission")).toBeInTheDocument();
    expect(
      screen.getByText("Please review all updates carefully before submitting.")
    ).toBeInTheDocument();

    expect(screen.getByText("Review changes")).toBeInTheDocument();
    expect(
      screen.getByText("Compare the previous value with the new value for each updated field.")
    ).toBeInTheDocument();

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getAllByText("Old")).toHaveLength(2);
    expect(screen.getAllByText("New")).toHaveLength(2);
    expect(screen.getByText("Old Name")).toBeInTheDocument();
    expect(screen.getByText("New Name")).toBeInTheDocument();

    expect(screen.getByText("Attachments")).toBeInTheDocument();
    expect(screen.getByText("Photos: 2 selected")).toBeInTheDocument();
    expect(screen.getByText("Additional Documents: 2 selected")).toBeInTheDocument();
    expect(screen.getByText("birth.pdf")).toBeInTheDocument();
    expect(screen.getByText("Birth Certificate")).toBeInTheDocument();
    expect(screen.getByText("other.pdf")).toBeInTheDocument();
    expect(screen.getByText("Other Document")).toBeInTheDocument();

    expect(screen.getByText("Consent & upload summary")).toBeInTheDocument();
    expect(screen.getByText("Photo consent: Yes")).toBeInTheDocument();
    expect(screen.getByText("Archive consent: No")).toBeInTheDocument();
    expect(screen.getByText("Total upload")).toBeInTheDocument();
    expect(screen.getByText("12.35 MB / 25 MB")).toBeInTheDocument();
  });

  it("shows em dash for empty old/new values", () => {
    render(<ReviewDialog {...baseProps} />);

    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("renders empty state when there are no field changes", () => {
    render(
      <ReviewDialog
        {...baseProps}
        items={[]}
      />
    );

    expect(screen.getByText("No field changes to review.")).toBeInTheDocument();
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
  });

  it("hides attachments section when there are no photos and no docs", () => {
    render(
      <ReviewDialog
        {...baseProps}
        photosCount={0}
        docs={[]}
      />
    );

    expect(screen.queryByText("Attachments")).not.toBeInTheDocument();
    expect(screen.queryByText(/Photos:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Additional Documents:/i)).not.toBeInTheDocument();
  });

  it("falls back to raw document category when label mapping is missing", () => {
    render(
      <ReviewDialog
        {...baseProps}
        docs={[
          {
            id: "3",
            file: new File(["x"], "unknown.pdf"),
            document_type: "document",
            document_category: "custom_category" as any,
          },
        ]}
      />
    );

    expect(screen.getByText("unknown.pdf")).toBeInTheDocument();
    expect(screen.getByText("custom_category")).toBeInTheDocument();
  });

  it("calls onBack from Close and Back, and calls onConfirm from confirm button", () => {
    render(<ReviewDialog {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: /submit for approval/i }));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not render content when open is false", () => {
    render(<ReviewDialog {...baseProps} open={false} />);

    expect(screen.queryByText("Review Submission")).not.toBeInTheDocument();
    expect(screen.queryByText("Review changes")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^back$/i })).not.toBeInTheDocument();
  });
});