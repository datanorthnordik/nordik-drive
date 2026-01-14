import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import {
  color_secondary,
  color_border,
  color_background,
  color_text_primary,
  color_text_light,
  color_white,
  header_height,
  header_mobile_height,
} from "../../constants/colors";
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
      return createdBy.includes(search) || userName.includes(search) || filename.includes(search);
    });
  }, [requests, searchText]);

  const headCellSx = {
    fontWeight: 800,
    fontSize: "0.65rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
    color: color_text_light,
    backgroundColor: color_background,
    borderBottom: `1px solid ${color_border}`,
    py: 1,
    px: 1.5,
    whiteSpace: "nowrap" as const,
  };

  const bodyCellSx = {
    fontSize: "0.78rem",
    color: color_text_primary,
    borderBottom: `1px solid ${color_border}`,
    py: 1.1,
    px: 1.5,
    whiteSpace: "nowrap" as const,
    verticalAlign: "middle" as const,
    backgroundColor: color_white,
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
        height: `calc(100vh - ${topOffset})`,
        mt: topOffset,
        p: { xs: 1.5, md: 2.5 },
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: color_background,
      }}
    >
      <Loader loading={loading} />

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
        {/* Header (title + search) */}
        <Box
          sx={{
            px: { xs: 1.75, md: 2.25 },
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            borderBottom: `1px solid ${color_border}`,
            backgroundColor: color_white,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              color: color_secondary,
              fontSize: "0.95rem",
            }}
          >
            Pending Edit Requests
          </Typography>

          <TextField
            size="small"
            placeholder="Search by user/file..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              width: { xs: 210, sm: 280 },
              "& .MuiOutlinedInput-root": {
                height: 34,
                borderRadius: "8px",
                backgroundColor: color_background,
                fontSize: "0.78rem",
                color: color_text_primary,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: color_border,
              },
              "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: color_border,
              },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: color_secondary,
              },
              "& input::placeholder": {
                color: color_text_light,
                opacity: 1,
              },
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

        {/* Table area */}
        <TableContainer
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            backgroundColor: color_background, // matches the empty area below rows in your UX
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>User Name</TableCell>
                <TableCell sx={headCellSx}>Created By</TableCell>
                <TableCell sx={headCellSx}>File</TableCell>
                <TableCell sx={headCellSx}>Total Changes</TableCell>
                <TableCell sx={headCellSx}>Created</TableCell>
                <TableCell sx={{ ...headCellSx }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{
                      py: 3,
                      color: color_text_light,
                      backgroundColor: color_background,
                      borderBottom: `1px solid ${color_border}`,
                      fontSize: "0.85rem",
                    }}
                  >
                    No pending requests
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((req) => (
                  <TableRow
                    hover
                    key={req.request_id}
                    sx={{
                      "&:hover td": {
                        backgroundColor: color_background,
                      },
                    }}
                  >
                    <TableCell sx={bodyCellSx}>
                      {`${req.efirstname ?? ""} ${req.elastname ?? ""}`.trim()}
                    </TableCell>

                    <TableCell sx={bodyCellSx}>
                      {`${req.firstname ?? ""} ${req.lastname ?? ""}`.trim()}
                    </TableCell>

                    <TableCell sx={fileCellSx}>{req.details?.[0]?.filename}</TableCell>

                    <TableCell sx={bodyCellSx}>
                      <Chip
                        label={`${req.details?.length || 0} changes`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          borderRadius: "999px",
                          backgroundColor: color_secondary,
                          color: color_white,
                        }}
                      />
                    </TableCell>

                    <TableCell sx={bodyCellSx}>{req.created_at}</TableCell>

                    <TableCell sx={bodyCellSx} align="center">
                      <Tooltip title="View Request">
                        <IconButton
                          onClick={() => setSelectedRequest(req)}
                          size="small"
                          sx={{
                            color: color_text_light,
                            "&:hover": {
                              backgroundColor: color_background,
                            },
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Small spacer so last row never feels clipped */}
              {filtered.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ height: 14, borderBottom: "none", backgroundColor: color_background }} />
                </TableRow>
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
