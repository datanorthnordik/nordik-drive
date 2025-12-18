import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import FolderIcon from '@mui/icons-material/Folder';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store/store';
import { setSelectedFile } from '../../store/auth/fileSlice';
import { color_primary, color_secondary, header_height, header_mobile_height } from '../../constants/colors';

import useFetch from '../../hooks/useFetch';
import Loader from '../../components/Loader';
import PasswordModal from '../../components/models/PasswordModal';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { loading, error, fetchData, data: files } = useFetch<{ files: FileType[] }>("https://nordikdriveapi-724838782318.us-west1.run.app/api/file", "GET", false);
  const { selectedFile } = useSelector((state: RootState) => state.file);

  const [voiceEnabled, setVoiceEnabled] = useState(false);
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

  const openPasswordModal = (file: FileType) => {
    setPasswordModalOpen(true);
  };

  const closePasswordModal = (success: boolean) => {
    if (success) {
      setPasswordModalOpen(false);
      navigate('/dataview');
      speak(`Selected file ${selectedFile?.filename}`);
    } else {
      dispatch(setSelectedFile({ selected: null }));
      setPasswordModalOpen(false);
    }
  };

  const onSelectFile = (file: FileType) => {
    if (file.private) {
      openPasswordModal(file);
      dispatch(setSelectedFile({ selected: { filename: file.filename,id: file.id, version: file.version, community_filter: file.community_filter } }));
    } else {
      dispatch(setSelectedFile({ selected: { filename: file.filename, id: file.id, version: file.version, community_filter: file.community_filter  } }));
      speak(`Selected file ${file.filename}`);
      navigate('/dataview');
    }
  };

  const confidentialFiles = files?.files?.filter((file: FileType) => file.private) || [];
  const publicFiles = files?.files?.filter((file: FileType) => !file.private) || [];

  const renderFileCard = (file: FileType, isConfidential: boolean) => {
    const isSelected = file.filename === selectedFile?.filename;
    return (
      <Card
        onClick={() => onSelectFile(file)}
        sx={{
          cursor: 'pointer',
          border: isSelected ? `3px solid ${color_primary}` : '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          background: isConfidential
            ? 'linear-gradient(135deg, rgba(255,234,234,0.95) 0%, rgba(255,245,245,0.9) 100%)'
            : 'linear-gradient(135deg, rgba(240,247,255,0.95) 0%, rgba(248,250,255,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: isSelected
            ? '0 15px 35px rgba(166,29,51,0.4)'
            : '0 8px 32px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)', // was -8px
            boxShadow: isConfidential
              ? '0 20px 40px rgba(220,53,69,0.3)'
              : '0 20px 40px rgba(0,75,156,0.3)',
          },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px', // was 4px
            background: isConfidential
              ? `linear-gradient(90deg, #dc3545 0%, ${color_primary} 100%)`
              : `linear-gradient(90deg, ${color_secondary} 0%, ${color_primary} 100%)`,
          },
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,     // was 2
            p: 2,         // was 3
            '&:last-child': { pb: 2 },
          }}
          tabIndex={0}
          onFocus={() => speak(`${file.filename}, ${isConfidential ? 'Confidential' : 'Public'}`)}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 46,   // was 56
              height: 46,  // was 56
              borderRadius: 2,
              background: isConfidential
                ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                : `linear-gradient(135deg, ${color_secondary} 0%, ${color_primary} 100%)`,
              color: 'white',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              flexShrink: 0,
            }}
          >
            {isConfidential ? <LockIcon sx={{ fontSize: 22 }} /> : <FolderIcon sx={{ fontSize: 22 }} />}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: isConfidential ? '#721c24' : color_primary,
                mb: 0.5,
                wordBreak: 'break-word',
                fontSize: { xs: '1rem', md: '1.05rem' }, // smaller
                lineHeight: 1.25,
              }}
            >
              {file.filename}
            </Typography>
            <Chip
              label={isConfidential ? 'Confidential' : 'Public'}
              size="small"
              sx={{
                backgroundColor: isConfidential ? 'rgba(220,53,69,0.1)' : 'rgba(0,75,156,0.1)',
                color: isConfidential ? '#721c24' : color_secondary,
                fontWeight: 500,
                border: `1px solid ${isConfidential ? 'rgba(220,53,69,0.3)' : 'rgba(0,75,156,0.3)'}`,
                fontSize: '0.78rem', // slightly smaller
                height: 24,          // tighter chip
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
          position: 'relative',
          overflow: 'hidden',

          // Background layers: gradient on top of image
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
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',

          // Semi-transparent white overlay using ::after
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // white transparent overlay
            zIndex: 0,
          },

          // Content above everything
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        }}
      >

        <Container
          maxWidth="xl"
          sx={{
            // was + 2rem, reduced to + 1.25rem
            pt: { xs: `calc(${header_mobile_height} + 1.25rem)`, md: `calc(${header_height} + 1.25rem)` },
            pb: 3, // was 4
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Public Files */}
          {publicFiles.length > 0 && (
            <Box sx={{ mb: 4 }}> {/* was 6 */}
              <Typography
                variant="h4"
                sx={{
                  mb: 2, // was 3
                  color: color_primary,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  background: `linear-gradient(135deg, ${color_primary} 0%, ${color_secondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',

                  // ✅ smaller title but keep h4
                  fontSize: { xs: '1.8rem', sm: '2rem', md: '2.2rem' },
                  lineHeight: 1.15,
                }}
              >
                📂 Community Records
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 2, // was 3
                }}
              >
                {publicFiles.map((file: FileType) => renderFileCard(file, false))}
              </Box>
            </Box>
          )}

          {/* Confidential Files */}
          {confidentialFiles.length > 0 && (
            <Box>
              <Typography
                variant="h4"
                sx={{
                  mb: 2, // was 3
                  color: '#721c24',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  background: 'linear-gradient(135deg, #dc3545 0%, #A61D33 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',

                  // ✅ smaller title but keep h4
                  fontSize: { xs: '1.8rem', sm: '2rem', md: '2.2rem' },
                  lineHeight: 1.15,
                }}
              >
                🔒 Community Records (Confidential)
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 2, // was 3
                }}
              >
                {confidentialFiles.map((file: FileType) => renderFileCard(file, true))}
              </Box>
            </Box>
          )}

          {passwordModalOpen && (
            <PasswordModal
              open={passwordModalOpen}
              closePasswordModal={closePasswordModal}
            />
          )}
        </Container>
      </Box>
    </>
  );
};

export default FileList;
