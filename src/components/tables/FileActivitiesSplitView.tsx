"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import { AgGridReact } from "ag-grid-react";
import { GridReadyEvent } from "ag-grid-community";

import { FileButton } from "../../components/buttons/Button";
import FileActivityVisualization from "../../components/activity/FileActivityVisualization";
import { Clause, Mode } from "./FileActivitiesShared";
import { color_border, color_secondary, color_text_secondary, color_white, color_white_smoke, color_background, color_light_gray, color_text_primary, color_secondary_dark } from "../../constants/colors";

type Props = {
  themeLightWarm: any;

  rows: any[];
  columnDefs: any[];

  totalRequests: number;
  totalChanges: number;
  currentPage: number;
  totalPages: number;

  onPrev: () => void;
  onNext: () => void;

  payload: any;
  mode: Mode;
  clauses: Clause[];
};

export default function FileActivitiesSplitView({
  themeLightWarm,
  rows,
  columnDefs,
  totalRequests,
  totalChanges,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  payload,
  mode,
  clauses,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [leftPct, setLeftPct] = useState(62);

  const rightPct = 100 - leftPct;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(80, Math.max(35, (x / rect.width) * 100));
      setLeftPct(pct);
    };
    const onUp = () => (draggingRef.current = false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        borderRadius: "10px",
        overflow: "hidden",
        border: `2px solid ${color_secondary}`,
        background: color_white_smoke,
        padding: 1,
        display: "flex",
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: "8px",
          overflow: "hidden",
          border: `1px solid ${color_border}`,
          background: color_white,
          display: "flex",
        }}
      >
        {/* Left */}
        <Box
          sx={{
            width: `${leftPct}%`,
            minWidth: 360,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            borderRight: `1px solid ${color_border}`,
            background: color_white,
          }}
        >
          <Box
            sx={{
              px: 1.25,
              py: 0.9,
              borderBottom: `1px solid ${color_border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: color_white,
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography sx={{ fontWeight: 900, color: color_text_primary }}>Requests</Typography>
              <Typography sx={{ fontSize: 12, color: color_text_secondary }}>
                {totalRequests} requests | {totalChanges} changes (page {currentPage}/{totalPages})
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FileButton disabled={currentPage <= 1} onClick={onPrev}>
                PREV
              </FileButton>
              <FileButton disabled={currentPage >= totalPages} onClick={onNext}>
                NEXT
              </FileButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <div className="ag-theme-quartz" style={{ width: "100%", height: "100%" }} {...(themeLightWarm as any)}>
              <AgGridReact
                rowData={rows}
                columnDefs={columnDefs}
                defaultColDef={{ resizable: true, sortable: true, filter: true }}
                onGridReady={(params: GridReadyEvent) => void params.api}
                rowHeight={42}
                headerHeight={46}
                suppressRowClickSelection
                rowSelection="single"
                pagination={false}
                suppressPaginationPanel={true}
                domLayout="normal"
              />
            </div>
          </Box>
        </Box>

        {/* Splitter */}
        <Box
          onMouseDown={() => (draggingRef.current = true)}
          sx={{
            width: 10,
            cursor: "col-resize",
            background: color_white_smoke,
            borderLeft: `1px solid ${color_border}`,
            borderRight: `1px solid ${color_border}`,
          }}
        />

        {/* Right */}
        <Box
          sx={{
            width: `${rightPct}%`,
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            background: color_white,
          }}
        >
          {payload ? (
            <FileActivityVisualization mode={mode} payload={payload} clauses={clauses} />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                p: 2,
                borderLeft: `1px solid ${color_border}`,
                background: color_white,
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <InsertChartOutlinedIcon sx={{ fontSize: 56, color: "#cbd5e1" }} />
                <Typography sx={{ mt: 1, fontWeight: 900, color: color_text_secondary }}>
                  Run a search to see visualization.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* AG Grid theme tweaks using ONLY your colors */}
      <style>
        {`
          .ag-theme-quartz .ag-header-cell {
            background-color: ${color_background} !important;
            font-weight: 900 !important;
            color: ${color_secondary_dark} !important;
          }
          .ag-theme-quartz .ag-header-row {
            border-bottom: 1px solid ${color_border} !important;
          }
          .ag-theme-quartz .ag-paging-panel { display: none !important; }
          .ag-theme-quartz .ag-row:hover { background-color: ${color_light_gray} !important; }
          .ag-theme-quartz .ag-row-selected { background-color: ${color_white_smoke} !important; }
          .ag-theme-quartz .ag-root-wrapper { border: none !important; }
          .ag-theme-quartz .ag-cell { color: ${color_text_primary} !important; }
        `}
      </style>
    </Box>
  );
}
