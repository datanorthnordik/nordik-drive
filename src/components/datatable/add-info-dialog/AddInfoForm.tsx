"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, Typography, useMediaQuery } from "@mui/material";
import toast from "react-hot-toast";
import { RestartAlt } from "@mui/icons-material";
import { useSelector } from "react-redux";

import useFetch from "../../../hooks/useFetch";
import Loader from "../../Loader";

import {
  color_border,
  color_light_gray,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_white,
  color_white_smoke,
} from "../../../constants/colors";

import FieldRow from "./FieldRow";
import TextFieldRow from "./TextFieldRow";
import DateFieldRow from "./DateFieldRow";
import MultiValueRow from "./MultiValueRow";
import CommunityMultiRow from "./CommunityMultiRow";
import PhotoUploadCard from "./PhotoUploadCard";
import AdditionalDocsCard from "./AdditionalDocsCard";
import ResetAllDialog from "./ResetAllDialog";
import ReviewDialog from "./ReviewDialog";

import { EXCLUDED_FIELDS, AdditionalDocItem, ReviewItem, DocumentCategory, PhotoItem } from "./types";
import {
  fieldTypeMap,
  MAX_ADDITIONAL_DOCS,
  MAX_ADDITIONAL_DOCS_TOTAL_MB,
  MAX_COMBINED_UPLOAD_MB,
  MAX_PHOTO_MB,
  MAX_PHOTOS,
  ALLOWED_DOC_MIME,
} from "./constants";

import {
  bytesToMB,
  convertToBase64,
  estimateTotalBase64Bytes,
  getCommunityArray,
  getTotalBytes,
  isDdMmYyyy,
  normalizeIncomingDateToDdMmYyyy,
  toApiDate,
  uid,
} from "./utils";

interface AddInfoFormProps {
  row: Record<string, any>;
  file: Record<string, any>;
  onClose: () => void;
}

export default function AddInfoForm({ row, file, onClose }: AddInfoFormProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user } = useSelector((state: any) => state.auth);


  const isNewEntry = !row || row.id === undefined || row.id === null || row.id === "";

  const { fetchData: submitEditRequest, data: editData, error: editError, loading: editLoading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/edit/request",
    "POST",
    false
  );

  const { data: communitiesData, fetchData: fetchCommunities } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/communities",
    "GET",
    false
  );

  const { fetchData: addCommunity } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/communities",
    "POST",
    false
  );

  useEffect(() => {
    fetchCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const communityOptions = useMemo(() => {
    return (communitiesData as any)?.communities?.map((c: any) => c.name) || [];
  }, [communitiesData]);

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [changedFields, setChangedFields] = useState<Record<string, any>>({});

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [additionalDocs, setAdditionalDocs] = useState<AdditionalDocItem[]>([]);

  const [consent, setConsent] = useState(false);
  const [archiveConsent, setArchiveConsent] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const totalPhotoMB = bytesToMB(getTotalBytes(photos.map((p) => p.file)));

  const totalAdditionalDocsMB = bytesToMB(getTotalBytes(additionalDocs.map((d) => d.file)));
  const totalCombinedMB = totalPhotoMB + totalAdditionalDocsMB;

  // init form values
  useEffect(() => {
    const initial: Record<string, any> = {};

    const keys = Object.keys(row || {}).filter((key: any) => !EXCLUDED_FIELDS.includes(key));
    keys.forEach((key) => {
      const type = fieldTypeMap[key] || "text";
      if (type === "multi" || type === "community_multi") {
        initial[key] = isNewEntry
          ? []
          : (row[key] || "")
            .split(",")
            .map((x: string) => x.trim())
            .filter((x: string) => x.length > 0);
      } else if (type === "date") {
        initial[key] = isNewEntry ? "" : normalizeIncomingDateToDdMmYyyy(row[key] || "");
      } else {
        initial[key] = isNewEntry ? "" : row[key] || "";
      }
    });

    // Ensure required fields exist in add mode
    if (!("First Names" in initial)) initial["First Names"] = "";
    if (!("Last Names" in initial)) initial["Last Names"] = "";

    // Ensure community exists even if column missing
    if (!("First Nation/Community" in initial) && !("First Nation / Community" in initial)) {
      initial["First Nation/Community"] = [];
    }

    setFormValues(initial);
    setChangedFields({});
  }, [row, isNewEntry]);

  const formFirstName = (formValues["First Names"] || "").toString();
  const formLastName = (formValues["Last Names"] || "").toString();
  const fullName = `${formFirstName} ${formLastName}`.trim();

  const dialogTitle = isNewEntry
    ? "Add New Student"
    : `Add Information – ${fullName || `${row["First Names"] || ""} ${row["Last Names"] || ""}`.trim()}`;

  // success/error handling
  useEffect(() => {
    if (editData && !editError) {
      toast.success(
        isNewEntry
          ? "Student added successfully and sent for review."
          : "Changes submitted successfully and sent for review."
      );
      onClose();
    }
    if (editError) toast.error(`Error submitting data: ${editError}`);
  }, [editData, editError, isNewEntry, onClose]);

  const updateField = (field: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));

    if (isNewEntry) return;

    let normalized: any = value;
    const type = fieldTypeMap[field] || "text";

    if (Array.isArray(value)) normalized = value.join(", ");
    else if (type === "date") normalized = isDdMmYyyy(value) ? value : "";

    if ((row as any)[field] !== normalized) {
      setChangedFields((prev) => ({
        ...prev,
        [field]: { field, oldValue: (row as any)[field], newValue: normalized },
      }));
    } else {
      setChangedFields((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const resetField = (label: string) => {
    const type = fieldTypeMap[label] || "text";

    if (isNewEntry) {
      const cleared = type === "date" ? "" : type === "multi" || type === "community_multi" ? [] : "";
      setFormValues((prev) => ({ ...prev, [label]: cleared }));
      return;
    }

    const original =
      type === "date"
        ? normalizeIncomingDateToDdMmYyyy(row[label] || "")
        : type === "multi" || type === "community_multi"
          ? (row[label] || "")
            .split(",")
            .map((x: string) => x.trim())
            .filter((x: string) => x.length > 0)
          : row[label] || "";

    setFormValues((prev) => ({ ...prev, [label]: original }));
    setChangedFields((prev) => {
      const copy = { ...prev };
      delete copy[label];
      return copy;
    });
  };

  const resetAll = () => {
    if (isNewEntry) {
      const cleared: Record<string, any> = {};
      Object.keys(formValues).forEach((key: any) => {
        if (EXCLUDED_FIELDS.includes(key)) return;
        const type = fieldTypeMap[key] || "text";
        cleared[key] = type === "date" ? "" : type === "multi" || type === "community_multi" ? [] : "";
      });
      cleared["First Names"] = "";
      cleared["Last Names"] = "";
      setFormValues(cleared);
    } else {
      const restored: Record<string, any> = {};
      Object.keys(row || {}).forEach((key: any) => {
        if (EXCLUDED_FIELDS.includes(key)) return;
        const type = fieldTypeMap[key] || "text";
        restored[key] =
          type === "date"
            ? normalizeIncomingDateToDdMmYyyy(row[key] || "")
            : type === "multi" || type === "community_multi"
              ? (row[key] || "")
                .split(",")
                .map((x: string) => x.trim())
                .filter((x: string) => x.length > 0)
              : row[key] || "";
      });
      setFormValues(restored);
      setChangedFields({});
    }

    setPhotos([]);
    setAdditionalDocs([]);
    setConsent(false);
    setArchiveConsent(false);
    setConfirmResetAll(false);
  };

  // uploads
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const onlyImages = files.filter((f) => f.type.startsWith("image/"));

    if (onlyImages.length !== files.length) {
      toast.error("Only image files are allowed for photos.");
      event.target.value = "";
      return;
    }

    const nextPhotos = [
      ...photos,
      ...onlyImages.map((file) => ({
        id: uid(),
        file,
        comment: "",
      })),
    ];

    const nextTotalPhotoMB = bytesToMB(getTotalBytes(nextPhotos.map((p) => p.file)));
    const nextTotalCombinedMB = nextTotalPhotoMB + totalAdditionalDocsMB;

    if (nextTotalPhotoMB > MAX_PHOTO_MB) {
      toast.error(`Photo size limit exceeded (${MAX_PHOTO_MB} MB total).`);
      event.target.value = "";
      return;
    }

    if (nextTotalCombinedMB > MAX_COMBINED_UPLOAD_MB) {
      toast.error(`Total upload too large. Keep combined uploads under ${MAX_COMBINED_UPLOAD_MB} MB.`);
      event.target.value = "";
      return;
    }

    if (nextPhotos.length > MAX_PHOTOS) {
      toast.error("Upload limit reached. Extra photos will be sent to the CSAA Gallery for review.");
    }

    setPhotos(nextPhotos);
    event.target.value = "";
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleDocUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const hasBad = files.some((f) => {
      if (!f.type) return false;
      if (f.type.startsWith("image/")) return false;
      return !ALLOWED_DOC_MIME.has(f.type);
    });

    if (hasBad) {
      toast.error("Only PDF, DOC/DOCX, or image files are allowed for documents.");
      event.target.value = "";
      return;
    }

    const nextCount = additionalDocs.length + files.length;
    if (nextCount > MAX_ADDITIONAL_DOCS) {
      toast.error(`You can upload up to ${MAX_ADDITIONAL_DOCS} additional documents.`);
      event.target.value = "";
      return;
    }

    const nextDocsBytes = getTotalBytes(additionalDocs.map((d) => d.file)) + getTotalBytes(files);
    const nextDocsMB = bytesToMB(nextDocsBytes);
    if (nextDocsMB > MAX_ADDITIONAL_DOCS_TOTAL_MB) {
      toast.error(`Additional documents total limit exceeded (${MAX_ADDITIONAL_DOCS_TOTAL_MB} MB).`);
      event.target.value = "";
      return;
    }

    const nextTotalCombined = totalPhotoMB + nextDocsMB;
    if (nextTotalCombined > MAX_COMBINED_UPLOAD_MB) {
      toast.error(`Total upload too large. Keep combined uploads under ${MAX_COMBINED_UPLOAD_MB} MB.`);
      event.target.value = "";
      return;
    }

    const next: AdditionalDocItem[] = files.map((file) => ({
      id: uid(),
      file,
      document_type: "document",
      document_category: "other_document",
    }));

    setAdditionalDocs((prev) => [...prev, ...next]);
    event.target.value = "";
  };

  const updateDocCategory = (id: string, document_category: DocumentCategory) => {
    setAdditionalDocs((prev) => prev.map((d) => (d.id === id ? { ...d, document_category } : d)));
  };

  const removeDoc = (id: string) => setAdditionalDocs((prev) => prev.filter((d) => d.id !== id));

  const reviewItems: ReviewItem[] = useMemo(() => {
    if (isNewEntry) {
      return Object.keys(formValues)
        .filter((label: any) => !EXCLUDED_FIELDS.includes(label))
        .map((field) => {
          let val = formValues[field];
          if (Array.isArray(val)) val = val.join(", ");
          return { field, oldValue: "", newValue: val || "" };
        });
    }
    return Object.values(changedFields || {}).map((it: any) => ({
      field: it.field,
      oldValue: it.oldValue ?? "",
      newValue: it.newValue ?? "",
    }));
  }, [isNewEntry, formValues, changedFields]);

  const handleSaveClick = () => {
    if (isNewEntry) {
      const first = (formValues["First Names"] || "").toString().trim();
      const last = (formValues["Last Names"] || "").toString().trim();
      if (!first || !last) {
        toast.error("First Names and Last Names are required.");
        return;
      }
      setReviewOpen(true);
      return;
    }

    if (Object.keys(changedFields).length === 0 && photos.length === 0 && additionalDocs.length === 0) {
      toast("No changes made.");
      onClose();
      return;
    }

    setReviewOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      const allFiles = [...photos.map((p) => p.file), ...additionalDocs.map((d) => d.file)];
      const estimatedB64Bytes = estimateTotalBase64Bytes(allFiles);
      const estimatedMB = bytesToMB(estimatedB64Bytes);
      if (estimatedMB > 25) {
        toast.error("Upload too large for a single request. Please reduce file sizes/count.");
        return;
      }

      const photoPayload = await Promise.all(
        photos.map(async (p) => ({
          filename: p.file.name,
          mime_type: p.file.type || "application/octet-stream",
          size: p.file.size,
          data_base64: await convertToBase64(p.file),
          comment: (p.comment || "").slice(0, 100), // enforce 100 chars
        }))
      );

      const photosInApp = photoPayload.slice(0, MAX_PHOTOS);
      const photosGallery = photoPayload.slice(MAX_PHOTOS);



      const docsBase64 = await Promise.all(additionalDocs.map((d) => convertToBase64(d.file)));
      const documentsPayload = additionalDocs.map((d, idx) => ({
        document_type: d.document_type,
        document_category: d.document_category,
        filename: d.file.name,
        mime_type: d.file.type || "application/octet-stream",
        size: d.file.size,
        data_base64: docsBase64[idx],
      }));

      const communityArray = getCommunityArray(formValues, row || {});

      const basePayload: any = {
        file_id: file.id,
        filename: file.filename,

        photos_in_app: photosInApp,
        photos_for_gallery_review: photosGallery,

        consent,
        archive_consent: archiveConsent,

        documents: documentsPayload,

        community: communityArray,
        uploader_community: user?.community || [],
      };


      if (isNewEntry) {
        const converted: Record<string, any[]> = { new: [] };

        Object.keys(formValues)
          .filter((label: any) => !EXCLUDED_FIELDS.includes(label))
          .forEach((fieldName) => {
            const type = fieldTypeMap[fieldName] || "text";
            let value: any = formValues[fieldName];

            if (Array.isArray(value)) value = value.join(", ");
            else if (type === "date") value = toApiDate(value || "");

            converted.new.push({
              row_id: null,
              field_name: fieldName,
              old_value: "",
              new_value: value ?? "",
            });
          });

        submitEditRequest({
          ...basePayload,
          is_edited: false,
          changes: converted,
          row_id: null,
          firstname: formValues["First Names"] || "",
          lastname: formValues["Last Names"] || "",
        });
      } else {
        const converted: Record<string, any[]> = {};
        Object.entries(changedFields).forEach(([fieldName, item]: any) => {
          const type = fieldTypeMap[fieldName] || "text";
          const newVal = type === "date" ? toApiDate(item.newValue) : item.newValue;

          const key = row.id;
          if (!converted[key]) converted[key] = [];
          converted[key].push({
            row_id: row.id,
            field_name: fieldName,
            old_value: item.oldValue,
            new_value: newVal,
          });
        });

        submitEditRequest({
          ...basePayload,
          is_edited: true,
          changes: converted,
          row_id: row.id,
          firstname: row["First Names"] || "",
          lastname: row["Last Names"] || "",
        });
      }

      setReviewOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit request.");
    }
  };

  // Field list (single field per row)
  const visibleFieldLabels = useMemo(() => {
    const keys = Object.keys(formValues || {}).filter((k: any) => !EXCLUDED_FIELDS.includes(k));

    const pinTop = ["First Names", "Last Names", "First Nation/Community", "First Nation / Community"];
    const top = pinTop.filter((k) => keys.includes(k));
    const rest = keys.filter((k) => !top.includes(k));

    // keep Additional Information visible (don’t move it away)
    return [...top, ...rest];
  }, [formValues]);

  const hasAdditionalInformationField = useMemo(
    () => visibleFieldLabels.includes("Additional Information"),
    [visibleFieldLabels]
  );

  const onAddNewCommunity = async (name: string) => {
    await addCommunity({ name }, {}, true);
    fetchCommunities();
  };

  return (
    <>
      {editLoading && <Loader loading={editLoading} />}

      <Dialog
        open
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "62%",
            maxHeight: "92vh",
            borderRadius: "14px",
            overflow: "hidden",
            border: `1px solid ${color_border}`,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`,
            px: 2.5,
            py: 1.6,
            borderBottom: `1px solid ${color_border}`,
          }}
        >
          <Typography sx={{ color: color_white, fontWeight: 900, fontSize: "1.15rem" }}>
            {dialogTitle}
          </Typography>
        </Box>

        <DialogContent
          sx={{
            background: color_white_smoke,
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.75,
          }}
        >
          {/* Fields (one per row) */}
          {visibleFieldLabels.map((label) => {
            const type = fieldTypeMap[label] || "text";
            const value = formValues[label];

            const isNameField = label === "First Names" || label === "Last Names";
            const required = isNewEntry && isNameField;
            const canReset = !isNewEntry;

            // COMMUNITY MULTI
            if (type === "community_multi") {
              const arr = Array.isArray(value) ? value : value ? String(value).split(",").map((x) => x.trim()) : [];
              return (
                <FieldRow
                  key={label}
                  label={label}
                  required={false}
                  onReset={canReset ? () => resetField(label) : undefined}
                >
                  <CommunityMultiRow
                    values={arr}
                    options={communityOptions}
                    onChange={(next: any) => updateField(label, next)}
                    onAddNewCommunity={onAddNewCommunity}
                  />
                </FieldRow>
              );
            }

            // DATE
            if (type === "date") {
              return (
                <FieldRow key={label} label={label} onReset={canReset ? () => resetField(label) : undefined}>
                  <DateFieldRow value={value || ""} onChange={(v) => updateField(label, v)} />
                </FieldRow>
              );
            }

            // MULTI
            if (type === "multi") {
              const arr = Array.isArray(value) ? value : value ? String(value).split(",").map((x) => x.trim()) : [];
              const addLabel = label === "Siblings" ? "Add Sibling" : "Add Name";
              return (
                <FieldRow key={label} label={label} onReset={canReset ? () => resetField(label) : undefined}>
                  <MultiValueRow values={arr} onChange={(next) => updateField(label, next)} addLabel={addLabel} />
                </FieldRow>
              );
            }

            // TEXT / TEXTAREA
            const multiline = type === "textarea";
            const isAdditionalInformation = label === "Additional Information";

            return (
              <React.Fragment key={label}>
                <FieldRow
                  label={label}
                  required={required}
                  onReset={canReset ? () => resetField(label) : undefined}
                >
                  <TextFieldRow
                    value={value || ""}
                    onChange={(v) => updateField(label, v)}
                    multiline={multiline}
                    rows={multiline ? 4 : 1}
                  />
                </FieldRow>

                {/*  IMPORTANT: Additional Documents must appear immediately after "Additional Information" */}
                {isAdditionalInformation && (
                  <AdditionalDocsCard
                    additionalDocs={additionalDocs}
                    totalAdditionalDocsMB={totalAdditionalDocsMB}
                    totalCombinedMB={totalCombinedMB}
                    onUpload={handleDocUpload}
                    onRemove={removeDoc}
                    onUpdateCategory={updateDocCategory}
                    archiveConsent={archiveConsent}
                    setArchiveConsent={setArchiveConsent}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/*  Fallback: If the sheet doesn’t have "Additional Information" column, still show docs somewhere */}
          {!hasAdditionalInformationField && (
            <AdditionalDocsCard
              additionalDocs={additionalDocs}
              totalAdditionalDocsMB={totalAdditionalDocsMB}
              totalCombinedMB={totalCombinedMB}
              onUpload={handleDocUpload}
              onRemove={removeDoc}
              onUpdateCategory={updateDocCategory}
              archiveConsent={archiveConsent}
              setArchiveConsent={setArchiveConsent}
            />
          )}

          <PhotoUploadCard
            photos={photos}
            setPhotos={setPhotos}
            totalCombinedMB={totalCombinedMB}
            onUpload={handlePhotoUpload}
            onRemove={removePhoto}
            consent={consent}
            setConsent={setConsent}
          />

        </DialogContent>

        <DialogActions
          sx={{
            background: color_white,
            borderTop: `1px solid ${color_border}`,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={() => setConfirmResetAll(true)}
            startIcon={<RestartAlt />}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
              border: `1px solid ${color_secondary}`,
              color: color_secondary,
              background: color_white,
              "&:hover": { background: color_white_smoke },
            }}
          >
            Reset All
          </Button>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              onClick={onClose}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                borderRadius: "10px",
                border: `1px solid ${color_border}`,
                background: color_light_gray,
                color: color_text_primary,
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSaveClick}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                borderRadius: "10px",
                background: color_secondary,
                "&:hover": { background: color_secondary_dark },
                px: 3,
              }}
            >
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <ResetAllDialog open={confirmResetAll} onClose={() => setConfirmResetAll(false)} onConfirm={resetAll} />

      <ReviewDialog
        open={reviewOpen}
        title={isNewEntry ? "Review New Student" : `Review Changes – ${fullName || "Student"}`}
        items={reviewItems}
        photosCount={photos.length}
        docs={additionalDocs}
        consent={consent}
        archiveConsent={archiveConsent}
        totalCombinedMB={totalCombinedMB}
        maxCombinedMB={MAX_COMBINED_UPLOAD_MB}
        onBack={() => setReviewOpen(false)}
        onConfirm={handleConfirmSubmit}
        confirmLabel={isNewEntry ? "Add Student" : "Submit Changes"}
      />
    </>
  );
}
