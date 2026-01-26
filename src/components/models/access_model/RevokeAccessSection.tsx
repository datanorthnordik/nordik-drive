import React from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

import {
  color_primary,
  color_text_light,
  color_text_lighter,
  color_text_primary,
  color_white,
} from "../../../constants/colors";

type Props = {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredAccesses: any[];
  openRevokeModalFn: (id: any) => void;
};

const RevokeAccessSection: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  filteredAccesses,
  openRevokeModalFn,
}) => {
  return (
    <Box sx={{ px: 3, pt: 2.25, pb: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <DeleteIcon sx={{ fontSize: 18, color: `${color_primary}` }} />
        <Typography sx={{ fontWeight: 800, fontSize: 12, color: `${color_primary}`, letterSpacing: "0.06em" }}>
          REVOKE ACCESS
        </Typography>
      </Stack>

      <TextField
        fullWidth
        size="small"
        placeholder="Search assigned users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: `${color_text_light}` }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 1.5,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
      />

      <Box
        sx={{
          border: "1px solid #E5E7EB",
          borderRadius: 2.5,
          overflow: "hidden",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: `${color_text_lighter}`,
                "& th": {
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: `${color_text_light}`,
                  fontWeight: 800,
                  py: 1.1,
                  borderBottom: "1px solid #E5E7EB",
                },
              }}
            >
              <TableCell>User</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody
            sx={{
              "& td": {
                borderBottom: "1px solid #EEF2F7",
                py: 1.15,
                fontSize: 13.5,
                color: `${color_text_primary}`,
              },
              "& tr:last-child td": { borderBottom: "none" },
            }}
          >
            {filteredAccesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 3, color: `${color_text_light}` }}>
                  No matching users
                </TableCell>
              </TableRow>
            ) : (
              filteredAccesses.map((a: any) => (
                <TableRow key={a.id} hover sx={{ "&:hover": { bgcolor: `${color_white}` } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
                      {a.firstname} {a.lastname}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => openRevokeModalFn(a.id)}
                      sx={{
                        color: `${color_primary}`,
                        borderRadius: 2,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default RevokeAccessSection;
