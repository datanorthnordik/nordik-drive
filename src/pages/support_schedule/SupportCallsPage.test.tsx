import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SupportCallsPage from "./SupportCallsPage";

const mockCalls = jest.fn();
const mockTeam = jest.fn();
const mockCalendar = jest.fn();
const mockStartZoomMeeting = jest.fn();

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) => selector({ auth: { user: { id: 2, role: "Admin" } } }),
}));

jest.mock("./api", () => ({
  supportScheduleApi: {
    calls: (...args: any[]) => mockCalls(...args),
    team: (...args: any[]) => mockTeam(...args),
    calendar: (...args: any[]) => mockCalendar(...args),
    startZoomMeeting: (...args: any[]) => mockStartZoomMeeting(...args),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

describe("SupportCallsPage Zoom controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalls.mockResolvedValue([{
      id: 12,
      support_request_id: 30,
      assigned_staff_id: 2,
      scheduled_start_time: "2026-08-14T14:00:00Z",
      scheduled_end_time: "2026-08-14T14:40:00Z",
      actual_duration_minutes: 0,
      status: "approved",
      internal_notes: "",
      zoom_meeting_id: "987654321",
      zoom_join_url: "https://zoom.test/j/987654321",
      zoom_passcode: "ZoomPass42",
      zoom_host_email: "alex@example.test",
      zoom_sync_status: "synced",
      assigned_staff: { id: 2, firstname: "Alex", lastname: "Support" },
    }]);
    mockTeam.mockResolvedValue([{ user_id: 2, firstname: "Alex", lastname: "Support" }]);
    mockCalendar.mockResolvedValue({ time_zone: "America/Toronto", duration_minutes: 30, days: [] });
    mockStartZoomMeeting.mockResolvedValue({ start_url: "https://zoom.test/s/987654321" });
  });

  test("only fetches the expiring host URL when the assigned host starts the meeting", async () => {
    const openedWindow = { location: { href: "" }, close: jest.fn(), opener: window } as unknown as Window;
    const openSpy = jest.spyOn(window, "open").mockReturnValue(openedWindow);
    const user = userEvent.setup();
    render(<SupportCallsPage embedded />);

    await user.click(await screen.findByRole("button", { name: "Start Zoom meeting" }));

    await waitFor(() => expect(mockStartZoomMeeting).toHaveBeenCalledWith(12));
    expect(openSpy).toHaveBeenCalledWith("about:blank", "_blank");
    expect(openedWindow.location.href).toBe("https://zoom.test/s/987654321");
    expect(screen.queryByRole("link", { name: "Join Zoom meeting" })).not.toBeInTheDocument();
    openSpy.mockRestore();
  });
});
