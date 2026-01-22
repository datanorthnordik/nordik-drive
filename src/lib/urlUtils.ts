export const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

export const normalizeUrl = (raw: string) => {
  const s = (raw || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("www.")) return `https://${s}`;
  return s;
};

export const cleanUrl = (u: string) => u.replace(/[)\],.]+$/g, "");

export const extractUrls = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(URL_REGEX) || [];
  const cleaned = matches.map((m) => normalizeUrl(cleanUrl(m))).filter(Boolean);
  return Array.from(new Set(cleaned));
};

export const isDocumentUrl = (url: string) => {
  const u = url.toLowerCase().split("?")[0];
  return (
    u.endsWith(".pdf") ||
    u.endsWith(".png") ||
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".webp") ||
    u.endsWith(".doc") ||
    u.endsWith(".docx") ||
    u.endsWith(".xls") ||
    u.endsWith(".xlsx") ||
    u.endsWith(".ppt") ||
    u.endsWith(".pptx") ||
    u.endsWith(".csv") ||
    u.endsWith(".txt") ||
    u.endsWith(".json")
  );
};

export const linkLabel = (url: string) => {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() || u.hostname;
    return decodeURIComponent(last.length > 22 ? u.hostname : last);
  } catch {
    return url;
  }
};

export const openInNewTab = (url: string) => {
  const u = normalizeUrl(url);
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
};
