import React from "react";
import { Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

import {
  color_background,
  color_border,
  color_secondary,
  color_text_light,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../constants/colors";
import { FileButton } from "../buttons/Button";
import type { SupportRequestItem } from "../../pages/request_hub/supportRequests";

export type SupportRequestsTableColumn = {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  cellSx?: Record<string, any>;
  render: (row: SupportRequestItem) => React.ReactNode;
};

type SupportRequestsTableProps = {
  title: string;
  rows: SupportRequestItem[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  emptyText: string;
  columns: SupportRequestsTableColumn[];
  onPrev: () => void;
  onNext: () => void;
};

const headCellSx = {
  fontWeight: 900,
  fontSize: "0.68rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  color: color_text_light,
  backgroundColor: color_background,
  borderBottom: `1px solid ${color_border}`,
  py: 1.1,
  px: 1.5,
  whiteSpace: "nowrap" as const,
};

const bodyCellSx = {
  fontSize: "0.82rem",
  color: color_text_primary,
  borderBottom: `1px solid ${color_border}`,
  py: 1.2,
  px: 1.5,
  whiteSpace: "nowrap" as const,
  verticalAlign: "top" as const,
  backgroundColor: color_white,
};

export default function SupportRequestsTable({
  title,
  rows,
  totalItems,
  currentPage,
  totalPages,
  emptyText,
  columns,
  onPrev,
  onNext,
}: SupportRequestsTableProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        borderRadius: "12px",
        overflow: "hidden",
        border: `2px solid ${color_secondary}`,
        background: color_white_smoke,
        p: 1,
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
            py: 0.95,
            borderBottom: `1px solid ${color_border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: color_white,
            flexShrink: 0,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 900, color: color_text_primary }}>{title}</Typography>
            <Chip
              label={`Total Requests: ${totalItems}`}
              size="small"
              sx={{
                fontWeight: 900,
                borderRadius: "10px",
                background: color_white,
                border: `1px solid ${color_border}`,
                color: color_text_primary,
              }}
            />
            <Chip
              label={`Page ${currentPage} of ${totalPages}`}
              size="small"
              sx={{
                fontWeight: 800,
                borderRadius: "10px",
                background: color_white,
                border: `1px solid ${color_border}`,
                color: color_text_secondary,
              }}
            />
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

        <TableContainer
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            backgroundColor: color_background,
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align || "left"} sx={headCellSx}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    sx={{
                      py: 3.5,
                      color: color_text_light,
                      backgroundColor: color_background,
                      borderBottom: `1px solid ${color_border}`,
                      fontSize: "0.88rem",
                    }}
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    hover
                    key={row.id}
                    sx={{
                      "&:hover td": {
                        backgroundColor: color_white_smoke,
                      },
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align || "left"}
                        sx={{ ...bodyCellSx, ...(column.cellSx || {}) }}
                      >
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}

              {rows.length > 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={{
                      height: 14,
                      borderBottom: "none",
                      backgroundColor: color_background,
                    }}
                  />
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
