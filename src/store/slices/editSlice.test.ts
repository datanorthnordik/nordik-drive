import reducer, {
  startEditing,
  saveEdit,
  approveEdit,
  rejectEdit,
  cancelEdit,
  clearError,
  selectPendingChanges,
  selectHasPendingChanges,
  selectIsApproved,
} from "./editSlice";

describe("editSlice", () => {
  const initialState = {
    isEditing: false,
    pendingChanges: {},
    adminApproved: false,
    error: null,
  };

  const sampleChanges = {
    "0-fieldA": {
      rowIndex: 0,
      field: "fieldA",
      oldValue: "old",
      newValue: "new",
    },
    "2-age": {
      rowIndex: 2,
      field: "age",
      oldValue: 20,
      newValue: 21,
    },
  };

  test("returns initial state for unknown action", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  test("startEditing sets isEditing=true, sets pendingChanges, resets adminApproved and error", () => {
    const prev = {
      isEditing: false,
      pendingChanges: {},
      adminApproved: true,
      error: "some error",
    };

    const next = reducer(prev as any, startEditing(sampleChanges as any));

    expect(next.isEditing).toBe(true);
    expect(next.pendingChanges).toEqual(sampleChanges);
    expect(next.adminApproved).toBe(false);
    expect(next.error).toBeNull();
  });

  test("saveEdit sets isEditing=false and clears error but keeps pendingChanges", () => {
    const prev = {
      isEditing: true,
      pendingChanges: sampleChanges,
      adminApproved: false,
      error: "error",
    };

    const next = reducer(prev as any, saveEdit());

    expect(next.isEditing).toBe(false);
    expect(next.error).toBeNull();
    expect(next.pendingChanges).toEqual(sampleChanges); // IMPORTANT: stays
    expect(next.adminApproved).toBe(false);
  });

  test("approveEdit sets adminApproved=true, clears pendingChanges, clears error", () => {
    const prev = {
      isEditing: false,
      pendingChanges: sampleChanges,
      adminApproved: false,
      error: "error",
    };

    const next = reducer(prev as any, approveEdit());

    expect(next.adminApproved).toBe(true);
    expect(next.pendingChanges).toEqual({});
    expect(next.error).toBeNull();
    // note: isEditing unchanged by your reducer
    expect(next.isEditing).toBe(false);
  });

  test("rejectEdit sets adminApproved=false, sets error message, clears pendingChanges", () => {
    const prev = {
      isEditing: true,
      pendingChanges: sampleChanges,
      adminApproved: true,
      error: null,
    };

    const next = reducer(prev as any, rejectEdit("Not allowed"));

    expect(next.adminApproved).toBe(false);
    expect(next.error).toBe("Not allowed");
    expect(next.pendingChanges).toEqual({});
    // isEditing unchanged by your reducer
    expect(next.isEditing).toBe(true);
  });

  test("cancelEdit returns initialState (full reset)", () => {
    const prev = {
      isEditing: true,
      pendingChanges: sampleChanges,
      adminApproved: true,
      error: "error",
    };

    const next = reducer(prev as any, cancelEdit());

    expect(next).toEqual(initialState);
  });

  test("clearError sets error to null", () => {
    const prev = {
      ...initialState,
      error: "boom",
    };

    const next = reducer(prev as any, clearError());

    expect(next.error).toBeNull();
  });

  describe("selectors", () => {
    test("selectPendingChanges returns pendingChanges", () => {
      const state = {
        edit: {
          ...initialState,
          pendingChanges: sampleChanges,
        },
      };

      expect(selectPendingChanges(state as any)).toEqual(sampleChanges);
    });

    test("selectHasPendingChanges returns true when pendingChanges has keys", () => {
      const state = {
        edit: {
          ...initialState,
          pendingChanges: sampleChanges,
        },
      };

      expect(selectHasPendingChanges(state as any)).toBe(true);
    });

    test("selectHasPendingChanges returns false when no pendingChanges", () => {
      const state = {
        edit: {
          ...initialState,
          pendingChanges: {},
        },
      };

      expect(selectHasPendingChanges(state as any)).toBe(false);
    });

    test("selectIsApproved returns adminApproved", () => {
      const state1 = { edit: { ...initialState, adminApproved: true } };
      const state2 = { edit: { ...initialState, adminApproved: false } };

      expect(selectIsApproved(state1 as any)).toBe(true);
      expect(selectIsApproved(state2 as any)).toBe(false);
    });
  });
});
