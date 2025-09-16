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
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useFetch from "../../hooks/useFetch";
import ConfirmationModal from "./ConfirmModal";
import Loader from "../Loader";

import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import toast from "react-hot-toast";
import { access } from "fs";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

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
    "https://nordikdriveapi-724838782318.us-west1.run.app/user",
    "GET"
  );

  const { loading: aloading, data: newAccess, fetchData: assignAccess, error:aerror } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/file/access", "POST")

  const { loading: galoading, data: accesses, fetchData: getAccess } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/file/access", "GET")
  const { loading: daloading, data: deletedAccess, fetchData: deleteAccess, error:derror } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/file/access", "DELETE")

  const loading = aloading || galoading || daloading || uloading

  const [users, setUsers] = useState([])

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

  useEffect(()=>{
    if(aerror){
      toast.error(aerror)
    }
  },[aerror])

  useEffect(()=>{
    if(newAccess){
      toast.success((newAccess as any).message)
    }
  },[newAccess])

  useEffect(()=>{
    if(deletedAccess){
      toast.success((deletedAccess as any).message)
    }
  },[deletedAccess])

  useEffect(()=>{
    if(derror){
      toast.error(derror)
    }
  },[derror])


  useEffect(()=>{
    if(accesses && user){
       const accesUsers = (accesses as any)?.access.map((item:any)=> item.user_id)
       const userList: User[] = ((user as any)?.users || []).filter((item:any)=> !accesUsers.includes(item.id));
       setUsers(userList as any)
    } else if (user){
       setUsers((user as any)?.users)
    }

  }, [accesses, user])

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

  const openRevokeModal = (id: any) => {
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


  return (
    <>
      <Loader loading={loading} />
      {openAssingnConfirm && <ConfirmationModal 
      text={`Do you want to give access to ${selectedUsers.map(user => user.firstname + " " + user.lastname).join(",")} ?`} 
      open={openAssingnConfirm} onConfirm={handleAssign} onCancel={closeAssignModal} />}
      {openRevokeConfirm && <ConfirmationModal text="Do you want to give revoke to?" open={openRevokeConfirm} onConfirm={handleRevoke} onCancel={closeRevokeModal} />}
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
              disableCloseOnSelect
              options={users}
              value={selectedUsers}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(e, newValue) => setSelectedUsers(newValue)}
              filterOptions={(options, state) => {
                const term = state.inputValue.toLowerCase();
                return options
                  .filter(u => !selectedUsers.some(s => s.id === u.id)) // remove already selected
                  .filter(
                    u =>
                      `${u.firstname} ${u.lastname}`.toLowerCase().includes(term) ||
                      u.email.toLowerCase().includes(term) ||
                      u.phonenumber.toString().includes(term)
                  );
              }}
              renderOption={(props, option, { selected }) => (
                <li
                  {...props}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 10px",
                    fontSize: "1rem",
                  }}
                >
                  <Checkbox
                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      {option.firstname} {option.lastname}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#555" }}>
                      {option.email} | {option.phonenumber}
                    </div>
                  </div>
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <span
                    {...getTagProps({ index })}
                    style={{
                      margin: "2px",
                      padding: "4px 8px",
                      backgroundColor: "#e0f7fa",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      display: "inline-block",
                    }}
                  >
                    {option.firstname} {option.lastname} ({option.email})
                  </span>
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Users"
                  size="medium"
                  placeholder="Type name, email, or phone"
                  variant="outlined"
                />
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
