import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import FolderIcon from "@mui/icons-material/Folder";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import { setSelectedFile } from "../../store/auth/fileSlice";
import {
  color_primary,
  color_secondary,
  header_height,
  header_mobile_height,
} from "../../constants/colors";

import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import PasswordModal from "../../components/models/PasswordModal";

interface FileType {
  filename: string;
  version: string;
  private: boolean;
  community_filter: boolean;
  id: number;
}

const FileList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { loading, fetchData, data: files } = useFetch<{ files: FileType[] }>(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file",
    "GET",
    false
  );

  const { selectedFile } = useSelector((state: RootState) => state.file);

  const [voiceEnabled] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const speak = (text: string) => {
    if (voiceEnabled && window.speechSynthesis) {
      const msg = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(msg);
    }
  };

  const openPasswordModal = () => {
    setPasswordModalOpen(true);
  };

  const closePasswordModal = (success: boolean) => {
    if (success) {
      setPasswordModalOpen(false);
      navigate("/dataview");
      speak(`Selected file ${selectedFile?.filename}`);
    } else {
      dispatch(setSelectedFile({ selected: null }));
      setPasswordModalOpen(false);
    }
  };

  const onSelectFile = (file: FileType) => {
    if (file.private) {
      openPasswordModal();
      dispatch(
        setSelectedFile({
          selected: {
            filename: file.filename,
            id: file.id,
            version: file.version,
            community_filter: file.community_filter,
          },
        })
      );
    } else {
      dispatch(
        setSelectedFile({
          selected: {
            filename: file.filename,
            id: file.id,
            version: file.version,
            community_filter: file.community_filter,
          },
        })
      );
      speak(`Selected file ${file.filename}`);
      navigate("/dataview");
    }
  };

  const allFiles = useMemo(() => files?.files || [], [files]);
  const publicFiles = useMemo(() => allFiles.filter((f) => !f.private), [allFiles]);
  const confidentialFiles = useMemo(() => allFiles.filter((f) => f.private), [allFiles]);

  const renderFileCard = (file: FileType, isConfidential: boolean) => {
    const isSelected = file.filename === selectedFile?.filename;

    return (
      <Card
        onClick={() => onSelectFile(file)}
        sx={{
          cursor: "pointer",
          borderRadius: 2,
          borderLeft: `5px solid ${isConfidential ? "#dc3545" : color_primary}`,
          backgroundColor: isConfidential ? "#fff5f5" : "#ffffff",
          border: isSelected
            ? `2px solid ${isConfidential ? "#dc3545" : color_primary}`
            : "1px solid rgba(0,0,0,0.08)",
          boxShadow: "none",
          transition: "border-color 0.2s ease",
          "&:hover": {
            borderColor: isConfidential ? "#dc3545" : color_primary,
          },
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            "&:last-child": { pb: 2 },
          }}
          tabIndex={0}
          onFocus={() =>
            speak(`${file.filename}, ${isConfidential ? "Confidential" : "Public"}`)
          }
        >
          {/* Icon */}
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              backgroundColor: isConfidential ? "#fde2e2" : "#e8f0fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isConfidential ? "#dc3545" : color_primary,
              flexShrink: 0,
            }}
          >
            {isConfidential ? <LockIcon /> : <FolderIcon />}
          </Box>

          {/* Text */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                mb: 0.5,
                color: "#1f2937",
                wordBreak: "break-word",
              }}
            >
              {file.filename}
            </Typography>

            <Chip
              label={isConfidential ? "CONFIDENTIAL" : "PUBLIC"}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.7rem",
                fontWeight: 600,
                backgroundColor: isConfidential ? "#dc3545" : "#e8f0fe",
                color: isConfidential ? "#fff" : color_primary,
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Loader loading={loading} />

      <Box
        sx={{
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",

          // Keep background image and overlay exactly as you have it
          backgroundImage: `
            linear-gradient(
              135deg,
              rgba(0, 75, 156, 0.1) 0%,
              rgba(166, 29, 51, 0.06) 25%,
              rgba(0, 75, 156, 0.04) 50%,
              rgba(166, 29, 51, 0.08) 75%,
              rgba(0, 75, 156, 0.05) 100%
            ),
            url("Copy of 2018 Reunion.jpg")
          `,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",

          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 0,
          },

          "& > *": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            pt: {
              xs: `calc(${header_mobile_height} + 1.25rem)`,
              md: `calc(${header_height} + 1.25rem)`,
            },
            pb: 4,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Public Section */}
          {publicFiles.length > 0 && (
            <Box sx={{ mb: 5 }}>
              <Typography
                sx={{
                  mb: 2.5,
                  fontSize: { xs: "1.6rem", sm: "1.9rem" },
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <FolderIcon sx={{ color: color_primary }} />
                Community Records
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {publicFiles.map((file) => renderFileCard(file, false))}
              </Box>
            </Box>
          )}

          {/* Confidential Section */}
          {confidentialFiles.length > 0 && (
            <Box>
              <Typography
                sx={{
                  mb: 2.5,
                  fontSize: { xs: "1.6rem", sm: "1.9rem" },
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <LockIcon sx={{ color: "#dc3545" }} />
                Community Records (Confidential)
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {confidentialFiles.map((file) => renderFileCard(file, true))}
              </Box>
            </Box>
          )}

          {passwordModalOpen && (
            <PasswordModal open={passwordModalOpen} closePasswordModal={closePasswordModal} />
          )}
        </Container>
      </Box>
    </>
  );
};

export default FileList;
