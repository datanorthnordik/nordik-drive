import React from "react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { LegendWrapper, LegendItem } from "./Legent"

const getCss = (ui: React.ReactElement) => {
  const sheet = new ServerStyleSheet();
  try {
    renderToString(sheet.collectStyles(ui));
    return sheet.getStyleTags();
  } finally {
    sheet.seal();
  }
};

describe("Legend styled-components", () => {
  test("LegendWrapper injects expected layout styles", () => {
    const css = getCss(
      <LegendWrapper>
        <div>One</div>
      </LegendWrapper>
    );

    expect(css).toMatch(/display:\s*flex/);
    expect(css).toMatch(/flex-wrap:\s*wrap/);
    expect(css).toMatch(/gap:\s*8px/);
    expect(css).toMatch(/margin-bottom:\s*12px/);
  });

  test("LegendItem injects styles when active=true", () => {
    const css = getCss(
      <LegendItem color="#ff0000" active={true}>
        Active
      </LegendItem>
    );

    // fixed properties
    expect(css).toMatch(/padding:\s*6px\s+12px/);
    expect(css).toMatch(/border-radius:\s*6px/);
    expect(css).toMatch(/cursor:\s*pointer/);
    expect(css).toMatch(/transition:\s*all\s+0\.2s/);

    // prop-driven
    expect(css).toMatch(/background-color:\s*#ff0000/i);
    expect(css).toMatch(/opacity:\s*1(\D|;)/); // 1 or 1.0
    expect(css).toMatch(/font-weight:\s*bold/);
    expect(css).toMatch(/border:\s*2px\s+solid\s+#000/i);

    // color for non-white background => white text
    expect(css).toMatch(/color:\s*#fff/i);
  });

  test("LegendItem injects styles when active=false", () => {
    const css = getCss(
      <LegendItem color="#00ff00" active={false}>
        Inactive
      </LegendItem>
    );

    expect(css).toMatch(/background-color:\s*#00ff00/i);
    expect(css).toMatch(/opacity:\s*0\.6/);
    expect(css).toMatch(/font-weight:\s*normal/);
    expect(css).toMatch(/border:\s*2px\s+solid\s+transparent/i);

    // non-white bg => white text
    expect(css).toMatch(/color:\s*#fff/i);
  });

  test("LegendItem uses black text when background is white (#ffffff)", () => {
    const css = getCss(
      <LegendItem color="#ffffff" active={true}>
        White
      </LegendItem>
    );

    expect(css).toMatch(/background-color:\s*#ffffff/i);
    expect(css).toMatch(/color:\s*#000/i);
  });
});
