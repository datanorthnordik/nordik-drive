import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Tooltip, Typography, Box
} from "@mui/material";
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DeleteIcon from "@mui/icons-material/Delete";
import { color_secondary } from "../constants/colors";
import { useDispatch, useSelector } from "react-redux";
import useFetch from "../hooks/useFetch";
import { AppDispatch } from "../store/store";
import { setFiles } from "../store/auth/fileSlice";




const UploadedFiles = ()=>{
    const {files: rows} = useSelector((state:any)=> state.file)
    const dispatch = useDispatch<AppDispatch>()
    const {data, fetchData: deleteFile} = useFetch("http://127.0.0.1:8080/file", "DELETE", false)
    const {data:newFiles, fetchData: getFile} = useFetch("http://127.0.0.1:8080/file", "GET", false)
    const onDelete = (row:any)=>{
        deleteFile(null, {id:row.id})
    }

    const onAction = (row:any)=>{

    }

    useEffect(()=>{
        if(data){
            getFile()
        }
    },[data])

    useEffect(()=>{
        if(newFiles){
            dispatch(setFiles({files: (newFiles as any).files}))
        }
    },[newFiles])
    return(
        <Paper elevation={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
                    <Typography variant="h6">Uploaded Files</Typography>
                </Box>

                <TableContainer>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>File Name</TableCell>
                                <TableCell>Inserted By</TableCell>
                                <TableCell>Created Date</TableCell>
                                <TableCell align="right" width={120}>Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">No requests found</TableCell>
                                </TableRow>
                            ) : (
                                rows?.map((row: any) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.filename}</TableCell>
                                        <TableCell>{row.inserted_by}</TableCell>
                                        <TableCell>{row.created_at}</TableCell>
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
                                                    onClick={() => {onDelete(row)}}
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
    )
}

export default UploadedFiles