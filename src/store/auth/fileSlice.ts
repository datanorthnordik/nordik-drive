import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectedFile {
    filename: string
    community: string[]
}


interface File {
    id:  number
    filename: string
    inserted_by: number
    created_at: string;
    file_data: any 
}

interface AuthState {
    selectedFile: SelectedFile | null
    files: File[]
}

const initialState: AuthState = {
   selectedFile: null,
   files: []
};

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setSelectedFile: (state, action: PayloadAction<{ selected: SelectedFile }>) => {
      state.selectedFile = action.payload.selected
    },
    clearSelectedFile: (state) => {
      state.selectedFile = null
    },
    setFiles: (state, action: PayloadAction<{ files: File[] }>)=>{
        state.files = action.payload.files
    }
  },
});

export const { setSelectedFile, clearSelectedFile, setFiles } = fileSlice.actions;
export default fileSlice.reducer;
