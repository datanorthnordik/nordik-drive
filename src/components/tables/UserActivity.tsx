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
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ActivityTableWrapper } from "../Wrappers";
import useFetch from "../../hooks/useFetch";
import { FileButton } from "../buttons/Button";
import Loader from "../Loader";
import { actions } from "../../constants/constants";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
const themeLightWarm = themeQuartz.withPart(colorSchemeLightWarm);

export default function UserActivity() {
  const [gridApi, setGridApi] = useState<any>(null);

  const [user, setUser] = useState("");
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [logData, setLogData] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ref = useRef<any>(null);
  const { loading, fetchData, data: logs, error } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/logs", "POST");

  const columnDefs = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80 },
      {
        headerName: "Name",
        flex: 1,
        valueGetter: (params: any) => {
          // Combine firstname and lastname
          const first = params.data?.firstname || "";
          const last = params.data?.lastname || "";
          return `${first} ${last}`.trim();
        },
      },
      { field: "action", headerName: "Action", flex: 1 },
      {
        field: "created_at",
        headerName: "Timestamp",
        flex: 1,
        valueFormatter: (params: any) => {
          if (!params.value) return "";
          // Format time as e.g., 03-09-2025 21:05
          return dayjs(params.value).format("DD-MM-YYYY HH:mm");
        },
      },
      { field: "message", headerName: "Message", flex: 1 },
    ],
    []
  );

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  // Fetch page data
  const fetchPage = async (page: number) => {
    if (!gridApi) return;
    const pageSize = 20;

    const requestBody = {
      page,
      page_size: pageSize,
      ...ref.current,
    };

    fetchData(requestBody);


  };

  useEffect(() => {
    if (logs) {
      const log = logs as any
      setLogData(log.data || []);
      setTotalPages(log.total_pages);
      setCurrentPage(log.page)
    }
  }, [logs])

  // Initial load
  useEffect(() => {
    if (gridApi) fetchPage(1);
  }, [gridApi]);

  const handleFilter = () => {
    const requestBody = {
      user,
      action,
      status,
      "start_date": startDate ? startDate.format("YYYY-MM-DD") : null,
      endDate: endDate ? endDate.format("YYYY-MM-DD") : null,
    };
    ref.current = requestBody;
    fetchPage(1); // reload with filter
  };

  const handleReset = () => {
    setUser("");
    setAction("");
    setStatus("");
    setStartDate(null);
    setEndDate(null);
    ref.current = {};
    fetchPage(1);
  };

  // Unique users for dropdown
  const users = Array.from(new Set(logData.map((row: any) => row.user)));

  return (
    <>
      <Loader loading={loading}/>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box style={{ padding: "8px", boxSizing: "border-box" }}>
          {/* Filter Bar */}
          <ActivityTableWrapper>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
                background: "#f1f5f9",
                padding: "8px 12px",
                borderRadius: "8px",
                marginBottom: 2,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                boxSizing: "border-box",
              }}
            >
              <Select
                size="small"
                value={user}
                displayEmpty
                onChange={(e) => setUser(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">User</MenuItem>
                {users.map((u: any) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </Select>

              <Select
                size="small"
                value={action}
                displayEmpty
                onChange={(e) => setAction(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                {actions.map(action=>(
                    <MenuItem value={action.value}>{action.name}</MenuItem>
                ))}
                
                
              </Select>

              <DatePicker
                label="Start"
                value={startDate}
                onChange={(val) => setStartDate(val)}
                slotProps={{ textField: { size: "small" } }}
              />
              <DatePicker
                label="End"
                value={endDate}
                onChange={(val) => setEndDate(val)}
                slotProps={{ textField: { size: "small" } }}
              />

              <Button
                variant="contained"
                onClick={handleFilter}
                sx={{
                  backgroundColor: "#1976d2",
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  paddingX: 2,
                  "&:hover": { backgroundColor: "#1565c0" },
                }}
              >
                Apply
              </Button>

              <Button
                onClick={handleReset}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  paddingX: 2,
                  backgroundColor: "#f5f5f5",
                  color: "#d32f2f",
                  border: "1px solid #e0e0e0",
                  "&:hover": { backgroundColor: "#fdeaea", borderColor: "#d32f2f" },
                }}
              >
                Reset
              </Button>
            </Box>

            {/* Data Grid */}
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                flex: 1,
                height: "400px", // keep grid height fixed so only table scrolls
              }}
            >
              <div
                className="ag-theme-quartz"
                style={{ width: "100%", height: "100%", minWidth: "900px" }}
                {...themeLightWarm}
              >
                <AgGridReact
                  rowData={logData}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  onGridReady={onGridReady}
                  rowHeight={40}
                  headerHeight={45}
                  suppressRowClickSelection={true}
                  suppressPaginationPanel={true}
                  rowSelection="single"
                  rowModelType="clientSide"
                  domLayout="normal"
                  pagination={false}
                />
              </div>
            </Box>

            {/* Custom Pagination */}
            <Box
              sx={{ display: "flex", justifyContent: "flex-end", mt: 1, gap: 1, alignItems: "center" }}
            >
              <FileButton disabled={currentPage <= 1} onClick={() => fetchPage(currentPage - 1)}>
                Prev
              </FileButton>
              <Typography>Page {currentPage} of {totalPages}</Typography>
              <FileButton disabled={currentPage >= totalPages} onClick={() => fetchPage(currentPage + 1)}>
                Next
              </FileButton>
            </Box>
          </ActivityTableWrapper>
        </Box>

        <style>
          {`
          .ag-theme-quartz .ag-header-cell {
            background-color: #cce0ff !important;
            font-weight: bold;
            color: #0d47a1 !important;
          }
          .ag-theme-quartz .ag-row:hover {
            background-color: #b3d1ff !important;
          }
          .ag-theme-quartz .ag-row-selected {
            background-color: #99ccff !important;
          }
          .ag-paging-panel {
              display: none !important;
          }

          .ag-theme-quartz .ag-paging-panel {
            display: none !important;
          }
        
          .ag-theme-quartz .ag-header {
            background-color: #cce0ff !important; /* same as your header cells */
            z-index: 1; /* ensures it stays above the white ghost */
          }
          .ag-theme-quartz .ag-header-cell {
            background-color: #cce0ff !important; 
          }
          .ag-theme-quartz .ag-root-wrapper {
            overflow: hidden !important; /* prevent container scroll conflicts */
          }

        `}
        </style>
      </LocalizationProvider>
    </>
  );
}
