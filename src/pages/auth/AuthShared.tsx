    import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";

// ✅ use ONLY constants (no hardcoded colors)
import {
  color_border,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_text_secondary,
  color_white,
} from "../../constants/colors";

/* ===========================
   Shared UI: Logos + Title + OR Divider
=========================== */

export function AuthLogosHeader({ mb = 3 }: { mb?: number }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "2rem",
        flexWrap: "wrap",
        mb,
      }}
    >
      <Box sx={{ height: "120px", maxWidth: "200px" }}>
        <img
          src="/logo-1.png"
          alt="Children of Shingwauk Alumni Association"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ height: "60px", maxWidth: "220px" }}>
        <img
          src="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-640x160.png"
          alt="Nordik Institute"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}

export function AuthTitle({
  children,
  mb = 2,
  fontSize = 22,
  fontWeight = 800,
}: {
  children: React.ReactNode;
  mb?: number;
  fontSize?: number | string;
  fontWeight?: number;
}) {
  return (
    <Typography
      sx={{
        fontWeight,
        fontSize,
        mb,
        color: color_text_primary,
        textAlign: "center",
      }}
    >
      {children}
    </Typography>
  );
}

export function OrDivider({
  my = 2,
  text = "OR",
  dividerColor = color_border,
  textColor = color_text_secondary,
}: {
  my?: number;
  text?: string;
  dividerColor?: string;
  textColor?: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, my }}>
      <Divider sx={{ flex: 1, borderColor: dividerColor }} />
      <Typography sx={{ fontSize: 12, fontWeight: 900, color: textColor }}>
        {text}
      </Typography>
      <Divider sx={{ flex: 1, borderColor: dividerColor }} />
    </Box>
  );
}

/* ===========================
   Shared UI: Primary Button
=========================== */

export function AuthPrimaryButton({
  sx,
  ...props
}: ButtonProps & { sx?: SxProps<Theme> }) {
  return (
    <Button
      variant="contained"
      fullWidth
      {...props}
      sx={{
        height: 46,
        borderRadius: 2,
        fontWeight: 900,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        boxShadow: "none",
        backgroundColor: `${color_secondary} !important`,
        "&:hover": { backgroundColor: `${color_secondary_dark} !important` },
        ...sx,
      }}
    />
  );
}

/* ===========================
   Shared UI: Controlled Fields
   ✅ FIX: accept Control<any, any, any> to avoid resolver-transformed Control mismatch
=========================== */

type RHFControlAny = Control<any, any, any>;

type ControlledFieldProps = {
  name: string;
  control: RHFControlAny;

  label?: string;
  placeholder?: string;
  type?: string;

  errorMessage?: string;
  margin?: "none" | "dense" | "normal";
  inputHeight?: number;

  sx?: SxProps<Theme>;
  textFieldProps?: Omit<
    React.ComponentProps<typeof TextField>,
    "name" | "value" | "onChange" | "error" | "helperText" | "sx"
  > & { sx?: SxProps<Theme> };
};

export function AuthControlledTextField({
  name,
  control,
  label,
  placeholder,
  type = "text",
  errorMessage,
  margin = "normal",
  inputHeight,
  sx,
  textFieldProps,
}: ControlledFieldProps) {
  const { sx: tfSx, ...restTfProps } = textFieldProps || {};

  const finalSx = useMemo(() => {
    const base: any = {
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        backgroundColor: color_white,
        ...(inputHeight ? { height: inputHeight } : {}),
      },
    };
    return [base, sx, tfSx].filter(Boolean);
  }, [sx, tfSx, inputHeight]);

  return (
    <Controller
      name={name as any}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={label}
          placeholder={placeholder}
          type={type}
          variant="outlined"
          fullWidth
          margin={margin}
          error={!!errorMessage}
          helperText={errorMessage}
          sx={finalSx}
          {...restTfProps}
        />
      )}
    />
  );
}

export function AuthPasswordField({
  name,
  control,
  label,
  placeholder,
  errorMessage,
  margin = "normal",
  inputHeight,
  sx,
  textFieldProps,
}: Omit<ControlledFieldProps, "type">) {
  const [show, setShow] = useState(false);

  return (
    <AuthControlledTextField
      name={name}
      control={control}
      label={label}
      placeholder={placeholder}
      type={show ? "text" : "password"}
      errorMessage={errorMessage}
      margin={margin}
      inputHeight={inputHeight}
      sx={sx}
      textFieldProps={{
        ...textFieldProps,
        InputProps: {
          ...(textFieldProps?.InputProps || {}),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShow((p) => !p)}
                edge="end"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
