import * as React from "react"
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { useNavigate } from "react-router-dom";
import './Header.scss'
import HeaderNav from "../header_nav/HeaderNav";
import Logout from "../logout/Logout";
import { NavWrapper } from "../Wrappers";
import { NavContainer } from "../NavContainer";

interface AppToolbarProps {
    handleDrawerToggle?: () => void
    hideIcon?: boolean
}

const AppToolbar = (props: AppToolbarProps) => {
    return (
        <AppBar className="apptoolbar" component="nav">
            <Toolbar className='toolbar'>
                <img className="toolbar_brand" fetchPriority="high" width="1280" height="320"
                    src="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-1280x320.png" alt="Nordik Institute"
                    srcSet="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-1280x320.png 1280w, 
                    https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-640x160.png 640w, 
                    https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-768x192.png 768w, 
                    https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-1536x384.png 1536w, 
                    https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo.png 1656w"
                    sizes="(max-width: 1280px) 100vw, 1280px"></img>
                <NavContainer>
                    <HeaderNav/>
                    <Logout/>
                </NavContainer>
            </Toolbar>
        </AppBar>
    )
}

export default AppToolbar