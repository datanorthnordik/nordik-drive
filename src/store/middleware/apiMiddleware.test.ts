// apiMiddleware.test.ts
import { apiMiddleware } from "./apiMiddleware";
import { apiEnsure, fetchStart, fetchSuccess, fetchError } from "../api/apiSlice";
import { apiRequest } from "../../hooks/useFetch";
import { idbGetConfig, idbSetConfig } from "../index_db/configcache";

jest.mock("../../hooks/useFetch", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("../index_db/configcache", () => ({
  idbGetConfig: jest.fn(),
  idbSetConfig: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockIdbGetConfig = idbGetConfig as jest.MockedFunction<typeof idbGetConfig>;
const mockIdbSetConfig = idbSetConfig as jest.MockedFunction<typeof idbSetConfig>;

describe("apiMiddleware", () => {
  const baseState = {
    api: {
      entries: {},
    },
    auth: {
      token: "token-123",
    },
  };

  const makeStore = (state: any = baseState) => ({
    getState: jest.fn(() => state),
    dispatch: jest.fn(),
  });

  const run = async (action: any, state: any = baseState) => {
    const store = makeStore(state);
    const next = jest.fn((a) => a);

    const result = await (apiMiddleware as any)(store)(next)(action);

    return { store, next, result };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes through non-apiEnsure actions", async () => {
    const action = { type: "OTHER_ACTION", payload: { x: 1 } };

    const { store, next, result } = await run(action);

    expect(next).toHaveBeenCalledWith(action);
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(result).toBe(action);
  });

  it("dedupes when entry is already loading", async () => {
    const action = apiEnsure({ key: "users", url: "/users" });

    const state = {
      ...baseState,
      api: {
        entries: {
          users: { loading: true },
        },
      },
    };

    const { store, next, result } = await run(action, state);

    expect(next).toHaveBeenCalledWith(action);
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(mockApiRequest).not.toHaveBeenCalled();
    expect(result).toBe(action);
  });

  it("returns early on redux cache hit when ttl is not provided", async () => {
    const action = apiEnsure({ key: "users", url: "/users" });

    const state = {
      ...baseState,
      api: {
        entries: {
          users: { loading: false, data: { ok: true }, lastFetchedAt: 1000 },
        },
      },
    };

    const { store } = await run(action, state);

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("returns early on redux cache hit when ttl is still valid", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);

    const action = apiEnsure({
      key: "users",
      url: "/users",
      ttlMs: 5_000,
    });

    const state = {
      ...baseState,
      api: {
        entries: {
          users: { loading: false, data: { ok: true }, lastFetchedAt: 7_000 },
        },
      },
    };

    const { store } = await run(action, state);

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(mockApiRequest).not.toHaveBeenCalled();

    nowSpy.mockRestore();
  });

  it("calls normal API and dispatches success for non-config keys", async () => {
    const action = apiEnsure({
      key: "users",
      url: "/users",
      method: "POST",
      body: { a: 1 },
      headers: { "x-test": "1" },
    });

    const apiData = { ok: true };
    mockApiRequest.mockResolvedValueOnce(apiData as any);

    const { store } = await run(action);

    expect(store.dispatch).toHaveBeenNthCalledWith(1, fetchStart({ key: "users" }));
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/users",
      "POST",
      { a: 1 },
      { "x-test": "1" },
      "token-123"
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      fetchSuccess({ key: "users", data: apiData })
    );
  });

  it("dispatches fetchError for normal API failures", async () => {
    const action = apiEnsure({ key: "users", url: "/users" });

    mockApiRequest.mockRejectedValueOnce(new Error("boom"));

    const { store } = await run(action);

    expect(store.dispatch).toHaveBeenNthCalledWith(1, fetchStart({ key: "users" }));
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      fetchError({ key: "users", error: "boom" })
    );
  });

  it("for config keys, seeds redux from IDB first and keeps cache when backend says not_modified", async () => {
    const cached = {
      key: "config_boarding",
      file_name: "boarding.json",
      updated_at: "2026-02-26T12:00:00.000Z",
      checksum: "abc",
      version: 3,
      config: { a: 1 },
    };

    const action = apiEnsure({
      key: "config_boarding",
      url: "/config/boarding",
    });

    mockIdbGetConfig.mockResolvedValueOnce(cached as any);
    mockApiRequest.mockResolvedValueOnce({
      not_modified: true,
      file_name: "boarding.json",
      updated_at: "2026-02-26T12:00:00.000Z",
      checksum: "abc",
      version: 3,
    } as any);

    const { store } = await run(action);

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      fetchStart({ key: "config_boarding" })
    );

    // immediate seed from IDB
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      fetchSuccess({ key: "config_boarding", data: cached })
    );

    expect(mockApiRequest).toHaveBeenCalledWith(
      `/config/boarding?last_modified=${encodeURIComponent(cached.updated_at)}`,
      "GET",
      undefined,
      {},
      "token-123"
    );

    // backend says unchanged -> keep cached
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      fetchSuccess({ key: "config_boarding", data: cached })
    );

    expect(mockIdbSetConfig).not.toHaveBeenCalled();
  });

  it("for config keys, stores minimal metadata when backend says not_modified but IDB has no config", async () => {
    const action = apiEnsure({
      key: "config_boarding",
      url: "/config/boarding",
    });

    mockIdbGetConfig.mockResolvedValueOnce(null as any);
    mockApiRequest.mockResolvedValueOnce({
      not_modified: true,
      file_name: "boarding.json",
      updated_at: "2026-02-26T12:00:00.000Z",
      checksum: "xyz",
      version: 5,
    } as any);

    const { store } = await run(action);

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      fetchStart({ key: "config_boarding" })
    );

    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      fetchSuccess({
        key: "config_boarding",
        data: {
          key: "config_boarding",
          file_name: "boarding.json",
          updated_at: "2026-02-26T12:00:00.000Z",
          checksum: "xyz",
          version: 5,
          config: null,
        },
      })
    );

    expect(mockIdbSetConfig).not.toHaveBeenCalled();
  });

  it("for config keys, saves modified config to IDB and redux", async () => {
    const action = apiEnsure({
      key: "config_boarding",
      url: "/config/boarding",
      method: "GET",
    });

    mockIdbGetConfig.mockResolvedValueOnce(null as any);

    mockApiRequest.mockResolvedValueOnce({
      not_modified: false,
      file_name: "boarding.json",
      updated_at: new Date("2026-02-26T12:34:56.000Z"),
      checksum: "new-checksum",
      version: 7,
      config: { x: 1, y: 2 },
    } as any);

    const { store } = await run(action);

    const expectedCache = {
      key: "config_boarding",
      file_name: "boarding.json",
      updated_at: "2026-02-26T12:34:56.000Z",
      checksum: "new-checksum",
      version: 7,
      config: { x: 1, y: 2 },
    };

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      fetchStart({ key: "config_boarding" })
    );
    expect(mockIdbSetConfig).toHaveBeenCalledWith(expectedCache);
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      fetchSuccess({ key: "config_boarding", data: expectedCache })
    );
  });

  it("falls back to IDB cache if config API fails", async () => {
    const cached = {
      key: "config_boarding",
      file_name: "boarding.json",
      updated_at: "2026-02-26T12:00:00.000Z",
      checksum: "abc",
      version: 3,
      config: { a: 1 },
    };

    const action = apiEnsure({
      key: "config_boarding",
      url: "/config/boarding",
    });

    mockIdbGetConfig
      .mockResolvedValueOnce(cached as any) // initial fast read
      .mockResolvedValueOnce(cached as any); // catch fallback

    mockApiRequest.mockRejectedValueOnce(new Error("network down"));

    const { store } = await run(action);

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      fetchStart({ key: "config_boarding" })
    );

    // seeded first
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      fetchSuccess({ key: "config_boarding", data: cached })
    );

    // fallback again from catch
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      fetchSuccess({ key: "config_boarding", data: cached })
    );

    expect(store.dispatch).not.toHaveBeenCalledWith(
      fetchError({ key: "config_boarding", error: "network down" })
    );
  });

  it("dispatches fetchError if config API fails and no IDB cache exists", async () => {
    const action = apiEnsure({
      key: "config_boarding",
      url: "/config/boarding",
    });

    mockIdbGetConfig
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any);

    mockApiRequest.mockRejectedValueOnce(new Error("network down"));

    const { store } = await run(action);

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      fetchStart({ key: "config_boarding" })
    );

    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      fetchError({ key: "config_boarding", error: "network down" })
    );
  });

  it("uses force=true to bypass redux cache", async () => {
    const action = apiEnsure({
      key: "users",
      url: "/users",
      force: true,
    });

    const state = {
      ...baseState,
      api: {
        entries: {
          users: { loading: false, data: { cached: true }, lastFetchedAt: 1000 },
        },
      },
    };

    mockApiRequest.mockResolvedValueOnce({ fresh: true } as any);

    const { store } = await run(action, state);

    expect(store.dispatch).toHaveBeenNthCalledWith(1, fetchStart({ key: "users" }));
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      fetchSuccess({ key: "users", data: { fresh: true } })
    );
  });
});