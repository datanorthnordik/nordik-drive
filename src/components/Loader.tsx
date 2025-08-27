"use client";

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { color_primary } from '../constants/colors';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoaderOverlay = styled.div<{ $loading: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: ${props => props.$loading ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const LoaderSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid ${color_primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoaderText = styled.div`
  color: white;
  font-size: 18px;
  font-weight: 500;
  margin-top: 16px;
  text-align: center;
`;

interface LoaderProps {
  loading: boolean;
  text?: string;
}

export default function Loader({ loading, text = "Loading..." }: LoaderProps) {
  return (
    <LoaderOverlay $loading={loading}>
      <div>
        <LoaderSpinner />
        <LoaderText>{text}</LoaderText>
      </div>
    </LoaderOverlay>
  );
}
