import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Table, TableRow, TableCell,
    TableHead, TableBody, TextField, Typography,
    Grid, Card, CardMedia,
    Box
} from "@mui/material";

import useFetch from "../../hooks/useFetch";
import toast from "react-hot-toast";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

interface ApproveRequestModalProps {
    open: boolean;
    request: any;
    onClose: () => void;
    onApproved?: () => void;
}

type PhotoStatus = "approved" | "rejected" | null;

interface RequestPhoto {
    id: number;
    photo_url?: string;
    is_gallery_photo?: boolean;
    status?: PhotoStatus;
    // any other fields coming from backend
}

const ApproveRequestModal: React.FC<ApproveRequestModalProps> = ({
    open,
    request,
    onClose,
    onApproved
}) => {

    const [editableDetails, setEditableDetails] = useState<any[]>([]);
    const [photos, setPhotos] = useState<RequestPhoto[]>([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [startIndex, setStartIndex] = useState(0);
    const [viewerIndex, setViewerIndex] = useState(0);

    const {
        data: approvalResponse,
        fetchData: approveRequest,
        loading
    } = useFetch(
        "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/approve/request",
        "PUT",
        false
    );

    // Second API to update photo approval/rejection
    const {
        fetchData: submitPhotoReview,
        loading: photoReviewLoading
    } = useFetch(
        "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/photos/review",
        "POST",
        false
    );

    const {
        data: photoData,
        fetchData: loadPhotos
    } = useFetch(
        `https://nordikdriveapi-724838782318.us-west1.run.app/api/file/edit/photos/${request?.request_id}`,
        "GET",
        false
    );

    useEffect(() => {
        if (request) {
            setEditableDetails(request.details);
            loadPhotos();
        }
    }, [request]);

    useEffect(() => {
        if ((photoData as any)?.photos) {
            const loadedPhotos: RequestPhoto[] = (photoData as any).photos.map((p: any) => ({
                ...p,
                status: p.status ?? null
            }));
            setPhotos(loadedPhotos);
        }
    }, [photoData]);

    useEffect(() => {
        if (approvalResponse) {
            toast.success("Request approved successfully.");
            if (onApproved) onApproved();
            onClose();
        }
    }, [approvalResponse]);

    const updateField = (index: number, value: string) => {
        const updated = [...editableDetails];
        updated[index].new_value = value;
        setEditableDetails(updated);
    };

    const handleApprove = () => {
        // ✅ Ensure all photos are either approved or rejected before approving all changes
        if (photos.length > 0) {
            const hasPending = photos.some((p) => p.status === null);
            if (hasPending) {
                toast.error("Please approve or reject all photos before approving all changes.");
                return;
            }
        }

        // Prepare photo review payload
        const approvedPhotoIds = photos
            .filter((p) => p.status === "approved")
            .map((p) => p.id);

        const rejectedPhotoIds = photos
            .filter((p) => p.status === "rejected")
            .map((p) => p.id);

        if (approvedPhotoIds.length > 0 || rejectedPhotoIds.length > 0) {
            submitPhotoReview({
                approved_photos: approvedPhotoIds,
                rejected_photos: rejectedPhotoIds
            });
        }

        // Main approve request (existing behaviour)
        approveRequest({
            request_id: request.request_id,
            updates: editableDetails
        });
    };

    // 🔥 Prepare photos for ImageGallery
    const galleryItems = photos.map((photo: RequestPhoto) => ({
        original: `https://nordikdriveapi-724838782318.us-west1.run.app/api/file/photo/${photo.id}`,
        thumbnail: `https://nordikdriveapi-724838782318.us-west1.run.app/api/file/photo/${photo.id}`,
        description: `Photo ID: ${photo.id}`,
        originalClass: "gallery-image"
    }));

    const handleOpenViewer = (idx: number) => {
        setStartIndex(idx);
        setViewerIndex(idx);
        setViewerOpen(true);
    };

    const handleApproveCurrentPhoto = () => {
        setPhotos((prev) =>
            prev.map((p, idx) =>
                idx === viewerIndex ? { ...p, status: "approved" } : p
            )
        );
    };

    const handleRejectCurrentPhoto = () => {
        setPhotos((prev) =>
            prev.map((p, idx) =>
                idx === viewerIndex ? { ...p, status: "rejected" } : p
            )
        );
    };

    if (!request) return null;

    return (
        <>
            {/* MAIN MODAL */}
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
                <DialogTitle sx={{ fontWeight: "bold" }}>
                    Approve Edit Request #{request.request_id}
                </DialogTitle>

                <DialogContent dividers>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        User:{" "}
                        <strong>
                            {request.firstname} {request.lastname}
                        </strong>
                    </Typography>

                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        File:{" "}
                        <strong>{request.details?.[0]?.filename}</strong>
                    </Typography>
                    {/* Consent */}
                    <Box
                        sx={{
                            mt: 1,
                            mb: 2,
                            p: 1.25,
                            borderRadius: 1,
                            border: "1px solid rgba(0,0,0,0.15)",
                            backgroundColor: request?.consent ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)"
                        }}
                    >
                        <Typography sx={{ fontWeight: 800 }}>
                            {request?.consent
                                ? "User has given consent to display additional photos in the CSAA gallery."
                                : "User has not given consent to display additional photos in the CSAA gallery."}
                        </Typography>
                    </Box>


                    {/* TABLE – FIELD CHANGES */}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <strong>Row</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Field Name</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Old Value</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>New Value</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {editableDetails.map((d, index) => (
                                <TableRow key={d.id}>
                                    <TableCell>{d.row_id}</TableCell>
                                    <TableCell>{d.field_name}</TableCell>
                                    <TableCell>
                                        {d.old_value || <i>(empty)</i>}
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value={d.new_value}
                                            onChange={(e) =>
                                                updateField(index, e.target.value)
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* -------------------------- */}
                    {/*        PHOTOS SECTION       */}
                    {/* -------------------------- */}

                    <Typography
                        variant="h6"
                        sx={{ mt: 4, mb: 2, fontWeight: "bold" }}
                    >
                        Uploaded Photos
                    </Typography>

                    {photos.length === 0 && (
                        <Typography>No photos submitted.</Typography>
                    )}

                    <Grid container spacing={2}>
                        {photos.map((photo: RequestPhoto, idx: number) => (
                            <Grid key={photo.id}>
                                <Card
                                    sx={{
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        border:
                                            photo.status === "approved"
                                                ? "3px solid #2ecc71" // green
                                                : photo.status === "rejected"
                                                    ? "3px solid #e74c3c" // red
                                                    : "2px solid transparent",
                                        boxShadow:
                                            photo.status === "approved"
                                                ? "0 0 8px rgba(46, 204, 113, 0.7)"
                                                : photo.status === "rejected"
                                                    ? "0 0 8px rgba(231, 76, 60, 0.7)"
                                                    : undefined
                                    }}
                                    onClick={() => handleOpenViewer(idx)}
                                >
                                    <CardMedia
                                        component="img"
                                        height="160"
                                        image={`https://nordikdriveapi-724838782318.us-west1.run.app/api/file/photo/${photo.id}`}
                                        style={{
                                            objectFit: "cover"
                                        }}
                                    />
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleApprove}
                        disabled={loading || photoReviewLoading}
                    >
                        {loading ? "Approving..." : "Approve All Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 🔥 FULLSCREEN IMAGE VIEWER WITH CONTROLS */}
            {viewerOpen && (
                <Dialog
                    open={true}
                    onClose={() => setViewerOpen(false)}
                    fullScreen
                >
                    <DialogTitle
                        sx={{
                            fontWeight: "bold",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        Photo Viewer
                        <Button onClick={() => setViewerOpen(false)}>
                            Close
                        </Button>
                    </DialogTitle>

                    <DialogContent sx={{ background: "#000" }}>
                        <ImageGallery
                            items={galleryItems}
                            startIndex={startIndex}
                            showPlayButton={false}
                            showFullscreenButton={false}
                            showThumbnails={false}
                            onSlide={(currentIndex) =>
                                setViewerIndex(currentIndex)
                            }
                        />

                        {/* Status label */}
                        {photos[viewerIndex] && (
                            <div
                                style={{
                                    position: "fixed",
                                    top: 80,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    padding: "6px 16px",
                                    borderRadius: "16px",
                                    background:
                                        photos[viewerIndex].status ===
                                            "approved"
                                            ? "rgba(46, 204, 113, 0.9)"
                                            : photos[viewerIndex].status ===
                                                "rejected"
                                                ? "rgba(231, 76, 60, 0.9)"
                                                : "rgba(0,0,0,0.4)",
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: "0.9rem"
                                }}
                            >
                                {photos[viewerIndex].status === "approved"
                                    ? "Approved"
                                    : photos[viewerIndex].status === "rejected"
                                        ? "Rejected"
                                        : "Pending Review"}
                            </div>
                        )}

                        {/* Approve/Reject Buttons inside Viewer */}
                        <div
                            style={{
                                position: "fixed",
                                bottom: "30px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "flex",
                                gap: "20px"
                            }}
                        >
                            <Button
                                variant="contained"
                                color="success"
                                sx={{ padding: "12px 32px" }}
                                onClick={handleApproveCurrentPhoto}
                            >
                                Approve Photo
                            </Button>

                            <Button
                                variant="contained"
                                color="error"
                                sx={{ padding: "12px 32px" }}
                                onClick={handleRejectCurrentPhoto}
                            >
                                Reject Photo
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default ApproveRequestModal;
