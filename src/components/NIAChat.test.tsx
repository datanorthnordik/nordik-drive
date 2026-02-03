// src/components/NIAChat.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import useFetch from "../hooks/useFetch";
import { useSelector } from "react-redux";

import { marked as markedMock } from "marked";
import { decode as decodeMock } from "he";



const markedFn = markedMock as unknown as jest.Mock;
const decodeFn = decodeMock as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  markedFn.mockImplementation((s: any) => `<p>${String(s ?? "")}</p>`);
  decodeFn.mockImplementation((s: any) => String(s ?? ""));

  setWindowWidth(1200);
  setupReduxFileState();
  (HTMLElement.prototype as any).scrollTo = jest.fn();
});



jest.mock("../hooks/useFetch", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("react-redux", () => ({ __esModule: true, useSelector: jest.fn() }));

jest.mock("./Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => <div data-testid="loader" data-loading={String(loading)} />,
}));

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="md">{children}</div>,
}));

jest.mock("remark-gfm", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("rehype-highlight", () => ({ __esModule: true, default: jest.fn() }));

// Always return a string
jest.mock("he", () => ({
  __esModule: true,
  decode: jest.fn((s: any) => String(s ?? "")),
}));

// Robust marked mock (supports named + default)
jest.mock("marked", () => {
  const markedFn = jest.fn((s: string) => `<p>${String(s ?? "")}</p>`);
  return {
    __esModule: true,
    marked: markedFn,
    default: markedFn,
  };
});

jest.mock("framer-motion", () => ({
  __esModule: true,
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("lucide-react", () => ({
  __esModule: true,
  Mic: () => <span data-testid="lucide-mic" />,
  Send: () => <span data-testid="lucide-send" />,
  Bot: () => <span data-testid="lucide-bot" />,
  X: ({ onClick }: any) => (
    <button aria-label="Close chat" onClick={onClick}>
      x
    </button>
  ),
}));

// Stable testids for MUI icons
jest.mock("@mui/icons-material/VolumeUp", () => ({
  __esModule: true,
  default: ({ onClick, ...props }: any) => (
    <span data-testid="VolumeUpIcon" onClick={onClick} {...props} />
  ),
}));

jest.mock("@mui/icons-material/Pause", () => ({
  __esModule: true,
  default: ({ onClick, ...props }: any) => (
    <span data-testid="PauseIcon" onClick={onClick} {...props} />
  ),
}));

const useFetchMock = useFetch as unknown as jest.Mock;
const useSelectorMock = useSelector as unknown as jest.Mock;

class MockFormData {
  entries: Array<[string, any]> = [];
  append = jest.fn((k: string, v: any) => {
    this.entries.push([k, v]);
  });
}

const setWindowWidth = (w: number) => {
  Object.defineProperty(window, "innerWidth", { value: w, writable: true, configurable: true });
};

type FetchHook<T = any> = {
  loading: boolean;
  data: T | null;
  error?: any;
  fetchData: jest.Mock;
};

const makeChatHook = (): FetchHook<any> => ({ loading: false, data: null, fetchData: jest.fn() });
const makeTtsHook = (): FetchHook<ArrayBuffer> => ({
  loading: false,
  data: null,
  error: null,
  fetchData: jest.fn(),
});

let lastAudio: any = null;

class MockAudio {
  src = "";
  preload = "";
  paused = true;
  currentTime = 0;
  onended: null | (() => void) = null;
  onerror: null | (() => void) = null;

  load = jest.fn();
  play = jest.fn(async () => {
    this.paused = false;
  });
  pause = jest.fn(() => {
    this.paused = true;
  });
}

const setupReduxFileState = () => {
  const state = {
    file: {
      selectedFile: { filename: "Test.csv", community_filter: true },
      selectedCommunities: ["Shingwauk"],
    },
  };
  useSelectorMock.mockImplementation((sel: any) => sel(state));
};

const setupUseFetch = (chatHook: FetchHook, ttsHook: FetchHook<ArrayBuffer>) => {
  useFetchMock.mockImplementation((url: string) => {
    if (String(url).includes("/api/chat/tts")) return ttsHook;
    return chatHook;
  });
};

const renderModule = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("./NIAChat");
  return { NIAChat: mod.default, NIAChatTrigger: mod.NIAChatTrigger };
};

const sendViaButton = (text: string) => {
  const input = screen.getByPlaceholderText(/type your message here/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByLabelText(/send message/i));
};

// IMPORTANT: force a true rerender (new element identity)
const rerenderFresh = (rerenderFn: (ui: any) => void, ui: any) => {
  const next = React.isValidElement(ui) ? React.cloneElement(ui) : ui;
  rerenderFn(next);
};

const waitForNewNiaAnswer = async (
  chatHook: FetchHook,
  rerenderFn: (ui: any) => void,
  ui: any,
  answer: string
) => {
  const before = screen.queryAllByTestId("VolumeUpIcon").length;

  await act(async () => {
    chatHook.data = { answer };
    rerenderFresh(rerenderFn, ui);
  });

  await waitFor(() => {
    const after = screen.queryAllByTestId("VolumeUpIcon").length;
    expect(after).toBeGreaterThan(before);
  });
};

const riffWav = () => {
  const u = new Uint8Array(12);
  u[0] = 0x52; // R
  u[1] = 0x49; // I
  u[2] = 0x46; // F
  u[3] = 0x46; // F
  u[8] = 0x57; // W
  u[9] = 0x41; // A
  u[10] = 0x56; // V
  u[11] = 0x45; // E
  return u.buffer;
};
const ogg = () => new Uint8Array([0x4f, 0x67, 0x67, 0x53]).buffer;
const flac = () => new Uint8Array([0x66, 0x4c, 0x61, 0x43]).buffer;
const mp3Id3 = () => new Uint8Array([0x49, 0x44, 0x33]).buffer;
const fallbackBuf = () => new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer;

describe("NIAChat + NIAChatTrigger", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => { });
    jest.spyOn(console, "warn").mockImplementation(() => { });

    (global as any).FormData = MockFormData as any;

    (global as any).Audio = function () {
      lastAudio = new MockAudio();
      return lastAudio;
    } as any;

    if (!(URL as any).createObjectURL) {
      Object.defineProperty(URL, "createObjectURL", {
        value: jest.fn((blob: any) => `blob:mock-${blob.type}`),
        writable: true,
        configurable: true,
      });
    }
    if (!(URL as any).revokeObjectURL) {
      Object.defineProperty(URL, "revokeObjectURL", {
        value: jest.fn(() => { }),
        writable: true,
        configurable: true,
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setWindowWidth(1200);
    setupReduxFileState();
    (HTMLElement.prototype as any).scrollTo = jest.fn();
  });

  test("does not render panel when open=false", () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    const { NIAChat } = renderModule();
    render(<NIAChat open={false} setOpen={jest.fn()} />);

    expect(screen.queryByPlaceholderText(/type your message here/i)).not.toBeInTheDocument();
  });

  test("renders panel when open=true; fullscreen + minimize toggles work; mobile hides fullscreen", async () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    const { NIAChat } = renderModule();
    render(<NIAChat open={true} setOpen={jest.fn()} />);

    expect(screen.getByText(/NIA ASSISTANT/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/enter fullscreen/i));
    expect(screen.getByLabelText(/exit fullscreen/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/exit fullscreen/i));
    expect(screen.getByLabelText(/enter fullscreen/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/minimize/i));
    expect(screen.getByLabelText(/restore/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tip: Tap the microphone/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/restore/i));
    expect(screen.getByText(/Tip: Tap the microphone/i)).toBeInTheDocument();

    setWindowWidth(500);
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(screen.queryByLabelText(/enter fullscreen/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/exit fullscreen/i)).not.toBeInTheDocument();
    });
  });

  test("sending message builds FormData (filename + question + communities) and calls chat fetch; empty input does nothing", () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    const { NIAChat } = renderModule();
    render(<NIAChat open={true} setOpen={jest.fn()} />);

    fireEvent.click(screen.getByLabelText(/send message/i));
    expect(chatHook.fetchData).not.toHaveBeenCalled();

    sendViaButton("Hello");

    expect(chatHook.fetchData).toHaveBeenCalledTimes(1);

    const fd = chatHook.fetchData.mock.calls[0][0] as unknown as MockFormData;
    const kv = new Map(fd.entries);

    expect(kv.get("filename")).toBe("Test.csv");
    expect(kv.get("question")).toBe("Hello");
    expect(kv.get("communities")).toEqual(["Shingwauk"]);
  });

  test("when chat hook data arrives, appends NIA message and shows TTS control for NIA messages", async () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    const { NIAChat } = renderModule();
    const ui = <NIAChat open={true} setOpen={jest.fn()} />;
    const { rerender } = render(ui);

    sendViaButton("Question?");
    expect(chatHook.fetchData).toHaveBeenCalledTimes(1);

    await waitForNewNiaAnswer(chatHook, rerender, ui, "Answer text");

    expect(screen.getByTestId("VolumeUpIcon")).toBeInTheDocument();
  });

  test("TTS request shows spinner, calls tts fetch once; ignores second click while loading; error clears state", async () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    const { NIAChat } = renderModule();
    const ui = <NIAChat open={true} setOpen={jest.fn()} />;
    const { rerender } = render(ui);

    sendViaButton("hi");
    await waitForNewNiaAnswer(chatHook, rerender, ui, "**Hello**\r");

    fireEvent.click(screen.getByTestId("VolumeUpIcon"));

    await waitFor(() => expect(screen.getByLabelText(/generating audio/i)).toBeInTheDocument());
    await waitFor(() => expect(ttsHook.fetchData).toHaveBeenCalledTimes(1));

   
    expect(screen.queryByTestId("VolumeUpIcon")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/generating audio/i));
    expect(ttsHook.fetchData).toHaveBeenCalledTimes(1);


    ttsHook.error = { message: "fail" };
    rerenderFresh(rerender, ui);

    await waitFor(() => {
      expect(screen.queryByLabelText(/generating audio/i)).not.toBeInTheDocument();
      expect(screen.getByTestId("VolumeUpIcon")).toBeInTheDocument();
    });
  });

  test("TTS success caches url, plays audio, stop works, replay uses cache (no extra TTS), close revokes URLs and setOpen(false)", async () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    const setOpen = jest.fn();
    const { NIAChat } = renderModule();
    const ui = <NIAChat open={true} setOpen={setOpen} />;
    const { rerender } = render(ui);

    sendViaButton("hello");
    await waitForNewNiaAnswer(chatHook, rerender, ui, "Answer to speak");

    fireEvent.click(screen.getByTestId("VolumeUpIcon"));
    await waitFor(() => expect(screen.getByLabelText(/generating audio/i)).toBeInTheDocument());
    await waitFor(() => expect(ttsHook.fetchData).toHaveBeenCalledTimes(1));

    (URL.createObjectURL as jest.Mock).mockImplementationOnce((blob: any) => `blob:mock-${blob.type}`);

    ttsHook.data = riffWav();
    rerenderFresh(rerender, ui);

    await waitFor(() => expect(screen.getByTestId("PauseIcon")).toBeInTheDocument());
    expect(lastAudio.play).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("PauseIcon"));
    await waitFor(() => expect(screen.getByTestId("VolumeUpIcon")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("VolumeUpIcon"));
    await waitFor(() => expect(lastAudio.play).toHaveBeenCalledTimes(2));
    expect(ttsHook.fetchData).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText(/close chat/i));
    expect(setOpen).toHaveBeenCalledWith(false);

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  test("detects mime via blob.type for multiple formats (ogg, flac, mp3, fallback)", async () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    const { NIAChat } = renderModule();
    const ui = <NIAChat open={true} setOpen={jest.fn()} />;
    const { rerender } = render(ui);

    const cases: Array<[string, ArrayBuffer]> = [
      ["audio/ogg", ogg()],
      ["audio/flac", flac()],
      ["audio/mpeg", mp3Id3()],
      ["audio/mpeg", fallbackBuf()],
    ];

    for (let i = 0; i < cases.length; i++) {
      const [expectedMime, buf] = cases[i];

      sendViaButton(`q${i}`);
      await waitForNewNiaAnswer(chatHook, rerender, ui, `a${i}`);

      const volumeIcons = screen.getAllByTestId("VolumeUpIcon");
      fireEvent.click(volumeIcons[volumeIcons.length - 1]);

      await waitFor(() => expect(screen.getByLabelText(/generating audio/i)).toBeInTheDocument());
      await waitFor(() => expect(ttsHook.fetchData).toHaveBeenCalled());

      (URL.createObjectURL as jest.Mock).mockImplementationOnce((blob: any) => {
        expect(blob.type).toBe(expectedMime);
        return `blob:mock-${blob.type}-${i}`;
      });

      ttsHook.data = buf;
      rerenderFresh(rerender, ui);

      await waitFor(() => expect(screen.getByTestId("PauseIcon")).toBeInTheDocument());

      fireEvent.click(screen.getByTestId("PauseIcon"));
      await waitFor(() => {
        expect(screen.queryByTestId("PauseIcon")).not.toBeInTheDocument();
        expect(screen.getAllByTestId("VolumeUpIcon").length).toBeGreaterThan(0);
      });

      ttsHook.data = null;
      rerenderFresh(rerender, ui);
    }
  });

  test("voice input: unsupported SpeechRecognition alerts and returns to idle", async () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    (window as any).SpeechRecognition = undefined;
    (window as any).webkitSpeechRecognition = undefined;

    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => { });

    (navigator as any).mediaDevices = { getUserMedia: jest.fn().mockResolvedValue({}) };
    const mediaStart = jest.fn();
    class MR {
      ondataavailable: any = null;
      start = mediaStart;
      stop = jest.fn();
      constructor(_: any) { }
    }
    (global as any).MediaRecorder = MR as any;

    const { NIAChat } = renderModule();
    render(<NIAChat open={true} setOpen={jest.fn()} />);

    fireEvent.click(screen.getByLabelText(/start voice input/i));

    await waitFor(() => expect((navigator as any).mediaDevices.getUserMedia).toHaveBeenCalled());
    expect(mediaStart).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
    expect(screen.getByLabelText(/start voice input/i)).toBeInTheDocument();

    alertSpy.mockRestore();
  });

  test("voice input: supported SpeechRecognition updates input and stop stops recorder/recognition", async () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    (navigator as any).mediaDevices = { getUserMedia: jest.fn().mockResolvedValue({}) };

    let recorder: any = null;
    class MR {
      ondataavailable: any = null;
      start = jest.fn();
      stop = jest.fn();
      constructor(_: any) {
        recorder = this;
      }
    }
    (global as any).MediaRecorder = MR as any;

    const recognitions: any[] = [];
    class SR {
      lang = "";
      interimResults = false;
      onresult: any = null;
      onend: any = null;
      onerror: any = null;
      start = jest.fn();
      stop = jest.fn(() => this.onend?.());
      constructor() {
        recognitions.push(this);
      }
    }
    (window as any).SpeechRecognition = SR as any;

    const { NIAChat } = renderModule();
    render(<NIAChat open={true} setOpen={jest.fn()} />);

    fireEvent.click(screen.getByLabelText(/start voice input/i));

    await waitFor(() => expect(recorder.start).toHaveBeenCalled());
    expect(recognitions[0].start).toHaveBeenCalled();

    const r0: any = [{ transcript: "Hello" }];
    (r0 as any).isFinal = true;
    const r1: any = [{ transcript: " world" }];
    (r1 as any).isFinal = false;

    recognitions[0].onresult?.({ results: [r0, r1] });

    await waitFor(() => {
      const inEl = screen.getByPlaceholderText(/listening/i) as HTMLInputElement;
      expect(inEl.value).toBe("Hello world");
    });

    fireEvent.click(screen.getByLabelText(/stop voice input/i));
    expect(recorder.stop).toHaveBeenCalled();
    expect(recognitions[0].stop).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByLabelText(/start voice input/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/start voice input/i));
    await waitFor(() => expect(recognitions[1].start).toHaveBeenCalled());
    recognitions[1].onerror?.(new Error("boom"));

    await waitFor(() => {
      expect(screen.getByLabelText(/start voice input/i)).toBeInTheDocument();
    });
  });

  test("NIAChatTrigger calls setOpen(true) on click", () => {
    const chatHook = makeChatHook();
    const ttsHook = makeTtsHook();
    setupUseFetch(chatHook, ttsHook);

    const setOpen = jest.fn();
    const { NIAChatTrigger } = renderModule();

    render(<NIAChatTrigger setOpen={setOpen} />);
    fireEvent.click(screen.getByRole("button"));
    expect(setOpen).toHaveBeenCalledWith(true);
  });
});
