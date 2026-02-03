import React from "react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

import { NavContainer } from "./NavContainer"; // <-- adjust path

const getCss = (ui: React.ReactElement) => {
  const sheet = new ServerStyleSheet();
  try {
    renderToString(sheet.collectStyles(ui));
    return sheet.getStyleTags();
  } finally {
    sheet.seal();
  }
};

describe("NavContainer", () => {
  test("injects expected flex layout styles", () => {
    const css = getCss(
      <NavContainer>
        <div>left</div>
        <div>right</div>
      </NavContainer>
    );

    expect(css).toMatch(/flex:\s*1/i);
    expect(css).toMatch(/display:\s*flex/i);
    expect(css).toMatch(/align-items:\s*center/i);
    expect(css).toMatch(/justify-content:\s*space-between/i);
    expect(css).toMatch(/margin:\s*0%/i);
  });
});
