import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SupportRequestsPage from "./SupportRequestsPage";

const mockRequests = jest.fn();
const mockDecideRequest = jest.fn();

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) => selector({ auth: { user: { id: 2, role: "Admin" } } }),
}));

jest.mock("./api", () => ({
  supportScheduleApi: {
    requests: (...args: any[]) => mockRequests(...args),
    decideRequest: (...args: any[]) => mockDecideRequest(...args),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const assignedRequest = {
  id: 41,
  requested_by_user_id: 9,
  request_type: "automatic_daily_assignee",
  requested_date: "2026-08-14",
  preferred_start_time: "2026-08-14T14:00:00Z",
  assigned_staff_id: 2,
  status: "approved",
  subject: "Help reviewing a community record",
  description: "Please check the submitted family details.",
  rejection_reason: "",
  created_at: "2026-08-13T12:00:00Z",
  requested_by: { id: 9, firstname: "Jamie", lastname: "User", email: "jamie@example.test" },
  assigned_staff: { id: 2, firstname: "Alex", lastname: "Support", email: "alex@example.test" },
  call: {
    id: 71,
    support_request_id: 41,
    assigned_staff_id: 2,
    scheduled_start_time: "2026-08-14T14:00:00Z",
    scheduled_end_time: "2026-08-14T14:40:00Z",
    actual_duration_minutes: 0,
    status: "approved",
    internal_notes: "",
    zoom_join_url: "https://zoom.test/j/71",
    zoom_passcode: "ZoomPass",
    zoom_sync_status: "synced",
  },
};

const approvalRequest = {
  ...assignedRequest,
  id: 42,
  request_type: "specific_support_person",
  status: "awaiting_assignee_approval",
  subject: "Help outside the assigned support day",
  description: "I selected Alex because Alex knows this record.",
  call: { ...assignedRequest.call, id: 72, support_request_id: 42, status: "awaiting_assignee_approval", zoom_join_url: undefined, zoom_passcode: undefined, zoom_sync_status: "not_requested" },
};

describe("SupportRequestsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequests.mockResolvedValue([assignedRequest, approvalRequest]);
    mockDecideRequest.mockResolvedValue({ ...approvalRequest, status: "approved" });
  });

  test("shows assigned requests in a table without the scheduling calendar", async () => {
    const user = userEvent.setup();
    render(<SupportRequestsPage embedded />);

    expect(await screen.findByRole("table", { name: "Support-call requests" })).toBeInTheDocument();
    expect(mockRequests).toHaveBeenCalledWith("staff");
    expect(screen.queryByText(/support coverage calendar/i)).not.toBeInTheDocument();

    const row = screen.getByText("Help outside the assigned support day").closest("tr");
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLTableRowElement).getByRole("button", { name: "View details" }));

    expect(await screen.findByText("I selected Alex because Alex knows this record.")).toBeInTheDocument();
    expect(screen.getByText(/approval is required/i)).toBeInTheDocument();
    expect(screen.getAllByText(/jamie@example.test/i).length).toBeGreaterThan(0);
  });

  test("offers approval only for an off-day selected-person request", async () => {
    const user = userEvent.setup();
    render(<SupportRequestsPage embedded />);

    const reviewButtons = await screen.findAllByRole("button", { name: "Review" });
    expect(reviewButtons).toHaveLength(1);
    await user.click(reviewButtons[0]);
    await user.click(screen.getByRole("button", { name: "Save decision" }));

    await waitFor(() => expect(mockDecideRequest).toHaveBeenCalledWith(42, expect.objectContaining({ decision: "approve" })));
  });
});
