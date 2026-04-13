import styled from "styled-components"
import { AUTH_CONTAINER_STYLES } from "./constants";

export const AuthContainer = styled.div`
    min-height: ${AUTH_CONTAINER_STYLES.minHeight};
    overflow-y: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    background: ${AUTH_CONTAINER_STYLES.gradientBackground};

    @media (max-width: ${AUTH_CONTAINER_STYLES.mobileBreakpoint}) {
        align-items: flex-start;
        padding-top: ${AUTH_CONTAINER_STYLES.mobilePaddingTop};
    }
`;
