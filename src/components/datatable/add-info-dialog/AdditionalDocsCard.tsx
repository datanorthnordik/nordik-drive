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
  color_secondary_dark,
  color_text_primary,
  color_white,
  color_white_smoke,
} from "../../../constants/colors";

import {
  ACCEPT_DOCS,
  MAX_ADDITIONAL_DOCS,
  MAX_ADDITIONAL_DOCS_TOTAL_MB,
  MAX_COMBINED_UPLOAD_MB,
} from "./constants";

import { AdditionalDocItem } from "./types";

type DocumentTypeOpt = { value: string; label: string };

type Config = {
  name?: string;
  display_name?: string;
  type?: "doc_upload";
  description?: string;
  consent?: string;
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
  const title = String(config?.display_name || config?.name || "Additional Documents");
  const description = String(config?.description || "");
  const consentText = String(config?.consent || "").trim();

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
    <Box
      sx={{
        border: `1px solid ${color_border}`,
        background: color_white,
        borderRadius: "12px",
        p: 2,
      }}
    >
      <Box sx={{ fontWeight: 900, fontSize: "1.1rem", color: color_text_primary, mb: 1 }}>
        {title}
      </Box>

      <Box sx={{ color: color_text_primary, opacity: 0.85, fontSize: "0.95rem", mb: 1.5 }}>
        {description}
        {(showDocsCount || showTotalUpload) && (
          <>
            <br />
            {showDocsCount && (
              <>
                <b>Docs:</b> {additionalDocs.length}/{MAX_ADDITIONAL_DOCS} • {totalAdditionalDocsMB.toFixed(2)} MB /{" "}
                {MAX_ADDITIONAL_DOCS_TOTAL_MB} MB
                <br />
              </>
            )}
            {showTotalUpload && (
              <>
                <b>Total upload (photos + docs):</b> {totalCombinedMB.toFixed(2)} MB / {MAX_COMBINED_UPLOAD_MB} MB
              </>
            )}
          </>
        )}
      </Box>

      <Button
        variant="contained"
        component="label"
        sx={{
          background: color_secondary,
          fontWeight: 900,
          textTransform: "none",
          borderRadius: "10px",
          px: 2,
          py: 1.1,
          "&:hover": { background: color_secondary_dark },
        }}
      >
        Upload Documents
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
                  <InputLabel shrink>Document Category</InputLabel>
                  <Select
                    label="Document Category"
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
                  label="Document Category"
                  value={d.document_category || ""}
                  onChange={(e) => onUpdateCategory(d.id, e.target.value)}
                  placeholder="Type document category"
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
                Remove
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
          <Box sx={{ color: color_text_primary, fontSize: "0.98rem", fontWeight: 800 }}>
            {consentText}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}