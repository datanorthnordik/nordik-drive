import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ token: string; user?: User }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user || null;
    },
    clearAuth: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
