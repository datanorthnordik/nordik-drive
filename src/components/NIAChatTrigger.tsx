"use client";

import React from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/system";
import { Bot } from "lucide-react";

import {
  color_secondary,
  color_secondary_dark,
  color_white,
} from "../constants/colors";

const triggerPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.82;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
`;

const triggerGlow = keyframes`
  0%, 100% {
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
  }
  50% {
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.26);
  }
`;

export default function NIAChatTrigger({ setOpen }: { setOpen: (v: boolean) => void }) {
  return (
    <Box
      component="button"
      onClick={() => setOpen(true)}
      aria-label="Open NIA AI"
      sx={{
        background: `linear-gradient(135deg, ${color_secondary}, ${color_secondary_dark})`,
        border: "none",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "10px 15px",
        borderRadius: "20px",
        justifyContent: "center",
        alignItems: "center",
        color: color_white,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.18)",
        animation: `${triggerGlow} 2.4s ease-in-out infinite`,
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 16px 36px rgba(15, 23, 42, 0.28)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "20px",
          background: "radial-gradient(circle at center, rgba(255,255,255,0.15), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateY(-1px)",
          animation: `${triggerPulse} 2s ease-in-out infinite`,
        }}
      >
        <Bot size={32} />
      </Box>
      <Box component="span" sx={{ color: color_white, fontWeight: 700, position: "relative", zIndex: 1 }}>
        NIA AI
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color_white,
          opacity: 0.9,
        }}
      />
    </Box>
  );
}
