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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from '@mui/icons-material/Restore';
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LockIcon from "@mui/icons-material/Lock";
import { color_primary } from "../constants/colors";
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
    newFile: string
}

const UploadedFiles: React.FC<UploadedFilesProps> = ({newFile}) => {
    const { files: rows } = useSelector((state: any) => state.file);
    const dispatch = useDispatch<AppDispatch>();
    const { data:deletedFile, fetchData: deleteFile, loading:dloading } = useFetch(
        "https://nordikdriveapi-724838782318.us-west1.run.app/file",
        "DELETE",
        false
    );
    const { data: newFiles, fetchData: getFile, loading: galoading } = useFetch(
        "https://nordikdriveapi-724838782318.us-west1.run.app/file",
        "GET",
        false
    );

    const { data: updatedFiles, fetchData: resetFile, loading: ploading } = useFetch(
        "https://nordikdriveapi-724838782318.us-west1.run.app/file/reset",
        "PUT",
        false
    );

    useEffect(()=>{
        if(deletedFile){
            toast.success((deletedFile as any).message)
        }
    }, [deletedFile])

    useEffect(()=>{

        if(updatedFiles){
            toast.success((updatedFiles as any).message)
        }

    }, [ updatedFiles])

    const loading = dloading || galoading || ploading

    useEffect(()=>{
        if(deletedFile || updatedFiles || newFile) {
            closeOpenDeleteModal()
            closeRestoreConfirmModal()
            getFile()
        }

    },[deletedFile, updatedFiles, newFile])

    const [searchText, setSearchText] = useState("");
    const [openAccess, setOpenAccess] = useState(false)
    const [openHisory, setOpenHistory] = useState(false)
    const [openReplaceFile, setOpenReplaceFile] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false)
    const [openRestoreConfirm, setOpenRestoreConfirm] = useState(false)
    const onDelete = () => deleteFile(null, { id: (selectedFile as any)?.id });
    const onRestore = () => resetFile(null, { id: (selectedFile as any)?.id });



    const openAccessModal = (file: any)=>{
        setOpenAccess(true)
        setSelectedFile(file)
    }

    const closeAccessModal = () =>{
        setOpenAccess(false)
        setSelectedFile(null)
    }

    const closeHistory = ()=>{
        setOpenHistory(false)
        setSelectedFile(null)
    }

    const closeReplaceFile = ()=>{
        setOpenReplaceFile(false)
        setSelectedFile(null)
    }

    const openReplaceFilemodal = (file:any) =>{
        setOpenReplaceFile(true)
        setSelectedFile(file)
    }

    const openHisoryModal = (file:any)=>{
        setOpenHistory(true)
        setSelectedFile(file)
    }

    const openConfirmDeleteModal = (file: any)=>{
        setSelectedFile(file)
        setOpenDeleteConfirm(true)
    }

    const closeOpenDeleteModal = ()=>{
        setSelectedFile(null)
        setOpenDeleteConfirm(false)
    }

    const openRestoreConfirmModal = (file:any)=>{
        setSelectedFile(file)
        setOpenRestoreConfirm(true)
    }

    const closeRestoreConfirmModal = ()=>{
        setSelectedFile(null)
        setOpenRestoreConfirm(false)
    }

    useEffect(() => { if (newFiles) dispatch(setFiles({ files: (newFiles as any).files })); }, [newFiles]);

    const highlightMatch = (text: string, search: string) => {
        if (!search) return text;
        const regex = new RegExp(`(${search})`, "gi");
        const parts = text.split(regex);
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === search.toLowerCase() ? (
                        <span key={i} style={{ backgroundColor: "yellow" }}>{part}</span>
                    ) : part
                )}
            </>
        );
    };

    const filteredRows = useMemo(() => {
        return rows?.filter((row: any) => {
            const fileName = String(row.filename || "").toLowerCase();
            const insertedBy = String(row.inserted_by || "").toLowerCase();
            const createdAt = String(row.created_at || "").toLowerCase();
            const search = searchText.toLowerCase();
            return fileName.includes(search) || insertedBy.includes(search) || createdAt.includes(search);
        });
    }, [rows, searchText]);

    return (
        <>  
            <Loader loading={loading}/>
            {openAccess && <AccessModal file={{fileId:(selectedFile as any)?.id, fileName: (selectedFile as any)?.fileName}} open={openAccess} onClose={closeAccessModal} />}
            {openHisory && <FileVersionHistoryModal open={openHisory} onClose={closeHistory} file={{id: (selectedFile as any)?.id, filename: (selectedFile as any)?.filename}}/> }
            {openReplaceFile && <ReplaceFileModal refresh={getFile} open={openReplaceFile} onClose={closeReplaceFile} file={{id: (selectedFile as any)?.id, filename: (selectedFile as any)?.filename, version: (selectedFile as any)?.version}}/>}
            {openDeleteConfirm && <ConfirmModal open={openDeleteConfirm} text="Delete this file? Customers won’t be able to access it until you restore it." onConfirm={onDelete} onCancel={closeOpenDeleteModal}/>} 
            {openRestoreConfirm && <ConfirmModal open={openRestoreConfirm} text="Are you sure you want to restore this file? Customers will be able to view it again." onConfirm={onRestore} onCancel={closeRestoreConfirmModal}/>} 
            <Paper elevation={3} sx={{ borderRadius: "12px", overflow: "hidden" }}></Paper>
            <Paper elevation={3} sx={{ borderRadius: "12px", overflow: "hidden" }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" p={2} sx={{ backgroundColor: "#f7f9fc", borderBottom: "1px solid #ddd" }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", color: color_primary }}>
                        Uploaded Files
                    </Typography>
                    <TextField
                        size="small"
                        placeholder="Search files..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{ minWidth: 250, backgroundColor: "#fff", borderRadius: "6px", "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                    />
                </Box>

                <TableContainer sx={{ maxHeight: "60vh" }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#e8f1fb" }}>
                                <TableCell sx={{ fontWeight: "bold" }}>File Name</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Version</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Size</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Row Count</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Inserted By</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Created Date</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                                <TableCell align="right" width={260} sx={{ fontWeight: "bold" }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredRows?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">No files found</TableCell>
                                </TableRow>
                            ) : (
                                filteredRows?.map((row: any) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        sx={{
                                            "&:nth-of-type(odd)": { backgroundColor: row.is_delete ? "#ffe6e6" : "#f9f9f9" },
                                            "&:hover": { backgroundColor: row.is_delete ? "#ffcccc" : "#e3f2fd" },
                                        }}
                                    >
                                        <TableCell>{highlightMatch(String(row.filename || ""), searchText)}</TableCell>
                                        <TableCell>{highlightMatch(String(row.version || ""), searchText)}</TableCell>
                                        <TableCell>{highlightMatch(String(row.size || ""), searchText)}</TableCell>
                                        <TableCell>{highlightMatch(String(row.rows || ""), searchText)}</TableCell>
                                        <TableCell>{highlightMatch(String(row.firstname + " " + row.lastname || ""), searchText)}</TableCell>
                                        <TableCell>{highlightMatch(String(row.created_at || ""), searchText)}</TableCell>

                                        {/* Type Column */}
                                        <TableCell>
                                            {row.is_delete ? (
                                                <Chip label="Deleted" size="small" color="error" />
                                            ) : row.private ? (
                                                <Chip label="Private" size="small" color="warning" icon={<LockIcon />} />
                                            ) : (
                                                <Chip label="Public" size="small" color="success" />
                                            )}
                                        </TableCell>

                                        {/* Actions Column */}
                                        <TableCell align="right" sx={{ p: 1 }}>
                                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", width: "100%", alignItems: "center" }}>

                                                {!row.is_delete ? (
                                                    <>
                                                        <Tooltip title="Delete">
                                                            <IconButton size="small" sx={{ bgcolor: "#ffebee", "&:hover": { bgcolor: "#ffcdd2" } }} onClick={() => openConfirmDeleteModal(row)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Replace">
                                                            <IconButton onClick={()=> openReplaceFilemodal(row)} size="small" sx={{ bgcolor: "#e8f5e9", "&:hover": { bgcolor: "#c8e6c9" } }}>
                                                                <SwapHorizIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="History">
                                                            <IconButton onClick={()=>openHisoryModal(row)} size="small" sx={{ bgcolor: "#f5f5f5", "&:hover": { bgcolor: "#e0e0e0" } }}>
                                                                <AccessTimeIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {row.private && (
                                                            <Tooltip title="Assign to user">
                                                                <IconButton onClick={()=>openAccessModal(row)} size="small" sx={{ bgcolor: "#fff3e0", "&:hover": { bgcolor: "#ffe0b2" } }}>
                                                                    <PersonAddIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Tooltip title="Restore">
                                                        <IconButton size="small" sx={{ bgcolor: "#e3f2fd", "&:hover": { bgcolor: "#bbdefb" } }} onClick={() => openRestoreConfirmModal(row)}>
                                                            <RestoreIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>

                    </Table>
                </TableContainer>
            </Paper>
        </>

    );
};

export default UploadedFiles;
