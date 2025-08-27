import styled from "styled-components"

export const AuthContainer = styled.div`
    min-height: 100vh;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

    @media (max-width: 768px) {
        align-items: flex-start;
        padding-top: 40px;
    }
`;