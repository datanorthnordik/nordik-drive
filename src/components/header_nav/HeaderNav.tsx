import { NavWrapper } from "../Wrappers";
import { HeaderLink } from "../Links";
import { useSelector } from "react-redux";
import FolderIcon from "@mui/icons-material/Folder";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HistoryIcon from '@mui/icons-material/History';
import PhoneIcon from '@mui/icons-material/Phone';
import DoneIcon from '@mui/icons-material/Done';
import { Stack, useMediaQuery, useTheme } from "@mui/material";
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';

interface HeaderNavProps {
  onLinkClick?: () => void; // called when a nav link is clicked
}

function HeaderNav({ onLinkClick }: HeaderNavProps) {
  const { user } = useSelector((state: any) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <NavWrapper>
      <Stack
        direction={isMobile ? "column" : "row"} // vertical on mobile
        spacing={isMobile ? 1.5 : 3}
        alignItems={isMobile ? "flex-start" : "stretch"}
      >
        <HeaderLink to="/files" onClick={onLinkClick}>
          <FolderIcon sx={{ verticalAlign: "middle", mr: 1 }} />
          Files
        </HeaderLink>

        {user.role === 'Admin' && (
          <HeaderLink to="/adminpanel" onClick={onLinkClick}>
            <AdminPanelSettingsIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Admin View
          </HeaderLink>
        )}

        {user.role === 'Admin' && (
          <HeaderLink to="/useractivity" onClick={onLinkClick}>
            <HistoryIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            User Activity
          </HeaderLink>
        )}

        {user.role === 'User' && (
          <HeaderLink to="/contact-us" onClick={onLinkClick}>
            <PhoneIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Contact Us
          </HeaderLink>
        )}
        {user.role === 'User' && (
          <HeaderLink to="/acknowledgement" onClick={onLinkClick}>
            <DoneIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Acknowledgement
          </HeaderLink>
        )}

        
          <HeaderLink to="/requests" onClick={onLinkClick}>
            <PendingActionsOutlinedIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Requests
          </HeaderLink>
      
        
      </Stack>
    </NavWrapper>
  );
}

export default HeaderNav;
