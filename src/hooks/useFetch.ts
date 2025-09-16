import { useCallback, useEffect, useState } from "react";
import axios, { AxiosRequestConfig } from "axios";
import { useSelector } from "react-redux";

type FetchMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface UseApiResponse<T> {
    data : T | null;
    error: string | null;
    loading: boolean;
    fetchData : (body?: any, queryParams?: Record<string, string>, skipRefresh?: boolean)=> void
}

const appendQueryParams = (url: string, queryParams?: Record<string, string>) => {
    if (!queryParams) return url;
    const queryString = new URLSearchParams(queryParams).toString();
    return `${url}?${queryString}`;
};

const useFetch = <T> (url: string, method: FetchMethod, autoFetch: boolean = false): UseApiResponse<T>=> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useSelector((state:any) => state.auth);

    useEffect(() => {
        if (autoFetch) fetchData();
    }, [autoFetch, method, url]);

    const fetchData = useCallback(async (body?: any, queryParams?: Record<string, string>, skipRefresh: boolean = false) => {
        const finalUrl = appendQueryParams(url, queryParams);
        const config: AxiosRequestConfig = { method, url: finalUrl, withCredentials: true };
        setData(null);
        setError(null)
        try {
            setLoading(true);
            if (body) config.data = body;

            const response = await axios(config);
            setData(response.data);
            setError("")
        } catch (err: any) {
            if (err.response?.status === 401 && !skipRefresh) {
                try {
                    await axios.post("https://nordikdriveapi-724838782318.us-west1.run.app/user/refresh", {}, { withCredentials: true });
                    const retryResponse = await axios({ ...config });
                    setData(retryResponse.data);
                    setError("")
                } catch (refreshErr: any) {
                    setError(refreshErr.response?.data?.error || refreshErr.message);
                }
            } else {
                setError(err.response?.data?.error || err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [url, method]);
    return { data, loading, error, fetchData };
};

export default useFetch;
