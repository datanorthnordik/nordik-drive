import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const isBlank = (v: any) => {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.join(",").trim().length === 0;
  return String(v).trim().length === 0;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}