import React from "react";
import renderer from "react-test-renderer";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

import BorderLine from "./BorderLine";
import { color_border } from "../constants/colors";

const getCss = () => {
  const sheet = new ServerStyleSheet();
  try {
    renderToString(sheet.collectStyles(<BorderLine />));
    return sheet.getStyleTags();
  } finally {
    sheet.seal();
  }
};

describe("BorderLine", () => {
  test("renders a div and matches snapshot", () => {
    const tree = renderer.create(<BorderLine />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test("injects expected base CSS", () => {
    const css = getCss();

    expect(css).toMatch(/height:\s*2px/);
    expect(css).toMatch(/width:\s*100%/);
    expect(css).toMatch(/margin:\s*24px\s+0/);
    expect(css).toMatch(/position:\s*relative/);

    const gradientRegex = new RegExp(
      `background:\\s*linear-gradient\\(90deg,\\s*transparent\\s*0%,\\s*${color_border}\\s*20%,\\s*${color_border}\\s*80%,\\s*transparent\\s*100%\\)`,
      "i"
    );
    expect(css).toMatch(gradientRegex);
  });

  test("injects expected ::before styles and OR label", () => {
    const css = getCss();

    expect(css).toMatch(/::before\{[^}]*content:\s*'OR'[^}]*\}/);
    expect(css).toMatch(/top:\s*50%/);
    expect(css).toMatch(/left:\s*50%/);
    expect(css).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);

    expect(css).toMatch(/background:\s*white/);
    expect(css).toMatch(/padding:\s*0\s+16px/);
    expect(css).toMatch(/font-size:\s*14px/);
    expect(css).toMatch(/font-weight:\s*600/);
    expect(css).toMatch(/color:\s*#6b7280/i);
    expect(css).toMatch(/letter-spacing:\s*1px/);
  });
});
