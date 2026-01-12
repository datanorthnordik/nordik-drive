"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  colorSchemeLightWarm,
  GridReadyEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TuneIcon from "@mui/icons-material/Tune";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";

import dayjs, { Dayjs } from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import { FileButton } from "../buttons/Button";
import { actions } from "../../constants/constants";
import { parsePgTextArray } from "../activity/activityutils";
import ActivityVisualization from "../activity/ActivityVisualization";

ModuleRegistry.registerModules([AllCommunityModule]);
const themeLightWarm = themeQuartz.withPart(colorSchemeLightWarm);

type QuickDatePreset = "LAST_7" | "LAST_30" | "THIS_MONTH" | "LAST_MONTH" | "ALL" | "CUSTOM";

function getPresetRange(preset: QuickDatePreset): { start: Dayjs | null; end: Dayjs | null } {
  const now = dayjs();
  switch (preset) {
    case "LAST_7":
      return { start: now.subtract(7, "day").startOf("day"), end: now.endOf("day") };
    case "LAST_30":
      return { start: now.subtract(30, "day").startOf("day"), end: now.endOf("day") };
    case "THIS_MONTH":
      return { start: now.startOf("month").startOf("day"), end: now.endOf("day") };
    case "LAST_MONTH": {
      const last = now.subtract(1, "month");
      return { start: last.startOf("month").startOf("day"), end: last.endOf("month").endOf("day") };
    }
    case "ALL":
      return { start: null, end: null };
    case "CUSTOM":
    default:
      return { start: null, end: null };
  }
}

type Community = { id: number; name: string; approved: boolean };
type UserAuth = { id: number; firstname: string; lastname: string; community: string[] };
type FileWithUser = { id: number; filename: string };

type CommunitiesResp = { message: string; communities: Community[] };
type UsersResp = { message: string; users: UserAuth[] };
type FilesResp = { message: string; files: FileWithUser[] };

type ActivityMode = "GENERAL" | "FILE_MANAGEMENT";

export default function UserActivity({
  mode = "GENERAL",
  onModeChange,
}: {
  mode?: ActivityMode;
  onModeChange?: (m: ActivityMode) => void;
}) {
  const [gridApi, setGridApi] = useState<any>(null);

  // ✅ compact UI toggles
  const [showFilters, setShowFilters] = useState(true);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  // filters
  const [userId, setUserId] = useState<string>("");
  const [community, setCommunity] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [action, setAction] = useState<string>("");

  const [preset, setPreset] = useState<QuickDatePreset>("LAST_30");
  const [startDate, setStartDate] = useState<Dayjs | null>(getPresetRange("LAST_30").start);
  const [endDate, setEndDate] = useState<Dayjs | null>(getPresetRange("LAST_30").end);

  const [logData, setLogData] = useState<any[]>([]);
  const [logPayload, setLogPayload] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // split sizes
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [leftPct, setLeftPct] = useState(62);

  // manual apply only
  const appliedRef = useRef<any>({});

  // APIs
  const { loading, fetchData, data: logsResp } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/logs",
    "POST"
  );

  const { fetchData: fetchUsers, data: usersResp, loading: usersLoading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/user",
    "GET",
    false
  );

  const {
    fetchData: fetchCommunities,
    data: communitiesResp,
    loading: communitiesLoading,
  } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/communities", "GET", false);

  const { fetchData: fetchFiles, data: filesResp, loading: filesLoading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file",
    "GET",
    false
  );

  useEffect(() => {
    fetchUsers();
    fetchCommunities();
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userOptions = useMemo(() => {
    const r = usersResp as UsersResp | undefined;
    const users = r?.users ?? [];
    return users
      .map((u) => ({ id: String(u.id), name: `${u.firstname} ${u.lastname}`.trim() }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [usersResp]);

  const communityOptions = useMemo(() => {
    const r = communitiesResp as CommunitiesResp | undefined;
    const communities = r?.communities ?? [];
    return communities.map((c) => c.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [communitiesResp]);

  const filenameOptions = useMemo(() => {
    const r = filesResp as FilesResp | undefined;
    const files = r?.files ?? [];
    return Array.from(new Set(files.map((f) => f.filename).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [filesResp]);

  const columnDefs = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      {
        headerName: "User",
        flex: 1,
        minWidth: 170,
        valueGetter: (p: any) => `${p.data?.firstname || ""} ${p.data?.lastname || ""}`.trim() || "-",
      },
      { field: "action", headerName: "Action", flex: 1, minWidth: 140 },
      { field: "service", headerName: "Service", flex: 1, minWidth: 120 },
      {
        field: "filename",
        headerName: "Filename",
        flex: 1,
        minWidth: 220,
        valueGetter: (p: any) => p.data?.filename ?? "-",
      },
      {
        headerName: "Communities",
        flex: 1,
        minWidth: 240,
        valueGetter: (p: any) => {
          const arr = parsePgTextArray(p.data?.communities);
          if (!arr.length) return "-";
          return arr.join(", ");
        },
      },
      {
        field: "created_at",
        headerName: "Timestamp",
        flex: 1,
        minWidth: 175,
        valueFormatter: (p: any) => (p.value ? dayjs(p.value).format("DD-MM-YYYY HH:mm") : ""),
      },
      { field: "message", headerName: "Message", flex: 2, minWidth: 260 },
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

  const onGridReady = (params: GridReadyEvent) => setGridApi(params.api);

  const fetchPage = (page: number) => {
    fetchData({
      page,
      page_size: 20,
      ...appliedRef.current,
    });
  };

  useEffect(() => {
    if (!gridApi) return;

    const r = getPresetRange("LAST_30");
    appliedRef.current = {
      start_date: r.start ? r.start.format("YYYY-MM-DD") : null,
      end_date: r.end ? r.end.format("YYYY-MM-DD") : null,
    };
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridApi]);

  useEffect(() => {
    if (!logsResp) return;
    const r = logsResp as any;

    setLogPayload(r);
    setLogData(r.data || []);
    setTotalPages(r.total_pages || 1);
    setCurrentPage(r.page || 1);

    if (!hasSearchedOnce) {
      setHasSearchedOnce(true);
      setShowFilters(false);
    }
  }, [logsResp]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePresetChange = (p: QuickDatePreset) => {
    setPreset(p);
    const r = getPresetRange(p);
    setStartDate(r.start);
    setEndDate(r.end);
  };

  const handleApply = () => {
    const body: any = {};

    if (userId) body.user_id = Number(userId);
    if (action) body.action = action;
    if (filename) body.filename = filename;
    if (community) body.communities = [community];

    if (preset === "ALL") {
      body.start_date = null;
      body.end_date = null;
    } else {
      body.start_date = startDate ? startDate.format("YYYY-MM-DD") : null;
      body.end_date = endDate ? endDate.format("YYYY-MM-DD") : null;
    }

    appliedRef.current = body;
    fetchPage(1);

    setShowFilters(false);
    setHasSearchedOnce(true);
  };

  const handleReset = () => {
    setUserId("");
    setAction("");
    setFilename("");
    setCommunity("");

    setPreset("LAST_30");
    const r = getPresetRange("LAST_30");
    setStartDate(r.start);
    setEndDate(r.end);

    appliedRef.current = {
      start_date: r.start ? r.start.format("YYYY-MM-DD") : null,
      end_date: r.end ? r.end.format("YYYY-MM-DD") : null,
    };

    fetchPage(1);
  };

  // Splitter drag
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

  const rightPct = 100 - leftPct;

  const filterSummary = useMemo(() => {
    const chips: string[] = [];
    if (userId) {
      const u = userOptions.find((x) => x.id === userId);
      chips.push(`User: ${u?.name ?? userId}`);
    }
    if (community) chips.push(`Community: ${community}`);
    if (filename) chips.push(`File: ${filename}`);
    if (action) chips.push(`Action: ${action}`);

    if (preset === "CUSTOM") {
      chips.push(
        `Time: ${startDate ? startDate.format("DD MMM YYYY") : "-"} → ${
          endDate ? endDate.format("DD MMM YYYY") : "-"
        }`
      );
    } else {
      chips.push(
        `Time: ${
          preset === "LAST_7"
            ? "Last 7 days"
            : preset === "LAST_30"
              ? "Last 30 days"
              : preset === "THIS_MONTH"
                ? "This month"
                : preset === "LAST_MONTH"
                  ? "Last month"
                  : preset === "ALL"
                    ? "All time"
                    : "Custom"
        }`
      );
    }
    return chips;
  }, [userId, community, filename, action, preset, startDate, endDate, userOptions]);

  const handleModeSwitch = (_: any, val: ActivityMode | null) => {
    if (!val) return;
    onModeChange?.(val);
  };

  return (
    <>
      <Loader loading={loading || usersLoading || communitiesLoading || filesLoading} />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          }}
        >
          {/* ✅ Top compact bar (summary + switch + edit) */}
          {!showFilters ? (
            <Box
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                px: 1,
                py: 0.75,
                background: "#fbfcfe",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                <Chip
                  icon={<TuneIcon />}
                  label={`Search (${filterSummary.length} filters)`}
                  size="small"
                  sx={{ fontWeight: 900 }}
                />
                {filterSummary.slice(0, 4).map((t) => (
                  <Chip key={t} label={t} size="small" />
                ))}
                {filterSummary.length > 4 && (
                  <Chip label={`+${filterSummary.length - 4} more`} size="small" />
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={handleModeSwitch}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      fontWeight: 900,
                      borderRadius: "10px",
                      px: 1.2,
                      py: 0.6,
                    },
                  }}
                >
                  <ToggleButton value="FILE_MANAGEMENT">
                    <FolderIcon sx={{ fontSize: 18, mr: 0.75 }} />
                    File management
                  </ToggleButton>
                </ToggleButtonGroup>

                <Button
                  variant="contained"
                  onClick={() => setShowFilters(true)}
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: "10px" }}
                >
                  Edit search
                </Button>
              </Box>
            </Box>
          ) : (
            // Expanded filters
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
                background: "#f7f9fc",
                border: "1px solid #e5e7eb",
                padding: "8px 10px",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                flexShrink: 0,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>User</InputLabel>
                <Select label="User" value={userId} onChange={(e) => setUserId(String(e.target.value))}>
                  <MenuItem value="">All users</MenuItem>
                  {userOptions.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Community</InputLabel>
                <Select
                  label="Community"
                  value={community}
                  onChange={(e) => setCommunity(String(e.target.value))}
                >
                  <MenuItem value="">All communities</MenuItem>
                  {communityOptions.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 210 }}>
                <InputLabel>Filename</InputLabel>
                <Select
                  label="Filename"
                  value={filename}
                  onChange={(e) => setFilename(String(e.target.value))}
                >
                  <MenuItem value="">All files</MenuItem>
                  {filenameOptions.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>Action</InputLabel>
                <Select label="Action" value={action} onChange={(e) => setAction(String(e.target.value))}>
                  <MenuItem value="">All actions</MenuItem>
                  {actions.map((a: any) => (
                    <MenuItem key={a.value} value={a.value}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider flexItem orientation="vertical" sx={{ mx: 0.25 }} />

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Time</InputLabel>
                <Select
                  label="Time"
                  value={preset}
                  onChange={(e) => handlePresetChange(e.target.value as QuickDatePreset)}
                >
                  <MenuItem value="LAST_7">Last 7 days</MenuItem>
                  <MenuItem value="LAST_30">Last 30 days</MenuItem>
                  <MenuItem value="THIS_MONTH">This month</MenuItem>
                  <MenuItem value="LAST_MONTH">Last month</MenuItem>
                  <MenuItem value="ALL">All time</MenuItem>
                  <MenuItem value="CUSTOM">Custom range</MenuItem>
                </Select>
              </FormControl>

              {preset === "CUSTOM" && (
                <DatePicker
                  label="Start"
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  slotProps={{ textField: { size: "small" } }}
                />
              )}
              {preset === "CUSTOM" && (
                <DatePicker
                  label="End"
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  slotProps={{ textField: { size: "small" } }}
                />
              )}

              <Button
                variant="contained"
                onClick={handleApply}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: "10px" }}
              >
                Apply
              </Button>

              <Button
                onClick={handleReset}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  color: "#d32f2f",
                  "&:hover": { backgroundColor: "#fff5f5" },
                }}
              >
                Reset
              </Button>

              <Divider flexItem orientation="vertical" sx={{ mx: 0.25 }} />

              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeSwitch}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: "10px",
                    px: 1.2,
                    py: 0.6,
                  },
                }}
              >
                <ToggleButton value="FILE_MANAGEMENT">
                  <FolderIcon sx={{ fontSize: 18, mr: 0.75 }} />
                  File management
                </ToggleButton>
              </ToggleButtonGroup>

              <IconButton
                onClick={() => setShowFilters(false)}
                size="small"
                sx={{ ml: "auto" }}
                title="Collapse filters"
              >
                <ExpandLessIcon />
              </IconButton>
            </Box>
          )}

          {/* ✅ Split container takes ALL remaining height */}
          <Box
            ref={containerRef}
            sx={{
              flex: 1,
              minHeight: 0,
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 26px rgba(0,0,0,0.08)",
              background: "#fff",
              display: "flex",
            }}
          >
            {/* Left */}
            <Box sx={{ width: `${leftPct}%`, minWidth: 360, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderBottom: "1px solid #eef2f7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fbfcfe",
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 900 }}>Logs</Typography>
                  <Chip label={`${logData.length} rows (page ${currentPage}/${totalPages})`} size="small" sx={{ fontWeight: 900 }} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FileButton disabled={currentPage <= 1} onClick={() => fetchPage(currentPage - 1)}>
                    Prev
                  </FileButton>
                  <FileButton disabled={currentPage >= totalPages} onClick={() => fetchPage(currentPage + 1)}>
                    Next
                  </FileButton>
                </Box>
              </Box>

              <Box sx={{ flex: 1, minHeight: 0 }}>
                <div className="ag-theme-quartz" style={{ width: "100%", height: "100%" }} {...themeLightWarm}>
                  <AgGridReact
                    rowData={logData}
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
                background: "linear-gradient(to right, #ffffff, #f1f5f9, #ffffff)",
                borderLeft: "1px solid #e5e7eb",
                borderRight: "1px solid #e5e7eb",
              }}
            />

            {/* Right */}
            <Box sx={{ width: `${rightPct}%`, minWidth: 320, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <ActivityVisualization logData={logPayload} selectedCommunity={community} selectedAction={action} />
            </Box>
          </Box>

          <style>
            {`
              .ag-theme-quartz .ag-header-cell {
                background-color: #e8f1fb !important;
                font-weight: 900 !important;
                color: #0d47a1 !important;
              }
              .ag-theme-quartz .ag-paging-panel { display: none !important; }
              .ag-theme-quartz .ag-row:hover { background-color: #f1f5f9 !important; }
              .ag-theme-quartz .ag-row-selected { background-color: #dbeafe !important; }
              .ag-theme-quartz .ag-root-wrapper { border: none !important; }
            `}
          </style>
        </Box>
      </LocalizationProvider>
    </>
  );
}
