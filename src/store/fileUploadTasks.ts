import { apiUrl } from "../config/api";
import { apiRequest } from "../hooks/useFetch";
import { setFiles } from "./auth/fileSlice";
import { runBackgroundTask } from "./backgroundTasksSlice";

export const FILE_UPLOAD_TASK_KIND = "file-upload";

export interface PendingFileUpload {
  file: File;
  filename: string;
  private: boolean;
  communityFilter: boolean;
}

const buildUploadFormData = (uploads: PendingFileUpload[]) => {
  const formData = new FormData();

  uploads.forEach((upload) => {
    formData.append("files", upload.file);
  });

  uploads.forEach((upload) => {
    formData.append("filenames", upload.filename);
    formData.append("private", String(upload.private));
    formData.append("community_filter", String(upload.communityFilter));
  });

  return formData;
};

export const submitFileUpload =
  ({ uploads }: { uploads: PendingFileUpload[] }) =>
  async (dispatch: any, getState: () => any) => {
    const normalizedUploads = (uploads || []).filter((upload) => upload?.file);
    if (normalizedUploads.length === 0) return null;

    const token = getState()?.auth?.token || undefined;
    const uploadLabel =
      normalizedUploads.length === 1
        ? normalizedUploads[0].filename
        : `${normalizedUploads.length} files`;

    return dispatch(
      runBackgroundTask({
        kind: FILE_UPLOAD_TASK_KIND,
        label: uploadLabel,
        request: () =>
          apiRequest<any>(
            apiUrl("file/upload"),
            "POST",
            buildUploadFormData(normalizedUploads),
            {},
            token
          ),
        getSuccessMessage: () =>
          normalizedUploads.map(
            (upload) => `${upload.filename} has been successfully uploaded.`
          ),
        getErrorMessage: (error) =>
          error?.message || "Upload failed. Please try again later.",
        onSuccess: async () => {
          try {
            const filesResponse = await apiRequest<any>(
              apiUrl("file"),
              "GET",
              undefined,
              {},
              token
            );

            dispatch(setFiles({ files: filesResponse?.files || [] }));
          } catch {
            // Keep the successful upload toast even if the follow-up refresh misses.
          }
        },
      }) as any
    );
  };
