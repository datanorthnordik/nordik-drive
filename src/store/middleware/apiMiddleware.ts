import type { Middleware } from "@reduxjs/toolkit";
import { apiEnsure, fetchStart, fetchSuccess, fetchError } from "../api/apiSlice";
import { apiRequest } from "../../hooks/useFetch"; // <-- must be a plain function, not hook
import { idbGetConfig, idbSetConfig } from "../index_db/configcache";

function isConfigKey(key: string) {
  return key.startsWith("config_");
}

function toIsoString(v: any): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  try {
    return new Date(v).toISOString();
  } catch {
    return undefined;
  }
}

export const apiMiddleware: Middleware = (storeAPI) => (next) => async (action) => {
  const result = next(action);

  if (!apiEnsure.match(action)) return result;

  const { key, url, method = "GET", body, headers = {}, force = false, ttlMs } = action.payload;

  const state = storeAPI.getState() as any;
  const entry = state?.api?.entries?.[key];

  // dedupe
  if (entry?.loading) return result;

  // cache hit (redux)
  if (!force && entry?.data != null) {
    if (!ttlMs) return result;
    const last = entry?.lastFetchedAt ?? 0;
    if (Date.now() - last <= ttlMs) return result;
  }

  storeAPI.dispatch(fetchStart({ key }));

  try {
    // ---- Special handling for configs ----
    if (isConfigKey(key)) {
      // try IDB first (fast)
      const cached = await idbGetConfig(key);
      if (cached?.config && !force) {
        // seed redux immediately so UI doesn’t wait
        storeAPI.dispatch(fetchSuccess({ key, data: cached }));
      }

      // call backend with last_modified (if we have cached updated_at)
      const lm = cached?.updated_at ? encodeURIComponent(cached.updated_at) : "";
      const finalUrl =
        url.includes("?")
          ? `${url}&last_modified=${lm}`
          : `${url}?last_modified=${lm}`;

      const token = state?.auth?.token || undefined;

      const apiRes = await apiRequest<any>(finalUrl, method, body, headers, token);

      // backend returns { not_modified: true, ... } or { not_modified:false, config: {...} }
      if (apiRes?.not_modified === true) {
        // keep IDB (preferred). If we don’t have it, store metadata anyway.
        if (cached?.config) {
          storeAPI.dispatch(fetchSuccess({ key, data: cached }));
          return result;
        }

        const minimal = {
          key,
          file_name: apiRes.file_name,
          updated_at: toIsoString(apiRes.updated_at),
          checksum: apiRes.checksum,
          version: apiRes.version,
          config: null,
        };

        storeAPI.dispatch(fetchSuccess({ key, data: minimal }));
        return result;
      }

      // modified => must have config
      const nextCache = {
        key,
        file_name: apiRes.file_name,
        updated_at: toIsoString(apiRes.updated_at),
        checksum: apiRes.checksum,
        version: apiRes.version,
        config: apiRes.config ?? null,
      };

      // save to IDB + redux
      await idbSetConfig(nextCache);
      storeAPI.dispatch(fetchSuccess({ key, data: nextCache }));
      return result;
    }

    // ---- Normal API behavior (non-config) ----
    const token = state?.auth?.token || undefined;
    const data = await apiRequest<any>(url, method, body, headers, token);
    storeAPI.dispatch(fetchSuccess({ key, data }));
  } catch (e: any) {
    // if config API fails, fallback to IDB if possible
    if (isConfigKey(action.payload.key)) {
      const cached = await idbGetConfig(action.payload.key);
      if (cached?.config) {
        storeAPI.dispatch(fetchSuccess({ key: action.payload.key, data: cached }));
        return result;
      }
    }
    storeAPI.dispatch(fetchError({ key, error: e?.message || "Request failed" }));
  }

  return result;
};