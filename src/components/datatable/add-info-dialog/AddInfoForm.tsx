"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, Typography, useMediaQuery } from "@mui/material";
import toast from "react-hot-toast";
import { RestartAlt } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";

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
  color_focus_ring,
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

import { AdditionalDocItem, ReviewItem, DocumentCategory, PhotoItem } from "./types";
import {
  MAX_ADDITIONAL_DOCS,
  MAX_ADDITIONAL_DOCS_TOTAL_MB,
  MAX_COMBINED_UPLOAD_MB,
  MAX_PHOTO_MB,
  MAX_PHOTOS,
  ALLOWED_DOC_MIME,
  baseFields,
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

import { AppDispatch, RootState } from "../../../store/store";
import { apiEnsure } from "../../../store/api/apiSlice";
import { API_BASE } from "../../../constants/constants";

interface AddInfoFormProps {
  row: Record<string, any>;
  file: Record<string, any>;
  onClose: () => void;
}

const isBaseFieldType = (t: string) => baseFields.includes(t);

export default function AddInfoForm({ row, file, onClose }: AddInfoFormProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const fileName = useMemo(() => String(file?.filename).trim(), [file?.filename]);
  const fileId = useMemo(() => file?.id ?? file?.file_id ?? null, [file?.id, file?.file_id]);

  // ---------- CONFIG (fetch here via Redux) ----------
  const configKey = useMemo(() => (fileName ? `config_${fileName}` : ""), [fileName]);

  const configEntry = useSelector((state: RootState) =>
    configKey ? (state as any)?.api?.entries?.[configKey] : null
  );

  const [localConfig, setLocalConfig] = useState<any>(null);
  const forcedFetchRef = useRef(false);

  const baseConfigUrl = useMemo(() => {
    if (!fileName) return "";
    return `${API_BASE}/config?file_name=${encodeURIComponent(fileName)}`;
  }, [fileName]);

  // fire ensure (deduped by middleware)
  useEffect(() => {
    if (!configKey || !baseConfigUrl) return;

    const last = (configEntry?.data as any)?.updated_at || (localConfig as any)?.updated_at || "";
    const url = last ? `${baseConfigUrl}&last_modified=${encodeURIComponent(String(last))}` : baseConfigUrl;

    dispatch(
      apiEnsure({
        key: configKey,
        url,
        method: "GET",
      })
    );
  }, [dispatch, configKey, baseConfigUrl, configEntry?.data, localConfig]);

  // keep last known good config locally (prevents not_modified overwriting config)
  useEffect(() => {
    const data = configEntry?.data as any;
    if (data?.config) {
      setLocalConfig(data.config);
      forcedFetchRef.current = false;
      return;
    }

    if (data?.not_modified === true && !data?.config && !localConfig && !forcedFetchRef.current && baseConfigUrl) {
      forcedFetchRef.current = true;
      dispatch(
        apiEnsure({
          key: configKey,
          url: baseConfigUrl,
          method: "GET",
          force: true,
        })
      );
    }
  }, [configEntry?.data, localConfig, dispatch, configKey, baseConfigUrl]);

  const config = (configEntry?.data as any)?.config || localConfig;

  const columns: any[] = Array.isArray(config?.columns) ? config.columns : [];
  const addInfoEnabled = !!config?.addInfo?.enabled;

  const requiredFields: string[] = Array.isArray(config?.addInfo?.required_fields) ? config.addInfo.required_fields : [];
  const requiredSet = useMemo(() => new Set(requiredFields), [requiredFields]);

  // ✅ ONLY editable items, and ✅ keep order exactly as config.columns
  const editableColumnsOrdered = useMemo(() => {
    return columns.filter((c: any) => c && c.editable === true);
  }, [columns]);

  // base fields rendered as rows (editable only)
  const fieldColumns = useMemo(() => {
    return editableColumnsOrdered.filter((c: any) => c && isBaseFieldType(String(c.type || "")) && c.name);
  }, [editableColumnsOrdered]);

  // meta lookup by field name
  const colMetaByName = useMemo(() => {
    const m = new Map<string, any>();
    fieldColumns.forEach((c: any) => {
      const name = String(c?.name || "");
      if (name && !m.has(name)) m.set(name, c);
    });
    return m;
  }, [fieldColumns]);

  const typeOf = (label: string): string => String(colMetaByName.get(label)?.type || "input");
  const editableOf = (label: string): boolean => {
    const c = colMetaByName.get(label);
    if (!c) return true;
    return c.editable;
  };

  useEffect(() => {
    dispatch(
      apiEnsure({
        key: "communities",
        url: `${API_BASE}/communities`,
        method: "GET",
      })
    );
  }, [dispatch]);

  const communityOptions = useSelector((state: RootState) =>
    ((state as any)?.api?.entries["communities"]?.data?.communities || []).map((c: any) => c.name)
  );

  const isNewEntry = !row || row.id === undefined || row.id === null || row.id === "";

  const { fetchData: submitEditRequest, data: editData, error: editError, loading: editLoading } = useFetch(
    `${API_BASE}/file/edit/request`,
    "POST",
    false
  );

  const { fetchData: addCommunity } = useFetch(`${API_BASE}/communities`, "POST", false);

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

  // init form values strictly from editable base fields
  useEffect(() => {
    const initial: Record<string, any> = {};

    fieldColumns.forEach((c: any) => {
      const label = String(c?.name || "");
      if (!label) return;

      const t = String(c?.type || "input");
      const raw = (row as any)?.[label];

      if (isNewEntry) {
        initial[label] = t === "multi" || t === "community_multi" ? [] : "";
        return;
      }

      if (t === "multi" || t === "community_multi") {
        if (Array.isArray(raw)) initial[label] = raw;
        else {
          initial[label] = (raw || "")
            .toString()
            .split(",")
            .map((x: string) => x.trim())
            .filter((x: string) => x.length > 0);
        }
      } else if (t === "date") {
        initial[label] = normalizeIncomingDateToDdMmYyyy(raw || "");
      } else {
        initial[label] = raw ?? "";
      }
    });

    requiredFields.forEach((rf) => {
      if (!(rf in initial)) initial[rf] = "";
    });

    setFormValues(initial);
    setChangedFields({});
  }, [fieldColumns, isNewEntry, row, requiredFields]);

  const headers: string[] = config.addInfo.headers;

  const concatFrom = (src: Record<string, any>) =>
    headers
      .map((k) => (src?.[k] ?? "").toString().trim())
      .filter(Boolean)
      .join(" ");

  const headerText = isNewEntry ? concatFrom(formValues) : concatFrom(formValues) || concatFrom(row);

  const dialogTitle = isNewEntry ? "Add New Student" : `Add Information – ${headerText}`;

  useEffect(() => {
    if (editData && !editError) {
      toast.success(
        isNewEntry ? "Student added successfully and sent for review." : "Changes submitted successfully and sent for review."
      );
      onClose();
    }
    if (editError) toast.error(`Error submitting data: ${editError}`);
  }, [editData, editError, isNewEntry, onClose]);

  const updateField = (field: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));

    if (isNewEntry) return;

    let normalized: any = value;
    const t = typeOf(field);

    if (Array.isArray(value)) normalized = value.join(", ");
    else if (t === "date") normalized = isDdMmYyyy(value) ? value : "";

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
    const t = typeOf(label);

    if (isNewEntry) {
      const cleared = t === "date" ? "" : t === "multi" || t === "community_multi" ? [] : "";
      setFormValues((prev) => ({ ...prev, [label]: cleared }));
      return;
    }

    const raw = (row as any)?.[label];

    const original =
      t === "date"
        ? normalizeIncomingDateToDdMmYyyy(raw || "")
        : t === "multi" || t === "community_multi"
        ? (raw || "")
            .toString()
            .split(",")
            .map((x: string) => x.trim())
            .filter((x: string) => x.length > 0)
        : raw ?? "";

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
      fieldColumns.forEach((c: any) => {
        const label = String(c?.name || "");
        if (!label) return;
        const t = String(c?.type || "input");
        cleared[label] = t === "date" ? "" : t === "multi" || t === "community_multi" ? [] : "";
      });

      requiredFields.forEach((rf) => {
        if (!(rf in cleared)) cleared[rf] = "";
      });

      setFormValues(cleared);
    } else {
      const restored: Record<string, any> = {};
      fieldColumns.forEach((c: any) => {
        const label = String(c?.name || "");
        if (!label) return;
        const t = String(c?.type || "input");
        const raw = (row as any)?.[label];

        restored[label] =
          t === "date"
            ? normalizeIncomingDateToDdMmYyyy(raw || "")
            : t === "multi" || t === "community_multi"
            ? (raw || "")
                .toString()
                .split(",")
                .map((x: string) => x.trim())
                .filter((x: string) => x.length > 0)
            : raw ?? "";
      });

      requiredFields.forEach((rf) => {
        if (!(rf in restored)) restored[rf] = "";
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
      return fieldColumns
        .map((c: any) => String(c?.name || ""))
        .filter(Boolean)
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
  }, [isNewEntry, formValues, changedFields, fieldColumns]);

  const validateRequired = () => {
    for (const rf of requiredFields) {
      const t = typeOf(rf);
      const v = formValues[rf];

      if (t === "multi" || t === "community_multi") {
        if (!Array.isArray(v) || v.length === 0) {
          toast.error(`${rf} is required.`);
          return false;
        }
      } else {
        if ((v || "").toString().trim() === "") {
          toast.error(`${rf} is required.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveClick = () => {
    if (isNewEntry) {
      if (!validateRequired()) return;
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
          comment: (p.comment || "").slice(0, 100),
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
        file_id: fileId,
        filename: fileName,
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

        fieldColumns
          .map((c: any) => String(c?.name || ""))
          .filter(Boolean)
          .forEach((fieldName) => {
            const t = typeOf(fieldName);
            let value: any = formValues[fieldName];

            if (Array.isArray(value)) value = value.join(", ");
            else if (t === "date") value = toApiDate(value || "");

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
          firstname: formValues[config?.addInfo?.firstname] || "",
          lastname: formValues[config?.addInfo?.lastname] || "",
        });
      } else {
        const converted: Record<string, any[]> = {};
        Object.entries(changedFields).forEach(([fieldName, item]: any) => {
          const t = typeOf(fieldName);
          const newVal = t === "date" ? toApiDate(item.newValue) : item.newValue;

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
          firstname: row[config?.addInfo?.firstname] || "",
          lastname: row[config?.addInfo?.lastname] || "",
        });
      }

      setReviewOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit request.");
    }
  };

  const onAddNewCommunity = async (name: string) => {
    await addCommunity({ communities: [name] }, {}, true);
    dispatch(
      apiEnsure({
        key: "communities",
        url: `${API_BASE}/communities`,
        method: "GET",
        force: true,
      })
    );
  };

  if (!addInfoEnabled) return null;

  if (!config) return <Loader loading={true} text="Loading configuration..." />;


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
        <Box
          sx={{
            background: `linear-gradient(180deg, ${color_secondary} 0%, ${color_secondary_dark} 100%)`,
            px: 2.5,
            py: 1.6,
            borderBottom: `1px solid ${color_border}`,
          }}
        >
          <Typography sx={{ color: color_white, fontWeight: 900, fontSize: "1.15rem" }}>{dialogTitle}</Typography>
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
          {/* ✅ Render in EXACT config order, only editable items */}
          {editableColumnsOrdered.map((c: any) => {
            const t = String(c?.type || "");
            const name = String(c?.name || "");
            const required = isNewEntry && requiredSet.has(name);

            // base field inputs
            if (isBaseFieldType(t) && name) {
              const value = formValues[name];
              const canReset = !isNewEntry;
              const editableField = editableOf(name);

              if (t === "community_multi") {
                const arr = Array.isArray(value)
                  ? value
                  : value
                  ? String(value).split(",").map((x) => x.trim())
                  : [];

                return (
                  <FieldRow key={name} label={name} required={required} onReset={canReset ? () => resetField(name) : undefined}>
                    <CommunityMultiRow
                      values={arr}
                      options={communityOptions}
                      onChange={(next: any) => editableField && updateField(name, next)}
                      onAddNewCommunity={onAddNewCommunity}
                      {...({ disabled: !editableField } as any)}
                    />
                  </FieldRow>
                );
              }

              if (t === "date") {
                return (
                  <FieldRow key={name} label={name} required={required} onReset={canReset ? () => resetField(name) : undefined}>
                    <DateFieldRow
                      value={value || ""}
                      onChange={(v) => editableField && updateField(name, v)}
                      {...({ disabled: !editableField } as any)}
                    />
                  </FieldRow>
                );
              }

              if (t === "multi") {
                const arr = Array.isArray(value)
                  ? value
                  : value
                  ? String(value).split(",").map((x) => x.trim())
                  : [];
                const addLabel = name === "Siblings" ? "Add Sibling" : "Add Name";

                return (
                  <FieldRow key={name} label={name} required={required} onReset={canReset ? () => resetField(name) : undefined}>
                    <MultiValueRow
                      values={arr}
                      onChange={(next) => editableField && updateField(name, next)}
                      addLabel={addLabel}
                      {...({ disabled: !editableField } as any)}
                    />
                  </FieldRow>
                );
              }

              const multiline = t === "textarea";
              return (
                <FieldRow key={name} label={name} required={required} onReset={canReset ? () => resetField(name) : undefined}>
                  <TextFieldRow
                    value={value || ""}
                    onChange={(v) => editableField && updateField(name, v)}
                    multiline={multiline}
                    rows={multiline ? 4 : 1}
                    {...({ disabled: !editableField } as any)}
                  />
                </FieldRow>
              );
            }

            if (t === "doc_upload") {
              return (
                <AdditionalDocsCard
                  key={c?.name || c?.display_name || "photo_upload"}
                  additionalDocs={additionalDocs}
                  totalAdditionalDocsMB={totalAdditionalDocsMB}
                  totalCombinedMB={totalCombinedMB}
                  onUpload={handleDocUpload}
                  onRemove={removeDoc}
                  onUpdateCategory={updateDocCategory}
                  archiveConsent={archiveConsent}
                  setArchiveConsent={setArchiveConsent}
                  {...({ config: c } as any)}
                />
              );
            }

            if (t === "photo_upload") {
              return (
                <PhotoUploadCard
                  key={c?.name || c?.display_name || "doc_upload"}
                  photos={photos}
                  setPhotos={setPhotos}
                  totalCombinedMB={totalCombinedMB}
                  onUpload={handlePhotoUpload}
                  onRemove={removePhoto}
                  consent={consent}
                  setConsent={setConsent}
                  {...({ config: c } as any)}
                />
              );
            }
            return null;
          })}
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
              "&:focus-visible": { outline: `3px solid ${color_focus_ring}`, outlineOffset: "2px" },
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
                "&:focus-visible": { outline: `3px solid ${color_focus_ring}`, outlineOffset: "2px" },
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
                "&:focus-visible": { outline: `3px solid ${color_focus_ring}`, outlineOffset: "2px" },
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
        title={isNewEntry ? "Review New Student" : `Review Changes – ${headerText || "Student"}`}
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