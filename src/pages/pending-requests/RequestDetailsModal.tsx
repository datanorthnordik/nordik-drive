import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Table, TableRow, TableCell,
    TableHead, TableBody, TextField, Typography
} from "@mui/material";
import useFetch from "../../hooks/useFetch";

interface ApproveRequestModalProps {
    open: boolean;
    request: any;
    onClose: () => void;
    onApproved?: () => void;
}

const ApproveRequestModal: React.FC<ApproveRequestModalProps> = ({ open, request, onClose, onApproved }) => {
    const [editableDetails, setEditableDetails] = useState<any[]>([]);

    const { data: approvalResponse, fetchData: approveRequest, loading, error } = useFetch(
        "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/approve/request",
        "PUT",
        false
    );

    // Load request details into local editable state
    useEffect(() => {
        if (request) {
            setEditableDetails(request.details);
        }
    }, [request]);

    useEffect(() => {  
        if(approvalResponse){
            toaster.success("Request approved successfully.");
        }
    }, [approvalResponse]);        

    // When backend returns success
    useEffect(() => {
        if (approvalResponse) {
            if (onApproved) onApproved();
            onClose();
        }
    }, [approvalResponse]);

    // Handle editing new value
    const updateField = (index: number, value: string) => {
        const updated = [...editableDetails];
        updated[index].new_value = value;
        setEditableDetails(updated);
    };

    const handleApprove = () => {
        approveRequest({
            request_id: request.request_id,
            updates: editableDetails
        });
    };

    if (!request) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: "bold" }}>
                Approve Edit Request #{request.request_id}
            </DialogTitle>

            <DialogContent dividers>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    User: <strong>{request.firstname} {request.lastname}</strong>
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    File: <strong>{request.details?.[0]?.filename}</strong>
                </Typography>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Row</strong></TableCell>
                            <TableCell><strong>Field Name</strong></TableCell>
                            <TableCell><strong>Old Value</strong></TableCell>
                            <TableCell><strong>New Value (Editable)</strong></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {editableDetails.map((d, index) => (
                            <TableRow key={d.id}>
                                <TableCell>{d.row_id}</TableCell>
                                <TableCell>{d.field_name}</TableCell>
                                <TableCell>{d.old_value || <i>(empty)</i>}</TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={d.new_value}
                                        onChange={(e) => updateField(index, e.target.value)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleApprove}
                    disabled={loading}
                >
                    {loading ? "Approving..." : "Approve"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ApproveRequestModal;
