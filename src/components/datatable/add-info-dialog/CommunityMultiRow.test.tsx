import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CommunityMultiRow from "./CommunityMultiRow";

jest.mock("@mui/material/Autocomplete", () => {
  const React = require("react");

  return {
    __esModule: true,
    default: ({ disabled, onInputChange, onChange, renderInput, noOptionsText }: any) => (
      <div data-testid="mock-autocomplete">
        {renderInput({
          inputProps: { "data-testid": "community-input" },
          InputProps: {},
          InputLabelProps: {},
          disabled,
          fullWidth: true,
        })}

        <button
          type="button"
          data-testid="mock-input-change"
          disabled={disabled}
          onClick={() => onInputChange?.(null, "Typed Community")}
        >
          input change
        </button>

        <button
          type="button"
          data-testid="mock-select-option"
          disabled={disabled}
          onClick={() => onChange?.(null, "Selected Community")}
        >
          select option
        </button>

        <span data-testid="mock-no-options">{noOptionsText}</span>
      </div>
    ),
  };
});

describe("CommunityMultiRow", () => {
  const getRemoveButtons = () =>
    screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.trim() === "✕");

  it("renders one empty row when values is empty and shows default texts", () => {
    render(
      <CommunityMultiRow
        values={[]}
        options={[]}
        onChange={jest.fn()}
        onAddNewCommunity={jest.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getAllByTestId("community-input")).toHaveLength(1);
    expect(
      screen.getByPlaceholderText("Search or type a community (press Enter to add)")
    ).toBeInTheDocument();
    expect(screen.getByTestId("mock-no-options")).toHaveTextContent(
      "No match — type the name and press Enter to add it"
    );
    expect(
      screen.getByRole("button", { name: /\+ add community/i })
    ).toBeInTheDocument();
  });

  it("renders custom config texts", () => {
    render(
      <CommunityMultiRow
        values={[""]}
        options={[]}
        onChange={jest.fn()}
        onAddNewCommunity={jest.fn().mockResolvedValue(undefined)}
        config={{
          placeholder: "Type community here",
          no_options_text: "Nothing found",
          add_label: "Add another",
        }}
      />
    );

    expect(screen.getByPlaceholderText("Type community here")).toBeInTheDocument();
    expect(screen.getByTestId("mock-no-options")).toHaveTextContent("Nothing found");
    expect(screen.getByRole("button", { name: /add another/i })).toBeInTheDocument();
  });

  it("calls onChange on input change", () => {
    const onChange = jest.fn();

    render(
      <CommunityMultiRow
        values={["Alpha"]}
        options={[]}
        onChange={onChange}
        onAddNewCommunity={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByTestId("mock-input-change"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["Typed Community"]);
  });

  it("commits selected value and adds new community when it does not exist", async () => {
    const onChange = jest.fn();
    const onAddNewCommunity = jest.fn().mockResolvedValue(undefined);

    render(
      <CommunityMultiRow
        values={[""]}
        options={["Other Community"]}
        onChange={onChange}
        onAddNewCommunity={onAddNewCommunity}
      />
    );

    fireEvent.click(screen.getByTestId("mock-select-option"));

    expect(onChange).toHaveBeenCalledWith(["Selected Community"]);

    await waitFor(() => {
      expect(onAddNewCommunity).toHaveBeenCalledTimes(1);
      expect(onAddNewCommunity).toHaveBeenCalledWith("Selected Community");
    });
  });

  it("does not add community again when selected value already exists (case-insensitive)", () => {
    const onChange = jest.fn();
    const onAddNewCommunity = jest.fn().mockResolvedValue(undefined);

    render(
      <CommunityMultiRow
        values={[""]}
        options={[" selected community "]}
        onChange={onChange}
        onAddNewCommunity={onAddNewCommunity}
      />
    );

    fireEvent.click(screen.getByTestId("mock-select-option"));

    expect(onChange).toHaveBeenCalledWith(["Selected Community"]);
    expect(onAddNewCommunity).not.toHaveBeenCalled();
  });

  it("commits trimmed value on Enter key and adds new community", async () => {
    const onChange = jest.fn();
    const onAddNewCommunity = jest.fn().mockResolvedValue(undefined);

    render(
      <CommunityMultiRow
        values={[""]}
        options={[]}
        onChange={onChange}
        onAddNewCommunity={onAddNewCommunity}
      />
    );

    fireEvent.keyDown(screen.getByTestId("community-input"), {
      key: "Enter",
      target: { value: "  New Community  " },
    });

    expect(onChange).toHaveBeenCalledWith(["New Community"]);

    await waitFor(() => {
      expect(onAddNewCommunity).toHaveBeenCalledWith("New Community");
    });
  });

  it("removes the last row and keeps one empty row", () => {
    const onChange = jest.fn();

    render(
      <CommunityMultiRow
        values={["Only One"]}
        options={[]}
        onChange={onChange}
        onAddNewCommunity={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(getRemoveButtons()[0]);

    expect(onChange).toHaveBeenCalledWith([""]);
  });

  it("adds a new empty row when add button is clicked", () => {
    const onChange = jest.fn();

    render(
      <CommunityMultiRow
        values={["Alpha"]}
        options={[]}
        onChange={onChange}
        onAddNewCommunity={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ add community/i }));

    expect(onChange).toHaveBeenCalledWith(["Alpha", ""]);
  });

  it("disables all interactions when disabled is true", () => {
    const onChange = jest.fn();
    const onAddNewCommunity = jest.fn().mockResolvedValue(undefined);

    render(
      <CommunityMultiRow
        values={["Alpha"]}
        options={[]}
        onChange={onChange}
        onAddNewCommunity={onAddNewCommunity}
        disabled
      />
    );

    expect(screen.getByTestId("community-input")).toBeDisabled();
    expect(screen.getByTestId("mock-input-change")).toBeDisabled();
    expect(screen.getByTestId("mock-select-option")).toBeDisabled();
    expect(getRemoveButtons()[0]).toBeDisabled();
    expect(screen.getByRole("button", { name: /\+ add community/i })).toBeDisabled();

    fireEvent.click(screen.getByTestId("mock-input-change"));
    fireEvent.click(screen.getByTestId("mock-select-option"));
    fireEvent.click(getRemoveButtons()[0]);
    fireEvent.click(screen.getByRole("button", { name: /\+ add community/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(onAddNewCommunity).not.toHaveBeenCalled();
  });
});