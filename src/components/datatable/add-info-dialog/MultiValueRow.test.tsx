// MultiValueRow.test.tsx
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import MultiValueRow from "./MultiValueRow"; // update path if needed

describe("MultiValueRow", () => {
  it("renders one empty input when values is empty", () => {
    render(
      <MultiValueRow
        values={[]}
        onChange={jest.fn()}
        addLabel="Add value"
      />
    );

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue("");

    expect(screen.getByRole("button", { name: "✕" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ add value/i })).toBeInTheDocument();
  });

  it("renders all provided values", () => {
    render(
      <MultiValueRow
        values={["Alpha", "Beta"]}
        onChange={jest.fn()}
        addLabel="Add item"
      />
    );

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue("Alpha");
    expect(inputs[1]).toHaveValue("Beta");
  });

  it("calls onChange with updated value when a text field changes", () => {
    const onChange = jest.fn();

    render(
      <MultiValueRow
        values={["Alpha", "Beta"]}
        onChange={onChange}
        addLabel="Add item"
      />
    );

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "Gamma" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["Alpha", "Gamma"]);
  });

  it("removes the selected row and keeps remaining values", () => {
    const onChange = jest.fn();

    render(
      <MultiValueRow
        values={["Alpha", "Beta", "Gamma"]}
        onChange={onChange}
        addLabel="Add item"
      />
    );

    const removeButtons = screen.getAllByRole("button", { name: "✕" });
    fireEvent.click(removeButtons[1]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["Alpha", "Gamma"]);
  });

  it("keeps one empty row when the last value is removed", () => {
    const onChange = jest.fn();

    render(
      <MultiValueRow
        values={["Only one"]}
        onChange={onChange}
        addLabel="Add item"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "✕" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([""]);
  });

  it("adds a new empty row when add button is clicked", () => {
    const onChange = jest.fn();

    render(
      <MultiValueRow
        values={["Alpha"]}
        onChange={onChange}
        addLabel="Add item"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ add item/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["Alpha", ""]);
  });

  it("adds a second empty row when add button is clicked from default empty state", () => {
    const onChange = jest.fn();

    render(
      <MultiValueRow
        values={[]}
        onChange={onChange}
        addLabel="Add item"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ add item/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["", ""]);
  });
});