import { isHonourEnabledInConfig } from "./honourConfig";

describe("isHonourEnabledInConfig", () => {
  test("returns true for a direct honour flag", () => {
    expect(isHonourEnabledInConfig({ honour: true })).toBe(true);
  });

  test("supports nested alternate spellings and truthy strings", () => {
    expect(
      isHonourEnabledInConfig({
        source_file: {
          data_config: {
            sections: [
              {
                honor_enabled: "yes",
              },
            ],
          },
        },
      })
    ).toBe(true);
  });

  test("returns false when honour is missing or disabled", () => {
    expect(
      isHonourEnabledInConfig({
        columns: [{ name: "Name", type: "input" }],
        honour: false,
      })
    ).toBe(false);
    expect(isHonourEnabledInConfig(null)).toBe(false);
  });
});
