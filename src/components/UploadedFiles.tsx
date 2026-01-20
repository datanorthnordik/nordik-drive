// ==============================
// UploadedFiles.tsx (FULL CODE)
// - Same logic, redesigned to match portal UX
// - No logic removed: modals, delete/restore/replace/history/access, refetch, search, highlight.
// ==============================
import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Box,
  TextField,
  Chip,
  InputAdornment,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";

import { useDispatch, useSelector } from "react-redux";
import useFetch from "../hooks/useFetch";
import { AppDispatch } from "../store/store";
import { setFiles } from "../store/auth/fileSlice";
import AccessModal from "./models/AccessManagementModal";
import FileVersionHistoryModal from "./models/FileHistoryModal";
import ReplaceFileModal from "./models/ReplaceFileModal";
import ConfirmModal from "./models/ConfirmModal";
import Loader from "./Loader";
import toast from "react-hot-toast";

interface UploadedFilesProps {
  newFile: string;
}

const UploadedFiles: React.FC<UploadedFilesProps> = ({ newFile }) => {
  const { files: rows } = useSelector((state: any) => state.file);
  const dispatch = useDispatch<AppDispatch>();

  const { data: deletedFile, fetchData: deleteFile, loading: dloading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file",
    "DELETE",
    false
  );

  const { data: newFiles, fetchData: getFile, loading: galoading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file",
    "GET",
    false
  );

  const { data: updatedFiles, fetchData: resetFile, loading: ploading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/reset",
    "PUT",
    false
  );

  const loading = dloading || galoading || ploading;

  const [searchText, setSearchText] = useState("");
  const [openAccess, setOpenAccess] = useState(false);
  const [openHisory, setOpenHistory] = useState(false);
  const [openReplaceFile, setOpenReplaceFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openRestoreConfirm, setOpenRestoreConfirm] = useState(false);

  const onDelete = () => deleteFile(null, { id: selectedFile?.id });
  const onRestore = () => resetFile(null, { id: selectedFile?.id });

  useEffect(() => {
    if (deletedFile) toast.success((deletedFile as any).message);
  }, [deletedFile]);

  useEffect(() => {
    if (updatedFiles) toast.success((updatedFiles as any).message);
  }, [updatedFiles]);

  useEffect(() => {
    if (deletedFile || updatedFiles || newFile) {
      closeOpenDeleteModal();
      closeRestoreConfirmModal();
      getFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedFile, updatedFiles, newFile]);

  useEffect(() => {
    if (newFiles) dispatch(setFiles({ files: (newFiles as any).files }));
  }, [newFiles, dispatch]);

  const openAccessModal = (file: any) => {
    setOpenAccess(true);
    setSelectedFile(file);
  };

  const closeAccessModal = () => {
    setOpenAccess(false);
    setSelectedFile(null);
  };

  const closeHistory = () => {
    setOpenHistory(false);
    setSelectedFile(null);
  };

  const closeReplaceFile = () => {
    setOpenReplaceFile(false);
    setSelectedFile(null);
  };

  const openReplaceFilemodal = (file: any) => {
    setOpenReplaceFile(true);
    setSelectedFile(file);
  };

  const openHisoryModal = (file: any) => {
    setOpenHistory(true);
    setSelectedFile(file);
  };

  const openConfirmDeleteModal = (file: any) => {
    setSelectedFile(file);
    setOpenDeleteConfirm(true);
  };

  const closeOpenDeleteModal = () => {
    setSelectedFile(null);
    setOpenDeleteConfirm(false);
  };

  const openRestoreConfirmModal = (file: any) => {
    setSelectedFile(file);
    setOpenRestoreConfirm(true);
  };

  const closeRestoreConfirmModal = () => {
    setSelectedFile(null);
    setOpenRestoreConfirm(false);
  };

  const highlightMatch = (text: string, search: string) => {
    if (!search) return text;
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safe})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <span key={i} style={{ backgroundColor: "rgba(255, 230, 130, 0.85)" }}>
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const filteredRows = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    if (!search) return rows;

    return rows?.filter((row: any) => {
      const fileName = String(row.filename || "").toLowerCase();
      const insertedBy = String(row.inserted_by || "").toLowerCase();
      const createdAt = String(row.created_at || "").toLowerCase();
      const fullName = String(`${row.firstname || ""} ${row.lastname || ""}`).toLowerCase();
      return fileName.includes(search) || insertedBy.includes(search) || createdAt.includes(search) || fullName.includes(search);
    });
  }, [rows, searchText]);

  return (
    <>
      <Loader loading={loading} />

      {openAccess && (
        <AccessModal
          file={{ fileId: selectedFile?.id, fileName: selectedFile?.fileName }}
          open={openAccess}
          onClose={closeAccessModal}
        />
      )}

      {openHisory && (
        <FileVersionHistoryModal
          open={openHisory}
          onClose={closeHistory}
          file={{ id: selectedFile?.id, filename: selectedFile?.filename }}
        />
      )}

      {openReplaceFile && (
        <ReplaceFileModal
          refresh={getFile}
          open={openReplaceFile}
          onClose={closeReplaceFile}
          file={{ id: selectedFile?.id, filename: selectedFile?.filename, version: selectedFile?.version }}
        />
      )}

      {openDeleteConfirm && (
        <ConfirmModal
          open={openDeleteConfirm}
          text="Delete this file? Customers won’t be able to access it until you restore it."
          onConfirm={onDelete}
          onCancel={closeOpenDeleteModal}
        />
      )}

      {openRestoreConfirm && (
        <ConfirmModal
          open={openRestoreConfirm}
          text="Are you sure you want to restore this file? Customers will be able to view it again."
          onConfirm={onRestore}
          onCancel={closeRestoreConfirmModal}
        />
      )}

      {/* ✅ Portal table card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
        }}
      >
        {/* Header row */}
        <Box
          sx={{
            p: 2,
            background: "#fbfcfe",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "0.95rem" }}>
              Uploaded Files
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "rgba(15,23,42,0.65)", mt: 0.25 }}>
              Manage visibility, versions, and access. Deleted files can be restored.
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Search files..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              minWidth: 280,
              backgroundColor: "#fff",
              borderRadius: 1.5,
              "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider />

        {/* Scroll area */}
        <TableContainer
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            pb: 2,
            background: "#fff",
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {[
                  "FILE NAME",
                  "VERSION",
                  "SIZE (MB)",
                  "ROW COUNT",
                  "INSERTED BY",
                  "CREATED DATE",
                  "TYPE / STATUS",
                  "ACTIONS",
                ].map((h, idx) => (
                  <TableCell
                    key={h}
                    align={idx === 7 ? "right" : "left"}
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.72rem",
                      letterSpacing: "0.05em",
                      color: "rgba(15,23,42,0.75)",
                      background: "#fbfcfe",
                      borderBottom: "1px solid rgba(0,0,0,0.08)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRows?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: "rgba(15,23,42,0.65)" }}>
                    No files found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredRows?.map((row: any) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        "& td": {
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        },
                        backgroundColor: row.is_delete ? "rgba(220, 53, 69, 0.06)" : "#fff",
                      }}
                    >
                      <TableCell sx={{ maxWidth: 520, whiteSpace: "normal", wordBreak: "break-word", fontWeight: 700 }}>
                        {highlightMatch(String(row.filename || ""), searchText)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{highlightMatch(String(row.version || ""), searchText)}</TableCell>
                      <TableCell>{highlightMatch(String(row.size || ""), searchText)}</TableCell>
                      <TableCell>{highlightMatch(String(row.rows || ""), searchText)}</TableCell>
                      <TableCell>
                        {highlightMatch(String(`${row.firstname || ""} ${row.lastname || ""}`.trim()), searchText)}
                      </TableCell>
                      <TableCell>{highlightMatch(String(row.created_at || ""), searchText)}</TableCell>

                      <TableCell>
                        {row.is_delete ? (
                          <Chip
                            label="DELETED"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 900,
                              borderRadius: 1.5,
                              background: "rgba(220,53,69,0.14)",
                              color: "#b42318",
                            }}
                          />
                        ) : row.private ? (
                          <Chip
                            label="PRIVATE"
                            size="small"
                            icon={<LockIcon sx={{ fontSize: 16 }} />}
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 900,
                              borderRadius: 1.5,
                              background: "rgba(245, 158, 11, 0.16)",
                              color: "#92400e",
                            }}
                          />
                        ) : (
                          <Chip
                            label="PUBLIC"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 900,
                              borderRadius: 1.5,
                              background: "rgba(34, 197, 94, 0.14)",
                              color: "#166534",
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ p: 1 }}>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", width: "100%", alignItems: "center" }}>
                          {!row.is_delete ? (
                            <>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  sx={{
                                    borderRadius: 1.5,
                                    border: "1px solid rgba(0,0,0,0.10)",
                                    background: "#fff",
                                    "&:hover": { background: "#fff", borderColor: "rgba(0,0,0,0.18)" },
                                  }}
                                  onClick={() => openConfirmDeleteModal(row)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Replace">
                                <IconButton
                                  onClick={() => openReplaceFilemodal(row)}
                                  size="small"
                                  sx={{
                                    borderRadius: 1.5,
                                    border: "1px solid rgba(0,0,0,0.10)",
                                    background: "#fff",
                                    "&:hover": { background: "#fff", borderColor: "rgba(0,0,0,0.18)" },
                                  }}
                                >
                                  <SwapHorizIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="History">
                                <IconButton
                                  onClick={() => openHisoryModal(row)}
                                  size="small"
                                  sx={{
                                    borderRadius: 1.5,
                                    border: "1px solid rgba(0,0,0,0.10)",
                                    background: "#fff",
                                    "&:hover": { background: "#fff", borderColor: "rgba(0,0,0,0.18)" },
                                  }}
                                >
                                  <AccessTimeIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {row.private && (
                                <Tooltip title="Assign to user">
                                  <IconButton
                                    onClick={() => openAccessModal(row)}
                                    size="small"
                                    sx={{
                                      borderRadius: 1.5,
                                      border: "1px solid rgba(0,0,0,0.10)",
                                      background: "#fff",
                                      "&:hover": { background: "#fff", borderColor: "rgba(0,0,0,0.18)" },
                                    }}
                                  >
                                    <PersonAddIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <Tooltip title="Restore">
                              <IconButton
                                size="small"
                                sx={{
                                  borderRadius: 1.5,
                                  border: "1px solid rgba(0,0,0,0.10)",
                                  background: "#fff",
                                  "&:hover": { background: "#fff", borderColor: "rgba(0,0,0,0.18)" },
                                }}
                                onClick={() => openRestoreConfirmModal(row)}
                              >
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Spacer row ensures last item never clipped */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ height: 14, borderBottom: "none" }} />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default UploadedFiles;
