"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AllCommunityModule,
    GridReadyEvent,
    ModuleRegistry,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import {
    Autocomplete,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TuneIcon from "@mui/icons-material/Tune";

import dayjs from "dayjs";

import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import { FileButton } from "../buttons/Button";
import { API_BASE } from "../../constants/constants";
import {
    color_secondary,
    color_secondary_dark,
    color_border,
    color_white,
    color_light_gray,
    color_white_smoke,
    color_text_primary,
    color_text_secondary,
    color_text_light,
    color_background,
} from "../../constants/colors";

import ConfigFormModal from "../datatable/config-form-modal.tsx/ConfigFormModal";
import { FormCfg } from "../datatable/config-form-modal.tsx/shared";

ModuleRegistry.registerModules([AllCommunityModule]);

type UserAuth = {
    id: number;
    firstname: string;
    lastname: string;
    email?: string;
};

type FileWithUser = {
    id: number;
    filename: string;
};

type UsersResp = {
    message?: string;
    users?: UserAuth[];
};

type FilesResp = {
    message?: string;
    files?: FileWithUser[];
};

type FormSubmissionRow = {
    id: number;
    file_id: number;
    row_id: number;
    file_name: string;
    form_key: string;
    form_label?: string;
    firstname: string;
    lastname: string;
    created_by: string;
    edited_by: string;
    reviewed_by: string;
    status: string;
    created_at?: string;
    updated_at?: string;
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
    const [gridApi, setGridApi] = useState<any>(null);

    const [showFilters, setShowFilters] = useState(true);
    const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

    const [selectedFile, setSelectedFile] = useState<SelectOption | null>(null);
    const [selectedForm, setSelectedForm] = useState<FormOption | null>(null);
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [selectedCreatedBy, setSelectedCreatedBy] = useState<SelectOption | null>(null);

    const [rows, setRows] = useState<FormSubmissionRow[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [formOptionsFromApi, setFormOptionsFromApi] = useState<FormOption[]>([]);

    const [cfgFormOpen, setCfgFormOpen] = useState(false);
    const [activeFormCfg, setActiveFormCfg] = useState<FormCfg | null>(null);
    const [activeFormRow, setActiveFormRow] = useState<any>(null);
    const [activeAddInfoConfig, setActiveAddInfoConfig] = useState<any>(null);
    const [activeFileForModal, setActiveFileForModal] = useState<any>(null);
    const [pendingDetailsRow, setPendingDetailsRow] = useState<FormSubmissionRow | null>(null);
    const [configFileNameToLoad, setConfigFileNameToLoad] = useState<string>("");

    const appliedRef = useRef<Record<string, any>>({});

    const {
        loading: searchLoading,
        fetchData: fetchSubmissions,
        data: searchResp,
    } = useFetch(`${API_BASE}/form/search`, "POST");

    const {
        loading: usersLoading,
        fetchData: fetchUsers,
        data: usersResp,
    } = useFetch(`${API_BASE}/user`, "GET", false);

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
        fetchUsers();
        fetchFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const userOptions = useMemo<SelectOption[]>(() => {
        const resp = usersResp as UsersResp | undefined;
        const users = resp?.users ?? [];

        return users
            .map((u) => ({
                id: String(u.id),
                label:
                    `${u.firstname || ""} ${u.lastname || ""}`.trim() +
                    (u.email ? ` (${u.email})` : ""),
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [usersResp]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile]);

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

        setPendingDetailsRow(row);
        setConfigFileNameToLoad(row.file_name || "");
    }, []);

    useEffect(() => {
        if (!pendingDetailsRow || !configFileNameToLoad) return;
        fetchConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingDetailsRow, configFileNameToLoad]);

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

    const columnDefs = useMemo(
        () => [
            { field: "form_label", headerName: "Form Type", flex: 1, minWidth: 180 },
            { field: "firstname", headerName: "First Name", flex: 1, minWidth: 150 },
            { field: "lastname", headerName: "Last Name", flex: 1, minWidth: 150 },
            { field: "file_name", headerName: "File", flex: 1.25, minWidth: 220 },
            { field: "created_by", headerName: "Created By", flex: 1.2, minWidth: 220 },
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
                headerName: "Details",
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
                            params.context.openDetails(params.data);
                        }}
                    >
                        View Details
                    </button>
                ),
            },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            resizable: true,
            sortable: true,
            filter: true,
        }),
        []
    );

    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
    };

    const fetchPage = (page: number) => {
        fetchSubmissions({
            page,
            page_size: 20,
            ...appliedRef.current,
        });
    };

    useEffect(() => {
        if (!gridApi) return;
        appliedRef.current = {};
        fetchPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridApi]);

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
        if (firstName.trim()) body.firstname = firstName.trim();
        if (lastName.trim()) body.lastname = lastName.trim();
        if (selectedCreatedBy) body.created_by = Number(selectedCreatedBy.id);

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
        setSelectedCreatedBy(null);
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
    };

    const filterSummary = useMemo(() => {
        const chips: string[] = [];

        if (selectedFile) chips.push(`File: ${selectedFile.label}`);
        if (selectedForm) chips.push(`Form type: ${selectedForm.label}`);
        if (firstName.trim()) chips.push(`First name: ${firstName.trim()}`);
        if (lastName.trim()) chips.push(`Last name: ${lastName.trim()}`);
        if (selectedCreatedBy) chips.push(`Created by: ${selectedCreatedBy.label}`);

        return chips;
    }, [selectedFile, selectedForm, firstName, lastName, selectedCreatedBy]);

    const gridContext = useMemo(
        () => ({
            openDetails: handleOpenDetails,
        }),
        [handleOpenDetails]
    );

    return (
        <>
            <Loader loading={searchLoading || usersLoading || filesLoading || formsLoading || configLoading} />

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
                                size="small"
                                options={userOptions}
                                value={selectedCreatedBy}
                                onChange={(_, value) => setSelectedCreatedBy(value)}
                                loading={usersLoading}
                                disablePortal
                                clearOnEscape
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                getOptionLabel={(option) => option?.label || ""}
                                noOptionsText="No users found"
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Created By"
                                        placeholder="Search creator"
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
                                    Form Submission Logs
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: color_text_light }}>
                                    {rows.length} rows (page {currentPage}/{totalPages})
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <FileButton
                                    disabled={currentPage <= 1}
                                    onClick={() => fetchPage(currentPage - 1)}
                                >
                                    PREV
                                </FileButton>

                                <FileButton
                                    disabled={currentPage >= totalPages}
                                    onClick={() => fetchPage(currentPage + 1)}
                                >
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
                                    onGridReady={onGridReady}
                                    rowHeight={42}
                                    headerHeight={46}
                                    suppressRowClickSelection
                                    rowSelection="single"
                                    pagination={false}
                                    suppressPaginationPanel={true}
                                    domLayout="normal"
                                    context={gridContext}
                                />
                            </div>
                        </Box>
                    </Box>
                </Box>

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
                        isEditable={false}
                    />
                )}

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
            </Box>
        </>
    );
}