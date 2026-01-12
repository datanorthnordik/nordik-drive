'use client';

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  useMediaQuery,
  Divider,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { RestartAlt } from "@mui/icons-material";
import { color_primary } from "../../constants/colors";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import toast from "react-hot-toast";
import DropdownDatePicker from "./DropDownPicker";

interface AddInfoFormProps {
  row: Record<string, any>;
  file: Record<string, any>;
  onClose: () => void;
}

const EXCLUDED_FIELDS = ["Lat", "Lng", "id", "Mapping Location", "Photos"];

const fieldTypeMap: Record<string, string> = {
  "Notes": "textarea",
  "Additional Information": "textarea",
  "Admitted": "date",
  "Discharged": "date",
  "Date of Birth": "date",
  "Siblings": "multi",
  "Parents Names": "multi",

  // ✅ Community field type (supports both label variants)
  "First Nation/Community": "community_multi",
  "First Nation / Community": "community_multi",
};

const MAX_PHOTOS = 5;
const MAX_PHOTO_MB = 5;

// ✅ Additional Documents limits (tune as you want)
const MAX_ADDITIONAL_DOCS = 10;
const MAX_ADDITIONAL_DOCS_TOTAL_MB = 10;

// ✅ Hard safety cap to reduce 413 risk with base64 JSON (tune as needed)
const MAX_COMBINED_UPLOAD_MB = 15;

// ---------------------- DOCUMENT TYPES -----------------------
type DocumentType = "photos" | "document";
type DocumentCategory = "birth_certificate" | "death_certificate" | "other_document";

type AdditionalDocItem = {
  id: string;
  file: File;
  document_type: DocumentType;       // always "document" for additional docs
  document_category: DocumentCategory;
};

const DOCUMENT_CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "death_certificate", label: "Death Certificate" },
  { value: "other_document", label: "Other Document" },
];

const ALLOWED_DOC_MIME = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ACCEPT_DOCS =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

// ---------------------- DATE HELPERS -----------------------
const isDdMmYyyy = (v: string) =>
  /^(\d{2})\.(\d{2})\.(\d{4})$/.test(v.trim());

const isoToDdmmyyyy = (v: string): string => {
  const [yyyy, mm, dd] = v.split("-");
  return `${dd}.${mm}.${yyyy}`;
};

const normalizeIncomingDateToDdMmYyyy = (value: string): string => {
  if (!value) return "";
  if (isDdMmYyyy(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return isoToDdmmyyyy(value);
  return value;
};

const toApiDate = (value: string): string => (isDdMmYyyy(value) ? value : "");

// ---------------------- UID -----------------------
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------------------- SIZE HELPERS -----------------------
const bytesToMB = (b: number) => b / (1024 * 1024);
const getTotalBytes = (files: File[]) => files.reduce((sum, f) => sum + f.size, 0);

const estimateBase64Bytes = (rawBytes: number) => Math.ceil(rawBytes * 4 / 3) + 200; // + small overhead for prefix/json
const estimateTotalBase64Bytes = (files: File[]) => files.reduce((sum, f) => sum + estimateBase64Bytes(f.size), 0);

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// ---------------------- MAIN COMPONENT -----------------------
export default function AddInfoForm({ row, file, onClose }: AddInfoFormProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // isNewEntry = true when adding a new student (no row.id)
  const isNewEntry =
    !row || row.id === undefined || row.id === null || row.id === "";

  // Single edit-request API used for BOTH add + edit
  const {
    fetchData: submitEditRequest,
    data: editData,
    error: editError,
    loading: editLoading
  } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/edit/request",
    "POST",
    false
  );

  // ✅ Communities GET + POST (dropdown + manual add)
  const {
    data: communitiesData,
    fetchData: fetchCommunities
  } = useFetch(
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const communityOptions = useMemo(() => {
    return (communitiesData as any)?.communities?.map((c: any) => c.name) || [];
  }, [communitiesData]);

  const normalizeCommunityName = (v: any) =>
    typeof v === "string" ? v.trim() : "";

  const communityExists = (name: string) =>
    communityOptions.some(
      (o: string) => o.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [changedFields, setChangedFields] = useState<Record<string, any>>({});

  const [photos, setPhotos] = useState<File[]>([]);
  const [additionalDocs, setAdditionalDocs] = useState<AdditionalDocItem[]>([]);

  // ✅ BOTH consents needed:
  // 1) Keep existing `consent` key name for PHOTO consent (backward compatibility)
  const [consent, setConsent] = useState<boolean>(false);

  // 2) NEW archive consent for SRS Centre
  const [archiveConsent, setArchiveConsent] = useState<boolean>(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const totalPhotoMB = bytesToMB(getTotalBytes(photos));
  const totalAdditionalDocsMB = bytesToMB(getTotalBytes(additionalDocs.map(d => d.file)));
  const totalCombinedMB = totalPhotoMB + totalAdditionalDocsMB;

  // ---- warning banner computations (photo display limit: MAX_PHOTOS) ----
  const photoCount = photos.length;
  const percentUsed = (photoCount / MAX_PHOTOS) * 100;

  let warningColor = "";
  let warningText = "";

  if (percentUsed >= 80 && percentUsed < 100) {
    warningColor = "#FFE08A"; // yellow
    warningText = "You are close to the upload limit.";
  } else if (percentUsed === 100) {
    warningColor = "#FFB347"; // orange
    warningText = "You have reached the upload limit.";
  } else if (percentUsed > 100) {
    warningColor = "#FF6B6B"; // red
    warningText = "Limit exceeded!";
  }

  // ---------------------- SUCCESS / ERROR HANDLING -----------------------
  useEffect(() => {
    if (editData && !editError) {
      toast.success(
        isNewEntry
          ? "Student added successfully and sent for review."
          : "Changes submitted successfully and sent for review."
      );
      onClose();
    }
    if (editError) {
      toast.error(`Error submitting data: ${editError}`);
    }
  }, [editData, editError, onClose, isNewEntry]);

  const isLoading = editLoading;

  // ---------------------- INITIAL VALUES -----------------------
  useEffect(() => {
    const initial: Record<string, any> = {};

    const keys = Object.keys(row || {}).filter(
      (key) => !EXCLUDED_FIELDS.includes(key)
    );

    // Build fields from row shape (if passed)
    keys.forEach((key) => {
      if (
        ["Siblings", "Parents Names", "First Nation/Community", "First Nation / Community"].includes(key)
      ) {
        if (isNewEntry) {
          initial[key] = [];
        } else {
          initial[key] = (row[key] || "")
            .split(",")
            .map((x: string) => x.trim())
            .filter((x: string) => x.length > 0);
        }
      } else if (fieldTypeMap[key] === "date") {
        initial[key] = isNewEntry
          ? ""
          : normalizeIncomingDateToDdMmYyyy(row[key] || "");
      } else {
        initial[key] = isNewEntry ? "" : row[key] || "";
      }
    });

    // Ensure First Names / Last Names exist in add mode
    if (!("First Names" in initial)) initial["First Names"] = "";
    if (!("Last Names" in initial)) initial["Last Names"] = "";

    // Ensure community exists in add mode even if not in row keys
    if (!("First Nation/Community" in initial) && !("First Nation / Community" in initial)) {
      initial["First Nation/Community"] = [];
    }

    setFormValues(initial);
    setChangedFields({});
  }, [row, isNewEntry]);

  // Derive first/last name from current form for nice title
  const formFirstName = (formValues["First Names"] || "").toString();
  const formLastName = (formValues["Last Names"] || "").toString();
  const fullName = `${formFirstName} ${formLastName}`.trim();

  const dialogTitle = isNewEntry
    ? "Add New Student"
    : `Add Information – ${fullName ||
      `${row["First Names"] || ""} ${row["Last Names"] || ""}`.trim()
      }`;

  // ---------------------- FIELD UPDATER -----------------------
  const updateField = (field: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));

    if (isNewEntry) return;

    let normalized: string;

    if (Array.isArray(value)) normalized = value.join(", ");
    else if (fieldTypeMap[field] === "date")
      normalized = isDdMmYyyy(value) ? value : "";
    else normalized = value;

    if ((row as Record<string, any>)[field] !== normalized) {
      setChangedFields((prev) => ({
        ...prev,
        [field]: {
          field,
          oldValue: (row as Record<string, any>)[field],
          newValue: normalized
        }
      }));
    } else {
      setChangedFields((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // ---------------------- RESET FIELD -----------------------
  const resetField = (label: string) => {
    if (isNewEntry) {
      const cleared =
        fieldTypeMap[label] === "date"
          ? ""
          : ["Siblings", "Parents Names", "First Nation/Community", "First Nation / Community"].includes(label)
            ? []
            : "";
      setFormValues((prev) => ({ ...prev, [label]: cleared }));
      return;
    }

    const original =
      fieldTypeMap[label] === "date"
        ? normalizeIncomingDateToDdMmYyyy(row[label] || "")
        : ["Siblings", "Parents Names", "First Nation/Community", "First Nation / Community"].includes(label)
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

  // ---------------------- RESET ALL -----------------------
  const resetAll = () => {
    if (isNewEntry) {
      const cleared: Record<string, any> = {};
      Object.keys(formValues).forEach((key) => {
        if (EXCLUDED_FIELDS.includes(key)) return;
        if (fieldTypeMap[key] === "date") cleared[key] = "";
        else if (["Siblings", "Parents Names", "First Nation/Community", "First Nation / Community"].includes(key)) cleared[key] = [];
        else cleared[key] = "";
      });
      cleared["First Names"] = "";
      cleared["Last Names"] = "";

      setFormValues(cleared);
      setPhotos([]);
      setAdditionalDocs([]);
      setConsent(false);
      setArchiveConsent(false);
      setConfirmResetAll(false);
      setChangedFields({});
      return;
    }

    const restored: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      if (EXCLUDED_FIELDS.includes(key)) return;

      if (fieldTypeMap[key] === "date") {
        restored[key] = normalizeIncomingDateToDdMmYyyy(row[key] || "");
      } else if (["Siblings", "Parents Names", "First Nation/Community", "First Nation / Community"].includes(key)) {
        restored[key] = (row[key] || "")
          .split(",")
          .map((x: string) => x.trim())
          .filter((x: string) => x.length > 0);
      } else {
        restored[key] = row[key] || "";
      }
    });

    setFormValues(restored);
    setChangedFields({});
    setPhotos([]);
    setAdditionalDocs([]);
    setConsent(false);
    setArchiveConsent(false);
    setConfirmResetAll(false);
  };

  // ---------------------- PHOTO HANDLING -----------------------
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const onlyImages = files.filter((f) => f.type.startsWith("image/"));

    if (onlyImages.length !== files.length) {
      toast.error("Only image files are allowed for photos.");
      event.target.value = "";
      return;
    }

    const nextPhotos = [...photos, ...onlyImages];
    const nextTotalPhotoMB = bytesToMB(getTotalBytes(nextPhotos));
    const nextTotalCombinedMB = nextTotalPhotoMB + totalAdditionalDocsMB;

    if (nextTotalPhotoMB > MAX_PHOTO_MB) {
      toast.error(`Photo size limit exceeded (${MAX_PHOTO_MB} MB total). Please remove some photos or use smaller files.`);
      event.target.value = "";
      return;
    }

    // Combined cap helps prevent 413 when using base64 JSON
    if (nextTotalCombinedMB > MAX_COMBINED_UPLOAD_MB) {
      toast.error(`Total upload too large. Keep combined uploads under ${MAX_COMBINED_UPLOAD_MB} MB.`);
      event.target.value = "";
      return;
    }

    // Keep existing behavior message (extra photos go to gallery review)
    if (nextPhotos.length > MAX_PHOTOS) {
      toast.error("Upload limit reached. Extra photos will be sent to the CSAA Gallery for review.");
    }

    setPhotos(nextPhotos);
    event.target.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---------------------- DOCUMENT HANDLING -----------------------
  const handleDocUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate mime types
    const hasBad = files.some((f) => {
      if (!f.type) return false; // allow unknown, backend can validate
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

    const nextDocsBytes = getTotalBytes(additionalDocs.map(d => d.file)) + getTotalBytes(files);
    const nextDocsMB = bytesToMB(nextDocsBytes);
    if (nextDocsMB > MAX_ADDITIONAL_DOCS_TOTAL_MB) {
      toast.error(`Additional documents total limit exceeded (${MAX_ADDITIONAL_DOCS_TOTAL_MB} MB).`);
      event.target.value = "";
      return;
    }

    const nextTotalCombinedMB = totalPhotoMB + nextDocsMB;
    if (nextTotalCombinedMB > MAX_COMBINED_UPLOAD_MB) {
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
    setAdditionalDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, document_category } : d))
    );
  };

  const removeDoc = (id: string) => {
    setAdditionalDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("File read error"));
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });

  // ---------------------- REVIEW ITEMS -----------------------
  const reviewItems = useMemo(() => {
    if (isNewEntry) {
      return Object.keys(formValues)
        .filter((label) => !EXCLUDED_FIELDS.includes(label))
        .map((field) => {
          let val = formValues[field];
          if (Array.isArray(val)) val = val.join(", ");
          return {
            field,
            oldValue: "",
            newValue: val || ""
          };
        });
    }
    return Object.values(changedFields) as any[];
  }, [isNewEntry, formValues, changedFields]);

  // ---------------------- SAVE -----------------------
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

    if (
      Object.keys(changedFields).length === 0 &&
      photos.length === 0 &&
      additionalDocs.length === 0
    ) {
      toast("No changes made.");
      onClose();
      return;
    }

    setReviewOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      // ✅ extra protection against 413: estimate base64 request size before conversion
      const allFiles = [...photos, ...additionalDocs.map(d => d.file)];
      const estimatedB64Bytes = estimateTotalBase64Bytes(allFiles);
      const estimatedMB = bytesToMB(estimatedB64Bytes);

      // This is an estimate, but prevents obvious oversize requests
      if (estimatedMB > 25) {
        toast.error("Upload too large for a single request. Please reduce file sizes/count (or use server-side upload).");
        return;
      }

      // Existing photo conversion
      const base64Photos = await Promise.all(photos.map(convertToBase64));
      const photosInApp = base64Photos.slice(0, MAX_PHOTOS);
      const photosGallery = base64Photos.slice(MAX_PHOTOS);

      // ✅ New: additional docs conversion + payload objects
      const docsBase64 = await Promise.all(additionalDocs.map((d) => convertToBase64(d.file)));

      const documentsPayload = additionalDocs.map((d, idx) => ({
        document_type: d.document_type,                 // "document"
        document_category: d.document_category,         // birth/death/other
        filename: d.file.name,
        mime_type: d.file.type || "application/octet-stream",
        size: d.file.size,
        data_base64: docsBase64[idx],                   // data URL base64 (same style as photos)
      }));

      // ✅ Base payload: keep existing photo keys untouched (so nothing breaks)
      // ✅ Add ONE key for docs: `documents`
      // ✅ Keep existing `consent` (photos/public use), add `archive_consent`
      const basePayload: any = {
        file_id: file.id,
        filename: file.filename,

        photos_in_app: photosInApp,
        photos_for_gallery_review: photosGallery,

        consent,                 // photo/publication consent (existing)
        archive_consent: archiveConsent, // new

        documents: documentsPayload, // ✅ only one key for additional docs

        is_edited: isNewEntry ? false : true
      };

      if (isNewEntry) {
        const converted: Record<string, any[]> = {};
        const key = "new";

        converted[key] = [];

        Object.keys(formValues)
          .filter((label) => !EXCLUDED_FIELDS.includes(label))
          .forEach((field) => {
            let value = formValues[field];

            if (Array.isArray(value)) value = value.join(", ");
            else if (fieldTypeMap[field] === "date")
              value = toApiDate(value || "");

            converted[key].push({
              row_id: null,
              field_name: field,
              old_value: "",
              new_value: value ?? ""
            });
          });

        submitEditRequest({
          ...basePayload,
          is_edited: false,
          changes: converted,
          row_id: null,
          firstname: formValues["First Names"] || "",
          lastname: formValues["Last Names"] || ""
        });
      } else {
        const converted: Record<string, any[]> = {};

        Object.entries(changedFields).forEach(([field, item]: any) => {
          const newVal =
            fieldTypeMap[field] === "date"
              ? toApiDate(item.newValue)
              : item.newValue;

          const key = row.id;
          if (!converted[key]) converted[key] = [];
          converted[key].push({
            row_id: row.id,
            field_name: field,
            old_value: item.oldValue,
            new_value: newVal
          });
        });

        submitEditRequest({
          ...basePayload,
          is_edited: true,
          changes: converted,
          row_id: row.id,
          firstname: row["First Names"] || "",
          lastname: row["Last Names"] || ""
        });
      }

      setReviewOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit request.");
    }
  };

  return (
    <>
      {isLoading && <Loader loading={isLoading} />}

      <Dialog
        open={true}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "80%",
            maxHeight: "90vh",
            borderRadius: "14px"
          }
        }}
      >
        <DialogTitle sx={{ fontSize: "1.8rem", fontWeight: 800 }}>
          {dialogTitle}
        </DialogTitle>

        <DialogContent
          sx={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 4
          }}
        >
          {/* FIELD EDITS */}
          {Object.keys(formValues).map((label) => {
            if (EXCLUDED_FIELDS.includes(label)) return null;

            const value = formValues[label];
            const type = fieldTypeMap[label] || "text";

            const isNameField =
              label === "First Names" || label === "Last Names";

            // COMMUNITY MULTI
            if (type === "community_multi") {
              const items: string[] = Array.isArray(value)
                ? value
                : value
                  ? String(value)
                    .split(",")
                    .map((x) => x.trim())
                    .filter((x) => x.length > 0)
                  : [];

              const safeItems = items.length === 0 ? [""] : items;

              const handleSetItem = async (index: number, raw: any) => {
                const cleaned = normalizeCommunityName(raw);

                const next = [...safeItems];
                next[index] = cleaned;
                updateField(label, next);

                if (cleaned && !communityExists(cleaned)) {
                  await addCommunity({ name: cleaned }, {}, true);
                  fetchCommunities();
                }
              };

              const handleAdd = () => {
                updateField(label, [...safeItems, ""]);
              };

              const handleRemove = (index: number) => {
                const next = safeItems.filter((_, i) => i !== index);
                updateField(label, next.length === 0 ? [""] : next);
              };

              return (
                <div key={label}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                    {label}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "6px"
                    }}
                  >
                    {safeItems.map((val, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "8px",
                          width: "100%",
                          alignItems: "stretch"
                        }}
                      >
                        <Autocomplete
                          freeSolo
                          fullWidth
                          options={communityOptions}
                          value={val || ""}
                          onChange={(_, newValue) => handleSetItem(idx, newValue)}
                          noOptionsText="No match — type the name and press Enter to add it"
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            "& .MuiInputBase-root": {
                              background: "#fff",
                              borderRadius: 2,
                              minHeight: 52
                            },
                            "& .MuiInputBase-input": {
                              fontSize: "1.15rem",
                              padding: "12px !important"
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              placeholder="Search or type a community (press Enter to add)"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const v = (e.target as HTMLInputElement).value;
                                  handleSetItem(idx, v);
                                }
                              }}
                            />
                          )}
                        />

                        <Button
                          onClick={() => handleRemove(idx)}
                          sx={{
                            minWidth: 52,
                            height: 52,
                            borderRadius: "10px",
                            textTransform: "none",
                            border: "1px solid #999",
                            fontWeight: 700
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "4px",
                        alignItems: "center"
                      }}
                    >
                      <Button
                        onClick={handleAdd}
                        sx={{
                          textTransform: "none",
                          borderRadius: "10px",
                          border: `1px dashed ${color_primary}`,
                          fontWeight: 600,
                          padding: "6px 12px"
                        }}
                      >
                        + Add Community
                      </Button>

                      {!isNewEntry && (
                        <Button
                          onClick={() => resetField(label)}
                          startIcon={<RestartAlt />}
                          sx={{
                            textTransform: "none",
                            border: `2px solid ${color_primary}`,
                            color: color_primary,
                            background: "#fff",
                            fontWeight: 700,
                            fontSize: "1.0rem",
                            borderRadius: "10px",
                            "&:hover": { background: "#eef5ff" }
                          }}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // DATE FIELD
            if (type === "date") {
              return (
                <div key={label}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                    {label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "6px",
                      alignItems: "flex-start"
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                      <TextField
                        fullWidth
                        label="dd.mm.yyyy"
                        value={value || ""}
                        onChange={(e) => updateField(label, e.target.value)}
                        sx={{
                          background: "#fff",
                          borderRadius: 2,
                          "& .MuiInputBase-input": {
                            fontSize: "1.15rem",
                            padding: "12px"
                          }
                        }}
                      />
                      <DropdownDatePicker
                        value={value || ""}
                        onChange={(newVal: string) => updateField(label, newVal)}
                      />
                    </div>

                    {!isNewEntry && (
                      <Button
                        onClick={() => resetField(label)}
                        startIcon={<RestartAlt />}
                        sx={{
                          height: "48px",
                          textTransform: "none",
                          border: `2px solid ${color_primary}`,
                          color: color_primary,
                          background: "#fff",
                          fontWeight: 700,
                          fontSize: "1.15rem",
                          borderRadius: "12px",
                          "&:hover": { background: "#eef5ff" }
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              );
            }

            // MULTI FIELD
            if (type === "multi") {
              const items: string[] = Array.isArray(value)
                ? value
                : value
                  ? String(value)
                    .split(",")
                    .map((x) => x.trim())
                  : [];

              const handleChangeItem = (index: number, newVal: string) => {
                const next = [...items];
                next[index] = newVal;
                updateField(label, next);
              };

              const handleAdd = () => {
                updateField(label, [...items, ""]);
              };

              const handleRemove = (index: number) => {
                const next = items.filter((_, i) => i !== index);
                updateField(label, next);
              };

              return (
                <div key={label}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                    {label}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "6px"
                    }}
                  >
                    {items.map((val, idx) => (
                      <div
                        key={idx}
                        style={{ display: "flex", gap: "8px", width: "100%" }}
                      >
                        <TextField
                          fullWidth
                          value={val}
                          onChange={(e) => handleChangeItem(idx, e.target.value)}
                          sx={{
                            background: "#fff",
                            borderRadius: 2,
                            "& .MuiInputBase-input": {
                              fontSize: "1.15rem",
                              padding: "12px"
                            }
                          }}
                        />
                        <Button
                          onClick={() => handleRemove(idx)}
                          sx={{
                            minWidth: 40,
                            borderRadius: "10px",
                            textTransform: "none",
                            border: "1px solid #999",
                            fontWeight: 600
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "4px",
                        alignItems: "center"
                      }}
                    >
                      <Button
                        onClick={handleAdd}
                        sx={{
                          textTransform: "none",
                          borderRadius: "10px",
                          border: `1px dashed ${color_primary}`,
                          fontWeight: 600,
                          padding: "6px 12px"
                        }}
                      >
                        + Add {label === "Siblings" ? "Sibling" : "Name"}
                      </Button>

                      {!isNewEntry && (
                        <Button
                          onClick={() => resetField(label)}
                          startIcon={<RestartAlt />}
                          sx={{
                            textTransform: "none",
                            border: `2px solid ${color_primary}`,
                            color: color_primary,
                            background: "#fff",
                            fontWeight: 700,
                            fontSize: "1.0rem",
                            borderRadius: "10px",
                            "&:hover": { background: "#eef5ff" }
                          }}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // DEFAULT TEXT / TEXTAREA
            const isAdditionalInfo = label === "Additional Information";

            return (
              <div key={label}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                  {label}
                  {isNewEntry && isNameField && (
                    <span style={{ color: "red", marginLeft: 4 }}>*</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                  <TextField
                    fullWidth
                    multiline={type === "textarea"}
                    rows={type === "textarea" ? 4 : 1}
                    value={value || ""}
                    onChange={(e) => updateField(label, e.target.value)}
                    sx={{
                      background: "#fff",
                      borderRadius: 2,
                      "& .MuiInputBase-input": {
                        fontSize: "1.15rem",
                        padding: "12px"
                      }
                    }}
                  />

                  {!isNewEntry && (
                    <Button
                      onClick={() => resetField(label)}
                      startIcon={<RestartAlt />}
                      sx={{
                        height: "48px",
                        textTransform: "none",
                        border: `2px solid ${color_primary}`,
                        color: color_primary,
                        background: "#fff",
                        fontWeight: 700,
                        fontSize: "1.15rem",
                        borderRadius: "12px",
                        "&:hover": { background: "#eef5ff" }
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>

                {/* ✅ Additional Documents (right under Additional Information) */}
                {isAdditionalInfo && (
                  <div
                    style={{
                      marginTop: 16,
                      background: "#f7f9ff",
                      padding: "18px",
                      borderRadius: "12px",
                      border: "2px solid #d0d7e5"
                    }}
                  >
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 10 }}>
                      Additional Documents
                    </div>

                    <div style={{ fontSize: "1.05rem", color: "#334155", marginBottom: 14 }}>
                      Upload documents such as <b>Birth Certificate</b>, <b>Death Certificate</b>, or other relevant files.
                      Accepted: <b>PDF, DOC/DOCX, JPG/PNG/WEBP</b>.
                      <br />
                      <b>Docs limit:</b> {additionalDocs.length}/{MAX_ADDITIONAL_DOCS} • {totalAdditionalDocsMB.toFixed(2)} MB / {MAX_ADDITIONAL_DOCS_TOTAL_MB} MB
                      <br />
                      <b>Total upload (photos + docs):</b> {totalCombinedMB.toFixed(2)} MB / {MAX_COMBINED_UPLOAD_MB} MB
                    </div>

                    <Button
                      variant="contained"
                      component="label"
                      sx={{
                        background: color_primary,
                        padding: "12px 18px",
                        borderRadius: "12px",
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        textTransform: "none",
                      }}
                    >
                      Upload Documents
                      <input type="file" hidden multiple accept={ACCEPT_DOCS} onChange={handleDocUpload} />
                    </Button>

                    {additionalDocs.length > 0 && (
                      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                        {additionalDocs.map((d) => (
                          <div
                            key={d.id}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              flexWrap: "wrap",
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 12,
                              padding: "10px 12px",
                            }}
                          >
                            <Chip
                              label={d.file.name}
                              variant="outlined"
                              sx={{ fontWeight: 800, maxWidth: 420 }}
                            />

                            <FormControl size="small" sx={{ minWidth: 240 }}>
                              <InputLabel>Document Category</InputLabel>
                              <Select
                                label="Document Category"
                                value={d.document_category}
                                onChange={(e) => updateDocCategory(d.id, e.target.value as DocumentCategory)}
                                sx={{ fontWeight: 800 }}
                              >
                                {DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <Button
                              onClick={() => removeDoc(d.id)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "10px",
                                border: "1px solid #999",
                                fontWeight: 800,
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ✅ Archive Consent (NEW) */}
                    <div
                      style={{
                        marginTop: 16,
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={archiveConsent}
                        onChange={(e) => setArchiveConsent(e.target.checked)}
                        style={{ transform: "scale(1.6)", marginRight: 12 }}
                      />
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        I consent to the <b>Shingwauk Residential Schools Centre</b> archiving the additional information and documents I submit with this request.
                        <Tooltip
                          title={
                            <div style={{ fontSize: "0.95rem", lineHeight: 1.4, maxWidth: 380 }}>
                              By checking this box, you acknowledge that the information and documents you submit may be securely stored (archived) by the Shingwauk Residential Schools Centre
                              for record keeping, survivor support, education, research, and commemorative purposes, subject to applicable policies.
                              <br /><br />
                              Consent is voluntary. If you wish to withdraw consent later, you may contact the Centre; withdrawal may not affect uses already completed.
                            </div>
                          }
                          placement="right"
                          arrow
                          slotProps={{ popper: { disablePortal: true } }}
                        >
                          <IconButton size="small" sx={{ padding: 0.5 }}>
                            <span style={{ fontSize: "1.15rem" }}>ℹ️</span>
                          </IconButton>
                        </Tooltip>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ---------------- PHOTO UPLOAD SECTION ---------------- */}
          <div
            style={{
              background: "#f7f9ff",
              padding: "20px",
              borderRadius: "12px",
              border: "2px solid #d0d7e5"
            }}
          >
            <div style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
              You may upload <b>up to 5 images</b> or <b>{MAX_PHOTO_MB} MB</b> total.
              <br />
              Extra photos will be displayed in the <b>CSAA Gallery</b>.
              <br />
              <b>Total upload (photos + docs):</b> {totalCombinedMB.toFixed(2)} MB / {MAX_COMBINED_UPLOAD_MB} MB
            </div>

            <Button
              variant="contained"
              component="label"
              sx={{
                background: color_primary,
                padding: "14px 24px",
                borderRadius: "12px",
                fontSize: "1.2rem",
                marginBottom: "20px"
              }}
            >
              Select Photos
              <input type="file" hidden accept="image/*" multiple onChange={handlePhotoUpload} />
            </Button>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {photos.map((f, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <img
                    src={URL.createObjectURL(f)}
                    width={140}
                    height={120}
                    style={{
                      borderRadius: 10,
                      border: "2px solid #ccc",
                      objectFit: "cover"
                    }}
                  />
                  <Button
                    onClick={() => removePhoto(idx)}
                    sx={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      minWidth: 36,
                      borderRadius: "50%",
                      fontSize: "1.2rem",
                      border: "1px solid #888",
                      background: color_primary,
                      color: "#fff"
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, fontSize: "1.1rem" }}>
              <b>Upload Limit:</b> {photos.length}/{MAX_PHOTOS} photos (
              {totalPhotoMB.toFixed(2)} MB of {MAX_PHOTO_MB} MB)
              <div
                style={{
                  marginTop: 8,
                  height: 10,
                  width: "100%",
                  background: "#e0e0e0",
                  borderRadius: 8,
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: `${clamp((photos.length / MAX_PHOTOS) * 100, 0, 100)}%`,
                    background: "#4f79ff",
                    height: "100%"
                  }}
                />
              </div>
            </div>

            {warningText && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: warningColor,
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "#333",
                  border: "1px solid #999"
                }}
              >
                {warningText}
              </div>
            )}

            {/* ✅ Photo consent (OLD one, brought back) */}
            <div
              style={{
                marginTop: 18,
                fontSize: "1.15rem",
                display: "flex",
                alignItems: "center"
              }}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ transform: "scale(1.6)", marginRight: 12 }}
              />
              <span style={{ display: "flex", alignItems: "center" }}>
                I consent to have the pictures I upload shared and/or used for CSAA publications (newsletters, photo gallery, social media).
                <Tooltip
                  title={
                    <div style={{ fontSize: "0.95rem", lineHeight: 1.4, maxWidth: 360 }}>
                      By giving consent, you allow CSAA/CSA to display your photos in public galleries, newsletters, and other publications.
                      Some photos may go through CSAA review before they are visible.
                    </div>
                  }
                  placement="right"
                  arrow
                  slotProps={{ popper: { disablePortal: true } }}
                >
                  <IconButton size="small" sx={{ marginLeft: 1, padding: 0.5 }}>
                    <span style={{ fontSize: "1.2rem" }}>ℹ️</span>
                  </IconButton>
                </Tooltip>
              </span>
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ padding: "20px", gap: 2 }}>
          <Button
            onClick={() => setConfirmResetAll(true)}
            startIcon={<RestartAlt />}
            sx={{
              fontSize: "1.2rem",
              padding: "12px 24px",
              borderRadius: "12px",
              textTransform: "none",
              border: `2px solid ${color_primary}`,
              background: "#fff",
              color: color_primary,
              fontWeight: 800
            }}
          >
            Reset All
          </Button>

          <Button
            onClick={onClose}
            sx={{
              fontSize: "1.2rem",
              padding: "12px 24px",
              borderRadius: "10px",
              textTransform: "none",
              border: "1px solid #999",
              fontWeight: 600,
              background: color_primary
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{
              background: color_primary,
              fontSize: "1.2rem",
              padding: "12px 24px",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700
            }}
            onClick={handleSaveClick}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset All Modal */}
      <Dialog open={confirmResetAll} onClose={() => setConfirmResetAll(false)}>
        <DialogTitle sx={{ fontSize: "1.5rem", fontWeight: 800 }}>
          Reset All?
        </DialogTitle>
        <DialogContent sx={{ fontSize: "1.2rem", padding: "20px" }}>
          Are you sure you want to reset all fields and remove uploaded photos and documents?
        </DialogContent>
        <DialogActions sx={{ padding: "18px" }}>
          <Button onClick={() => setConfirmResetAll(false)}>Cancel</Button>
          <Button onClick={resetAll} startIcon={<RestartAlt />}>
            Reset All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)}>
        <DialogTitle sx={{ fontSize: "1.6rem", fontWeight: 800 }}>
          {isNewEntry ? "Review New Student" : `Review Changes – ${fullName || "Student"}`}
        </DialogTitle>
        <DialogContent>
          {reviewItems.map((it, idx) => (
            <div key={idx} style={{ marginBottom: "12px" }}>
              <b>{it.field}</b> <br />
              Old: {it.oldValue || "—"} <br />
              New: {it.newValue || "—"}
            </div>
          ))}

          {(photos.length > 0 || additionalDocs.length > 0) && (
            <>
              <Divider sx={{ margin: "16px 0" }} />
            </>
          )}

          {photos.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <b>Photos:</b> {photos.length} selected
            </div>
          )}

          {additionalDocs.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <b>Additional Documents:</b> {additionalDocs.length} selected
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {additionalDocs.map((d) => (
                  <div key={d.id}>
                    • {d.file.name} —{" "}
                    <b>{DOCUMENT_CATEGORY_OPTIONS.find((x) => x.value === d.document_category)?.label ?? d.document_category}</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <b>Photo consent (CSAA publications):</b> {consent ? "Yes" : "No"}
          </div>
          <div style={{ marginTop: 6 }}>
            <b>Archive consent (Shingwauk Residential Schools Centre):</b> {archiveConsent ? "Yes" : "No"}
          </div>

          <div style={{ marginTop: 10 }}>
            <b>Total upload:</b> {totalCombinedMB.toFixed(2)} MB / {MAX_COMBINED_UPLOAD_MB} MB
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Back</Button>
          <Button variant="contained" onClick={handleConfirmSubmit}>
            {isNewEntry ? "Add Student" : "Submit Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}