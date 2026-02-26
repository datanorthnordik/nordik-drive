import {
    URL_REGEX,
    cleanUrl,
    extractUrls,
    isDocumentUrl,
    linkLabel,
    normalizeUrl,
    openInNewTab,
} from "./urlUtils";

describe("URL_REGEX", () => {
    it("extracts http, https, and www urls correctly", () => {
        const text = "See https://a.com, http://b.com and www.c.com";
        expect(extractUrls(text)).toEqual([
            "https://a.com",
            "http://b.com",
            "https://www.c.com",
        ]);
    });
});

describe("normalizeUrl", () => {
    it("returns empty string for blank input", () => {
        expect(normalizeUrl("")).toBe("");
        expect(normalizeUrl("   ")).toBe("");
    });

    it("keeps http and https urls as-is", () => {
        expect(normalizeUrl("http://example.com")).toBe("http://example.com");
        expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    });

    it("adds https to www urls", () => {
        expect(normalizeUrl("www.example.com")).toBe("https://www.example.com");
    });

    it("trims whitespace before normalizing", () => {
        expect(normalizeUrl("  www.example.com  ")).toBe("https://www.example.com");
    });

    it("returns other strings unchanged", () => {
        expect(normalizeUrl("example.com")).toBe("example.com");
    });
});

describe("cleanUrl", () => {
    it("removes trailing punctuation", () => {
        expect(cleanUrl("https://example.com.)")).toBe("https://example.com");
        expect(cleanUrl("https://example.com],")).toBe("https://example.com");
        expect(cleanUrl("https://example.com...")).toBe("https://example.com");
    });

    it("does not remove valid inner punctuation", () => {
        expect(cleanUrl("https://example.com/a,b")).toBe("https://example.com/a,b");
    });
});

describe("extractUrls", () => {
    it("returns empty array for blank text", () => {
        expect(extractUrls("")).toEqual([]);
    });

    it("extracts, cleans, and normalizes urls", () => {
        const text =
            "Visit https://example.com/test.pdf), www.google.com, and http://abc.com.";
        expect(extractUrls(text)).toEqual([
            "https://example.com/test.pdf",
            "https://www.google.com",
            "http://abc.com",
        ]);
    });

    it("deduplicates identical urls after normalization", () => {
        const text = "www.example.com and https://www.example.com and www.example.com.";
        expect(extractUrls(text)).toEqual(["https://www.example.com"]);
    });

    it("returns empty array when no urls are present", () => {
        expect(extractUrls("No links here")).toEqual([]);
    });
});

describe("isDocumentUrl", () => {
    it("returns true for supported document/image extensions", () => {
        expect(isDocumentUrl("https://a.com/file.pdf")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.png")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.jpg")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.jpeg")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.webp")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.doc")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.docx")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.xls")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.xlsx")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.ppt")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.pptx")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.csv")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.txt")).toBe(true);
        expect(isDocumentUrl("https://a.com/file.json")).toBe(true);
    });

    it("ignores query params and is case-insensitive", () => {
        expect(isDocumentUrl("https://a.com/FILE.PDF?x=1")).toBe(true);
        expect(isDocumentUrl("https://a.com/IMG.JPEG?download=true")).toBe(true);
    });

    it("returns false for unsupported extensions", () => {
        expect(isDocumentUrl("https://a.com/file.html")).toBe(false);
        expect(isDocumentUrl("https://a.com/file")).toBe(false);
    });
});

describe("linkLabel", () => {
    it("returns the last path segment for short filenames", () => {
        expect(linkLabel("https://example.com/docs/file.pdf")).toBe("file.pdf");
    });

    it("decodes encoded path segments", () => {
        expect(linkLabel("https://example.com/docs/My%20File.pdf")).toBe("My File.pdf");
    });

    it("returns hostname when the last path segment is long", () => {
        expect(
            linkLabel("https://example.com/docs/averyveryveryverylongfilename-document.pdf")
        ).toBe("example.com");
    });

    it("returns hostname when there is no path segment", () => {
        expect(linkLabel("https://example.com")).toBe("example.com");
    });

    it("returns the original string when URL parsing fails", () => {
        expect(linkLabel("not a valid url")).toBe("not a valid url");
    });
});

describe("openInNewTab", () => {
    const originalOpen = window.open;

    beforeEach(() => {
        window.open = jest.fn();
    });

    afterEach(() => {
        window.open = originalOpen;
        jest.restoreAllMocks();
    });

    it("does nothing for blank input", () => {
        openInNewTab("");
        expect(window.open).not.toHaveBeenCalled();
    });

    it("opens normalized url in a new tab", () => {
        openInNewTab("www.example.com");
        expect(window.open).toHaveBeenCalledWith(
            "https://www.example.com",
            "_blank",
            "noopener,noreferrer"
        );
    });

    it("opens http/https urls as-is", () => {
        openInNewTab("https://example.com/file.pdf");
        expect(window.open).toHaveBeenCalledWith(
            "https://example.com/file.pdf",
            "_blank",
            "noopener,noreferrer"
        );
    });
});