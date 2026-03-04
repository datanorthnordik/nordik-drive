import {
  MAX_HEADER_CHARS,
  headerDisplay,
  headerMinWidthPx,
} from "./HelperComponents";

describe("header utils", () => {
  describe("MAX_HEADER_CHARS", () => {
    it("should be 25", () => {
      expect(MAX_HEADER_CHARS).toBe(25);
    });
  });

  describe("headerDisplay", () => {
    it("returns the same string when length is less than max", () => {
      expect(headerDisplay("Short header")).toBe("Short header");
    });

    it("returns the same string when length is exactly max", () => {
      const value = "a".repeat(MAX_HEADER_CHARS);
      expect(headerDisplay(value)).toBe(value);
    });

    it("truncates and adds ellipsis when length is greater than default max", () => {
      const value = "a".repeat(MAX_HEADER_CHARS + 5);
      expect(headerDisplay(value)).toBe("a".repeat(MAX_HEADER_CHARS) + "...");
    });

    it("truncates and adds ellipsis when using a custom max", () => {
      expect(headerDisplay("HelloWorld", 5)).toBe("Hello...");
    });

    it("returns empty string for null", () => {
      expect(headerDisplay(null as unknown as string)).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(headerDisplay(undefined as unknown as string)).toBe("");
    });

    it("converts non-string values to string", () => {
      expect(headerDisplay(12345 as unknown as string)).toBe("12345");
    });

    it("returns empty string for empty input", () => {
      expect(headerDisplay("")).toBe("");
    });
  });

  describe("headerMinWidthPx", () => {
    it("calculates width correctly for a positive number", () => {
      expect(headerMinWidthPx(10)).toBe(170);
    });

    it("calculates width correctly for zero", () => {
      expect(headerMinWidthPx(0)).toBe(70);
    });

    it("calculates width correctly for one", () => {
      expect(headerMinWidthPx(1)).toBe(80);
    });

    it("calculates width correctly for a larger number", () => {
      expect(headerMinWidthPx(25)).toBe(320);
    });
  });
});