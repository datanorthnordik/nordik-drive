"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { API_BASE } from "../../constants/constants";
import {
  color_secondary,
  color_secondary_dark,
  color_border,
  color_background,
  color_text_primary,
  color_text_light,
  color_white,
  color_warning,
} from "../../constants/colors";

import ConfigFormModal from "../../components/datatable/config-form-modal.tsx/ConfigFormModal";
import { FormCfg } from "../../components/datatable/config-form-modal.tsx/shared";
import type { FormSubmissionRow } from "../../components/tables/FormSubmissionGrid";

type SearchResp = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  items: FormSubmissionRow[];
};

type ConfigJson = {
  columns?: any[];
  addInfo?: any;
};

type ConfigApiResp = {
  config?: ConfigJson;
};

type TabKey = "pending" | "approved";

const REQUEST_PAGE_SIZE = 1000;

const normalizeStatus = (status?: string) => String(status || "").trim().toLowerCase();

const isReadonlyStatus = (status?: string) => {
  const normalized = normalizeStatus(status);
  return normalized === "approved" || normalized === "rejected";
};

const statusChipSx = (status?: string) => {
  const normalized = normalizeStatus(status);

  if (normalized === "approved") {
    return {
      label: "Approved",
      sx: {
        backgroundColor: "rgba(39, 174, 96, 0.12)",
        border: "1px solid rgba(39, 174, 96, 0.25)",
        color: "#166534",
      },
    };
  }

  if (normalized === "pending") {
    return {
      label: "Pending review",
      sx: {
        backgroundColor: "rgba(243, 156, 18, 0.14)",
        border: "1px solid rgba(243, 156, 18, 0.25)",
        color: color_text_primary,
      },
    };
  }

  if (normalized === "needs more information") {
    return {
      label: "Needs more information",
      sx: {
        backgroundColor: "rgba(52, 152, 219, 0.12)",
        border: "1px solid rgba(52, 152, 219, 0.24)",
        color: "#1d4ed8",
      },
    };
  }

  if (normalized === "rejected") {
    return {
      label: "Rejected",
      sx: {
        backgroundColor: "rgba(107, 114, 128, 0.12)",
        border: "1px solid rgba(107, 114, 128, 0.25)",
        color: color_text_primary,
      },
    };
  }

  return {
    label: status || "Unknown",
    sx: {
      backgroundColor: "rgba(107, 114, 128, 0.12)",
      border: "1px solid rgba(107, 114, 128, 0.25)",
      color: color_text_light,
    },
  };
};

const formatWhen = (iso?: string) => {
  if (!iso) return "-";
  return String(iso).replace("T", " ").replace("Z", "");
};

const getRowKey = (row: FormSubmissionRow) =>
  String(row.row_id || row.id || row.file_id || `${row.form_key}-${row.file_name}`);

export default function MyFormSubmissionRequests() {
  const [rows, setRows] = useState<FormSubmissionRow[]>([]);
  const [tab, setTab] = useState<TabKey>("pending");
  const [searchText, setSearchText] = useState("");

  const [cfgFormOpen, setCfgFormOpen] = useState(false);
  const [activeFormCfg, setActiveFormCfg] = useState<FormCfg | null>(null);
  const [activeFormRow, setActiveFormRow] = useState<any>(null);
  const [activeAddInfoConfig, setActiveAddInfoConfig] = useState<any>(null);
  const [activeFileForModal, setActiveFileForModal] = useState<any>(null);
  const [activeFetchSubmissionId, setActiveFetchSubmissionId] = useState<number | string | null>(
    null
  );
  const [activeFormEditable, setActiveFormEditable] = useState(true);

  const [pendingDetailsRow, setPendingDetailsRow] = useState<FormSubmissionRow | null>(null);
  const [configFileNameToLoad, setConfigFileNameToLoad] = useState("");

  const {
    loading: searchLoading,
    fetchData: fetchSubmissions,
    data: searchResp,
  } = useFetch(`${API_BASE}/form/my-requests`, "POST", false);

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

  const fetchRequests = useCallback(() => {
    fetchSubmissions({
      page: 1,
      page_size: REQUEST_PAGE_SIZE,
    });
  }, [fetchSubmissions]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!searchResp) return;

    const resp = searchResp as SearchResp;
    setRows(Array.isArray(resp.items) ? resp.items : []);
  }, [searchResp]);

  const handleOpenDetails = useCallback((row: FormSubmissionRow) => {
    setCfgFormOpen(false);
    setActiveFormCfg(null);
    setActiveFormRow(null);
    setActiveAddInfoConfig(null);
    setActiveFileForModal(null);
    setActiveFetchSubmissionId(null);
    setActiveFormEditable(!isReadonlyStatus(row.status));

    setPendingDetailsRow(row);
    setConfigFileNameToLoad(row.file_name || "");
  }, []);

  useEffect(() => {
    if (!pendingDetailsRow || !configFileNameToLoad) return;
    fetchConfig();
  }, [pendingDetailsRow, configFileNameToLoad, fetchConfig]);

  useEffect(() => {
    if (!pendingDetailsRow || !configResp) return;

    const detailsRow = pendingDetailsRow;
    const config = ((configResp as ConfigApiResp | undefined)?.config ?? null) as ConfigJson | null;
    const columnsSource = config?.columns;
    const columns: any[] = Array.isArray(columnsSource) ? columnsSource : [];
    const addInfoConfig = config?.addInfo ?? null;

    const matchedFormCfg = columns.find((col: any) => {
      if (col?.type !== "form") return false;
      return String(col?.key || "").trim() === String(detailsRow.form_key || "").trim();
    }) as FormCfg | undefined;

    if (!matchedFormCfg) {
      console.error("No matching form config found for form_key:", detailsRow.form_key);
      setPendingDetailsRow(null);
      setConfigFileNameToLoad("");
      return;
    }

    const nextActiveFormRow: Record<string, any> = {
      ...detailsRow,
      id: detailsRow.row_id,
    };

    const firstNameKey =
      typeof addInfoConfig?.firstname === "string" ? addInfoConfig.firstname : "";
    const lastNameKey =
      typeof addInfoConfig?.lastname === "string" ? addInfoConfig.lastname : "";

    if (firstNameKey) {
      nextActiveFormRow[firstNameKey] = detailsRow.first_name;
    }

    if (lastNameKey) {
      nextActiveFormRow[lastNameKey] = detailsRow.last_name;
    }

    setActiveFormRow(nextActiveFormRow);

    setActiveFileForModal({
      id: detailsRow.file_id,
      filename: detailsRow.file_name,
    });

    setActiveFetchSubmissionId(detailsRow.id ?? null);
    setActiveAddInfoConfig(addInfoConfig);
    setActiveFormCfg(matchedFormCfg);
    setCfgFormOpen(true);

    setPendingDetailsRow(null);
    setConfigFileNameToLoad("");
  }, [configResp, pendingDetailsRow]);

  const handleCloseConfigModal = () => {
    setCfgFormOpen(false);
    setActiveFormCfg(null);
    setActiveFormRow(null);
    setActiveAddInfoConfig(null);
    setActiveFileForModal(null);
    setActiveFetchSubmissionId(null);
    setActiveFormEditable(true);
    fetchRequests();
  };

  const pendingRows = useMemo(
    () => rows.filter((row) => !isReadonlyStatus(row.status)),
    [rows]
  );

  const approvedRejectedRows = useMemo(
    () => rows.filter((row) => isReadonlyStatus(row.status)),
    [rows]
  );

  const activeList = tab === "pending" ? pendingRows : approvedRejectedRows;

  const filteredRows = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    if (!search) return activeList;

    return activeList.filter((row) => {
      const haystack = [
        row.file_name,
        row.form_label,
        row.form_key,
        row.first_name,
        row.last_name,
        String(row.row_id || ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [activeList, searchText]);

  return (
    <>
      <Loader loading={searchLoading || configLoading} />

      <Box
        sx={{
          height: "100%",
          minHeight: 0,
          p: { xs: 1, md: 1.25 },
          boxSizing: "border-box",
          overflow: "hidden",
          backgroundColor: color_background,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            borderRadius: "12px",
            border: `1px solid ${color_border}`,
            overflow: "hidden",
            backgroundColor: color_white,
          }}
        >
          <Box
            sx={{
              px: { xs: 1.75, md: 2.25 },
              py: 1.5,
              display: "flex",
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              gap: 1.5,
              borderBottom: `1px solid ${color_border}`,
              backgroundColor: color_white,
              flexShrink: 0,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 900, color: color_secondary, fontSize: "1rem" }}>
                My Form Submission Requests
              </Typography>
              <Typography
                sx={{
                  mt: 0.25,
                  color: color_text_light,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                Track submitted forms and reviewer updates.
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search by file, form, or submission id..."
              value={searchText}
              data-testid="search-input"
              onChange={(e) => setSearchText(e.target.value)}
              sx={{
                width: { xs: "100%", sm: 360 },
                "& .MuiOutlinedInput-root": {
                  height: 36,
                  borderRadius: "10px",
                  backgroundColor: color_background,
                  fontSize: "0.82rem",
                  color: color_text_primary,
                },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: color_border },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: color_secondary,
                  borderWidth: 2,
                },
                "& input::placeholder": { color: color_text_light, opacity: 1 },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ fontSize: 18, color: color_text_light }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ px: { xs: 1.25, md: 2.25 }, pt: 1, background: color_white, flexShrink: 0 }}>
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              data-testid="my-form-submission-tabs"
              sx={{
                minHeight: 44,
                "& .MuiTab-root": {
                  minHeight: 44,
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: 2,
                  mr: 1,
                  color: color_text_light,
                  border: `1px solid ${color_border}`,
                },
                "& .Mui-selected": {
                  color: color_white,
                  backgroundColor: tab === "pending" ? color_warning : color_secondary,
                  border: "none",
                },
                "& .MuiTabs-indicator": { display: "none" },
              }}
            >
              <Tab
                data-testid="tab-pending"
                value="pending"
                label={`Pending / Need More Information (${pendingRows.length})`}
              />
              <Tab
                data-testid="tab-approved"
                value="approved"
                label={`Approved / Rejected (${approvedRejectedRows.length})`}
              />
            </Tabs>

            <Divider sx={{ mt: 1, borderColor: color_border }} />
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              p: { xs: 1.25, md: 2.25 },
              backgroundColor: color_background,
            }}
          >
            {filteredRows.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px dashed ${color_border}`,
                  backgroundColor: color_white,
                }}
              >
                <Typography sx={{ fontWeight: 900, color: color_text_primary }}>
                  {tab === "pending"
                    ? "No pending or needs more information requests."
                    : "No approved or rejected requests."}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    color: color_text_light,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  If you recently submitted a form, refresh in a moment.
                </Typography>
                <Button
                  onClick={fetchRequests}
                  variant="contained"
                  data-testid="refresh-btn"
                  sx={{
                    mt: 1.5,
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 2,
                    backgroundColor: color_secondary,
                    "&:hover": { backgroundColor: color_secondary_dark },
                  }}
                >
                  Refresh
                </Button>
              </Paper>
            ) : (
              <Stack spacing={1.25}>
                {filteredRows.map((row) => {
                  const chip = statusChipSx(row.status);
                  const rowKey = getRowKey(row);
                  const canEdit = !isReadonlyStatus(row.status);

                  return (
                    <Paper
                      key={rowKey}
                      data-testid={`submission-row-${rowKey}`}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${color_border}`,
                        backgroundColor: color_white,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 900,
                              color: color_text_primary,
                              fontSize: "0.95rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "65vw",
                            }}
                            title={row.file_name || "-"}
                          >
                            {row.file_name || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.25,
                              color: color_text_light,
                              fontWeight: 800,
                              fontSize: "0.8rem",
                            }}
                          >
                            Submission #{row.row_id || "-"} - {row.form_label || row.form_key || "-"}{" "}
                            - {row.first_name || "-"} {row.last_name || "-"} - Updated{" "}
                            {formatWhen(row.updated_at || row.created_at)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Chip
                            data-testid={`status-chip-${rowKey}`}
                            label={chip.label}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: "0.72rem",
                              fontWeight: 900,
                              borderRadius: "999px",
                              ...chip.sx,
                            }}
                          />
                          <Button
                            data-testid={`details-btn-${rowKey}`}
                            onClick={() => handleOpenDetails(row)}
                            variant="contained"
                            sx={{
                              textTransform: "none",
                              fontWeight: 900,
                              borderRadius: 2,
                              backgroundColor: color_secondary,
                              "&:hover": { backgroundColor: color_secondary_dark },
                            }}
                          >
                            {canEdit ? "Edit Form" : "View Form"}
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Paper>

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
            isEditable={activeFormEditable}
            showUploadReviewerComments={true}
          />
        )}
      </Box>
    </>
  );
}
