import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AdminSupportRequests from "./AdminSupportRequests";
import MySupportRequests from "./MySupportRequests";
import { apiRequest } from "../../hooks/useFetch";

jest.mock("../../hooks/useFetch", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("../contact_us/SupportRequestCard", () => ({
  __esModule: true,
  default: ({ onSubmitted }: { onSubmitted?: () => void }) => (
    <button onClick={onSubmitted}>Submit mocked support request</button>
  ),
}));

const apiRequestMock = apiRequest as jest.Mock;

const request = {
  id: 42,
  requester_name: "Alex User",
  requester_email: "alex@example.com",
  request_type: "technical_issue" as const,
  subject: "Search results are blank",
  message: "The search page stays blank after I select a year.",
  screenshot_file_name: "search.png",
  screenshot_url: "https://example.com/search.png",
  status: "open" as const,
  assigned_team: "",
  assigned_team_recipients: "",
  admin_note: "",
  created_at: "2026-07-21T15:00:00Z",
  updated_at: "2026-07-21T15:00:00Z",
};

const response = { page: 1, page_size: 100, total_items: 1, total_pages: 1, items: [request] };

describe("Support request views", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue(response);
  });

  it("shows the user request history and opens the new-request dialog", async () => {
    render(<MySupportRequests />);

    expect(await screen.findByText("Search results are blank")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /new support request/i }));
    expect(screen.getByText("New Support Request")).toBeInTheDocument();
    expect(screen.getByText("Submit mocked support request")).toBeInTheDocument();
  });

  it("lets an admin open a request for team forwarding", async () => {
    render(<AdminSupportRequests />);

    expect(await screen.findByText("Alex User · alex@example.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));

    expect(screen.getByText("Manage Support Request #42")).toBeInTheDocument();
    expect(screen.getByLabelText("Team name")).toBeInTheDocument();
    expect(screen.getByLabelText("Team email recipients")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Request status" }));
    fireEvent.click(screen.getByRole("option", { name: "In Progress" }));
    fireEvent.change(screen.getByLabelText("Team name"), { target: { value: "Platform" } });
    fireEvent.change(screen.getByLabelText("Team email recipients"), {
      target: { value: "platform@example.com" },
    });

    apiRequestMock.mockResolvedValueOnce({
      ...request,
      status: "in_progress",
      assigned_team: "Platform",
      assigned_team_recipients: "platform@example.com",
    });
    fireEvent.click(screen.getByRole("button", { name: /forward & notify/i }));

    await waitFor(() => expect(apiRequestMock).toHaveBeenLastCalledWith(
      expect.stringContaining("support-requests/42"),
      "PUT",
      expect.objectContaining({ status: "in_progress", assigned_team: "Platform" })
    ));
  });
});
