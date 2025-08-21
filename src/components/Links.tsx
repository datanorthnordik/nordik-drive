import styled from 'styled-components'
import { color_primary, color_secondary } from '../constants/colors'
import { NavLink } from 'react-router-dom';

export const LinkButton = styled.a`
    color: ${color_secondary};
    cursor: pointer;
    font-weight: 700;
    margin: 1rem 0px
`


export const HeaderLink = styled(NavLink)`
  color: ${color_secondary};
  text-decoration: none;

  

  &:hover {
    text-decoration: underline;
    text-decoration-thickness: 4px;
    text-underline-offset: 1rem;   
    color: ${color_primary}
  }

   &.active {
    text-decoration: underline;
    text-decoration-thickness: 4px;
    text-underline-offset: 1rem;   
    color: ${color_primary};
    font-weight: 600;
  }
`;

