import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CloseIcon from "@mui/icons-material/Close";

import {
  color_secondary,
  color_text_light,
  color_text_primary,
  color_white,
} from "../../../constants/colors";

type Props = {
  fileName: string;
  onClose: () => void;
};

const AccessModalHeader: React.FC<Props> = ({ fileName, onClose }) => {
  return (
    <Box sx={{ px: 3, py: 2, bgcolor: `${color_white}` }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: "rgba(25,118,210,0.10)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 18, color: `${color_secondary}` }} />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16.5, color: `${color_text_primary}` }}>
              Manage File Access
            </Typography>
            <Typography sx={{ fontWeight: 500, fontSize: 12.5, color: `${color_text_light}` }}>
              {fileName}
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default AccessModalHeader;
