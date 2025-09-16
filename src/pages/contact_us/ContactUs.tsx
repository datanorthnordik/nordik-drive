import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Email, Phone, LocationOn, Business } from '@mui/icons-material';
import { contact } from '../../constants/constants';
import { color_primary, color_secondary, header_height, header_mobile_height } from '../../constants/colors';
import { WebLink } from '../../components/Links';

const ContactUs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const onJoinHere = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          linear-gradient(
            135deg,
            rgba(166, 29, 51, 0.12) 0%,
            rgba(0, 75, 156, 0.08) 30%,
            rgba(166, 29, 51, 0.06) 70%,
            rgba(0, 75, 156, 0.04) 100%
          ),
          url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='circles' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='20' cy='20' r='2' fill='%23A61D33' fill-opacity='0.03'/%3E%3Ccircle cx='20' cy='20' r='6' fill='none' stroke='%23004B9C' stroke-width='0.5' stroke-opacity='0.04'/%3E%3Ccircle cx='20' cy='20' r='12' fill='none' stroke='%23A61D33' stroke-width='0.3' stroke-opacity='0.02'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='120' height='120' fill='url(%23circles)'/%3E%3C/svg%3E"),
          radial-gradient(circle at 15% 85%, rgba(0, 75, 156, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 85% 15%, rgba(166, 29, 51, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 50% 50%, rgba(0, 75, 156, 0.05) 0%, transparent 60%)
        `,
        backgroundAttachment: 'fixed',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          pt: { xs: `calc(${header_mobile_height} + 3rem)`, md: `calc(${header_height} + 3rem)` },
          pb: 6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 5,
            justifyContent: 'center',
          }}
        >
          {/* Contact Information Section */}
          <Card
            sx={{
              flex: 1,
              minWidth: 360,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <CardContent sx={{ p: 5 }}>
              <Typography
                variant="h3"
                sx={{
                  color: color_primary,
                  fontWeight: 500,
                  mb: 4,
                  fontSize: '3rem',
                  background: `linear-gradient(135deg, ${color_primary} 0%, ${color_secondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Get in Touch
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  lineHeight: 2.2,
                  mb: 4,
                  fontSize: '1.6rem',
                  textAlign: 'justify',
                  color: '#1a1a1a',
                }}
              >
                We're here to help answer your questions. Community impact can be complicated, our researchers are on hand to help discuss every aspect of your project.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Business sx={{ color: color_primary, fontSize: '2.5rem' }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '1.6rem' }}>Contact:</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, ml: 1 }}>
                  <LocationOn sx={{ color: color_secondary, fontSize: '2rem', mt: 0.5 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '1.5rem' }}>{contact.name}</Typography>
                    <Typography sx={{ fontSize: '1.5rem' }}>{contact.address}</Typography>
                    <Typography sx={{ fontSize: '1.5rem' }}>{contact.street}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                  <Phone sx={{ color: color_secondary, fontSize: '2rem' }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '1.5rem' }}>T: {contact.telephone}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                  <Email sx={{ color: color_secondary, fontSize: '2rem' }} />
                  <Typography
                    sx={{
                      color: color_secondary,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '1.5rem',
                      '&:hover': { color: color_primary },
                    }}
                  >
                    E: {contact.email}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Subscribe Section */}
          <Card
            sx={{
              flex: 1,
              minWidth: 360,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <CardContent sx={{ p: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Typography
                sx={{
                  color: color_primary,
                  fontWeight: 400,
                  lineHeight: 2,
                  textAlign: 'justify',
                  fontSize: '1.6rem',
                }}
              >
                Interested in becoming a member of{' '}
                <WebLink href="https://childrenofshingwauk.org/" target="_blank">
                  CSSA?
                </WebLink>
              </Typography>

              <Button
                onClick={() => onJoinHere("https://childrenofshingwauk.org/")}
                variant="contained"
                sx={{
                  fontSize: '1.6rem',
                  lineHeight: 2.2,
                  padding: '18px 36px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${color_primary} 0%, ${color_secondary} 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${color_secondary} 0%, ${color_primary} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(0,75,156,0.3)',
                  },
                }}
              >
                Join Here
              </Button>

              <Typography
                sx={{
                  color: color_primary,
                  fontWeight: 400,
                  lineHeight: 2,
                  textAlign: 'justify',
                  fontSize: '1.6rem',
                }}
              >
                Interested in becoming a member of{' '}
                <WebLink href="https://nordikinstitute.com/" target="_blank">
                  NORDIK Institute?
                </WebLink>
              </Typography>

              <Button
                onClick={() => onJoinHere("https://forms.monday.com/forms/1b4f6c260a6c3f24010ae7e9d5414a5c?r=use1")}
                variant="contained"
                sx={{
                  fontSize: '1.6rem',
                  lineHeight: 2.2,
                  padding: '18px 36px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${color_secondary} 0%, ${color_primary} 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${color_primary} 0%, ${color_secondary} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(166,29,51,0.3)',
                  },
                }}
              >
                Join Here
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactUs;
