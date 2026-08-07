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

export type SupportPerson = { id: number; firstname: string; lastname: string; email?: string };
export type SupportStaff = { user_id: number; firstname: string; lastname: string };
export type SupportSlot = { start_at: string; end_at: string; unavailable_reason?: string };
export type SupportAvailability = {
  date: string;
  duration_minutes: number;
  assigned_staff?: SupportPerson;
  slots: SupportSlot[];
  unavailable_slots: SupportSlot[];
};

export type SupportCalendarDay = {
  date: string;
  assigned_staff?: SupportPerson;
  status: "available" | "partial_availability" | "fully_unavailable" | "fully_booked" | "uncovered" | "weekend";
  status_message: string;
  is_bookable: boolean;
  available_slot_count: number;
  scheduled_call_count: number;
  is_assigned_to_viewer: boolean;
  unavailable_periods?: StaffAvailability[];
  scheduled_calls?: SupportCall[];
};

export type SupportCalendar = {
  time_zone: string;
  duration_minutes: number;
  days: SupportCalendarDay[];
};

export type SupportCall = {
  id: number;
  support_request_id: number;
  assigned_staff_id?: number;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  actual_duration_minutes: number;
  status: SupportRequestStatus;
  internal_notes: string;
  assigned_staff?: SupportPerson;
};

export type SupportRequestStatus =
  | "pending"
  | "awaiting_assignee_approval"
  | "approved"
  | "alternative_time_proposed"
  | "rejected"
  | "cancelled"
  | "completed";

export type SupportRequest = {
  id: number;
  requested_by_user_id: number;
  request_type: "automatic_daily_assignee" | "specific_support_person";
  requested_date: string;
  preferred_start_time?: string;
  preferred_end_time?: string;
  requested_staff_id?: number;
  assigned_staff_id?: number;
  status: SupportRequestStatus;
  subject: string;
  description: string;
  rejection_reason: string;
  alternative_start_time?: string;
  alternative_end_time?: string;
  created_at: string;
  requested_by?: SupportPerson;
  requested_staff?: SupportPerson;
  assigned_staff?: SupportPerson;
  call?: SupportCall;
};

export type SupportAssignment = {
  id: number;
  assignment_date: string;
  primary_assignee_id?: number;
  assignment_source: string;
  previous_assignee_id?: number;
  reassignment_reason: string;
  primary_assignee?: SupportPerson;
};

export type StaffAvailability = {
  id: number;
  staff_id: number;
  availability_date: string;
  full_day_unavailable: boolean;
  unavailable_start_time?: string;
  unavailable_end_time?: string;
  reason: string;
  staff?: SupportPerson;
};

export type SupportProfile = {
  assignments: SupportAssignment[];
  upcoming_calls: SupportCall[];
  direct_requests: SupportRequest[];
  availability: StaffAvailability[];
};

export type FairnessStat = {
  staff: SupportStaff;
  actual_completed_minutes: number;
  actual_completed_hours: number;
  assigned_days: number;
  last_assignment_date?: string;
};

const base = "support-schedule";

export const supportScheduleApi = {
  settings: () => apiRequest<SupportSettings>(apiUrl(`${base}/settings`), "GET"),
  team: () => apiRequest<SupportStaff[]>(apiUrl(`${base}/team`), "GET"),
  availability: (date: string, duration: number, staffId?: number) => {
    const staffParam = staffId ? `&staff_id=${staffId}` : "";
    return apiRequest<SupportAvailability>(apiUrl(`${base}/availability?date=${encodeURIComponent(date)}&duration_minutes=${duration}${staffParam}`), "GET");
  },
  calendar: (duration: number, staffId?: number) => {
    const staffParam = staffId ? `&staff_id=${staffId}` : "";
    return apiRequest<SupportCalendar>(apiUrl(`${base}/calendar?duration_minutes=${duration}${staffParam}`), "GET");
  },
  requests: (scope = "mine") => apiRequest<SupportRequest[]>(apiUrl(`${base}/requests?scope=${scope}`), "GET"),
  createRequest: (body: Record<string, unknown>) => apiRequest<SupportRequest>(apiUrl(`${base}/requests`), "POST", body),
  decideRequest: (id: number, body: Record<string, unknown>) => apiRequest<SupportRequest>(apiUrl(`${base}/requests/${id}/decision`), "PUT", body),
  acceptAlternative: (id: number) => apiRequest<SupportRequest>(apiUrl(`${base}/requests/${id}/accept-alternative`), "PUT"),
  cancelRequest: (id: number) => apiRequest<SupportRequest>(apiUrl(`${base}/requests/${id}/cancel`), "PUT"),
  calls: (scope = "mine") => apiRequest<SupportCall[]>(apiUrl(`${base}/calls?scope=${scope}`), "GET"),
  complete: (id: number, actualStart: string, actualEnd: string, internalNotes: string) => apiRequest<SupportCall>(apiUrl(`${base}/calls/${id}/complete`), "PUT", { actual_start: actualStart, actual_end: actualEnd, internal_notes: internalNotes }),
  reassignCall: (id: number, userId: number, reason: string) => apiRequest<SupportCall>(apiUrl(`${base}/calls/${id}/reassign`), "PUT", { user_id: userId, reason }),
  schedule: () => apiRequest<SupportAssignment[]>(apiUrl(`${base}/schedule`), "GET"),
  reassignDay: (date: string, userId: number, reason: string) => apiRequest<SupportAssignment>(apiUrl(`${base}/schedule/${date}/reassign`), "PUT", { user_id: userId, reason }),
  fairness: () => apiRequest<FairnessStat[]>(apiUrl(`${base}/fairness`), "GET"),
  profile: () => apiRequest<SupportProfile>(apiUrl(`${base}/profile`), "GET"),
  profileAvailability: () => apiRequest<StaffAvailability[]>(apiUrl(`${base}/profile/availability`), "GET"),
  createAvailability: (body: Record<string, unknown>) => apiRequest<StaffAvailability>(apiUrl(`${base}/profile/availability`), "POST", body),
  updateAvailability: (id: number, body: Record<string, unknown>) => apiRequest<StaffAvailability>(apiUrl(`${base}/profile/availability/${id}`), "PUT", body),
  deleteAvailability: (id: number) => apiRequest<void>(apiUrl(`${base}/profile/availability/${id}`), "DELETE"),
};
