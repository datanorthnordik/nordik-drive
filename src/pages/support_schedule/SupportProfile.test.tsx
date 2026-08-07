import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SupportProfile from "./SupportProfile";

const mockProfile = jest.fn();
const mockError = jest.fn();

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) => selector({ auth: { user: { id: 2, role: "Admin" } } }),
}));

jest.mock("react-router-dom", () => ({ Link: "a" }), { virtual: true });

jest.mock("./api", () => ({
  supportScheduleApi: { profile: (...args: any[]) => mockProfile(...args) },
}));

jest.mock("react-hot-toast", () => ({ __esModule: true, default: { success: jest.fn(), error: (...args: any[]) => mockError(...args) } }));

describe("SupportProfile", () => {
  beforeEach(() => {
    mockProfile.mockResolvedValue({ assignments: [], upcoming_calls: [], direct_requests: [], availability: [] });
  });

  test("keeps availability management in the support-admin Profile", async () => {
    render(<SupportProfile />);

    expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText(/^availability$/i)).toBeInTheDocument();
    expect(screen.getByText(/unavailable all day/i)).toBeInTheDocument();
    await waitFor(() => expect(mockProfile).toHaveBeenCalledTimes(1));
  });

  test("does not allow a weekend availability date", async () => {
    const { container } = render(<SupportProfile />);

    await screen.findByText(/^availability$/i);
    const date = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(date).toBeInTheDocument();
    const originalDate = (date as HTMLInputElement).value;
    fireEvent.change(date, { target: { value: "2026-08-08" } });

    expect((date as HTMLInputElement).value).toBe(originalDate);
    expect(mockError).toHaveBeenCalledWith("Support availability can be updated Monday through Friday only.");
  });
});
