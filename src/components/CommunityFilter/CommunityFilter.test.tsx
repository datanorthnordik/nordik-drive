import React from "react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ adjust this path
import CommunityFilter from "./CommunityFilter";

// ✅ Mock the action creator used by the component
jest.mock("../../store/auth/fileSlice", () => ({
  setSelectedCommunities: (payload: any) => ({
    type: "file/setSelectedCommunities",
    payload,
  }),
}));

type FileState = {
  communities: string[];
  selectedCommunities: string[];
};

function makeStore(preloaded: Partial<FileState> = {}) {
  const initial: FileState = {
    communities: [],
    selectedCommunities: [],
    ...preloaded,
  };

  const fileReducer = (state: FileState = initial, action: any): FileState => {
    switch (action.type) {
      case "file/setSelectedCommunities":
        return { ...state, selectedCommunities: action.payload.selected ?? [] };

      // test-only helper action to simulate communities updates
      case "file/setCommunities":
        return { ...state, communities: action.payload.communities ?? [] };

      default:
        return state;
    }
  };

  return configureStore({
    reducer: {
      file: fileReducer,
    } as any,
    preloadedState: {
      file: initial,
    } as any,
  });
}

function renderWithStore(
  ui: React.ReactElement,
  {
    communities = [],
    selectedCommunities = [],
  }: { communities?: string[]; selectedCommunities?: string[] } = {}
) {
  const store = makeStore({ communities, selectedCommunities });
  const result = render(<Provider store={store}>{ui}</Provider>);
  return { store, ...result };
}

function getOption(name: string) {
  // role="option" is on the label; accessible name comes from the label text
  return screen.getByRole("option", { name });
}

function getCheckboxInsideOption(optionEl: HTMLElement) {
  return within(optionEl).getByRole("checkbox");
}

describe("CommunityFilter", () => {
  test("renders panel + list items (no query)", () => {
    renderWithStore(<CommunityFilter />, {
      communities: ["Batchewana", "Garden River"],
      selectedCommunities: [],
    });

    expect(screen.getByLabelText("Community filter panel")).toBeInTheDocument();
    expect(screen.getByLabelText("Search communities")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Community list" })).toBeInTheDocument();

    // options visible
    expect(getOption("Batchewana")).toBeInTheDocument();
    expect(getOption("Garden River")).toBeInTheDocument();

    // selected count starts at 0
    expect(screen.getByLabelText("Selected count 0")).toBeInTheDocument();
  });

  test("close button renders only when showClose && onClose; clicking calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    // not shown if showClose missing
    renderWithStore(<CommunityFilter onClose={onClose} />, {
      communities: ["A"],
      selectedCommunities: [],
    });
    expect(screen.queryByRole("button", { name: "Close filter" })).not.toBeInTheDocument();

    // shown when both provided
    renderWithStore(<CommunityFilter showClose onClose={onClose} />, {
      communities: ["A"],
      selectedCommunities: [],
    });

    const closeBtn = screen.getByRole("button", { name: "Close filter" });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("search filters case-insensitively and trims spaces", async () => {
    const user = userEvent.setup();

    renderWithStore(<CommunityFilter />, {
      communities: ["Batchewana", "Garden River", "Serpent River"],
      selectedCommunities: [],
    });

    const input = screen.getByLabelText("Search communities");
    await user.type(input, "   bat  ");

    expect(getOption("Batchewana")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Garden River" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Serpent River" })).not.toBeInTheDocument();
  });

  test("shows empty message when no communities match query", async () => {
    const user = userEvent.setup();

    renderWithStore(<CommunityFilter />, {
      communities: ["Batchewana", "Garden River"],
      selectedCommunities: [],
    });

    await user.type(screen.getByLabelText("Search communities"), "zzzz");
    expect(screen.getByText("No communities found.")).toBeInTheDocument();
  });

  test("toggle selection via checkbox click (select + unselect) updates selected count and checkbox", async () => {
    const user = userEvent.setup();

    renderWithStore(<CommunityFilter />, {
      communities: ["Batchewana"],
      selectedCommunities: [],
    });

    const opt = getOption("Batchewana");
    const cb = getCheckboxInsideOption(opt);

    expect(cb).not.toBeChecked();
    expect(screen.getByLabelText("Selected count 0")).toBeInTheDocument();

    await user.click(cb);
    expect(cb).toBeChecked();
    expect(screen.getByLabelText("Selected count 1")).toBeInTheDocument();

    await user.click(cb);
    expect(cb).not.toBeChecked();
    expect(screen.getByLabelText("Selected count 0")).toBeInTheDocument();
  });

  test("toggle selection via keyboard Enter and Space; other keys do nothing", async () => {
    renderWithStore(<CommunityFilter />, {
      communities: ["A"],
      selectedCommunities: [],
    });

    const opt = getOption("A");
    const cb = getCheckboxInsideOption(opt);

    // Enter toggles ON
    opt.focus();
    fireEvent.keyDown(opt, { key: "Enter" });
    await waitFor(() => expect(cb).toBeChecked());
    expect(screen.getByLabelText("Selected count 1")).toBeInTheDocument();

    // Escape does nothing
    fireEvent.keyDown(opt, { key: "Escape" });
    expect(screen.getByLabelText("Selected count 1")).toBeInTheDocument();

    // Space toggles OFF
    fireEvent.keyDown(opt, { key: " " });
    await waitFor(() => expect(cb).not.toBeChecked());
    expect(screen.getByLabelText("Selected count 0")).toBeInTheDocument();
  });

  test("Select visible communities merges/dedupes with existing selection", async () => {
    const user = userEvent.setup();

    renderWithStore(<CommunityFilter />, {
      communities: ["Batchewana", "Garden River", "Serpent River"],
      selectedCommunities: ["Batchewana"],
    });

    // Filter to only communities containing 'river' => Garden River + Serpent River
    await user.type(screen.getByLabelText("Search communities"), "river");

    // button uses aria-label with visible count
    const selectBtn = screen.getByRole("button", {
      name: "Select visible communities (2)",
    });

    await user.click(selectBtn);

    // Now selection should be Batchewana + Garden River + Serpent River => 3
    expect(screen.getByLabelText("Selected count 3")).toBeInTheDocument();

    // both visible are checked
    expect(getCheckboxInsideOption(getOption("Garden River"))).toBeChecked();
    expect(getCheckboxInsideOption(getOption("Serpent River"))).toBeChecked();
  });

  test("Clear button clears selection", async () => {
    const user = userEvent.setup();

    renderWithStore(<CommunityFilter />, {
      communities: ["A", "B"],
      selectedCommunities: ["A", "B"],
    });

    expect(screen.getByLabelText("Selected count 2")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: "Clear selected communities" });
    await user.click(clearBtn);

    expect(screen.getByLabelText("Selected count 0")).toBeInTheDocument();
    expect(getCheckboxInsideOption(getOption("A"))).not.toBeChecked();
    expect(getCheckboxInsideOption(getOption("B"))).not.toBeChecked();
  });

  test("sanitizes selection when communities change (removes selections not in communities)", async () => {
    const { store } = renderWithStore(<CommunityFilter />, {
      communities: ["A", "B"],
      selectedCommunities: ["A", "Ghost"],
    });

    // sanitize effect should remove "Ghost" => selected becomes ["A"]
    await waitFor(() => {
      expect(screen.getByLabelText("Selected count 1")).toBeInTheDocument();
    });

    // now simulate communities update (remove A, keep only B)
    store.dispatch({ type: "file/setCommunities", payload: { communities: ["B"] } });

    // selection should sanitize to [] (since "A" is no longer valid)
    await waitFor(() => {
      expect(screen.getByLabelText("Selected count 0")).toBeInTheDocument();
    });
  });

  test("sanitize effect does nothing when selection is empty (covers early return)", async () => {
    const { store } = renderWithStore(<CommunityFilter />, {
      communities: ["A"],
      selectedCommunities: [],
    });

    expect(screen.getByLabelText("Selected count 0")).toBeInTheDocument();

    // change communities; since selection is empty, sanitize effect should not dispatch selection updates
    store.dispatch({ type: "file/setCommunities", payload: { communities: ["A", "B"] } });

    // still 0, and both options visible
    await waitFor(() => {
      expect(screen.getByLabelText("Selected count 0")).toBeInTheDocument();
      expect(getOption("A")).toBeInTheDocument();
      expect(getOption("B")).toBeInTheDocument();
    });
  });
});