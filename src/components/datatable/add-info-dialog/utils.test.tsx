// utils.test.ts
import {
  uid,
  bytesToMB,
  getTotalBytes,
  clamp,
  toStringArray,
  uniqCaseInsensitive,
  isDdMmYyyy,
  isoToDdmmyyyy,
  normalizeIncomingDateToDdMmYyyy,
  toApiDate,
  estimateTotalBase64Bytes,
  convertToBase64,
  getCommunityArray,
} from "./utils"; // <-- update path

describe("utils", () => {
  describe("uid", () => {
    it("builds id from random + timestamp", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.123456789);
      const dateSpy = jest.spyOn(Date, "now").mockReturnValue(1234567890);

      const expected =
        (0.123456789).toString(36).slice(2) + (1234567890).toString(36);

      expect(uid()).toBe(expected);

      randomSpy.mockRestore();
      dateSpy.mockRestore();
    });
  });

  describe("bytes helpers", () => {
    it("converts bytes to MB", () => {
      expect(bytesToMB(1048576)).toBe(1);
      expect(bytesToMB(524288)).toBeCloseTo(0.5);
    });

    it("gets total bytes from files", () => {
      const f1 = new File(["abc"], "a.txt"); // 3 bytes
      const f2 = new File(["hello"], "b.txt"); // 5 bytes

      expect(getTotalBytes([f1, f2])).toBe(8);
      expect(getTotalBytes([])).toBe(0);
    });

    it("estimates total base64 bytes", () => {
      const f1 = new File(["abc"], "a.txt"); // 3
      const f2 = new File(["123456"], "b.txt"); // 6

      // ceil((3*4)/3)+200 = 204
      // ceil((6*4)/3)+200 = 208
      // total = 412
      expect(estimateTotalBase64Bytes([f1, f2])).toBe(412);
      expect(estimateTotalBase64Bytes([])).toBe(0);
    });
  });

  describe("clamp", () => {
    it("returns value when in range", () => {
      expect(clamp(5, 1, 10)).toBe(5);
    });

    it("clamps to min", () => {
      expect(clamp(-2, 1, 10)).toBe(1);
    });

    it("clamps to max", () => {
      expect(clamp(20, 1, 10)).toBe(10);
    });
  });

  describe("toStringArray", () => {
    it("normalizes array input", () => {
      expect(toStringArray([" a ", null, 12, "", "b"])).toEqual(["a", "12", "b"]);
    });

    it("splits comma-separated string input", () => {
      expect(toStringArray(" a, b ,, c ")).toEqual(["a", "b", "c"]);
    });

    it("returns empty array for unsupported input", () => {
      expect(toStringArray(undefined)).toEqual([]);
      expect(toStringArray(123)).toEqual([]);
      expect(toStringArray({})).toEqual([]);
    });
  });

  describe("uniqCaseInsensitive", () => {
    it("removes duplicates ignoring case and preserves first occurrence", () => {
      expect(
        uniqCaseInsensitive(["Apple", "apple", "BANANA", "banana", "Cherry"])
      ).toEqual(["Apple", "BANANA", "Cherry"]);
    });

    it("returns empty array for empty input", () => {
      expect(uniqCaseInsensitive([])).toEqual([]);
    });
  });

  describe("date helpers", () => {
    it("validates dd.mm.yyyy format", () => {
      expect(isDdMmYyyy("01.12.2025")).toBe(true);
      expect(isDdMmYyyy("1.12.2025")).toBe(false);
      expect(isDdMmYyyy("2025-12-01")).toBe(false);
      expect(isDdMmYyyy("")).toBe(false);
    });

    it("converts ISO date to dd.mm.yyyy", () => {
      expect(isoToDdmmyyyy("2025-12-01")).toBe("01.12.2025");
    });

    it("normalizes incoming date to dd.mm.yyyy", () => {
      expect(normalizeIncomingDateToDdMmYyyy("")).toBe("");
      expect(normalizeIncomingDateToDdMmYyyy("01.12.2025")).toBe("01.12.2025");
      expect(normalizeIncomingDateToDdMmYyyy("2025-12-01")).toBe("01.12.2025");
      expect(normalizeIncomingDateToDdMmYyyy("12/01/2025")).toBe("12/01/2025");
    });

    it("returns API date only for valid dd.mm.yyyy", () => {
      expect(toApiDate("01.12.2025")).toBe("01.12.2025");
      expect(toApiDate("2025-12-01")).toBe("");
      expect(toApiDate("")).toBe("");
    });
  });

  describe("convertToBase64", () => {
    const OriginalFileReader = global.FileReader;

    afterEach(() => {
      global.FileReader = OriginalFileReader;
    });

    it("resolves base64 string on success", async () => {
      class MockFileReader {
        public result: string | ArrayBuffer | null = null;
        public onerror: null | (() => void) = null;
        public onloadend: null | (() => void) = null;

        readAsDataURL() {
          this.result = "data:text/plain;base64,QUJD";
          this.onloadend?.();
        }
      }

      global.FileReader = MockFileReader as any;

      const file = new File(["ABC"], "a.txt");
      await expect(convertToBase64(file)).resolves.toBe(
        "data:text/plain;base64,QUJD"
      );
    });

    it("rejects when file read fails", async () => {
      class MockFileReader {
        public result: string | ArrayBuffer | null = null;
        public onerror: null | (() => void) = null;
        public onloadend: null | (() => void) = null;

        readAsDataURL() {
          this.onerror?.();
        }
      }

      global.FileReader = MockFileReader as any;

      const file = new File(["ABC"], "a.txt");
      await expect(convertToBase64(file)).rejects.toThrow("File read error");
    });
  });

  describe("getCommunityArray", () => {
    it("uses values['First Nation/Community'] first", () => {
      const values = {
        "First Nation/Community": "Garden River, garden river, Batchewana",
      };
      const rowObj = {
        "First Nation/Community": "Ignore Me",
      };

      expect(getCommunityArray(values, rowObj)).toEqual([
        "Garden River",
        "Batchewana",
      ]);
    });

    it("falls back to alternate spaced key in values", () => {
      const values = {
        "First Nation / Community": "A, a, B",
      };
      const rowObj = {};

      expect(getCommunityArray(values, rowObj)).toEqual(["A", "B"]);
    });

    it("falls back to row object keys when values do not contain the field", () => {
      const values = {};
      const rowObj = {
        "First Nation / Community": ["Garden River", "garden river", "Mississauga"],
      };

      expect(getCommunityArray(values, rowObj)).toEqual([
        "Garden River",
        "Mississauga",
      ]);
    });

    it("returns empty array when no community exists", () => {
      expect(getCommunityArray({}, {})).toEqual([]);
    });
  });
});