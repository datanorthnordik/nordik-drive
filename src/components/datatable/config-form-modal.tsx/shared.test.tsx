import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  asBool,
  buildHeader,
  emptyRowFromColumns,
  flattenCols,
  getLeafColWidth,
  getOptionLabel,
  inputSx,
  isRequired,
  meets,
  missingWrapSx,
  normalizeLookupItems,
  normalizeTable,
  readOnlyValueSx,
  requiredBadge,
  resolveDynamicPath,
  resolveFileId,
  resolveRowId,
  rowChanged,
} from "./shared";

import {
  color_border,
  color_confidential_card_bg,
  color_error,
  color_focus_ring,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../../constants/colors";

describe("shared helpers", () => {
  describe("meets", () => {
    test("returns true when condition is missing", () => {
      expect(meets({ a: 1 }, undefined)).toBe(true);
    });

    test("returns true when answer matches condition", () => {
      expect(meets({ status: "yes" }, { field: "status", equals: "yes" })).toBe(true);
    });

    test("returns false when answer does not match condition", () => {
      expect(meets({ status: "no" }, { field: "status", equals: "yes" })).toBe(false);
    });

    test("returns false when answers are missing", () => {
      expect(meets(undefined, { field: "status", equals: "yes" })).toBe(false);
    });
  });

  describe("isRequired", () => {
    test("returns true when field.required is true", () => {
      expect(
        isRequired({}, {
          key: "a",
          label: "A",
          type: "text",
          required: true,
        })
      ).toBe(true);
    });

    test("returns true when required_if matches", () => {
      expect(
        isRequired(
          { consent: "yes" },
          {
            key: "a",
            label: "A",
            type: "text",
            required_if: { field: "consent", equals: "yes" },
          }
        )
      ).toBe(true);
    });

    test("returns false when neither required nor required_if match", () => {
      expect(
        isRequired(
          { consent: "no" },
          {
            key: "a",
            label: "A",
            type: "text",
            required_if: { field: "consent", equals: "yes" },
          }
        )
      ).toBe(false);
    });
  });

  describe("asBool", () => {
    test("handles boolean and string values", () => {
      expect(asBool(true)).toBe(true);
      expect(asBool("true")).toBe(true);
      expect(asBool(false)).toBe(false);
      expect(asBool("false")).toBe(false);
      expect(asBool(undefined)).toBe(false);
    });
  });

  describe("flattenCols", () => {
    test("flattens grouped and ungrouped columns in order", () => {
      const cols = [
        { key: "name", label: "Name", type: "text" as const },
        {
          key: "period",
          label: "Period",
          type: "group" as const,
          sub_columns: [
            { key: "start", label: "Start", type: "text" as const },
            { key: "end", label: "End", type: "dropdown" as const },
          ],
        },
      ];

      expect(flattenCols(cols)).toEqual([
        { key: "name", label: "Name", type: "text" },
        { key: "start", label: "Start", type: "text" },
        { key: "end", label: "End", type: "dropdown" },
      ]);
    });
  });

  describe("emptyRowFromColumns", () => {
    test("builds an empty row with keys from leaf and grouped columns", () => {
      const cols = [
        { key: "name", label: "Name", type: "text" as const },
        {
          key: "period",
          label: "Period",
          type: "group" as const,
          sub_columns: [
            { key: "start", label: "Start", type: "text" as const },
            { key: "end", label: "End", type: "dropdown" as const },
          ],
        },
      ];

      expect(emptyRowFromColumns(cols)).toEqual({
        name: "",
        start: "",
        end: "",
      });
    });
  });

  describe("normalizeTable", () => {
    const table = {
      key: "rows",
      type: "table" as const,
      min_rows: 2,
      initial_rows: 3,
      columns: [
        { key: "name", label: "Name", type: "text" as const },
        { key: "city", label: "City", type: "text" as const },
      ],
    };

    test("creates initial rows when table answers are missing", () => {
      const result = normalizeTable({}, table);

      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toEqual({ name: "", city: "" });
    });

    test("pads existing rows up to initial_rows", () => {
      const result = normalizeTable(
        {
          rows: [{ name: "A", city: "X" }],
          other: 123,
        },
        table
      );

      expect(result.other).toBe(123);
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toEqual({ name: "A", city: "X" });
      expect(result.rows[1]).toEqual({ name: "", city: "" });
    });

    test("uses min_rows when initial_rows is smaller", () => {
      const result = normalizeTable(
        {},
        {
          ...table,
          min_rows: 2,
          initial_rows: 1,
        }
      );

      expect(result.rows).toHaveLength(2);
    });
  });

  describe("getLeafColWidth", () => {
    test("returns width by label rules", () => {
      expect(getLeafColWidth({ key: "a", label: "Location", type: "text" })).toBe(280);
      expect(getLeafColWidth({ key: "a", label: "Religious Affiliation", type: "text" })).toBe(260);
      expect(getLeafColWidth({ key: "a", label: "Opening Date", type: "text" })).toBe(220);
      expect(getLeafColWidth({ key: "a", label: "School Name", type: "text" })).toBe(240);
      expect(getLeafColWidth({ key: "a", label: "Province", type: "text" })).toBe(220);
      expect(getLeafColWidth({ key: "a", label: "Name Variant", type: "text" })).toBe(240);
    });

    test("returns width by type rules when label rules do not match", () => {
      expect(getLeafColWidth({ key: "a", label: "Notes", type: "textarea" })).toBe(260);
      expect(getLeafColWidth({ key: "a", label: "Type", type: "dropdown" })).toBe(220);
    });

    test("returns default width", () => {
      expect(getLeafColWidth({ key: "a", label: "Notes", type: "text" })).toBe(220);
    });
  });

  describe("buildHeader", () => {
    test("builds grouped header rows correctly", () => {
      const columns = [
        { key: "name", label: "School Name", type: "text" as const, required: true },
        {
          key: "period",
          label: "Admission",
          type: "group" as const,
          sub_columns: [
            { key: "month", label: "Month", type: "text" as const, required: true },
            { key: "year", label: "Year", type: "dropdown" as const },
          ],
        },
      ];

      const result = buildHeader(columns);

      expect(result.hasGroup).toBe(true);
      expect(result.row1).toHaveLength(2);
      expect(result.row2).toHaveLength(2);

      expect(result.row1[0]).toMatchObject({
        label: "School Name",
        colSpan: 1,
        rowSpan: 2,
        required: true,
        width: 240,
      });

      expect(result.row1[1]).toMatchObject({
        label: "Admission",
        colSpan: 2,
        rowSpan: 1,
      });

      expect(result.row2[0]).toMatchObject({
        label: "Month",
        required: true,
      });

      expect(result.row2[1]).toMatchObject({
        label: "Year",
      });
    });

    test("builds simple header without grouped columns", () => {
      const result = buildHeader([
        { key: "name", label: "Name", type: "text" as const },
      ]);

      expect(result.hasGroup).toBe(false);
      expect(result.row1).toHaveLength(1);
      expect(result.row2).toHaveLength(0);
      expect(result.row1[0]).toMatchObject({
        label: "Name",
        colSpan: 1,
        rowSpan: 2,
      });
    });
  });

  describe("resolveDynamicPath", () => {
    test("returns empty when template is missing", () => {
      expect(resolveDynamicPath(undefined, { id: 1 })).toBe("");
    });

    test("replaces tokens and encodes values", () => {
      expect(
        resolveDynamicPath("/lookup/{province}/{name}", {
          province: 10,
          name: "A B",
        })
      ).toBe("/lookup/10/A%20B");
    });

    test("returns empty when token value is missing", () => {
      expect(resolveDynamicPath("/lookup/{province}/{name}", { province: 10 })).toBe("");
    });

    test("returns empty when token value is blank", () => {
      expect(resolveDynamicPath("/lookup/{province}", { province: "   " })).toBe("");
    });
  });

  describe("normalizeLookupItems", () => {
    test("normalizes direct array payload", () => {
      const result = normalizeLookupItems([
        { id: 1, name: "One" },
        { value: 2, label: "Two" },
      ]);

      expect(result).toEqual([
        { id: 1, name: "One" },
        { value: 2, label: "Two", id: 2, name: "Two" },
      ]);
    });

    test("supports nested data.items", () => {
      const result = normalizeLookupItems({
        data: {
          items: [{ code: "AB", title: "Alpha Beta" }],
        },
      });

      expect(result).toEqual([
        { code: "AB", title: "Alpha Beta", id: "AB", name: "Alpha Beta" },
      ]);
    });

    test("supports nested value.options", () => {
      const result = normalizeLookupItems({
        value: {
          options: [{ value: "x", display_name: "Shown X" }],
        },
      });

      expect(result).toEqual([
        { value: "x", display_name: "Shown X", id: "x", name: "Shown X" },
      ]);
    });

    test("supports fallback array on root object", () => {
      const result = normalizeLookupItems({
        something: [{ id: 9, school_name: "School Nine" }],
      });

      expect(result).toEqual([
        { id: 9, school_name: "School Nine", name: "School Nine" },
      ]);
    });

    test("filters invalid items", () => {
      const result = normalizeLookupItems([
        null,
        "abc",
        { id: "", name: "Bad" },
        { id: 1, name: "" },
        { id: 2, name: "Good" },
      ]);

      expect(result).toEqual([{ id: 2, name: "Good" }]);
    });

    test("falls back to id when name-like fields are missing", () => {
      const result = normalizeLookupItems([{ id: "X1" }]);
      expect(result).toEqual([{ id: "X1", name: "X1" }]);
    });

    test("uses alternate name fields", () => {
      expect(normalizeLookupItems([{ id: 1, province_name: "Ontario" }])[0].name).toBe("Ontario");
      expect(normalizeLookupItems([{ id: 2, community_name: "Garden River" }])[0].name).toBe("Garden River");
    });
  });

  describe("getOptionLabel", () => {
    test("returns name when present", () => {
      expect(getOptionLabel({ id: 1, name: "Ontario" })).toBe("Ontario");
    });

    test("falls back to id when name is nullish", () => {
      expect(getOptionLabel({ id: 7, name: undefined as any })).toBe("7");
    });

    test("returns empty string for nullish item", () => {
      expect(getOptionLabel(undefined as any)).toBe("");
    });
  });

  describe("rowChanged", () => {
    test("returns false when rows are equal", () => {
      expect(rowChanged({ a: 1 }, { a: 1 })).toBe(false);
      expect(rowChanged(undefined as any, undefined as any)).toBe(false);
    });

    test("returns true when rows differ", () => {
      expect(rowChanged({ a: 1 }, { a: 2 })).toBe(true);
    });
  });

  describe("resolveFileId", () => {
    test("resolves from id first", () => {
      expect(resolveFileId({ id: 10, file_id: 20, config: { file_id: 30 } })).toBe(10);
    });

    test("resolves from file_id", () => {
      expect(resolveFileId({ file_id: 20, config: { file_id: 30 } })).toBe(20);
    });

    test("resolves from config.file_id", () => {
      expect(resolveFileId({ config: { file_id: 30 } })).toBe(30);
    });

    test("returns null when unavailable", () => {
      expect(resolveFileId({})).toBeNull();
      expect(resolveFileId(undefined)).toBeNull();
    });
  });

  describe("resolveRowId", () => {
    test("returns row id", () => {
      expect(resolveRowId({ id: 99 })).toBe(99);
    });

    test("returns null when unavailable", () => {
      expect(resolveRowId({})).toBeNull();
      expect(resolveRowId(undefined)).toBeNull();
    });
  });

  describe("exported style objects", () => {
    test("inputSx contains expected style config", () => {
      expect(inputSx["& .MuiOutlinedInput-root"]).toMatchObject({
        borderRadius: 2,
        backgroundColor: color_white,
      });

      expect(inputSx["& .MuiOutlinedInput-root.Mui-focused fieldset"]).toMatchObject({
        borderColor: color_focus_ring,
        borderWidth: "2px",
      });

      expect(inputSx["& .MuiInputLabel-root"]).toMatchObject({
        color: color_text_secondary,
        fontWeight: 800,
      });

      expect(inputSx["& .MuiInputLabel-root.Mui-focused"]).toMatchObject({
        color: color_text_primary,
      });
    });

    test("missingWrapSx contains expected style config", () => {
      expect(missingWrapSx).toMatchObject({
        backgroundColor: color_confidential_card_bg,
        border: `2px solid ${color_error}`,
        borderRadius: 2,
        p: 1.25,
      });
    });

    test("readOnlyValueSx contains expected style config", () => {
      expect(readOnlyValueSx).toMatchObject({
        height: 72,
        minHeight: 72,
        maxHeight: 72,
        borderRadius: 2,
        border: `1px solid ${color_border}`,
        background: color_white_smoke,
        color: color_text_primary,
        fontSize: "1rem",
        fontWeight: 700,
        overflow: "hidden",
        display: "-webkit-box",
        cursor: "help",
      });

      expect(readOnlyValueSx.WebkitLineClamp).toBe(2);
      expect(readOnlyValueSx.wordBreak).toBe("break-word");
      expect(readOnlyValueSx.overflowWrap).toBe("anywhere");
    });
  });

  describe("requiredBadge", () => {
    test("renders required badge text", () => {
      render(<>{requiredBadge}</>);
      expect(screen.getByText("* (Required)")).toBeInTheDocument();
    });

    test("has inline style values", () => {
      render(<>{requiredBadge}</>);
      const el = screen.getByText("* (Required)");
      expect(el).toHaveStyle(`color: ${color_error}`);
      expect(el).toHaveStyle("font-weight: 900");
    });
  });
});