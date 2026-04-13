"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  TextField,
} from "@mui/material";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TuneIcon from "@mui/icons-material/Tune";

import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import { API_BASE } from "../../config/api";
import {
  color_secondary,
  color_secondary_dark,
  color_border,
  color_white,
  color_white_smoke,
  color_text_primary,
  color_text_secondary,
  color_background,
} from "../../constants/colors";

import ConfigFormModal from "../datatable/config-form-modal.tsx/ConfigFormModal";
import { FormCfg } from "../datatable/config-form-modal.tsx/shared";
import FormSubmissionGrid, { FormSubmissionRow } from "./FormSubmissionGrid";
import { FORM_SUBMISSION_STATUS_OPTIONS } from "../../domain/forms/statusOptions";

type FileWithUser = {
  id: number;
  filename: string;
};

type FilesResp = {
  message?: string;
  files?: FileWithUser[];
};

type SearchResp = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  items: FormSubmissionRow[];
};

type SelectOption = {
  id: string;
  label: string;
};

type FormOption = {
  key: string;
  label: string;
};

type StatusOption = {
  value: string;
  label: string;
};

type FormFileMappingItem = {
  id: number;
  file_name: string;
  file_id: number;
  form_key: string;
  form_name: string;
};

type ConfigJson = {
  columns?: any[];
  addInfo?: any;
};

type ConfigApiResp = {
  config?: ConfigJson;
};

export default function FormSubmissionLogs() {
  const [showFilters, setShowFilters] = useState(true);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  const [selectedFile, setSelectedFile] = useState<SelectOption | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormOption | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<StatusOption[]>([]);

  const [rows, setRows] = useState<FormSubmissionRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOptionsFromApi, setFormOptionsFromApi] = useState<FormOption[]>([]);

  const [cfgFormOpen, setCfgFormOpen] = useState(false);
  const [activeFormCfg, setActiveFormCfg] = useState<FormCfg | null>(null);
  const [activeFormRow, setActiveFormRow] = useState<any>(null);
  const [activeAddInfoConfig, setActiveAddInfoConfig] = useState<any>(null);
  const [activeFileForModal, setActiveFileForModal] = useState<any>(null);
  const [activeFetchSubmissionId, setActiveFetchSubmissionId] = useState<number | string | null>(
    null
  );
  const [pendingDetailsRow, setPendingDetailsRow] = useState<FormSubmissionRow | null>(null);
  const [configFileNameToLoad, setConfigFileNameToLoad] = useState("");

  const appliedRef = useRef<Record<string, any>>({});

  const {
    loading: searchLoading,
    fetchData: fetchSubmissions,
    data: searchResp,
  } = useFetch(`${API_BASE}/form/search`, "POST", false);

  const {
    loading: filesLoading,
    fetchData: fetchFiles,
    data: filesResp,
  } = useFetch(`${API_BASE}/file`, "GET", false);

  const {
    loading: formsLoading,
    fetchData: fetchForms,
    data: formsResp,
  } = useFetch(
    selectedFile
      ? `${API_BASE}/form?file_id=${selectedFile.id}`
      : `${API_BASE}/form`,
    "GET",
    false
  );

  const {
    loading: configLoading,
    fetchData: fetchConfig,
    data: configResp,
  } = useFetch(
    configFileNameToLoad
      ? `${API_BASE}/config?file_name=${encodeURIComponent(configFileNameToLoad)}`
      : `${API_BASE}/config`,
    "GET",
    false
  );

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const fileOptions = useMemo<SelectOption[]>(() => {
    const resp = filesResp as FilesResp | undefined;
    const files = resp?.files ?? [];

    return files
      .map((f) => ({
        id: String(f.id),
        label: f.filename,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filesResp]);

  useEffect(() => {
    setSelectedForm(null);
    setFormOptionsFromApi([]);

    if (!selectedFile) return;

    fetchForms();
  }, [selectedFile, fetchForms]);

  useEffect(() => {
    const items = Array.isArray(formsResp) ? (formsResp as FormFileMappingItem[]) : [];

    const mapped = items
      .map((item) => ({
        key: item.form_key,
        label: item.form_name || item.form_key,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    setFormOptionsFromApi(mapped);
  }, [formsResp]);

  const handleOpenDetails = useCallback((row: FormSubmissionRow) => {
    setCfgFormOpen(false);
    setActiveFormCfg(null);
    setActiveFormRow(null);
    setActiveAddInfoConfig(null);
    setActiveFileForModal(null);
    setActiveFetchSubmissionId(null);

    setPendingDetailsRow(row);
    setConfigFileNameToLoad(row.file_name || "");
  }, []);

  useEffect(() => {
    if (!pendingDetailsRow || !configFileNameToLoad) return;
    fetchConfig();
  }, [pendingDetailsRow, configFileNameToLoad, fetchConfig]);

  useEffect(() => {
    if (!pendingDetailsRow || !configResp) return;

    const configJson = ((configResp as ConfigApiResp | undefined)?.config ?? null) as ConfigJson | null;
    const columns = Array.isArray(configJson?.columns) ? configJson?.columns : [];

    const matchedFormCfg = columns?.find((col: any) => {
      if (col?.type !== "form") return false;
      return String(col?.key || "").trim() === String(pendingDetailsRow.form_key || "").trim();
    }) as FormCfg | undefined;

    if (!matchedFormCfg) {
      console.error("No matching form config found for form_key:", pendingDetailsRow.form_key);
      setPendingDetailsRow(null);
      setConfigFileNameToLoad("");
      return;
    }

    setActiveFormRow({
      ...pendingDetailsRow,
      id: pendingDetailsRow.row_id,
    });

    setActiveFileForModal({
      id: pendingDetailsRow.file_id,
      filename: pendingDetailsRow.file_name,
    });

    setActiveFetchSubmissionId(pendingDetailsRow.id ?? null);
    setActiveAddInfoConfig(configJson?.addInfo ?? null);
    setActiveFormCfg(matchedFormCfg);
    setCfgFormOpen(true);

    setPendingDetailsRow(null);
    setConfigFileNameToLoad("");
  }, [configResp, pendingDetailsRow]);

  const fetchPage = useCallback(
    (page: number) => {
      fetchSubmissions({
        page,
        page_size: 20,
        ...appliedRef.current,
      });
    },
    [fetchSubmissions]
  );

  useEffect(() => {
    appliedRef.current = {};
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    if (!searchResp) return;

    const resp = searchResp as SearchResp;
    setRows(resp.items || []);
    setCurrentPage(resp.page || 1);
    setTotalPages(resp.total_pages || 1);

    if (!hasSearchedOnce) {
      setHasSearchedOnce(true);
      setShowFilters(false);
    }
  }, [searchResp, hasSearchedOnce]);

  const handleApply = () => {
    const body: Record<string, any> = {};

    if (selectedFile) body.file_id = Number(selectedFile.id);
    if (selectedForm?.key) body.form_key = selectedForm.key;
    if (firstName.trim()) body.first_name = firstName.trim();
    if (lastName.trim()) body.last_name = lastName.trim();
    if (selectedStatuses.length > 0) body.status = selectedStatuses.map((s) => s.value);

    appliedRef.current = body;
    fetchPage(1);
    setShowFilters(false);
    setHasSearchedOnce(true);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedForm(null);
    setFirstName("");
    setLastName("");
    setSelectedStatuses([]);
    setFormOptionsFromApi([]);

    appliedRef.current = {};
    fetchPage(1);
  };

  const handleCloseConfigModal = () => {
    setCfgFormOpen(false);
    setActiveFormCfg(null);
    setActiveFormRow(null);
    setActiveAddInfoConfig(null);
    setActiveFileForModal(null);
    setActiveFetchSubmissionId(null);
  };

  const filterSummary = useMemo(() => {
    const chips: string[] = [];

    if (selectedFile) chips.push(`File: ${selectedFile.label}`);
    if (selectedForm) chips.push(`Form type: ${selectedForm.label}`);
    if (firstName.trim()) chips.push(`First name: ${firstName.trim()}`);
    if (lastName.trim()) chips.push(`Last name: ${lastName.trim()}`);
    if (selectedStatuses.length > 0) {
      chips.push(`Status: ${selectedStatuses.map((s) => s.label).join(", ")}`);
    }

    return chips;
  }, [selectedFile, selectedForm, firstName, lastName, selectedStatuses]);

  return (
    <>
      <Loader loading={searchLoading || filesLoading || formsLoading || configLoading} />

      <Box
        sx={{
          height: "100%",
          p: { xs: 1, md: 1.25 },
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          gap: 1,
          background: color_background,
        }}
      >
        {!showFilters ? (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Chip
                icon={<TuneIcon />}
                label={`Search (${filterSummary.length} filter${filterSummary.length === 1 ? "" : "s"})`}
                size="small"
                sx={{
                  fontWeight: 900,
                  borderRadius: "10px",
                  background: color_white,
                  border: `1px solid ${color_border}`,
                  color: color_text_primary,
                }}
              />

              {filterSummary.slice(0, 2).map((item) => (
                <Chip
                  key={item}
                  label={item}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    borderRadius: "10px",
                    background: color_white,
                    border: `1px solid ${color_border}`,
                    color: color_text_primary,
                  }}
                />
              ))}

              {filterSummary.length > 2 && (
                <Chip
                  label={`+${filterSummary.length - 2} more`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    borderRadius: "10px",
                    background: color_white,
                    border: `1px solid ${color_border}`,
                    color: color_text_secondary,
                  }}
                />
              )}
            </Box>

            <Button
              variant="contained"
              onClick={() => setShowFilters(true)}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                borderRadius: "10px",
                background: color_secondary,
                "&:hover": { background: color_secondary_dark },
              }}
            >
              Edit search
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "minmax(0, 1fr) auto",
              },
              gap: 1,
              alignItems: "start",
              background: color_white_smoke,
              border: `1px solid ${color_border}`,
              padding: "8px 10px",
              borderRadius: "12px",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3, minmax(200px, 1fr))",
                  lg: "repeat(5, minmax(200px, 1fr))",
                },
                gap: 1,
                minWidth: 0,
                "& .MuiAutocomplete-root, & .MuiTextField-root": {
                  width: "100%",
                  minWidth: 0,
                },
              }}
            >
              <Autocomplete
                size="small"
                options={fileOptions}
                value={selectedFile}
                onChange={(_, value) => {
                  setSelectedFile(value);
                }}
                loading={filesLoading}
                disablePortal
                clearOnEscape
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option?.label || ""}
                noOptionsText="No files found"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="File"
                    placeholder="Search file"
                  />
                )}
              />

              <Autocomplete
                size="small"
                options={formOptionsFromApi}
                value={selectedForm}
                onChange={(_, value) => setSelectedForm(value)}
                loading={formsLoading}
                disablePortal
                clearOnEscape
                disabled={!selectedFile}
                isOptionEqualToValue={(option, value) => option.key === value.key}
                getOptionLabel={(option) => option?.label || ""}
                noOptionsText={selectedFile ? "No forms found" : "Select file first"}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Form Type"
                    placeholder={selectedFile ? "Select form" : "Select file first"}
                  />
                )}
              />

              <TextField
                fullWidth
                size="small"
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <TextField
                fullWidth
                size="small"
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <Autocomplete
                multiple
                size="small"
                options={FORM_SUBMISSION_STATUS_OPTIONS}
                value={selectedStatuses}
                onChange={(_, value) => setSelectedStatuses(value)}
                disablePortal
                disableCloseOnSelect
                clearOnEscape
                isOptionEqualToValue={(option, value) => option.value === value.value}
                getOptionLabel={(option) => option?.label || ""}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.value}
                      label={option.label}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Status"
                    placeholder={selectedStatuses.length > 0 ? "" : "Select status"}
                  />
                )}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexShrink: 0,
                justifyContent: { xs: "flex-end", xl: "flex-start" },
                width: { xs: "100%", xl: "auto" },
              }}
            >
              <Divider
                flexItem
                orientation="vertical"
                sx={{
                  display: { xs: "none", xl: "block" },
                  mx: 0.25,
                  borderColor: color_border,
                }}
              />

              <Button
                variant="contained"
                onClick={handleApply}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: "10px",
                  background: color_secondary,
                  minWidth: 100,
                  "&:hover": { background: color_secondary_dark },
                }}
              >
                Apply
              </Button>

              <Button
                onClick={handleReset}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: "10px",
                  backgroundColor: color_white,
                  border: `1px solid ${color_border}`,
                  color: color_text_primary,
                  minWidth: 100,
                  "&:hover": { backgroundColor: color_white_smoke },
                }}
              >
                Reset
              </Button>

              <IconButton
                onClick={() => setShowFilters(false)}
                size="small"
                title="Collapse filters"
              >
                <ExpandLessIcon />
              </IconButton>
            </Box>
          </Box>
        )}

        <FormSubmissionGrid
          title="Form Submission Logs"
          rows={rows}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => fetchPage(currentPage - 1)}
          onNext={() => fetchPage(currentPage + 1)}
          onOpenDetails={handleOpenDetails}
          showCreatedByColumn={true}
          actionLabel="View Details"
        />

        {cfgFormOpen && activeFormCfg && (
          <ConfigFormModal
            open={cfgFormOpen}
            onClose={handleCloseConfigModal}
            row={activeFormRow}
            file={activeFileForModal}
            formConfig={activeFormCfg}
            apiBase={API_BASE}
            addInfoConfig={activeAddInfoConfig}
            fetchPath="/form/answers"
            fetchSubmissionId={activeFetchSubmissionId}
            savePath="/form/answers"
            isEditable={false}
          />
        )}
      </Box>
    </>
  );
}
