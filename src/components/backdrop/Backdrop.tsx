import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Backdrop, Box, Modal as MuiModal, Fade, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
    // Create a portal root if it doesn't exist
    const portalRoot = (() => {
        let el = document.getElementById("modal-root");
        if (!el) {
            el = document.createElement("div");
            el.id = "modal-root";
            document.body.appendChild(el);
        }
        return el;
    })();

    useEffect(() => {
        function handleEsc(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    return createPortal(
        <MuiModal
            open={open}
            onClose={onClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{ backdrop: { timeout: 300 } }}
        >
            <Fade in={open}>
                <Box
                    sx={{
                        position: "absolute" as const,
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        borderRadius: 2,
                        p: 3,
                        minWidth: 500,       // ensures form isn’t squashed
                        maxWidth: "90vw",    // responsive to viewport
                        maxHeight: "90vh",   // vertical scroll when too tall
                        overflowY: "auto",
                        outline: "none",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        {title && <Typography variant="h6">{title}</Typography>}
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Child content scrolls if needed */}
                    <Box sx={{ flex: 1 }}>{children}</Box>
                </Box>

            </Fade>
        </MuiModal>,
        portalRoot
    );
}
