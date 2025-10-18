import { styled } from "styled-components";

export const LegendWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

export const LegendItem = styled.div<{ color: string; active: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  background-color: ${(props) => props.color};
  color: ${(props) => (props.color === '#ffffff' ? '#000' : '#fff')};
  cursor: pointer;
  opacity: ${(props) => (props.active ? 1 : 0.6)};
  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};
  border: 2px solid ${(props) => (props.active ? '#000' : 'transparent')};
  transition: all 0.2s;
`;
