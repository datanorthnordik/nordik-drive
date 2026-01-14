import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  phonenumber?:string;
  role?:string;
  community?: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  checked: boolean; 
}

const initialState: AuthState = {
  token: null,
  user: null,
  checked: false,
};

const authSlice = createSlice({
  name: "auth",
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
    setChecked: (state, action: PayloadAction<boolean>) => {
      state.checked = action.payload;
    },
  },
});

export const { setAuth, clearAuth, setChecked } = authSlice.actions;
export default authSlice.reducer;
