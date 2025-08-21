import styled from 'styled-components';

import {header_height} from "../constants/colors"

export const AuthWrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 500px;
    flex-direction: column;
    border-radius: .5rem;
    box-shadow: 0 2px 4px #0000001a, 0 8px 16px #0000001a;
    box-sizing: border-box;
    padding: 20px;
    background: #fff;
    margin: 1rem;
`;


export const GridWrapper = styled.div`
    display: flex;
    height: calc(100vh - ${header_height});
    flex-direction: column;
    margin-top: ${header_height};
    .ag-header-cell-label {
        font-weight: bold;
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
    padding: 30px 10%;
`

export const LayoutWrapper = styled.div`
    display: flex;
    flex-direction: column;
`

export const NavWrapper = styled.nav`
    & > *{
        margin: 0px 15px
    }
`


export const AdminPanelWrapper = styled.div `
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: ${header_height};
    padding: 20px
`

export const FileWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items:flex-start;
    gap: 20px;
    & > * {
        flex: 1
    }
`