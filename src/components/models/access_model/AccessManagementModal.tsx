import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, Box, Divider } from "@mui/material";
import toast from "react-hot-toast";

import useFetch from "../../../hooks/useFetch";
import ConfirmationModal from "./../ConfirmModal";
import Loader from "../../Loader";

import { color_white } from "../../../constants/colors";

import AccessModalHeader from "./AccessModalHeader";
import AssignAccessSection from "./AssignAccessSection";
import RevokeAccessSection from "./RevokeAccessSection";
import AccessModalFooter from "./AccessModalFooter";

import { AccessModalProps, User } from "./types";

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
        <AccessModalHeader fileName={fileName} onClose={onClose} />

        <Divider />

        {/* Scrollable content, fixed footer */}
        <DialogContent sx={{ p: 0, bgcolor: `${color_white}`, flex: 1, overflowY: "auto" }}>
          {/* Assign Access */}
          <AssignAccessSection
            users={users}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            openAssignModal={openAssignModal}
            loading={loading}
          />

          <Divider />

          {/* Revoke Access */}
          <RevokeAccessSection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredAccesses={filteredAccesses}
            openRevokeModalFn={openRevokeModalFn}
          />
        </DialogContent>

        {/* Footer (fixed like UX) */}
        <Divider />
        <AccessModalFooter onClose={onClose} />
      </Dialog>
    </>
  );
};

export default AccessModal;
