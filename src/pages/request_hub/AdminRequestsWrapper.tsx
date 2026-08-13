"use client";

import React from "react";
import RequestsHub from "./RequestHub";
import PendingEditRequestsTable from "./PendingRequests";
import FormSubmissionRequests from "./FormSubmissionRequest";
import AdminSupportRequests from "./AdminSupportRequests";
import SupportRequestsPage from "../support_schedule/SupportRequestsPage";

export default function AdminRequestsWrapper() {
  return (
    <RequestsHub
      addInfoRequests={<PendingEditRequestsTable />}
      formSubmissionRequests={<FormSubmissionRequests />}
      supportRequests={<AdminSupportRequests />}
      supportCalls={<SupportRequestsPage embedded />}
    />
  );
}
