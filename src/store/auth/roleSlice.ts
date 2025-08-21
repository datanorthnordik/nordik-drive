import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserRole {
    id: number
    role: string
    user_id:  number
    community_name: string | null
}

interface AuthState {
    userRoles: UserRole[]
    isAdmin: boolean
    isManager: boolean
}

const initialState: AuthState = {
   userRoles: [],
   isAdmin: false,
   isManager: false
};

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    setRoles: (state, action: PayloadAction<{ roles: UserRole[] }>) => {
      const adminRoles = action.payload.roles.filter(role=> role.role == "Admin")
      const managerRoles = action.payload.roles.filter(role=> role.role == "Manager")
      state.userRoles = action.payload.roles
      state.isAdmin = adminRoles.length > 0
      state.isManager = managerRoles.length > 0
    },
    clearRoles: (state) => {
      state.userRoles = []
    },
  },
});

export const { setRoles, clearRoles } = roleSlice.actions;
export default roleSlice.reducer;
