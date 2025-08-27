'use client';
import React, { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import { FileListWrapper } from "../../components/Wrappers";
import { Typography, Card, CardContent, Switch, Box} from "@mui/material"
import LockIcon from "@mui/icons-material/Lock";
import FolderIcon from "@mui/icons-material/Folder";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import { setSelectedFile } from "../../store/auth/fileSlice";
import { color_primary, color_secondary } from "../../constants/colors";
import PasswordModal from "../../components/models/PasswordModal";

const FileList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, fetchData, data: files } = useFetch("https://127.0.0.1:8080/file", "GET", false);
  const { selectedFile } = useSelector((state: any) => state.file);

  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  

  useEffect(() => { fetchData(null); }, []);

  const speak = (text: string) => {
    if (voiceEnabled && window.speechSynthesis) {
      const msg = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(msg);
    }
  };

  const openPasswordModal = (file: any) => {
    setPasswordModalOpen(true);
  };

  const closePasswordModal = (success: boolean) => {
    if(success) {
      setPasswordModalOpen(false);
      navigate("/dataview")
      speak(`Selected file ${selectedFile.filename}`)
    } else {
      dispatch(setSelectedFile({ selected: null }));
      setPasswordModalOpen(false);
    }
  };

  

  const onSelectFile = (file: any) => {
    if (file.private) {
      openPasswordModal(file);
      dispatch(setSelectedFile({ selected: { filename: file.filename, version: file.version } }));
    } else {
      dispatch(setSelectedFile({ selected: { filename: file.filename, version: file.version } }));
      speak(`Selected file ${file.filename}`);
      navigate("/dataview");
    }
  };

  const confidentialFiles = (files as any)?.files?.filter((file: any) => file.private) || [];
  const publicFiles = (files as any)?.files?.filter((file: any) => !file.private) || [];

  const renderFileCard = (file: any, isConfidential: boolean) => {
    const isSelected = file.filename === selectedFile?.filename;
    return (
      <Card
        key={file.filename}
        onClick={() => onSelectFile(file)}
        sx={{
          cursor: "pointer",
          border: isSelected ? `2px solid ${color_primary}` : "1px solid #ddd",
          borderRadius: "12px",
          boxShadow: isSelected ? "0 0 10px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.1)",
          backgroundColor: isConfidential ? "#ffeaea" : "#f0f7ff",
          transition: "all 0.2s ease",
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },
        }}
      >
        <CardContent style={{ display: "flex", alignItems: "center", gap: "16px" }} tabIndex={0} onFocus={() => speak(`${file.filename}, ${isConfidential ? "Confidential" : "Public"}`)}>
          {isConfidential ? <LockIcon style={{ fontSize: 36, color: "red" }} /> : <FolderIcon style={{ fontSize: 36, color: color_primary }} />}
          <Typography variant="h6" style={{ fontWeight: "bold" }}>{file.filename}</Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <FileListWrapper style={{ position: "relative" }}>
      {/* Voice Toggle */}
      <Box style={{ position: "absolute", top: 10, right: 10, zIndex: 10, backgroundColor: "#ffffffcc", padding: "6px 10px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Switch checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} color="primary" size="small" />
        <Typography variant="body2">Voice</Typography>
      </Box>

      {/* Confidential Files */}
      {confidentialFiles.length > 0 && (
        <div style={{ width: "100%", marginTop: "30px" }}>
          <Typography variant="h5" style={{ marginBottom: "10px", color: "red" }}>🔒 Confidential Files</Typography>
          <Typography variant="body2" style={{ marginBottom: "15px", color: "#666" }}>Only authorized users can view these files.</Typography>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
            {confidentialFiles.map((file: any) => renderFileCard(file, true))}
          </div>
        </div>
      )}

      {/* Public Files */}
      {publicFiles.length > 0 && (
        <div style={{ width: "100%", marginTop: "40px" }}>
          <Typography variant="h5" style={{ marginBottom: "10px", color: color_primary }}>📂 Public Files</Typography>
          <Typography variant="body2" style={{ marginBottom: "15px", color: "#666" }}>These files are available to all users.</Typography>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
            {publicFiles.map((file: any) => renderFileCard(file, false))}
          </div>
        </div>
      )}

      {passwordModalOpen && <PasswordModal open={passwordModalOpen} closePasswordModal={closePasswordModal}/>}
      
    </FileListWrapper>
  );
};

export default FileList;
