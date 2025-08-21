import { Tab, Tabs } from "@mui/material";
import { styled } from "styled-components";
import { color_primary, color_secondary } from "../constants/colors";

export const AdminTab = styled(Tab)`
  && { 
    flex-direction: row;
    gap: 6px;
    justify-content: center;
    align-items: center;

    font-size: 0.85rem;
    text-transform: none;

    border: 2px solid ${color_secondary} !important;
    border-radius: 8px;
    padding: 6px 14px;
    min-height: auto;
    min-width: 120px;
    font-weight: 600;

    color: ${color_secondary} !important;
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover {
      border-color: ${color_primary} !important;
      color: ${color_primary} !important;
    }

    &&.Mui-selected {
      border-color: ${color_primary} !important;
      color: ${color_primary} !important;
    }
  }`

export const AdminTabWrapper = styled(Tabs)`
    .MuiTabs-flexContainer {
        gap: 20px !important
    }
    
    .MuiTabs-indicator {
        display: none;
    }
`

