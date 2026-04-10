import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import SmartSearchSuggestions from "./SmartSearchSuggestions";

describe("SmartSearchSuggestions", () => {
  it("shows typo suggestions from the indexed row data and lets the user pick one", () => {
    const onPick = jest.fn();

    render(
      <SmartSearchSuggestions
        query="atul"
        rowData={[
          { Name: "Athul (CSA)", Community: "Garden River" },
          { Name: "Annie", Community: "Batchewana" },
        ]}
        hasResults={false}
        onPick={onPick}
      />
    );

    expect(screen.getByText("No exact matches. Are you looking for:")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Athul" }));

    expect(onPick).toHaveBeenCalledWith("Athul");
  });

  it("stays hidden when results already exist or the query is too short", () => {
    const { rerender } = render(
      <SmartSearchSuggestions
        query="a"
        rowData={[{ Name: "Athul" }]}
        hasResults={false}
        onPick={jest.fn()}
      />
    );

    expect(screen.queryByText("No exact matches. Are you looking for:")).not.toBeInTheDocument();

    rerender(
      <SmartSearchSuggestions
        query="atul"
        rowData={[{ Name: "Athul" }]}
        hasResults={true}
        onPick={jest.fn()}
      />
    );

    expect(screen.queryByText("No exact matches. Are you looking for:")).not.toBeInTheDocument();
  });
});
