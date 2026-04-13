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
    <>
      <style>
        {`
          .source-filter-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .source-filter-scroll::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "12px",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <span
          style={{
            fontWeight: "bold",
            flexShrink: 0,
          }}
        >
          Filter by Source:
        </span>

        <div
          style={{
            position: "relative",
            flex: "1 1 320px",
            minWidth: 0,
            maxWidth: "100%",
            padding: "4px",
            borderRadius: "999px",
            border: "1px solid rgba(0, 75, 156, 0.12)",
            background: `linear-gradient(180deg, ${color_white} 0%, ${color_light_gray} 100%)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <div
            className="source-filter-scroll"
            data-testid="source-filter-scroll"
            aria-label="Source filters"
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              overflowX: "auto",
              overflowY: "hidden",
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              minWidth: 0,
              padding: "2px 22px 4px 2px",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x proximity",
              maskImage:
                "linear-gradient(to right, transparent 0, black 18px, black calc(100% - 28px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, black 18px, black calc(100% - 28px), transparent 100%)",
            }}
          >
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
                flexShrink: 0,
                whiteSpace: "nowrap",
                scrollSnapAlign: "start",
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
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  scrollSnapAlign: "start",
                }}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
