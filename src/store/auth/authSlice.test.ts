import reducer, { setAuth, clearAuth, setChecked } from "./authSlics";

describe("authSlice", () => {
  const initialState = {
    token: null,
    user: null,
    checked: false,
  };

  test("should return initial state when passed an unknown action", () => {
    const result = reducer(undefined, { type: "unknown" });
    expect(result).toEqual(initialState);
  });

  test("setAuth sets token and user when user is provided", () => {
    const user = {
      id: 1,
      firstname: "Athul",
      lastname: "Narayanan",
      email: "athul@example.com",
      phonenumber: "123",
      role: "Admin",
      community: ["Shingwauk"],
    };

    const next = reducer(initialState, setAuth({ token: "abc123", user }));

    expect(next.token).toBe("abc123");
    expect(next.user).toEqual(user);
    // should not change checked
    expect(next.checked).toBe(false);
  });

  test("setAuth sets token and clears user to null when user not provided", () => {
    const prev = {
      token: "old",
      user: { id: 99, firstname: "X", lastname: "Y" },
      checked: true,
    };

    const next = reducer(prev as any, setAuth({ token: "newToken" }));

    expect(next.token).toBe("newToken");
    expect(next.user).toBeNull();
    expect(next.checked).toBe(true); // unchanged
  });

  test("clearAuth clears token and user", () => {
    const prev = {
      token: "abc",
      user: { id: 1, firstname: "A", lastname: "B" },
      checked: true,
    };

    const next = reducer(prev as any, clearAuth());

    expect(next.token).toBeNull();
    expect(next.user).toBeNull();
    expect(next.checked).toBe(true); // unchanged
  });

  test("setChecked sets checked boolean", () => {
    const next1 = reducer(initialState, setChecked(true));
    expect(next1.checked).toBe(true);

    const next2 = reducer(next1, setChecked(false));
    expect(next2.checked).toBe(false);
  });
});
