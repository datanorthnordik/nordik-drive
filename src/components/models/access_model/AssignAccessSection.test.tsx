import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssignAccessSection from "./AssignAccessSection";
import type { User } from "./types";

// jest.mock hoisting-safe
const mockAutocomplete = jest.fn();
const mockChip = jest.fn();

jest.mock("@mui/material", () => {
  const React = require("react");

  const Box = ({ children }: any) => <div data-testid="mui-box">{children}</div>;
  const Stack = ({ children }: any) => <div data-testid="mui-stack">{children}</div>;
  const Typography = ({ children }: any) => (
    <div data-testid="mui-typography">{children}</div>
  );

  const Button = ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );

  const TextField = (props: any) => (
    <input data-testid="search-input" placeholder={props.placeholder} />
  );

  const Checkbox = ({ checked }: any) => (
    <input data-testid="checkbox" type="checkbox" readOnly checked={!!checked} />
  );

  const Chip = (props: any) => {
    mockChip(props);
    return <span data-testid={props["data-testid"] ?? "chip"}>{props.label}</span>;
  };

  // Deterministic Autocomplete mock:
  // - calls renderInput, renderTags, renderOption
  // - exposes buttons to trigger onChange
  const Autocomplete = (props: any) => {
    mockAutocomplete(props);

    const getTagProps = ({ index }: any) => ({ "data-testid": `chip-${index}` });

    const renderedInput = props.renderInput ? props.renderInput({} as any) : null;

    const renderedTags = props.renderTags
      ? props.renderTags(props.value ?? [], getTagProps)
      : null;

    const opt0 = (props.options ?? [])[0];
    const renderedOption = opt0
      ? props.renderOption(
          { "data-testid": "render-option-0" },
          opt0,
          {
            selected: !!(props.value ?? []).some((v: any) => v.id === opt0.id),
          }
        )
      : null;

    return (
      <div data-testid="autocomplete">
        <div data-testid="input">{renderedInput}</div>
        <div data-testid="tags">{renderedTags}</div>
        <div data-testid="option">{renderedOption}</div>

        <button
          type="button"
          data-testid="select-first"
          onClick={() => props.onChange(null, [opt0])}
        >
          select-first
        </button>

        <button
          type="button"
          data-testid="select-both"
          onClick={() => props.onChange(null, props.options)}
        >
          select-both
        </button>
      </div>
    );
  };

  return {
    __esModule: true,
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    Stack,
    TextField,
    Typography,
  };
});

//  Use your REAL type and match it exactly (phonenumber must be string if your types.ts says so)
const USERS: User[] = [
  {
    id: 1,
    firstname: "John",
    lastname: "Doe",
    email: "john@ex.com",
    phonenumber: "9999",
  } as User,
  {
    id: 2,
    firstname: "Jane",
    lastname: "Roe",
    email: "jane@ex.com",
    phonenumber: "1234", // must exist + must be string
  } as User,
];

describe("AssignAccessSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders section headings, Autocomplete input placeholder, and clicking Assign Access calls openAssignModal", async () => {
    const openAssignModal = jest.fn();
    const user = userEvent.setup();

    render(
      <AssignAccessSection
        users={USERS}
        selectedUsers={[]}
        setSelectedUsers={jest.fn()}
        openAssignModal={openAssignModal}
        loading={false}
      />
    );

    expect(screen.getByText("ASSIGN ACCESS")).toBeInTheDocument();
    expect(screen.getByText("Search Users")).toBeInTheDocument();

    expect(screen.getByTestId("search-input")).toHaveAttribute(
      "placeholder",
      "Type name, email, or phone"
    );

    await user.click(screen.getByRole("button", { name: "Assign Access" }));
    expect(openAssignModal).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("PersonSearchOutlinedIcon")).toBeInTheDocument();
  });

  test("renderTags renders chips for selected users (no duplicate-text failure)", () => {
    render(
      <AssignAccessSection
        users={USERS}
        selectedUsers={[USERS[0], USERS[1]]}
        setSelectedUsers={jest.fn()}
        openAssignModal={jest.fn()}
        loading={false}
      />
    );

    const tags = screen.getByTestId("tags");

    // Scoped query avoids conflict with option text "John Doe"
    expect(within(tags).getByText("John Doe")).toBeInTheDocument();
    expect(within(tags).getByText("Jane Roe")).toBeInTheDocument();

    expect(mockChip).toHaveBeenCalled();
  });

  test("selecting options triggers setSelectedUsers via Autocomplete onChange", async () => {
    const setSelectedUsers = jest.fn();
    const user = userEvent.setup();

    render(
      <AssignAccessSection
        users={USERS}
        selectedUsers={[]}
        setSelectedUsers={setSelectedUsers}
        openAssignModal={jest.fn()}
        loading={false}
      />
    );

    await user.click(screen.getByTestId("select-both"));
    expect(setSelectedUsers).toHaveBeenCalledWith(USERS);

    await user.click(screen.getByTestId("select-first"));
    expect(setSelectedUsers).toHaveBeenCalledWith([USERS[0]]);
  });

  test("filterOptions removes already-selected users and matches by name/email/phone", () => {
    render(
      <AssignAccessSection
        users={USERS}
        selectedUsers={[USERS[0]]}
        setSelectedUsers={jest.fn()}
        openAssignModal={jest.fn()}
        loading={true}
      />
    );

    const autoProps = (mockAutocomplete as jest.Mock).mock.calls[0][0];

    expect(autoProps.loading).toBe(true);

    expect(autoProps.isOptionEqualToValue({ id: 1 }, { id: 1 })).toBe(true);
    expect(autoProps.isOptionEqualToValue({ id: 1 }, { id: 2 })).toBe(false);

    const removedSelected = autoProps.filterOptions(USERS, { inputValue: "" });
    expect(removedSelected.map((u: any) => u.id)).toEqual([2]);

    const byName = autoProps.filterOptions(USERS, { inputValue: "jane" });
    expect(byName.map((u: any) => u.id)).toEqual([2]);

    const byEmail = autoProps.filterOptions(USERS, { inputValue: "ex.com" });
    expect(byEmail.map((u: any) => u.id)).toEqual([2]);

    const byPhone = autoProps.filterOptions(USERS, { inputValue: "999" });
    // selected user removed => no results
    expect(byPhone.map((u: any) => u.id)).toEqual([]);
  });
});