// PhotoViewer.tsx
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

import {
    color_primary,
    color_primary_dark,
    color_secondary,
    color_secondary_dark,
    color_white,
    color_white_smoke,
    color_border,
    color_text_primary,
    color_text_secondary,
    color_text_light,
    color_success,
    color_error,
} from "../../constants/colors";

type ReviewStatus = "approved" | "rejected" | "pending" | null | undefined;

export interface ViewerPhoto {
    id: number;
    file_name?: string;
    mime_type?: string;
    status?: ReviewStatus;

    //  for Download All (ZIP) without passing anything:
    request_id?: number;
    requestId?: number;

    [key: string]: any;
}

export type PhotoViewerMode = "view" | "review";

interface PhotoViewerModalProps {
    open: boolean;
    onClose: () => void;

    photos: ViewerPhoto[];
    startIndex?: number;

    /** "review" shows Approve/Reject buttons */
    mode?: PhotoViewerMode;
    onApprove?: (id: number) => void;
    onReject?: (id: number) => void;

    /** Show/hide bottom thumbnail strip */
    showThumbnails?: boolean;

    /** Show/hide status pill overlay */
    showStatusPill?: boolean;
    only_approved?: boolean;
}

const API_BASE =
    (process.env.NEXT_PUBLIC_API_BASE as string | undefined) ||
    (process.env.REACT_APP_API_BASE as string | undefined) ||
    "https://nordikdriveapi-724838782318.us-west1.run.app/api";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function labelFromStatus(st?: ReviewStatus) {
    if (st === "approved") return "Approved";
    if (st === "rejected") return "Rejected";
    if (st === "pending") return "Pending";
    if (st === null || st === undefined) return "Pending";
    return String(st);
}

function chipSx(st?: ReviewStatus) {
    if (st === "approved") {
        return {
            color: color_success,
            backgroundColor: "rgba(39, 174, 96, 0.12)",
            border: "1px solid rgba(39, 174, 96, 0.25)",
            fontWeight: 900,
        };
    }
    if (st === "rejected") {
        return {
            color: color_error,
            backgroundColor: "rgba(231, 76, 60, 0.12)",
            border: "1px solid rgba(231, 76, 60, 0.25)",
            fontWeight: 900,
        };
    }
    return {
        color: color_text_secondary,
        backgroundColor: "rgba(107, 114, 128, 0.12)",
        border: "1px solid rgba(107, 114, 128, 0.25)",
        fontWeight: 900,
    };
}

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
    showThumbnails = true,
    showStatusPill = true,
    only_approved = false
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

    // reset on open
    useEffect(() => {
        if (!open) return;
        setCurrentIndex(safeStartIndex);
        setZoom(1);
        setTimeout(() => galleryRef.current?.slideToIndex?.(safeStartIndex), 0);
    }, [open, safeStartIndex]);

    const currentPhoto = photos?.[currentIndex];

    //  infer request id from photos (so no prop required)
    const inferredRequestIds = useMemo(() => {
        const set = new Set<number>();

        (photos || []).forEach((p) => {
            const rid = (p?.request_id ?? p?.requestId) as unknown;
            if (typeof rid === "number" && Number.isFinite(rid)) set.add(rid);
        });

        return Array.from(set).sort((a, b) => a - b);
    }, [photos]);


    // ---------------- SINGLE DOWNLOAD (BLOB) ----------------
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
        } catch (e) {
            console.error("Download failed", e);
        } finally {
            setPendingDownload(null);
        }
    }, [mediaBlobData, pendingDownload]);

    useEffect(() => {
        if (!pendingDownload) return;
        if (!mediaBlobError) return;
        console.error("Download failed", mediaBlobError);
        setPendingDownload(null);
    }, [mediaBlobError, pendingDownload]);

    // ---------------- DOWNLOAD ALL PHOTOS ZIP ----------------
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
    }, [canDownloadAll, zipLoading, fetchZip, inferredRequestIds]);

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

    // ---------------- VIEWER UI ----------------
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
                            label={labelFromStatus(currentPhoto.status)}
                            sx={{
                                position: "absolute",
                                top: 14,
                                left: 14,
                                zIndex: 5,
                                ...chipSx(currentPhoto.status),
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
                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: color_text_primary }}>
                        Photo Viewer
                    </Typography>
                    <Typography variant="caption" sx={{ color: color_text_light, fontWeight: 700 }}>
                        {photos?.length ? `${currentIndex + 1} / ${photos.length}` : "No photos"}
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
                    justifyContent: "center",
                    alignItems: "stretch",
                }}
            >
                {!photos?.length ? (
                    <Box sx={{ mt: 4, color: "#fff", px: 2 }}>
                        <Typography sx={{ fontWeight: 800 }}>No photos found.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ width: "100%", height: "100%" }}>
                        <ImageGallery
                            ref={galleryRef}
                            items={galleryItems}
                            startIndex={safeStartIndex}
                            showPlayButton={false}
                            showFullscreenButton={false}
                            showThumbnails={showThumbnails}
                            thumbnailPosition="bottom"
                            onSlide={(idx) => {
                                setCurrentIndex(idx);
                                setZoom(1);
                            }}
                            renderItem={renderZoomableItem}
                        />

                        {/* Bottom pill bar */}
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
                            <Tooltip title="Previous">
                                <span>
                                    <IconButton
                                        onClick={handlePrev}
                                        disabled={currentIndex === 0}
                                        sx={toolIconBtnSx}
                                    >
                                        <NavigateBeforeIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Tooltip title="Zoom out">
                                <span>
                                    <IconButton onClick={zoomOut} disabled={zoom <= ZOOM_MIN} sx={toolIconBtnSx}>
                                        <ZoomOutIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Tooltip title="Reset zoom">
                                <IconButton onClick={resetZoom} sx={toolIconBtnSx}>
                                    <RestartAltIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Zoom in">
                                <span>
                                    <IconButton onClick={zoomIn} disabled={zoom >= ZOOM_MAX} sx={toolIconBtnSx}>
                                        <ZoomInIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Box sx={{ px: 0.5, fontWeight: 900, color: color_text_secondary }}>
                                {Math.round(zoom * 100)}%
                            </Box>

                            {/* Review actions only in review mode */}
                            {mode === "review" && (
                                <>
                                    <Button
                                        variant="contained"
                                        sx={approveBtnSx}
                                        disabled={!currentPhoto?.id || !onApprove}
                                        onClick={() => currentPhoto?.id && onApprove?.(currentPhoto.id)}
                                    >
                                        Approve
                                    </Button>

                                    <Button
                                        variant="contained"
                                        sx={rejectBtnSx}
                                        disabled={!currentPhoto?.id || !onReject}
                                        onClick={() => currentPhoto?.id && onReject?.(currentPhoto.id)}
                                    >
                                        Reject
                                    </Button>
                                </>
                            )}

                            {/* Download current (blob logic) */}
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
                                Download
                            </Button>

                            {/*  Download all photos ZIP (icon button, no wrap) */}
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

                            <Tooltip title="Next">
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
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PhotoViewerModal;
