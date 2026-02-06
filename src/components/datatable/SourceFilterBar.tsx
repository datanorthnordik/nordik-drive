"use client";

import React from "react";
import { colorSources } from "../../constants/constants";
import {
  color_black,
  color_light_gray,
  color_white,
} from "../../constants/colors";

type Props = {
  availableSources: string[];
  sourceFilter: string | null;
  setSourceFilter: (v: string | null) => void;
};

export default function SourceFilterBar({
  availableSources,
  sourceFilter,
  setSourceFilter,
}: Props) {
  if (!availableSources || availableSources.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        marginBottom: "12px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontWeight: "bold" }}>
        Filter by Source:
      </span>

      <button
        onClick={() => setSourceFilter(null)}
        style={{
          padding: "4px 14px",
          borderRadius: "6px",
          fontSize: "0.8rem",
          border:
            sourceFilter === null
              ? `3px solid ${color_black}`
              : `1px solid ${color_light_gray}`,
          background: color_white,
          color: color_black,
          cursor: "pointer",
          fontWeight: 600,
          boxShadow:
            sourceFilter === null
              ? "0 0 6px rgba(0,0,0,0.3)"
              : "none",
        }}
      >
        All
      </button>

      {availableSources.map((key) => (
        <button
          key={key}
          onClick={() => setSourceFilter(key)}
          style={{
            fontSize: "0.7rem",
            padding: "4px 14px",
            borderRadius: "6px",
            border:
              sourceFilter === key
                ? "3px solid #000"
                : "1px solid #ccc",
            background: colorSources[key],
            color: color_white,
            cursor: "pointer",
            fontWeight: 600,
            boxShadow:
              sourceFilter === key
                ? "0 0 6px rgba(0,0,0,0.4)"
                : "none",
            textShadow:
              "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
