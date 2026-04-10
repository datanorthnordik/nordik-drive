"use client";

import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { Box, Typography } from "@mui/material";
import { FileButton } from "../buttons/Button";

import dayjs from "dayjs";

import {
  color_secondary,
  color_secondary_dark,
  color_border,
  color_white,
  color_light_gray,
  color_white_smoke,
  color_text_primary,
  color_text_light,
  color_background,
} from "../../constants/colors";
import { readOnlyAgGridModules, registerAgGridModules } from "../../lib/agGridModules";

registerAgGridModules(readOnlyAgGridModules);

export type FormSubmissionRow = {
  id: number;
  file_id: number;
  row_id: number;
  file_name: string;
  form_key: string;
  form_label?: string;
  first_name: string;
  last_name: string;
  created_by: string;
  edited_by: string;
  reviewed_by: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  title: string;
  rows: FormSubmissionRow[];
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onOpenDetails: (row: FormSubmissionRow) => void;
  showCreatedByColumn?: boolean;
  actionLabel?: string;
};

export default function FormSubmissionGrid({
  title,
  rows,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onOpenDetails,
  showCreatedByColumn = true,
  actionLabel = "View Details",
}: Props) {
  const columnDefs = useMemo(() => {
    const cols: any[] = [
      { field: "form_label", headerName: "Form Type", flex: 1, minWidth: 180 },
      { field: "first_name", headerName: "First Name", flex: 1, minWidth: 150 },
      { field: "last_name", headerName: "Last Name", flex: 1, minWidth: 150 },
      { field: "file_name", headerName: "File", flex: 1.25, minWidth: 220 },
      ...(showCreatedByColumn
        ? [{ field: "created_by", headerName: "Created By", flex: 1.2, minWidth: 220 }]
        : []),
      { field: "edited_by", headerName: "Edited By", flex: 1.2, minWidth: 220 },
      { field: "reviewed_by", headerName: "Reviewed By", flex: 1.2, minWidth: 220 },
      {
        field: "status",
        headerName: "Status",
        minWidth: 130,
        flex: 0.8,
      },
      {
        field: "updated_at",
        headerName: "Updated At",
        minWidth: 170,
        flex: 1,
        valueFormatter: (p: any) =>
          p.value ? dayjs(p.value).format("DD-MM-YYYY HH:mm") : "-",
      },
      {
        headerName: actionLabel,
        field: "__details__",
        width: 140,
        minWidth: 140,
        sortable: false,
        filter: false,
        pinned: "right" as const,
        cellRenderer: (params: any) => (
          <button
            style={{
              padding: "6px 10px",
              background: color_secondary,
              color: color_white,
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              width: "100%",
              height: "32px",
              fontSize: "12px",
              fontWeight: 700,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(params.data as FormSubmissionRow);
            }}
          >
            {actionLabel}
          </button>
        ),
      },
    ];

    return cols;
  }, [showCreatedByColumn, actionLabel, onOpenDetails]);

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  return (
    <>
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
          sx={{
            flex: 1,
            minHeight: 0,
            borderRadius: "8px",
            overflow: "hidden",
            border: `1px solid ${color_border}`,
            background: color_white,
            display: "flex",
            flexDirection: "column",
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
              <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
                {title}
              </Typography>
              <Typography sx={{ fontSize: 12, color: color_text_light }}>
                {rows.length} rows (page {currentPage}/{totalPages})
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
            <div className="ag-theme-quartz" style={{ width: "100%", height: "100%" }}>
              <AgGridReact
                rowData={rows}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
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
      </Box>

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
          .ag-theme-quartz .ag-paging-panel {
            display: none !important;
          }
          .ag-theme-quartz .ag-row:hover {
            background-color: ${color_light_gray} !important;
          }
          .ag-theme-quartz .ag-row-selected {
            background-color: ${color_white_smoke} !important;
          }
          .ag-theme-quartz .ag-root-wrapper {
            border: none !important;
          }
          .ag-theme-quartz .ag-cell {
            color: ${color_text_primary} !important;
          }
        `}
      </style>
    </>
  );
}
