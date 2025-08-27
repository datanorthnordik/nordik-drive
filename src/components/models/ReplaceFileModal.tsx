import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { setFiles } from "../../store/auth/fileSlice";
import useFetch from "../../hooks/useFetch";

interface ReplaceFileModalProps {
  open: boolean;
  onClose: () => void;
  file: { id: number; filename: string, version: number } | null;
}

const ReplaceFileModal: React.FC<ReplaceFileModalProps> = ({ open, onClose, file }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {loading, fetchData, data} = useFetch("https://127.0.0.1:8080/file/replace", "POST")

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  useEffect(()=>{
    if(data) onClose()
  },[data])

  const handleReplace = async () => {
    if (!selectedFile || !file) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("id", String(file.id));
    fetchData(formData)
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* 👇 Dynamic heading */}
      <DialogTitle>
        {file ? `Replace ${file.filename}` : "Replace File"}
      </DialogTitle>

      <DialogContent>
        <Typography gutterBottom>
          Please select a new file to replace <b>{file?.filename}</b>.
        </Typography>

        <Box
          sx={{
            mt: 2,
            p: 3,
            border: "2px dashed #90caf9",
            borderRadius: "8px",
            textAlign: "center",
            cursor: "pointer",
            bgcolor: "#f7faff",
          }}
          onClick={() => document.getElementById("replace-file-input")?.click()}
        >
          <input
            id="replace-file-input"
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <CloudUploadIcon sx={{ fontSize: 40, color: "#42a5f5" }} />
          <Typography variant="body2" color="textSecondary">
            {selectedFile ? selectedFile.name : "Click or drag a file here"}
          </Typography>
        </Box>

        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleReplace}
          disabled={!selectedFile || loading}
          variant="contained"
          sx={{ bgcolor: "#42a5f5", "&:hover": { bgcolor: "#1e88e5" } }}
        >
          Replace
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReplaceFileModal;
