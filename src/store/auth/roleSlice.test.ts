import reducer, { setRoles, clearRoles } from "./roleSlice";

describe("roleSlice", () => {
  const initialState = {
    userRoles: [],
    isAdmin: false,
    isManager: false,
  };

  test("should return initial state when passed an unknown action", () => {
    const result = reducer(undefined, { type: "unknown" });
    expect(result).toEqual(initialState);
  });

  test("setRoles sets userRoles and sets isAdmin/isManager based on roles", () => {
    const roles = [
      { id: 1, role: "Viewer", user_id: 10, community_name: "X" },
      { id: 2, role: "Admin", user_id: 10, community_name: null },
      { id: 3, role: "Manager", user_id: 10, community_name: "Y" },
    ];

    const next = reducer(initialState, setRoles({ roles }));

    expect(next.userRoles).toEqual(roles);
    expect(next.isAdmin).toBe(true);
    expect(next.isManager).toBe(true);
  });

  test("setRoles sets isAdmin true when at least one Admin exists", () => {
    const roles = [{ id: 1, role: "Admin", user_id: 1, community_name: null }];

    const next = reducer(initialState, setRoles({ roles }));

    expect(next.isAdmin).toBe(true);
    expect(next.isManager).toBe(false);
  });

  test("setRoles sets isManager true when at least one Manager exists", () => {
    const roles = [{ id: 1, role: "Manager", user_id: 1, community_name: "A" }];

    const next = reducer(initialState, setRoles({ roles }));

    expect(next.isAdmin).toBe(false);
    expect(next.isManager).toBe(true);
  });

  test("setRoles keeps isAdmin/isManager false when no Admin/Manager roles exist", () => {
    const roles = [
      { id: 1, role: "Viewer", user_id: 1, community_name: "A" },
      { id: 2, role: "Editor", user_id: 1, community_name: "B" },
    ];

    const next = reducer(initialState, setRoles({ roles }));

    expect(next.userRoles).toEqual(roles);
    expect(next.isAdmin).toBe(false);
    expect(next.isManager).toBe(false);
  });

  test("clearRoles clears userRoles but does not modify isAdmin/isManager (matches current reducer)", () => {
    const prev = {
      userRoles: [{ id: 1, role: "Admin", user_id: 1, community_name: null }],
      isAdmin: true,
      isManager: true,
    };

    const next = reducer(prev as any, clearRoles());

    expect(next.userRoles).toEqual([]);
    // IMPORTANT: your reducer only clears array; flags remain as-is
    expect(next.isAdmin).toBe(true);
    expect(next.isManager).toBe(true);
  });
});
