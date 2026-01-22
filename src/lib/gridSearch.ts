// utils/gridSearch.ts
import type { RowNode } from "ag-grid-community";

export const applyQuickFilter = (api: any, text: string) => {
  if (!api) return;

  if (typeof api.setGridOption === "function") {
    api.setGridOption("quickFilterText", text);
    return;
  }
  if (typeof api.setQuickFilter === "function") {
    api.setQuickFilter(text);
    return;
  }

  const model = text
    ? Object.fromEntries(
        (api.getColumnDefs() || []).map((col: any) => [
          col.field,
          { type: "contains", filter: text },
        ])
      )
    : {};
  api.setFilterModel(model);
  api.onFilterChanged();
};

export const findMatches = (api: any, term: string) => {
  const allMatches: { rowNode: RowNode; colId: string }[] = [];
  const needle = term.toLowerCase();

  api.forEachNodeAfterFilterAndSort((node: RowNode) => {
    (api.getColumnDefs() || []).forEach((col: any) => {
      if (!col.field) return;
      const value = node.data?.[col.field]?.toString() || "";
      if (value.toLowerCase().includes(needle)) {
        allMatches.push({ rowNode: node, colId: col.field });
      }
    });
  });

  return allMatches;
};

export const scrollToMatch = (api: any, match: { rowNode: RowNode; colId: string }) => {
  if (!api) return;
  api.ensureNodeVisible(match.rowNode, "middle");
  api.ensureColumnVisible(match.colId);
  match.rowNode.setSelected(true);
};
