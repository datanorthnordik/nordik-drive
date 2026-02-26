import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlics";
import fileReducer from "./auth/fileSlice";
import roleReducer from "./auth/roleSlice";
import apiReducer from "./api/apiSlice";
import { apiMiddleware } from "./middleware/apiMiddleware";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    file: fileReducer,
    role: roleReducer,
    api: apiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;