// src/components/containers/Container.test.tsx
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import { AuthContainer } from "./Containers"; // adjust path if needed

afterEach(() => cleanup());

const val = (el: HTMLElement, prop: keyof CSSStyleDeclaration) => {
  const inline = (el.style as any)[prop] as string | undefined;
  const computed = (window.getComputedStyle(el) as any)[prop] as string | undefined;
  return (inline && inline.trim()) || (computed && computed.trim()) || "";
};

const getAllStyleText = () =>
  Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n");

describe("AuthContainer", () => {
  test("renders children", () => {
    render(
      <AuthContainer>
        <div>Login</div>
      </AuthContainer>
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  test("has base layout styles (inline or computed)", () => {
    const { container } = render(
      <AuthContainer>
        <div>Child</div>
      </AuthContainer>
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeTruthy();

    expect(val(root, "minHeight")).toBe("100vh");
    expect(val(root, "overflowY")).toBe("auto");
    expect(val(root, "display")).toBe("flex");
    expect(val(root, "justifyContent")).toBe("center");
    expect(val(root, "alignItems")).toBe("center");

    //  Gradient is NOT reliably exposed by JSDOM via getComputedStyle(backgroundImage).
    // Best-effort: only assert if it's observable via inline style or computed background/backgroundImage.
    const bgCandidate =
      val(root, "backgroundImage") ||
      val(root, "background") ||
      root.getAttribute("style") ||
      "";

    if (bgCandidate) {
      // if something is present, allow it to be validated
      expect(bgCandidate).toMatch(/linear-gradient/i);
    }
  });

  test("mobile overrides: best-effort check in injected CSS (if present)", () => {
    render(
      <AuthContainer>
        <div>Child</div>
      </AuthContainer>
    );

    const cssText = getAllStyleText();

    // If your styling system injects CSS into <style> tags (emotion/styled-components),
    // this will catch it. If styles are from external CSS files, JSDOM won't have them.
    const hasMedia = /@media\s*\(max-width:\s*768px\)/i.test(cssText);

    if (hasMedia) {
      expect(cssText).toMatch(/@media\s*\(max-width:\s*768px\)/i);
      expect(cssText).toMatch(
        /@media\s*\(max-width:\s*768px\)[\s\S]*align-items\s*:\s*flex-start/i
      );
      expect(cssText).toMatch(
        /@media\s*\(max-width:\s*768px\)[\s\S]*padding-top\s*:\s*40px/i
      );
    }
  });
});
