import React, { ChangeEvent, useRef, useState } from "react";
import { styled } from "styled-components";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InsertDriveFile, CloudUpload } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { color_primary, color_secondary } from "../constants/colors";
import { MAX_UPLOAD_FILENAME_LENGTH } from "../constants/fileUpload";
import type { AppDispatch, RootState } from "../store/store";
import {
  selectPendingBackgroundTaskCount,
} from "../store/backgroundTasksSlice";
import {
  FILE_UPLOAD_TASK_KIND,
  submitFileUpload,
} from "../store/fileUploadTasks";

interface FileForm {
  files: { filename: string; private: boolean; communityFilter: boolean }[];
}

const getSchema = () =>
  yup.object({
    files: yup
      .array()
      .of(
        yup.object({
          filename: yup
            .string()
            .trim()
            .required("File name is required")
            .max(
              MAX_UPLOAD_FILENAME_LENGTH,
              `File name must be ${MAX_UPLOAD_FILENAME_LENGTH} characters or fewer`
            ),
          private: yup.boolean().default(false),
          communityFilter: yup.boolean().default(false),
        })
      )
      .min(1, "At least one file is required")
      .default([]),
  });

const DropZoneLabel = styled.label`
  border: 2px dashed ${color_secondary};
  border-radius: 12px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fbfdff;
  user-select: none;

  &:hover {
    border-color: ${color_primary};
    background-color: #f5f9ff;
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const PreviewList = styled.div`
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PreviewItem = styled(Paper)`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 14px;
  border-radius: 12px;
  background-color: #ffffff;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: none;

  .file-icon {
    color: ${color_primary};
    font-size: 34px;
    margin-top: 4px;
  }

  .remove-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #0f172a;
    color: white;
    border: none;
    border-radius: 10px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 14px;
    line-height: 28px;
    opacity: 0.85;
  }

  .remove-btn:hover {
    opacity: 1;
  }
`;

const FileUploader: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const inputId = "archival-file-input";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const pendingUploadCount = useSelector((state: RootState) =>
    selectPendingBackgroundTaskCount(state, FILE_UPLOAD_TASK_KIND)
  );

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FileForm>({
    resolver: yupResolver(getSchema()) as any,
    defaultValues: { files: [] },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const formFiles = useWatch({ control, name: "files", defaultValue: [] });
  const hasFilenameLengthError = formFiles.some(
    (file) => String(file?.filename || "").trim().length > MAX_UPLOAD_FILENAME_LENGTH
  );

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    setValue(
      "files",
      updatedFiles.map(() => ({ filename: "", private: false, communityFilter: false })),
      { shouldValidate: false }
    );

    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    setValue(
      "files",
      updatedFiles.map(() => ({ filename: "", private: false, communityFilter: false })),
      { shouldValidate: false }
    );
  };

  const onSubmit = (form: FileForm) => {
    const uploads = files.map((file, index) => {
      const formFile = form.files[index];

      return {
        file,
        filename: String(formFile?.filename || "").trim(),
        private: !!formFile?.private,
        communityFilter: !!formFile?.communityFilter,
      };
    });

    void dispatch(submitFileUpload({ uploads }) as any);

    setValue("files", [], { shouldValidate: false });
    setFiles([]);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Box sx={{ p: 2, background: "#fbfcfe", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
          Document Upload
        </Typography>
        <Typography sx={{ color: "rgba(15, 23, 42, 0.65)", fontSize: "0.8rem", mt: 0.35 }}>
          Upload records to secure archival storage. Supports Excel, and CSV formats.
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {pendingUploadCount > 0 && (
          <Box
            role="status"
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid rgba(37, 99, 235, 0.16)",
              background: "rgba(239, 246, 255, 0.92)",
            }}
          >
            <Typography sx={{ fontWeight: 800, color: "#1d4ed8", fontSize: "0.88rem" }}>
              {pendingUploadCount === 1
                ? "1 upload is running in the background."
                : `${pendingUploadCount} uploads are running in the background.`}
            </Typography>
            <Typography sx={{ mt: 0.35, fontSize: "0.8rem", color: "rgba(30, 64, 175, 0.86)" }}>
              You can keep using the page. We&apos;ll notify you when each upload is ready.
            </Typography>
          </Box>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(320px, 1fr) minmax(320px, 1fr)" },
            gap: 2,
            alignItems: "start",
          }}
        >
          <Box sx={{ position: "relative" }}>
            <HiddenInput
              id={inputId}
              ref={inputRef}
              type="file"
              multiple
              onChange={handleFiles}
            />

            <DropZoneLabel htmlFor={inputId} aria-label="Select files to upload">
              <Box>
                <CloudUpload sx={{ fontSize: 56, color: color_secondary, opacity: 0.9 }} />
                <Typography sx={{ mt: 1, fontWeight: 800, color: "#0f172a" }}>
                  Drag & Drop files here
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: "0.8rem", color: "rgba(15, 23, 42, 0.65)" }}>
                  Maximum file size 500MB. Secure encryption applied automatically.
                </Typography>

                <Button
                  type="button"
                  variant="contained"
                  sx={{
                    mt: 2,
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 1.5,
                    background: color_secondary,
                    px: 2.25,
                    boxShadow: "none",
                    "&:hover": { background: color_secondary, boxShadow: "none", opacity: 0.92 },
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    inputRef.current?.click();
                  }}
                >
                  Select Files from Device
                </Button>
              </Box>
            </DropZoneLabel>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.08)",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <Box sx={{ p: 2, background: "#fbfcfe", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
                Selected Files
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "rgba(15, 23, 42, 0.65)", mt: 0.25 }}>
                Add a display name and set visibility options before upload.
              </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
              {files.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed rgba(0,0,0,0.18)",
                    borderRadius: 2,
                    p: 2,
                    background: "#ffffff",
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: "rgba(15, 23, 42, 0.75)" }}>
                    No files selected
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: "0.8rem", color: "rgba(15, 23, 42, 0.60)" }}>
                    Use the upload area to select one or more files.
                  </Typography>
                </Box>
              ) : (
                <>
                  <PreviewList>
                    {files.map((file, index) => (
                      <PreviewItem key={`${file.name}-${index}`} elevation={0}>
                        <InsertDriveFile className="file-icon" />
                        <Box sx={{ flex: 1 }}>
                          <Controller
                            name={`files.${index}.filename`}
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="File name"
                                variant="outlined"
                                fullWidth
                                size="small"
                                margin="dense"
                                error={!!errors.files?.[index]?.filename}
                                helperText={errors.files?.[index]?.filename?.message}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.5,
                                    background: "#fff",
                                  },
                                  "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                                  "& input": { fontSize: "0.9rem" },
                                }}
                              />
                            )}
                          />

                          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
                            <Controller
                              name={`files.${index}.private`}
                              control={control}
                              defaultValue={false}
                              render={({ field }) => (
                                <FormControlLabel
                                  control={<Checkbox {...field} checked={field.value} />}
                                  label="Mark as Confidential"
                                  sx={{
                                    "& .MuiFormControlLabel-label": {
                                      fontSize: "0.9rem",
                                      fontWeight: 700,
                                    },
                                  }}
                                />
                              )}
                            />
                            <Controller
                              name={`files.${index}.communityFilter`}
                              control={control}
                              defaultValue={false}
                              render={({ field }) => (
                                <FormControlLabel
                                  control={<Checkbox {...field} checked={field.value} />}
                                  label="Enable Community Filter"
                                  sx={{
                                    "& .MuiFormControlLabel-label": {
                                      fontSize: "0.9rem",
                                      fontWeight: 700,
                                    },
                                  }}
                                />
                              )}
                            />
                          </Box>
                        </Box>

                        <button
                          type="button"
                          className="remove-btn"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => handleRemove(index)}
                        >
                          x
                        </button>
                      </PreviewItem>
                    ))}
                  </PreviewList>

                  <Divider sx={{ my: 2 }} />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={hasFilenameLengthError}
                    sx={{
                      width: "100%",
                      textTransform: "none",
                      fontWeight: 900,
                      borderRadius: 1.5,
                      background: color_primary,
                      boxShadow: "none",
                      py: 1.1,
                      "&:hover": { background: color_primary, boxShadow: "none", opacity: 0.92 },
                    }}
                  >
                    Upload Files
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
};

export default FileUploader;
