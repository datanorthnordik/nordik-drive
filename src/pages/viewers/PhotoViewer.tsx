"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

import useFetch from "../../hooks/useFetch";
import { type ReviewStatusValue } from "../../constants/statuses";
import { API_BASE } from "../../config/api";
import {
    getViewerStatusLabel,
    PHOTO_VIEWER_TITLE,
    VIEWER_APPROVE_LABEL,
    VIEWER_COMMENTS_TITLE,
    VIEWER_DOWNLOAD_LABEL,
    VIEWER_EMPTY_COUNT_TEXT,
    VIEWER_NEXT_TOOLTIP,
    VIEWER_NO_COMMENTS_TEXT,
    VIEWER_NO_PHOTOS_TEXT,
    VIEWER_PREVIOUS_TOOLTIP,
    VIEWER_REJECT_LABEL,
    VIEWER_RESET_ZOOM_TOOLTIP,
    VIEWER_REVIEW_COMMENT_LABEL,
    VIEWER_REVIEW_TITLE,
    VIEWER_UPLOADER_COMMENT_TITLE,
    VIEWER_ZOOM_IN_TOOLTIP,
    VIEWER_ZOOM_OUT_TOOLTIP,
} from "./messages";
import {
    getViewerStatusChipSx,
    VIEWER_SECTION_TITLE_SX,
    VIEWER_SUBSECTION_TITLE_SX,
    VIEWER_TITLE_SX,
} from "./styles";

import {
    color_primary,
    color_primary_dark,
    color_secondary,
    color_secondary_dark,
    color_white,
    color_white_smoke,
    color_border,
    color_text_secondary,
    color_text_light,
} from "../../constants/colors";

type ReviewStatus = ReviewStatusValue | null | undefined;

export interface ViewerPhoto {
    id: number;
    file_name?: string;
    mime_type?: string;
    status?: ReviewStatus;

    request_id?: number;
    requestId?: number;

    photo_comment?: string;
    reviewer_comment?: string;

    [key: string]: any;
}

export type PhotoViewerMode = "view" | "review";

interface PhotoViewerModalProps {
    open: boolean;
    onClose: () => void;

    photos: ViewerPhoto[];
    startIndex?: number;

    mode?: PhotoViewerMode;
    onApprove?: (id: number) => void;
    onReject?: (id: number) => void;

    onReviewerCommentChange?: (photo: ViewerPhoto, value: string) => void;

    showThumbnails?: boolean;
    showStatusPill?: boolean;
    showCommentsPanel?: boolean;
    showReviewerCommentField?: boolean;

    only_approved?: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

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

const buildPhotoUrl = (id: number) => `${API_BASE}/file/photo/${id}`;
const buildPhotoThumbUrl = (id: number) => `${API_BASE}/file/photo/${id}`;

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
    open,
    onClose,
    photos,
    startIndex = 0,
    mode = "view",
    onApprove,
    onReject,
    onReviewerCommentChange,
    showThumbnails = true,
    showStatusPill = true,
    showCommentsPanel = true,
    showReviewerCommentField = false,
    only_approved = false,
}) => {
    const theme = useTheme();
    const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;
    const ZOOM_STEP = 0.25;

    const galleryRef = useRef<any>(null);

    const safeStartIndex = useMemo(() => {
        if (!photos?.length) return 0;
        return clamp(startIndex, 0, photos.length - 1);
    }, [startIndex, photos?.length]);

    const [currentIndex, setCurrentIndex] = useState<number>(safeStartIndex);
    const [zoom, setZoom] = useState<number>(1);
    const [isCommentFocused, setIsCommentFocused] = useState(false);

    useEffect(() => {
        if (!open) return;
        setCurrentIndex(safeStartIndex);
        setZoom(1);
        setIsCommentFocused(false);
        setTimeout(() => galleryRef.current?.slideToIndex?.(safeStartIndex), 0);
    }, [open, safeStartIndex]);

    const currentPhoto = photos?.[currentIndex];

    const uploaderCommentText = useMemo(
        () => (currentPhoto?.photo_comment || "").trim(),
        [currentPhoto?.photo_comment]
    );

    const reviewerCommentText = useMemo(
        () => currentPhoto?.reviewer_comment || "",
        [currentPhoto?.reviewer_comment]
    );

    const inferredRequestIds = useMemo(() => {
        const set = new Set<number>();

        (photos || []).forEach((p) => {
            const rid = (p?.request_id ?? p?.requestId) as unknown;
            if (typeof rid === "number" && Number.isFinite(rid)) set.add(rid);
        });

        return Array.from(set).sort((a, b) => a - b);
    }, [photos]);

    const {
        data: mediaBlobData,
        fetchData: fetchMediaBlob,
        loading: mediaBlobLoading,
        error: mediaBlobError,
    } = useFetch<any>(`${API_BASE}/file/doc/download`, "POST", false);

    const [pendingDownload, setPendingDownload] = useState<{
        id: number;
        filename: string;
        mime?: string;
    } | null>(null);

    const normalizeBlob = (x: any): Blob | null => {
        if (!x) return null;
        if (x instanceof Blob) return x;
        if (x?.blob instanceof Blob) return x.blob;
        if (x?.data instanceof Blob) return x.data;
        return null;
    };

    const triggerDownloadFromBlob = (raw: Blob, filename: string, mime?: string) => {
        const blob = mime ? new Blob([raw], { type: mime }) : raw;
        const a = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = filename || "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
    };

    const downloadPhotoById = useCallback(
        (id: number, filename?: string, mime?: string) => {
            if (!id || Number.isNaN(id)) return;
            if (mediaBlobLoading) return;

            setPendingDownload({
                id,
                filename: filename || `photo_${id}.jpg`,
                mime: mime || "image/jpeg",
            });

            fetchMediaBlob(undefined, undefined, false, {
                path: id,
                responseType: "blob",
            });
        },
        [fetchMediaBlob, mediaBlobLoading]
    );

    useEffect(() => {
        if (!pendingDownload) return;
        const b = normalizeBlob(mediaBlobData);
        if (!b) return;

        try {
            triggerDownloadFromBlob(b, pendingDownload.filename, pendingDownload.mime);
        } finally {
            setPendingDownload(null);
        }
    }, [mediaBlobData, pendingDownload]);

    useEffect(() => {
        if (!pendingDownload) return;
        if (!mediaBlobError) return;
        setPendingDownload(null);
    }, [mediaBlobError, pendingDownload]);

    const {
        data: zipBlobData,
        fetchData: fetchZip,
        loading: zipLoading,
        error: zipError,
    } = useFetch<any>(`${API_BASE}/admin/download_files`, "POST", false);

    const zipNameRef = useRef<string>("photos.zip");
    const zipNonceRef = useRef<number>(0);
    const zipLastDoneRef = useRef<number>(0);

    const canDownloadAll = inferredRequestIds.length > 0;

    const handleDownloadAllPhotos = useCallback(async () => {
        if (!canDownloadAll || zipLoading) return;

        zipNonceRef.current += 1;
        const label =
            inferredRequestIds.length === 1
                ? `photos_request_${inferredRequestIds[0]}`
                : `photos_requests_${inferredRequestIds.length}`;

        zipNameRef.current = buildZipName(label);

        const body = {
            document_type: "photos",
            categorize_by_user: false,
            categorize_by_type: false,
            only_approved: only_approved,
            request_ids: inferredRequestIds,
        };

        await fetchZip(body as any, undefined, false, { responseType: "blob" });
    }, [canDownloadAll, zipLoading, fetchZip, inferredRequestIds, only_approved]);

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
        a.download = zipNameRef.current || "photos.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, [zipBlobData, open]);

    useEffect(() => {
        if (!zipError) return;
        console.error("Download all photos ZIP failed", zipError);
    }, [zipError]);

    const galleryItems = useMemo(() => {
        return (photos || []).map((p) => ({
            original: buildPhotoUrl(p.id),
            thumbnail: buildPhotoThumbUrl(p.id),
            originalClass: "gallery-image",
        }));
    }, [photos]);

    const zoomIn = () =>
        setZoom((z) => clamp(Number((z + ZOOM_STEP).toFixed(2)), ZOOM_MIN, ZOOM_MAX));
    const zoomOut = () =>
        setZoom((z) => clamp(Number((z - ZOOM_STEP).toFixed(2)), ZOOM_MIN, ZOOM_MAX));
    const resetZoom = () => setZoom(1);

    const handlePrev = () => {
        if (!photos.length) return;
        const next = Math.max(currentIndex - 1, 0);
        setCurrentIndex(next);
        galleryRef.current?.slideToIndex?.(next);
    };

    const handleNext = () => {
        if (!photos.length) return;
        const next = Math.min(currentIndex + 1, photos.length - 1);
        setCurrentIndex(next);
        galleryRef.current?.slideToIndex?.(next);
    };

    const stopGalleryKeyCapture = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        (e.nativeEvent as any).stopImmediatePropagation?.();
    };

    const approveBtnSx = {
        fontWeight: 900,
        textTransform: "uppercase",
        px: isSmDown ? 1.6 : 2.2,
        borderRadius: 999,
        background: color_secondary,
        color: color_white,
        "&:hover": { background: color_secondary_dark },
    };

    const rejectBtnSx = {
        fontWeight: 900,
        textTransform: "uppercase",
        px: isSmDown ? 1.6 : 2.2,
        borderRadius: 999,
        background: color_primary,
        color: color_white,
        "&:hover": { background: color_primary_dark },
    };

    const downloadBtnSx = {
        fontWeight: 900,
        textTransform: "uppercase",
        px: isSmDown ? 1.6 : 2.2,
        borderRadius: 999,
        background: color_secondary,
        color: color_white,
        "&:hover": { background: color_secondary_dark },
        whiteSpace: "nowrap",
    };

    const toolIconBtnSx = {
        width: 44,
        height: 44,
        border: `1px solid ${color_border}`,
        background: color_white,
        "&:hover": { background: color_white_smoke },
    } as const;

    const renderZoomableItem = useCallback(
        (item: any) => {
            return (
                <Box
                    sx={{
                        width: "100%",
                        height: "100%",
                        overflow: "auto",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "#000",
                        position: "relative",
                    }}
                >
                    {showStatusPill && currentPhoto && (
                        <Chip
                            size="small"
                            label={getViewerStatusLabel(currentPhoto.status)}
                            sx={{
                                position: "absolute",
                                top: 14,
                                left: 14,
                                zIndex: 5,
                                ...getViewerStatusChipSx(currentPhoto.status),
                            }}
                        />
                    )}

                    <Box sx={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
                        <img
                            src={item.original}
                            alt=""
                            style={{
                                display: "block",
                                maxWidth: "100%",
                                maxHeight: showThumbnails ? "72vh" : "82vh",
                                objectFit: "contain",
                            }}
                        />
                    </Box>
                </Box>
            );
        },
        [zoom, showThumbnails, showStatusPill, currentPhoto]
    );

    const sidePanelVisible = currentPhoto && (showCommentsPanel || showReviewerCommentField);

    return (
        <Dialog open={open} onClose={onClose} fullScreen>
            <DialogTitle
                sx={{
                    py: 0.9,
                    px: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    background: color_white,
                }}
            >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ ...VIEWER_TITLE_SX, fontSize: 16 }}>
                        {PHOTO_VIEWER_TITLE}
                    </Typography>
                    <Typography variant="caption" sx={{ color: color_text_light, fontWeight: 700 }}>
                        {photos?.length ? `${currentIndex + 1} / ${photos.length}` : VIEWER_EMPTY_COUNT_TEXT}
                        {inferredRequestIds.length === 1
                            ? ` • Request #${inferredRequestIds[0]}`
                            : inferredRequestIds.length > 1
                                ? ` • ${inferredRequestIds.length} Requests`
                                : ""}
                    </Typography>
                </Box>

                <IconButton onClick={onClose} sx={{ border: `1px solid ${color_border}` }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent
                sx={{
                    background: "#000",
                    p: 0,
                    display: "flex",
                    justifyContent: "stretch",
                    alignItems: "stretch",
                }}
            >
                {!photos?.length ? (
                    <Box sx={{ mt: 4, color: "#fff", px: 2 }}>
                        <Typography sx={{ fontWeight: 800 }}>{VIEWER_NO_PHOTOS_TEXT}</Typography>
                    </Box>
                ) : (
                    <Box sx={{ width: "100%", height: "100%", display: "flex", minHeight: 0 }}>
                        <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
                            <ImageGallery
                                ref={galleryRef}
                                items={galleryItems}
                                startIndex={safeStartIndex}
                                showPlayButton={false}
                                showFullscreenButton={false}
                                showThumbnails={showThumbnails}
                                thumbnailPosition="bottom"
                                disableKeyDown={isCommentFocused}
                                onSlide={(idx) => {
                                    setCurrentIndex(idx);
                                    setZoom(1);
                                    setIsCommentFocused(false);
                                }}
                                renderItem={renderZoomableItem}
                            />

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
                                    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                                    maxWidth: "calc(100vw - 24px)",
                                    overflowX: "auto",
                                    WebkitOverflowScrolling: "touch",
                                }}
                            >
                                <Tooltip title={VIEWER_PREVIOUS_TOOLTIP}>
                                    <span>
                                        <IconButton onClick={handlePrev} disabled={currentIndex === 0} sx={toolIconBtnSx}>
                                            <NavigateBeforeIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title={VIEWER_ZOOM_OUT_TOOLTIP}>
                                    <span>
                                        <IconButton onClick={zoomOut} disabled={zoom <= ZOOM_MIN} sx={toolIconBtnSx}>
                                            <ZoomOutIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title={VIEWER_RESET_ZOOM_TOOLTIP}>
                                    <IconButton onClick={resetZoom} sx={toolIconBtnSx}>
                                        <RestartAltIcon />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title={VIEWER_ZOOM_IN_TOOLTIP}>
                                    <span>
                                        <IconButton onClick={zoomIn} disabled={zoom >= ZOOM_MAX} sx={toolIconBtnSx}>
                                            <ZoomInIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Box sx={{ px: 0.5, fontWeight: 900, color: color_text_secondary }}>
                                    {Math.round(zoom * 100)}%
                                </Box>

                                {mode === "review" && (
                                    <>
                                        <Button
                                            variant="contained"
                                            sx={approveBtnSx}
                                            disabled={!currentPhoto?.id || !onApprove}
                                            onClick={() => currentPhoto?.id && onApprove?.(currentPhoto.id)}
                                        >
                                            {VIEWER_APPROVE_LABEL}
                                        </Button>

                                        <Button
                                            variant="contained"
                                            sx={rejectBtnSx}
                                            disabled={!currentPhoto?.id || !onReject}
                                            onClick={() => currentPhoto?.id && onReject?.(currentPhoto.id)}
                                        >
                                            {VIEWER_REJECT_LABEL}
                                        </Button>
                                    </>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={
                                        mediaBlobLoading && pendingDownload?.id === currentPhoto?.id ? (
                                            <CircularProgress size={16} sx={{ color: color_white }} />
                                        ) : (
                                            <DownloadIcon />
                                        )
                                    }
                                    sx={downloadBtnSx}
                                    disabled={!currentPhoto?.id || mediaBlobLoading}
                                    onClick={() => {
                                        const p = currentPhoto;
                                        if (!p) return;
                                        downloadPhotoById(p.id, `photo_${p.id}.jpg`, "image/jpeg");
                                    }}
                                >
                                    {VIEWER_DOWNLOAD_LABEL}
                                </Button>

                                <Tooltip
                                    title={
                                        canDownloadAll
                                            ? inferredRequestIds.length === 1
                                                ? `Download all photos (ZIP) for Request #${inferredRequestIds[0]}`
                                                : `Download all photos (ZIP) for ${inferredRequestIds.length} requests`
                                            : "Request IDs not found (add request_id / requestId in photos)"
                                    }
                                >
                                    <span>
                                        <IconButton
                                            onClick={handleDownloadAllPhotos}
                                            disabled={!canDownloadAll || zipLoading}
                                            sx={{
                                                ...toolIconBtnSx,
                                                background: color_secondary,
                                                color: color_white,
                                                border: `1px solid ${color_secondary_dark}`,
                                                "&:hover": { background: color_secondary_dark },
                                                "&.Mui-disabled": {
                                                    background: color_secondary,
                                                    opacity: 0.55,
                                                    color: color_white,
                                                },
                                            }}
                                        >
                                            {zipLoading ? (
                                                <CircularProgress size={18} sx={{ color: color_white }} />
                                            ) : (
                                                <FolderZipIcon />
                                            )}
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title={VIEWER_NEXT_TOOLTIP}>
                                    <span>
                                        <IconButton
                                            onClick={handleNext}
                                            disabled={currentIndex === photos.length - 1}
                                            sx={toolIconBtnSx}
                                        >
                                            <NavigateNextIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        </Box>

                        {!isSmDown && sidePanelVisible && (
                            <Box
                                onClick={(e) => e.stopPropagation()}
                                onKeyDownCapture={stopGalleryKeyCapture}
                                onKeyUpCapture={stopGalleryKeyCapture}
                                sx={{
                                    width: 360,
                                    background: color_white,
                                    borderLeft: `1px solid ${color_border}`,
                                    p: 2,
                                    overflowY: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.25,
                                }}
                            >
                                <Typography sx={{ ...VIEWER_SECTION_TITLE_SX, mb: 0.25 }}>
                                    {VIEWER_COMMENTS_TITLE}
                                </Typography>

                                <Divider />

                                {showCommentsPanel && (
                                    <>
                                        <Typography sx={VIEWER_SUBSECTION_TITLE_SX}>
                                            {VIEWER_UPLOADER_COMMENT_TITLE}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word",
                                                color: uploaderCommentText ? color_text_secondary : color_text_light,
                                                fontWeight: 650,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {uploaderCommentText || VIEWER_NO_COMMENTS_TEXT}
                                        </Typography>
                                    </>
                                )}

                                {showReviewerCommentField && currentPhoto && (
                                    <>
                                        <Divider />
                                        <Typography sx={VIEWER_SUBSECTION_TITLE_SX}>
                                            {VIEWER_REVIEW_TITLE}
                                        </Typography>

                                        <Chip
                                            size="small"
                                            label={getViewerStatusLabel(currentPhoto.status)}
                                            sx={{ alignSelf: "flex-start", ...getViewerStatusChipSx(currentPhoto.status) }}
                                        />

                                        <TextField
                                            fullWidth
                                            size="small"
                                            label={VIEWER_REVIEW_COMMENT_LABEL}
                                            value={reviewerCommentText}
                                            onChange={(e) => onReviewerCommentChange?.(currentPhoto, e.target.value)}
                                            onFocus={() => setIsCommentFocused(true)}
                                            onBlur={() => setIsCommentFocused(false)}
                                            onKeyDownCapture={stopGalleryKeyCapture}
                                            onKeyUpCapture={stopGalleryKeyCapture}
                                            multiline
                                            minRows={4}
                                        />
                                    </>
                                )}
                            </Box>
                        )}

                        {isSmDown && sidePanelVisible && (
                            <Box
                                onClick={(e) => e.stopPropagation()}
                                onKeyDownCapture={stopGalleryKeyCapture}
                                onKeyUpCapture={stopGalleryKeyCapture}
                                sx={{
                                    position: "fixed",
                                    left: 12,
                                    right: 12,
                                    bottom: 86,
                                    zIndex: 1395,
                                    background: color_white,
                                    border: `1px solid ${color_border}`,
                                    borderRadius: 2,
                                    p: 1.25,
                                    maxHeight: showReviewerCommentField ? "36vh" : "22vh",
                                    overflowY: "auto",
                                    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                }}
                            >
                                <Typography sx={VIEWER_SECTION_TITLE_SX}>
                                    {VIEWER_COMMENTS_TITLE}
                                </Typography>

                                {showCommentsPanel && (
                                    <>
                                        <Typography sx={{ ...VIEWER_SUBSECTION_TITLE_SX, fontSize: 13 }}>
                                            {VIEWER_UPLOADER_COMMENT_TITLE}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word",
                                                color: uploaderCommentText ? color_text_secondary : color_text_light,
                                                fontWeight: 650,
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {uploaderCommentText || VIEWER_NO_COMMENTS_TEXT}
                                        </Typography>
                                    </>
                                )}

                                {showReviewerCommentField && currentPhoto && (
                                    <>
                                        <Divider />
                                        <Chip
                                            size="small"
                                            label={getViewerStatusLabel(currentPhoto.status)}
                                            sx={{ alignSelf: "flex-start", ...getViewerStatusChipSx(currentPhoto.status) }}
                                        />

                                        <TextField
                                            fullWidth
                                            size="small"
                                            label={VIEWER_REVIEW_COMMENT_LABEL}
                                            value={reviewerCommentText}
                                            onChange={(e) => onReviewerCommentChange?.(currentPhoto, e.target.value)}
                                            onFocus={() => setIsCommentFocused(true)}
                                            onBlur={() => setIsCommentFocused(false)}
                                            onKeyDownCapture={stopGalleryKeyCapture}
                                            onKeyUpCapture={stopGalleryKeyCapture}
                                            multiline
                                            minRows={4}
                                        />
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PhotoViewerModal;
