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
  return `${row?.firstname ?? ""} ${row?.lastname ?? ""}`.trim() || "Unknown";
}