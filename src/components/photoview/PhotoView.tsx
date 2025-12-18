import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Typography
} from "@mui/material";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import useFetch from "../../hooks/useFetch";

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

    const [photos, setPhotos] = useState<any[]>([]);

    const {
        data: photoData,
        fetchData: loadPhotos,
        loading,
        error,
    } = useFetch(`https://nordikdriveapi-724838782318.us-west1.run.app/api/file/photos/${requestId}`, "GET", false);

    // Fetch photos when modal opens
    useEffect(() => {
        if (open && requestId) {
            loadPhotos();
        }
    }, [open, requestId]);

    // Update photos after response arrives
    useEffect(() => {
        if ((photoData as any)?.photos) {
            setPhotos((photoData as any).photos);
        }
    }, [photoData]);

    const galleryItems = photos.map((photo: any) => ({
        original: `https://nordikdriveapi-724838782318.us-west1.run.app/api/file/photo/${photo.id}`,
        thumbnail: `https://nordikdriveapi-724838782318.us-west1.run.app/api/file/photo/${photo.id}`,
    }));

    return (
        <Dialog open={open} onClose={onClose} fullScreen>
            <DialogTitle
                sx={{
                    fontWeight: "bold",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                Photo Viewer
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogTitle>

            <DialogContent
                sx={{
                    background: "#000",
                    padding: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {/* LOADING */}
                {loading && (
                    <Typography sx={{ color: "white", mt: 4 }}>
                        Loading photos...
                    </Typography>
                )}

                {/* ERROR */}
                {!loading && error && (
                    <Typography sx={{ color: "white", mt: 4 }}>
                        Failed to load photos.
                    </Typography>
                )}

                {/* NO PHOTOS */}
                {!loading && !error && photos.length === 0 && (
                    <Typography sx={{ color: "white", mt: 4 }}>
                        No photos found.
                    </Typography>
                )}

                {/* GALLERY */}
                {!loading && !error && photos.length > 0 && (
                    <ImageGallery
                        items={galleryItems}
                        startIndex={startIndex}
                        showPlayButton={false}
                        showFullscreenButton={false}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PhotoViewerModal;
