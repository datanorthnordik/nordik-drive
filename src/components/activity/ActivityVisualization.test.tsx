import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivityVisualization from "./ActivityVisualization";

// ✅ Mock MUI X Charts to avoid SVG/ResizeObserver quirks in jsdom
jest.mock("@mui/x-charts/PieChart", () => ({
  PieChart: () => <div data-testid="mock-pie-chart" />,
}));

jest.mock("@mui/x-charts/BarChart", () => ({
  BarChart: () => <div data-testid="mock-bar-chart" />,
}));

function makeLogData({
  byCommunity = [],
  byFilename = [],
  byPerson = [],
}: {
  byCommunity?: { label: string; count: number }[];
  byFilename?: { label: string; count: number }[];
  byPerson?: { label: string; count: number }[];
}) {
  return {
    aggregates: {
      by_community: byCommunity,
      by_filename: byFilename,
      by_person: byPerson,
    },
  };
}

/**
 * MUI Select opens via the inner element that has role="combobox",
 * not by clicking the root wrapper div that we tagged with data-testid.
 */
async function openMuiSelect(
  user: ReturnType<typeof userEvent.setup>,
  selectTestId: string
) {
  const root = screen.getByTestId(selectTestId);
  const combo = within(root).getByRole("combobox");
  await user.click(combo);
  return await screen.findByRole("listbox"); // MUI menu portal
}

async function chooseMuiSelectOption(
  user: ReturnType<typeof userEvent.setup>,
  selectTestId: string,
  optionText: string
) {
  const listbox = await openMuiSelect(user, selectTestId);
  await user.click(within(listbox).getByText(optionText));
}

/**
 * Finds the index i such that activity-viz-row-label-i has the given label text.
 * We do this to avoid relying on sort stability.
 */
function findRowIndexByLabel(target: string): number {
  // Your TOP_N max is 10, so worst case is top 10 + Others => 11 items (0..10).
  // But we search a bit more safely.
  for (let i = 0; i < 50; i++) {
    const el = screen.queryByTestId(`activity-viz-row-label-${i}`);
    if (!el) continue;
    if ((el.textContent || "").trim() === target) return i;
  }
  throw new Error(`Could not find row label "${target}"`);
}

describe("ActivityVisualization", () => {
  test("shows empty state when no aggregates are present", () => {
    render(<ActivityVisualization logData={{}} selectedCommunity="" selectedAction="" />);

    expect(screen.getByTestId("activity-viz-empty")).toHaveTextContent("No data to visualize.");
    expect(screen.queryByTestId("mock-pie-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-bar-chart")).not.toBeInTheDocument();
  });

  test("renders title, total events, and breakdown for COMMUNITY dimension by default (no selectedCommunity)", () => {
    const logData = makeLogData({
      byCommunity: [
        { label: "A", count: 5 },
        { label: "B", count: 3 },
      ],
    });

    render(<ActivityVisualization logData={logData} selectedCommunity="" selectedAction="VIEW" />);

    expect(screen.getByTestId("activity-viz-title")).toHaveTextContent(
      'VIEW activity (overall) — contribution by Community'
    );

    expect(screen.getByTestId("activity-viz-total")).toHaveTextContent("8 events");

    // Default vizType = DONUT => PieChart is used
    expect(screen.getByTestId("mock-pie-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-bar-chart")).not.toBeInTheDocument();

    // Breakdown rows
    expect(screen.getByTestId("activity-viz-breakdown")).toBeInTheDocument();

    // Sort desc, so A then B
    expect(screen.getByTestId("activity-viz-row-label-0")).toHaveTextContent("A");
    expect(screen.getByTestId("activity-viz-row-count-0")).toHaveTextContent("5");
    expect(screen.getByTestId("activity-viz-row-pct-0")).toHaveTextContent("63%"); // 5/8=62.5 => 63

    expect(screen.getByTestId("activity-viz-row-label-1")).toHaveTextContent("B");
    expect(screen.getByTestId("activity-viz-row-count-1")).toHaveTextContent("3");
    expect(screen.getByTestId("activity-viz-row-pct-1")).toHaveTextContent("38%"); // 3/8=37.5 => 38
  });

  test('when selectedCommunity is set, Group-by options exclude "Community" and title uses within "<community>"', async () => {
    const user = userEvent.setup();

    const logData = makeLogData({
      byPerson: [
        { label: "John", count: 2 },
        { label: "Jane", count: 1 },
      ],
      byFilename: [{ label: "file1.pdf", count: 3 }],
      byCommunity: [{ label: "ShouldNotAppear", count: 99 }],
    });

    render(
      <ActivityVisualization
        logData={logData}
        selectedCommunity="Batchewana"
        selectedAction="DOWNLOAD"
      />
    );

    expect(screen.getByTestId("activity-viz-title")).toHaveTextContent(
      'DOWNLOAD activity (within "Batchewana") — contribution by Person'
    );

    const listbox = await openMuiSelect(user, "activity-viz-dimension-select");

    expect(within(listbox).queryByText("Community")).not.toBeInTheDocument();
    expect(within(listbox).getByText("Person")).toBeInTheDocument();
    expect(within(listbox).getByText("Filename")).toBeInTheDocument();
  });

  test("switching chart type from DONUT to BAR renders BarChart", async () => {
    const user = userEvent.setup();

    const logData = makeLogData({
      byCommunity: [
        { label: "A", count: 1 },
        { label: "B", count: 2 },
      ],
    });

    render(<ActivityVisualization logData={logData} selectedCommunity="" selectedAction="" />);

    expect(screen.getByTestId("mock-pie-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-bar-chart")).not.toBeInTheDocument();

    await chooseMuiSelectOption(user, "activity-viz-chart-select", "Bar");

    expect(screen.getByTestId("mock-bar-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-pie-chart")).not.toBeInTheDocument();
  });

  test("TOP_N behavior: if more than 10 items in Filename, it adds Others with summed remainder", async () => {
    const user = userEvent.setup();

    const byFilename = Array.from({ length: 12 }, (_, i) => ({
      label: `file-${i + 1}`,
      count: 1,
    }));

    const logData = makeLogData({ byFilename });

    render(<ActivityVisualization logData={logData} selectedCommunity="" selectedAction="EDIT" />);

    // Default dimension is Community => no data => shows empty.
    expect(screen.getByTestId("activity-viz-empty")).toBeInTheDocument();

    // Switch to Filename
    await chooseMuiSelectOption(user, "activity-viz-dimension-select", "Filename");

    // Now we should have data
    expect(screen.getByTestId("activity-viz-total")).toHaveTextContent("12 events");
    expect(screen.queryByTestId("activity-viz-empty")).not.toBeInTheDocument();

    // Find which row is "Others" and assert its count via its chip testid
    const othersIndex = findRowIndexByLabel("Others");

    expect(screen.getByTestId(`activity-viz-row-count-${othersIndex}`)).toHaveTextContent("2");
  });

  test("if dimension becomes invalid after selectedCommunity changes, it auto-resets to first allowed dimension", async () => {
    const logData = makeLogData({
      byCommunity: [{ label: "C1", count: 2 }],
      byPerson: [{ label: "P1", count: 2 }],
      byFilename: [{ label: "F1", count: 2 }],
    });

    const { rerender } = render(
      <ActivityVisualization logData={logData} selectedCommunity="" selectedAction="VIEW" />
    );

    expect(screen.getByTestId("activity-viz-title")).toHaveTextContent(
      "VIEW activity (overall) — contribution by Community"
    );

    rerender(<ActivityVisualization logData={logData} selectedCommunity="X" selectedAction="VIEW" />);

    await waitFor(() => {
      expect(screen.getByTestId("activity-viz-title")).toHaveTextContent(
        'VIEW activity (within "X") — contribution by Person'
      );
    });
  });
});
