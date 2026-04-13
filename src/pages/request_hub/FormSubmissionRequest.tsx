"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip } from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
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

import { FORM_SUBMISSION_STATUS_OPTIONS } from "../../domain/forms/statusOptions";

import ConfigFormModal from "../../components/datatable/config-form-modal.tsx/ConfigFormModal";
import { FormCfg } from "../../components/datatable/config-form-modal.tsx/shared";
import FormSubmissionGrid, { FormSubmissionRow } from "../../components/tables/FormSubmissionGrid";

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

export default function FormSubmissionRequests() {
  const [rows, setRows] = useState<FormSubmissionRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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

  const reviewRequiredStatuses = useMemo(
    () =>
      FORM_SUBMISSION_STATUS_OPTIONS
        .filter((item) => item.reviewed_needed)
        .map((item) => item.value),
    []
  );

  const {
    loading: searchLoading,
    fetchData: fetchSubmissions,
    data: searchResp,
  } = useFetch(`${API_BASE}/form/search`, "POST", false);

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

  const fetchPage = useCallback(
    (page: number) => {
      fetchSubmissions({
        page,
        page_size: 20,
        status: reviewRequiredStatuses,
      });
    },
    [fetchSubmissions, reviewRequiredStatuses]
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    if (!searchResp) return;

    const resp = searchResp as SearchResp;

    setRows(resp.items || []);
    setCurrentPage(resp.page || 1);
    setTotalPages(resp.total_pages || 1);
    setTotalItems(resp.total_items || 0);
  }, [searchResp]);

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
      [configJson?.addInfo?.firstname]: pendingDetailsRow.first_name,
      [configJson?.addInfo?.lastname]: pendingDetailsRow.last_name,
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

  const handleCloseConfigModal = () => {
    setCfgFormOpen(false);
    setActiveFormCfg(null);
    setActiveFormRow(null);
    setActiveAddInfoConfig(null);
    setActiveFileForModal(null);
    setActiveFetchSubmissionId(null);

    fetchPage(currentPage);
  };

  return (
    <>
      <Loader loading={searchLoading || configLoading} />

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
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            background: color_white_smoke,
            border: `1px solid ${color_border}`,
            borderRadius: "12px",
            px: 1.25,
            py: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
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

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => fetchPage(currentPage)}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
              background: color_secondary,
              "&:hover": { background: color_secondary_dark },
            }}
          >
            Refresh
          </Button>
        </Box>

        <FormSubmissionGrid
          title="Form Submission Review Requests"
          rows={rows}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => fetchPage(currentPage - 1)}
          onNext={() => fetchPage(currentPage + 1)}
          onOpenDetails={handleOpenDetails}
          showCreatedByColumn={true}
          actionLabel="View / Review"
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
            isEditable={true}
            review={true}
            reviewPath="/form/answers/review"
            reviewStatuses={{
              approved: "approved",
              rejected: "rejected",
              moreInfo: "needs more information",
            }}
          />
        )}
      </Box>
    </>
  );
}
