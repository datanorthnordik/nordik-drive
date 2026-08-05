"use client";

import React from "react";
import RequestsHub from "./RequestHub";
import PendingEditRequestsTable from "./PendingRequests";
import FormSubmissionRequests from "./FormSubmissionRequest";
import AdminSupportRequests from "./AdminSupportRequests";
import SupportCallsPage from "../support_schedule/SupportCallsPage";

export default function AdminRequestsWrapper() {
  return (
    <RequestsHub
      addInfoRequests={<PendingEditRequestsTable />}
      formSubmissionRequests={<FormSubmissionRequests />}
      supportRequests={<AdminSupportRequests />}
      supportCalls={<SupportCallsPage embedded />}
    />
  );
}
