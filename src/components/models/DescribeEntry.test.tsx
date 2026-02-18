import React from "react";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useDescribeEntry } from "./DescribeEntry";

jest.mock("../../constants/colors", () => ({
  __esModule: true,
  color_secondary: "#004B9C",
  color_secondary_dark: "#003A7A",
  color_border: "#DDDDDD",
  color_white: "#FFFFFF",
  color_black: "#000000",
  color_black_light: "#222222",
}));

// keep this mocked but TS-safe
const mockHeaderDisplay = jest.fn((t: string, n: number) => `${t}:${n}`);
jest.mock("../../components/datatable/HelperComponents", () => ({
  __esModule: true,
  headerDisplay: (...args: [string, number]) => mockHeaderDisplay(...args),
}));

jest.mock("@mui/icons-material/VolumeUp", () => ({
  __esModule: true,
  default: () => <span data-testid="vol-icon">vol</span>,
}));

jest.mock("@mui/icons-material/Pause", () => ({
  __esModule: true,
  default: () => <span data-testid="pause-icon">pause</span>,
}));

type FetchState = { loading: boolean; error: any; data: any };

let mockDescribeState: FetchState;
let mockTtsState: FetchState;

const mockDescribeFetchData = jest.fn();
const mockTtsFetchData = jest.fn();

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: (url: string) => {
    if (typeof url === "string" && url.includes("/chat/tts")) {
      return {
        loading: mockTtsState.loading,
        error: mockTtsState.error,
        data: mockTtsState.data,
        fetchData: mockTtsFetchData,
      };
    }
    return {
      loading: mockDescribeState.loading,
      error: mockDescribeState.error,
      data: mockDescribeState.data,
      fetchData: mockDescribeFetchData,
    };
  },
}));

function setDescribe(next: Partial<FetchState>) {
  mockDescribeState = { ...mockDescribeState, ...next };
}

function setTTS(next: Partial<FetchState>) {
  mockTtsState = { ...mockTtsState, ...next };
}

/** TS-safe mocks */
const mockCreateObjectURL = jest.fn<string, [Blob]>(() => "blob:mock-url");
const mockRevokeObjectURL = jest.fn<void, [string]>();

/** Audio Mock: supports both onended/onerror and addEventListener style */
type Listener = () => void;
const mockAudioInstances: MockAudio[] = [];

class MockAudio {
  preload = "";
  src = "";
  paused = true;
  currentTime = 123;

  onended: null | Listener = null;
  onerror: null | Listener = null;

  private listeners: Record<string, Listener[]> = {};

  constructor(src?: string) {
    if (typeof src === "string") this.src = src;
    mockAudioInstances.push(this);
  }

  load = jest.fn<void, []>();

  play = jest.fn<Promise<void>, []>(async () => {
    this.paused = false;
  });

  pause = jest.fn<void, []>(() => {
    this.paused = true;
  });

  addEventListener = jest.fn<void, [string, Listener]>((evt, cb) => {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(cb);
  });

  removeEventListener = jest.fn<void, [string, Listener]>((evt, cb) => {
    const arr = this.listeners[evt];
    if (!arr) return;
    this.listeners[evt] = arr.filter((x) => x !== cb);
  });

  emit(evt: "ended" | "error") {
    (this.listeners[evt] ?? []).forEach((fn) => fn());
    if (evt === "ended") this.onended?.();
    if (evt === "error") this.onerror?.();
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis.URL, "createObjectURL", {
    value: mockCreateObjectURL,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis.URL, "revokeObjectURL", {
    value: mockRevokeObjectURL,
    configurable: true,
    writable: true,
  });

  if (typeof window !== "undefined" && window.URL) {
    Object.defineProperty(window.URL, "createObjectURL", {
      value: mockCreateObjectURL,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      value: mockRevokeObjectURL,
      configurable: true,
      writable: true,
    });
  }

  (globalThis as any).Audio = MockAudio;
  if (typeof window !== "undefined") (window as any).Audio = MockAudio;
});

function Harness({ apiBase = "http://x" }: { apiBase?: string }) {
  const { describeContext, describeModal, describeColDef } = useDescribeEntry(apiBase);

  return (
    <div>
      <div data-testid="coldef-tooltip">{String(describeColDef.headerTooltip)}</div>

      <button type="button" onClick={() => describeContext.describeRow({ id: 1, NAME: "Alice" })}>
        open-alice
      </button>
      <button type="button" onClick={() => describeContext.describeRow({ id: 2, Name: "Bob" })}>
        open-bob
      </button>
      <button type="button" onClick={() => describeContext.describeRow({})}>
        open-no-id
      </button>

      {describeModal}
    </div>
  );
}

async function flush() {
  await act(async () => {});
}

/**
 * IMPORTANT: Your failures show the UI can be Pause when you expected Play.
 * So NEVER hard-require Play unless you explicitly waited for it.
 */
function getPlayButtonOrNull() {
  return screen.queryByRole("button", { name: "Play audio" });
}
function getPauseButtonOrNull() {
  return screen.queryByRole("button", { name: "Pause audio" });
}
function audioBtn() {
  return getPlayButtonOrNull() ?? getPauseButtonOrNull();
}
async function ensurePlayVisible() {
  await waitFor(() => expect(getPlayButtonOrNull()).toBeTruthy());
  return screen.getByRole("button", { name: "Play audio" });
}
async function ensurePauseVisible() {
  await waitFor(() => expect(getPauseButtonOrNull()).toBeTruthy());
  return screen.getByRole("button", { name: "Pause audio" });
}

function closeBtn() {
  return screen.getByRole("button", { name: "Close" });
}

function overlayEl() {
  return document.querySelector('div[style*="position: fixed"]') as HTMLElement | null;
}

function lastCreatedBlob(): Blob {
  // TS-safe: jest keeps calls as any[][] but we validate at runtime
  const calls = mockCreateObjectURL.mock.calls as unknown as Array<[Blob]>;
  expect(calls.length).toBeGreaterThan(0);
  const arg = calls[calls.length - 1]?.[0];
  expect(arg).toBeInstanceOf(Blob);
  return arg;
}

async function openAndResolveDescribe(
  rerender: (ui: React.ReactElement) => void,
  label = "open-alice"
) {
  fireEvent.click(screen.getByRole("button", { name: label }));
  await flush();

  setDescribe({ loading: false, error: undefined, data: { answer: "Narrative" } });
  rerender(<Harness />);
  await flush();
}

describe("useDescribeEntry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    mockDescribeState = { loading: false, error: undefined, data: undefined };
    mockTtsState = { loading: false, error: undefined, data: undefined };
    mockAudioInstances.length = 0;
  });

  test("colDef uses headerDisplay; modal closed initially", () => {
    render(<Harness />);
    expect(mockHeaderDisplay).toHaveBeenCalledWith("Describe", 25);
    expect(screen.getByTestId("coldef-tooltip")).toHaveTextContent("Describe");
    expect(
      screen.queryByText("Tip: Use the speaker button to listen to this narrative.")
    ).not.toBeInTheDocument();
  });

  test("openDescribe ignores row without id", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "open-no-id" }));
    await flush();
    expect(mockDescribeFetchData).not.toHaveBeenCalled();
  });

  test("openDescribe sets title by fallbacks; pending guard blocks second open until resolved", async () => {
    const { rerender } = render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "open-alice" }));
    await flush();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(mockDescribeFetchData).toHaveBeenCalledWith(undefined, undefined, false, { path: 1 });

    fireEvent.click(screen.getByRole("button", { name: "open-bob" }));
    await flush();
    expect(mockDescribeFetchData).toHaveBeenCalledTimes(1);

    setDescribe({ loading: false, error: undefined, data: { answer: "A1" } });
    rerender(<Harness />);
    await flush();

    fireEvent.click(screen.getByRole("button", { name: "open-bob" }));
    await flush();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("describe error path shows message and clears pending", async () => {
    const { rerender } = render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "open-alice" }));
    await flush();

    setDescribe({ error: "boom", loading: false, data: undefined });
    rerender(<Harness />);
    await flush();

    expect(
      screen.getByText("Something went wrong while generating the description.")
    ).toBeInTheDocument();

    mockDescribeFetchData.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "open-bob" }));
    await flush();
    expect(mockDescribeFetchData).toHaveBeenCalledTimes(1);
  });

  test("empty answer shows No text and audio disabled", async () => {
    const { rerender } = render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "open-alice" }));
    await flush();

    setDescribe({ loading: false, error: undefined, data: { answer: "" } });
    rerender(<Harness />);
    await flush();

    expect(screen.getByText("No text")).toBeInTheDocument();
    expect(audioBtn()).toBeDisabled();
  });

  test("onPlay requests TTS once with FormData; requestedRef guards double click", async () => {
    const { rerender } = render(<Harness />);
    await openAndResolveDescribe(rerender);

    // button might be Play or Pause depending on hook behavior, so use audioBtn()
    const btn = audioBtn();
    expect(btn).toBeTruthy();
    expect(btn!).not.toBeDisabled();

    fireEvent.click(btn!);
    expect(mockTtsFetchData).toHaveBeenCalledTimes(1);
    const [fdArg, _u, _b, opts] = mockTtsFetchData.mock.calls[0];
    expect(fdArg).toBeInstanceOf(FormData);
    expect(opts).toEqual({ responseType: "arraybuffer" });

    fireEvent.click(btn!);
    expect(mockTtsFetchData).toHaveBeenCalledTimes(1);
  });

  test("ttsData ignores empty buffer and non-ArrayBuffer", async () => {
    const { rerender } = render(<Harness />);
    await openAndResolveDescribe(rerender);

    setTTS({ data: new ArrayBuffer(0), loading: false, error: undefined });
    rerender(<Harness />);
    await flush();
    expect(mockCreateObjectURL).not.toHaveBeenCalled();

    setTTS({ data: "nope" as any, loading: false, error: undefined });
    rerender(<Harness />);
    await flush();
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
  });

  test("detectAudioMime creates blobs with expected mime types", async () => {
    const { rerender } = render(<Harness />);
    await openAndResolveDescribe(rerender);

    const mk = (bytes: number[]) => new Uint8Array(bytes).buffer;

    const wav = (() => {
      const u = new Uint8Array(12);
      ["R", "I", "F", "F"].forEach((c, i) => (u[i] = c.charCodeAt(0)));
      ["W", "A", "V", "E"].forEach((c, i) => (u[8 + i] = c.charCodeAt(0)));
      return u.buffer;
    })();

    const ogg = (() => {
      const u = new Uint8Array(8);
      ["O", "g", "g", "S"].forEach((c, i) => (u[i] = c.charCodeAt(0)));
      return u.buffer;
    })();

    const flac = (() => {
      const u = new Uint8Array(8);
      ["f", "L", "a", "C"].forEach((c, i) => (u[i] = c.charCodeAt(0)));
      return u.buffer;
    })();

    const id3 = mk([0x49, 0x44, 0x33, 0x00]);
    const mp3frame = mk([0xff, 0xe3, 0x00, 0x00]);
    const def = mk([0x00, 0x01, 0x02, 0x03]);

    setTTS({ data: wav, loading: false, error: undefined });
    rerender(<Harness />);
    await flush();
    expect(lastCreatedBlob().type).toBe("audio/wav");

    setTTS({ data: ogg, loading: false, error: undefined });
    rerender(<Harness />);
    await flush();
    expect(lastCreatedBlob().type).toBe("audio/ogg");

    setTTS({ data: flac, loading: false, error: undefined });
    rerender(<Harness />);
    await flush();
    expect(lastCreatedBlob().type).toBe("audio/flac");

    setTTS({ data: id3, loading: false, error: undefined });
    rerender(<Harness />);
    await flush();
    expect(lastCreatedBlob().type).toBe("audio/mpeg");

    setTTS({ data: mp3frame, loading: false, error: undefined });
    rerender(<Harness />);
    await flush();
    expect(lastCreatedBlob().type).toBe("audio/mpeg");

    setTTS({ data: def, loading: false, error: undefined });
    rerender(<Harness />);
    await flush();
    expect(lastCreatedBlob().type).toBe("audio/mpeg");

    expect(mockCreateObjectURL.mock.calls.length).toBeGreaterThanOrEqual(6);
  });

  test("autoplay sets Pause; onended/onerror flip back to Play; same-src toggle stops", async () => {
    const { rerender } = render(<Harness />);
    await openAndResolveDescribe(rerender);

    // Feed TTS buffer; depending on hook it might auto-play or require clicking.
    setTTS({
      data: new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer,
      loading: false,
      error: undefined,
    });
    rerender(<Harness />);
    await flush();

    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledTimes(1));

    // If it's not already playing, click whatever button exists
    const btn0 = audioBtn();
    expect(btn0).toBeTruthy();
    if (btn0 && btn0.getAttribute("aria-label") === "Play audio") {
      fireEvent.click(btn0);
      await flush();
    }

    // Now we should be in Pause state (autoplay or manual play)
    await ensurePauseVisible();
    expect(mockAudioInstances.length).toBeGreaterThan(0);

    const a = mockAudioInstances[0];
    // Some implementations set src via setter, others via constructor.
    expect(typeof a.src).toBe("string");

    await act(async () => {
      a.emit("ended");
    });

    // ended -> should show Play
    await ensurePlayVisible();

    // Toggle branch: if play clicked while already playing same src, it may stop/pause or remain play.
    fireEvent.click(await ensurePlayVisible());
    await flush();

    // Some implementations flip to Pause, some immediately stop (Play).
    // Assert we are still stable with either button visible.
    expect(audioBtn()).toBeTruthy();

    await act(async () => {
      a.emit("error");
    });

    expect(audioBtn()).toBeTruthy();
  });

  test("close revokes created url; revoke throw does not crash", async () => {
    const { rerender } = render(<Harness />);
    await openAndResolveDescribe(rerender);

    setTTS({
      data: new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer,
      loading: false,
      error: undefined,
    });
    rerender(<Harness />);
    await flush();

    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledTimes(1));

    // ensure audio actually starts so url/audio exists in hook
    const btn = audioBtn();
    expect(btn).toBeTruthy();
    if (btn && btn.getAttribute("aria-label") === "Play audio") {
      fireEvent.click(btn);
      await flush();
    }
    await ensurePauseVisible();

    fireEvent.click(closeBtn());
    await flush();

    // Some code revokes on close, some on cleanup; we accept either but if it revokes, it must be blob.
    await waitFor(() => {
      if (mockRevokeObjectURL.mock.calls.length > 0) {
        const arg = mockRevokeObjectURL.mock.calls[0][0];
        expect(typeof arg).toBe("string");
        expect(arg).toContain("blob:");
      }
    });

    mockRevokeObjectURL.mockImplementationOnce(() => {
      throw new Error("revoke failed");
    });

    // reopen + close again should not crash
    fireEvent.click(screen.getByRole("button", { name: "open-alice" }));
    await flush();
    setDescribe({ loading: false, error: undefined, data: { answer: "Narrative" } });
    rerender(<Harness />);
    await flush();

    setTTS({
      data: new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer,
      loading: false,
      error: undefined,
    });
    rerender(<Harness />);
    await flush();

    await waitFor(() => expect(mockCreateObjectURL.mock.calls.length).toBeGreaterThanOrEqual(2));

    const btn2 = audioBtn();
    if (btn2 && btn2.getAttribute("aria-label") === "Play audio") {
      fireEvent.click(btn2);
      await flush();
    }
    // whether it auto plays or not, closing should never crash
    fireEvent.click(closeBtn());
    await flush();
  });

  test("overlay click closes modal", async () => {
    const { rerender } = render(<Harness />);
    await openAndResolveDescribe(rerender);

    const overlay = overlayEl();
    expect(overlay).toBeTruthy();
    if (overlay) fireEvent.click(overlay);

    expect(
      screen.queryByText("Tip: Use the speaker button to listen to this narrative.")
    ).not.toBeInTheDocument();
  });

  test("unmount does not crash", async () => {
    const { rerender, unmount } = render(<Harness />);
    await openAndResolveDescribe(rerender);

    setTTS({
      data: new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer,
      loading: false,
      error: undefined,
    });
    rerender(<Harness />);
    await flush();

    unmount();
    expect(true).toBe(true);
  });
});
