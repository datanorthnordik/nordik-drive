// HeaderNav.tsx
import { NavWrapper } from "../Wrappers";
import { HeaderLink } from "../Links";
import { useSelector } from "react-redux";
import FolderIcon from "@mui/icons-material/Folder";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { Stack } from "@mui/material";

function HeaderNav() {
  const { isAdmin, isManager } = useSelector((state: any) => state.role);
  return (
    <NavWrapper>
      <Stack direction="row" spacing={3} alignItems="stretch">
        <HeaderLink to="/files">
          <FolderIcon sx={{ verticalAlign: "middle", marginRight: "6px" }} />
          Files
        </HeaderLink>

       
          <HeaderLink to="/adminpanel">
            <AdminPanelSettingsIcon
              sx={{ verticalAlign: "middle", marginRight: "6px" }}
            />
            Admin View
          </HeaderLink>
        
      </Stack>
    </NavWrapper>
  );
}

export default HeaderNav;
