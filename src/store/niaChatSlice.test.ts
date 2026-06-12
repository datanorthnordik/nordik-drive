import reducer, {
  addPendingExchange,
  failExchange,
  getNiaThreadKey,
  markThreadRead,
  resolveExchange,
  setThreadVisibility,
} from "./niaChatSlice";

describe("niaChatSlice", () => {
  test("returns the initial state", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual({ threads: {} });
  });

  test("creates a pending exchange for a file thread", () => {
    const next = reducer(
      undefined,
      addPendingExchange({
        id: "q1",
        fileName: "Students.csv",
        question: "What changed?",
        askedAt: "2026-05-04T10:00:00.000Z",
        selectedCommunitiesSnapshot: ["Shingwauk"],
      })
    );

    const thread = next.threads[getNiaThreadKey("Students.csv")];
    expect(thread.fileName).toBe("Students.csv");
    expect(thread.exchanges).toHaveLength(1);
    expect(thread.exchanges[0]).toMatchObject({
      id: "q1",
      question: "What changed?",
      status: "pending",
      answer: "",
      errorMessage: null,
      selectedCommunitiesSnapshot: ["Shingwauk"],
    });
  });

  test("resolves a pending exchange, sets last completed id, and increments unread when hidden", () => {
    const started = reducer(
      undefined,
      addPendingExchange({
        id: "q1",
        fileName: "Students.csv",
        question: "What changed?",
        askedAt: "2026-05-04T10:00:00.000Z",
        selectedCommunitiesSnapshot: [],
      })
    );

    const next = reducer(
      started,
      resolveExchange({
        fileName: "Students.csv",
        exchangeId: "q1",
        answer: "A new row was added.",
        answeredAt: "2026-05-04T10:01:00.000Z",
      })
    );

    const thread = next.threads[getNiaThreadKey("Students.csv")];
    expect(thread.unreadCount).toBe(1);
    expect(thread.lastCompletedExchangeId).toBe("q1");
    expect(thread.exchanges[0]).toMatchObject({
      status: "completed",
      answer: "A new row was added.",
      answeredAt: "2026-05-04T10:01:00.000Z",
    });
  });

  test("does not increment unread when the thread is open and not minimized", () => {
    const started = reducer(
      undefined,
      addPendingExchange({
        id: "q1",
        fileName: "Students.csv",
        question: "What changed?",
        askedAt: "2026-05-04T10:00:00.000Z",
        selectedCommunitiesSnapshot: [],
      })
    );

    const visible = reducer(
      started,
      setThreadVisibility({
        fileName: "Students.csv",
        isOpen: true,
        isMinimized: false,
      })
    );

    const next = reducer(
      visible,
      resolveExchange({
        fileName: "Students.csv",
        exchangeId: "q1",
        answer: "A new row was added.",
        answeredAt: "2026-05-04T10:01:00.000Z",
      })
    );

    expect(next.threads[getNiaThreadKey("Students.csv")].unreadCount).toBe(0);
  });

  test("marks a pending exchange as error and keeps the question in history", () => {
    const started = reducer(
      undefined,
      addPendingExchange({
        id: "q1",
        fileName: "Students.csv",
        question: "What changed?",
        askedAt: "2026-05-04T10:00:00.000Z",
        selectedCommunitiesSnapshot: [],
      })
    );

    const next = reducer(
      started,
      failExchange({
        fileName: "Students.csv",
        exchangeId: "q1",
        errorMessage: "Request failed",
        answeredAt: "2026-05-04T10:01:00.000Z",
      })
    );

    expect(next.threads[getNiaThreadKey("Students.csv")].exchanges[0]).toMatchObject({
      question: "What changed?",
      status: "error",
      errorMessage: "Request failed",
      answeredAt: "2026-05-04T10:01:00.000Z",
    });
  });

  test("markThreadRead clears unread count for a thread", () => {
    const started = reducer(
      undefined,
      addPendingExchange({
        id: "q1",
        fileName: "Students.csv",
        question: "What changed?",
        askedAt: "2026-05-04T10:00:00.000Z",
        selectedCommunitiesSnapshot: [],
      })
    );

    const answered = reducer(
      started,
      resolveExchange({
        fileName: "Students.csv",
        exchangeId: "q1",
        answer: "A new row was added.",
        answeredAt: "2026-05-04T10:01:00.000Z",
      })
    );

    const next = reducer(answered, markThreadRead({ fileName: "Students.csv" }));
    expect(next.threads[getNiaThreadKey("Students.csv")].unreadCount).toBe(0);
  });

  test("keeps threads separated per file", () => {
    const first = reducer(
      undefined,
      addPendingExchange({
        id: "q1",
        fileName: "Students.csv",
        question: "Question A",
        askedAt: "2026-05-04T10:00:00.000Z",
        selectedCommunitiesSnapshot: [],
      })
    );

    const second = reducer(
      first,
      addPendingExchange({
        id: "q2",
        fileName: "Survivors.csv",
        question: "Question B",
        askedAt: "2026-05-04T10:02:00.000Z",
        selectedCommunitiesSnapshot: ["Batchewana"],
      })
    );

    expect(second.threads[getNiaThreadKey("Students.csv")].exchanges).toHaveLength(1);
    expect(second.threads[getNiaThreadKey("Survivors.csv")].exchanges).toHaveLength(1);
    expect(second.threads[getNiaThreadKey("Students.csv")].exchanges[0].question).toBe("Question A");
    expect(second.threads[getNiaThreadKey("Survivors.csv")].exchanges[0].question).toBe("Question B");
  });
});
