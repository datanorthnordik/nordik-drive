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
  const {user} = useSelector((state:any)=> state.auth)

  return (
    <AdminTabWrapper value={props.value} onChange={props.handleChange} aria-label="icon tabs example">
      <AdminTab icon={<FolderIcon />} aria-label="files" label="Files" />
      {user.role == 'Admin' && <AdminTab icon={<AccountCircleIcon />} aria-label="User Activity" label="User Activity" />}
    </AdminTabWrapper>
  );
}