'use client';

import React from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  color_border,
  color_confidential_card_bg,
  color_error,
  color_focus_ring,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../../constants/colors";

import {
  BaseLeafColCfg,
  LookupItem,
  TableCfg,
  asBool,
  buildHeader,
  flattenCols,
  getLeafColWidth,
  getOptionLabel,
  inputSx,
  readOnlyValueSx,
  requiredBadge,
} from "./shared";

type Props = {
  tbl: TableCfg;
  sectionTitle?: string;
  rows: any[];
  editable: boolean;
  missingKeys: Set<string>;

  lookupOptionsByPath: Record<string, LookupItem[]>;
  lookupLoadingByPath: Record<string, boolean>;
  lookupErrorsByPath: Record<string, string>;

  getLookupPathForColumn: (col: BaseLeafColCfg, rowValues: Record<string, any>) => string;
  getSelectedLookupOption: (col: BaseLeafColCfg, rowValues: Record<string, any>) => LookupItem | null;

  setConfiguredCell: (
    tbl: TableCfg,
    rowIdx: number,
    col: BaseLeafColCfg,
    value: any
  ) => void;

  addRow: (tbl: TableCfg) => void;
  removeRow: (tbl: TableCfg, idx: number) => void;
};

export default function ConfigFormTableSection({
  tbl,
  sectionTitle,
  rows,
  editable,
  missingKeys,
  lookupOptionsByPath,
  lookupLoadingByPath,
  lookupErrorsByPath,
  getLookupPathForColumn,
  getSelectedLookupOption,
  setConfiguredCell,
  addRow,
  removeRow,
}: Props) {
  const missCell = (t: string, r: number, c: string) => `t:${t}:${r}:${c}`;

  const leafCols = flattenCols(tbl.columns);
  const { hasGroup, row1, row2 } = buildHeader(tbl.columns);
  const actionColWidth = 104;

  const tableMinWidth = Math.max(
    980,
    leafCols.reduce((sum, col) => sum + getLeafColWidth(col), 0) + actionColWidth
  );

  return (
    <Box sx={{ mt: 1.5 }}>
      {tbl.title ? (
        <Typography sx={{ fontWeight: 900, mb: 0.5, color: color_text_primary }}>
          {tbl.title}
        </Typography>
      ) : null}

      {tbl.note ? (
        <Typography
          sx={{
            mb: 1,
            color: color_text_secondary,
            fontSize: "0.94rem",
            fontWeight: 700,
          }}
        >
          {tbl.note}
        </Typography>
      ) : null}

      <Box
        sx={{
          overflowX: "auto",
          border: `1px solid ${color_border}`,
          borderRadius: 2,
          background: color_white,
        }}
      >
        <Table
          size="small"
          aria-label={tbl.title || sectionTitle || tbl.key}
          sx={{
            tableLayout: "fixed",
            minWidth: tableMinWidth,
            "& .MuiTableCell-root": {
              verticalAlign: "top",
            },
          }}
        >
          <TableHead>
            <TableRow>
              {row1.map((h, idx) => (
                <TableCell
                  key={idx}
                  colSpan={h.colSpan}
                  rowSpan={h.rowSpan}
                  sx={{
                    fontWeight: 900,
                    color: color_text_primary,
                    background: color_white_smoke,
                    width: h.width,
                    minWidth: h.width,
                    maxWidth: h.width,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    fontSize: "0.92rem",
                  }}
                >
                  {h.label} {h.rowSpan === 2 && h.required ? requiredBadge : null}
                </TableCell>
              ))}

              {editable&& <TableCell
                rowSpan={hasGroup ? 2 : 1}
                sx={{
                  fontWeight: 900,
                  width: actionColWidth,
                  minWidth: actionColWidth,
                  maxWidth: actionColWidth,
                  background: color_white_smoke,
                  color: color_text_primary,
                  fontSize: "0.92rem",
                }}
              >
                Actions
              </TableCell>}
            </TableRow>

            {hasGroup ? (
              <TableRow>
                {row2.map((h, idx) => (
                  <TableCell
                    key={idx}
                    sx={{
                      fontWeight: 900,
                      color: color_text_primary,
                      background: color_white_smoke,
                      width: h.width,
                      minWidth: h.width,
                      maxWidth: h.width,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      fontSize: "0.92rem",
                    }}
                  >
                    {h.label} {h.required ? requiredBadge : null}
                  </TableCell>
                ))}
              </TableRow>
            ) : null}
          </TableHead>

          <TableBody>
            {rows.map((r: any, rIdx: number) => (
              <TableRow key={rIdx}>
                {leafCols.map((c) => {
                  const cellMissing = missingKeys.has(missCell(tbl.key, rIdx, c.key));

                  const serverBacked = asBool(c.is_server) && Boolean(c.api);
                  const lookupPath = serverBacked ? getLookupPathForColumn(c, r || {}) : "";
                  const lookupOptions = lookupPath ? lookupOptionsByPath[lookupPath] || [] : [];
                  const lookupLoading = lookupPath ? Boolean(lookupLoadingByPath[lookupPath]) : false;
                  const lookupError = lookupPath ? lookupErrorsByPath[lookupPath] : "";

                  const hasApiToken = Boolean(c.api && /\{[^}]+\}/.test(c.api));
                  const waitingForDependency = serverBacked && hasApiToken && !lookupPath;

                  const disabledByConfig = asBool(c.disabled);
                  const disabled = !editable || disabledByConfig || waitingForDependency;

                  const isDropdown = c.type === "dropdown";
                  const isMultiline = c.type === "textarea";
                  const columnWidth = getLeafColWidth(c);

                  const rawValue = (r && r[c.key]) ?? "";
                  const rawText =
                    rawValue !== undefined &&
                    rawValue !== null &&
                    String(rawValue).trim() !== ""
                      ? String(rawValue)
                      : "";

                  const selectedLookupOption =
                    (isDropdown &&
                      lookupOptions.find((item) => String(item.id) === String(rawValue))) ||
                    (isDropdown && serverBacked ? getSelectedLookupOption(c, r || {}) : null);

                  const readOnlyText = isDropdown
                    ? selectedLookupOption
                      ? getOptionLabel(selectedLookupOption)
                      : rawText || "—"
                    : rawText || "—";

                  return (
                    <TableCell
                      key={c.key}
                      sx={{
                        width: columnWidth,
                        minWidth: columnWidth,
                        maxWidth: columnWidth,
                        p: 1.25,
                      }}
                    >
                      <Box
                        sx={
                          cellMissing
                            ? {
                                background: color_confidential_card_bg,
                                border: `2px solid ${color_error}`,
                                borderRadius: 2,
                                p: 0.5,
                              }
                            : undefined
                        }
                      >
                        {disabled ? (
                          <Tooltip
                            title={
                              readOnlyText && readOnlyText !== "—" ? (
                                <Box
                                  sx={{
                                    maxWidth: 420,
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    overflowWrap: "anywhere",
                                    lineHeight: 1.45,
                                    fontSize: "0.95rem",
                                    py: 0.25,
                                  }}
                                >
                                  {readOnlyText}
                                </Box>
                              ) : (
                                ""
                              )
                            }
                            arrow
                            placement="top-start"
                            disableHoverListener={!readOnlyText || readOnlyText === "—"}
                            disableFocusListener={!readOnlyText || readOnlyText === "—"}
                            disableTouchListener={!readOnlyText || readOnlyText === "—"}
                          >
                            <Box sx={readOnlyValueSx}>{readOnlyText}</Box>
                          </Tooltip>
                        ) : isDropdown ? (
                          <TextField
                            select
                            value={rawValue}
                            onChange={(e) => {
                              const selectedRaw = e.target.value;
                              const selectedMatch = lookupOptions.find(
                                (item) => String(item.id) === String(selectedRaw)
                              );

                              editable &&
                                setConfiguredCell(
                                  tbl,
                                  rIdx,
                                  c,
                                  selectedMatch ? selectedMatch.id : selectedRaw
                                );
                            }}
                            size="small"
                            fullWidth
                            disabled={disabled}
                            error={cellMissing}
                            helperText={
                              cellMissing
                                ? "This field is required."
                                : lookupError
                                  ? "Failed to load options."
                                  : " "
                            }
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              ...inputSx,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: color_white,
                                minHeight: 56,
                              },
                              ...(cellMissing
                                ? {
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: color_error,
                                      borderWidth: "2px",
                                    },
                                  }
                                : {}),
                            }}
                            inputProps={{ style: { fontSize: "15px" } }}
                          >
                            <MenuItem value="">
                              {lookupLoading
                                ? "Loading..."
                                : waitingForDependency
                                  ? "Select previous value first"
                                  : "Select"}
                            </MenuItem>

                            {lookupOptions.map((item) => (
                              <MenuItem key={String(item.id)} value={item.id}>
                                {getOptionLabel(item)}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : (
                          <TextField
                            value={rawValue}
                            onChange={(e) => editable && setConfiguredCell(tbl, rIdx, c, e.target.value)}
                            size="small"
                            fullWidth
                            multiline={isMultiline}
                            rows={isMultiline ? 2 : 1}
                            disabled={disabled}
                            error={cellMissing}
                            helperText={cellMissing ? "This field is required." : " "}
                            InputLabelProps={{ shrink: true }}
                            placeholder={c.placeholder || ""}
                            sx={{
                              ...inputSx,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: color_white,
                                minHeight: isMultiline ? 72 : 56,
                                alignItems: isMultiline ? "flex-start" : "center",
                              },
                              ...(cellMissing
                                ? {
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: color_error,
                                      borderWidth: "2px",
                                    },
                                  }
                                : {}),
                            }}
                            inputProps={{ style: { fontSize: "15px" } }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  );
                })}

                {editable && <TableCell
                  sx={{
                    width: actionColWidth,
                    minWidth: actionColWidth,
                    maxWidth: actionColWidth,
                    p: 1.25,
                  }}
                >
                  <IconButton
                    size="medium"
                    onClick={() => editable && removeRow(tbl, rIdx)}
                    disabled={!editable}
                    aria-label="remove row"
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${color_border}`,
                      background: color_white,
                      "&:focus-visible": {
                        outline: `3px solid ${color_focus_ring}`,
                        outlineOffset: "2px",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {editable && tbl.allow_add_rows ? (
        <Button
          startIcon={<AddIcon />}
          onClick={() => editable && addRow(tbl)}
          disabled={!editable}
          sx={{
            mt: 1,
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 2,
            py: 1,
            background: color_white,
            border: `1px solid ${color_border}`,
            color: color_text_primary,
            "&:hover": { background: color_white_smoke },
            "&:focus-visible": {
              outline: `3px solid ${color_focus_ring}`,
              outlineOffset: "2px",
            },
          }}
        >
          {tbl.add_row_label || "Add row"}
        </Button>
      ) : null}
    </Box>
  );
}