"use client";

import React from "react";
import RequestsHub from "./RequestHub";

import UserAddInfoRequests from "./MyRequests";
import MyFormSubmissionRequests from "./MyFormSubmissionRequests";

export default function MyRequests() {
  return (
    <RequestsHub
      addInfoRequests={<UserAddInfoRequests />}
      formSubmissionRequests={<MyFormSubmissionRequests />}
    />
  );
}