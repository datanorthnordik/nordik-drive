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

  // existing
  color_white,
  color_black,
  color_text_primary,
  color_text_secondary,

  // new constants you’ll add
  color_card_border_soft,
  color_overlay_white_80,
  color_public_accent,
  color_confidential_accent,
  color_public_badge_bg,
  color_confidential_badge_bg,
  color_badge_text_on_dark,
  color_public_card_bg,
  color_confidential_card_bg,
  color_public_icon_bg,
  color_confidential_icon_bg,
  color_focus_ring,
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

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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

    const accent = isConfidential ? color_confidential_accent : color_public_accent;
    const cardBg = isConfidential ? color_confidential_card_bg : color_public_card_bg;
    const iconBg = isConfidential ? color_confidential_icon_bg : color_public_icon_bg;
    const badgeBg = isConfidential ? color_confidential_badge_bg : color_public_badge_bg;

    const a11yLabel = `${file.filename}. ${isConfidential ? "Confidential" : "Public"}. ${
      isSelected ? "Selected" : "Not selected"
    }.`;

    return (
      <Card
        role="button"
        key={file.filename}
        aria-label={a11yLabel}
        aria-pressed={isSelected}
        tabIndex={0}
        onClick={() => onSelectFile(file)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectFile(file);
          }
        }}
        onFocus={() => speak(`${file.filename}, ${isConfidential ? "Confidential" : "Public"}`)}
        sx={{
          cursor: "pointer",
          borderRadius: 2,
          borderLeft: `6px solid ${accent}`,
          backgroundColor: cardBg,

          border: isSelected ? `2px solid ${accent}` : `1px solid ${color_card_border_soft}`,
          boxShadow: isSelected ? `0 0 0 3px ${hexToRgba(accent, 0.18)}` : "none",

          transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
          "&:hover": {
            borderColor: accent,
            transform: "translateY(-1px)",
          },

          // Strong keyboard focus ring (not color-only: it’s a visible outline)
          "&:focus-visible": {
            outline: `3px solid ${color_focus_ring}`,
            outlineOffset: "3px",
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
        >
          {/* Icon (already a non-color cue) */}
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              backgroundColor: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              flexShrink: 0,
            }}
          >
            {isConfidential ? <LockIcon /> : <FolderIcon />}
          </Box>

          {/* Text */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                mb: 0.5,
                color: color_text_primary,
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
                fontWeight: 700,

                // High-contrast badge (passes better than white on bright orange/red)
                backgroundColor: badgeBg,
                color: color_badge_text_on_dark,

                // Add border to help in low-saturation situations
                border: `1px solid ${hexToRgba(color_black, 0.12)}`,
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
              ${hexToRgba(color_secondary, 0.1)} 0%,
              ${hexToRgba(color_primary, 0.06)} 25%,
              ${hexToRgba(color_secondary, 0.04)} 50%,
              ${hexToRgba(color_primary, 0.08)} 75%,
              ${hexToRgba(color_secondary, 0.05)} 100%
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
            backgroundColor: color_overlay_white_80,
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
                  fontWeight: 800,
                  color: color_text_primary,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <FolderIcon sx={{ color: color_secondary }} />
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
                  fontWeight: 800,
                  color: color_text_primary,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <LockIcon sx={{ color: color_secondary }} />
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
