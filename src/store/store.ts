import { configureStore } from '@reduxjs/toolkit';
import authReducer from "./auth/authSlics"
import fileReducer from "./auth/fileSlice"
import roleReducer from "./auth/roleSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    file: fileReducer,
    role: roleReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
