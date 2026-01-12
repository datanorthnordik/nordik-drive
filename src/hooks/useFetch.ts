import { useCallback, useEffect, useState } from "react";
import axios, { AxiosRequestConfig, ResponseType } from "axios";
import { useSelector } from "react-redux";

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
  const s = encodeURIComponent(String(segment));
  return `${b}/${s}`;
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

      // ✅ Build base URL first (do NOT mutate `url`)
      let baseUrl = url;

      // ✅ Support old param behavior: param = 123 -> /123
      // ✅ Support new behavior: param = { path, responseType, urlOverride }
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

      // ✅ If caller wants full override URL
      if (urlOverride) baseUrl = urlOverride;

      // ✅ Query params should be appended LAST
      const finalUrl = appendQueryParams(baseUrl, queryParams);

      const config: AxiosRequestConfig = {
        method,
        url: finalUrl,
        withCredentials: true,
        responseType, // ✅ only set when provided; existing calls unchanged
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

            // ✅ Retry with same config (including responseType!)
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
