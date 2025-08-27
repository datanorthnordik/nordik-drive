import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TextField,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useFetch from "../../hooks/useFetch";
import ConfirmationModal from "./ConfirmModal";

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  role: string;
}

interface Access {
  id: number;
  userId: number;
  userName: string;
}

interface AccessModalProps {
  open: boolean;
  onClose: () => void;
  file: { fileId: string, fileName: string }
}

const AccessModal: React.FC<AccessModalProps> = ({ open, onClose, file: { fileId, fileName } }) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openAssingnConfirm, setOpenAssignConfirm] = useState(false)
  const [openRevokeConfirm, setOpenRevokeConfirm] = useState(false)
  const [selectedId, seteSelectedId] = useState(null)

  const { loading: uloading, error, data: user, fetchData } = useFetch(
    "https://127.0.0.1:8080/user",
    "GET"
  );

  const { loading: aloading, data: newAccess, fetchData: assignAccess } = useFetch("https://127.0.0.1:8080/file/access", "POST")

  const { loading: galoading, data: accesses, fetchData: getAccess } = useFetch("https://127.0.0.1:8080/file/access", "GET")
  const { loading: daloading, data: deletedAccess, fetchData: deleteAccess } = useFetch("https://127.0.0.1:8080/file/access", "DELETE")

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (newAccess || deletedAccess) {
      closeAssignModal()
      closeRevokeModal()
      fetchData();
      getAccess(null, { id: fileId })
    }
  }, [newAccess, deletedAccess])

  useEffect(() => {
    if (fileId) {
      getAccess(null, { id: fileId })
    }
  }, [fileId])

  const users: User[] = (user as any)?.users || [];

  const handleAssign = () => {
    const body: any = []
    selectedUsers.forEach((item: any) => {
      body.push({ user_id: item.id, file_id: fileId })
    })
    assignAccess(body)
    setSelectedUsers([]);
  };

  const handleRevoke = () => {
    deleteAccess(null, { id: (selectedId as any) })
  }

  const openRevokeModal = (id:any) => {
     seteSelectedId(id)
    setOpenRevokeConfirm(true)
  }

  const closeRevokeModal = () => {
   
    setOpenRevokeConfirm(false)
  }

  const openAssignModal = () => {
    
    setOpenAssignConfirm(true)
  }

  const closeAssignModal = () => {
    setOpenAssignConfirm(false)
  }

  const filteredAccesses = (accesses as any)?.access ? (accesses as any).access?.filter((a: any) =>
    (a.firstname + " " + a.lastname).toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const loading = uloading || aloading

  return (
    <>
      {openAssingnConfirm && <ConfirmationModal text="Do you want to give access to?" open={openAssingnConfirm} onConfirm={handleAssign} onCancel={closeAssignModal} />}
      {openRevokeConfirm && <ConfirmationModal text="Do you want to give revoke to?" open={openRevokeConfirm} onConfirm={handleRevoke} onCancel={closeRevokeModal}/>}
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>🔐 Manage File Access</DialogTitle>
        <DialogContent>
          {/* Assign Access Section */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              ➕ Assign Access
            </Typography>

            <Autocomplete
              multiple
              options={users}
              value={selectedUsers}
              getOptionLabel={(option) => `${option.firstname} ${option.lastname}`}
              onChange={(e, newValue) => setSelectedUsers(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Search users" size="small" />
              )}
              loading={loading}
            />

            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                disabled={selectedUsers.length === 0}
                onClick={openAssignModal}
              >
                Assign Access
              </Button>
            </Box>
          </Box>

          {/* Revoke Access Section */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              🚫 Revoke Access
            </Typography>

            {/* Search Field for Revoke */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search assigned users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAccesses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        No matching users
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccesses.map((access: any) => (
                      <TableRow key={access.id}>
                        <TableCell>{access.firstname + " " + access.lastname}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => openRevokeModal(access.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>

  );
};

export default AccessModal;
