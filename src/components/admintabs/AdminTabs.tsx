import * as React from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FolderIcon from '@mui/icons-material/Folder';
import { AdminTab, AdminTabWrapper } from '../Tabs';
import { useSelector } from 'react-redux';

interface AdminTabsProps {
    handleChange : (event: React.SyntheticEvent, newValue: number) => void;
    value: number
}

export default function AdminTabs(props: AdminTabsProps) {
  const {isAdmin, isManager} = useSelector((state:any)=> state.role)

  return (
    <AdminTabWrapper value={props.value} onChange={props.handleChange} aria-label="icon tabs example">
      {isAdmin && <AdminTab icon={<FolderIcon />} aria-label="files" label="Files" />}
      {(isAdmin || isManager) && <AdminTab icon={<AccountCircleIcon />} aria-label="User Access" label="User Access" />}
    </AdminTabWrapper>
  );
}