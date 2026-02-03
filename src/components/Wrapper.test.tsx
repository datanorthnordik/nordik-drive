// src/components/Wrapper.test.tsx
import React from "react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

import {
  GridWrapper,
  FileListWrapper,
  LayoutWrapper,
  NavWrapper,
  AdminPanelWrapper,
  FileWrapper,
  AuthWrapper,
  FormWrapper,
  DataTableWrapper,
  ActivityTableWrapper,
} from "./Wrappers";

import { header_height, header_mobile_height } from "../constants/colors";

const getCss = (ui: React.ReactElement) => {
  const sheet = new ServerStyleSheet();
  try {
    renderToString(sheet.collectStyles(ui));
    return sheet.getStyleTags();
  } finally {
    sheet.seal();
  }
};

const norm = (s: string) => s.replace(/\s+/g, "");

describe("Wrappers styled-components", () => {
  test("GridWrapper injects base styles + nested selector + media query", () => {
    const css = norm(getCss(<GridWrapper />));

    expect(css).toContain("display:flex");
    expect(css).toContain("flex-direction:column");
    expect(css).toContain(`height:calc(100vh-${header_height})`);
    expect(css).toContain(`margin-top:${header_height}`);
    expect(css).toContain(".ag-header-cell-label{font-weight:bold;}");
    expect(css).toContain("@mediascreenand(max-width:600px){");
    expect(css).toContain(`margin-top:${header_mobile_height}`);
    expect(css).toContain(`height:calc(100vh-${header_mobile_height})`);
  });

  test("FileListWrapper injects base styles + media query", () => {
    const css = norm(getCss(<FileListWrapper />));

    expect(css).toContain("width:100%");
    expect(css).toContain("display:flex");
    expect(css).toContain("flex-wrap:wrap");
    expect(css).toContain(`margin-top:${header_height}`);
    expect(css).toContain("align-items:center");
    expect(css).toContain("justify-content:flex-start");
    expect(css).toContain("gap:10px");
    expect(css).toContain("padding:30px5%");
    expect(css).toContain("@mediascreenand(max-width:400px){");
    expect(css).toContain(`margin-top:${header_mobile_height}`);
  });

  test("LayoutWrapper injects layout styles", () => {
    const css = norm(getCss(<LayoutWrapper />));

    expect(css).toContain("display:flex");
    expect(css).toContain("flex-direction:column");
    expect(css).toContain("box-sizing:border-box");
    expect(css).toContain("background-color:#f8f9fa");
    expect(css).toContain("min-height:100vh");
    expect(css).toContain("width:100%");
  });

  test("NavWrapper injects base styles + child selector + media queries", () => {
    const css = norm(getCss(<NavWrapper />));

    expect(css).toContain("flex:1");
    expect(css).toContain("display:flex");
    expect(css).toContain("justify-content:center");

    expect(css).toContain("@mediascreenand(max-width:500px){");
    expect(css).toContain(">*{margin:0px;}");

    expect(css).toContain("@mediascreenand(max-width:600px){");
    expect(css).toContain("padding-top:2rem");
  });

  test("AdminPanelWrapper injects base styles + media queries", () => {
    const css = norm(getCss(<AdminPanelWrapper />));

    expect(css).toContain("display:flex");
    expect(css).toContain("flex-direction:column");
    expect(css).toContain("gap:20px");
    expect(css).toContain(`margin-top:${header_height}`);
    expect(css).toContain("padding:30px5%");

    expect(css).toContain("@mediascreenand(max-width:600px){");
    expect(css).toContain(`margin-top:${header_mobile_height}`);

    expect(css).toContain("@mediascreenand(max-width:400px){");
    expect(css).toContain("margin-top:7rem");
  });

  test("FileWrapper injects base styles + child flex rule", () => {
    const css = norm(getCss(<FileWrapper />));

    expect(css).toContain("display:flex");
    expect(css).toContain("width:100%");
    expect(css).toContain("align-items:flex-start");
    expect(css).toContain("gap:20px");
    expect(css).toContain(">*{flex:1;}");
  });

  test("AuthWrapper injects base styles + nested h2 + media query", () => {
    const css = norm(getCss(<AuthWrapper />));

    expect(css).toContain("display:flex");
    expect(css).toContain("width:100%");
    expect(css).toContain("max-width:580px");
    expect(css).toContain("flex-direction:column");
    expect(css).toContain("border-radius:12px");
    expect(css).toContain("box-sizing:border-box");
    expect(css).toContain("background:#fff");
    expect(css).toContain("margin:2rem");

    expect(css).toContain(
      "box-shadow:04px12pxrgba(0,0,0,0.15),016px32pxrgba(0,0,0,0.1)"
    );

    expect(css).toContain(
      "h2{font-size:28px;font-weight:600;text-align:center;margin-bottom:32px;color:#2c3e50;letter-spacing:-0.5px;}"
    );

    expect(css).toContain("@media(max-width:768px){");
    expect(css).toContain("padding:24px");
    expect(css).toContain("margin:1rem");
    expect(css).toContain("max-width:90%");
    expect(css).toContain("h2{font-size:24px;margin-bottom:24px;}");
  });

  test("FormWrapper injects base styles + nested classes", () => {
    const css = norm(getCss(<FormWrapper />));

    expect(css).toContain("display:flex");
    expect(css).toContain("flex-direction:column");
    expect(css).toContain("align-items:center");
    expect(css).toContain("gap:.5rem");
    expect(css).toContain(".form-field{margin-bottom:8px;}");
    expect(css).toContain(
      ".form-actions{margin-top:16px;display:flex;flex-direction:column;gap:.5rem;align-items:center;}"
    );
  });

  test("DataTableWrapper injects base styles + media query", () => {
    const css = norm(getCss(<DataTableWrapper />));

    expect(css).toContain("display:flex");
    expect(css).toContain("flex-direction:column");
    expect(css).toContain(`height:calc(100vh-${header_height})`);
    expect(css).toContain("padding:8px");
    expect(css).toContain("box-sizing:border-box");

    expect(css).toContain("@mediascreenand(max-width:600px){");
    expect(css).toContain(`height:calc(100vh-${header_mobile_height})`);
  });

  test("ActivityTableWrapper injects base styles + media query", () => {
    const css = norm(getCss(<ActivityTableWrapper />));

    expect(css).toContain("display:flex");
    expect(css).toContain("flex-direction:column");
    expect(css).toContain(`height:calc(100vh-${header_height})`);
    expect(css).toContain("box-sizing:border-box");
    expect(css).toContain(`margin-top:${header_height}`);
    expect(css).toContain("padding:10px5%");

    expect(css).toContain("@mediascreenand(max-width:600px){");
    expect(css).toContain(`margin-top:${header_mobile_height}`);
    expect(css).toContain(`height:calc(100vh-${header_mobile_height})`);
  });
});
