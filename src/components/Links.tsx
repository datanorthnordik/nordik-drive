"use client";
import styled from 'styled-components'
import { color_primary, color_secondary, color_secondary_dark } from '../constants/colors'
import { NavLink } from 'react-router-dom';

export const LinkButton = styled.button`
    color: ${color_secondary};
    cursor: pointer;
    font-weight: 600;
    font-size: 16px; /* Larger text for better readability */
    background: none;
    border: none;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
    padding: 8px 0;
    transition: all 0.2s ease;

    &:hover {
        color: ${color_primary};
        text-decoration-thickness: 2px;
        transform: translateY(-1px);
    }

    &:focus {
        outline: 2px solid ${color_primary};
        outline-offset: 2px;
        border-radius: 4px;
    }
`;

export const SecondaryButton = styled.button`
    background: transparent;
    border: 2px solid ${color_primary};
    color: ${color_primary};
    padding: 12px 32px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 48px; /* Minimum touch target for accessibility */

    &:hover {
        background: ${color_primary};
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
    }

    &:focus {
        outline: 2px solid ${color_primary};
        outline-offset: 2px;
    }
`;


export const HeaderLink = styled(NavLink)<{ fullWidth?: boolean }>`
  color: #003366;
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 6px;
  width: ${(props) => (props.fullWidth ? "100%" : "auto")};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${color_secondary};
    color: white;
  }

  &.active {
    background-color: ${color_secondary_dark};
    color: white;
    font-weight: 600;
  }

  @media screen and (max-width: 600px){
        width: 100%
  }
`;

export const WebLink  = styled.a`
  text-decoration: underline;
  cursor: pointer
`


