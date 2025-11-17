'use client';

import React, { useState, useEffect, use } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  useMediaQuery,
  Divider
} from "@mui/material";
import { Add, RestartAlt, Close } from "@mui/icons-material";
import { color_primary } from "../../constants/colors";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import toast from "react-hot-toast";

interface AddInfoFormProps {
  row: Record<string, any>;
  file: Record<string, any>;
  onClose: () => void;
}

const EXCLUDED_FIELDS = ["Lat", "Lng", "id"];

const fieldTypeMap: Record<string, string> = {
  "Notes": "textarea",
  "Additional Information": "textarea",
  "Admitted": "date",
  "Discharged": "date",
  "Date of Birth": "date",
  "Siblings": "multi",
  "Parents Names": "multi",
};

const ResetButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    onClick={onClick}
    startIcon={<RestartAlt />}
    sx={{
      padding: "10px 20px",
      borderRadius: "12px",
      border: `2px solid ${color_primary}`,
      background: "#ffffff",
      color: color_primary,
      fontSize: "1.15rem",
      fontWeight: 700,
      textTransform: "none",
      whiteSpace: "nowrap",
      height: "48px",
      "&:hover": { background: "#e8f1ff" }
    }}
  >
    Reset
  </Button>
);

// --- helpers for dates (UI shows dd.mm.yyyy) ---
const isDdMmYyyy = (v: string) =>
  /^(\d{2})\.(\d{2})\.(\d{4})$/.test(v.trim());

const ddmmyyyyToIso = (v: string): string => {
  // UI -> yyyy-mm-dd for internal normalization (not for payload)
  const [dd, mm, yyyy] = v.split(".");
  return `${yyyy}-${mm}-${dd}`;
};

const isoToDdmmyyyy = (v: string): string => {
  const [yyyy, mm, dd] = v.split("-");
  return `${dd}.${mm}.${yyyy}`;
};

const normalizeIncomingDateToDdMmYyyy = (value: string): string => {
  if (!value) return "";
  // if already dd.mm.yyyy, keep
  if (isDdMmYyyy(value)) return value;
  // if yyyy-mm-dd -> convert
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return isoToDdmmyyyy(value);
  // if dd.mm.yyyy-like but with single digits -> leave as-is
  return value;
};

// For API we must send dd.mm.yyyy (payload remains unchanged from your logic)
const toApiDate = (value: string): string => (isDdMmYyyy(value) ? value : "");

export default function AddInfoForm({ row, file, onClose }: AddInfoFormProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { fetchData, data, error, loading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/edit/request",
    "POST",
    false
  );

  useEffect(() => {
    if (data && !error) {
       toast.success("Changes submitted successfully and sent for review.");
       onClose();
    }
    if (error) {
        toast.error(`Error submitting changes: ${error}`);
        onClose();
    }
    }, [data, error]);

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [changedFields, setChangedFields] = useState<Record<string, any>>({});
  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);

  // new: review modal (shows diff before final save)
  const [reviewOpen, setReviewOpen] = useState<boolean>(false);

  // keep multi values as arrays in the UI
  const convertMulti = (value: string): string[] =>
    value ? value.split(",").map(v => v.trim()) : [""];

  useEffect(() => {
    const initial: Record<string, any> = {};

    Object.keys(row).forEach((key) => {
      if (EXCLUDED_FIELDS.includes(key)) return;

      if (["Siblings", "Parents Names"].includes(key)) {
        initial[key] = convertMulti(row[key] || "");
      } else if (fieldTypeMap[key] === "date") {
        // show dd.mm.yyyy in UI
        const v = row[key] || "";
        initial[key] = normalizeIncomingDateToDdMmYyyy(v);
      } else {
        initial[key] = row[key] || "";
      }
    });

    setFormValues(initial);
    setChangedFields({});
  }, [row]);

  const updateField = (field: string, newValue: any): void => {
    setFormValues((prev) => ({ ...prev, [field]: newValue }));

    let normalized: string;

    if (Array.isArray(newValue)) {
      normalized = newValue.join(", ");
    } else if (fieldTypeMap[field] === "date") {
      // UI keeps dd.mm.yyyy; payload compares against row[field]
      // Make a comparable "normalized" value in dd.mm.yyyy
      normalized = isDdMmYyyy(newValue) ? newValue : "";
    } else {
      normalized = newValue;
    }

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

  const resetField = (label: string): void => {
    let original: string | string[];

    if (["Siblings", "Parents Names"].includes(label)) {
      original = convertMulti(row[label] || "");
    } else if (fieldTypeMap[label] === "date") {
      original = normalizeIncomingDateToDdMmYyyy(row[label] || "");
    } else {
      original = row[label] || "";
    }

    setFormValues((prev) => ({ ...prev, [label]: original }));

    setChangedFields((prev) => {
      const copy = { ...prev };
      delete copy[label];
      return copy;
    });
  };

  const resetAll = (): void => {
    const restored: Record<string, any> = {};

    Object.keys(row).forEach((key) => {
      if (EXCLUDED_FIELDS.includes(key)) return;

      if (["Siblings", "Parents Names"].includes(key)) {
        restored[key] = convertMulti(row[key] || "");
      } else if (fieldTypeMap[key] === "date") {
        restored[key] = normalizeIncomingDateToDdMmYyyy(row[key] || "");
      } else {
        restored[key] = row[key] || "";
      }
    });

    setFormValues(restored);
    setChangedFields({});
    setConfirmResetAll(false);
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        fontSize: "1.25rem",
        fontWeight: 700,
        marginBottom: "8px",
        color: "#222"
      }}
    >
      {children}
    </div>
  );

  const inputBaseStyle = {
    background: "#fff",
    borderRadius: "12px",
    "& .MuiInputBase-input": {
      padding: "16px",
      fontSize: "1.15rem",
      lineHeight: "1.6rem"
    }
  };

  const renderStandardInput = (label: string, value: any) => (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "flex", gap: "12px" }}>
        <TextField
          fullWidth
          value={value || ""}
          onChange={(e) => updateField(label, e.target.value)}
          sx={{ ...inputBaseStyle, flex: 1 }}
        />
        <ResetButton onClick={() => resetField(label)} />
      </div>
    </div>
  );

  const renderTextArea = (label: string, value: any) => (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "flex", gap: "12px" }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={value || ""}
          onChange={(e) => updateField(label, e.target.value)}
          sx={{ ...inputBaseStyle, flex: 1 }}
        />
        <ResetButton onClick={() => resetField(label)} />
      </div>
    </div>
  );

  // Custom text input for dd.mm.yyyy with validation
  const renderDateInput = (label: string, value: string) => {
    const displayValue = value ?? "";
    const error = displayValue !== "" && !isDdMmYyyy(displayValue);

    return (
      <div>
        <Label>{label}</Label>
        <div style={{ display: "flex", gap: "12px" }}>
          <TextField
            fullWidth
            placeholder="dd.mm.yyyy"
            value={displayValue}
            onChange={(e) => {
              const v = e.target.value;
              updateField(label, v);
            }}
            sx={{ ...inputBaseStyle, flex: 1 }}
            helperText={error ? "Use format dd.mm.yyyy (e.g., 05.11.2025)" : " "}
            error={error}
            inputProps={{ inputMode: "numeric" }}
          />
          <ResetButton onClick={() => resetField(label)} />
        </div>
      </div>
    );
  };

  const renderMultiField = (label: string, value: string[]) => (
    <div>
      <Label>{label}</Label>

      {value.map((val, idx) => (
        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <TextField
            fullWidth
            value={val}
            onChange={(e) => {
              const arr = [...value];
              arr[idx] = e.target.value;
              updateField(label, arr);
            }}
            sx={inputBaseStyle}
          />

          <IconButton
            size="large"
            onClick={() => {
              const arr = value.filter((_, i) => i !== idx);
              updateField(label, arr.length ? arr : [""]);
            }}
          >
            <Close sx={{ fontSize: "2rem" }} />
          </IconButton>
        </div>
      ))}

      <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
        <Button
          startIcon={<Add />}
          onClick={() => updateField(label, [...value, ""])}
          sx={{
            padding: "10px 20px",
            borderRadius: "12px",
            border: `2px solid ${color_primary}`,
            background: "#ffffff",
            color: color_primary,
            fontSize: "1.15rem",
            fontWeight: 700,
            textTransform: "none",
            height: "48px",
            "&:hover": { background: "#e8f1ff" }
          }}
        >
          Add More
        </Button>

        <ResetButton onClick={() => resetField(label)} />
      </div>
    </div>
  );

  // open review modal first
  const handleSaveClick = (): void => {
    if (Object.keys(changedFields).length === 0) {
      onClose();
      return;
    }
    setReviewOpen(true);
  };

  // final submit after review; payload shape unchanged
  const handleConfirmSubmit = (): void => {
    const converted: Record<string, any> = {};

    Object.entries(changedFields).forEach(([field, item]: any) => {
      // ensure date fields are dd.mm.yyyy in payload
      const newVal =
        fieldTypeMap[field] === "date"
          ? toApiDate(item.newValue)
          : item.newValue;

      converted[row.id] = {
        row_id: row.id,
        field_name: field,
        old_value: item.oldValue,
        new_value: newVal
      };
    });

    fetchData({
      changes: converted,
      file_id: file.id,
      filename: file.filename,
      firstname: row["First Names"] || "",
      lastname: row["Last Names"] || ""
    });

    setReviewOpen(false);
  };

  const fullName =
    `${row["First Names"] || ""} ${row["Last Names"] || ""}`.trim();

  // Pretty list for review dialog
  const reviewItems = Object.values(changedFields) as Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;

  return (
    <>
    {loading && <Loader loading={loading} />}
      {/* MAIN FORM */}
      <Dialog
        open={true}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "80%",
            maxHeight: "90vh",
            borderRadius: "14px",
            paddingBottom: "8px"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.8rem",
            fontWeight: 800,
            padding: "20px 28px",
            paddingBottom: "10px",
            color: "#111",
            lineHeight: 1.3
          }}
        >
          Add Information
          {fullName && (
            <span style={{ marginLeft: "8px", fontWeight: 700, color: "#444" }}>
              – {fullName}
            </span>
          )}
        </DialogTitle>

        <DialogContent
          sx={{
            padding: "20px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 4
          }}
        >
          {Object.keys(formValues).map((label) => {
            if (EXCLUDED_FIELDS.includes(label)) return null;

            const value = formValues[label];
            const type = fieldTypeMap[label] || "text";

            if (type === "textarea") return renderTextArea(label, value);
            if (type === "date") return renderDateInput(label, value);
            if (type === "multi") return renderMultiField(label, value);

            return renderStandardInput(label, value);
          })}
        </DialogContent>

        <DialogActions
          sx={{
            padding: "16px 28px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2
          }}
        >
          <Button
            onClick={() => setConfirmResetAll(true)}
            startIcon={<RestartAlt />}
            sx={{
              fontSize: "1.2rem",
              padding: "12px 26px",
              borderRadius: "12px",
              height: "48px",
              textTransform: "none",
              border: `2px solid ${color_primary}`,
              background: "#ffffff",
              color: color_primary,
              fontWeight: 700,
              "&:hover": { background: "#e8f1ff" }
            }}
          >
            Reset All
          </Button>

          <Button
            onClick={onClose}
            sx={{
              fontSize: "1.2rem",
              padding: "12px 26px",
              borderRadius: "10px",
              height: "48px",
              textTransform: "none",
              border: "1px solid #999",
              background: "#f5f5f5",
              color: "#333",
              "&:hover": { background: "#e0e0e0" }
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{
              background: color_primary,
              fontSize: "1.2rem",
              padding: "12px 26px",
              borderRadius: "10px",
              height: "48px",
              textTransform: "none"
            }}
            onClick={handleSaveClick}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* RESET ALL CONFIRM */}
      <Dialog
        open={confirmResetAll}
        onClose={() => setConfirmResetAll(false)}
        PaperProps={{
          sx: {
            width: isMobile ? "90%" : "400px",
            borderRadius: "12px",
            paddingBottom: "10px"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.4rem",
            fontWeight: 700,
            padding: "20px",
            color: "#222"
          }}
        >
          Reset All Fields?
        </DialogTitle>

        <DialogContent sx={{ padding: "20px", fontSize: "1.1rem" }}>
          This will reset all fields back to their original values.
          <br /><br />
          Are you sure you want to continue?
        </DialogContent>

        <DialogActions sx={{ padding: "12px 20px", gap: 2 }}>
          <Button
            onClick={() => setConfirmResetAll(false)}
            sx={{
              padding: "10px 22px",
              borderRadius: "12px",
              border: `2px solid ${color_primary}`,
              background: "#ffffff",
              color: color_primary,
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "48px",
              "&:hover": { background: "#e8f1ff" }
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={resetAll}
            startIcon={<RestartAlt />}
            sx={{
              padding: "10px 22px",
              borderRadius: "12px",
              border: `2px solid ${color_primary}`,
              background: "#ffffff",
              color: color_primary,
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "48px",
              "&:hover": { background: "#e8f1ff" }
            }}
          >
            Yes, Reset All
          </Button>
        </DialogActions>
      </Dialog>

      {/* REVIEW CHANGES CONFIRM (like EditableTable) */}
      <Dialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? "95%" : "700px",
            borderRadius: "12px",
            paddingBottom: "10px"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 800,
            padding: "18px 20px",
            color: "#111"
          }}
        >
          Review Changes – {fullName || "Selected Person"}
        </DialogTitle>

        <DialogContent sx={{ padding: "12px 20px" }}>
          {reviewItems.length === 0 ? (
            <div style={{ fontSize: "1.1rem", padding: "8px 0" }}>
              No changes to submit.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviewItems.map((it, idx) => (
                <div key={idx} style={{ padding: "10px 12px", background: "#f7f9fc", borderRadius: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 6 }}>
                    {it.field}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: "1rem" }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>Old:</span>{" "}
                      <span>{String(it.oldValue ?? "") || "—"}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700 }}>New:</span>{" "}
                      <span>{String(it.newValue ?? "") || "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
              <Divider />
              <div style={{ fontSize: ".95rem", color: "#444" }}>
                Only the fields above will be sent. Dates are submitted as <b>dd.mm.yyyy</b>.
              </div>
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ padding: "12px 20px", gap: 2 }}>
          <Button
            onClick={() => setReviewOpen(false)}
            sx={{
              padding: "10px 22px",
              borderRadius: "12px",
              border: `2px solid ${color_primary}`,
              background: "#ffffff",
              color: color_primary,
              fontSize: "1.1rem",
              fontWeight: 700,
              textTransform: "none",
              height: "48px",
              "&:hover": { background: "#e8f1ff" }
            }}
          >
            Back
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmSubmit}
            sx={{
              background: color_primary,
              padding: "10px 22px",
              borderRadius: "12px",
              fontSize: "1.1rem",
              fontWeight: 700,
              textTransform: "none",
              height: "48px"
            }}
          >
            Submit Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
