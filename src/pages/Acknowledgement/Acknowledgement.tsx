import React from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import { color_primary, color_secondary, header_height, header_mobile_height } from '../../constants/colors';

const Acknowledgement = () => {
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
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Card
                    sx={{
                        maxWidth: 1100,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 3,
                        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}
                >
                    <CardContent sx={{ p: { xs: 4, md: 8 } }}>
                        <Typography
                            variant="h3"
                            sx={{
                                color: color_primary,
                                fontWeight: 500,
                                mb: 4,
                                fontSize: { xs: '2rem', md: '3rem' }, // responsive title
                                background: `linear-gradient(135deg, ${color_primary} 0%, ${color_secondary} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                textAlign: 'center',
                            }}
                        >
                            Acknowledgement
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                lineHeight: 2,
                                fontSize: { xs: '1.4rem', md: '1.8rem' }, // slightly bigger on desktop
                                textAlign: 'justify',
                                color: '#1a1a1a',
                            }}
                        >
                            The Children of Shingwauk Alumni Association’s (CSAA) mission is to provide for the
                            well-being of the Children of Shingwauk Alumni who are former students of the Shingwauk
                            and Wawanosh Indian Residential Schools, their families and their communities.
                            The CSAA facilitates the ongoing development of a partnership with Algoma University
                            and the other partners in fulfilling Chief Shingwauk’s vision of “Sharing, Healing and Learning.”
                            The CSAA provides: A non-political voice for survivors concerns and interests to support, promote &
                            enhance healing and reconciliation
                        </Typography>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Acknowledgement;
