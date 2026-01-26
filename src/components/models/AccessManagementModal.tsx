import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Autocomplete,
  Checkbox,
  Divider,
  Stack,
  InputAdornment,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useFetch from "../../hooks/useFetch";
import ConfirmationModal from "./ConfirmModal";
import Loader from "../Loader";

import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import toast from "react-hot-toast";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

import { color_primary, color_secondary, color_success_dark, color_success_darker, color_text_light, color_text_lighter, color_text_primary, color_white } from "../../constants/colors";

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

interface AccessModalProps {
  open: boolean;
  onClose: () => void;
  file: { fileId: string; fileName: string };
}

const AccessModal: React.FC<AccessModalProps> = ({
  open,
  onClose,
  file: { fileId, fileName },
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openAssingnConfirm, setOpenAssignConfirm] = useState(false);
  const [openRevokeConfirm, setOpenRevokeConfirm] = useState(false);
  const [selectedId, seteSelectedId] = useState<number | null>(null);

  const { loading: uloading, data: user, fetchData } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/user",
    "GET"
  );

  const {
    loading: aloading,
    data: newAccess,
    fetchData: assignAccess,
    error: aerror,
  } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/access",
    "POST"
  );

  const { loading: galoading, data: accesses, fetchData: getAccess } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/access",
    "GET"
  );

  const {
    loading: daloading,
    data: deletedAccess,
    fetchData: deleteAccess,
    error: derror,
  } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/access",
    "DELETE"
  );

  const loading = aloading || galoading || daloading || uloading;

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (fileId && open) {
      getAccess(null, { id: fileId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, open]);

  useEffect(() => {
    if (newAccess || deletedAccess) {
      closeAssignModal();
      closeRevokeModal();
      fetchData();
      getAccess(null, { id: fileId });
      setSelectedUsers([]);
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAccess, deletedAccess]);

  useEffect(() => {
    if (aerror) toast.error(aerror);
  }, [aerror]);

  useEffect(() => {
    if (newAccess) toast.success((newAccess as any).message);
  }, [newAccess]);

  useEffect(() => {
    if (deletedAccess) toast.success((deletedAccess as any).message);
  }, [deletedAccess]);

  useEffect(() => {
    if (derror) toast.error(derror);
  }, [derror]);

  useEffect(() => {
    if (accesses && user) {
      const accessUsers = (accesses as any)?.access?.map((item: any) => item.user_id) || [];
      const userList: User[] = ((user as any)?.users || []).filter(
        (item: any) => !accessUsers.includes(item.id)
      );
      setUsers(userList as any);
    } else if (user) {
      setUsers((user as any)?.users || []);
    }
  }, [accesses, user]);

  const assignedUsers = useMemo(() => {
    return (accesses as any)?.access ? (accesses as any).access : [];
  }, [accesses]);

  const filteredAccesses = useMemo(() => {
    if (!assignedUsers?.length) return [];
    return assignedUsers.filter((a: any) =>
      (a.firstname + " " + a.lastname).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignedUsers, searchQuery]);

  const handleAssign = () => {
    const body: any[] = [];
    selectedUsers.forEach((item: any) => {
      body.push({ user_id: item.id, file_id: fileId });
    });
    assignAccess(body);
  };

  const handleRevoke = () => {
    if (!selectedId) return;
    deleteAccess(null, { id: selectedId as any });
  };

  const openRevokeModalFn = (id: any) => {
    seteSelectedId(id);
    setOpenRevokeConfirm(true);
  };

  const closeRevokeModal = () => {
    setOpenRevokeConfirm(false);
    seteSelectedId(null);
  };

  const openAssignModal = () => {
    setOpenAssignConfirm(true);
  };

  const closeAssignModal = () => {
    setOpenAssignConfirm(false);
  };

  return (
    <>
      <Loader loading={loading} />

      {openAssingnConfirm && (
        <ConfirmationModal
          text={`Do you want to give access to ${selectedUsers
            .map((u) => `${u.firstname} ${u.lastname}`)
            .join(", ")} ?`}
          open={openAssingnConfirm}
          onConfirm={handleAssign}
          onCancel={closeAssignModal}
          title="Assign Access"
        />
      )}

      {openRevokeConfirm && (
        <ConfirmationModal
          text="Do you want to revoke access?"
          open={openRevokeConfirm}
          onConfirm={handleRevoke}
          onCancel={closeRevokeModal}
          title="Revoke Access"
        />
      )}

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 18px 60px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          },
        }}
      >
        {/* Header (like UX) */}
        <Box sx={{ px: 3, py: 2, bgcolor: `${color_white}` }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                <LockOutlinedIcon sx={{ fontSize: 18, color: `${color_secondary}` }} />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 16.5, color: `${color_text_primary}` }}>
                  Manage File Access
                </Typography>
                <Typography sx={{ fontWeight: 500, fontSize: 12.5, color: `${color_text_light}` }}>
                  {fileName}
                </Typography>
              </Box>
            </Stack>

            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Divider />

        {/* Scrollable content, fixed footer */}
        <DialogContent sx={{ p: 0, bgcolor: `${color_white}`, flex: 1, overflowY: "auto" }}>
          {/* Assign Access */}
          <Box sx={{ px: 3, pt: 2.25, pb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <PersonSearchOutlinedIcon sx={{ fontSize: 18, color: `${color_secondary}` }} />
              <Typography sx={{ fontWeight: 800, fontSize: 12, color: `${color_secondary}`, letterSpacing: "0.06em" }}>
                ASSIGN ACCESS
              </Typography>
            </Stack>

            <Typography sx={{ fontSize: 12.5, color: `${color_text_light}`, mb: 1 }}>
              Search Users
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
                  .filter((u) => !selectedUsers.some((s) => s.id === u.id))
                  .filter(
                    (u) =>
                      `${u.firstname} ${u.lastname}`.toLowerCase().includes(term) ||
                      u.email.toLowerCase().includes(term) ||
                      u.phonenumber?.toString().includes(term)
                  );
              }}
              renderOption={(props, option, { selected }) => (
                <li
                  {...props}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 10px",
                    gap: "8px",
                  }}
                >
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    checked={selected}
                    sx={{ p: 0.5 }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>
                      {option.firstname} {option.lastname}
                    </div>
                    <div style={{ fontSize: 11.5, color: `${color_text_light}` }}>
                      {option.email}
                    </div>
                  </div>
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={`${option.firstname} ${option.lastname}`}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      bgcolor: "rgba(29,78,216,0.10)",
                      color: `${color_secondary}`,
                      fontWeight: 700,
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Type name, email, or phone"
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: `${color_white}`,
                    },
                  }}
                />
              )}
              loading={loading}
            />

            <Button
              variant="contained"
              onClick={openAssignModal}
              sx={{
                mt: 1.75,
                borderRadius: 2,
                px: 2,
                py: 1,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontSize: 12,
                boxShadow: "none",
                color: `${color_white}`,
                backgroundColor: `${color_secondary} !important`,
              }}
            >
              Assign Access
            </Button>
          </Box>

          <Divider />

          {/* Revoke Access */}
          <Box sx={{ px: 3, pt: 2.25, pb: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <DeleteIcon sx={{ fontSize: 18, color: `${color_primary}` }} />
              <Typography sx={{ fontWeight: 800, fontSize: 12, color: `${color_primary}`, letterSpacing: "0.06em" }}>
                REVOKE ACCESS
              </Typography>
            </Stack>

            <TextField
              fullWidth
              size="small"
              placeholder="Search assigned users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: `${color_text_light}` }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1.5,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Box
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: 2.5,
                overflow: "hidden",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: `${color_text_lighter}`,
                      "& th": {
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: `${color_text_light}`,
                        fontWeight: 800,
                        py: 1.1,
                        borderBottom: "1px solid #E5E7EB",
                      },
                    }}
                  >
                    <TableCell>User</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody
                  sx={{
                    "& td": {
                      borderBottom: "1px solid #EEF2F7",
                      py: 1.15,
                      fontSize: 13.5,
                      color : `${color_text_primary}`,
                    },
                    "& tr:last-child td": { borderBottom: "none" },
                  }}
                >
                  {filteredAccesses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 3, color: `${color_text_light}` }}>
                        No matching users
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccesses.map((a: any) => (
                      <TableRow key={a.id} hover sx={{ "&:hover": { bgcolor: `${color_white}` } }}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
                            {a.firstname} {a.lastname}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openRevokeModalFn(a.id)}
                            sx={{
                              color:`${color_primary}`,
                              borderRadius: 2,
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </DialogContent>

        {/* Footer (fixed like UX) */}
        <Divider />
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor:  `${color_white}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: 12,
              boxShadow: "none",
              backgroundColor: `${color_success_dark}`, // green "DONE" style from UX
              "&:hover": { backgroundColor: `${color_success_darker}`},
            }}
          >
            Done
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default AccessModal;
