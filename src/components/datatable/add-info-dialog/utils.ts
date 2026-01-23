export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const bytesToMB = (b: number) => b / (1024 * 1024);
export const getTotalBytes = (files: File[]) => files.reduce((sum, f) => sum + f.size, 0);

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const toStringArray = (v: any): string[] => {
  if (Array.isArray(v)) {
    return v.map((x) => (x ?? "").toString().trim()).filter((x) => x.length > 0);
  }
  if (typeof v === "string") {
    return v.split(",").map((x) => x.trim()).filter((x) => x.length > 0);
  }
  return [];
};

export const uniqCaseInsensitive = (arr: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
};

export const isDdMmYyyy = (v: string) => /^(\d{2})\.(\d{2})\.(\d{4})$/.test((v || "").trim());

export const isoToDdmmyyyy = (v: string): string => {
  const [yyyy, mm, dd] = v.split("-");
  return `${dd}.${mm}.${yyyy}`;
};

export const normalizeIncomingDateToDdMmYyyy = (value: string): string => {
  if (!value) return "";
  if (isDdMmYyyy(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return isoToDdmmyyyy(value);
  return value;
};

export const toApiDate = (value: string): string => (isDdMmYyyy(value) ? value : "");

// Very rough base64 size estimate to prevent obvious 413
const estimateBase64Bytes = (rawBytes: number) => Math.ceil((rawBytes * 4) / 3) + 200;
export const estimateTotalBase64Bytes = (files: File[]) =>
  files.reduce((sum, f) => sum + estimateBase64Bytes(f.size), 0);

export const convertToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("File read error"));
    r.onloadend = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });

export const getCommunityArray = (values: Record<string, any>, rowObj: Record<string, any>) => {
  const v =
    values["First Nation/Community"] ??
    values["First Nation / Community"] ??
    rowObj["First Nation/Community"] ??
    rowObj["First Nation / Community"];

  return uniqCaseInsensitive(toStringArray(v));
};
