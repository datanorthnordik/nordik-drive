import reducer, {
  setSelectedFile,
  clearSelectedFile,
  setFiles,
  setCommunities,
  setSelectedCommunities,
} from "./fileSlice";

describe("fileSlice", () => {
  const initialState = {
    selectedFile: null,
    files: [],
    communities: [],
    selectedCommunities: [],
  };

  test("should return initial state when passed an unknown action", () => {
    const result = reducer(undefined, { type: "unknown" });
    expect(result).toEqual(initialState);
  });

  test("setSelectedFile sets selectedFile", () => {
    const selected = {
      filename: "Test.csv",
      id: 10,
      version: "1",
      community_filter: true,
      communities: ["Shingwauk"],
    };

    const next = reducer(initialState, setSelectedFile({ selected }));

    expect(next.selectedFile).toEqual(selected);
    // should not touch other fields
    expect(next.files).toEqual([]);
    expect(next.communities).toEqual([]);
    expect(next.selectedCommunities).toEqual([]);
  });

  test("setSelectedFile can set selectedFile to null", () => {
    const prev = {
      ...initialState,
      selectedFile: {
        filename: "Old.csv",
        id: 1,
        version: "1",
        community_filter: false,
      },
    };

    const next = reducer(prev as any, setSelectedFile({ selected: null }));
    expect(next.selectedFile).toBeNull();
  });

  test("clearSelectedFile clears selectedFile", () => {
    const prev = {
      ...initialState,
      selectedFile: {
        filename: "A.csv",
        id: 1,
        version: "1",
        community_filter: false,
      },
    };

    const next = reducer(prev as any, clearSelectedFile());
    expect(next.selectedFile).toBeNull();
  });

  test("setFiles sets files list", () => {
    const files = [
      {
        id: 1,
        filename: "one.csv",
        inserted_by: 100,
        created_at: "2026-01-01T00:00:00Z",
        file_data: { rows: 10 },
      },
      {
        id: 2,
        filename: "two.csv",
        inserted_by: 101,
        created_at: "2026-01-02T00:00:00Z",
        file_data: { rows: 20 },
      },
    ];

    const next = reducer(initialState, setFiles({ files }));
    expect(next.files).toEqual(files);
  });

  test("setCommunities sets communities array", () => {
    const next = reducer(initialState, setCommunities({ communities: ["A", "B"] }));
    expect(next.communities).toEqual(["A", "B"]);
  });

  test("setCommunities sets empty array if payload communities is undefined or falsy", () => {
    const prev = { ...initialState, communities: ["X"] };

    // Using `as any` because your slice typing expects `communities: string[]`
    const next = reducer(prev as any, setCommunities({ communities: undefined as any }));

    expect(next.communities).toEqual([]);
  });

  test("setSelectedCommunities sets selectedCommunities array", () => {
    const next = reducer(initialState, setSelectedCommunities({ selected: ["Shingwauk"] }));
    expect(next.selectedCommunities).toEqual(["Shingwauk"]);
  });

  test("setSelectedCommunities sets empty array if selected is undefined or falsy", () => {
    const prev = { ...initialState, selectedCommunities: ["Old"] };

    // Using `as any` because your slice typing expects `selected: string[]`
    const next = reducer(prev as any, setSelectedCommunities({ selected: undefined as any }));

    expect(next.selectedCommunities).toEqual([]);
  });
});
