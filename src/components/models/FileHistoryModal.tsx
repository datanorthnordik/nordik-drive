import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import toast from "react-hot-toast";

interface FileVersion {
  id: number;
  version: number;
  filename: string;
  size: number; // in KB
  rows: number;
  inserted_by: string;
  created_at: string;
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

  const { loading: gloading, data, fetchData, error } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/history",
    "GET",
    false
  )

  const { loading: rloading, data: rdata, fetchData: revertFile, error: rerror } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/revert",
    "POST",
    false
  )

  const loading = gloading || rloading

  useEffect(() => {
    if (file) {
      fetchData(null, { id: file.id.toString() })
    }
  }, [file])

  useEffect(() => {
    if (rdata && !rerror) {
      fetchData(null, { id: file.id.toString() })
      toast.success((rdata as any).message)
    }
  }, [rdata])

  useEffect(()=>{
     if(rerror){
      toast.error(rerror)
     }
  },[rerror])

  const versions = (data as any)?.history ? (data as any)?.history : []


  const handleRevert = (version: FileVersion) => {
    revertFile({ "filename": file.filename, "version": version.version })
  };

  return (
    <>
      <Loader loading={loading} />
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: "1.5rem", fontWeight: 600 }}>
          📄 File Version History - {file?.filename}
        </DialogTitle>

        <DialogContent>
          <Table component={Paper} sx={{ mt: 1, mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Filename</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Size (KB)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rows</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Uploaded By</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Uploaded At</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {versions.map((version: any, index: number) => (
                <TableRow key={version.id}>
                  <TableCell>{version.version}</TableCell>
                  <TableCell>{version.filename}</TableCell>
                  <TableCell>{version.size}</TableCell>
                  <TableCell>{version.rows}</TableCell>
                  <TableCell>{version.firstname + " " + version.lastname}</TableCell>
                  <TableCell>{format(new Date(version.created_at), "PPpp")}</TableCell>
                  <TableCell align="center">
                    {index !== 0 ? (
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => handleRevert(version)}
                      >
                        Revert
                      </Button>
                    ) : (
                      <Typography sx={{ color: "green", fontWeight: 600 }}>
                        Latest
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            sx={{ fontSize: "1rem", px: 3, py: 1 }}
            onClick={onClose}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileVersionHistoryModal;
