import styled from 'styled-components';
import {header_height, header_mobile_height} from "../constants/colors"

export const GridWrapper = styled.div`
    display: flex;
    height: calc(100vh - ${header_height});
    flex-direction: column;
    margin-top: ${header_height};
    .ag-header-cell-label {
        font-weight: bold;
    }
    
    @media screen and (max-width: 600px){
        margin-top: ${header_mobile_height};
        height: calc(100vh - ${header_mobile_height});
    }
`
export const FileListWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    margin-top: ${header_height};
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    padding: 30px 5%;


    @media screen and (max-width: 400px){
        margin-top: ${header_mobile_height};
    }
`

export const LayoutWrapper = styled.div`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
`

export const NavWrapper = styled.nav`
    flex:1;
    display:flex;
    justify-content:center;
    

    @media screen and (max-width: 500px){
        & > *{
            margin: 0px;
        }
    }

    @media screen and (max-width: 600px){
        padding-top: 2rem;
    }

`


export const AdminPanelWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: ${header_height};
    padding: 30px 5%;

    @media screen and (max-width: 600px){
        margin-top: ${header_mobile_height};
    };

    @media screen and (max-width: 400px){
        margin-top: 7rem;
    }
`

export const FileWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items:flex-start;
    gap: 20px;

    & > * {
        flex: 1
    };

`
 
export const AuthWrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 580px; /* Slightly wider for better readability */
    flex-direction: column;
    border-radius: 12px; /* More rounded corners */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 16px 32px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    padding: 1rem 2.5rem 2.5rem 2.5rem; /* More padding for breathing room */
    background: #fff;
    margin: 2rem;

    h2 {
        font-size: 28px; /* Larger heading */
        font-weight: 600;
        text-align: center;
        margin-bottom: 32px;
        color: #2c3e50;
        letter-spacing: -0.5px;
    }

    @media (max-width: 768px) {
        padding: 24px;
        margin: 1rem;
        max-width: 90%;

        h2 {
            font-size: 24px;
            margin-bottom: 24px;
        }
    }
`;

export const FormWrapper = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center; 
    gap: .5rem; 

    .form-field {
        margin-bottom: 8px; 
    }

    .form-actions {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: .5rem;
        align-items: center;
    }
`;

export const DataTableWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: calc(100vh - ${header_height});
    padding: 8px;
    box-sizing: border-box;
    @media screen and (max-width: 600px){
        height: calc(100vh - ${header_mobile_height});
    };
`

export const ActivityTableWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: calc(100vh - ${header_height});
    padding: 8px;
    box-sizing: border-box;
    margin-top: ${header_height};
    padding: 10px 5%;

    @media screen and (max-width: 600px){
        margin-top: ${header_mobile_height};
        height: calc(100vh - ${header_mobile_height});
    };
` 