import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import DataGridStyles from "./DataGridStyles";
import {
  color_secondary,
  color_blue_lightest,
  color_blue_light,
  color_blue_lighter,
  color_white,
  color_border,
  color_secondary_dark,
  color_black_light,
} from "../../constants/colors";

describe("DataGridStyles", () => {
  const renderComponent = () => render(<DataGridStyles />);

  const getCss = (container: HTMLElement) =>
    (container.querySelector("style")?.textContent || "").replace(/\s+/g, " ");

  it("renders a style tag", () => {
    const { container } = renderComponent();

    const styleEl = container.querySelector("style");

    expect(styleEl).toBeInTheDocument();
    expect(styleEl?.textContent).toBeTruthy();
  });

  it("contains AG Grid header and row styles with the correct theme colors", () => {
    const { container } = renderComponent();
    const css = getCss(container);

    expect(css).toContain(".ag-theme-quartz .bold-header");
    expect(css).toContain(`background-color: ${color_blue_lightest} !important;`);
    expect(css).toContain(`color: ${color_secondary} !important;`);

    expect(css).toContain(".ag-theme-quartz .ag-row-selected");
    expect(css).toContain(`background-color: ${color_blue_light} !important;`);

    expect(css).toContain(".ag-theme-quartz .ag-row:hover");
    expect(css).toContain(`background-color: ${color_blue_lighter} !important;`);
  });

  it("contains paging and pinned column layout rules", () => {
    const { container } = renderComponent();
    const css = getCss(container);

    expect(css).toContain(".ag-theme-quartz .ag-paging-panel");
    expect(css).toContain("display: none !important;");

    expect(css).toContain(".ag-pinned-left-cols-container, .ag-pinned-left-header");
    expect(css).toContain("width: max-content !important;");
  });

  it("contains responsive mobile and tablet media query rules", () => {
    const { container } = renderComponent();
    const css = getCss(container);

    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain(".mobile-filter-button { display: inline-flex !important;");
    expect(css).toContain(".left-panel { display: none !important; }");

    expect(css).toContain("@media (min-width: 900px) and (max-width: 1200px)");
    expect(css).toContain("flex: 0 0 40% !important;");
    expect(css).toContain("max-width: 40% !important;");
  });

  it("contains top controls, NIA slot, and focus-visible accessibility styles", () => {
    const { container } = renderComponent();
    const css = getCss(container);

    expect(css).toContain(".top-controls-bar");
    expect(css).toContain("scrollbar-width: none;");
    expect(css).toContain(".top-controls-bar::-webkit-scrollbar");
    expect(css).toContain("display: none;");

    expect(css).toContain(".nia-slot");
    expect(css).toContain("height: 56px;");

    expect(css).toContain(".community-action-btn:focus-visible");
    expect(css).toContain(`outline: 3px solid ${color_blue_light};`);
  });

  it("contains community action bar/button/message styling with the correct colors", () => {
    const { container } = renderComponent();
    const css = getCss(container);

    expect(css).toContain(".community-action-bar");
    expect(css).toContain(`background: ${color_white};`);
    expect(css).toContain(`border: 1px solid ${color_border};`);

    expect(css).toContain(".community-action-btn");
    expect(css).toContain(`background: ${color_secondary};`);
    expect(css).toContain(`color: ${color_white};`);

    expect(css).toContain(".community-action-btn:hover");
    expect(css).toContain(`background: ${color_secondary_dark};`);

    expect(css).toContain(".community-action-msg");
    expect(css).toContain(`background: ${color_blue_lightest};`);
    expect(css).toContain(`border: 1px solid ${color_blue_light};`);
    expect(css).toContain(`color: ${color_black_light};`);

    expect(css).toContain(".community-action-msg-icon");
    expect(css).toContain(`background: ${color_white};`);
    expect(css).toContain(`color: ${color_secondary};`);
  });

  it("contains AG Grid header overflow handling rules", () => {
    const { container } = renderComponent();
    const css = getCss(container);

    expect(css).toContain(".ag-header-cell-label");
    expect(css).toContain(".ag-header-cell-text");
    expect(css).toContain(".ag-header-cell-comp-wrapper");

    expect(css).toContain("width: 100%;");
    expect(css).toContain("overflow: hidden;");
    expect(css).toContain("white-space: nowrap;");
  });
});