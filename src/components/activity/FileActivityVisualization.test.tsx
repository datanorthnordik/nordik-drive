import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import FileActivityVisualization from "./FileActivityVisualization";

// ---- Mock charts so JSDOM doesn't break, and so we can assert props easily ----
jest.mock("@mui/x-charts/PieChart", () => ({
  PieChart: (props: any) => {
    const inner = props?.series?.[0]?.innerRadius ?? 0;
    const items = props?.series?.[0]?.data?.length ?? 0;

    return (
      <div
        data-testid="mock-pie-chart"
        data-inner={String(inner)}
        data-items={String(items)}
      />
    );
  },
}));

jest.mock("@mui/x-charts/BarChart", () => ({
  BarChart: (props: any) => {
    const labels = props?.xAxis?.[0]?.data?.length ?? 0;
    const series = props?.series?.length ?? 0;

    return (
      <div
        data-testid="mock-bar-chart"
        data-labels={String(labels)}
        data-series={String(series)}
      />
    );
  },
}));

async function chooseOptionFromSelect(user: any, selectTestId: string, optionText: string) {
  const selectRoot = screen.getByTestId(selectTestId);
  const combo = within(selectRoot).getByRole("combobox");

  await user.click(combo);

  const listbox = await screen.findByRole("listbox");

  // MUI sometimes uses role=option, sometimes menuitem depending on versions
  const opt =
    within(listbox).queryByRole("option", { name: optionText }) ||
    within(listbox).queryByRole("menuitem", { name: optionText }) ||
    within(listbox).getByText(optionText);

  await user.click(opt);
  await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
}

describe("FileActivityVisualization", () => {
  test("no payload -> shows placeholder, title is correct, total chip shows 0 pending", () => {
    render(<FileActivityVisualization mode="CHANGES" payload={null} clauses={[]} />);

    expect(screen.getByTestId("file-viz-root")).toBeInTheDocument();
    expect(screen.getByTestId("file-viz-title")).toHaveTextContent(
      "Pending requests — grouped by file"
    );

    // Placeholder branch
    expect(screen.getByTestId("file-viz-placeholder")).toBeInTheDocument();
    expect(screen.getByText("Run a search to see visualization.")).toBeInTheDocument();

    // Requires you to add data-testid="file-viz-total" on the Chip
    expect(screen.getByTestId("file-viz-total")).toHaveTextContent("0 pending");

    // Chart select always exists
    expect(screen.getByTestId("file-viz-chart-select")).toBeInTheDocument();
  });

  test("payload but no aggregations -> shows no-data message and total 0 pending", () => {
    render(
      <FileActivityVisualization
        mode="PHOTOS"
        payload={{}} // no aggregations
        clauses={[]}
      />
    );

    expect(screen.getByTestId("file-viz-title")).toHaveTextContent(
      "Pending photos — grouped by file"
    );
    expect(screen.getByTestId("file-viz-no-data")).toHaveTextContent(
      "No pending aggregation data."
    );

    expect(screen.getByTestId("file-viz-total")).toHaveTextContent("0 pending");
  });

  test("PHOTOS mode: uses ByFile/by_file, default DONUT (PieChart innerRadius=65), renders breakdown rows", () => {
    const payload = {
      aggregations: {
        ByFile: [
          { key: "file-1", count: 2 },
          { key: "file-2", count: 1 },
        ],
      },
    };

    render(<FileActivityVisualization mode="PHOTOS" payload={payload} clauses={[]} />);

    expect(screen.getByTestId("file-viz-title")).toHaveTextContent(
      "Pending photos — grouped by file"
    );
    expect(screen.getByTestId("file-viz-total")).toHaveTextContent("3 pending");

    // Donut is default -> innerRadius should be 65
    const pie = screen.getByTestId("mock-pie-chart");
    expect(pie).toHaveAttribute("data-inner", "65");
    expect(pie).toHaveAttribute("data-items", "2");

    expect(screen.getByTestId("file-viz-breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("file-viz-row-label-0")).toHaveTextContent("file-1");
    expect(screen.getByTestId("file-viz-row-metric-0")).toHaveTextContent("2");
    expect(screen.getByTestId("file-viz-row-metric-0")).toHaveTextContent("%");

    expect(screen.getByTestId("file-viz-row-label-1")).toHaveTextContent("file-2");
    expect(screen.getByTestId("file-viz-row-metric-1")).toHaveTextContent("1");
  });

  test("CHANGES with file clause: title grouped by field + uses ByField list", () => {
    const payload = {
      aggregations: {
        ByField: [
          { key: "status", count: 4 },
          { key: "notes", count: 1 },
        ],
      },
    };

    render(
      <FileActivityVisualization
        mode="CHANGES"
        payload={payload}
        clauses={[{ field: "file_id", op: "=", value: 123 }]}
      />
    );

    expect(screen.getByTestId("file-viz-title")).toHaveTextContent(
      "Pending changes — grouped by field"
    );
    expect(screen.getByTestId("file-viz-total")).toHaveTextContent("5 pending");

    // group select should NOT render because allowedDimensions is 1 in this mode
    expect(screen.queryByTestId("file-viz-group-select")).not.toBeInTheDocument();

    expect(screen.getByTestId("file-viz-row-label-0")).toHaveTextContent("status");
    expect(screen.getByTestId("file-viz-row-label-1")).toHaveTextContent("notes");
  });

  test("switch chart type DONUT -> PIE sets innerRadius=0; PIE -> BAR renders BarChart", async () => {
    const user = userEvent.setup();

    const payload = {
      aggregations: {
        by_file: [
          { key: "A", count: 2 },
          { key: "B", count: 1 },
        ],
      },
    };

    render(<FileActivityVisualization mode="PHOTOS" payload={payload} clauses={[]} />);

    expect(screen.getByTestId("mock-pie-chart")).toHaveAttribute("data-inner", "65");

    await chooseOptionFromSelect(user, "file-viz-chart-select", "Pie");
    expect(screen.getByTestId("mock-pie-chart")).toHaveAttribute("data-inner", "0");

    await chooseOptionFromSelect(user, "file-viz-chart-select", "Bar");
    expect(screen.getByTestId("mock-bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("mock-bar-chart")).toHaveAttribute("data-labels", "2");
  });

  test("TOP_N: >10 items adds Others with summed remainder (and still charts)", () => {
    // 12 items: counts 12..1 (total 78)
    const list = Array.from({ length: 12 }).map((_, i) => ({
      key: `k${i + 1}`,
      count: 12 - i,
    }));

    const payload = { aggregations: { ByFile: list } };

    render(<FileActivityVisualization mode="PHOTOS" payload={payload} clauses={[]} />);

    // Top 10 + Others => 11 items
    const pie = screen.getByTestId("mock-pie-chart");
    expect(pie).toHaveAttribute("data-items", "11");

    // Others should be at index 10
    expect(screen.getByTestId("file-viz-row-label-10")).toHaveTextContent("Others");

    // Others sum = counts of last 2 items = 2 + 1 = 3
    // Metric format: "3 • X%"
    expect(screen.getByTestId("file-viz-row-metric-10")).toHaveTextContent("3");
    expect(screen.getByTestId("file-viz-row-metric-10")).toHaveTextContent("%");
  });

  test("label fallback: missing key/label becomes '(unknown)'", () => {
    const payload = {
      aggregations: {
        ByFile: [
          { count: 2 }, // missing key and label
          { key: "ok", count: 1 },
        ],
      },
    };

    render(<FileActivityVisualization mode="PHOTOS" payload={payload} clauses={[]} />);

    expect(screen.getByTestId("file-viz-row-label-0")).toHaveTextContent("(unknown)");
    expect(screen.getByTestId("file-viz-row-label-1")).toHaveTextContent("ok");
  });
});
