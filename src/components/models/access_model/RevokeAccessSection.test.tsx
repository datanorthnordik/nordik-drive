import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RevokeAccessSection from "./RevokeAccessSection";

// jest.mock hoisting-safe
const mockTextField = jest.fn();
const mockIconButton = jest.fn();

jest.mock("@mui/material", () => {
  const React = require("react");

  const Box = ({ children }: any) => <div data-testid="mui-box">{children}</div>;
  const Stack = ({ children }: any) => <div data-testid="mui-stack">{children}</div>;
  const Typography = ({ children }: any) => (
    <div data-testid="mui-typography">{children}</div>
  );

  const InputAdornment = ({ children }: any) => (
    <span data-testid="mui-input-adornment">{children}</span>
  );

  // IMPORTANT: render InputProps.startAdornment so SearchIcon is in DOM
  const TextField = (props: any) => {
    mockTextField(props);
    return (
      <div data-testid="textfield">
        {props?.InputProps?.startAdornment ? (
          <div data-testid="start-adornment">{props.InputProps.startAdornment}</div>
        ) : null}
        <input
          data-testid="search-input"
          placeholder={props.placeholder}
          value={props.value ?? ""}
          onChange={props.onChange}
        />
      </div>
    );
  };

  const IconButton = ({ children, onClick }: any) => {
    mockIconButton({ children, onClick });
    return (
      <button type="button" data-testid="icon-button" onClick={onClick}>
        {children}
      </button>
    );
  };

  const Table = ({ children }: any) => <table data-testid="table">{children}</table>;
  const TableHead = ({ children }: any) => <thead data-testid="thead">{children}</thead>;
  const TableBody = ({ children }: any) => <tbody data-testid="tbody">{children}</tbody>;
  const TableRow = ({ children }: any) => <tr data-testid="tr">{children}</tr>;
  const TableCell = ({ children, colSpan, align }: any) => (
    <td data-testid="td" data-colspan={colSpan ?? ""} data-align={align ?? ""}>
      {children}
    </td>
  );

  return {
    __esModule: true,
    Box,
    IconButton,
    InputAdornment,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
  };
});

describe("RevokeAccessSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders title + table headers and shows empty state when filteredAccesses is empty (SearchIcon present)", () => {
    render(
      <RevokeAccessSection
        searchQuery=""
        setSearchQuery={jest.fn()}
        filteredAccesses={[]}
        openRevokeModalFn={jest.fn()}
      />
    );

    expect(screen.getByText("REVOKE ACCESS")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();

    expect(screen.getByText("No matching users")).toBeInTheDocument();
    const emptyCell = screen.getByText("No matching users").closest("td")!;
    expect(emptyCell).toHaveAttribute("data-colspan", "2");

    // Icons from @mui/icons-material expose stable testids
    expect(screen.getAllByTestId("DeleteIcon").length).toBeGreaterThan(0);
    expect(screen.getByTestId("SearchIcon")).toBeInTheDocument();

    // Covers that TextField received InputProps.startAdornment
    const tfProps = (mockTextField as jest.Mock).mock.calls[0][0];
    expect(tfProps.InputProps).toBeTruthy();
    expect(tfProps.InputProps.startAdornment).toBeTruthy();
  });

  test("changing search input calls setSearchQuery with full value", () => {
    const setSearchQuery = jest.fn();

    render(
      <RevokeAccessSection
        searchQuery=""
        setSearchQuery={setSearchQuery}
        filteredAccesses={[]}
        openRevokeModalFn={jest.fn()}
      />
    );

    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "john" } });

    expect(setSearchQuery).toHaveBeenCalledTimes(1);
    expect(setSearchQuery).toHaveBeenCalledWith("john");
  });

  test("renders rows and clicking revoke calls openRevokeModalFn with correct id", async () => {
    const openRevokeModalFn = jest.fn();
    const user = userEvent.setup();

    render(
      <RevokeAccessSection
        searchQuery=""
        setSearchQuery={jest.fn()}
        filteredAccesses={[
          { id: 10, firstname: "John", lastname: "Doe" },
          { id: 20, firstname: "Alice", lastname: "Smith" },
        ]}
        openRevokeModalFn={openRevokeModalFn}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("No matching users")).not.toBeInTheDocument();

    const buttons = screen.getAllByTestId("icon-button");
    expect(buttons.length).toBe(2);

    await user.click(buttons[0]);
    expect(openRevokeModalFn).toHaveBeenCalledWith(10);

    await user.click(buttons[1]);
    expect(openRevokeModalFn).toHaveBeenCalledWith(20);

    // extra coverage: ensure IconButton got a function
    const calls = (mockIconButton as jest.Mock).mock.calls;
    const lastArgs = calls[calls.length - 1][0];
    expect(typeof lastArgs.onClick).toBe("function");
  });
});
