import React from "react";
import { Autocomplete, Box, Button, Checkbox, Chip, Stack, TextField, Typography } from "@mui/material";

import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";

import {
  color_secondary,
  color_text_light,
  color_text_primary,
  color_white,
} from "../../../constants/colors";

import { User } from "./types";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

type Props = {
  users: User[];
  selectedUsers: User[];
  setSelectedUsers: (v: User[]) => void;
  openAssignModal: () => void;
  loading: boolean;
};

const AssignAccessSection: React.FC<Props> = ({
  users,
  selectedUsers,
  setSelectedUsers,
  openAssignModal,
  loading,
}) => {
  return (
    <Box sx={{ px: 3, pt: 2.25, pb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <PersonSearchOutlinedIcon sx={{ fontSize: 18, color: `${color_secondary}` }} />
        <Typography sx={{ fontWeight: 800, fontSize: 12, color: `${color_secondary}`, letterSpacing: "0.06em" }}>
          ASSIGN ACCESS
        </Typography>
      </Stack>

      <Typography sx={{ fontSize: 12.5, color: `${color_text_light}`, mb: 1 }}>
        Search Users
      </Typography>

      <Autocomplete
        multiple
        disableCloseOnSelect
        options={users}
        value={selectedUsers}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(e, newValue) => setSelectedUsers(newValue)}
        filterOptions={(options, state) => {
          const term = state.inputValue.toLowerCase();
          return options
            .filter((u) => !selectedUsers.some((s) => s.id === u.id))
            .filter(
              (u) =>
                `${u.firstname} ${u.lastname}`.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term) ||
                u.phonenumber?.toString().includes(term)
            );
        }}
        renderOption={(props, option, { selected }) => (
          <li
            {...props}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 10px",
              gap: "8px",
            }}
          >
            <Checkbox icon={icon} checkedIcon={checkedIcon} checked={selected} sx={{ p: 0.5 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>
                {option.firstname} {option.lastname}
              </div>
              <div style={{ fontSize: 11.5, color: `${color_text_light}` }}>{option.email}</div>
            </div>
          </li>
        )}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={`${option.firstname} ${option.lastname}`}
              size="small"
              sx={{
                borderRadius: 2,
                bgcolor: "rgba(29,78,216,0.10)",
                color: `${color_secondary}`,
                fontWeight: 700,
              }}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Type name, email, or phone"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: `${color_white}`,
              },
            }}
          />
        )}
        loading={loading}
      />

      <Button
        variant="contained"
        onClick={openAssignModal}
        sx={{
          mt: 1.75,
          borderRadius: 2,
          px: 2,
          py: 1,
          fontWeight: 800,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontSize: 12,
          boxShadow: "none",
          color: `${color_white}`,
          backgroundColor: `${color_secondary} !important`,
        }}
      >
        Assign Access
      </Button>
    </Box>
  );
};

export default AssignAccessSection;
