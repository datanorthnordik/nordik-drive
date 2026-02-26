import { createAction, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Community {
  id?: number;
  name: string;
  approved?: boolean;
}

interface CommunitiesState {
  items: Community[];
  loading: boolean;
  error: string | null;
}

const initialState: CommunitiesState = {
  items: [],
  loading: false,
  error: null,
};

// dispatch this from components; middleware will fetch only if needed
export const ensureCommunities = createAction<{ force?: boolean } | undefined>("communities/ensure");

const communitiesSlice = createSlice({
  name: "communities",
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess: (state, action: PayloadAction<Community[]>) => {
      state.items = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    fetchError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch communities";
    },
  },
});

export const { fetchStart, fetchSuccess, fetchError } = communitiesSlice.actions;
export default communitiesSlice.reducer;