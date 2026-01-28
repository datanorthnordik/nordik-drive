import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import CoronerPage from "./CoronerPage";

describe("CoronerPage", () => {
  test("renders main title and key section headings", () => {
    render(<CoronerPage />);

    expect(screen.getByText("Office of the Chief Coroner for Ontario")).toBeInTheDocument();
    expect(screen.getByText("Residential Schools Death Investigation Team (RSDIT)")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Most Documents are in the Public Domain")).toBeInTheDocument();
    expect(screen.getByText("Contact Information")).toBeInTheDocument();
  });

  test("renders contact emails as mailto links", () => {
    render(<CoronerPage />);

    const markLink = screen.getByRole("link", { name: "mark.mackisoc@ontario.ca" });
    expect(markLink).toHaveAttribute("href", "mailto:mark.mackisoc@ontario.ca");

    const jannaLink = screen.getByRole("link", { name: "janna.miller@ontario.ca" });
    expect(jannaLink).toHaveAttribute("href", "mailto:janna.miller@ontario.ca");
  });

  test("renders the closing quote", () => {
    render(<CoronerPage />);

    expect(
      screen.getByText(/We ensure no death goes overlooked, ignored or concealed/i)
    ).toBeInTheDocument();
  });
});
