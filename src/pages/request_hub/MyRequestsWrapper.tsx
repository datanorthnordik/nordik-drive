"use client";

import React from "react";
import RequestsHub from "./RequestHub";

import UserAddInfoRequests from "./MyRequests";
import MyFormSubmissionRequests from "./MyFormSubmissionRequests";
import MySupportRequests from "./MySupportRequests";

export default function MyRequests() {
  return (
    <RequestsHub
      addInfoRequests={<UserAddInfoRequests />}
      formSubmissionRequests={<MyFormSubmissionRequests />}
      supportRequests={<MySupportRequests />}
    />
  );
}
