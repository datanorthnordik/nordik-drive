import { Checkbox } from '@mui/material';
import styled from 'styled-components'
import { color_secondary } from '../constants/colors';

const TextGroup = styled.div`
    display: flex;
    flex-direction: row;
    gap: 10px;
    width: 100%;

    & > *{
        width: ${(props: any) => (props.width ? props.width : "50%")};
    }
`

export const CheckBoxWrapper = styled(Checkbox)`
  &.Mui-checked {
    color: ${color_secondary} !important
  }
`;

export default TextGroup