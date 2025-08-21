import { Button } from '@mui/material';
import styled from 'styled-components';
import { color_primary, color_secondary } from '../../constants/colors';

export const FileButton = styled(Button)`
    border: 2px solid ${color_primary} !important;
    color: ${color_primary} !important;
    background: white !important;
    font-weight: bold;
`

export const CloseButton = styled(Button)`
    border: 2px solid ${color_secondary} !important;
    color: ${color_secondary} !important;
    background: white !important;
    font-weight: bold;
`
