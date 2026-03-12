"use client";

import React from "react";
import RequestsHub from "./RequestHub";
import PendingEditRequestsTable from "./PendingRequests";
import FormSubmissionRequests from "./FormSubmissionRequest";

export default function AdminRequestsWrapper() {
  return (
    <RequestsHub
      addInfoRequests={<PendingEditRequestsTable />}
      formSubmissionRequests={<FormSubmissionRequests />}
    />
  );
}