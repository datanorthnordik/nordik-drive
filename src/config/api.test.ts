describe("api config", () => {
  const originalAppConfig = window.__APP_CONFIG__;
  const originalReactAppApiOrigin = process.env.REACT_APP_API_ORIGIN;
  const originalReactAppApiBase = process.env.REACT_APP_API_BASE;
  const originalNextPublicApiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN;
  const originalNextPublicApiBase = process.env.NEXT_PUBLIC_API_BASE;

  afterEach(() => {
    jest.resetModules();
    window.__APP_CONFIG__ = originalAppConfig;

    if (originalReactAppApiOrigin === undefined) {
      delete process.env.REACT_APP_API_ORIGIN;
    } else {
      process.env.REACT_APP_API_ORIGIN = originalReactAppApiOrigin;
    }

    if (originalReactAppApiBase === undefined) {
      delete process.env.REACT_APP_API_BASE;
    } else {
      process.env.REACT_APP_API_BASE = originalReactAppApiBase;
    }

    if (originalNextPublicApiOrigin === undefined) {
      delete process.env.NEXT_PUBLIC_API_ORIGIN;
    } else {
      process.env.NEXT_PUBLIC_API_ORIGIN = originalNextPublicApiOrigin;
    }

    if (originalNextPublicApiBase === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE;
    } else {
      process.env.NEXT_PUBLIC_API_BASE = originalNextPublicApiBase;
    }
  });

  it("prefers runtime API_ORIGIN from window config", async () => {
    window.__APP_CONFIG__ = { API_ORIGIN: "https://runtime.example.com/" };
    delete process.env.REACT_APP_API_ORIGIN;
    process.env.REACT_APP_API_BASE = "https://build.example.com/api";
    delete process.env.NEXT_PUBLIC_API_ORIGIN;
    delete process.env.NEXT_PUBLIC_API_BASE;

    jest.resetModules();

    const { API_BASE, API_ORIGIN, apiUrl } = await import("./api");

    expect(API_ORIGIN).toBe("https://runtime.example.com");
    expect(API_BASE).toBe("https://runtime.example.com/api");
    expect(apiUrl("user/login")).toBe("https://runtime.example.com/api/user/login");
  });

  it("falls back to same-origin api paths when no API origin is configured", async () => {
    window.__APP_CONFIG__ = undefined;
    delete process.env.REACT_APP_API_ORIGIN;
    delete process.env.REACT_APP_API_BASE;
    delete process.env.NEXT_PUBLIC_API_ORIGIN;
    delete process.env.NEXT_PUBLIC_API_BASE;

    jest.resetModules();

    const { API_BASE, API_ORIGIN, apiUrl, apiOriginUrl } = await import("./api");

    expect(API_ORIGIN).toBe("");
    expect(API_BASE).toBe("/api");
    expect(apiUrl("user/me")).toBe("/api/user/me");
    expect(apiOriginUrl("health")).toBe("/health");
  });
});
