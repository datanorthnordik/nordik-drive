import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Tooltip, Typography, Box
} from "@mui/material";
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DeleteIcon from "@mui/icons-material/Delete";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import { color_secondary } from "../../constants/colors";
import { Modal } from "../backdrop/Backdrop";
import RequestManagementModal from "../models/RequestManagementModal";

export type RequestRow = {
    id: number | string;
    name: string;
    community: string;
    requestedAt: string;
};

type RequestTableProps = {
    
};

const RequestTable: React.FC<RequestTableProps> = () => {
    const { loading, error, data: rows, fetchData } = useFetch("https://127.0.0.1:8080/requests", "GET", false)
    const [isOpen, setIsOpen]= useState(false)
    const [selectedRequest, setSelectedRequest] = useState(null)
    useEffect(()=>{
       fetchData(null) 
    },[])

    const onAction = (selectedRequest: any) =>{
        setIsOpen(true)
        setSelectedRequest(selectedRequest)
    }

    const onProcess = ()=>{
        setIsOpen(false)
        fetchData(null) 
    }

    return (
        <>
            <Modal title="Manange Request" open={isOpen} onClose={()=>{setIsOpen(false)}}>
                <RequestManagementModal selectedRequest={selectedRequest} onProcess={onProcess}
                onClose={()=> setIsOpen(false)}
                />
            </Modal>
            <Loader loading={loading}/>
            <Paper elevation={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
                    <Typography variant="h6">Requests</Typography>
                </Box>

                <TableContainer>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>First Name</TableCell>
                                <TableCell>Last Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Community</TableCell>
                                <TableCell>Requested Time</TableCell>
                                <TableCell align="right" width={120}>Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {(rows as any)?.requests?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">No requests found</TableCell>
                                </TableRow>
                            ) : (
                                (rows as any)?.requests?.map((row: any) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.firstname}</TableCell>
                                        <TableCell>{row.lastname}</TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell>{row.community_name}</TableCell>
                                        <TableCell>
                                            {new Date(row.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="action">
                                                <IconButton size="small" onClick={()=>onAction(row)}>
                                                    <PendingActionsIcon style={{color: color_secondary}}/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => { }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
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

export default RequestTable;