import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import RequestStatusSummary from "./RequestStatusSummary";

describe("RequestStatusSummary", () => {
  const items = [
    {
      key: "pending",
      label: "Pending",
      count: 2,
      total: 10,
      accent: "#f39c12",
      background: "rgba(243, 156, 18, 0.10)",
    },
    {
      key: "approved",
      label: "Approved",
      count: 3,
      total: 10,
      accent: "#166534",
      background: "rgba(39, 174, 96, 0.10)",
    },
    {
      key: "rejected",
      label: "Rejected",
      count: 5,
      total: 10,
      accent: "#4b5563",
      background: "rgba(107, 114, 128, 0.10)",
    },
  ];

  it("renders each status count as count over total", () => {
    render(<RequestStatusSummary items={items} />);

    expect(screen.getByTestId("status-summary-pending")).toHaveTextContent("Pending2/ 10");
    expect(screen.getByTestId("status-summary-approved")).toHaveTextContent("Approved3/ 10");
    expect(screen.getByTestId("status-summary-rejected")).toHaveTextContent("Rejected5/ 10");
  });

  it("keeps labels and numeric values accessible within each item", () => {
    render(<RequestStatusSummary items={items} />);

    const pending = within(screen.getByTestId("status-summary-pending"));

    expect(pending.getByText("Pending")).toBeInTheDocument();
    expect(pending.getByText("2")).toBeInTheDocument();
    expect(pending.getByText("/ 10")).toBeInTheDocument();
  });

  it("marks the selected item and calls onSelect when a status is clicked", () => {
    const onSelect = jest.fn();

    render(<RequestStatusSummary items={items} selectedKey="pending" onSelect={onSelect} />);

    expect(screen.getByTestId("status-summary-pending")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByTestId("status-summary-approved")).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    fireEvent.click(screen.getByTestId("status-summary-rejected"));

    expect(onSelect).toHaveBeenCalledWith("rejected");
  });

  it("renders an empty-state message when there are no summary items", () => {
    render(<RequestStatusSummary items={[]} />);

    expect(screen.getByText("No request counts available.")).toBeInTheDocument();
  });
});
