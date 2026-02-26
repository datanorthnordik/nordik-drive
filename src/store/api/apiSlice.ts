import { createSlice, PayloadAction, createAction } from "@reduxjs/toolkit";

export type ApiEntry = {
  data: any | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number;
};

export type ApiState = {
  entries: Record<string, ApiEntry>;
};

const initialState: ApiState = {
  entries: {},
};

export const apiEnsure = createAction<{
  key: string;
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  force?: boolean;
  ttlMs?: number;
}>("api/ensure");

const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    fetchStart: (state, action: PayloadAction<{ key: string }>) => {
      const k = action.payload.key;
      state.entries[k] = state.entries[k] || { data: null, loading: false, error: null, lastFetchedAt: 0 };
      state.entries[k].loading = true;
      state.entries[k].error = null;
    },
    fetchSuccess: (state, action: PayloadAction<{ key: string; data: any }>) => {
      const { key, data } = action.payload;
      state.entries[key] = state.entries[key] || { data: null, loading: false, error: null, lastFetchedAt: 0 };
      state.entries[key].data = data;
      state.entries[key].loading = false;
      state.entries[key].error = null;
      state.entries[key].lastFetchedAt = Date.now();
    },
    fetchError: (state, action: PayloadAction<{ key: string; error: string }>) => {
      const { key, error } = action.payload;
      state.entries[key] = state.entries[key] || { data: null, loading: false, error: null, lastFetchedAt: 0 };
      state.entries[key].loading = false;
      state.entries[key].error = error;
    },
  },
});

export const { fetchStart, fetchSuccess, fetchError } = apiSlice.actions;
export default apiSlice.reducer;