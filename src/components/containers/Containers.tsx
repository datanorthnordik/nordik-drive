import styled from "styled-components"

export const AuthContainer = styled.div`
    min-height: 100vh;
    overflow-y: auto; 
    display: flex;
    justify-content: center; 
    align-items: center;
    @media (max-width: 600px) {
       align-items: flex-start;
    }
`