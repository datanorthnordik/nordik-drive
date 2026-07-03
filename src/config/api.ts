const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const joinUrl = (base: string, path = "") => {
  const normalizedBase = trimTrailingSlash(base);
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  if (!normalizedPath) {
    return normalizedBase;
  }

  return normalizedBase ? `${normalizedBase}/${normalizedPath}` : `/${normalizedPath}`;
};

const runtimeConfig =
  typeof window === "undefined" ? undefined : window.__APP_CONFIG__;

const runtimeApiOrigin = runtimeConfig?.API_ORIGIN || "";

const envApiOrigin =
  runtimeApiOrigin ||
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  process.env.REACT_APP_API_ORIGIN ||
  "";

const envApiBase =
  process.env.NEXT_PUBLIC_API_BASE || process.env.REACT_APP_API_BASE || "";

export const API_ORIGIN = trimTrailingSlash(
  envApiOrigin || (envApiBase ? envApiBase.replace(/\/api\/?$/, "") : "")
);

const resolvedApiBase = runtimeApiOrigin
  ? joinUrl(API_ORIGIN, "api")
  : envApiBase || joinUrl(API_ORIGIN, "api");

export const API_BASE = trimTrailingSlash(resolvedApiBase);

export const API_REFRESH_URL = joinUrl(API_BASE, "user/refresh");

export const apiUrl = (path = "") => joinUrl(API_BASE, path);

export const apiOriginUrl = (path = "") => joinUrl(API_ORIGIN, path);
