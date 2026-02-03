import React, { useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
  Stack,
  Divider,
  Chip,
  IconButton,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import ReplayIcon from "@mui/icons-material/Replay";
import { format } from "date-fns";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import toast from "react-hot-toast";
import { color } from "framer-motion";
import {
  color_secondary,
  color_text_primary,
  color_white,
} from "../../constants/colors";

interface FileVersion {
  id: number;
  version: number;
  filename: string;
  size: number; // in KB
  rows: number;
  inserted_by: string;
  created_at: string;
  firstname?: string;
  lastname?: string;
}

interface FileVersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  file: { id: number; filename: string };
}

const FileVersionHistoryModal: React.FC<FileVersionHistoryModalProps> = ({
  open,
  onClose,
  file,
}) => {
  const { loading: gloading, data, fetchData } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/history",
    "GET",
    false
  );

  const {
    loading: rloading,
    data: rdata,
    fetchData: revertFile,
    error: rerror,
  } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/revert",
    "POST",
    false
  );

  const loading = gloading || rloading;

  useEffect(() => {
    if (open && file?.id) {
      fetchData(null, { id: file.id.toString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.id]);

  useEffect(() => {
    if (rdata && !rerror) {
      fetchData(null, { id: file.id.toString() });
      toast.success((rdata as any).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdata]);

  useEffect(() => {
    if (rerror) toast.error(rerror);
  }, [rerror]);

  const versions: FileVersion[] = useMemo(() => {
    return (data as any)?.history ? (data as any).history : [];
  }, [data]);

  const handleRevert = (version: FileVersion) => {
    revertFile({ filename: file.filename, version: version.version });
  };

  return (
    <>
      <Loader loading={loading} />

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 18px 60px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh", //  prevents footer from going off-screen
          },
        }}
      >
        {/* Header (matches screenshot style) */}
        <Box sx={{ px: 3, py: 2.25, bgcolor: "#fff" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  bgcolor: "rgba(25,118,210,0.10)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <HistoryIcon sx={{ fontSize: 20, color: "primary.main" }} />
              </Box>

              <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#111827" }}>
                File Version History
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 500,
                    fontSize: 14,
                    color: "#6B7280",
                    ml: 1,
                  }}
                >
                  — {file?.filename}
                </Typography>
              </Typography>
            </Stack>

            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Divider />

        {/*  Make content scrollable so footer stays fixed */}
        <DialogContent
          sx={{
            p: 0,
            bgcolor: "#fff",
            flex: 1,
            overflowY: "auto",
          }}
        >
          <Box sx={{ px: 3, pt: 2, pb: 1.5 }}>
            <Typography sx={{ fontSize: 12.5, color: "#6B7280" }}>
              Below are all uploaded versions of this file. You can revert to any
              previous version.
            </Typography>
          </Box>

          <Box sx={{ px: 3, pb: 2.5 }}>
            <Box
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: 2.5,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              <Table size="small" sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: "#F9FAFB",
                      "& th": {
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#6B7280",
                        fontWeight: 700,
                        py: 1.2,
                        borderBottom: "1px solid #E5E7EB",
                      },
                    }}
                  >
                    <TableCell width={80}>Version</TableCell>
                    <TableCell>Filename</TableCell>
                    <TableCell width={110}>Size (KB)</TableCell>
                    <TableCell width={80}>Rows</TableCell>
                    <TableCell width={160}>Uploaded By</TableCell>
                    <TableCell width={190}>Uploaded At</TableCell>
                    <TableCell width={140} align="right">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody
                  sx={{
                    "& td": {
                      borderBottom: "1px solid #EEF2F7",
                      py: 1.25,
                      color: "#111827",
                      fontSize: 13.5,
                    },
                    "& tr:last-child td": {
                      borderBottom: "none",
                    },
                  }}
                >
                  {versions.map((v, index) => {
                    const isLatest = index === 0;
                    const uploadedBy =
                      v.firstname || v.lastname
                        ? `${v.firstname ?? ""} ${v.lastname ?? ""}`.trim()
                        : v.inserted_by || "—";

                    return (
                      <TableRow
                        key={v.id}
                        hover
                        sx={{
                          "&:hover": { bgcolor: "#FAFAFF" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{v.version}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <DescriptionOutlinedIcon
                              sx={{ fontSize: 18, color: "#6B7280" }}
                            />
                            <Typography sx={{ fontSize: 13.5 }}>
                              {v.filename || file?.filename}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{Number(v.size).toFixed(2)}</TableCell>
                        <TableCell>{v.rows}</TableCell>
                        <TableCell>{uploadedBy}</TableCell>
                        <TableCell>
                          {v.created_at
                            ? format(
                                new Date(v.created_at),
                                "MMM d, yyyy, h:mm:ss a"
                              )
                            : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {isLatest ? (
                            <Chip
                              label="LATEST"
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: 11,
                                bgcolor: "rgba(16,185,129,0.12)",
                                color: "#059669",
                                borderRadius: 999,
                              }}
                            />
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<ReplayIcon />}
                              onClick={() => handleRevert(v)}
                              sx={{
                                textTransform: "uppercase",
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                                fontSize: 11,
                                borderRadius: 2,
                                px: 1.5,
                                py: 1.5,
                                boxShadow: "none",
                                backgroundColor: `${color_secondary} !important`,
                              }}
                            >
                              Revert
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!versions.length && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 4 }}>
                        <Typography
                          sx={{ textAlign: "center", color: "#6B7280" }}
                        >
                          No version history found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </DialogContent>

        {/*  Fixed footer (always visible) */}
        <Divider />
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "flex-end",
            bgcolor: "#fff",
            position: "sticky",
            bottom: 0,
            zIndex: 10,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 2,
              py: 1.5,
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: 16,
              backgroundColor: `${color_white} !important`,
              color: `${color_text_primary} !important`,
            }}
          >
            Close
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default FileVersionHistoryModal;