import {
  color_error,
  color_success_dark,
  color_text_light,
  color_warning,
} from "../../constants/colors";

export const SUPPORT_REQUEST_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  CLOSED: "closed",
} as const;

export type SupportRequestStatus =
  (typeof SUPPORT_REQUEST_STATUS)[keyof typeof SUPPORT_REQUEST_STATUS];

export type SupportRequestItem = {
  id: number;
  requester_name: string;
  requester_email: string;
  request_type: "question" | "technical_issue";
  subject: string;
  message: string;
  screenshot_file_name?: string;
  screenshot_url?: string;
  status: SupportRequestStatus;
  assigned_team?: string;
  assigned_team_recipients?: string;
  assigned_at?: string | null;
  admin_note?: string;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportRequestListResponse = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  items: SupportRequestItem[];
};

export const getSupportRequestTypeLabel = (requestType?: string) =>
  requestType === "technical_issue" ? "Technical issue" : "Question or query";

export const getSupportRequestStatusLabel = (status?: string) => {
  switch (status) {
    case SUPPORT_REQUEST_STATUS.IN_PROGRESS:
      return "In Progress";
    case SUPPORT_REQUEST_STATUS.CLOSED:
      return "Closed";
    default:
      return "Open";
  }
};

export const getSupportRequestStatusChip = (status?: string) => {
  switch (status) {
    case SUPPORT_REQUEST_STATUS.IN_PROGRESS:
      return {
        label: getSupportRequestStatusLabel(status),
        accent: color_warning,
        sx: {
          color: "#8a4b00",
          backgroundColor: "rgba(243, 156, 18, 0.14)",
          border: "1px solid rgba(243, 156, 18, 0.28)",
        },
      };
    case SUPPORT_REQUEST_STATUS.CLOSED:
      return {
        label: getSupportRequestStatusLabel(status),
        accent: color_success_dark,
        sx: {
          color: color_success_dark,
          backgroundColor: "rgba(39, 174, 96, 0.12)",
          border: "1px solid rgba(39, 174, 96, 0.24)",
        },
      };
    case SUPPORT_REQUEST_STATUS.OPEN:
      return {
        label: getSupportRequestStatusLabel(status),
        accent: color_error,
        sx: {
          color: color_error,
          backgroundColor: "rgba(231, 76, 60, 0.10)",
          border: "1px solid rgba(231, 76, 60, 0.22)",
        },
      };
    default:
      return {
        label: "Unknown",
        accent: color_text_light,
        sx: {
          color: color_text_light,
          backgroundColor: "rgba(107, 114, 128, 0.10)",
          border: "1px solid rgba(107, 114, 128, 0.24)",
        },
      };
  }
};

export const formatSupportRequestDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace("T", " ").replace("Z", "");

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};
