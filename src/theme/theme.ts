import { createTheme } from "@mui/material/styles";
import { color_primary, color_secondary, color_primary_dark } from "../constants/colors";

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: color_secondary,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          "&.Mui-focused": {
            color: color_secondary,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: color_primary,
          border: `2px solid ${color_primary}`,
          color: "#fff",
          "&:hover": {
            backgroundColor: color_primary_dark, // darker shade on hover
          },
        },
      },
    },
  },
});

export default theme
