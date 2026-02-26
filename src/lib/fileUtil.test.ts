import { guessMimeFromFilename, isImageMime, isPdfMime } from "./fileUtil";

describe("isPdfMime", () => {
  it("returns true for application/pdf", () => {
    expect(isPdfMime("application/pdf")).toBe(true);
  });

  it("returns false for non-pdf mime types", () => {
    expect(isPdfMime("image/png")).toBe(false);
    expect(isPdfMime("application/json")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPdfMime(undefined)).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isPdfMime("Application/PDF")).toBe(false);
  });
});

describe("isImageMime", () => {
  it("returns true for valid image mime types", () => {
    expect(isImageMime("image/png")).toBe(true);
    expect(isImageMime("image/jpeg")).toBe(true);
    expect(isImageMime("image/webp")).toBe(true);
  });

  it("returns false for non-image mime types", () => {
    expect(isImageMime("application/pdf")).toBe(false);
    expect(isImageMime("text/plain")).toBe(false);
  });

  it("returns false for empty string and undefined", () => {
    expect(isImageMime("")).toBe(false);
    expect(isImageMime(undefined)).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isImageMime("Image/png")).toBe(false);
  });
});

describe("guessMimeFromFilename", () => {
  it("returns empty string for undefined or empty name", () => {
    expect(guessMimeFromFilename(undefined)).toBe("");
    expect(guessMimeFromFilename("")).toBe("");
  });

  it("detects pdf files", () => {
    expect(guessMimeFromFilename("file.pdf")).toBe("application/pdf");
    expect(guessMimeFromFilename("FILE.PDF")).toBe("application/pdf");
  });

  it("detects png files", () => {
    expect(guessMimeFromFilename("image.png")).toBe("image/png");
    expect(guessMimeFromFilename("IMAGE.PNG")).toBe("image/png");
  });

  it("detects jpg and jpeg files", () => {
    expect(guessMimeFromFilename("photo.jpg")).toBe("image/jpeg");
    expect(guessMimeFromFilename("photo.jpeg")).toBe("image/jpeg");
    expect(guessMimeFromFilename("PHOTO.JPEG")).toBe("image/jpeg");
  });

  it("detects webp files", () => {
    expect(guessMimeFromFilename("pic.webp")).toBe("image/webp");
    expect(guessMimeFromFilename("PIC.WEBP")).toBe("image/webp");
  });

  it("returns empty string for unsupported extensions", () => {
    expect(guessMimeFromFilename("doc.txt")).toBe("");
    expect(guessMimeFromFilename("archive.zip")).toBe("");
    expect(guessMimeFromFilename("no-extension")).toBe("");
  });

  it("matches only when the filename ends with the extension", () => {
    expect(guessMimeFromFilename("pdf-file.txt")).toBe("");
    expect(guessMimeFromFilename("image.png.backup")).toBe("");
  });
});