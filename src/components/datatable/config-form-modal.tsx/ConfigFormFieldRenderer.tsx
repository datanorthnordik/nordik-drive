'use client';

import React from "react";
import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import AdditionalDocsCard from "../../datatable/add-info-dialog/AdditionalDocsCard";
import PhotoUploadCard, { PhotoItem } from "../../datatable/add-info-dialog/PhotoUploadCard";
import { AdditionalDocItem } from "../../datatable/add-info-dialog/types";

import {
  color_error,
  color_focus_ring,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_white,
} from "../../../constants/colors";

import {
  FieldCfg,
  inputSx,
  missingWrapSx,
  requiredBadge,
} from "./shared";

type Props = {
  field: FieldCfg;
  formConsentText?: string;
  editable: boolean;
  value: any;
  required: boolean;
  isMissing: boolean;

  consentGiven: boolean;
  setConsentGiven: React.Dispatch<React.SetStateAction<boolean>>;

  additionalDocs: AdditionalDocItem[];
  photos: PhotoItem[];
  totalCombinedMB: number;

  onSetField: (key: string, value: any) => void;
  onDocsUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocRemove: (id: string) => void;
  onDocCategory: (id: string, category: string) => void;
  onPhotosUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: (idx: number) => void;
  onPhotosChange: (next: PhotoItem[]) => void;

  getDocsMB: (items: AdditionalDocItem[]) => number;
  renderExistingDocumentsGrid: (fieldKey: string) => React.ReactNode;
  renderExistingPhotosGrid: (fieldKey: string) => React.ReactNode;
};

export default function ConfigFormFieldRenderer({
  field,
  formConsentText,
  editable,
  value,
  required,
  isMissing,
  consentGiven,
  setConsentGiven,
  additionalDocs,
  photos,
  totalCombinedMB,
  onSetField,
  onDocsUpload,
  onDocRemove,
  onDocCategory,
  onPhotosUpload,
  onPhotoRemove,
  onPhotosChange,
  getDocsMB,
  renderExistingDocumentsGrid,
  renderExistingPhotosGrid,
}: Props) {
  if (field.type === "doc_upload") {
    const cfg = {
      name: field.name,
      display_name: field.display_name,
      type: "doc_upload" as const,
      description: field.description,
      consent: formConsentText ? "" : field.consent,
      docs_count_enabled: field.docs_count_enabled,
      total_upload_size: field.total_upload_size,
      individual_upload_size: field.individual_upload_size,
      document_types: field.document_types,
    };

    return (
      <Box sx={isMissing ? missingWrapSx : undefined}>
        {editable && <AdditionalDocsCard
          additionalDocs={additionalDocs}
          totalAdditionalDocsMB={getDocsMB(additionalDocs)}
          totalCombinedMB={totalCombinedMB}
          onUpload={onDocsUpload}
          onRemove={onDocRemove}
          onUpdateCategory={onDocCategory}
          archiveConsent={consentGiven}
          setArchiveConsent={setConsentGiven}
          config={cfg}
        />}
        {renderExistingDocumentsGrid(field.key)}
        {isMissing ? (
          <Typography sx={{ mt: 0.75, color: color_error, fontWeight: 900 }}>
            This field is required.
          </Typography>
        ) : null}
      </Box>
    );
  }

  if (field.type === "photo_upload") {
    const cfg = {
      name: field.name,
      display_name: field.display_name,
      description: field.description,
      consent: formConsentText ? "" : field.consent,
      docs_count_enabled: field.docs_count_enabled,
      total_upload_size: field.total_upload_size,
      individual_upload_size: field.individual_upload_size,
    };

    return (
      <Box sx={isMissing ? missingWrapSx : undefined}>
        {editable &&<PhotoUploadCard
          photos={photos}
          setPhotos={onPhotosChange}
          totalCombinedMB={totalCombinedMB}
          onUpload={onPhotosUpload}
          onRemove={onPhotoRemove}
          consent={consentGiven}
          setConsent={setConsentGiven}
          disabled={!editable}
          config={cfg}
        />}
        {renderExistingPhotosGrid(field.key)}
        {isMissing ? (
          <Typography sx={{ mt: 0.75, color: color_error, fontWeight: 900 }}>
            This field is required.
          </Typography>
        ) : null}
      </Box>
    );
  }

  if (field.type === "checkbox") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          sx={{
            fontWeight: 900,
            color: color_text_primary,
            fontSize: "0.98rem",
          }}
        >
          {field.label} {required ? requiredBadge : null}
        </Typography>

        <Box sx={isMissing ? missingWrapSx : undefined}>
          <ToggleButtonGroup
            exclusive
            value={value || ""}
            onChange={(_, v) => editable && onSetField(field.key, v || "")}
            sx={{
              alignSelf: "flex-start",
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 900,
                px: 2,
                py: 1.1,
                borderRadius: "10px",
                color: color_text_primary,
                background: color_white,
                "&:focus-visible": {
                  outline: `3px solid ${color_focus_ring}`,
                  outlineOffset: "2px",
                },
              },
              "& .MuiToggleButton-root.Mui-selected": {
                background: color_secondary,
                color: color_white,
                "&:hover": { background: color_secondary_dark },
              },
            }}
          >
            {(field.values || []).map((x:any) => (
              <ToggleButton key={x} value={x} disabled={!editable}>
                {x}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {isMissing ? (
            <Typography sx={{ mt: 0.75, color: color_error, fontWeight: 900 }}>
              Please select an option.
            </Typography>
          ) : null}
        </Box>
      </Box>
    );
  }

  const multiline = field.type === "textarea";

  return (
    <Box sx={isMissing ? missingWrapSx : undefined}>
      <TextField
        label={
          <span>
            {field.label} {required ? requiredBadge : null}
          </span>
        }
        InputLabelProps={{ shrink: true }}
        value={value ?? ""}
        onChange={(e) => editable && onSetField(field.key, e.target.value)}
        placeholder={field.placeholder || ""}
        fullWidth
        multiline={multiline}
        minRows={multiline ? 4 : 1}
        disabled={!editable}
        error={isMissing}
        helperText={isMissing ? "This field is required." : " "}
        sx={{
          ...inputSx,
          ...(isMissing
            ? {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: color_error,
                  borderWidth: "2px",
                },
              }
            : {}),
        }}
        inputProps={{ style: { fontSize: "16px" } }}
      />
    </Box>
  );
}