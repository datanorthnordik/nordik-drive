"use client";

import React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import {
  color_primary,
  color_secondary,
  color_secondary_dark,
  color_border,
  color_white,
  color_light_gray,
  color_white_smoke,
  color_text_primary,
  color_text_secondary,
  color_text_light,
  color_background,
  color_blue_lightest,
  color_blue_light,
  color_focus_ring,
  shadow_auth_button,
} from "../../../constants/colors";
import { ReviewItem, AdditionalDocItem } from "./types";
import { DOCUMENT_CATEGORY_OPTIONS } from "./constants";
import {
  getReviewDialogArchiveConsentLabel,
  getReviewDialogDocsChipLabel,
  getReviewDialogPhotoConsentLabel,
  getReviewDialogPhotosChipLabel,
  REVIEW_DIALOG_ATTACHMENTS_SUBTITLE,
  REVIEW_DIALOG_ATTACHMENTS_TITLE,
  REVIEW_DIALOG_BACK_LABEL,
  REVIEW_DIALOG_CHANGES_SUBTITLE,
  REVIEW_DIALOG_CHANGES_TITLE,
  REVIEW_DIALOG_CLOSE_LABEL,
  REVIEW_DIALOG_CONSENT_SUBTITLE,
  REVIEW_DIALOG_CONSENT_TITLE,
  REVIEW_DIALOG_EMPTY_CHANGES_TEXT,
  REVIEW_DIALOG_NEW_VALUE_LABEL,
  REVIEW_DIALOG_OLD_VALUE_LABEL,
  REVIEW_DIALOG_SUBTITLE,
  REVIEW_DIALOG_TOTAL_UPLOAD_LABEL,
} from "./messages";
import {
  ADD_INFO_REVIEW_DIALOG_TITLE_SX,
  ADD_INFO_REVIEW_SECTION_SUBTITLE_SX,
  ADD_INFO_REVIEW_SECTION_TITLE_SX,
} from "./styles";

type Props = {
  open: boolean;
  title: string;
  items: ReviewItem[];
  photosCount: number;
  docs: AdditionalDocItem[];
  consent: boolean;
  archiveConsent: boolean;
  totalCombinedMB: number;
  maxCombinedMB: number;
  onBack: () => void;
  onConfirm: () => void;
  confirmLabel: string;
};

function getDocCategoryLabel(doc: AdditionalDocItem) {
  return (
    DOCUMENT_CATEGORY_OPTIONS.find((x) => x.value === doc.document_category)?.label ??
    doc.document_category
  );
}

export default function ReviewDialog({
  open,
  title,
  items,
  photosCount,
  docs,
  consent,
  archiveConsent,
  totalCombinedMB,
  maxCombinedMB,
  onBack,
  onConfirm,
  confirmLabel,
}: Props) {
  const hasMedia = photosCount > 0 || docs.length > 0;

  const SectionTitle = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <Box sx={{ mb: 1 }}>
      <Typography
        sx={ADD_INFO_REVIEW_SECTION_TITLE_SX}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={ADD_INFO_REVIEW_SECTION_SUBTITLE_SX}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  const Panel = ({ children }: { children: React.ReactNode }) => (
    <Box
      sx={{
        border: `1px solid ${color_border}`,
        borderRadius: "14px",
        p: 1.5,
        background: color_white,
      }}
    >
      {children}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onBack}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
          overflow: "hidden",
          border: `1px solid ${color_border}`,
          background: color_white,
          boxShadow: shadow_auth_button,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2,
          py: 1.5,
          background: color_white,
          borderBottom: `1px solid ${color_border}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: color_blue_lightest,
                border: `1px solid ${color_blue_light}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FactCheckOutlinedIcon sx={{ color: color_secondary }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={ADD_INFO_REVIEW_DIALOG_TITLE_SX}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: 12,
                  fontWeight: 700,
                  color: color_text_light,
                  lineHeight: 1.35,
                }}
              >
                {REVIEW_DIALOG_SUBTITLE}
              </Typography>
            </Box>
          </Box>

          <Button
            onClick={onBack}
            startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
            sx={{
              flexShrink: 0,
              minWidth: 0,
              textTransform: "none",
              fontWeight: 900,
              fontSize: 12,
              borderRadius: "10px",
              px: 1.4,
              py: 0.8,
              color: color_text_secondary,
              background: color_white,
              border: `1px solid ${color_border}`,
              "&:hover": { background: color_white_smoke },
              "&:focus-visible": {
                outline: `3px solid ${color_focus_ring}`,
                outlineOffset: 2,
              },
            }}
          >
            {REVIEW_DIALOG_CLOSE_LABEL}
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 2,
          background: color_background,
          color: color_text_primary,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Panel>
            <SectionTitle
              title={REVIEW_DIALOG_CHANGES_TITLE}
              subtitle={REVIEW_DIALOG_CHANGES_SUBTITLE}
            />

            {items.length === 0 ? (
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: "12px",
                  border: `1px solid ${color_border}`,
                  background: color_white_smoke,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: color_text_secondary,
                  }}
                >
                  {REVIEW_DIALOG_EMPTY_CHANGES_TEXT}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {items.map((it, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      border: `1px solid ${color_border}`,
                      borderRadius: "12px",
                      p: 1.25,
                      background: color_white,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 13.5,
                        color: color_text_primary,
                        mb: 0.9,
                      }}
                    >
                      {it.field}
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          border: `1px solid ${color_border}`,
                          borderRadius: "10px",
                          p: 1,
                          background: color_light_gray,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 900,
                            color: color_text_secondary,
                            mb: 0.4,
                          }}
                        >
                          {REVIEW_DIALOG_OLD_VALUE_LABEL}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            color: color_text_primary,
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                          }}
                        >
                          {it.oldValue || "—"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          border: `1px solid ${color_border}`,
                          borderRadius: "10px",
                          p: 1,
                          background: color_white_smoke,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 900,
                            color: color_secondary,
                            mb: 0.4,
                          }}
                        >
                          {REVIEW_DIALOG_NEW_VALUE_LABEL}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            color: color_text_primary,
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                          }}
                        >
                          {it.newValue || "—"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Panel>

          {hasMedia && (
            <Panel>
              <SectionTitle
                title={REVIEW_DIALOG_ATTACHMENTS_TITLE}
                subtitle={REVIEW_DIALOG_ATTACHMENTS_SUBTITLE}
              />

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: docs.length > 0 ? 1.25 : 0 }}>
                {photosCount > 0 && (
                  <Chip
                    label={getReviewDialogPhotosChipLabel(photosCount)}
                    size="small"
                    sx={{
                      fontWeight: 900,
                      borderRadius: "8px",
                      background: color_light_gray,
                      border: `1px solid ${color_border}`,
                      color: color_text_secondary,
                    }}
                  />
                )}

                {docs.length > 0 && (
                  <Chip
                    label={getReviewDialogDocsChipLabel(docs.length)}
                    size="small"
                    sx={{
                      fontWeight: 900,
                      borderRadius: "8px",
                      background: color_light_gray,
                      border: `1px solid ${color_border}`,
                      color: color_text_secondary,
                    }}
                  />
                )}
              </Box>

              {docs.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                  {docs.map((d) => (
                    <Box
                      key={d.id}
                      sx={{
                        border: `1px solid ${color_border}`,
                        borderRadius: "10px",
                        p: 1,
                        background: color_white,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                        gap: 0.75,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: color_text_primary,
                          wordBreak: "break-word",
                        }}
                      >
                        {d.file.name}
                      </Typography>

                      <Chip
                        label={getDocCategoryLabel(d)}
                        size="small"
                        sx={{
                          fontWeight: 900,
                          borderRadius: "8px",
                          background: color_white_smoke,
                          border: `1px solid ${color_border}`,
                          color: color_secondary,
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Panel>
          )}

          <Panel>
            <SectionTitle
              title={REVIEW_DIALOG_CONSENT_TITLE}
              subtitle={REVIEW_DIALOG_CONSENT_SUBTITLE}
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                label={getReviewDialogPhotoConsentLabel(consent)}
                size="small"
                sx={{
                  fontWeight: 900,
                  borderRadius: "8px",
                  background: color_light_gray,
                  border: `1px solid ${color_border}`,
                  color: color_text_secondary,
                }}
              />

              <Chip
                label={getReviewDialogArchiveConsentLabel(archiveConsent)}
                size="small"
                sx={{
                  fontWeight: 900,
                  borderRadius: "8px",
                  background: color_light_gray,
                  border: `1px solid ${color_border}`,
                  color: color_text_secondary,
                }}
              />
            </Box>

            <Divider sx={{ my: 1.25, borderColor: color_border }} />

            <Box
              sx={{
                border: `1px solid ${color_border}`,
                borderRadius: "12px",
                p: 1.25,
                background: color_white_smoke,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12.5,
                  fontWeight: 900,
                  color: color_text_secondary,
                }}
              >
                {REVIEW_DIALOG_TOTAL_UPLOAD_LABEL}
              </Typography>

              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: color_text_primary,
                }}
              >
                {totalCombinedMB.toFixed(2)} MB / {maxCombinedMB} MB
              </Typography>
            </Box>
          </Panel>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1.5,
          gap: 1.25,
          background: color_white,
          borderTop: `1px solid ${color_border}`,
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onBack}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 2.25,
            py: 1,
            background: color_white,
            border: `1px solid ${color_border}`,
            color: color_text_primary,
            "&:hover": { background: color_white_smoke },
            "&:focus-visible": {
              outline: `3px solid ${color_focus_ring}`,
              outlineOffset: 2,
            },
          }}
        >
          {REVIEW_DIALOG_BACK_LABEL}
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 2.5,
            py: 1,
            background: color_secondary,
            color: color_white,
            boxShadow: shadow_auth_button,
            "&:hover": { background: color_secondary_dark || color_primary },
            "&:focus-visible": {
              outline: `3px solid ${color_focus_ring}`,
              outlineOffset: 2,
            },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
