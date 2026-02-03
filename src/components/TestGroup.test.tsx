import React from "react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

import TextGroup, { CheckBoxWrapper } from "./TextGroup"; // <-- adjust path
import { color_secondary } from "../constants/colors"; // <-- adjust if needed

const getCss = (ui: React.ReactElement) => {
    const sheet = new ServerStyleSheet();
    try {
        renderToString(sheet.collectStyles(ui));
        return sheet.getStyleTags();
    } finally {
        sheet.seal();
    }
};

describe("TextGroup + CheckBoxWrapper styled-components", () => {
    test("TextGroup injects base flex layout styles", () => {
        const css = getCss(
            <TextGroup>
                <div>Left</div>
                <div>Right</div>
            </TextGroup>
        );

        expect(css).toMatch(/display:\s*flex/i);
        expect(css).toMatch(/flex-direction:\s*row/i);
        expect(css).toMatch(/gap:\s*10px/i);
        expect(css).toMatch(/width:\s*100%/i);
    });

    test("TextGroup sets child width to default 50% when no width prop is provided", () => {
        const css = getCss(
            <TextGroup>
                <div>Child</div>
            </TextGroup>
        );

        // styled-components compiles "& > *" into ".class>*"
        expect(css).toMatch(/>\*\{width:\s*50%/i);
    });

    test("CheckBoxWrapper applies secondary color when Mui-checked class is present", () => {
        const css = getCss(<CheckBoxWrapper checked />);

        // styled rule: &.Mui-checked { color: color_secondary !important }
        const checkedRule = new RegExp(`\\.Mui-checked\\{[^}]*color:\\s*${color_secondary}`, "i");
        expect(css).toMatch(checkedRule);
        expect(css).toMatch(/!important/i);
    });
});
