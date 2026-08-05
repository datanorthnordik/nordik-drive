import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SupportProfile from "./SupportProfile";

const mockCalls = jest.fn();
const mockSchedule = jest.fn();
const mockTeam = jest.fn();
const mockMaintenance = jest.fn();
const mockToastError = jest.fn();

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) => selector({ auth: { user: { id: 1, role: "Manager" } } }),
}));

jest.mock("./SupportBookingForm", () => ({ __esModule: true, default: () => <div>Support booking form</div> }));

jest.mock("./api", () => ({
  supportScheduleApi: {
    calls: (...args: any[]) => mockCalls(...args),
    schedule: (...args: any[]) => mockSchedule(...args),
    team: (...args: any[]) => mockTeam(...args),
    runMaintenance: (...args: any[]) => mockMaintenance(...args),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: (...args: any[]) => mockToastError(...args) },
}));

describe("SupportProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalls.mockResolvedValue([{ id: 4, created_by_id: 3, assigned_user_id: 7, schedule_date: "2026-08-05", scheduled_start: "2026-08-05T13:00:00Z", scheduled_end: "2026-08-05T13:30:00Z", duration_minutes: 30, status: "scheduled", subject: "Review request", message: "", meeting_status: "pending_provider", actual_minutes: 0, assigned_user: { id: 7, firstname: "Alex", lastname: "Support" } }]);
    mockSchedule.mockResolvedValue([{ id: 8, schedule_date: "2026-08-05", status: "scheduled", reason: "", assigned_user_id: 7, assigned_user: { id: 7, firstname: "Alex", lastname: "Support" } }]);
    mockTeam.mockResolvedValue([{ user_id: 7, firstname: "Alex", lastname: "Support" }]);
    mockMaintenance.mockResolvedValue(undefined);
  });

  test("shows manager scheduling controls and runs an immediate schedule check", async () => {
    const user = userEvent.setup();
    render(<SupportProfile />);

    expect(await screen.findByText(/two-week support rota/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whole support team is unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change person/i })).toBeInTheDocument();
    expect(mockCalls).toHaveBeenCalledWith("manage");

    await user.click(screen.getByRole("button", { name: /check schedule/i }));
    await waitFor(() => expect(mockMaintenance).toHaveBeenCalledTimes(1));
  });
});
