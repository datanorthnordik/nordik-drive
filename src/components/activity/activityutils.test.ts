// src/components/activity/activityutils.test.ts
import { parsePgTextArray, getPersonLabel } from "./activityutils";

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
