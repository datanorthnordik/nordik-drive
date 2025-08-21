import styled from 'styled-components'

const TextGroup = styled.div`
    display: flex;
    flex-direction: row;
    gap: 10px;

    & > *{
        width: ${(props: any) => (props.width ? props.width : "50%")};
    }
`

export default TextGroup