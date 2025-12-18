import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  TextField,
  Chip,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { color_primary, header_height, header_mobile_height } from "../../constants/colors";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import RequestDetailsModal from "./RequestDetailsModal";

const PendingRequests: React.FC = () => {
  const { data, fetchData, loading } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/file/edit/request",
    "GET",
    false
  );

  const [requests, setRequests] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) setRequests((data as any).requests || []);
  }, [data]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const topOffset = isMobile ? header_mobile_height : header_height;

  const filtered = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    if (!search) return requests;

    return requests.filter((r) => {
      const createdBy = `${r.firstname || ""} ${r.lastname || ""}`.toLowerCase();
      const userName = `${r.efirstname || ""} ${r.elastname || ""}`.toLowerCase();
      const filename = String(r.details?.[0]?.filename || "").toLowerCase();
      return (
        createdBy.includes(search) ||
        userName.includes(search) ||
        filename.includes(search)
      );
    });
  }, [requests, searchText]);

  const headCellSx = {
    fontWeight: 800,
    background: "#fff",
    py: 1,
    px: 1.25,
    whiteSpace: "nowrap",
  };

  const bodyCellSx = {
    py: 0.9,
    px: 1.25,
    whiteSpace: "nowrap" as const,
    borderBottom: "1px solid #eee",
    verticalAlign: "top",
  };

  const fileCellSx = {
    ...bodyCellSx,
    whiteSpace: "normal" as const,
    maxWidth: 520,
    wordBreak: "break-word" as const,
  };

  return (
    <Box
      sx={{
        // ✅ KEY FIX: real height based on header size
        height: `calc(100vh - ${topOffset})`,
        mt: topOffset,
        p: { xs: 1.5, md: 2 },
        boxSizing: "border-box",
        overflow: "hidden", // ✅ no page scroll
      }}
    >
      <Loader loading={loading} />

      <Paper
        elevation={3}
        sx={{
          borderRadius: "12px",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* ✅ Title + Search stays visible */}
        <Box
          sx={{
            backgroundColor: "#f7f9fc",
            borderBottom: "1px solid #ddd",
            px: 2,
            py: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontWeight: 800, color: color_primary }}>
            Pending Edit Requests
          </Typography>

          <TextField
            size="small"
            placeholder="Search by user/file..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              minWidth: { xs: 180, md: 320 },
              "& .MuiOutlinedInput-root": { height: 40 },
            }}
          />
        </Box>

        {/* ✅ Only the table scrolls */}
        <TableContainer
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            // ✅ KEY FIX: prevents last row from hiding behind container edge
            pb: 3,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#e8f1fb" }}>
                <TableCell sx={headCellSx}>User Name</TableCell>
                <TableCell sx={headCellSx}>Created By</TableCell>
                <TableCell sx={headCellSx}>File</TableCell>
                <TableCell sx={headCellSx}>Total Changes</TableCell>
                <TableCell sx={headCellSx}>Created</TableCell>
                <TableCell sx={headCellSx} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                    No pending requests
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filtered.map((req) => (
                    <TableRow hover key={req.request_id}>
                      <TableCell sx={bodyCellSx}>
                        {`${req.efirstname ?? ""} ${req.elastname ?? ""}`.trim()}
                      </TableCell>

                      <TableCell sx={bodyCellSx}>
                        {`${req.firstname ?? ""} ${req.lastname ?? ""}`.trim()}
                      </TableCell>

                      <TableCell sx={fileCellSx}>
                        {req.details?.[0]?.filename}
                      </TableCell>

                      <TableCell sx={bodyCellSx}>
                        <Chip
                          label={`${req.details?.length || 0} changes`}
                          color="warning"
                          size="small"
                          sx={{ height: 22, fontSize: "0.78rem", fontWeight: 700 }}
                        />
                      </TableCell>

                      <TableCell sx={bodyCellSx}>{req.created_at}</TableCell>

                      <TableCell sx={bodyCellSx} align="center">
                        <Tooltip title="View Request">
                          <IconButton
                            onClick={() => setSelectedRequest(req)}
                            size="small"
                            sx={{ p: 0.5 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* ✅ Extra spacer to guarantee last row visibility */}
                  <TableRow>
                    <TableCell colSpan={6} sx={{ height: 18, borderBottom: "none" }} />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <RequestDetailsModal
        open={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApproved={fetchData}
      />
    </Box>
  );
};

export default PendingRequests;
