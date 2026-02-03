// src/components/tables/ActivityLogs.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminActivitiesHub from "./ActivityLogs";

// Mock child components so tests are stable and focus on AdminActivitiesHub behavior.
jest.mock("./UserActivity", () => ({
  __esModule: true,
  default: (props: { mode: string; onModeChange: (m: any) => void }) => (
    <div data-testid="user-activity">
      <div data-testid="ua-mode">{props.mode}</div>
      {/* NOTE: Accessible name is "UA>FILE" (not "UA->FILE") */}
      <button onClick={() => props.onModeChange("FILE_MANAGEMENT")}>UA&gt;FILE</button>
    </div>
  ),
}));

jest.mock("./FileActivities", () => ({
  __esModule: true,
  default: (props: { onParentModeChange: (m: any) => void }) => (
    <div data-testid="file-activities">
      <button onClick={() => props.onParentModeChange("GENERAL")}>FILE&gt;UA</button>
    </div>
  ),
}));

describe("AdminActivitiesHub", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders UserActivity by default with mode GENERAL", () => {
    render(<AdminActivitiesHub />);

    expect(screen.getByTestId("user-activity")).toBeInTheDocument();
    expect(screen.getByTestId("ua-mode")).toHaveTextContent("GENERAL");
    expect(screen.queryByTestId("file-activities")).not.toBeInTheDocument();
  });

  test("switches to FILE_MANAGEMENT when UserActivity calls onModeChange", async () => {
    const user = userEvent.setup();
    render(<AdminActivitiesHub />);

    await user.click(screen.getByRole("button", { name: "UA>FILE" }));

    expect(screen.getByTestId("file-activities")).toBeInTheDocument();
    expect(screen.queryByTestId("user-activity")).not.toBeInTheDocument();
  });

  test("can switch back to GENERAL when FileActivities calls onParentModeChange", async () => {
    const user = userEvent.setup();
    render(<AdminActivitiesHub />);

    // go to FILE_MANAGEMENT
    await user.click(screen.getByRole("button", { name: "UA>FILE" }));
    expect(screen.getByTestId("file-activities")).toBeInTheDocument();

    // go back to GENERAL
    await user.click(screen.getByRole("button", { name: "FILE>UA" }));
    expect(screen.getByTestId("user-activity")).toBeInTheDocument();
    expect(screen.getByTestId("ua-mode")).toHaveTextContent("GENERAL");
  });

  test("registers and cleans up resize listener", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = render(<AdminActivitiesHub />);

    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
