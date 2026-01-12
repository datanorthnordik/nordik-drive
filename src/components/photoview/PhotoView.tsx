"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Typography,
    Box,
    Tabs,
    Tab,
    CircularProgress,
    IconButton,
    Tooltip,
    Grid,
    Card,
    CardMedia,
    Divider,
} from "@mui/material";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

import useFetch from "../../hooks/useFetch";

import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// -----------------------------
// Types (NO status here)
// -----------------------------
type PhotoItem = {
    id: number;
    filename?: string;
};

type DocItem = {
    id: number;
    filename?: string;
    mime_type?: string;
};

// -----------------------------
// Helpers
// -----------------------------
const isPdfMime = (m?: string) => m === "application/pdf";
const isImageMime = (m?: string) => !!m && m.startsWith("image/");

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
        mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
        return ".docx";
    if (mime === "application/vnd.ms-excel") return ".xls";
    if (
        mime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
        return ".xlsx";
    if (mime.startsWith("text/")) return ".txt";
    if (mime === "application/json") return ".json";
    return "";
}

function ensureHasExtension(fileName: string, mime?: string) {
    if (!fileName) return fileName;
    if (fileName.includes(".")) return fileName;
    const ext = extensionFromMime(mime);
    return ext ? `${fileName}${ext}` : fileName;
}

const PhotoViewerModal = ({
    open,
    requestId,
    startIndex,
    onClose,
}: {
    open: boolean;
    requestId: number;
    startIndex: number;
    onClose: () => void;
}) => {
    const API_BASE =
        "https://nordikdriveapi-724838782318.us-west1.run.app/api";

    // Tabs: 0 = Photos, 1 = Documents
    const [tab, setTab] = useState<0 | 1>(0);

    // Data
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [documents, setDocuments] = useState<DocItem[]>([]);

    // Indices
    const [photoIndex, setPhotoIndex] = useState(startIndex || 0);

    // Doc viewer
    const [docViewerOpen, setDocViewerOpen] = useState(false);
    const [docViewerIndex, setDocViewerIndex] = useState(0);

    // Doc blob preview
    const [docBlobUrl, setDocBlobUrl] = useState("");
    const lastDocBlobUrlRef = useRef<string>("");

    // Zoom
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;
    const ZOOM_STEP = 0.25;

    const [photoZoom, setPhotoZoom] = useState(1);
    const [docZoom, setDocZoom] = useState(1);

    const clamp = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
    const zoomInPhoto = () =>
        setPhotoZoom((z) => clamp(Number((z + ZOOM_STEP).toFixed(2))));
    const zoomOutPhoto = () =>
        setPhotoZoom((z) => clamp(Number((z - ZOOM_STEP).toFixed(2))));
    const resetPhotoZoom = () => setPhotoZoom(1);

    const zoomInDoc = () =>
        setDocZoom((z) => clamp(Number((z + ZOOM_STEP).toFixed(2))));
    const zoomOutDoc = () =>
        setDocZoom((z) => clamp(Number((z - ZOOM_STEP).toFixed(2))));
    const resetDocZoom = () => setDocZoom(1);

    // -----------------------------
    // useFetch hooks (ONLY)
    // -----------------------------
    const {
        data: photoData,
        fetchData: loadPhotos,
        loading: photosLoading,
        error: photosError,
    } = useFetch(`${API_BASE}/file/photos/${requestId}`, "GET", false);

    const {
        data: docData,
        fetchData: loadDocs,
        loading: docsLoading,
        error: docsError,
    } = useFetch(`${API_BASE}/file/docs/${requestId}`, "GET", false);

    // Fetch doc blob for preview
    const {
        data: docBlobData,
        fetchData: fetchDocBlob,
        loading: docBlobLoading,
        error: docBlobError,
    } = useFetch<any>(`${API_BASE}/file/doc`, "GET", false);

    // Download photo/doc (same endpoint)
    const {
        data: downloadBlobData,
        fetchData: fetchDownloadBlob,
        loading: downloading,
        error: downloadError,
    } = useFetch<any>(`${API_BASE}/doc/download`, "POST", false);

    // -----------------------------
    // Derived current doc
    // -----------------------------
    const currentDoc = documents[docViewerIndex];
    const currentDocMime =
        currentDoc?.mime_type ||
        guessMimeFromFilename(currentDoc?.filename) ||
        "";

    // -----------------------------
    // Effects: load data
    // -----------------------------
    useEffect(() => {
        if (!open) return;
        if (!requestId) return;

        setPhotoIndex(startIndex || 0);
        resetPhotoZoom();

        loadPhotos();
        loadDocs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, requestId, startIndex]);

    useEffect(() => {
        // your API returns only approved photos for this viewer
        if ((photoData as any)?.photos) {
            const loaded: PhotoItem[] = (photoData as any).photos.map((p: any) => ({
                id: p.id,
                filename: p.filename ?? p.file_name ?? p.name ?? undefined,
            }));
            setPhotos(loaded);
        } else {
            setPhotos([]);
        }
    }, [photoData]);

    useEffect(() => {
        if ((docData as any)?.docs) {
            const loaded: DocItem[] = (docData as any).docs.map((d: any) => {
                const filename = d.filename ?? d.file_name ?? d.name ?? undefined;
                const mime = d.mime_type ?? guessMimeFromFilename(filename);
                return {
                    id: d.id,
                    filename,
                    mime_type: mime,
                };
            });
            setDocuments(loaded);
        } else {
            setDocuments([]);
        }
    }, [docData]);

    // Close doc viewer if user switches tab
    useEffect(() => {
        if (tab === 0 && docViewerOpen) {
            setDocViewerOpen(false);
            clearDocPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    // Reset zoom on change
    useEffect(() => {
        resetPhotoZoom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [photoIndex]);

    useEffect(() => {
        resetDocZoom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docViewerIndex, docViewerOpen]);

    // -----------------------------
    // Doc preview helpers
    // -----------------------------
    const clearDocPreview = useCallback(() => {
        if (lastDocBlobUrlRef.current) {
            URL.revokeObjectURL(lastDocBlobUrlRef.current);
            lastDocBlobUrlRef.current = "";
        }
        setDocBlobUrl("");
    }, []);

    const openDocAtIndex = useCallback(
        async (idx: number) => {
            const doc = documents[idx];
            if (!doc) return;

            clearDocPreview();

            await fetchDocBlob(undefined, undefined, false, {
                path: doc.id,
                responseType: "blob",
            });
        },
        [documents, clearDocPreview, fetchDocBlob]
    );

    const handleOpenDocViewer = async (idx: number) => {
        setDocViewerIndex(idx);
        setDocViewerOpen(true);
        await openDocAtIndex(idx);
    };

    const handlePrevDoc = async () => {
        const nextIdx = Math.max(docViewerIndex - 1, 0);
        setDocViewerIndex(nextIdx);
        await openDocAtIndex(nextIdx);
    };

    const handleNextDoc = async () => {
        const nextIdx = Math.min(docViewerIndex + 1, documents.length - 1);
        setDocViewerIndex(nextIdx);
        await openDocAtIndex(nextIdx);
    };

    // Convert doc blob to URL
    useEffect(() => {
        if (!docViewerOpen) return;
        if (!docBlobData) return;

        const raw =
            docBlobData instanceof Blob
                ? docBlobData
                : (docBlobData as any)?.blob instanceof Blob
                    ? (docBlobData as any).blob
                    : null;

        if (!raw) return;

        const forcedType = currentDocMime || raw.type || "application/octet-stream";
        const fixedBlob = new Blob([raw], { type: forcedType });

        if (lastDocBlobUrlRef.current) URL.revokeObjectURL(lastDocBlobUrlRef.current);
        const url = URL.createObjectURL(fixedBlob);
        lastDocBlobUrlRef.current = url;
        setDocBlobUrl(url);
    }, [docBlobData, docViewerOpen, currentDocMime]);

    // Cleanup
    useEffect(() => {
        if (!open) {
            setDocViewerOpen(false);
            clearDocPreview();
        }
    }, [open, clearDocPreview]);

    useEffect(() => {
        return () => clearDocPreview();
    }, [clearDocPreview]);

    // -----------------------------
    // Download (POST /doc/download/:id)
    // -----------------------------
    const pendingDownloadRef = useRef<{ filename?: string; mime?: string } | null>(
        null
    );

    const downloadById = useCallback(
        async (id: number, filename?: string, mime?: string) => {
            pendingDownloadRef.current = { filename, mime };

            await fetchDownloadBlob(undefined, undefined, false, {
                path: id,
                responseType: "blob",
            });
        },
        [fetchDownloadBlob]
    );

    useEffect(() => {
        if (!downloadBlobData) return;

        const raw =
            downloadBlobData instanceof Blob
                ? downloadBlobData
                : (downloadBlobData as any)?.blob instanceof Blob
                    ? (downloadBlobData as any).blob
                    : null;

        if (!raw) return;

        const meta = pendingDownloadRef.current || {};
        const forcedType = meta.mime || raw.type || "application/octet-stream";
        const fixedBlob = new Blob([raw], { type: forcedType });

        const objectUrl = URL.createObjectURL(fixedBlob);

        const baseName =
            meta.filename && meta.filename.trim()
                ? ensureHasExtension(meta.filename.trim(), forcedType)
                : `download_${Date.now()}${extensionFromMime(forcedType) || ""}`;

        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = baseName;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(objectUrl);
        pendingDownloadRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [downloadBlobData]);

    // -----------------------------
    // ImageGallery items (✅ thumbnails = your “legend”)
    // -----------------------------
    const galleryItems = useMemo(
        () =>
            photos.map((p) => ({
                original: `${API_BASE}/file/photo/${p.id}`,
                thumbnail: `${API_BASE}/file/photo/${p.id}`, // ✅ this shows the small preview strip
                originalClass: "gallery-image",
            })),
        [photos, API_BASE]
    );

    // Zoomable render (works with thumbnails)
    const renderZoomablePhotoItem = useCallback(
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
                    }}
                >
                    <Box
                        sx={{
                            transform: `scale(${photoZoom})`,
                            transformOrigin: "0 0",
                        }}
                    >
                        <img
                            src={item.original}
                            alt=""
                            style={{
                                display: "block",
                                maxWidth: "100%",
                                // leave space for thumbnails below
                                maxHeight: "72vh",
                                objectFit: "contain",
                            }}
                        />
                    </Box>
                </Box>
            );
        },
        [photoZoom]
    );

    // -----------------------------
    // UI states
    // -----------------------------
    const isLoading = photosLoading || docsLoading;
    const anyError = photosError || docsError;

    return (
        <>
            <Dialog open={open} onClose={onClose} fullScreen>
                {/* ✅ One-line header (no extra height) */}
                <DialogTitle
                    sx={{
                        py: 0.75,
                        px: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        background: "#fff",
                    }}
                >
                    <Box sx={{ minWidth: 140 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
                            Media Viewer
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.75 }}>
                            ID: {requestId}
                        </Typography>
                    </Box>

                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            minHeight: 34,
                            "& .MuiTab-root": { minHeight: 34, py: 0 },
                        }}
                    >
                        <Tab value={0} label={`Photos (${photos.length})`} />
                        <Tab value={1} label={`Documents (${documents.length})`} />
                    </Tabs>

                    <Box sx={{ flex: 1 }} />

                    <Button onClick={onClose} variant="contained" sx={{ fontWeight: 900 }}>
                        Close
                    </Button>
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
                    {/* LOADING */}
                    {isLoading && (
                        <Box sx={{ mt: 4, color: "#fff" }}>
                            <Typography>Loading...</Typography>
                        </Box>
                    )}

                    {/* ERROR */}
                    {!isLoading && anyError && (
                        <Box sx={{ mt: 4, color: "#fff" }}>
                            <Typography>Failed to load media.</Typography>
                        </Box>
                    )}

                    {/* PHOTOS TAB */}
                    {!isLoading && !anyError && tab === 0 && (
                        <>
                            {photos.length === 0 ? (
                                <Typography sx={{ color: "white", mt: 4 }}>
                                    No photos found.
                                </Typography>
                            ) : (
                                <Box sx={{ width: "100%", height: "100%" }}>
                                    <ImageGallery
                                        items={galleryItems}
                                        startIndex={Math.min(photoIndex, Math.max(photos.length - 1, 0))}
                                        showPlayButton={false}
                                        showFullscreenButton={false}
                                        showThumbnails={true}  // ✅ this is your “legend” strip
                                        thumbnailPosition="bottom"
                                        onSlide={(idx) => setPhotoIndex(idx)}
                                        renderItem={renderZoomablePhotoItem}
                                    />

                                    {/* Bottom controls: Zoom + Download */}
                                    <Box
                                        sx={{
                                            position: "fixed",
                                            bottom: 18,
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            zIndex: 1301,
                                            display: "flex",
                                            gap: 1,
                                            alignItems: "center",
                                            background: "rgba(0,0,0,0.55)",
                                            border: "1px solid rgba(255,255,255,0.18)",
                                            borderRadius: 3,
                                            p: 1,
                                            backdropFilter: "blur(8px)",
                                        }}
                                    >
                                        <Tooltip title="Zoom out">
                                            <span>
                                                <IconButton
                                                    onClick={zoomOutPhoto}
                                                    disabled={photoZoom <= ZOOM_MIN}
                                                    sx={{ color: "#fff" }}
                                                >
                                                    <ZoomOutIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>

                                        <Tooltip title="Reset zoom">
                                            <IconButton onClick={resetPhotoZoom} sx={{ color: "#fff" }}>
                                                <RestartAltIcon />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Zoom in">
                                            <span>
                                                <IconButton
                                                    onClick={zoomInPhoto}
                                                    disabled={photoZoom >= ZOOM_MAX}
                                                    sx={{ color: "#fff" }}
                                                >
                                                    <ZoomInIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>

                                        <Box sx={{ color: "#fff", fontWeight: 900, px: 1 }}>
                                            {Math.round(photoZoom * 100)}%
                                        </Box>

                                        <Divider
                                            orientation="vertical"
                                            flexItem
                                            sx={{ borderColor: "rgba(255,255,255,0.25)" }}
                                        />

                                        <Button
                                            variant="contained"
                                            startIcon={
                                                downloading ? (
                                                    <CircularProgress size={16} sx={{ color: "#fff" }} />
                                                ) : (
                                                    <DownloadIcon />
                                                )
                                            }
                                            sx={{ fontWeight: 900 }}
                                            disabled={!photos[photoIndex]?.id || downloading}
                                            onClick={() => {
                                                const p = photos[photoIndex];
                                                if (!p) return;
                                                const mime =
                                                    guessMimeFromFilename(p.filename) || "image/jpeg";
                                                downloadById(
                                                    p.id,
                                                    p.filename ?? `photo_${p.id}.jpg`,
                                                    mime
                                                );
                                            }}
                                        >
                                            Download
                                        </Button>

                                        {!downloading && downloadError && (
                                            <Typography sx={{ color: "#ffb4b4", fontWeight: 800, ml: 1 }}>
                                                Download failed
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}

                    {/* DOCUMENTS TAB (responsive 1/2/3/4 columns) */}
                    {!isLoading && !anyError && tab === 1 && (
                        <>
                            {documents.length === 0 ? (
                                <Typography sx={{ color: "white", mt: 4 }}>No documents found.</Typography>
                            ) : (
                                <Box sx={{ width: "100%", p: 2 }}>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gap: 1.5,
                                            gridTemplateColumns: {
                                                xs: "1fr",                 // mobile
                                                sm: "repeat(2, 1fr)",      // >=600px
                                                md: "repeat(3, 1fr)",      // >=900px
                                                lg: "repeat(4, 1fr)",      // >=1200px  ✅ 4 per row
                                                // xl: "repeat(5, 1fr)",    // optional
                                            },
                                            alignItems: "stretch",
                                        }}
                                    >
                                        {documents.map((doc, idx) => {
                                            const mime =
                                                doc.mime_type ||
                                                guessMimeFromFilename(doc.filename) ||
                                                "application/octet-stream";

                                            const name = doc.filename ?? `Document #${doc.id}`;

                                            return (
                                                <Card
                                                    key={doc.id}
                                                    sx={{
                                                        borderRadius: 2.5,
                                                        background: "#0b0b0b",
                                                        border: "1px solid rgba(255,255,255,0.14)",
                                                        overflow: "hidden",
                                                        transition: "transform 120ms ease, border-color 120ms ease",
                                                        "&:hover": {
                                                            transform: "translateY(-2px)",
                                                            borderColor: "rgba(255,255,255,0.26)",
                                                        },
                                                    }}
                                                >
                                                    {/* compact header */}
                                                    <Box
                                                        onClick={() => handleOpenDocViewer(idx)}
                                                        sx={{
                                                            cursor: "pointer",
                                                            p: 1.25,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 42,
                                                                height: 42,
                                                                borderRadius: 2,
                                                                display: "grid",
                                                                placeItems: "center",
                                                                background: "rgba(255,255,255,0.07)",
                                                                border: "1px solid rgba(255,255,255,0.10)",
                                                                flex: "0 0 auto",
                                                            }}
                                                        >
                                                            <DescriptionIcon sx={{ color: "rgba(255,255,255,0.9)" }} />
                                                        </Box>

                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Typography
                                                                sx={{
                                                                    color: "#fff",
                                                                    fontWeight: 900,
                                                                    fontSize: 13.5,
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                                title={name}
                                                            >
                                                                {name}
                                                            </Typography>

                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: "rgba(255,255,255,0.65)",
                                                                    fontWeight: 800,
                                                                    display: "block",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                                title={`${mime} • ID: ${doc.id}`}
                                                            >
                                                                {mime} • ID: {doc.id}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

                                                    {/* compact actions */}
                                                    <Box
                                                        sx={{
                                                            p: 1,
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            background: "rgba(255,255,255,0.02)",
                                                        }}
                                                    >
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenDocViewer(idx);
                                                            }}
                                                            sx={{
                                                                textTransform: "none",
                                                                fontWeight: 900,
                                                                color: "#fff",
                                                                borderColor: "rgba(255,255,255,0.30)",
                                                                "&:hover": {
                                                                    borderColor: "rgba(255,255,255,0.55)",
                                                                    background: "rgba(255,255,255,0.06)",
                                                                },
                                                            }}
                                                        >
                                                            View
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={
                                                                downloading ? (
                                                                    <CircularProgress size={14} sx={{ color: "#fff" }} />
                                                                ) : (
                                                                    <DownloadIcon />
                                                                )
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                downloadById(
                                                                    doc.id,
                                                                    doc.filename ?? `document_${doc.id}`,
                                                                    mime
                                                                );
                                                            }}
                                                            disabled={downloading}
                                                            sx={{ textTransform: "none", fontWeight: 900 }}
                                                        >
                                                            Download
                                                        </Button>
                                                    </Box>
                                                </Card>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}


                </DialogContent>
            </Dialog>

            {/* FULLSCREEN DOCUMENT VIEWER */}
            {docViewerOpen && currentDoc && (
                <Dialog
                    open={true}
                    onClose={() => {
                        setDocViewerOpen(false);
                        clearDocPreview();
                    }}
                    fullScreen
                >
                    <DialogTitle
                        sx={{
                            py: 0.75,
                            px: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#0b1220",
                            color: "#fff",
                            gap: 1,
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    fontSize: 16,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "70vw",
                                }}
                                title={currentDoc.filename}
                            >
                                {currentDoc.filename ?? `Document #${currentDoc.id}`}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>
                                {currentDocMime || "unknown"} • ID: {currentDoc.id} •{" "}
                                {docViewerIndex + 1}/{documents.length}
                            </Typography>
                        </Box>

                        <Button
                            onClick={() => {
                                setDocViewerOpen(false);
                                clearDocPreview();
                            }}
                            variant="contained"
                            sx={{ fontWeight: 900 }}
                        >
                            Close
                        </Button>
                    </DialogTitle>

                    <Divider />

                    <DialogContent sx={{ background: "#000" }}>
                        <Box
                            sx={{
                                mt: 1,
                                borderRadius: 2,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "#0b0b0b",
                                overflow: "hidden",
                                minHeight: "78vh",
                            }}
                        >
                            {docBlobLoading && (
                                <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, color: "#fff" }}>
                                    <CircularProgress size={24} />
                                    <Typography>Loading document...</Typography>
                                </Box>
                            )}

                            {!docBlobLoading && docBlobError && (
                                <Box sx={{ p: 3, color: "#fff" }}>
                                    <Typography sx={{ fontWeight: 800, mb: 1 }}>
                                        Failed to load document
                                    </Typography>
                                    <Typography sx={{ opacity: 0.85 }}>{String(docBlobError)}</Typography>
                                </Box>
                            )}

                            {!docBlobLoading && docBlobUrl && (
                                <>
                                    {/* PDF */}
                                    {isPdfMime(currentDocMime) && (
                                        <iframe
                                            title="pdf-viewer"
                                            src={docBlobUrl}
                                            style={{
                                                width: "100%",
                                                height: "78vh",
                                                border: 0,
                                                background: "#fff",
                                            }}
                                        />
                                    )}

                                    {/* Image with zoom */}
                                    {isImageMime(currentDocMime) && (
                                        <Box
                                            sx={{
                                                width: "100%",
                                                height: "78vh",
                                                overflow: "auto",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                background: "#000",
                                            }}
                                        >
                                            <Box sx={{ transform: `scale(${docZoom})`, transformOrigin: "0 0" }}>
                                                <img
                                                    src={docBlobUrl}
                                                    alt={currentDoc.filename}
                                                    style={{
                                                        display: "block",
                                                        maxWidth: "100%",
                                                        maxHeight: "78vh",
                                                        objectFit: "contain",
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Other types */}
                                    {!isPdfMime(currentDocMime) && !isImageMime(currentDocMime) && (
                                        <Box sx={{ p: 3, color: "#fff" }}>
                                            <Typography sx={{ fontWeight: 800, mb: 2 }}>
                                                Preview not supported for this file type.
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<DownloadIcon />}
                                                onClick={() => {
                                                    const mime =
                                                        currentDoc.mime_type ||
                                                        guessMimeFromFilename(currentDoc.filename) ||
                                                        "application/octet-stream";
                                                    downloadById(
                                                        currentDoc.id,
                                                        currentDoc.filename ?? `document_${currentDoc.id}`,
                                                        mime
                                                    );
                                                }}
                                                sx={{ fontWeight: 900 }}
                                                disabled={downloading}
                                            >
                                                Download
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>

                        {/* Bottom controls */}
                        <Box
                            sx={{
                                position: "fixed",
                                bottom: 18,
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                                background: "rgba(0,0,0,0.55)",
                                border: "1px solid rgba(255,255,255,0.18)",
                                borderRadius: 3,
                                p: 1.25,
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            <Button
                                variant="contained"
                                onClick={handlePrevDoc}
                                disabled={docViewerIndex === 0 || docBlobLoading}
                                sx={{ fontWeight: 900 }}
                            >
                                ◀ Prev
                            </Button>

                            {/* Zoom controls (useful for image docs) */}
                            <Tooltip title="Zoom out">
                                <span>
                                    <IconButton
                                        onClick={zoomOutDoc}
                                        disabled={docZoom <= ZOOM_MIN || docBlobLoading}
                                        sx={{ color: "#fff" }}
                                    >
                                        <ZoomOutIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Tooltip title="Reset zoom">
                                <span>
                                    <IconButton
                                        onClick={resetDocZoom}
                                        disabled={docBlobLoading}
                                        sx={{ color: "#fff" }}
                                    >
                                        <RestartAltIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Tooltip title="Zoom in">
                                <span>
                                    <IconButton
                                        onClick={zoomInDoc}
                                        disabled={docZoom >= ZOOM_MAX || docBlobLoading}
                                        sx={{ color: "#fff" }}
                                    >
                                        <ZoomInIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Box sx={{ color: "#fff", fontWeight: 900, px: 1 }}>
                                {Math.round(docZoom * 100)}%
                            </Box>

                            <Divider
                                orientation="vertical"
                                flexItem
                                sx={{ borderColor: "rgba(255,255,255,0.25)" }}
                            />

                            <Button
                                variant="contained"
                                startIcon={
                                    downloading ? (
                                        <CircularProgress size={16} sx={{ color: "#fff" }} />
                                    ) : (
                                        <DownloadIcon />
                                    )
                                }
                                onClick={() => {
                                    const mime =
                                        currentDoc.mime_type ||
                                        guessMimeFromFilename(currentDoc.filename) ||
                                        "application/octet-stream";
                                    downloadById(
                                        currentDoc.id,
                                        currentDoc.filename ?? `document_${currentDoc.id}`,
                                        mime
                                    );
                                }}
                                disabled={docBlobLoading || downloading}
                                sx={{ fontWeight: 900 }}
                            >
                                Download
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleNextDoc}
                                disabled={docViewerIndex === documents.length - 1 || docBlobLoading}
                                sx={{ fontWeight: 900 }}
                            >
                                Next ▶
                            </Button>
                        </Box>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default PhotoViewerModal;
