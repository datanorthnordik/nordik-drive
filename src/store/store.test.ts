import store from "./store";

// Import actions from slices to test dispatch actually changes store state
import { setAuth, clearAuth } from "./auth/authSlics";
import { setSelectedFile, clearSelectedFile } from "./auth/fileSlice";
import { setRoles, clearRoles } from "./auth/roleSlice";

describe("Redux store", () => {
  test("store should have auth/file/role keys mounted", () => {
    const state = store.getState();

    expect(state).toHaveProperty("auth");
    expect(state).toHaveProperty("file");
    expect(state).toHaveProperty("role");
  });

  test("dispatch auth actions updates auth state", () => {
    store.dispatch(setAuth({ token: "t1", user: { id: 1, firstname: "A", lastname: "B" } }));
    let state = store.getState();

    expect(state.auth.token).toBe("t1");
    expect(state.auth.user?.id).toBe(1);

    store.dispatch(clearAuth());
    state = store.getState();

    expect(state.auth.token).toBeNull();
    expect(state.auth.user).toBeNull();
  });

  test("dispatch file actions updates file state", () => {
    store.dispatch(
      setSelectedFile({
        selected: {
          filename: "Test.csv",
          id: 1,
          version: "1",
          community_filter: true,
          communities: ["Shingwauk"],
        },
      })
    );

    let state = store.getState();
    expect(state.file.selectedFile?.filename).toBe("Test.csv");

    store.dispatch(clearSelectedFile());
    state = store.getState();
    expect(state.file.selectedFile).toBeNull();
  });

  test("dispatch role actions updates role state", () => {
    store.dispatch(
      setRoles({
        roles: [
          { id: 1, role: "Viewer", user_id: 10, community_name: "X" },
          { id: 2, role: "Admin", user_id: 10, community_name: null },
        ],
      })
    );

    let state = store.getState();
    expect(state.role.userRoles.length).toBe(2);
    expect(state.role.isAdmin).toBe(true);
    expect(state.role.isManager).toBe(false);

    store.dispatch(clearRoles());
    state = store.getState();
    expect(state.role.userRoles).toEqual([]);
    // NOTE: based on your reducer, flags do NOT reset here
  });
});
