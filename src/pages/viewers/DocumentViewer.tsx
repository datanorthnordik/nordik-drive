"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Link,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import FolderZipIcon from "@mui/icons-material/FolderZip";

import useFetch, { apiRequest } from "../../hooks/useFetch";
import { type ReviewStatusValue } from "../../constants/statuses";
import {
  DOCUMENT_DEFAULT_TIP_TEXT,
  DOCUMENT_EMPTY_TEXT,
  DOCUMENT_FALLBACK_TITLE,
  DOCUMENT_LOAD_ERROR_TITLE,
  DOCUMENT_LOADING_TEXT,
  DOCUMENT_NOT_LOADED_TEXT,
  DOCUMENT_PREVIEW_ACTION_HELPER,
  DOCUMENT_PREVIEW_NOT_AVAILABLE,
  DOCUMENT_UNSUPPORTED_PREVIEW_HELPER,
  DOCUMENT_UNSUPPORTED_PREVIEW_PREFIX,
  DOCUMENT_UNSUPPORTED_PREVIEW_SUFFIX,
  getViewerRequestSummary,
  getViewerStatusLabel,
  VIEWER_APPROVE_LABEL,
  VIEWER_CLOSE_LABEL,
  VIEWER_DOWNLOAD_ALL_LABEL,
  VIEWER_DOWNLOAD_LABEL,
  VIEWER_OPEN_LABEL,
  VIEWER_REJECT_LABEL,
  VIEWER_REVIEW_COMMENT_LABEL,
  VIEWER_REVIEW_TITLE,
} from "./messages";
import {
  getViewerStatusChipSx,
  VIEWER_SECTION_TITLE_SX,
  VIEWER_TITLE_SX,
} from "./styles";

import {
  color_primary,
  color_secondary,
  color_primary_dark,
  color_secondary_dark,
  color_border,
  color_white,
  color_background,
  color_text_primary,
  color_text_light,
} from "../../constants/colors";
import { renderDocxPreview } from "../../lib/docxPreview";

export type ReviewStatus = ReviewStatusValue | null;

export interface ViewerDoc {
  id: number;
  file_name?: string;
  size_bytes?: number;
  mime_type?: string;
  document_category?: string;
  status?: ReviewStatus;
  request_id?: number;
  requestId?: number;

  reviewer_comment?: string;

  reviewed_by?: string;
  reviewed_at?: string;

  // Achiever stories reuse this viewer. Unlike submitted documents, a story
  // can be stored as text or linked video as well as a document.
  story_type?: "document" | "text" | "video" | string;
  story_text?: string;
  video_url?: string;
  original_story_url?: string;
  achiever_story_identified?: string;
  google_details?: string;
  newspapers_details?: string;
  ancestry_details?: string;
  derivation_sources?: string[];
}

export type AchieverStoryTemplateValues = {
  dateOfBirth: string;
  dateOfDeath: string;
  community: string;
  parents: string;
  siblings: string;
  spouse: string;
  education: string;
  residentialSchoolHistory: string;
  note: string;
  achieversStory: string;
  sources: string;
};

export type AchieverStorySubmissionContext = {
  fileId: number;
  rowId: number;
  firstName?: string;
  lastName?: string;
  templateDefaults?: Partial<AchieverStoryTemplateValues>;
  onSubmitted?: () => void;
};

function safeFilename(name: string) {
  return (name || "download.zip")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .trim();
}

function buildZipName(prefix: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return safeFilename(`${prefix}_${ts}.zip`);
}

const normalizeBlob = (x: any): Blob | null => {
  if (!x) return null;
  if (x instanceof Blob) return x;
  if (x?.blob instanceof Blob) return x.blob;
  if (x?.data instanceof Blob) return x.data;
  return null;
};

const isImageMime = (m?: string) => !!m && m.startsWith("image/");
const isPdfMime = (m?: string) => m === "application/pdf";
const isVideoMime = (m?: string) => !!m && m.startsWith("video/");

const isDocxMime = (m?: string) =>
  m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const isLegacyWordMime = (m?: string) => m === "application/msword";

const isExcelMime = (m?: string) =>
  m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  m === "application/vnd.ms-excel";

const isMeaningfulMime = (m?: string) => {
  const normalized = String(m || "").trim().toLowerCase();
  return !!normalized && normalized !== "application/octet-stream";
};

const pickPreviewMime = (preferred?: string, fallback?: string) => {
  if (isMeaningfulMime(preferred)) return String(preferred);
  if (isMeaningfulMime(fallback)) return String(fallback);
  return String(preferred || fallback || "");
};

function guessMimeFromFilename(name?: string) {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (n.endsWith(".doc")) return "application/msword";
  if (n.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (n.endsWith(".xls")) return "application/vnd.ms-excel";
  if (n.endsWith(".txt")) return "text/plain";
  if (n.endsWith(".csv")) return "text/csv";
  if (n.endsWith(".json")) return "application/json";
  if (n.endsWith(".mp4") || n.endsWith(".m4v")) return "video/mp4";
  if (n.endsWith(".webm")) return "video/webm";
  if (n.endsWith(".ogg") || n.endsWith(".ogv")) return "video/ogg";
  if (n.endsWith(".mov")) return "video/quicktime";
  return "";
}

function extensionFromMime(mime?: string) {
  if (!mime) return "";
  if (mime === "application/pdf") return ".pdf";
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "application/msword") return ".doc";
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return ".docx";
  if (mime === "application/vnd.ms-excel") return ".xls";
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return ".xlsx";
  if (mime.startsWith("text/")) return ".txt";
  if (mime === "video/mp4") return ".mp4";
  if (mime === "video/webm") return ".webm";
  if (mime === "video/ogg") return ".ogv";
  if (mime === "video/quicktime") return ".mov";
  return "";
}

function ensureHasExtension(fileName: string, mime?: string) {
  const hasDot = fileName.includes(".");
  if (hasDot) return fileName;
  const ext = extensionFromMime(mime);
  return ext ? `${fileName}${ext}` : fileName;
}

const readBlobAsText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(blob);
  });

const storyTypeOf = (doc?: ViewerDoc) => String(doc?.story_type || "document").trim().toLowerCase();
const isInlineStory = (doc?: ViewerDoc) => {
  const storyType = storyTypeOf(doc);
  const mime = doc?.mime_type || guessMimeFromFilename(doc?.file_name);
  if (storyType === "text") return !isPdfMime(mime);
  if (storyType === "video") return !!String(doc?.video_url || "").trim() || !isVideoMime(mime);
  return false;
};

const storyFallbackTitle = (doc?: ViewerDoc) => {
  if (storyTypeOf(doc) === "text") return "Achiever Story (Text)";
  if (storyTypeOf(doc) === "video") return "Achiever Story (Video)";
  return "Achiever Story";
};

const toEmbeddableVideoURL = (raw?: string) => {
  const value = String(raw || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch" && url.searchParams.get("v")) {
        return `https://www.youtube.com/embed/${url.searchParams.get("v")}`;
      }
      if (url.pathname.startsWith("/embed/")) return value;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${url.pathname.split("/").filter(Boolean)[0] || ""}`;
    if (host === "player.vimeo.com" && url.pathname.startsWith("/video/")) return value;
  } catch {
    return "";
  }
  return "";
};

const fileToDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });

const allowedStoryDocument = (file: File) => /\.(pdf|doc|docx)$/i.test(file.name);
const allowedStoryVideo = (file: File) => /\.(mp4|m4v|webm|ogg|ogv|mov)$/i.test(file.name);

const emptyStoryTemplate: AchieverStoryTemplateValues = {
  dateOfBirth: "",
  dateOfDeath: "",
  community: "",
  parents: "",
  siblings: "",
  spouse: "",
  education: "",
  residentialSchoolHistory: "",
  note: "",
  achieversStory: "",
  sources: "",
};

function AchieverStorySubmissionForm({
  apiBase,
  context,
  onCancel,
}: {
  apiBase: string;
  context: AchieverStorySubmissionContext;
  onCancel: () => void;
}) {
  const [storyType, setStoryType] = useState<"text" | "video" | "document">("text");
  const [template, setTemplate] = useState<AchieverStoryTemplateValues>({
    ...emptyStoryTemplate,
    ...(context.templateDefaults || {}),
  });
  const [videoSource, setVideoSource] = useState<"link" | "upload">("link");
  const [videoURL, setVideoURL] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateTemplateField = (field: keyof AchieverStoryTemplateValues, value: string) => {
    setTemplate((current) => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    if (submitting) return;
    setError("");

    if (storyType === "text" && !template.achieversStory.trim()) {
      setError("Enter the achiever's story before submitting.");
      return;
    }
    if (storyType === "video" && videoSource === "link" && !videoURL.trim()) {
      setError("Enter a link to the video before submitting.");
      return;
    }
    if (storyType === "video" && videoSource === "upload" && !videoFile) {
      setError("Select a video before submitting.");
      return;
    }
    if (storyType === "document" && !documentFile) {
      setError("Select a PDF or Word document before submitting.");
      return;
    }
    if (storyType === "document" && documentFile && !allowedStoryDocument(documentFile)) {
      setError("Story documents must be PDF, DOC, or DOCX files.");
      return;
    }
    if (storyType === "document" && documentFile && documentFile.size > 25 * 1024 * 1024) {
      setError("Story documents must be 25 MB or smaller.");
      return;
    }
    if (storyType === "video" && videoSource === "upload" && videoFile && !allowedStoryVideo(videoFile)) {
      setError("Videos must be MP4, WebM, OGG, or MOV files.");
      return;
    }
    if (storyType === "video" && videoSource === "upload" && videoFile && videoFile.size > 20 * 1024 * 1024) {
      setError("Videos must be 20 MB or smaller.");
      return;
    }

    try {
      setSubmitting(true);
      const document = documentFile
        ? {
            document_type: "document",
            document_category: "achiever_story",
            filename: documentFile.name,
            mime_type: documentFile.type || guessMimeFromFilename(documentFile.name),
            size: documentFile.size,
            data_base64: await fileToDataURL(documentFile),
          }
        : undefined;
      const video = storyType === "video" && videoSource === "upload" && videoFile
        ? {
            document_type: "video",
            document_category: "achiever_story",
            filename: videoFile.name,
            mime_type: videoFile.type || guessMimeFromFilename(videoFile.name),
            size: videoFile.size,
            data_base64: await fileToDataURL(videoFile),
          }
        : undefined;

      await apiRequest(`${apiBase}/file/achiever-stories/request`, "POST", {
        file_id: context.fileId,
        row_id: context.rowId,
        firstname: context.firstName || "",
        lastname: context.lastName || "",
        story_type: storyType,
        story_text: storyType === "text" ? template.achieversStory.trim() : "",
        template: storyType === "text"
          ? {
              date_of_birth: template.dateOfBirth.trim(),
              date_of_death: template.dateOfDeath.trim(),
              community: template.community.trim(),
              parents: template.parents.trim(),
              siblings: template.siblings.trim(),
              spouse: template.spouse.trim(),
              education: template.education.trim(),
              residential_school_history: template.residentialSchoolHistory.trim(),
              note: template.note.trim(),
              achievers_story: template.achieversStory.trim(),
              sources: template.sources
                .split(/\r?\n/)
                .map((source) => source.trim())
                .filter(Boolean),
            }
          : undefined,
        video_url: storyType === "video" && videoSource === "link" ? videoURL.trim() : "",
        video,
        document: storyType === "document" ? document : undefined,
      });
      setSubmitted(true);
      context.onSubmitted?.();
    } catch (submissionError: any) {
      setError(submissionError?.message || "Unable to submit the story.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 760,
        mx: "auto",
        p: { xs: 1, sm: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
      data-testid="achiever-story-submission-form"
    >
      <Box>
        <Typography sx={{ ...VIEWER_TITLE_SX, fontSize: 22 }}>Submit an Achiever Story</Typography>
        <Typography sx={{ mt: 0.75, color: color_text_light }}>
          Have a document or video ready? Upload it here or add a video link. Otherwise, use the recommended guided template and we will create a consistently formatted PDF. The story will be visible after an administrator approves it.
        </Typography>
      </Box>

      {submitted ? (
        <Box sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(39,174,96,0.35)", background: "rgba(39,174,96,0.10)" }}>
          <Typography sx={{ fontWeight: 900, color: "#166534" }}>Story submitted for review.</Typography>
          <Typography sx={{ mt: 0.5, color: color_text_primary }}>It will appear in this person's stories once an administrator approves it.</Typography>
        </Box>
      ) : (
        <>
          <TextField
            select
            label="How would you like to add the story?"
            value={storyType}
            onChange={(event) => setStoryType(event.target.value as "text" | "video" | "document")}
            fullWidth
          >
            <MenuItem value="text">Use the guided template (recommended)</MenuItem>
            <MenuItem value="document">Upload a PDF or Word document</MenuItem>
            <MenuItem value="video">Add or upload a video</MenuItem>
          </TextField>

          {storyType === "text" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(35,82,133,0.28)", background: "rgba(35,82,133,0.07)" }}>
                <Typography sx={{ fontWeight: 900, color: color_secondary }}>Recommended common format</Typography>
                <Typography sx={{ mt: 0.5, color: color_text_primary }}>
                  Add what is known and leave anything else blank. Blank biography fields will appear as “Not recorded” in the generated document.
                </Typography>
              </Box>

              <Typography sx={VIEWER_SECTION_TITLE_SX}>Biographical details</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Date of birth"
                  value={template.dateOfBirth}
                  onChange={(event) => updateTemplateField("dateOfBirth", event.target.value)}
                  helperText="Enter an exact date or descriptive text."
                  fullWidth
                />
                <TextField
                  label="Date of death"
                  value={template.dateOfDeath}
                  onChange={(event) => updateTemplateField("dateOfDeath", event.target.value)}
                  helperText="Enter an exact date or descriptive text."
                  fullWidth
                />
                <TextField label="Community" value={template.community} onChange={(event) => updateTemplateField("community", event.target.value)} fullWidth />
                <TextField label="Parents" value={template.parents} onChange={(event) => updateTemplateField("parents", event.target.value)} fullWidth />
                <TextField label="Siblings" value={template.siblings} onChange={(event) => updateTemplateField("siblings", event.target.value)} fullWidth />
                <TextField label="Spouse" value={template.spouse} onChange={(event) => updateTemplateField("spouse", event.target.value)} fullWidth />
              </Box>
              <TextField label="Education" value={template.education} onChange={(event) => updateTemplateField("education", event.target.value)} fullWidth multiline minRows={2} />
              <TextField label="Residential school history" value={template.residentialSchoolHistory} onChange={(event) => updateTemplateField("residentialSchoolHistory", event.target.value)} fullWidth multiline minRows={3} />
              <TextField label="Note" value={template.note} onChange={(event) => updateTemplateField("note", event.target.value)} fullWidth multiline minRows={3} />

              <Divider />
              <Typography sx={VIEWER_SECTION_TITLE_SX}>Story and sources</Typography>
              <TextField
                required
                label="Achiever's story"
                value={template.achieversStory}
                onChange={(event) => updateTemplateField("achieversStory", event.target.value)}
                fullWidth
                multiline
                minRows={8}
                placeholder="Write the achiever's story here..."
              />
              <TextField
                label="Sources"
                value={template.sources}
                onChange={(event) => updateTemplateField("sources", event.target.value)}
                helperText="Optional. Enter one source or link per line."
                fullWidth
                multiline
                minRows={3}
              />
            </Box>
          )}

          {storyType === "video" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                select
                label="Video source"
                value={videoSource}
                onChange={(event) => setVideoSource(event.target.value as "link" | "upload")}
                fullWidth
              >
                <MenuItem value="link">Add a video link</MenuItem>
                <MenuItem value="upload">Upload a video</MenuItem>
              </TextField>

              {videoSource === "link" ? (
                <TextField
                  label="Video link"
                  value={videoURL}
                  onChange={(event) => setVideoURL(event.target.value)}
                  fullWidth
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  helperText="The viewer will play YouTube, Vimeo, and playable direct links. Other links can be opened in a new tab."
                />
              ) : (
                <Box>
                  <Button component="label" variant="outlined" sx={{ fontWeight: 900 }}>
                    {videoFile ? "Choose a different video" : "Choose video"}
                    <input
                      hidden
                      type="file"
                      accept=".mp4,.m4v,.webm,.ogg,.ogv,.mov,video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
                    />
                  </Button>
                  <Typography sx={{ mt: 1, color: color_text_light }}>
                    {videoFile ? `${videoFile.name} (${Math.ceil(videoFile.size / 1024)} KB)` : "MP4, WebM, OGG, or MOV; maximum 20 MB."}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {storyType === "document" && (
            <Box>
              <Button component="label" variant="outlined" sx={{ fontWeight: 900 }}>
                {documentFile ? "Choose a different document" : "Choose PDF or Word document"}
                <input
                  hidden
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                />
              </Button>
              <Typography sx={{ mt: 1, color: color_text_light }}>
                {documentFile ? `${documentFile.name} (${Math.ceil(documentFile.size / 1024)} KB)` : "PDF, DOC, or DOCX; maximum 25 MB."}
              </Typography>
            </Box>
          )}

          {error && <Typography role="alert" sx={{ color: color_primary, fontWeight: 800 }}>{error}</Typography>}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
            <Button onClick={onCancel} disabled={submitting} variant="outlined">Cancel</Button>
            <Button
              onClick={submit}
              disabled={submitting}
              variant="contained"
              sx={{ background: color_secondary, fontWeight: 900, "&:hover": { background: color_secondary_dark } }}
            >
              {submitting ? "Submitting..." : "Submit for approval"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export type DocumentViewerMode = "view" | "review";

export interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;

  docs: ViewerDoc[];
  startIndex: number;

  mode?: DocumentViewerMode;

  apiBase: string;
  blobEndpointPath?: string;

  showDownloadButton?: boolean;
  showOpenButton?: boolean;

  showBottomBar?: boolean;
  showPrevNext?: boolean;
  showBottomOpenButton?: boolean;
  bottomOpenLabel?: string;

  showApproveReject?: boolean;
  onApprove?: (docId: number) => void;
  onReject?: (docId: number) => void;
  onReviewerCommentChange?: (doc: ViewerDoc, value: string) => void;

  onIndexChange?: (newIndex: number) => void;

  tipText?: string;

  onOpenOverride?: (doc: ViewerDoc, blobUrl: string, mime: string) => void;
  onDownloadOverride?: (doc: ViewerDoc, blobUrl: string, mime: string) => void;

  resolveMime?: (doc: ViewerDoc) => string;

  maxTextChars?: number;
  only_approved?: boolean;
  showReviewerCommentField?: boolean;
  storySubmission?: AchieverStorySubmissionContext;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  open,
  onClose,
  docs,
  startIndex,
  mode = "view",
  apiBase,
  blobEndpointPath = "/api/file/doc",

  showDownloadButton = true,
  showOpenButton = true,

  showBottomBar = true,
  showPrevNext = true,
  showBottomOpenButton = true,
  bottomOpenLabel = "View",

  showApproveReject = mode === "review",
  onApprove,
  onReject,
  onReviewerCommentChange,

  onIndexChange,
  tipText = DOCUMENT_DEFAULT_TIP_TEXT,

  onOpenOverride,
  onDownloadOverride,

  resolveMime,
  maxTextChars = 200000,
  only_approved = false,
  showReviewerCommentField = false,
  storySubmission,
}) => {
  const [index, setIndex] = useState<number>(startIndex || 0);
  const [docBlob, setDocBlob] = useState<Blob | null>(null);
  const [docBlobUrl, setDocBlobUrl] = useState<string>("");
  const [blobMime, setBlobMime] = useState<string>("");
  const [docTextPreview, setDocTextPreview] = useState<string>("");
  const [docxPreviewError, setDocxPreviewError] = useState<string>("");
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [linkedVideoFailed, setLinkedVideoFailed] = useState(false);

  const lastBlobUrlRef = useRef<string>("");
  const docxPreviewRef = useRef<HTMLDivElement | null>(null);

  const {
    data: fileBlobData,
    fetchData: fetchFileBlob,
    loading: fileBlobLoading,
    error: fileBlobError,
  } = useFetch<any>(`${apiBase}${blobEndpointPath}`, "GET", false);

  const {
    data: zipBlobData,
    fetchData: fetchZip,
    loading: zipLoading,
    error: zipError,
  } = useFetch<any>(`${apiBase}/admin/download_files`, "POST", false);

  const zipNameRef = useRef<string>("documents.zip");
  const zipNonceRef = useRef<number>(0);
  const zipLastDoneRef = useRef<number>(0);

  const currentDoc: ViewerDoc | undefined = docs[index];
  const hasDocs = docs.length > 0;
  const currentStoryType = storyTypeOf(currentDoc);
  const isTextStory = currentStoryType === "text";
  const isVideoStory = currentStoryType === "video";
  const hasInlineStoryContent = isInlineStory(currentDoc);
  const embeddedVideoURL = useMemo(() => toEmbeddableVideoURL(currentDoc?.video_url), [currentDoc?.video_url]);

  const currentDocMime = useMemo(() => {
    if (!currentDoc) return "";
    if (resolveMime) return resolveMime(currentDoc) || "";
    const storedMime = currentDoc.mime_type || guessMimeFromFilename(currentDoc.file_name) || "";
    if (storedMime) return storedMime;
    if (isTextStory) return "text/plain";
    return "";
  }, [currentDoc, isTextStory, resolveMime]);

  useEffect(() => {
    setLinkedVideoFailed(false);
  }, [currentDoc?.id, currentDoc?.video_url]);

  const activeDocMime = useMemo(
    () => pickPreviewMime(currentDocMime, blobMime),
    [currentDocMime, blobMime]
  );

  const clearPreview = useCallback(() => {
    const prev = lastBlobUrlRef.current;
    if (prev) URL.revokeObjectURL(prev);
    lastBlobUrlRef.current = "";
    setDocBlob(null);
    setDocBlobUrl("");
    setBlobMime("");
    setDocTextPreview("");
    setDocxPreviewError("");
  }, []);

  const inferredRequestIds = useMemo(() => {
    const set = new Set<number>();

    (docs || []).forEach((d: any) => {
      const rid = (d?.request_id ?? d?.requestId) as unknown;
      if (typeof rid === "number" && Number.isFinite(rid)) set.add(rid);
    });

    return Array.from(set).sort((a, b) => a - b);
  }, [docs]);

  const canDownloadAll = inferredRequestIds.length > 0;

  const handleDownloadAllDocs = useCallback(async () => {
    if (!canDownloadAll || zipLoading) return;

    zipNonceRef.current += 1;

    const label =
      inferredRequestIds.length === 1
        ? `documents_request_${inferredRequestIds[0]}`
        : `documents_requests_${inferredRequestIds.length}`;

    zipNameRef.current = buildZipName(label);

    const body = {
      document_type: "document",
      categorize_by_user: false,
      categorize_by_type: false,
      request_ids: inferredRequestIds,
      only_approved: only_approved,
    };

    await fetchZip(body as any, undefined, false, { responseType: "blob" });
  }, [canDownloadAll, zipLoading, inferredRequestIds, fetchZip, only_approved]);

  const openDocAtIndex = useCallback(
    async (idx: number) => {
      clearPreview();

      const doc = docs[idx];
      if (!doc) return;

      if (isInlineStory(doc)) return;

      await fetchFileBlob(undefined, undefined, false, {
        path: doc.id,
        responseType: "blob",
      });
    },
    [docs, clearPreview, fetchFileBlob]
  );

  useEffect(() => {
    if (!open) return;
    if (!zipBlobData) return;

    const nonce = zipNonceRef.current;
    if (zipLastDoneRef.current === nonce) return;

    const blob = normalizeBlob(zipBlobData);
    if (!blob) return;

    zipLastDoneRef.current = nonce;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipNameRef.current || "documents.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [zipBlobData, open]);

  useEffect(() => {
    if (!zipError) return;
    console.error("Download all documents ZIP failed", zipError);
  }, [zipError]);

  useEffect(() => {
    if (!open) return;
    const safe = Math.min(Math.max(startIndex || 0, 0), Math.max(docs.length - 1, 0));
    setIndex(safe);
    openDocAtIndex(safe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startIndex, docs.length]);

  useEffect(() => {
    return () => {
      const prev = lastBlobUrlRef.current;
      if (prev) URL.revokeObjectURL(prev);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!fileBlobData) return;
    if (!currentDoc) return;
    if (hasInlineStoryContent) return;

    const rawBlob = normalizeBlob(fileBlobData);

    if (!rawBlob) return;

    const forcedType = pickPreviewMime(currentDocMime, rawBlob.type) || "application/octet-stream";

    const fixedBlob = new Blob([rawBlob], { type: forcedType });
    const url = URL.createObjectURL(fixedBlob);

    setDocBlob(fixedBlob);
    setDocBlobUrl(url);
    setBlobMime(forcedType);

    const prev = lastBlobUrlRef.current;
    if (prev) URL.revokeObjectURL(prev);
    lastBlobUrlRef.current = url;

    const isText = forcedType.startsWith("text/") || forcedType === "application/json";

    if (isText) {
      readBlobAsText(fixedBlob)
        .then((txt) => setDocTextPreview(txt.slice(0, maxTextChars)))
        .catch(() => setDocTextPreview(""));
    } else {
      setDocTextPreview("");
    }
  }, [fileBlobData, open, currentDoc, currentDocMime, maxTextChars, hasInlineStoryContent]);

  useEffect(() => {
    const container = docxPreviewRef.current;
    if (container) container.innerHTML = "";
    setDocxPreviewError("");

    if (!open || !docBlob || !isDocxMime(activeDocMime) || !container) return;

    let cancelled = false;

    void renderDocxPreview(docBlob, container).catch((error) => {
      if (cancelled) return;
      container.innerHTML = "";
      setDocxPreviewError(
        error instanceof Error ? error.message : "Failed to render Word preview."
      );
    });

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [open, docBlob, activeDocMime]);

  const canUseCurrentDoc = !!currentDoc && !!docBlobUrl;
  const canGoPrev = hasDocs && index > 0 && !fileBlobLoading;
  const canGoNext = hasDocs && index < docs.length - 1 && !fileBlobLoading;
  const viewerTitle =
    currentDoc?.file_name || (hasDocs ? storyFallbackTitle(currentDoc) : DOCUMENT_EMPTY_TEXT);
  const viewerMeta = currentDoc
    ? `${isTextStory ? "text story" : isVideoStory ? "video story" : activeDocMime || currentDoc.mime_type || "unknown"} | ID: ${currentDoc.id} | ${index + 1}/${docs.length}${
        inferredRequestIds.length === 1 ? ` | ${getViewerRequestSummary(inferredRequestIds)}` : ""
      }`
    : DOCUMENT_EMPTY_TEXT;

  const setIndexAndLoad = useCallback(
    async (nextIdx: number) => {
      const safe = Math.min(Math.max(nextIdx, 0), Math.max(docs.length - 1, 0));
      setIndex(safe);
      onIndexChange?.(safe);
      await openDocAtIndex(safe);
    },
    [docs.length, onIndexChange, openDocAtIndex]
  );

  const handlePrev = async () => setIndexAndLoad(index - 1);
  const handleNext = async () => setIndexAndLoad(index + 1);

  const openInNewTab = useCallback(() => {
    if (!docBlobUrl || !currentDoc) return;

    const mime = activeDocMime || currentDoc.mime_type || "";
    const fileName = ensureHasExtension(
      currentDoc.file_name || `document_${currentDoc.id}`,
      mime
    );

    if (onOpenOverride) {
      onOpenOverride(currentDoc, docBlobUrl, mime);
      return;
    }

    const a = document.createElement("a");
    a.href = docBlobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [docBlobUrl, currentDoc, activeDocMime, onOpenOverride]);

  const download = useCallback(() => {
    if (!docBlobUrl || !currentDoc) return;

    const mime = activeDocMime || currentDoc.mime_type || "";
    if (onDownloadOverride) {
      onDownloadOverride(currentDoc, docBlobUrl, mime);
      return;
    }

    openInNewTab();
  }, [docBlobUrl, currentDoc, activeDocMime, onDownloadOverride, openInNewTab]);

  const closeAndCleanup = () => {
    clearPreview();
    onClose();
  };

  const approveBtnSx = {
    fontWeight: 900,
    textTransform: "uppercase",
    background: color_secondary,
    "&:hover": { background: color_secondary_dark },
    "&.Mui-disabled": { background: color_secondary, color: color_white, opacity: 0.7 },
  } as const;

  const rejectBtnSx = {
    fontWeight: 900,
    textTransform: "uppercase",
    background: color_primary,
    "&:hover": { background: color_primary_dark },
    "&.Mui-disabled": { background: color_primary, color: color_white, opacity: 0.7 },
  } as const;

  return (
    <Dialog
      open={open}
      onClose={closeAndCleanup}
      fullScreen
      PaperProps={{ sx: { background: color_white } }}
      data-testid="document-viewer-modal"
    >
      <Box
        sx={{
          px: { xs: 1.25, sm: 2 },
          py: 1,
          background: color_white,
          borderBottom: `1px solid ${color_border}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              ...VIEWER_TITLE_SX,
              fontSize: 16,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "70vw",
            }}
            title={currentDoc?.file_name}
            data-testid="viewer-filename"
          >
            {viewerTitle}
          </Typography>

          <Typography variant="caption" data-testid="viewer-meta">
            {!currentDoc ? viewerMeta : (
              <>
            {(activeDocMime || currentDoc?.mime_type || "unknown") + " "}
            • ID: {currentDoc?.id} • {index + 1}/{docs.length}
            {inferredRequestIds.length === 1
              ? ` | ${getViewerRequestSummary(inferredRequestIds)}`
              : ""}
              </>
            )}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {storySubmission && (
            <Button
              onClick={() => setSubmissionOpen((current) => !current)}
              variant="contained"
              data-testid="add-achiever-story"
              sx={{
                fontWeight: 900,
                textTransform: "uppercase",
                px: 2,
                background: color_primary,
                "&:hover": { background: color_primary_dark },
              }}
            >
              {submissionOpen ? "View Stories" : "Add a Story"}
            </Button>
          )}

          {showOpenButton && (
            <Button
              onClick={openInNewTab}
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              disabled={!canUseCurrentDoc}
              data-testid="top-open"
              aria-label="top-open"
              sx={{
                fontWeight: 900,
                textTransform: "uppercase",
                borderWidth: 2,
                color: color_white,
                background: color_secondary,
                px: 2,
                "&:hover": { background: color_secondary_dark, borderWidth: 2 },
                "&.Mui-disabled": {
                  opacity: 0.6,
                  color: color_white,
                  background: color_secondary,
                },
              }}
            >
              {VIEWER_OPEN_LABEL}
            </Button>
          )}

          {showDownloadButton && (
            <Button
              onClick={download}
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!canUseCurrentDoc}
              data-testid="top-download"
              aria-label="top-download"
              sx={{
                fontWeight: 900,
                textTransform: "uppercase",
                px: 2,
                background: color_secondary,
                "&:hover": { background: color_secondary_dark },
                "&.Mui-disabled": { opacity: 0.6, background: color_secondary },
              }}
            >
              {VIEWER_DOWNLOAD_LABEL}
            </Button>
          )}

          <Button
            onClick={closeAndCleanup}
            variant="outlined"
            startIcon={<CloseIcon />}
            data-testid="top-close"
            aria-label="top-close"
            sx={{
              fontWeight: 900,
              textTransform: "uppercase",
              borderWidth: 2,
              color: color_text_primary,
              backgroundColor: color_white,
              px: 2,
              "&:hover": { borderWidth: 2, backgroundColor: color_background },
            }}
          >
            {VIEWER_CLOSE_LABEL}
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          px: { xs: 1.25, sm: 2 },
          py: 1,
          background: color_text_primary,
          color: color_white,
          fontWeight: 700,
          fontSize: 13,
        }}
        data-testid="viewer-tip"
      >
        {submissionOpen
          ? "Submitted stories are reviewed by an administrator before they are visible to other users."
          : tipText}
      </Box>

      <Divider />

      <DialogContent
        sx={{
          p: { xs: 1.25, sm: 2 },
          height: "calc(100vh - 112px)",
          boxSizing: "border-box",
          background: color_white,
        }}
      >
        {submissionOpen && storySubmission ? (
          <AchieverStorySubmissionForm
            apiBase={apiBase}
            context={storySubmission}
            onCancel={() => setSubmissionOpen(false)}
          />
        ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            height: "100%",
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              borderRadius: 2,
              border: `1px solid ${color_border}`,
              background: color_white,
              overflow: "hidden",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              position: "relative",
            }}
            data-testid="viewer-preview-shell"
          >
            {!hasInlineStoryContent && fileBlobLoading && (
              <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }} data-testid="viewer-loading">
                <CircularProgress size={24} />
                <Typography sx={{ fontWeight: 700, color: color_text_primary }}>
                  {DOCUMENT_LOADING_TEXT}
                </Typography>
              </Box>
            )}

            {!hasInlineStoryContent && !fileBlobLoading && fileBlobError && (
              <Box sx={{ p: 3 }} data-testid="viewer-error">
                <Typography sx={{ fontWeight: 900, mb: 1, color: color_text_primary }}>
                  {DOCUMENT_LOAD_ERROR_TITLE}
                </Typography>
                <Typography sx={{ color: color_text_light }}>{String(fileBlobError)}</Typography>
              </Box>
            )}

            {isTextStory && hasInlineStoryContent && currentDoc && (
              <Box sx={{ height: "100%", overflow: "auto", p: { xs: 2, sm: 3 } }} data-testid="viewer-story-text">
                <Typography component="div" sx={{ whiteSpace: "pre-wrap", color: color_text_primary, lineHeight: 1.7 }}>
                  {currentDoc.story_text || "No written story has been added yet."}
                </Typography>
              </Box>
            )}

            {isVideoStory && hasInlineStoryContent && currentDoc && (
              <Box
                sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, p: { xs: 2, sm: 3 } }}
                data-testid="viewer-story-video"
              >
                {embeddedVideoURL ? (
                  <iframe
                    title="achiever-story-video"
                    src={embeddedVideoURL}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", minHeight: 360, border: 0, background: "#000" }}
                  />
                ) : currentDoc.video_url && !linkedVideoFailed ? (
                  <video
                    controls
                    src={currentDoc.video_url}
                    onError={() => setLinkedVideoFailed(true)}
                    style={{ width: "100%", maxHeight: "100%", background: "#000" }}
                    data-testid="viewer-linked-video"
                  >
                    Your browser does not support this video format.
                  </video>
                ) : currentDoc.video_url ? (
                  <Typography>
                    <Link href={currentDoc.video_url} target="_blank" rel="noopener noreferrer">
                      Open this story video
                    </Link>
                  </Typography>
                ) : (
                  <Typography color="text.secondary">No video link has been added yet.</Typography>
                )}
              </Box>
            )}

            {!hasInlineStoryContent && !fileBlobLoading && docBlobUrl && (
              <>
                {isPdfMime(activeDocMime) && (
                  <iframe
                    title="pdf-viewer"
                    src={docBlobUrl}
                    data-testid="viewer-pdf-iframe"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: 0,
                      background: "#fff",
                    }}
                  />
                )}

                {isImageMime(activeDocMime) && (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      background: color_background,
                      overflow: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                    }}
                    data-testid="viewer-image-wrap"
                  >
                    <img
                      src={docBlobUrl}
                      alt={currentDoc?.file_name}
                      data-testid="viewer-image"
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                )}

                {isDocxMime(activeDocMime) && !docxPreviewError && (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      background: color_background,
                      overflow: "auto",
                      p: { xs: 1, sm: 2 },
                      boxSizing: "border-box",
                      "& .docx-wrapper": {
                        background: "transparent",
                        padding: 0,
                        minHeight: "100%",
                      },
                    }}
                    data-testid="viewer-docx-wrap"
                  >
                    <Box
                      key={docBlobUrl || currentDoc?.id || "viewer-docx-preview"}
                      ref={docxPreviewRef}
                      data-testid="viewer-docx-preview"
                    />
                  </Box>
                )}

                {isVideoMime(activeDocMime) && (
                  <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#000" }}>
                    <video
                      controls
                      src={docBlobUrl}
                      style={{ width: "100%", maxHeight: "100%", background: "#000" }}
                      data-testid="viewer-uploaded-video"
                    >
                      Your browser does not support this video format.
                    </video>
                  </Box>
                )}

                {isDocxMime(activeDocMime) && !!docxPreviewError && (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 3,
                      textAlign: "center",
                    }}
                    data-testid="viewer-docx-error"
                  >
                    <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                      {DOCUMENT_PREVIEW_NOT_AVAILABLE}
                    </Typography>
                    <Typography sx={{ color: color_text_light, mb: 2 }}>
                      {DOCUMENT_PREVIEW_ACTION_HELPER}
                    </Typography>

                    <Button
                      onClick={openInNewTab}
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
                      data-testid="viewer-docx-open"
                      sx={{
                        fontWeight: 900,
                        background: color_secondary,
                        "&:hover": { background: color_secondary_dark },
                      }}
                    >
                      {VIEWER_OPEN_LABEL}
                    </Button>
                  </Box>
                )}

                {(isLegacyWordMime(activeDocMime) || isExcelMime(activeDocMime)) && (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 3,
                      textAlign: "center",
                    }}
                    data-testid="viewer-unsupported-preview"
                  >
                    <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                      {DOCUMENT_UNSUPPORTED_PREVIEW_PREFIX}{" "}
                      {isLegacyWordMime(activeDocMime) ? "DOC" : "Excel"}{" "}
                      {DOCUMENT_UNSUPPORTED_PREVIEW_SUFFIX}
                    </Typography>
                    <Typography sx={{ color: color_text_light, mb: 2 }}>
                      {DOCUMENT_UNSUPPORTED_PREVIEW_HELPER}
                    </Typography>

                    <Button
                      onClick={openInNewTab}
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
                      data-testid="viewer-unsupported-open"
                      sx={{
                        fontWeight: 900,
                        background: color_secondary,
                        "&:hover": { background: color_secondary_dark },
                      }}
                    >
                      {VIEWER_OPEN_LABEL}
                    </Button>
                  </Box>
                )}

                {!isPdfMime(activeDocMime) &&
                  !isImageMime(activeDocMime) &&
                  !isDocxMime(activeDocMime) &&
                  !isLegacyWordMime(activeDocMime) &&
                  !isExcelMime(activeDocMime) &&
                  !isVideoMime(activeDocMime) &&
                  docTextPreview && (
                    <Box sx={{ p: 2 }} data-testid="viewer-text-wrap">
                      <pre
                        data-testid="viewer-text-pre"
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          margin: 0,
                          color: color_text_primary,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          fontSize: 13,
                        }}
                      >
                        {docTextPreview}
                      </pre>
                    </Box>
                  )}

                {!isPdfMime(activeDocMime) &&
                  !isImageMime(activeDocMime) &&
                  !isDocxMime(activeDocMime) &&
                  !isLegacyWordMime(activeDocMime) &&
                  !isExcelMime(activeDocMime) &&
                  !isVideoMime(activeDocMime) &&
                  !docTextPreview && (
                    <Box
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 3,
                        textAlign: "center",
                      }}
                      data-testid="viewer-unknown-preview"
                    >
                      <Typography sx={{ fontWeight: 900, color: color_text_primary, mb: 0.5 }}>
                        {DOCUMENT_PREVIEW_NOT_AVAILABLE}
                      </Typography>
                      <Typography sx={{ color: color_text_light, mb: 2 }}>
                        {DOCUMENT_PREVIEW_ACTION_HELPER}
                      </Typography>

                      <Button
                        onClick={openInNewTab}
                        variant="contained"
                        startIcon={<OpenInNewIcon />}
                        data-testid="viewer-unknown-open"
                        sx={{
                          fontWeight: 900,
                          background: color_secondary,
                          "&:hover": { background: color_secondary_dark },
                        }}
                      >
                        {VIEWER_OPEN_LABEL}
                      </Button>
                    </Box>
                  )}
              </>
            )}

            {!hasInlineStoryContent && !fileBlobLoading && !fileBlobError && !docBlobUrl && !currentDoc && (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3,
                }}
                data-testid="viewer-empty"
              >
                <Typography sx={{ color: color_text_light, fontWeight: 700 }}>
                  {DOCUMENT_EMPTY_TEXT}
                </Typography>
              </Box>
            )}

            {!hasInlineStoryContent && !fileBlobLoading && !fileBlobError && !docBlobUrl && currentDoc && (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3,
                }}
                data-testid="viewer-not-loaded"
              >
                <Typography sx={{ color: color_text_light, fontWeight: 700 }}>
                  {DOCUMENT_NOT_LOADED_TEXT}
                </Typography>
              </Box>
            )}
          </Box>

          {!!currentDoc?.story_type && currentDoc && (
            <Box
              sx={{
                width: { xs: "100%", md: 340 },
                flexShrink: 0,
                borderRadius: 2,
                border: `1px solid ${color_border}`,
                background: color_white,
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                overflowY: "auto",
              }}
              data-testid="viewer-story-details"
            >
              <Typography sx={VIEWER_SECTION_TITLE_SX}>Story Details</Typography>
              {[
                ["Achiever Story Identified", currentDoc.achiever_story_identified],
                ["Google", currentDoc.google_details],
                ["Newspapers.com", currentDoc.newspapers_details],
                ["Ancestry", currentDoc.ancestry_details],
              ].map(([label, value]) =>
                value ? (
                  <Box key={label}>
                    <Typography variant="caption" sx={{ display: "block", fontWeight: 800, color: color_text_primary }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: color_text_light }}>
                      {value}
                    </Typography>
                  </Box>
                ) : null
              )}
              {!!currentDoc.derivation_sources?.length && (
                <Box>
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 800, color: color_text_primary }}>
                    Sources used
                  </Typography>
                  <Typography variant="body2" sx={{ color: color_text_light }}>
                    {currentDoc.derivation_sources.join(", ")}
                  </Typography>
                </Box>
              )}
              {currentDoc.original_story_url && (
                <Link href={currentDoc.original_story_url} target="_blank" rel="noopener noreferrer" variant="body2">
                  Open original story document
                </Link>
              )}
            </Box>
          )}

          {showReviewerCommentField && currentDoc && (
            <Box
              sx={{
                width: { xs: "100%", md: 340 },
                flexShrink: 0,
                borderRadius: 2,
                border: `1px solid ${color_border}`,
                background: color_white,
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                overflowY: "auto",
              }}
            >
              <Typography sx={VIEWER_SECTION_TITLE_SX}>
                {VIEWER_REVIEW_TITLE}
              </Typography>

              <Chip
                size="small"
                label={getViewerStatusLabel(currentDoc.status)}
                sx={{ alignSelf: "flex-start", ...getViewerStatusChipSx(currentDoc.status) }}
              />

              <TextField
                fullWidth
                size="small"
                label={VIEWER_REVIEW_COMMENT_LABEL}
                value={String(currentDoc.reviewer_comment || "")}
                onChange={(e) => onReviewerCommentChange?.(currentDoc, e.target.value)}
                multiline
                minRows={4}
              />
            </Box>
          )}
        </Box>
        )}

        {showBottomBar && !submissionOpen && (
          <Box
            sx={{
              position: "fixed",
              bottom: 18,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1400,
              display: "flex",
              alignItems: "center",
              gap: 1,
              background: color_white,
              border: `1px solid ${color_border}`,
              borderRadius: 999,
              px: 1.25,
              py: 1,
              boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
              backdropFilter: "blur(8px)",
              maxWidth: "calc(100vw - 24px)",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              width: "max-content",
            }}
            data-testid="viewer-bottom-bar"
          >
            {showPrevNext && (
              <Button
                variant="outlined"
                onClick={handlePrev}
                disabled={!canGoPrev}
                sx={approveBtnSx}
                data-testid="bottom-prev"
              >
                ◀ Prev
              </Button>
            )}

            {showApproveReject && mode === "review" && (
              <>
                <Button
                  variant="contained"
                  onClick={() => currentDoc && onApprove?.(currentDoc.id)}
                  disabled={fileBlobLoading || !currentDoc}
                  sx={approveBtnSx}
                  data-testid="review-approve"
                >
                  {VIEWER_APPROVE_LABEL}
                </Button>

                <Button
                  variant="contained"
                  onClick={() => currentDoc && onReject?.(currentDoc.id)}
                  disabled={fileBlobLoading || !currentDoc}
                  sx={rejectBtnSx}
                  data-testid="review-reject"
                >
                  {VIEWER_REJECT_LABEL}
                </Button>
              </>
            )}

            {showBottomOpenButton && (
              <Button
                variant="outlined"
                onClick={openInNewTab}
                disabled={!canUseCurrentDoc}
                startIcon={<OpenInNewIcon />}
                sx={approveBtnSx}
                data-testid="bottom-open"
              >
                {bottomOpenLabel}
              </Button>
            )}

            {showPrevNext && (
              <Button
                variant="outlined"
                onClick={handleNext}
                disabled={!canGoNext}
                sx={approveBtnSx}
                data-testid="bottom-next"
              >
                Next ▶
              </Button>
            )}

            <Button
              onClick={handleDownloadAllDocs}
              variant="contained"
              startIcon={
                zipLoading ? (
                  <CircularProgress size={16} sx={{ color: color_white }} />
                ) : (
                  <FolderZipIcon />
                )
              }
              disabled={!canDownloadAll || zipLoading}
              sx={approveBtnSx}
              data-testid="download-all"
            >
              {VIEWER_DOWNLOAD_ALL_LABEL}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;
