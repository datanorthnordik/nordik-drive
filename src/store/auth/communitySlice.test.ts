// communitiesSlice.test.ts
import reducer, {
  ensureCommunities,
  fetchStart,
  fetchSuccess,
  fetchError,
  type Community,
} from "./communitySlice";

describe("communitiesSlice", () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
  };

  it("should return the initial state", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("should handle fetchStart", () => {
    const prevState = {
      items: [{ id: 1, name: "A", approved: true }],
      loading: false,
      error: "old error",
    };

    expect(reducer(prevState, fetchStart())).toEqual({
      items: [{ id: 1, name: "A", approved: true }],
      loading: true,
      error: null,
    });
  });

  it("should handle fetchSuccess with communities", () => {
    const communities: Community[] = [
      { id: 1, name: "Community 1", approved: true },
      { id: 2, name: "Community 2", approved: false },
    ];

    const prevState = {
      items: [],
      loading: true,
      error: "some error",
    };

    expect(reducer(prevState, fetchSuccess(communities))).toEqual({
      items: communities,
      loading: false,
      error: null,
    });
  });

  it("should handle fetchSuccess with empty array", () => {
    const prevState = {
      items: [{ id: 1, name: "Old Community" }],
      loading: true,
      error: "some error",
    };

    expect(reducer(prevState, fetchSuccess([]))).toEqual({
      items: [],
      loading: false,
      error: null,
    });
  });

  it("should handle fetchError", () => {
    const prevState = {
      items: [{ id: 1, name: "Community 1" }],
      loading: true,
      error: null,
    };

    expect(reducer(prevState, fetchError("API failed"))).toEqual({
      items: [{ id: 1, name: "Community 1" }],
      loading: false,
      error: "API failed",
    });
  });

  it("should handle fetchError with empty string fallback", () => {
    const prevState = {
      items: [],
      loading: true,
      error: null,
    };

    expect(reducer(prevState, fetchError("" as any))).toEqual({
      items: [],
      loading: false,
      error: "Failed to fetch communities",
    });
  });

  it("should create ensureCommunities action with undefined payload", () => {
    expect(ensureCommunities()).toEqual({
      type: "communities/ensure",
      payload: undefined,
    });
  });

  it("should create ensureCommunities action with force=true", () => {
    expect(ensureCommunities({ force: true })).toEqual({
      type: "communities/ensure",
      payload: { force: true },
    });
  });

  it("should create ensureCommunities action with force=false", () => {
    expect(ensureCommunities({ force: false })).toEqual({
      type: "communities/ensure",
      payload: { force: false },
    });
  });
});