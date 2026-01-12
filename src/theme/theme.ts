import { createTheme } from "@mui/material/styles";
import { color_primary, color_secondary, color_primary_dark, color_background } from "../constants/colors";

const theme = createTheme({
  palette: {
    background: {
      default: color_background,
      paper: "#ffffff",
    },
    text: {
      primary: "#2c3e50",
    },
  },
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
