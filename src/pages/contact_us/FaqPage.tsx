import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBackRounded,
  ExpandMore,
  HelpOutline,
  MailOutline,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { CONTACT_FAQS } from "./constants";
import {
  color_black_light,
  color_border,
  color_light_gray,
  color_secondary_dark,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
  header_height,
  header_mobile_height,
} from "../../constants/colors";

const FaqPage = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = React.useState<number>(0);

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
          px: { xs: 2, sm: 3, md: 4 },
          maxWidth: { xs: "100%", md: 1000, lg: 1080 },
        }}
      >
        <Stack spacing={{ xs: 2.5, md: 3 }}>
          <Button
            onClick={() => navigate("/contact-us")}
            startIcon={<ArrowBackRounded />}
            sx={{
              alignSelf: "flex-start",
              borderRadius: "14px",
              px: 2.2,
              py: 1.15,
              textTransform: "none",
              fontWeight: 900,
              fontSize: 15.5,
              color: color_secondary_dark,
              background: color_white,
              border: `1px solid ${color_border}`,
              boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
              "&:hover": {
                background: color_white,
              },
            }}
          >
            Back to Contact Us
          </Button>

          <Card
            sx={{
              borderRadius: 3,
              background: color_white,
              border: `1px solid rgba(0,0,0,0.06)`,
              boxShadow: "0 18px 34px rgba(0,0,0,0.10)",
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ px: { xs: 2.4, md: 4 }, py: { xs: 2.8, md: 3.8 } }}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                  mb: { xs: 2.2, md: 2.8 },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    minWidth: 52,
                    borderRadius: "16px",
                    background: color_white_smoke,
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${color_border}`,
                    boxShadow: "0 10px 18px rgba(0, 58, 122, 0.08)",
                  }}
                >
                  <HelpOutline sx={{ color: color_secondary_dark, fontSize: 28 }} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 28, md: 34 },
                      fontWeight: 900,
                      color: color_text_primary,
                      lineHeight: 1.12,
                      letterSpacing: 0.2,
                      mb: 0.9,
                    }}
                  >
                    Frequently Asked Questions
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: 15.2, md: 16.2 },
                      lineHeight: 1.8,
                      color: color_text_secondary,
                      fontWeight: 700,
                      maxWidth: 760,
                    }}
                  >
                    These answers are here to make the website easier to use. Select any question
                    below to open the full answer.
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={1.3}>
                {CONTACT_FAQS.map((item, index) => {
                  const isExpanded = expandedFaq === index;

                  return (
                    <Accordion
                      key={item.question}
                      disableGutters
                      elevation={0}
                      expanded={isExpanded}
                      onChange={(_, nextExpanded) => setExpandedFaq(nextExpanded ? index : -1)}
                      sx={{
                        borderRadius: "18px !important",
                        overflow: "hidden",
                        border: `1px solid ${isExpanded ? color_secondary_dark : color_border}`,
                        background: isExpanded ? color_white : color_white_smoke,
                        boxShadow: isExpanded
                          ? "0 14px 24px rgba(0, 58, 122, 0.10)"
                          : "0 8px 16px rgba(0, 0, 0, 0.04)",
                        transition: "all 0.2s ease",
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              background: isExpanded ? color_secondary_dark : color_white,
                              border: `1px solid ${isExpanded ? color_secondary_dark : color_border}`,
                            }}
                          >
                            <ExpandMore
                              sx={{
                                color: isExpanded ? color_white : color_secondary_dark,
                                fontSize: 22,
                              }}
                            />
                          </Box>
                        }
                        sx={{
                          px: { xs: 1.8, md: 2.2 },
                          py: 0.65,
                          minHeight: { xs: 78, md: 84 },
                          "& .MuiAccordionSummary-content": {
                            my: 1,
                            pr: 1.25,
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: { xs: 17, md: 18.2 },
                            fontWeight: 900,
                            color: color_text_primary,
                            lineHeight: 1.45,
                          }}
                        >
                          {item.question}
                        </Typography>
                      </AccordionSummary>

                      <AccordionDetails
                        sx={{
                          px: { xs: 1.8, md: 2.2 },
                          pb: 2.2,
                          pt: 0,
                        }}
                      >
                        <Box
                          sx={{
                            borderTop: `1px solid ${color_border}`,
                            pt: 1.6,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: { xs: 15.4, md: 16.2 },
                              lineHeight: 1.8,
                              color: color_text_secondary,
                              fontWeight: 700,
                            }}
                          >
                            {item.answer}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              background: color_white,
              border: `1px solid rgba(0,0,0,0.06)`,
              boxShadow: "0 14px 28px rgba(0,0,0,0.08)",
            }}
          >
            <CardContent sx={{ px: { xs: 2.4, md: 3.5 }, py: { xs: 2.4, md: 2.8 } }}>
              <Box sx={{ display: "flex", gap: 1.4, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    borderRadius: "14px",
                    background: color_white_smoke,
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${color_border}`,
                  }}
                >
                  <MailOutline sx={{ color: color_secondary_dark, fontSize: 24 }} />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 20, md: 22 },
                      fontWeight: 900,
                      color: color_black_light,
                      mb: 0.7,
                    }}
                  >
                    Still need help?
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: 14.8, md: 15.4 },
                      lineHeight: 1.8,
                      color: color_text_secondary,
                      fontWeight: 700,
                      mb: 1.6,
                    }}
                  >
                    If your question is not answered here, please visit the contact page and reach
                    out to the team for support.
                  </Typography>

                  <Button
                    onClick={() => navigate("/contact-us")}
                    sx={{
                      textTransform: "none",
                      borderRadius: "14px",
                      px: 2.4,
                      py: 1.1,
                      fontWeight: 900,
                      fontSize: 15.5,
                      background: color_secondary_dark,
                      color: color_white,
                      boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
                      "&:hover": {
                        background: color_secondary_dark,
                      },
                    }}
                  >
                    Go to Contact Us
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default FaqPage;
