import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

import Loader from "./Loader"; // adjust path if needed
import { color_primary } from "../constants/colors"; // adjust if needed

const getCss = (ui: React.ReactElement) => {
  const sheet = new ServerStyleSheet();
  try {
    renderToString(sheet.collectStyles(ui));
    return sheet.getStyleTags();
  } finally {
    sheet.seal();
  }
};

describe("Loader", () => {
  test("renders default text 'Loading...'", () => {
    render(<Loader loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders custom text when provided", () => {
    render(<Loader loading={true} text="Please wait" />);
    expect(screen.getByText("Please wait")).toBeInTheDocument();
  });

  test("overlay display is flex when loading=true (CSS)", () => {
    const css = getCss(<Loader loading={true} />);
    // styled-components will generate `display:flex` (whitespace tolerant)
    expect(css).toMatch(/display:\s*flex/);
  });

  test("overlay display is none when loading=false (CSS)", () => {
    const css = getCss(<Loader loading={false} />);
    expect(css).toMatch(/display:\s*none/);
  });

  test("spinner has top border color set to primary and infinite rotation animation (CSS)", () => {
    const css = getCss(<Loader loading={true} />);

    // spinner rule includes border-top: 4px solid <primary>
    const borderTopRegex = new RegExp(
      `border-top:\\s*4px\\s+solid\\s+${color_primary}`,
      "i"
    );
    expect(css).toMatch(borderTopRegex);

    // animation exists; keyframe name is generated, so only check for infinite + linear + 1s
    expect(css).toMatch(/animation:\s*[^;]*\s1s\s+linear\s+infinite/i);

    // keyframes contain rotate(0deg) and rotate(360deg)
    expect(css).toMatch(/rotate\(0deg\)/i);
    expect(css).toMatch(/rotate\(360deg\)/i);
  });

  test("includes overlay positioning and z-index (CSS)", () => {
    const css = getCss(<Loader loading={true} />);

    expect(css).toMatch(/position:\s*fixed/i);
    expect(css).toMatch(/top:\s*0/i);
    expect(css).toMatch(/left:\s*0/i);
    expect(css).toMatch(/width:\s*100%/i);
    expect(css).toMatch(/height:\s*100%/i);
    expect(css).toMatch(/z-index:\s*9999/i);
    expect(css).toMatch(/justify-content:\s*center/i);
    expect(css).toMatch(/align-items:\s*center/i);
  });
});
