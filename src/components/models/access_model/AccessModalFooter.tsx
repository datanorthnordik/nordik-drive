import React from "react";
import { Box, Button } from "@mui/material";

import { color_success_dark, color_success_darker, color_white } from "../../../constants/colors";

type Props = {
  onClose: () => void;
};

const AccessModalFooter: React.FC<Props> = ({ onClose }) => {
  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        bgcolor: `${color_white}`,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <Button
        onClick={onClose}
        variant="contained"
        sx={{
          borderRadius: 2,
          px: 3,
          py: 1,
          fontWeight: 900,
          textTransform: "uppercase",
          fontSize: 12,
          boxShadow: "none",
          backgroundColor: `${color_success_dark}`,
          "&:hover": { backgroundColor: `${color_success_darker}` },
        }}
      >
        Done
      </Button>
    </Box>
  );
};

export default AccessModalFooter;
