import React from "react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

import { LinkButton, SecondaryButton, HeaderLink, WebLink } from "./Links"; // adjust path
import { color_primary, color_secondary, color_secondary_dark } from "../constants/colors"; // adjust path

// ✅ Virtual mock: works even if react-router-dom is NOT installed
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");

    const NavLink = React.forwardRef(
      (
        {
          to,
          className,
          children,
          ...rest
        }: {
          to: string;
          className?: string;
          children?: React.ReactNode;
        } & React.AnchorHTMLAttributes<HTMLAnchorElement>,
        ref: React.Ref<HTMLAnchorElement>
      ) => (
        <a ref={ref} href={to} className={className} {...rest}>
          {children}
        </a>
      )
    );

    return { NavLink };
  },
  { virtual: true }
);

const getCss = (ui: React.ReactElement) => {
  const sheet = new ServerStyleSheet();
  try {
    renderToString(sheet.collectStyles(ui));
    return sheet.getStyleTags();
  } finally {
    sheet.seal();
  }
};

describe("Links styled-components", () => {
  test("LinkButton base + hover/focus", () => {
    const css = getCss(<LinkButton>Text</LinkButton>);

    expect(css).toMatch(new RegExp(`color:\\s*${color_secondary}`, "i"));
    expect(css).toMatch(/cursor:\s*pointer/i);
    expect(css).toMatch(/font-weight:\s*600/i);
    expect(css).toMatch(/font-size:\s*16px/i);
    expect(css).toMatch(/text-decoration:\s*underline/i);

    expect(css).toMatch(new RegExp(`:hover\\{[^}]*color:\\s*${color_primary}`, "i"));
    expect(css).toMatch(/:hover\{[^}]*text-decoration-thickness:\s*2px/i);
    expect(css).toMatch(/:hover\{[^}]*transform:\s*translateY\(-1px\)/i);

    expect(css).toMatch(
      new RegExp(`:focus\\{[^}]*outline:\\s*2px\\s+solid\\s+${color_primary}`, "i")
    );
    expect(css).toMatch(/:focus\{[^}]*outline-offset:\s*2px/i);
  });

  test("SecondaryButton base + hover/focus", () => {
    const css = getCss(<SecondaryButton>Secondary</SecondaryButton>);

    expect(css).toMatch(/background:\s*transparent/i);
    expect(css).toMatch(new RegExp(`border:\\s*2px\\s+solid\\s+${color_primary}`, "i"));
    expect(css).toMatch(new RegExp(`color:\\s*${color_primary}`, "i"));
    expect(css).toMatch(/min-height:\s*48px/i);

    expect(css).toMatch(new RegExp(`:hover\\{[^}]*background:\\s*${color_primary}`, "i"));
    expect(css).toMatch(/:hover\{[^}]*color:\s*white/i);
    expect(css).toMatch(/:hover\{[^}]*transform:\s*translateY\(-2px\)/i);

    expect(css).toMatch(
      new RegExp(`:focus\\{[^}]*outline:\\s*2px\\s+solid\\s+${color_primary}`, "i")
    );
  });

  test("HeaderLink base + hover + active + media + fullWidth prop", () => {
    const css = getCss(
      <HeaderLink to="/test" fullWidth>
        Test
      </HeaderLink>
    );

    expect(css).toMatch(/color:\s*#003366/i);
    expect(css).toMatch(/display:\s*flex/i);
    expect(css).toMatch(/padding:\s*12px\s+16px/i);
    expect(css).toMatch(/border-radius:\s*6px/i);

    expect(css).toMatch(/width:\s*100%/i);

    expect(css).toMatch(new RegExp(`:hover\\{[^}]*background-color:\\s*${color_secondary}`, "i"));
    expect(css).toMatch(/:hover\{[^}]*color:\s*white/i);

    expect(css).toMatch(new RegExp(`\\.active\\{[^}]*background-color:\\s*${color_secondary_dark}`, "i"));
    expect(css).toMatch(/\.active\{[^}]*color:\s*white/i);

    expect(css).toMatch(/@media\s+screen\s+and\s+\(max-width:\s*600px\)/i);
  });

  test("WebLink underline + pointer cursor", () => {
    const css = getCss(<WebLink href="https://example.com">Link</WebLink>);
    expect(css).toMatch(/text-decoration:\s*underline/i);
    expect(css).toMatch(/cursor:\s*pointer/i);
  });
});
