import { useCallback, useEffect, useState } from "react";
import axios, { AxiosRequestConfig } from "axios";
import { useSelector } from "react-redux";

type FetchMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface UseApiResponse<T> {
    data : T | null;
    error: string | null;
    loading: boolean;
    fetchData : (body?: any,queryParams?: Record<string, string>)=> void
}

const appendQueryParams = (url: string, queryParams?: Record<string, string>) => {
    if (!queryParams) return url;
    const queryString = new URLSearchParams(queryParams).toString();
    return `${url}?${queryString}`;
};

const useFetch = <T> (url: string, method: FetchMethod, autoFetch: boolean = true): UseApiResponse<T>=> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useSelector((state:any) => state.auth);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, method, url]);
    const fetchData = useCallback(async (body?: any, queryParams?: Record<string, string>) => {
        try {
            setLoading(true);
            const finalUrl = appendQueryParams(url, queryParams);

            const headers: Record<string, string> = { };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const config: AxiosRequestConfig = {
                method,
                url: finalUrl,
                headers: headers
            }

            if (body) {
                config.data = body;
            }


            const response = await axios(config);
            setData(response.data);

        } catch (err: any) {
            setError(err.response ? err.response.data.message : err.message);
        } finally {
            setLoading(false);
        }

    }, [url, method, autoFetch])

    return {
        data,
        loading,
        error,
        fetchData
    }
}

export default useFetch