import React, { useState, ChangeEvent, useEffect } from "react";
import { styled } from "styled-components";
import {
  Button, TextField, Typography, Checkbox, FormControlLabel, Paper
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { color_primary, color_secondary } from "../constants/colors";
import { FileWrapper } from "./Wrappers";
import useFetch from "../hooks/useFetch";
import Loader from "./Loader";
import { InsertDriveFile } from "@mui/icons-material";

const UploadWrapper = styled(Paper)`
  border: 2px dashed ${color_secondary};
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s, background-color 0.3s;
  flex: 1;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fefefe;

  &:hover {
    border-color: ${color_primary};
    background-color: #f9f9f9;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const PreviewList = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const PreviewItem = styled(Paper)`
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 15px 20px;
  border-radius: 12px;
  background-color: #fafafa;
  position: relative;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);

  .file-icon {
    color: ${color_primary};
    font-size: 40px;
  }

  .remove-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background: ${color_primary};
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 18px;
    line-height: 26px;
  }
`;

interface FileForm {
  files: { filename: string; private: boolean }[];
}

const getSchema = (files: File[]) =>
  yup.object({
    files: yup
      .array()
      .of(
        yup.object({
          filename: yup.string().trim().required("File name is required"),
          private: yup.boolean().default(false),
        })
      )
      .min(1, "At least one file is required")
      .default([]),
  });

const FileUploader: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FileForm>({
    resolver: yupResolver(getSchema(files)) as any,
    defaultValues: { files: [] },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { loading, error, fetchData, data } = useFetch("https://127.0.0.1:8080/file/upload", "POST", false);

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    setValue(
      "files",
      updatedFiles.map(() => ({ filename: "", private: false })),
      { shouldValidate: false }
    );
  };

  const handleRemove = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    setValue(
      "files",
      updatedFiles.map(() => ({ filename: "", private: false })),
      { shouldValidate: false }
    );
  };

  const onSubmit = (data: FileForm) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    data.files.forEach((f) => {
      formData.append("filenames", f.filename);
      formData.append("private", f.private.toString());
    });
    fetchData(formData);
  };

  useEffect(() => {
    if (data) {
      setValue("files", [], { shouldValidate: false });
      setFiles([]);
    }
  }, [data]);

  return (
    <>
      <Loader loading={loading} />
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <UploadWrapper onClick={() => document.getElementById("fileInput")?.click()} elevation={2}>
          <Typography variant="h6" style={{ color: color_secondary, fontSize: "1.1rem" }}>
            📂 Drag & Drop files here <br /> or click to select
          </Typography>
          <HiddenInput id="fileInput" type="file" multiple onChange={handleFiles} />
        </UploadWrapper>

        <div style={{ flex: 1, minWidth: "280px" }}>
          {files.length > 0 && (
            <PreviewList>
              {files.map((file, index) => (
                <FileWrapper key={index}>
                  <PreviewItem elevation={1}>
                    <InsertDriveFile className="file-icon" />
                    <div style={{ flex: 1 }}>
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
                            size="medium"
                            margin="dense"
                            InputLabelProps={{ style: { fontSize: "1rem" } }}
                            inputProps={{ style: { fontSize: "1rem" } }}
                            error={!!errors.files?.[index]?.filename}
                            helperText={errors.files?.[index]?.filename?.message}
                          />
                        )}
                      />
                      <Controller
                        name={`files.${index}.private`}
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Checkbox {...field} checked={field.value} />}
                            label="Mark as Confidential"
                            sx={{ marginTop: 1, "& .MuiFormControlLabel-label": { fontSize: "1rem" } }}
                          />
                        )}
                      />
                    </div>
                    <button type="button" className="remove-btn" onClick={() => handleRemove(index)}>
                      ×
                    </button>
                  </PreviewItem>
                </FileWrapper>
              ))}
            </PreviewList>
          )}

          {files.length > 0 && (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              style={{ marginTop: "1.5rem", width: "100%", fontSize: "1.1rem", padding: "10px" }}
            >
              ✅ Upload Files
            </Button>
          )}
        </div>
      </form>
    </>
  );
};

export default FileUploader;
