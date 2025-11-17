import React, { useEffect, useState, useMemo } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Typography, Box, TextField, Chip, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions, Button
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { color_primary } from "../../constants/colors";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import RequestDetailsModal from "./RequestDetailsModal";

const PendingRequests: React.FC = () => {
    const { data, fetchData, loading, error } = useFetch(
        "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/edit/request",
        "GET",
        false
    );

    const [requests, setRequests] = useState<any[]>([]);
    const [searchText, setSearchText] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (data) {
            setRequests((data as any).requests || []);
        }
    }, [data]);

    

    const filtered = useMemo(() => {
        return requests.filter((r) => {
            const username = (r.firstname + " " + r.lastname).toLowerCase();
            const filename = String(r.details?.[0]?.filename || "").toLowerCase();
            const search = searchText.toLowerCase();
            return username.includes(search) || filename.includes(search);
        });
    }, [requests, searchText]);

    return (
        <div style={{ padding: "10%", marginTop: "20px" }}>
            <Loader loading={loading} />

            {/* Title + Search */}
            <Paper elevation={3} sx={{ borderRadius: "12px", overflow: "hidden", mb: 3 }}>
                <Box display="flex" justifyContent="space-between" p={2} sx={{ backgroundColor: "#f7f9fc", borderBottom: "1px solid #ddd" }}>
                    <Typography sx={{ fontWeight: "bold", color: color_primary }}>Pending Edit Requests</Typography>
                    <TextField
                        size="small"
                        placeholder="Search by user/file..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{ backgroundColor: "#fff", borderRadius: "6px" }}
                    />
                </Box>

                <TableContainer sx={{ maxHeight: "60vh" }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#e8f1fb" }}>
                                <TableCell sx={{ fontWeight: "bold" }}>User Name</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>CreatedBy</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>File</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Total Changes</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Created</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>

                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No pending requests</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((req) => (
                                    <TableRow hover key={req.request_id}>
                                        <TableCell>{req.efirstname + req.elastname}</TableCell>
                                        <TableCell>{req.firstname} {req.lastname}</TableCell>
                                        <TableCell>{req.details?.[0]?.filename}</TableCell>
                                        <TableCell>
                                            <Chip label={`${req.details?.length} changes`} color="warning" size="small" />
                                        </TableCell>
                                        <TableCell>{req.created_at}</TableCell>
                                        <TableCell>
                                            <Tooltip title="View Request">
                                                <IconButton onClick={() => setSelectedRequest(req)}>
                                                    <VisibilityIcon />
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

            {/* VIEW REQUEST MODAL */}
            <RequestDetailsModal
                open={!!selectedRequest}
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
                onApproved={fetchData}
            />
        </div>
    );
};

export default PendingRequests;
