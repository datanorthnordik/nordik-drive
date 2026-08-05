"use client";

import React from "react";
import RequestsHub from "./RequestHub";

import UserAddInfoRequests from "./MyRequests";
import MyFormSubmissionRequests from "./MyFormSubmissionRequests";
import MySupportRequests from "./MySupportRequests";
import SupportCallsPage from "../support_schedule/SupportCallsPage";

export default function MyRequests() {
  return (
    <RequestsHub
      addInfoRequests={<UserAddInfoRequests />}
      formSubmissionRequests={<MyFormSubmissionRequests />}
      supportRequests={<MySupportRequests />}
      supportCalls={<SupportCallsPage embedded />}
    />
  );
}
