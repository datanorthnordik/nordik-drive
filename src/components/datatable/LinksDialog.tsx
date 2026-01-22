"use client";

import React from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, Divider, Typography } from "@mui/material";
import { color_white } from "../../constants/colors";
import { isDocumentUrl, linkLabel } from "../../lib/urlUtils";

type Props = {
  open: boolean;
  title: string;
  urls: string[];
  onClose: () => void;

  onOpenWebsite: (url: string) => void;
  onOpenDocumentUrl: (url: string) => void;
};

export default function LinksDialog({
  open,
  title,
  urls,
  onClose,
  onOpenWebsite,
  onOpenDocumentUrl,
}: Props) {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <Divider />
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.25, py: 2 }}>
        {urls.map((u) => {
          const doc = isDocumentUrl(u);
          return (
            <Box
              key={u}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                p: 1.25,
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.10)",
                background: color_white,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "60%",
                }}
                title={u}
              >
                {linkLabel(u)}
              </Typography>

              <Button
                variant="contained"
                onClick={() => {
                  onClose();
                  if (doc) onOpenDocumentUrl(u);
                  else onOpenWebsite(u);
                }}
                sx={{ fontWeight: 900, textTransform: "none" }}
              >
                {doc ? "View Document" : "View Website"}
              </Button>
            </Box>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}
