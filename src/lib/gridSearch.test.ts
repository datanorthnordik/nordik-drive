// utils/gridSearch.test.ts
import { applyQuickFilter, findMatches, scrollToMatch } from "./gridSearch";

describe("applyQuickFilter", () => {
  it("does nothing when api is not provided", () => {
    expect(() => applyQuickFilter(undefined, "abc")).not.toThrow();
    expect(() => applyQuickFilter(null, "abc")).not.toThrow();
  });

  it("uses setGridOption when available", () => {
    const api = {
      setGridOption: jest.fn(),
      setQuickFilter: jest.fn(),
      setFilterModel: jest.fn(),
      onFilterChanged: jest.fn(),
    };

    applyQuickFilter(api, "hello");

    expect(api.setGridOption).toHaveBeenCalledWith("quickFilterText", "hello");
    expect(api.setQuickFilter).not.toHaveBeenCalled();
    expect(api.setFilterModel).not.toHaveBeenCalled();
    expect(api.onFilterChanged).not.toHaveBeenCalled();
  });

  it("uses setQuickFilter when setGridOption is not available", () => {
    const api = {
      setQuickFilter: jest.fn(),
      setFilterModel: jest.fn(),
      onFilterChanged: jest.fn(),
    };

    applyQuickFilter(api, "hello");

    expect(api.setQuickFilter).toHaveBeenCalledWith("hello");
    expect(api.setFilterModel).not.toHaveBeenCalled();
    expect(api.onFilterChanged).not.toHaveBeenCalled();
  });

  it("falls back to setFilterModel + onFilterChanged when quick filter APIs are unavailable", () => {
    const api = {
      getColumnDefs: jest.fn().mockReturnValue([
        { field: "name" },
        { field: "email" },
      ]),
      setFilterModel: jest.fn(),
      onFilterChanged: jest.fn(),
    };

    applyQuickFilter(api, "athul");

    expect(api.getColumnDefs).toHaveBeenCalled();
    expect(api.setFilterModel).toHaveBeenCalledWith({
      name: { type: "contains", filter: "athul" },
      email: { type: "contains", filter: "athul" },
    });
    expect(api.onFilterChanged).toHaveBeenCalled();
  });

  it("falls back to empty filter model when text is empty", () => {
    const api = {
      getColumnDefs: jest.fn(),
      setFilterModel: jest.fn(),
      onFilterChanged: jest.fn(),
    };

    applyQuickFilter(api, "");

    expect(api.getColumnDefs).not.toHaveBeenCalled();
    expect(api.setFilterModel).toHaveBeenCalledWith({});
    expect(api.onFilterChanged).toHaveBeenCalled();
  });

  it("handles missing column defs in fallback mode", () => {
    const api = {
      getColumnDefs: jest.fn().mockReturnValue(undefined),
      setFilterModel: jest.fn(),
      onFilterChanged: jest.fn(),
    };

    applyQuickFilter(api, "abc");

    expect(api.setFilterModel).toHaveBeenCalledWith({});
    expect(api.onFilterChanged).toHaveBeenCalled();
  });
});

describe("findMatches", () => {
  const makeNode = (data: Record<string, any>) => ({ data } as any);

  it("returns matches across rows and columns, case-insensitively", () => {
    const node1 = makeNode({ name: "Athul", city: "Toronto" });
    const node2 = makeNode({ name: "Kavya", city: "Sault Ste. Marie" });

    const api = {
      getColumnDefs: jest.fn().mockReturnValue([
        { field: "name" },
        { field: "city" },
      ]),
      forEachNodeAfterFilterAndSort: (cb: (node: any) => void) => {
        cb(node1);
        cb(node2);
      },
    };

    const result = findMatches(api, "ath");

    expect(result).toEqual([{ rowNode: node1, colId: "name" }]);
  });

  it("returns multiple matches when the term appears in multiple cells", () => {
    const node1 = makeNode({ name: "Athul", city: "Matheson" });

    const api = {
      getColumnDefs: jest.fn().mockReturnValue([
        { field: "name" },
        { field: "city" },
      ]),
      forEachNodeAfterFilterAndSort: (cb: (node: any) => void) => {
        cb(node1);
      },
    };

    const result = findMatches(api, "th");

    expect(result).toEqual([
      { rowNode: node1, colId: "name" },
      { rowNode: node1, colId: "city" },
    ]);
  });

  it("skips columns without a field", () => {
    const node1 = makeNode({ name: "Athul" });

    const api = {
      getColumnDefs: jest.fn().mockReturnValue([
        { headerName: "No Field" },
        { field: "name" },
      ]),
      forEachNodeAfterFilterAndSort: (cb: (node: any) => void) => {
        cb(node1);
      },
    };

    const result = findMatches(api, "ath");

    expect(result).toEqual([{ rowNode: node1, colId: "name" }]);
  });

  it("handles missing values safely", () => {
    const node1 = makeNode({ name: undefined, city: null });

    const api = {
      getColumnDefs: jest.fn().mockReturnValue([
        { field: "name" },
        { field: "city" },
      ]),
      forEachNodeAfterFilterAndSort: (cb: (node: any) => void) => {
        cb(node1);
      },
    };

    const result = findMatches(api, "abc");

    expect(result).toEqual([]);
  });

  it("converts non-string values using toString", () => {
    const node1 = makeNode({ age: 27, active: true });

    const api = {
      getColumnDefs: jest.fn().mockReturnValue([
        { field: "age" },
        { field: "active" },
      ]),
      forEachNodeAfterFilterAndSort: (cb: (node: any) => void) => {
        cb(node1);
      },
    };

    expect(findMatches(api, "27")).toEqual([{ rowNode: node1, colId: "age" }]);
    expect(findMatches(api, "tru")).toEqual([{ rowNode: node1, colId: "active" }]);
  });

  it("returns empty array when there are no column defs", () => {
    const node1 = makeNode({ name: "Athul" });

    const api = {
      getColumnDefs: jest.fn().mockReturnValue(undefined),
      forEachNodeAfterFilterAndSort: (cb: (node: any) => void) => {
        cb(node1);
      },
    };

    expect(findMatches(api, "ath")).toEqual([]);
  });
});

describe("scrollToMatch", () => {
  it("does nothing when api is not provided", () => {
    const match = {
      rowNode: { setSelected: jest.fn() },
      colId: "name",
    } as any;

    expect(() => scrollToMatch(undefined, match)).not.toThrow();
    expect(match.rowNode.setSelected).not.toHaveBeenCalled();
  });

  it("scrolls to the row, shows the column, and selects the row", () => {
    const rowNode = {
      setSelected: jest.fn(),
    };

    const api = {
      ensureNodeVisible: jest.fn(),
      ensureColumnVisible: jest.fn(),
    };

    const match = {
      rowNode,
      colId: "name",
    } as any;

    scrollToMatch(api, match);

    expect(api.ensureNodeVisible).toHaveBeenCalledWith(rowNode, "middle");
    expect(api.ensureColumnVisible).toHaveBeenCalledWith("name");
    expect(rowNode.setSelected).toHaveBeenCalledWith(true);
  });
});