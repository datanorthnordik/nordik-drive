// src/components/activity/activityutils.test.ts
import {
  appendOthersBucket,
  buildPerBarSeries,
  getBreakdownLabel,
  getPersonLabel,
  hasFileClause,
  parsePgTextArray,
} from "./activityutils";

describe("parsePgTextArray", () => {
  test("returns [] for null/undefined/non-string (except arrays)", () => {
    expect(parsePgTextArray(undefined)).toEqual([]);
    expect(parsePgTextArray(null)).toEqual([]);
    expect(parsePgTextArray(0)).toEqual([]);
    expect(parsePgTextArray({})).toEqual([]);
    expect(parsePgTextArray(() => "x")).toEqual([]);
  });

  test("already an array: filters falsy and stringifies", () => {
    expect(parsePgTextArray(["A", "", null, undefined, 2, false, "B"])).toEqual(["A", "2", "B"]);
  });

  test("handles empty pg array string {}", () => {
    expect(parsePgTextArray("{}")).toEqual([]);
    expect(parsePgTextArray("  {}  ")).toEqual([]);
  });

  test("parses simple unquoted values", () => {
    expect(parsePgTextArray("{A,B}")).toEqual(["A", "B"]);
    expect(parsePgTextArray("A,B")).toEqual(["A", "B"]); // no outer braces case
  });

  test("trims tokens and ignores empty tokens", () => {
    expect(parsePgTextArray("{ A ,  B ,   }")).toEqual(["A", "B"]);
    expect(parsePgTextArray("{,A,,B,}")).toEqual(["A", "B"]);
  });

  test("respects quoted segments containing commas", () => {
    expect(parsePgTextArray('{"Parry Sound","Mistissini #81"}')).toEqual([
      "Parry Sound",
      "Mistissini #81",
    ]);

    expect(parsePgTextArray('{"A,B","C"}')).toEqual(["A,B", "C"]);
  });

  test("best-effort on odd/malformed quotes: matches current implementation", () => {
    // Because input starts with "{" and ends with "}", outer braces are removed.
    // The remaining inside is: '"A","B' so there is no trailing "}" left to keep.
    expect(parsePgTextArray('{"A","B}')).toEqual(["A", "B"]);
  });

  test("escaped quote-like sequences are NOT fully unescaped; matches current implementation", () => {
    // This function is not a full PG escape parser. It toggles on raw `"` and keeps backslashes.
    expect(parsePgTextArray('{\\\"A\\\",B}')).toEqual(["\\A\\", "B"]);
    expect(parsePgTextArray('{\\\"A\\\"}')).toEqual(["\\A\\"]);
  });

  test("handles whitespace-only string", () => {
    expect(parsePgTextArray("   ")).toEqual([]);
  });
});

describe("getPersonLabel", () => {
  test("returns 'Firstname Lastname' when present", () => {
    expect(getPersonLabel({ firstname: "Athul", lastname: "N" })).toBe("Athul N");
    expect(getPersonLabel({ firstname: "Athul", lastname: "" })).toBe("Athul");
    expect(getPersonLabel({ firstname: "", lastname: "N" })).toBe("N");
  });

  test("returns Unknown when both missing/empty", () => {
    expect(getPersonLabel({})).toBe("Unknown");
    expect(getPersonLabel(null)).toBe("Unknown");
    expect(getPersonLabel(undefined)).toBe("Unknown");
    expect(getPersonLabel({ firstname: "", lastname: "" })).toBe("Unknown");
  });
});

describe("appendOthersBucket", () => {
  test("returns the original list when item count does not exceed topN", () => {
    const items = [
      { label: "A", count: 3 },
      { label: "B", count: 2 },
    ];

    expect(appendOthersBucket(items, 2)).toEqual(items);
  });

  test("adds an Others bucket with the remaining count", () => {
    const items = [
      { label: "A", count: 5 },
      { label: "B", count: 4 },
      { label: "C", count: 3 },
      { label: "D", count: 2 },
    ];

    expect(appendOthersBucket(items, 2)).toEqual([
      { label: "A", count: 5 },
      { label: "B", count: 4 },
      { label: "Others", count: 5 },
    ]);
  });
});

describe("buildPerBarSeries", () => {
  test("creates one series per item with a single populated bar", () => {
    expect(
      buildPerBarSeries([
        { label: "Alpha", count: 2 },
        { label: "Beta", count: 1 },
      ])
    ).toEqual({
      labels: ["Alpha", "Beta"],
      series: [
        { label: "Alpha", data: [2, null] },
        { label: "Beta", data: [null, 1] },
      ],
    });
  });
});

describe("hasFileClause", () => {
  test("detects a file_id clause", () => {
    expect(hasFileClause([{ field: "community", value: "X" }, { field: "file_id", value: 12 }])).toBe(
      true
    );
  });

  test("returns false when no file_id clause is present", () => {
    expect(hasFileClause([{ field: "community", value: "X" }])).toBe(false);
    expect(hasFileClause([])).toBe(false);
    expect(hasFileClause(null as any)).toBe(false);
  });
});

describe("getBreakdownLabel", () => {
  test("returns a trimmed label when present", () => {
    expect(getBreakdownLabel("  notes  ")).toBe("notes");
  });

  test("falls back to unknown for empty values", () => {
    expect(getBreakdownLabel("")).toBe("(unknown)");
    expect(getBreakdownLabel(undefined)).toBe("(unknown)");
  });
});
