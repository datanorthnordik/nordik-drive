export const isBlank = (v: any) => {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.join(",").trim().length === 0;
  return String(v).trim().length === 0;
};
