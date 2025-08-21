import React, { useState, ChangeEvent, useEffect } from "react";
import { styled } from "styled-components";
import { Button, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { color_primary, color_secondary } from "../constants/colors";
import { FileWrapper } from "./Wrappers";
import useFetch from "../hooks/useFetch";
import Loader from "./Loader";

const UploadWrapper = styled.div`
  border: 2px dashed ${color_secondary};
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s, background-color 0.3s;
  flex: 1;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${color_primary};
    background-color: #f9f9f9;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const PreviewList = styled.div`
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const PreviewItem = styled.div`
  position: relative;
  border: 1px solid ${color_secondary};
  border-radius: 8px;
  padding: 6px;
  min-width: 120px;
  text-align: center;

  img {
    max-width: 80px;
    max-height: 80px;
    object-fit: cover;
    margin-bottom: 4px;
  }

  button {
    position: absolute;
    top: -6px;
    right: -6px;
    background: ${color_primary};
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-size: 12px;
    line-height: 18px;
  }
`;


interface FileForm {
    files: { filename: string }[];
}


const getSchema = (files: File[]) => {
    return yup.object({
        files: yup
            .array()
            .of(
                yup.object({
                    filename: yup
                        .string()
                        .trim()
                        .required("File name is required"),
                })
            )
            .min(1, "At least one file is required")
            .default([]),
    });
};


const FileUploader: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);

    const { handleSubmit, control, setValue, formState: { errors } } = useForm<FileForm>({
        resolver: yupResolver(getSchema(files)) as any,
        defaultValues: { files: [] },
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const {loading, error, fetchData, data} = useFetch("http://127.0.0.1:8080/file/upload", "POST", false)


    const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);


        setValue(
            "files",
            updatedFiles.map(() => ({ filename: "" })),
            { shouldValidate: false }
        );
    };


    const handleRemove = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);

        setValue(
            "files",
            updatedFiles.map(() => ({ filename: "" })),
            { shouldValidate: false }
        );
    };


    const onSubmit = (data: FileForm) => {
        const formData = new FormData();

    
        files.forEach((file) => {
            formData.append("files", file);
        });

        data.files.forEach((f) => {
            formData.append("filenames[]", f.filename);
        });

        fetchData(formData)
    };

    useEffect(()=>{
       if(data){
         setValue(
            "files",
            [],
            { shouldValidate: false }
        );
       }
       setFiles([])
    }, [data])

    return (
        <>
            <Loader loading={loading} />
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", gap: "15px" }}>
            <UploadWrapper onClick={() => document.getElementById("fileInput")?.click()}>
                <Typography variant="body1" style={{ color: color_secondary }}>
                    Drag & Drop files here or click to upload
                </Typography>
                <HiddenInput
                    id="fileInput"
                    type="file"
                    multiple
                    onChange={handleFiles}
                />
            </UploadWrapper>

            <div style={{ flex: 1 }}>
                {files.length > 0 && (
                    <PreviewList>
                        {files.map((file, index) => (
                            <FileWrapper>
                                <PreviewItem key={index}>
                                    <Typography variant="caption">{file.name}</Typography>
                                    <button type="button" onClick={() => handleRemove(index)}>×</button>
                                </PreviewItem>
                                <Controller
                                    name={`files.${index}.filename`}
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            style={{margin:"0px"}}
                                            {...field}
                                            label="File name"
                                            variant="outlined"
                                            fullWidth
                                            size="small"
                                            margin="normal"
                                            error={!!errors.files?.[index]?.filename}
                                            helperText={errors.files?.[index]?.filename?.message}
                                        />
                                    )}
                                />
                            </FileWrapper>
                        ))}
                    </PreviewList>
                )}

                {files.length > 0 && (
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        style={{ marginTop: "1rem", width: "100%" }}
                    >
                        Upload
                    </Button>
                )}
            </div>
        </form>
        </>
    );
};

export default FileUploader;
