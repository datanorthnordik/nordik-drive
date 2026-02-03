import React from "react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { AdminTab, AdminTabWrapper } from "./Tabs"; // <-- adjust path
import { color_primary, color_secondary } from "../constants/colors"; // <-- adjust if needed

const getCss = (ui: React.ReactElement) => {
  const sheet = new ServerStyleSheet();
  try {
    renderToString(sheet.collectStyles(ui));
    return sheet.getStyleTags();
  } finally {
    sheet.seal();
  }
};

describe("AdminTab / AdminTabWrapper styled-components", () => {
  test("AdminTab injects base styles and hover + selected rules", () => {
    // note: MUI Tab renders fine server-side
    const css = getCss(<AdminTab label="Users" />);

    // base layout + typography
    expect(css).toMatch(/flex-direction:\s*row/i);
    expect(css).toMatch(/gap:\s*6px/i);
    expect(css).toMatch(/justify-content:\s*center/i);
    expect(css).toMatch(/align-items:\s*center/i);
    expect(css).toMatch(/font-size:\s*0\.85rem/i);
    expect(css).toMatch(/text-transform:\s*none/i);

    // border + radius + spacing
    expect(css).toMatch(new RegExp(`border:\\s*2px\\s+solid\\s+${color_secondary}`, "i"));
    expect(css).toMatch(/border-radius:\s*8px/i);
    expect(css).toMatch(/padding:\s*6px\s+14px/i);
    expect(css).toMatch(/min-width:\s*120px/i);
    expect(css).toMatch(/font-weight:\s*600/i);

    // base color
    expect(css).toMatch(new RegExp(`color:\\s*${color_secondary}`, "i"));

    // hover rules
    expect(css).toMatch(new RegExp(`:hover\\{[^}]*border-color:\\s*${color_primary}`, "i"));
    expect(css).toMatch(new RegExp(`:hover\\{[^}]*color:\\s*${color_primary}`, "i"));

    // selected class rules
    // styled-components will output something like `.xyz.Mui-selected{...}`
    const selectedBorder = new RegExp(`Mui-selected\\{[^}]*border-color:\\s*${color_primary}`, "i");
    const selectedColor = new RegExp(`Mui-selected\\{[^}]*color:\\s*${color_primary}`, "i");
    expect(css).toMatch(selectedBorder);
    expect(css).toMatch(selectedColor);
  });

  test("AdminTabWrapper injects flex container gap and hides indicator", () => {
    const css = getCss(
      <AdminTabWrapper value={0}>
        <AdminTab label="One" />
        <AdminTab label="Two" />
      </AdminTabWrapper>
    );

    // targets internal MUI classes
    expect(css).toMatch(/\.MuiTabs-flexContainer\s*\{[^}]*gap:\s*20px/i);
    expect(css).toMatch(/\.MuiTabs-indicator\s*\{[^}]*display:\s*none/i);
  });
});
