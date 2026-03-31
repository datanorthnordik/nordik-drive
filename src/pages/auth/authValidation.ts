import * as yup from "yup";

export const normalizeEmail = (email: string) => email.trim();

export const trimmedEmailSchema = yup
  .string()
  .transform((value, originalValue) =>
    typeof originalValue === "string" ? originalValue.trim() : value
  )
  .email("Invalid email")
  .required("Email is required");
