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

  //  compact UI toggles
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

  const { fetchData: fetchCommunities, data: communitiesResp, loading: communitiesLoading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/communities",
    "GET",
    false
  );

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
            background: color_background,
          }}
        >
          {/*  Top row like screenshot */}
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
              {/* left: Search + Time chips */}
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
                {/* show just the Time chip always (like screenshot) */}
                {filterSummary
                  .filter((x) => x.startsWith("Time:"))
                  .slice(0, 1)
                  .map((t) => (
                    <Chip
                      key={t}
                      label={t}
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
                {/* if you want the "+more" behaviour still */}
                {filterSummary.length > 1 && (
                  <Chip
                    label={`+${filterSummary.length - 1} more`}
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

              {/* right: File management + Edit search */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
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
                      background: color_white,
                      border: `1px solid ${color_border}`,
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
            </Box>
          ) : (
            // Expanded filters (kept all your controls/logic)
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
                background: color_white_smoke,
                border: `1px solid ${color_border}`,
                padding: "8px 10px",
                borderRadius: "12px",
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

              <Divider flexItem orientation="vertical" sx={{ mx: 0.25, borderColor: color_border }} />

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
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: "10px",
                  background: color_secondary,
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
                  "&:hover": { backgroundColor: color_white_smoke },
                }}
              >
                Reset
              </Button>

              <Divider flexItem orientation="vertical" sx={{ mx: 0.25, borderColor: color_border }} />

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
                    background: color_white,
                    border: `1px solid ${color_border}`,
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

          {/*  Outer panel like screenshot */}
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
            {/* Inner split container */}
            <Box
              ref={containerRef}
              sx={{
                flex: 1,
                minHeight: 0,
                borderRadius: "8px",
                overflow: "hidden",
                border: `1px solid ${color_border}`,
                background: color_white,
                display: "flex",
              }}
            >
              {/* Left card: Logs */}
              <Box
                sx={{
                  width: `${leftPct}%`,
                  minWidth: 360,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  borderRight: `1px solid ${color_border}`,
                  background: color_white,
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
                    <Typography sx={{ fontWeight: 900, color: color_text_primary }}>Logs</Typography>
                    <Typography sx={{ fontSize: 12, color: color_text_light }}>
                      {logData.length} rows (page {currentPage}/{totalPages})
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FileButton disabled={currentPage <= 1} onClick={() => fetchPage(currentPage - 1)}>
                      PREV
                    </FileButton>
                    <FileButton disabled={currentPage >= totalPages} onClick={() => fetchPage(currentPage + 1)}>
                      NEXT
                    </FileButton>
                  </Box>
                </Box>

                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <div className="ag-theme-quartz" style={{ width: "100%", height: "100%" }}>
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

              {/* Splitter (same behavior, styled) */}
              <Box
                onMouseDown={() => (draggingRef.current = true)}
                sx={{
                  width: 10,
                  cursor: "col-resize",
                  background: color_white_smoke,
                  borderLeft: `1px solid ${color_border}`,
                  borderRight: `1px solid ${color_border}`,
                }}
              />

              {/* Right card: Visualization */}
              <Box
                sx={{
                  width: `${rightPct}%`,
                  minWidth: 320,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  background: color_white,
                }}
              >
                <ActivityVisualization logData={logPayload} selectedCommunity={community} selectedAction={action} />
              </Box>
            </Box>
          </Box>

          {/* AG Grid theme tweaks using ONLY your colors */}
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
              .ag-theme-quartz .ag-paging-panel { display: none !important; }
              .ag-theme-quartz .ag-row:hover { background-color: ${color_light_gray} !important; }
              .ag-theme-quartz .ag-row-selected { background-color: ${color_white_smoke} !important; }
              .ag-theme-quartz .ag-root-wrapper { border: none !important; }
              .ag-theme-quartz .ag-cell {
                color: ${color_text_primary} !important;
              }
            `}
          </style>
        </Box>
      </LocalizationProvider>
    </>
  );
}
