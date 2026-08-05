import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SupportProfile from "./SupportProfile";

const mockProfile = jest.fn();

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) => selector({ auth: { user: { id: 2, role: "Admin" } } }),
}));

jest.mock("react-router-dom", () => ({ Link: "a" }), { virtual: true });

jest.mock("./api", () => ({
  supportScheduleApi: { profile: (...args: any[]) => mockProfile(...args) },
}));

jest.mock("react-hot-toast", () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

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
});
