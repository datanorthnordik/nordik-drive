import { cn, isBlank } from "./helper";

describe("isBlank", () => {
  it("returns true for null and undefined", () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
  });

  it("returns true for empty and whitespace strings", () => {
    expect(isBlank("")).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank("\n\t ")).toBe(true);
  });

  it("returns false for non-empty strings", () => {
    expect(isBlank("a")).toBe(false);
    expect(isBlank("  test  ")).toBe(false);
  });

  it("returns true for empty arrays", () => {
    expect(isBlank([])).toBe(true);
  });

  it("returns true for arrays that join to blank text", () => {
    expect(isBlank([""])).toBe(true);
    expect(isBlank(["   "])).toBe(true);
    expect(isBlank([null])).toBe(true);
    expect(isBlank([undefined])).toBe(true);
  });

  it("returns false for arrays with actual content", () => {
    expect(isBlank(["abc"])).toBe(false);
    expect(isBlank(["", "abc"])).toBe(false);
    expect(isBlank([1, 2])).toBe(false);
  });

  it("handles numbers and booleans via string conversion", () => {
    expect(isBlank(0)).toBe(false);
    expect(isBlank(123)).toBe(false);
    expect(isBlank(false)).toBe(false);
    expect(isBlank(true)).toBe(false);
  });

  it("handles objects via string conversion", () => {
    expect(isBlank({})).toBe(false); // "[object Object]"
  });
});

describe("cn", () => {
  it("joins normal class names", () => {
    expect(cn("px-2", "py-1", "text-sm")).toBe("px-2 py-1 text-sm");
  });

  it("ignores falsy values", () => {
    expect(cn("px-2", false, null, undefined, "", "py-1")).toBe("px-2 py-1");
  });

  it("supports conditional objects", () => {
    expect(
      cn("base", {
        active: true,
        disabled: false,
      })
    ).toBe("base active");
  });

  it("supports arrays of classes", () => {
    expect(cn(["px-2", "py-1"], "text-sm")).toBe("px-2 py-1 text-sm");
  });

  it("merges conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("keeps non-conflicting tailwind classes", () => {
    expect(cn("px-2", "py-4", "font-bold")).toBe("px-2 py-4 font-bold");
  });

  it("handles mixed inputs together", () => {
    expect(
      cn(
        "px-2",
        ["py-2", false && "hidden"],
        { "text-sm": true, "text-lg": false },
        "px-4"
      )
    ).toBe("py-2 text-sm px-4");
  });
});