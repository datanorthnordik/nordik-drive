const DEFAULT_API_ORIGIN = "https://nordikdriveapi-724838782318.us-west1.run.app";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const joinUrl = (base: string, path = "") => {
  const normalizedBase = trimTrailingSlash(base);
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase;
};

const envApiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN || process.env.REACT_APP_API_ORIGIN || "";

const envApiBase =
  process.env.NEXT_PUBLIC_API_BASE || process.env.REACT_APP_API_BASE || "";

export const API_ORIGIN = trimTrailingSlash(
  envApiOrigin ||
    (envApiBase
      ? envApiBase.replace(/\/api\/?$/, "")
      : DEFAULT_API_ORIGIN)
);

export const API_BASE = trimTrailingSlash(envApiBase || joinUrl(API_ORIGIN, "api"));

export const API_REFRESH_URL = joinUrl(API_BASE, "user/refresh");

export const apiUrl = (path = "") => joinUrl(API_BASE, path);

export const apiOriginUrl = (path = "") => joinUrl(API_ORIGIN, path);
