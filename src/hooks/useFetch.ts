import { useCallback, useEffect, useState } from "react";
import axios, { AxiosRequestConfig, ResponseType } from "axios";
import { useSelector } from "react-redux";
import { API_BASE } from "../constants/constants";

type FetchMethod = "GET" | "POST" | "PUT" | "DELETE";

interface UseApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  fetchData: (body?: any, queryParams?: any, skipRefresh?: boolean, param?: any) => void;
}

const appendQueryParams = (url: string, queryParams?: any) => {
  if (!queryParams) return url;
  const queryString = new URLSearchParams(queryParams).toString();
  return queryString ? `${url}?${queryString}` : url;
};

const joinPath = (base: string, segment: string | number) => {
  const b = base.replace(/\/+$/, "");
  const raw = String(segment).trim();

  if (!raw) return b;

  const s = raw
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return s ? `${b}/${s}` : b;
};

const useFetch = <T,>(url: string, method: FetchMethod, autoFetch: boolean = false): UseApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { token } = useSelector((state: any) => state.auth);

  const fetchData = useCallback(
    async (body?: any, queryParams?: any, skipRefresh: boolean = false, param?: any) => {
      setData(null);
      setError(null);

      //  Build base URL first (do NOT mutate `url`)
      let baseUrl = url;

      //  Support old param behavior: param = 123 -> /123
      //  Support new behavior: param = { path, responseType, urlOverride }
      let responseType: ResponseType | undefined;
      let urlOverride: string | undefined;

      if (param !== undefined && param !== null) {
        if (typeof param === "string" || typeof param === "number") {
          baseUrl = joinPath(baseUrl, param);
        } else if (typeof param === "object") {
          if (param.url) urlOverride = param.url;
          if (param.path !== undefined && param.path !== null) baseUrl = joinPath(baseUrl, param.path);
          if (param.responseType) responseType = param.responseType;
        }
      }

      //  If caller wants full override URL
      if (urlOverride) baseUrl = urlOverride;

      //  Query params should be appended LAST
      const finalUrl = appendQueryParams(baseUrl, queryParams);

      const config: AxiosRequestConfig = {
        method,
        url: finalUrl,
        withCredentials: true,
        responseType, //  only set when provided; existing calls unchanged
      };

      if (body) config.data = body;

      try {
        setLoading(true);

        const response = await axios(config);
        setData(response.data);
        setError("");
      } catch (err: any) {
        if (err.response?.status === 401 && !skipRefresh) {
          try {
            await axios.post(
              "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/refresh",
              {},
              { withCredentials: true }
            );

            //  Retry with same config (including responseType!)
            const retryResponse = await axios({ ...config });
            setData(retryResponse.data);
            setError("");
          } catch (refreshErr: any) {
            setError(refreshErr.response?.data?.error || refreshErr.message);
          }
        } else {
          setError(err.response?.data?.error || err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [url, method]
  );

  useEffect(() => {
    if (autoFetch) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, method, url]);

  return { data, loading, error, fetchData };
};

export default useFetch;

// hooks/useFetch.ts
export async function apiRequest<T = any>(
  url: string,
  method: string,
  body?: any,
  headers: Record<string, string> = {},
  token?: string,
  opts?: {
    skipRefresh?: boolean;
    refreshUrl?: string; // defaults to your backend refresh endpoint
  }
): Promise<T> {
  const refreshUrl =
    opts?.refreshUrl || "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/refresh";

  const doFetch = async (accessToken?: string) => {
    const res = await fetch(url, {
      method,
      credentials: "include", // ✅ sends refresh cookie like axios { withCredentials:true }
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return res;
  };

  const parseResponse = async (res: Response) => {
    const text = await res.text().catch(() => "");
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { text, json };
  };

  // 1st attempt
  let res = await doFetch(token);

  // Refresh + retry once on 401 (same as your useFetch)
  if (res.status === 401 && !opts?.skipRefresh) {
    // refresh call (cookie-based)
    const refreshRes = await fetch(refreshUrl, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (refreshRes.ok) {
      // Optional: if refresh returns a new token in JSON, use it for retry
      const { json: refreshJson } = await parseResponse(refreshRes);
      const newToken =
        refreshJson?.token || refreshJson?.access_token || refreshJson?.accessToken || token;

      const res = await apiRequest<T>(url, method, body, headers, newToken, {
        ...opts,
        skipRefresh: true, // prevent loops
        refreshUrl,
      });
      return res;
    }

    const { text, json } = await parseResponse(refreshRes);
    const msg = json?.error || json?.message || text || `HTTP ${refreshRes.status}`;
    throw new Error(msg);
  }

  // Normal parse + error handling
  const { text, json } = await parseResponse(res);

  if (!res.ok) {
    const msg = json?.error || json?.message || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return (json ?? (text as any)) as T;
}

export const fetchLookupJSON =
  async (path: string) => {
    if (!path) return null;

    const finalUrl = `${API_BASE.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;

    const doRequest = async () => {
      const res = await fetch(finalUrl, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      return res.json();
    };

    try {
      return await doRequest();
    } catch (err: any) {
      if (String(err?.message || "").includes("401")) {
        await fetch(
          "https://nordikdriveapi-724838782318.us-west1.run.app/api/user/refresh",
          {
            method: "POST",
            credentials: "include",
          }
        );

        return await doRequest();
      }

      throw err;
    }
  }
