"use client";

import React, { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import {
  color_border,
  color_light_gray,
  color_secondary,
  color_white,
  color_white_smoke,
} from "../../../constants/colors";

import { ACCEPT_DOCS } from "./constants";

import { AdditionalDocItem } from "./types";
import {
  ADDITIONAL_DOCS_CATEGORY_LABEL,
  ADDITIONAL_DOCS_CATEGORY_PLACEHOLDER,
  ADDITIONAL_DOCS_FALLBACK_TITLE,
  ADDITIONAL_DOCS_REMOVE_LABEL,
  ADDITIONAL_DOCS_UPLOAD_LABEL,
  getAdditionalDocsSummaryText,
  getPhotoCombinedUploadText,
} from "./messages";
import {
  ADD_INFO_CARD_DESCRIPTION_SX,
  ADD_INFO_CARD_SX,
  ADD_INFO_CARD_TITLE_SX,
  ADD_INFO_CONSENT_TEXT_SX,
  ADD_INFO_PRIMARY_ACTION_BUTTON_SX,
} from "./styles";
import UploadDisclaimer from "./UploadDisclaimer";

type DocumentTypeOpt = { value: string; label: string };

type Config = {
  name?: string;
  display_name?: string;
  type?: "doc_upload";
  description?: string;
  consent?: string;
  disclaimer?: string;
  docs_count_enabled?: boolean;
  total_upload_size?: boolean;
  individual_upload_size?: boolean;
  document_types?: DocumentTypeOpt[];
};

type Props = {
  additionalDocs: AdditionalDocItem[];
  totalAdditionalDocsMB: number;
  totalCombinedMB: number;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  onUpdateCategory: (id: string, cat: string) => void;

  archiveConsent: boolean;
  setArchiveConsent: (v: boolean) => void;
  config?: Config;
};

export default function AdditionalDocsCard({
  additionalDocs,
  totalAdditionalDocsMB,
  totalCombinedMB,
  onUpload,
  onRemove,
  onUpdateCategory,
  archiveConsent,
  setArchiveConsent,
  config,
}: Props) {
  const title = String(config?.display_name || config?.name || ADDITIONAL_DOCS_FALLBACK_TITLE);
  const description = String(config?.description || "");
  const consentText = String(config?.consent || "").trim();
  const disclaimerText = String(config?.disclaimer || "").trim();

  const showDocsCount = config?.docs_count_enabled !== false;
  const showTotalUpload = config?.total_upload_size !== false;

  const documentTypes = useMemo<DocumentTypeOpt[]>(() => {
    const raw = config?.document_types;

    if (!Array.isArray(raw)) return [];

    return raw.filter(
      (x): x is DocumentTypeOpt => Boolean(x?.value && x?.label)
    );
  }, [config?.document_types]);

  const hasPresetCategories = documentTypes.length > 0;

  return (
    <Box sx={ADD_INFO_CARD_SX}>
      <Box sx={ADD_INFO_CARD_TITLE_SX}>
        {title}
      </Box>

      <Box sx={ADD_INFO_CARD_DESCRIPTION_SX}>
        {description}
        {(showDocsCount || showTotalUpload) && (
          <>
            <br />
            {showDocsCount && (
              <>
                <b>Docs:</b>{" "}
                {getAdditionalDocsSummaryText(additionalDocs.length, totalAdditionalDocsMB).replace("Docs: ", "")}
                <br />
              </>
            )}
            {showTotalUpload && (
              <>
                <b>Total upload (photos + docs):</b>{" "}
                {getPhotoCombinedUploadText(totalCombinedMB).replace(
                  "Total upload (photos + docs): ",
                  ""
                )}
              </>
            )}
          </>
        )}
      </Box>

      <Button
        variant="contained"
        component="label"
        sx={ADD_INFO_PRIMARY_ACTION_BUTTON_SX}
      >
        {ADDITIONAL_DOCS_UPLOAD_LABEL}
        <input type="file" hidden multiple accept={ACCEPT_DOCS} onChange={onUpload} />
      </Button>

      {additionalDocs.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
          {additionalDocs.map((d) => (
            <Box
              key={d.id}
              sx={{
                border: `1px solid ${color_border}`,
                background: color_light_gray,
                borderRadius: "12px",
                p: 1.25,
                display: "flex",
                gap: 1.25,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Chip
                label={d.file.name}
                variant="outlined"
                sx={{
                  background: color_white,
                  borderColor: color_border,
                  fontWeight: 900,
                  maxWidth: 420,
                }}
              />

              {hasPresetCategories ? (
                <FormControl
                  size="small"
                  sx={{ minWidth: 240, background: color_white_smoke, borderRadius: "10px" }}
                >
                  <InputLabel shrink>{ADDITIONAL_DOCS_CATEGORY_LABEL}</InputLabel>
                  <Select
                    label={ADDITIONAL_DOCS_CATEGORY_LABEL}
                    value={d.document_category || ""}
                    onChange={(e) => onUpdateCategory(d.id, String(e.target.value))}
                    sx={{ fontWeight: 900 }}
                  >
                    {documentTypes.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  size="small"
                  label={ADDITIONAL_DOCS_CATEGORY_LABEL}
                  value={d.document_category || ""}
                  onChange={(e) => onUpdateCategory(d.id, e.target.value)}
                  placeholder={ADDITIONAL_DOCS_CATEGORY_PLACEHOLDER}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    minWidth: 240,
                    background: color_white,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      fontWeight: 900,
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: color_border,
                    },
                  }}
                />
              )}

              <Button
                onClick={() => onRemove(d.id)}
                sx={{
                  textTransform: "none",
                  borderRadius: "10px",
                  fontWeight: 900,
                  border: `1px solid ${color_secondary}`,
                  background: color_white,
                  color: color_secondary,
                }}
              >
                {ADDITIONAL_DOCS_REMOVE_LABEL}
              </Button>
            </Box>
          ))}
        </Box>
      )}

      {consentText ? (
        <Box sx={{ mt: 2, display: "flex", gap: 1.25, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={archiveConsent}
            onChange={(e) => setArchiveConsent(e.target.checked)}
            style={{ transform: "scale(1.4)", marginTop: 4 }}
          />
          <Box sx={ADD_INFO_CONSENT_TEXT_SX}>
            {consentText}
          </Box>
        </Box>
      ) : null}

      {archiveConsent && disclaimerText ? (
        <UploadDisclaimer text={disclaimerText} />
      ) : null}
    </Box>
  );
}
