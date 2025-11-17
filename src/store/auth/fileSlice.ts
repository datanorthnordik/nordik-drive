import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectedFile {
    filename: string;
    id: number;
    version: string;
    community_filter: boolean;
    communities?: string[];
}

interface File {
    id: number;
    filename: string;
    inserted_by: number;
    created_at: string;
    file_data: any;
}

interface FileState {
    selectedFile: SelectedFile | null;
    files: File[];
    communities: string[];           // all available communities derived from data
    selectedCommunities: string[];   // user-selected communities for filtering
}

const initialState: FileState = {
   selectedFile: null,
   files: [],
   communities: [],
   selectedCommunities: []
};

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setSelectedFile: (state, action: PayloadAction<{ selected: SelectedFile | null }>) => {
      state.selectedFile = action.payload.selected;
    },
    clearSelectedFile: (state) => {
      state.selectedFile = null;
    },
    setFiles: (state, action: PayloadAction<{ files: File[] }>) => {
        state.files = action.payload.files;
    },
    // set available communities (from DataTable)
    setCommunities: (state, action: PayloadAction<{ communities: string[] }>) => {
        state.communities = action.payload.communities || [];
    },
    // set user selected communities used for filtering rows
    setSelectedCommunities: (state, action: PayloadAction<{ selected: string[] }>) => {
        state.selectedCommunities = action.payload.selected || [];
    },
  }
});

export const { setSelectedFile, clearSelectedFile, setFiles, setCommunities, setSelectedCommunities } = fileSlice.actions;
export default fileSlice.reducer;
