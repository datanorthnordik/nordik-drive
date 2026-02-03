"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TuneIcon from "@mui/icons-material/Tune";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

import {
  Clause,
  COMMON_FIELDS,
  FILE_CONTENT_FIELDS,
  FieldType,
  Joiner,
  Operation,
  OPS_BY_TYPE,
  SelectOption,
  deriveSelectedFileId,
  hasFileClause,
  mergeSelectedIntoOptions,
  uid,
} from "./FileActivitiesShared";

import {
  color_border,
  color_secondary_dark,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../constants/colors";

type Props = {
  clauses: Clause[];
  setClauses: React.Dispatch<React.SetStateAction<Clause[]>>;

  userOptions: SelectOption[];
  fileOptions: SelectOption[];
  communityOptions: SelectOption[];
  uploaderCommunityOptions: SelectOption[];

  // dynamic options for field_key when file is selected
  fieldList: SelectOption[];

  onApply: () => void;
  onReset: () => void;

  onModeSwitchToGeneral: (mode: any) => void;

  primaryBtnSx: any;
  secondaryBtnSx: any;
};

export default function FileActivitiesFilters({
  clauses,
  setClauses,
  userOptions,
  fileOptions,
  communityOptions,
  uploaderCommunityOptions,
  fieldList,
  onApply,
  onReset,
  onModeSwitchToGeneral,
  primaryBtnSx,
  secondaryBtnSx,
}: Props) {
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Query builder state is internal here
  const [nextJoiner, setNextJoiner] = useState<Joiner>("AND");
  const [builderField, setBuilderField] = useState<string>("");
  const [builderOp, setBuilderOp] = useState<Operation>("EQ");
  const [builderValue, setBuilderValue] = useState<string>("");
  const [builderValues, setBuilderValues] = useState<string[]>([]);
  const [builderStart, setBuilderStart] = useState<Dayjs | null>(null);
  const [builderEnd, setBuilderEnd] = useState<Dayjs | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filterSummary = useMemo(() => {
    if (clauses.length === 0) return ["No filters"];
    return [`${clauses.length} filter${clauses.length > 1 ? "s" : ""}`];
  }, [clauses.length]);

  const selectedFileId = useMemo(
    () => deriveSelectedFileId(clauses, builderField, builderOp, builderValue, builderValues),
    [clauses, builderField, builderOp, builderValue, builderValues]
  );

  const availableFields = useMemo(() => {
    return hasFileClause(clauses) || selectedFileId
      ? [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS]
      : COMMON_FIELDS;
  }, [clauses, selectedFileId]);

  const selectedField = useMemo(
    () => availableFields.find((f) => f.key === builderField) || null,
    [availableFields, builderField]
  );

  const opOptions = useMemo(() => {
    if (!selectedField) return [];
    return OPS_BY_TYPE[selectedField.type];
  }, [selectedField]);

  useEffect(() => {
    if (!selectedField) return;
    const ops = OPS_BY_TYPE[selectedField.type];
    if (!ops.some((x) => x.op === builderOp)) setBuilderOp(ops[0].op);

    setBuilderValue("");
    setBuilderValues([]);
    setBuilderStart(null);
    setBuilderEnd(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderField]);

  useEffect(() => {
    if (!selectedField || selectedField.type !== "date") return;
    if (builderOp !== "BETWEEN") {
      setBuilderStart(null);
      setBuilderEnd(null);
    }
  }, [builderOp, selectedField]);

  const statusOptions: SelectOption[] = useMemo(
    () => [
      { value: "pending", label: "pending" },
      { value: "approved", label: "approved" },
      { value: "rejected", label: "rejected" },
    ],
    []
  );

  const boolOptions: SelectOption[] = useMemo(
    () => [
      { value: "true", label: "true" },
      { value: "false", label: "false" },
    ],
    []
  );

  function selectOptionsForField(fieldKey: string): SelectOption[] {
    if (fieldKey === "status") return statusOptions;
    if (fieldKey === "file_id") return fileOptions;
    if (fieldKey === "requested_by") return userOptions;
    if (fieldKey === "approved_by") return userOptions;
    if (fieldKey === "consent") return boolOptions;
    if (fieldKey === "field_key") return fieldList;

    if (fieldKey === "community") {
      const selected = builderOp === "IN" ? builderValues : builderValue ? [builderValue] : [];
      return mergeSelectedIntoOptions(communityOptions, selected);
    }

    if (fieldKey === "uploader_community") {
      const selected = builderOp === "IN" ? builderValues : builderValue ? [builderValue] : [];
      return mergeSelectedIntoOptions(uploaderCommunityOptions, selected);
    }

    return [];
  }

  const selectOptions = useMemo(() => {
    if (!selectedField || selectedField.type !== "select") return [];
    return selectOptionsForField(builderField);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedField, builderField, userOptions, fileOptions, communityOptions, fieldList]);

  function clearBuilder() {
    setBuilderField("");
    setBuilderOp("EQ");
    setBuilderValue("");
    setBuilderValues([]);
    setBuilderStart(null);
    setBuilderEnd(null);
    setEditingId(null);
  }

  function canAddOrUpdate(): boolean {
    if (!builderField || !selectedField) return false;

    if (selectedField.type === "date") {
      if (builderOp === "BETWEEN") return Boolean(builderStart && builderEnd);
      return true;
    }

    if (builderOp === "IN") return (builderValues || []).length > 0;
    return Boolean(builderValue);
  }

  function upsertClause() {
    if (!selectedField || !canAddOrUpdate()) return;

    const fieldType = selectedField.type;

    const updated: Partial<Clause> = {
      field: builderField,
      op: builderOp,
      value: undefined,
      values: undefined,
      start: undefined,
      end: undefined,
    };

    if (fieldType === "date") {
      if (builderOp === "BETWEEN") {
        updated.start = builderStart ? dayjs(builderStart).format("YYYY-MM-DD") : undefined;
        updated.end = builderEnd ? dayjs(builderEnd).format("YYYY-MM-DD") : undefined;
      }
    } else if (builderOp === "IN") {
      updated.values = builderValues;
    } else {
      updated.value = builderValue;
    }

    if (editingId) {
      setClauses((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...(updated as any) } : c)));
      clearBuilder();
      return;
    }

    const newClause: Clause = {
      id: uid(),
      joiner: clauses.length === 0 ? undefined : nextJoiner,
      field: builderField,
      op: builderOp,
      ...(updated as any),
    };

    setClauses((prev) => [...prev, newClause]);
    clearBuilder();
  }

  function deleteClause(id: string) {
    setClauses((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length > 0) next[0] = { ...next[0], joiner: undefined };
      return next;
    });
    if (editingId === id) clearBuilder();
  }

  function loadClauseIntoBuilder(c: Clause) {
    setBuilderField(c.field);
    setBuilderOp(c.op);

    const fieldType =
      [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS].find((f) => f.key === c.field)?.type ?? "text";

    if (fieldType === "date") {
      if (c.op === "BETWEEN") {
        setBuilderStart(c.start ? dayjs(c.start) : null);
        setBuilderEnd(c.end ? dayjs(c.end) : null);
      } else {
        setBuilderStart(null);
        setBuilderEnd(null);
      }
      setBuilderValue("");
      setBuilderValues([]);
      return;
    }

    if (c.op === "IN") {
      setBuilderValues(c.values || []);
      setBuilderValue("");
    } else {
      setBuilderValue(c.value || "");
      setBuilderValues([]);
    }
    setBuilderStart(null);
    setBuilderEnd(null);
  }

  const chipModels = useMemo(() => {
    function getFieldLabel(fieldKey: string) {
      return [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS].find((f) => f.key === fieldKey)?.label ?? fieldKey;
    }
    function getOpLabel(op: Operation, fieldType: FieldType) {
      return OPS_BY_TYPE[fieldType].find((x) => x.op === op)?.label ?? op;
    }
    function renderValueLabel(c: Clause): string {
      const field = [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS].find((f) => f.key === c.field) || null;
      const type = field?.type ?? "text";

      if (type === "date") {
        if (c.op === "BETWEEN") return `${c.start || ""} and ${c.end || ""}`.trim();
        return getOpLabel(c.op, "date");
      }

      if (c.op === "IN") {
        const opts = selectOptionsForField(c.field);
        const labels = (c.values || []).map((v) => opts.find((o) => o.value === v)?.label ?? v);
        return labels.join(", ");
      }

      if (type === "select") {
        const opts = selectOptionsForField(c.field);
        return opts.find((o) => o.value === c.value)?.label ?? (c.value || "");
      }

      return c.value || "";
    }

    return clauses.map((c) => {
      const fieldType = [...COMMON_FIELDS, ...FILE_CONTENT_FIELDS].find((f) => f.key === c.field)?.type ?? "text";
      const fieldLabel = getFieldLabel(c.field);
      const opLabel = getOpLabel(c.op, fieldType);
      const valueLabel = renderValueLabel(c);
      const join = c.joiner ? `${c.joiner} ` : "";

      const label =
        fieldType === "date"
          ? `${join}${fieldLabel} ${valueLabel}`
          : `${join}${fieldLabel} ${opLabel} ${valueLabel}`;

      return { clause: c, label };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clauses, userOptions, fileOptions, communityOptions, uploaderCommunityOptions, fieldList, builderOp, builderValue, builderValues]);

  const handleApplyClick = () => {
    onApply();
    setFiltersCollapsed(true);
  };

  const handleResetClick = () => {
    clearBuilder();
    setFiltersCollapsed(false);
    onReset();
  };

  // -------------------- UI --------------------
  if (filtersCollapsed) {
    return (
      <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Chip
            icon={<TuneIcon />}
            label={`Search (${filterSummary[0]})`}
            size="small"
            sx={{ fontWeight: 900, borderRadius: "10px", background: color_white, border: `1px solid ${color_border}`, color: color_text_primary }}
          />

          {chipModels.slice(0, 2).map(({ clause, label }) => (
            <Chip
              key={clause.id}
              label={label}
              onClick={() => {
                setEditingId(clause.id);
                loadClauseIntoBuilder(clause);
                setFiltersCollapsed(false);
              }}
              onDelete={() => deleteClause(clause.id)}
              deleteIcon={<DeleteIcon />}
              size="small"
              sx={{
                fontWeight: 800,
                borderRadius: "10px",
                background: color_white,
                border: `1px solid ${color_border}`,
                maxWidth: 520,
                "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", maxWidth: 440 },
              }}
            />
          ))}

          {chipModels.length > 2 && (
            <Chip
              label={`+${chipModels.length - 2} more`}
              size="small"
              sx={{ fontWeight: 800, borderRadius: "10px", background: color_white, border: `1px solid ${color_border}`, color: color_text_secondary }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <ToggleButtonGroup
            value="ADMIN_EDIT_REQUESTS"
            exclusive
            onChange={(_, v) => v && onModeSwitchToGeneral(v)}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 900,
                borderRadius: "10px",
                px: 1.2,
                py: 0.6,
                background: color_white,
                border: `1px solid ${color_border}`,
              },
            }}
          >
            <ToggleButton value="GENERAL">
              <DashboardIcon sx={{ fontSize: 18, mr: 0.75 }} />
              General
            </ToggleButton>
          </ToggleButtonGroup>

          <Button onClick={() => setFiltersCollapsed(false)} sx={primaryBtnSx}>
            Edit search
          </Button>

          <Button variant="contained" onClick={handleApplyClick} sx={primaryBtnSx}>
            Apply
          </Button>

          <Button onClick={handleResetClick} sx={secondaryBtnSx}>
            Reset
          </Button>
        </Box>
      </Box>
    );
  }

  // Expanded builder
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        gap: 1,
        flexWrap: "wrap",
        alignItems: "center",
        background: color_white_smoke,
        border: `1px solid ${color_border}`,
        padding: "8px 10px",
        borderRadius: "12px",
      }}
    >
      {/* Chips preview */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Chip
          icon={<TuneIcon />}
          label={filterSummary[0]}
          size="small"
          sx={{ fontWeight: 900, borderRadius: "10px", background: color_white, border: `1px solid ${color_border}`, color: color_text_primary }}
        />

        {chipModels.slice(0, 5).map(({ clause, label }) => (
          <Chip
            key={clause.id}
            label={label}
            onClick={() => {
              setEditingId(clause.id);
              loadClauseIntoBuilder(clause);
            }}
            onDelete={() => deleteClause(clause.id)}
            deleteIcon={<DeleteIcon />}
            size="small"
            sx={{
              fontWeight: 800,
              borderRadius: "10px",
              background: color_white,
              border: `1px solid ${color_border}`,
              maxWidth: 520,
              "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", maxWidth: 440 },
            }}
          />
        ))}

        {chipModels.length > 5 && (
          <Chip
            label={`+${chipModels.length - 5} more`}
            size="small"
            sx={{ fontWeight: 800, borderRadius: "10px", background: color_white, border: `1px solid ${color_border}`, color: color_text_secondary }}
          />
        )}
      </Box>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.25, borderColor: color_border }} />

      {/* Joiner */}
      {clauses.length > 0 && !editingId && (
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>Join</InputLabel>
          <Select label="Join" value={nextJoiner} onChange={(e) => setNextJoiner(e.target.value as Joiner)}>
            <MenuItem value="AND">AND</MenuItem>
            <MenuItem value="OR">OR</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Field */}
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel>Field</InputLabel>
        <Select label="Field" value={builderField} onChange={(e) => setBuilderField(String(e.target.value))}>
          <MenuItem value="">Select field</MenuItem>
          {availableFields.map((f) => (
            <MenuItem key={f.key} value={f.key}>
              {f.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Op */}
      <FormControl size="small" sx={{ minWidth: 190 }} disabled={!selectedField}>
        <InputLabel>Op</InputLabel>
        <Select label="Op" value={builderOp} onChange={(e) => setBuilderOp(e.target.value as Operation)}>
          {opOptions.map((o) => (
            <MenuItem key={o.op} value={o.op}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Value */}
      {selectedField ? (
        selectedField.type === "date" ? (
          builderOp === "BETWEEN" ? (
            <>
              <DatePicker
                label="Start"
                value={builderStart}
                onChange={(val) => setBuilderStart(val)}
                slotProps={{ textField: { size: "small" } }}
              />
              <DatePicker
                label="End"
                value={builderEnd}
                onChange={(val) => setBuilderEnd(val)}
                slotProps={{ textField: { size: "small" } }}
              />
            </>
          ) : (
            <Chip
              label="No date input needed"
              size="small"
              sx={{ fontWeight: 900, borderRadius: "10px", background: color_white, border: `1px solid ${color_border}`, color: color_text_secondary }}
            />
          )
        ) : selectedField.type === "select" ? (
          builderOp === "IN" ? (
            <Autocomplete
              multiple
              freeSolo
              options={selectOptions}
              value={(builderValues || []).map((v) => selectOptions.find((o) => o.value === v) ?? ({ value: v, label: v } as any))}
              onChange={(_, vals) => {
                const next = (vals || []).map((x: any) => (typeof x === "string" ? x : x.value));
                setBuilderValues(next);
              }}
              disableCloseOnSelect
              filterSelectedOptions
              ListboxProps={{ style: { maxHeight: 320, overflow: "auto" } }}
              renderInput={(params) => <TextField {...params} size="small" label="Values" sx={{ minWidth: 320 }} />}
            />
          ) : (
            <Autocomplete
              freeSolo
              options={selectOptions}
              value={
                selectOptions.find((o) => o.value === builderValue) ??
                (builderValue ? ({ value: builderValue, label: builderValue } as any) : null)
              }
              onChange={(_, val: any) => setBuilderValue(val ? (typeof val === "string" ? val : val.value) : "")}
              ListboxProps={{ style: { maxHeight: 320, overflow: "auto" } }}
              renderInput={(params) => <TextField {...params} size="small" label="Value" sx={{ minWidth: 320 }} />}
            />
          )
        ) : (
          <TextField size="small" label="Value" value={builderValue} onChange={(e) => setBuilderValue(e.target.value)} sx={{ minWidth: 260 }} />
        )
      ) : (
        <TextField size="small" label="Value" value={builderValue} disabled sx={{ minWidth: 260 }} />
      )}

      {/* Add / Update */}
      <Tooltip title={editingId ? "Update filter" : "Add filter"}>
        <span>
          <Button startIcon={<AddIcon />} variant="contained" onClick={upsertClause} disabled={!canAddOrUpdate()} sx={primaryBtnSx}>
            {editingId ? "Update" : "Add"}
          </Button>
        </span>
      </Tooltip>

      {editingId && (
        <Button onClick={clearBuilder} sx={secondaryBtnSx}>
          Cancel edit
        </Button>
      )}

      <Divider flexItem orientation="vertical" sx={{ mx: 0.25, borderColor: color_border }} />

      <ToggleButtonGroup
        value="ADMIN_EDIT_REQUESTS"
        exclusive
        onChange={(_, v) => v && onModeSwitchToGeneral(v)}
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            px: 1.2,
            py: 0.6,
            background: color_white,
            border: `1px solid ${color_border}`,
          },
        }}
      >
        <ToggleButton value="GENERAL">
          <DashboardIcon sx={{ fontSize: 18, mr: 0.75 }} />
          General
        </ToggleButton>
      </ToggleButtonGroup>

      <Button variant="contained" onClick={handleApplyClick} sx={primaryBtnSx}>
        Apply
      </Button>

      <Button onClick={handleResetClick} sx={secondaryBtnSx}>
        Reset
      </Button>

      <IconButton onClick={() => setFiltersCollapsed(true)} size="small" sx={{ ml: "auto" }} title="Collapse filters">
        <ExpandLessIcon />
      </IconButton>
    </Box>
  );
}
