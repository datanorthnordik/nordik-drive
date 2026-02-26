// configcache.test.ts
import { openDB } from "idb";
import { idbGetConfig, idbSetConfig } from "./configcache";

jest.mock("idb", () => ({
  openDB: jest.fn(),
}));

describe("configcache", () => {
  const mockGet = jest.fn();
  const mockPut = jest.fn();

  const mockDb = {
    get: mockGet,
    put: mockPut,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (openDB as jest.Mock).mockResolvedValue(mockDb);
  });

  describe("idbGetConfig", () => {
    it("returns cached config when found", async () => {
      const cached = {
        key: "config_test.json",
        file_name: "test.json",
        updated_at: "2026-02-26T10:00:00.000Z",
        checksum: "abc123",
        version: 2,
        config: { hello: "world" },
      };

      mockGet.mockResolvedValue(cached);

      const result = await idbGetConfig("config_test.json");

      expect(openDB).toHaveBeenCalledWith(
        "nordik_cache",
        1,
        expect.objectContaining({
          upgrade: expect.any(Function),
        })
      );
      expect(mockGet).toHaveBeenCalledWith("data_config", "config_test.json");
      expect(result).toEqual(cached);
    });

    it("returns null when nothing is found", async () => {
      mockGet.mockResolvedValue(undefined);

      const result = await idbGetConfig("config_missing.json");

      expect(mockGet).toHaveBeenCalledWith("data_config", "config_missing.json");
      expect(result).toBeNull();
    });

    it("returns null when db.get returns null", async () => {
      mockGet.mockResolvedValue(null);

      const result = await idbGetConfig("config_missing.json");

      expect(result).toBeNull();
    });
  });

  describe("idbSetConfig", () => {
    it("stores config in indexed db", async () => {
      const value = {
        key: "config_boarding",
        file_name: "boarding.json",
        updated_at: "2026-02-26T11:00:00.000Z",
        checksum: "xyz789",
        version: 3,
        config: { sections: [] },
      };

      mockPut.mockResolvedValue(undefined);

      await idbSetConfig(value);

      expect(openDB).toHaveBeenCalledWith(
        "nordik_cache",
        1,
        expect.objectContaining({
          upgrade: expect.any(Function),
        })
      );
      expect(mockPut).toHaveBeenCalledWith("data_config", value);
    });
  });

  describe("upgrade callback", () => {
    it("creates object store when it does not exist", async () => {
      await idbGetConfig("config_test");

      const options = (openDB as jest.Mock).mock.calls[0][2];
      const createObjectStore = jest.fn();

      const fakeDb = {
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(false),
        },
        createObjectStore,
      };

      options.upgrade(fakeDb);

      expect(fakeDb.objectStoreNames.contains).toHaveBeenCalledWith("data_config");
      expect(createObjectStore).toHaveBeenCalledWith("data_config", { keyPath: "key" });
    });

    it("does not create object store when it already exists", async () => {
      await idbGetConfig("config_test");

      const options = (openDB as jest.Mock).mock.calls[0][2];
      const createObjectStore = jest.fn();

      const fakeDb = {
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(true),
        },
        createObjectStore,
      };

      options.upgrade(fakeDb);

      expect(fakeDb.objectStoreNames.contains).toHaveBeenCalledWith("data_config");
      expect(createObjectStore).not.toHaveBeenCalled();
    });
  });
});