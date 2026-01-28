import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import AdminTabs from "./AdminTabs";
import { useSelector } from "react-redux";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("../Tabs", () => {
  const React = require("react");

  function AdminTabWrapper(props: any) {
    const childrenArray = React.Children.toArray(props.children).filter(React.isValidElement);

    return (
      <div aria-label={props["aria-label"]} data-testid="admin-tab-wrapper">
        {childrenArray.map((child: any, idx: number) =>
          React.cloneElement(child, {
            __tabIndex: idx,
            __onChange: props.onChange,
          })
        )}
      </div>
    );
  }

  function AdminTab(props: any) {
    const { label, __tabIndex, __onChange } = props;
    return (
      <button
        type="button"
        aria-label={props["aria-label"] || label}
        onClick={(e) => __onChange?.(e, __tabIndex)}
      >
        {label}
      </button>
    );
  }

  return { AdminTabWrapper, AdminTab };
});

describe("AdminTabs", () => {
  const mockedUseSelector = useSelector as unknown as jest.Mock;

  test("always renders Files tab", () => {
    mockedUseSelector.mockImplementation((fn: any) => fn({ auth: { user: { role: "User" } } }));

    render(<AdminTabs value={0} handleChange={jest.fn()} />);

    expect(screen.getByText("Files")).toBeInTheDocument();
  });

  test("does NOT render User Activity tab when user is not Admin", () => {
    mockedUseSelector.mockImplementation((fn: any) => fn({ auth: { user: { role: "User" } } }));

    render(<AdminTabs value={0} handleChange={jest.fn()} />);

    expect(screen.queryByText("User Activity")).not.toBeInTheDocument();
  });

  test("renders User Activity tab when user is Admin", () => {
    mockedUseSelector.mockImplementation((fn: any) => fn({ auth: { user: { role: "Admin" } } }));

    render(<AdminTabs value={0} handleChange={jest.fn()} />);

    expect(screen.getByText("User Activity")).toBeInTheDocument();
  });

  test("clicking tabs calls handleChange with correct newValue index", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    mockedUseSelector.mockImplementation((fn: any) => fn({ auth: { user: { role: "Admin" } } }));

    render(<AdminTabs value={0} handleChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "files" }));
    expect(handleChange).toHaveBeenCalledWith(expect.any(Object), 0);

    await user.click(screen.getByRole("button", { name: "User Activity" }));
    expect(handleChange).toHaveBeenCalledWith(expect.any(Object), 1);
  });

  test("renders wrapper with aria-label", () => {
    mockedUseSelector.mockImplementation((fn: any) => fn({ auth: { user: { role: "Admin" } } }));

    render(<AdminTabs value={0} handleChange={jest.fn()} />);

    expect(screen.getByTestId("admin-tab-wrapper")).toHaveAttribute(
      "aria-label",
      "icon tabs example"
    );
  });
});
