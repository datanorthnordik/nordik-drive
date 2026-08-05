import { apiRequest } from "../../hooks/useFetch";
import { apiUrl } from "../../config/api";

export type SupportSettings = {
  time_zone: string;
  workday_start: string;
  workday_end: string;
  allowed_durations: number[];
  default_duration_minutes: number;
  booking_horizon_days: number;
};

export type SupportStaff = { user_id: number; firstname: string; lastname: string };
export type SupportSlot = { start_at: string; end_at: string };
export type SupportAvailability = {
  date: string;
  duration_minutes: number;
  assigned_staff?: { id: number; firstname: string; lastname: string };
  slots: SupportSlot[];
};

export type SupportCall = {
  id: number;
  created_by_id: number;
  requested_staff_id?: number;
  assigned_user_id?: number;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  status: string;
  subject: string;
  message: string;
  meeting_status: string;
  actual_minutes: number;
  created_by?: { id: number; firstname: string; lastname: string };
  requested_staff?: { id: number; firstname: string; lastname: string };
  assigned_user?: { id: number; firstname: string; lastname: string };
};

export type DailyAssignment = {
  id: number;
  schedule_date: string;
  status: string;
  reason: string;
  assigned_user_id?: number;
  assigned_user?: { id: number; firstname: string; lastname: string };
};

export type UnavailabilityInput = {
  user_id?: number;
  all_team: boolean;
  starts_at: string;
  ends_at: string;
  reason: string;
};

const base = "support-schedule";

export const supportScheduleApi = {
  settings: () => apiRequest<SupportSettings>(apiUrl(`${base}/settings`), "GET"),
  team: () => apiRequest<SupportStaff[]>(apiUrl(`${base}/team`), "GET"),
  availability: (date: string, duration: number, staffId?: number) => {
    const staffParam = staffId ? `&staff_id=${staffId}` : "";
    return apiRequest<SupportAvailability>(apiUrl(`${base}/availability?date=${encodeURIComponent(date)}&duration_minutes=${duration}${staffParam}`), "GET");
  },
  schedule: () => apiRequest<DailyAssignment[]>(apiUrl(`${base}/schedule`), "GET"),
  calls: (scope = "mine") => apiRequest<SupportCall[]>(apiUrl(`${base}/calls?scope=${scope}`), "GET"),
  createCall: (body: Record<string, unknown>) => apiRequest<SupportCall>(apiUrl(`${base}/calls`), "POST", body),
  approve: (id: number, approved: boolean, note = "") => apiRequest<SupportCall>(apiUrl(`${base}/calls/${id}/approval`), "PUT", { approved, note }),
  complete: (id: number, actualStart: string, actualEnd: string) => apiRequest<SupportCall>(apiUrl(`${base}/calls/${id}/complete`), "PUT", { actual_start: actualStart, actual_end: actualEnd }),
  reassignCall: (id: number, userId: number, reason: string) => apiRequest<SupportCall>(apiUrl(`${base}/calls/${id}/reassign`), "PUT", { user_id: userId, reason }),
  reassignDay: (date: string, userId: number, reason: string) => apiRequest<DailyAssignment>(apiUrl(`${base}/schedule/${date}/reassign`), "PUT", { user_id: userId, reason }),
  createUnavailability: (body: UnavailabilityInput) => apiRequest(apiUrl(`${base}/unavailability`), "POST", body),
  runMaintenance: () => apiRequest<void>(apiUrl(`${base}/maintenance`), "POST"),
};
