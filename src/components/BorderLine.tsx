"use client";

import styled from 'styled-components';
import { color_border } from '../constants/colors'

const BorderLine = styled.div`
    height: 2px; /* Slightly thicker for better visibility */
    width: 100%;
    background: linear-gradient(90deg, transparent 0%, ${color_border} 20%, ${color_border} 80%, transparent 100%);
    margin: 24px 0; /* More spacing around the border */
    position: relative;

    &::before {
        content: 'OR';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 0 16px;
        font-size: 14px;
        font-weight: 600;
        color: #6b7280;
        letter-spacing: 1px;
    }
`;

export default BorderLine;