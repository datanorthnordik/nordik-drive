import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import AdminActivitiesHub from "./ActivityLogs";

const mockUserActivity = jest.fn();
const mockAdminFileEditRequests = jest.fn();
const mockFormSubmissionLogs = jest.fn();

jest.mock("./UserActivity", () => ({
  __esModule: true,
  default: () => {
    mockUserActivity();
    return <div data-testid="user-activity">User Activity</div>;
  },
}));

jest.mock("./FileActivities", () => ({
  __esModule: true,
  default: (props: any) => {
    mockAdminFileEditRequests(props);
    return (
      <div data-testid="file-activities">
        File Activities
        <button onClick={() => props.onParentModeChange?.("GENERAL")}>go-general</button>
        <button onClick={() => props.onParentModeChange?.("FILE_MANAGEMENT")}>stay-file</button>
      </div>
    );
  },
}));

jest.mock("./FormSubmissionLogs", () => ({
  __esModule: true,
  default: () => {
    mockFormSubmissionLogs();
    return <div data-testid="form-submission-logs">Form Submission Logs</div>;
  },
}));

jest.mock("../../constants/colors", () => ({
  header_height: 80,
  header_mobile_height: 64,

  color_border: "#ddd",
  color_secondary_dark: "#123456",
  color_white: "#fff",
  color_white_smoke: "#f5f5f5",
  color_text_primary: "#111",
  color_text_secondary: "#555",
  color_text_light: "#777",
  color_background: "#fafafa",
  color_success: "#00aa00",
}));

describe("AdminActivitiesHub", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const openNavigation = async () => {
    fireEvent.click(screen.getByLabelText(/open navigation/i));
    const nav = await screen.findByText("NAVIGATION");
    expect(nav).toBeVisible();
  };

  const expectDrawerClosed = async () => {
    await waitFor(() => {
      expect(screen.getByText("NAVIGATION")).not.toBeVisible();
    });
  };

  it("renders GENERAL view by default", () => {
    render(<AdminActivitiesHub />);

    expect(screen.getByTestId("user-activity")).toBeInTheDocument();
    expect(screen.queryByTestId("file-activities")).not.toBeInTheDocument();
    expect(screen.queryByTestId("form-submission-logs")).not.toBeInTheDocument();

    expect(screen.getByLabelText(/open navigation/i)).toBeInTheDocument();
    expect(mockUserActivity).toHaveBeenCalled();
  });

  it("opens navigation drawer when clicking open navigation button", async () => {
    render(<AdminActivitiesHub />);

    await openNavigation();

    expect(screen.getByText("General logs")).toBeInTheDocument();
    expect(screen.getByText("File management logs")).toBeInTheDocument();
    expect(screen.getByText("Form submission logs")).toBeInTheDocument();
  });

  it("closes navigation drawer when clicking close navigation button", async () => {
    render(<AdminActivitiesHub />);

    await openNavigation();

    fireEvent.click(screen.getByLabelText(/close navigation/i));
    await expectDrawerClosed();
  });

  it("switches to FILE_MANAGEMENT view from navigation and closes drawer", async () => {
    render(<AdminActivitiesHub />);

    await openNavigation();
    fireEvent.click(screen.getByText("File management logs"));

    await waitFor(() => {
      expect(screen.getByTestId("file-activities")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("user-activity")).not.toBeInTheDocument();
    expect(screen.queryByTestId("form-submission-logs")).not.toBeInTheDocument();

    await expectDrawerClosed();
  });

  it("switches to FORM_SUBMISSION view from navigation and closes drawer", async () => {
    render(<AdminActivitiesHub />);

    await openNavigation();
    fireEvent.click(screen.getByText("Form submission logs"));

    await waitFor(() => {
      expect(screen.getByTestId("form-submission-logs")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("user-activity")).not.toBeInTheDocument();
    expect(screen.queryByTestId("file-activities")).not.toBeInTheDocument();

    await expectDrawerClosed();
  });

  it("switches back to GENERAL view from navigation", async () => {
    render(<AdminActivitiesHub />);

    await openNavigation();
    fireEvent.click(screen.getByText("File management logs"));

    await waitFor(() => {
      expect(screen.getByTestId("file-activities")).toBeInTheDocument();
    });

    await openNavigation();
    fireEvent.click(screen.getByText("General logs"));

    await waitFor(() => {
      expect(screen.getByTestId("user-activity")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("file-activities")).not.toBeInTheDocument();
    expect(screen.queryByTestId("form-submission-logs")).not.toBeInTheDocument();
  });

  it("passes onParentModeChange to AdminFileEditRequests and can switch back to GENERAL", async () => {
    render(<AdminActivitiesHub />);

    await openNavigation();
    fireEvent.click(screen.getByText("File management logs"));

    await waitFor(() => {
      expect(screen.getByTestId("file-activities")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-general"));

    await waitFor(() => {
      expect(screen.getByTestId("user-activity")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("file-activities")).not.toBeInTheDocument();
  });

  it("keeps FILE_MANAGEMENT view when onParentModeChange sends FILE_MANAGEMENT", async () => {
    render(<AdminActivitiesHub />);

    await openNavigation();
    fireEvent.click(screen.getByText("File management logs"));

    await waitFor(() => {
      expect(screen.getByTestId("file-activities")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("stay-file"));

    expect(screen.getByTestId("file-activities")).toBeInTheDocument();
    expect(screen.queryByTestId("user-activity")).not.toBeInTheDocument();
  });

  it("renders correctly after switching to mobile width", async () => {
    render(<AdminActivitiesHub />);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 700,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByLabelText(/open navigation/i)).toBeInTheDocument();

    await openNavigation();

    expect(screen.getByText("General logs")).toBeInTheDocument();
    expect(screen.getByText("File management logs")).toBeInTheDocument();
    expect(screen.getByText("Form submission logs")).toBeInTheDocument();
  });

  it("marks the selected item when the drawer is opened", async () => {
    render(<AdminActivitiesHub />);

    await openNavigation();

    const generalItem = screen.getByText("General logs").closest(".MuiListItemButton-root");
    expect(generalItem).toHaveClass("Mui-selected");

    fireEvent.click(screen.getByText("Form submission logs"));

    await waitFor(() => {
      expect(screen.getByTestId("form-submission-logs")).toBeInTheDocument();
    });

    await openNavigation();

    const formItem = screen.getByText("Form submission logs").closest(".MuiListItemButton-root");
    expect(formItem).toHaveClass("Mui-selected");
  });
});