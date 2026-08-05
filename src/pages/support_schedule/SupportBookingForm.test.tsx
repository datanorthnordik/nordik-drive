import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SupportBookingForm from "./SupportBookingForm";

const mockSettings = jest.fn();
const mockTeam = jest.fn();
const mockAvailability = jest.fn();
const mockCreateRequest = jest.fn();
const mockSuccess = jest.fn();

jest.mock("./api", () => ({
  supportScheduleApi: {
    settings: (...args: any[]) => mockSettings(...args),
    team: (...args: any[]) => mockTeam(...args),
    availability: (...args: any[]) => mockAvailability(...args),
    createRequest: (...args: any[]) => mockCreateRequest(...args),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: (...args: any[]) => mockSuccess(...args), error: jest.fn() },
}));

describe("SupportBookingForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings.mockResolvedValue({ time_zone: "America/Toronto", workday_start: "08:30", workday_end: "16:30", allowed_durations: [30, 60], default_duration_minutes: 30, booking_horizon_days: 14 });
    mockTeam.mockResolvedValue([{ user_id: 7, firstname: "Alex", lastname: "Support" }]);
    mockAvailability.mockResolvedValue({ date: "2026-08-05", duration_minutes: 30, assigned_staff: { id: 7, firstname: "Alex", lastname: "Support" }, slots: [{ start_at: "2026-08-05T13:00:00Z", end_at: "2026-08-05T13:30:00Z" }] });
    mockCreateRequest.mockResolvedValue({ id: 11, status: "awaiting_assignee_approval" });
  });

  test("submits a specific-person request that awaits approval", async () => {
    const user = userEvent.setup();
    const onRequested = jest.fn();
    render(<SupportBookingForm onRequested={onRequested} />);

    expect(await screen.findByText(/request a support call/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/yes, request a specific person/i));
    await user.click(screen.getByLabelText(/^support person$/i));
    await user.click(await screen.findByRole("option", { name: /alex support/i }));
    await waitFor(() => expect(mockAvailability).toHaveBeenLastCalledWith(expect.any(String), 30, 7));
    await user.click(screen.getByRole("button", { name: /9:00/i }));
    await user.type(screen.getByLabelText(/support topic/i), "Review my request");
    await user.click(screen.getByRole("button", { name: /submit support request/i }));

    await waitFor(() => expect(mockCreateRequest).toHaveBeenCalledWith(expect.objectContaining({ duration_minutes: 30, requested_staff_id: 7, subject: "Review my request", scheduled_start: "2026-08-05T13:00:00Z" })));
    expect(mockSuccess).toHaveBeenCalledWith("Request sent. Your selected support person must approve it.");
    expect(onRequested).toHaveBeenCalledTimes(1);
  });
});
