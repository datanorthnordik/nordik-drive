import { Link } from 'react-router-dom';
import { HeaderLink } from '../Links';
import { NavWrapper } from '../Wrappers';
import { useSelector } from 'react-redux';

function HeaderNav() {
  const {isAdmin, isManager} = useSelector((state:any)=> state.role)
  return (
    <NavWrapper>
      <HeaderLink to="/files">Files</HeaderLink>
      {(isAdmin || isManager) && <HeaderLink to="/adminpanel">Admin View</HeaderLink>}
    </NavWrapper>
  )
}

export default HeaderNav