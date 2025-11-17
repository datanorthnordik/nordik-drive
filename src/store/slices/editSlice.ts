import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EditedField {
    rowIndex: number;
    field: string;
    oldValue: any;
    newValue: any;
}

interface EditState {
    isEditing: boolean;
    pendingChanges: {[key: string]: EditedField};
    adminApproved: boolean;
    error: string | null;
}

const initialState: EditState = {
    isEditing: false,
    pendingChanges: {},
    adminApproved: false,
    error: null
};

const editSlice = createSlice({
    name: 'edit',
    initialState,
    reducers: {
        startEditing(state, action: PayloadAction<{[key: string]: EditedField}>) {
            state.isEditing = true;
            state.pendingChanges = action.payload;
            state.adminApproved = false;
            state.error = null;
        },
        
        saveEdit(state) {
            // Reset editing state but keep changes pending admin approval
            state.isEditing = false;
            state.error = null;
        },
        
        approveEdit(state) {
            state.adminApproved = true;
            state.pendingChanges = {};
            state.error = null;
        },
        
        rejectEdit(state, action: PayloadAction<string>) {
            state.adminApproved = false;
            state.error = action.payload;
            state.pendingChanges = {};
        },
        
        cancelEdit(state) {
            return initialState;
        },

        clearError(state) {
            state.error = null;
        }
    }
});

// Export actions
export const {
    startEditing,
    saveEdit,
    approveEdit,
    rejectEdit,
    cancelEdit,
    clearError
} = editSlice.actions;

// Selector to get pending changes
export const selectPendingChanges = (state: { edit: EditState }) => state.edit.pendingChanges;

// Selector to check if any changes are pending approval
export const selectHasPendingChanges = (state: { edit: EditState }) => 
    Object.keys(state.edit.pendingChanges).length > 0;

// Selector to get approval status
export const selectIsApproved = (state: { edit: EditState }) => state.edit.adminApproved;

// Export reducer
export default editSlice.reducer;