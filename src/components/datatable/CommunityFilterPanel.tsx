"use client";

import React from "react";
import CommunityFilter from "../CommunityFilter/CommunityFilter";
import { color_background, color_primary, color_white } from "../../constants/colors";

type Props = {
  enabled: boolean;
  isMobile: boolean;

  filterOpen: boolean;
  setFilterOpen: (v: boolean) => void;

  overlayTop: number;
  overlayHeight: number;
};

export default function CommunityFilterPanel({
  enabled,
  isMobile,
  filterOpen,
  setFilterOpen,
  overlayTop,
}: Props) {
  if (!enabled) return null;

  return (
    <>
      {/* Desktop left panel */}
      {!isMobile && filterOpen && (
        <div
          className="left-panel"
          style={{
            padding: "8px 16px",
            boxSizing: "border-box",
            flex: "0 0 30%",
            maxWidth: "30%",
            transition: "all 220ms ease",
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",

            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            maxHeight: "100%",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              background: color_white,
              paddingBottom: 8,
            }}
          />

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: 6,
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            <CommunityFilter onClose={() => setFilterOpen(false)} showClose />
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && filterOpen && (
        <div
          className="mobile-filter-overlay"
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: overlayTop,
            zIndex: 999,
            background: color_background,
            borderRadius: 10,
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            maxHeight: `calc(100vh - ${overlayTop + 16}px)`,
            overflow: "auto",
            padding: 12,
            transform: "translateY(0)",
            transition: "opacity 240ms ease, transform 240ms ease",
            opacity: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <button
              onClick={() => setFilterOpen(false)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: color_primary,
                color: color_white,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                flex: 1,
              }}
            >
              Close filter
            </button>
          </div>

          <CommunityFilter onClose={() => setFilterOpen(false)} showClose />
        </div>
      )}
    </>
  );
}
