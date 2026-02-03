// ContactUs.tsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Email, Phone, LocationOn, Business } from "@mui/icons-material";
import { WebLink } from "../../components/Links";
import { contact } from "../../constants/constants";
import {
  color_white,
  color_light_gray,
  color_white_smoke,
  color_secondary,
  color_secondary_dark,
  color_border,
  color_text_primary,
  color_text_secondary,
  color_black_light,
  header_height,
  header_mobile_height,
} from "../../constants/colors";

const ContactUs = () => {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

  const onJoinHere = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // Single source of truth for the RIGHT side content width
  // (text line width == button width)
  const RIGHT_BLOCK_MAX = 560;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${color_white_smoke} 0%, ${color_light_gray} 100%)`,
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          pt: {
            xs: `calc(${header_mobile_height} + 2.2rem)`,
            md: `calc(${header_height} + 2.6rem)`,
          },
          pb: { xs: 4, md: 6 },
          width: "100%",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },

          // Good for production: prevent ultra-wide stretching
          // (keeps cards readable + consistent on big screens)
          maxWidth: { xs: "100%", md: 1180, lg: 1260 },

          //  KEY FIX: Make large screens look premium
          // Vertically center the content area (but don't break small screens)
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          // header padding is already in pt; this ensures the grid area fills remaining space
          minHeight: {
            xs: "auto",
            md: `calc(100vh - ${header_height} - 5.2rem)`,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "stretch", //  equal visual weight
          }}
        >
          {/* LEFT CARD */}
          <Card
            sx={{
              width: "100%",
              height: "fit-content",
              borderRadius: 2,
              background: color_white,
              border: `1px solid rgba(0,0,0,0.06)`,
              boxShadow: "0 18px 34px rgba(0,0,0,0.10)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* blue accent bar */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 6,
                background: color_secondary_dark,
              }}
            />

            <CardContent
              sx={{
                px: { xs: 3, md: 4 },
                py: { xs: 3, md: 3.5 },
                ml: "6px",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 28, md: 34 },
                  fontWeight: 900,
                  color: color_text_primary,
                  mb: 1.2,
                  letterSpacing: 0.2,
                }}
              >
                Get in Touch
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: 14.2, md: 14.6 },
                  lineHeight: 1.6,
                  color: color_text_secondary,
                  mb: 2.4,
                  fontWeight: 700, //  make left texts bolder
                }}
              >
                We&apos;re here to help answer your questions. Community impact can be complicated, our
                researchers are on hand to help discuss every aspect of your project.
              </Typography>

              <Stack spacing={1.6}>
                <Box sx={{ display: "flex", gap: 1.4, alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.2,
                      background: color_white_smoke,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${color_border}`,
                    }}
                  >
                    <Business sx={{ color: color_secondary_dark, fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 900, color: color_black_light }}>
                      Contact:
                    </Typography>
                    <Typography sx={{ fontSize: 12.8, fontWeight: 700, color: color_text_secondary }}>
                      Administration Office
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1.4, alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.2,
                      background: color_white_smoke,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${color_border}`,
                    }}
                  >
                    <LocationOn sx={{ color: color_secondary_dark, fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 900, color: color_black_light }}>
                      Community support team
                    </Typography>
                    <Typography sx={{ fontSize: 12.8, fontWeight: 700, color: color_text_secondary }}>
                      {contact.address}
                    </Typography>
                    <Typography sx={{ fontSize: 12.8, fontWeight: 700, color: color_text_secondary }}>
                      {contact.street}
                    </Typography>
                    <Typography sx={{ fontSize: 12.8, fontWeight: 700, color: color_text_secondary }}>
                      Sault Ste. Marie P6A 2G4
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1.4, alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.2,
                      background: color_white_smoke,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${color_border}`,
                    }}
                  >
                    <Phone sx={{ color: color_secondary_dark, fontSize: 18 }} />
                  </Box>
                  <Typography sx={{ fontSize: 13.2, fontWeight: 900, color: color_black_light }}>
                    T: {contact.telephone}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1.4, alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.2,
                      background: color_white_smoke,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${color_border}`,
                    }}
                  >
                    <Email sx={{ color: color_secondary_dark, fontSize: 18 }} />
                  </Box>

                  <Typography
                    sx={{
                      fontSize: 13.2,
                      fontWeight: 900,
                      color: color_secondary_dark,
                    }}
                  >
                    E:{" "}
                    <Box
                      component="span"
                      sx={{
                        textDecoration: "underline",
                        cursor: "pointer",
                        "&:hover": { color: color_secondary },
                      }}
                      onClick={() => window.open(`mailto:${contact.email}`)}
                    >
                      {contact.email}
                    </Box>
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* RIGHT CARD */}
          <Card
            sx={{
              width: "100%",
              height: "fit-content",
              borderRadius: 2,
              background: color_white,
              border: `1px solid rgba(0,0,0,0.06)`,
              boxShadow: "0 18px 34px rgba(0,0,0,0.10)",
            }}
          >
            <CardContent sx={{ px: { xs: 2.5, md: 3.5 }, py: { xs: 2.8, md: 3.2 } }}>
              {/*  ONE wrapper controls BOTH text + button width */}
              <Stack spacing={3.2} sx={{ width: "100%", maxWidth: RIGHT_BLOCK_MAX, mx: "auto" }}>
                {/* Block 1 */}
                <Box sx={{ width: "100%" }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 18, md: 20 },
                      fontWeight: 900,
                      color: color_text_primary,
                      mb: 1.4,
                    }}
                  >
                    Interested in becoming a member of{" "}
                    <WebLink href="https://childrenofshingwauk.org/" target="_blank">
                      CSSA?
                    </WebLink>
                  </Typography>

                  <Button
                    onClick={() => onJoinHere("https://childrenofshingwauk.org/contact-us/")}
                    sx={{
                      width: "100%", //  same width as the Typography block
                      height: 56,
                      borderRadius: 1.6,
                      background: color_secondary_dark,
                      color: color_white,
                      fontWeight: 900,
                      letterSpacing: 1,
                      fontSize: 16,
                      boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
                      "&:hover": { background: color_secondary_dark },
                    }}
                  >
                    JOIN HERE
                  </Button>
                </Box>

                {/* Block 2 */}
                <Box sx={{ width: "100%" }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 18, md: 20 },
                      fontWeight: 900,
                      color: color_text_primary,
                      mb: 1.4,
                    }}
                  >
                    Interested in becoming a member of{" "}
                    <WebLink href="https://nordikinstitute.com/" target="_blank">
                      NORDIK Institute?
                    </WebLink>
                  </Typography>

                  <Button
                    onClick={() =>
                      onJoinHere(
                        "https://forms.monday.com/forms/1b4f6c260a6c3f24010ae7e9d5414a5c?r=use1"
                      )
                    }
                    sx={{
                      width: "100%", //  same width as the Typography block
                      height: 56,
                      borderRadius: 1.6,
                      background: color_secondary_dark,
                      color: color_white,
                      fontWeight: 900,
                      letterSpacing: 1,
                      fontSize: 16,
                      boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
                      "&:hover": { background: color_secondary_dark },
                    }}
                  >
                    JOIN HERE
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactUs;
