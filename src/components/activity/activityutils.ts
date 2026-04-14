import {
  ACTIVITY_OTHERS_LABEL,
  FILE_ACTIVITY_FILE_CLAUSE_FIELD,
} from "./options";
import { UNKNOWN_BREAKDOWN_LABEL, UNKNOWN_PERSON_LABEL } from "./messages";

export function buildPerBarSeries(items: { label: string; count: number }[]) {
  const labels = items.map((item) => item.label);
  const series = items.map((item, index) => ({
    label: item.label,
    data: labels.map((_, labelIndex) => (labelIndex === index ? item.count : null)),
  }));

  return { labels, series };
}

export function appendOthersBucket(
  items: { label: string; count: number }[],
  topN: number
) {
  if (items.length <= topN) return items;

  const topItems = items.slice(0, topN);
  const restCount = items
    .slice(topN)
    .reduce((sum, item) => sum + item.count, 0);

  return [...topItems, { label: ACTIVITY_OTHERS_LABEL, count: restCount }];
}

export function hasFileClause(clauses: any[]): boolean {
  return Array.isArray(clauses) && clauses.some((clause) => clause?.field === FILE_ACTIVITY_FILE_CLAUSE_FIELD);
}

export function parsePgTextArray(value: any): string[] {
  // already an array
  if (Array.isArray(value)) return value.filter(Boolean).map(String);

  if (!value || typeof value !== "string") return [];

  // Examples:
  // "{\"Parry Sound\",\"Mistissini #81\"}"
  // "{}"
  // "{A,B}"
  const s = value.trim();

  if (s === "{}") return [];

  // remove outer { }
  const inside = s.startsWith("{") && s.endsWith("}") ? s.slice(1, -1) : s;

  // split by comma but respect quotes
  // simplest robust approach: parse quoted segments if present
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < inside.length; i++) {
    const ch = inside[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      const v = cur.trim();
      if (v) out.push(v);
      cur = "";
      continue;
    }

    cur += ch;
  }

  const last = cur.trim();
  if (last) out.push(last);

  // clean escaped braces if any (rare)
  return out.map((x) => x.replace(/^\\"|\\"$/g, "").trim()).filter(Boolean);
}

export function getPersonLabel(row: any) {
  return `${row?.firstname ?? ""} ${row?.lastname ?? ""}`.trim() || UNKNOWN_PERSON_LABEL;
}

export function getBreakdownLabel(value: any) {
  return String(value ?? "").trim() || UNKNOWN_BREAKDOWN_LABEL;
}
