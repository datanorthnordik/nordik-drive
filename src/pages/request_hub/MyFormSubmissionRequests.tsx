"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";

import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { API_BASE } from "../../constants/constants";
import { color_background } from "../../constants/colors";

import ConfigFormModal from "../../components/datatable/config-form-modal.tsx/ConfigFormModal";
import { FormCfg } from "../../components/datatable/config-form-modal.tsx/shared";
import FormSubmissionGrid, {
  FormSubmissionRow,
} from "../../components/tables/FormSubmissionGrid";

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

export default function MyFormSubmissionRequests() {
  const [rows, setRows] = useState<FormSubmissionRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [cfgFormOpen, setCfgFormOpen] = useState(false);
  const [activeFormCfg, setActiveFormCfg] = useState<FormCfg | null>(null);
  const [activeFormRow, setActiveFormRow] = useState<any>(null);
  const [activeAddInfoConfig, setActiveAddInfoConfig] = useState<any>(null);
  const [activeFileForModal, setActiveFileForModal] = useState<any>(null);
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

  const fetchPage = useCallback(
    (page: number) => {
      fetchSubmissions({
        page,
        page_size: 20,
      });
    },
    [fetchSubmissions]
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
  }, [searchResp]);

  const handleOpenDetails = useCallback((row: FormSubmissionRow) => {
    setCfgFormOpen(false);
    setActiveFormCfg(null);
    setActiveFormRow(null);
    setActiveAddInfoConfig(null);
    setActiveFileForModal(null);

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
        <FormSubmissionGrid
          title="My Form Submission Requests"
          rows={rows}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => fetchPage(currentPage - 1)}
          onNext={() => fetchPage(currentPage + 1)}
          onOpenDetails={handleOpenDetails}
          showCreatedByColumn={false}
          actionLabel="Open Form"
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
            savePath="/form/answers"
            isEditable={true}
          />
        )}
      </Box>
    </>
  );
}