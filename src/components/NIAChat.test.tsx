import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import useFetch, { apiRequest } from "../hooks/useFetch";
import toast from "react-hot-toast";
import niaChatReducer, { getNiaThreadKey } from "../store/niaChatSlice";
import NIAChat, { NIAChatTrigger } from "./NIAChat";

jest.mock("../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
  apiRequest: jest.fn(),
}));

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="md">{children}</div>,
}));

jest.mock("remark-gfm", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("rehype-highlight", () => ({ __esModule: true, default: jest.fn() }));

jest.mock("he", () => ({
  __esModule: true,
  decode: jest.fn((s: any) => String(s ?? "")),
}));

jest.mock("marked", () => {
  const markedFn = jest.fn((s: string) => `<p>${String(s ?? "")}</p>`);
  return {
    __esModule: true,
    marked: markedFn,
    default: markedFn,
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  success: jest.fn(),
  error: jest.fn(),
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
const apiRequestMock = apiRequest as unknown as jest.Mock;

class MockFormData {
  public entries: Array<[string, any]> = [];

  append(key: string, value: any) {
    this.entries.push([key, value]);
  }
}

const originalFormData = global.FormData;
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

type TtsHook<T = any> = {
  loading: boolean;
  data: T | null;
  error: any;
  fetchData: jest.Mock;
};

const makeTtsHook = (): TtsHook<ArrayBuffer> => ({
  loading: false,
  data: null,
  error: null,
  fetchData: jest.fn(),
});

const deferredResponse = () => {
  let resolve!: (value: any) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const riffWav = () => {
  const u = new Uint8Array(12);
  u[0] = 0x52;
  u[1] = 0x49;
  u[2] = 0x46;
  u[3] = 0x46;
  u[8] = 0x57;
  u[9] = 0x41;
  u[10] = 0x56;
  u[11] = 0x45;
  return u.buffer;
};

const setWindowWidth = (w: number) => {
  Object.defineProperty(window, "innerWidth", {
    value: w,
    writable: true,
    configurable: true,
  });
};

const makeStore = (
  {
    file = {},
    auth = {},
  }: {
    file?: Record<string, any>;
    auth?: Record<string, any>;
  } = {}
) => {
  const fileState = {
    selectedFile: { filename: "Test.csv", community_filter: true },
    selectedCommunities: ["Shingwauk"],
    ...file,
  };
  const authState = {
    token: "Cookies",
    user: null,
    checked: true,
    ...auth,
  };

  const fileReducer = (state = fileState) => state;
  const authReducer = (state = authState) => state;

  return configureStore({
    reducer: {
      file: fileReducer as any,
      auth: authReducer as any,
      niaChat: niaChatReducer,
    },
  });
};

const renderWithStore = (
  ui: React.ReactElement,
  { store = makeStore() }: { store?: ReturnType<typeof makeStore> } = {}
) => ({
  store,
  ...render(<Provider store={store}>{ui}</Provider>),
});

const sendViaButton = (text: string) => {
  const input = screen.getByPlaceholderText(/type your message here/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByLabelText(/send message/i));
};

describe("NIAChat + NIAChatTrigger", () => {
  let ttsHook: TtsHook<ArrayBuffer>;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});

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
        value: jest.fn(() => {}),
        writable: true,
        configurable: true,
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setWindowWidth(1200);
    ttsHook = makeTtsHook();
    useFetchMock.mockImplementation(() => ttsHook);
    apiRequestMock.mockReset();
    global.FormData = MockFormData as any;
    (HTMLElement.prototype as any).scrollTo = jest.fn();
  });

  afterEach(() => {
    global.FormData = originalFormData;
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  test("does not render panel when open=false", () => {
    renderWithStore(<NIAChat open={false} setOpen={jest.fn()} />);
    expect(screen.queryByPlaceholderText(/type your message here/i)).not.toBeInTheDocument();
  });

  test("renders panel when open=true; fullscreen + minimize toggles work; mobile hides fullscreen", async () => {
    renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />);

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

  test("sending a message uses FormData, shows inline thinking, and disables send while pending", async () => {
    const pending = deferredResponse();
    apiRequestMock.mockReturnValueOnce(pending.promise);

    renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />);

    sendViaButton("Hello");

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const fd = apiRequestMock.mock.calls[0][2] as MockFormData;
    const kv = new Map(fd.entries);

    expect(kv.get("filename")).toBe("Test.csv");
    expect(kv.get("question")).toBe("Hello");
    expect(kv.get("communities")).toEqual(["Shingwauk"]);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByLabelText(/nia is thinking/i)).toBeInTheDocument();
    expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/send message/i)).toBeDisabled();
    expect(screen.getByLabelText(/start voice input/i)).toBeDisabled();

    pending.resolve({ answer: "Hi there" });

    await waitFor(() => {
      expect(screen.getByText("Hi there")).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/nia is thinking/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/start voice input/i)).not.toBeDisabled();
  });

  test("history survives closing and reopening the chat during the same session", async () => {
    const store = makeStore();
    apiRequestMock.mockResolvedValueOnce({ answer: "Saved answer" });

    const { rerender } = renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />, { store });

    sendViaButton("Keep this");

    await waitFor(() => {
      expect(screen.getByText("Saved answer")).toBeInTheDocument();
    });

    rerender(
      <Provider store={store}>
        <NIAChat open={false} setOpen={jest.fn()} />
      </Provider>
    );

    rerender(
      <Provider store={store}>
        <NIAChat open={true} setOpen={jest.fn()} />
      </Provider>
    );

    expect(screen.getByText("Keep this")).toBeInTheDocument();
    expect(screen.getByText("Saved answer")).toBeInTheDocument();
  });

  test("shows a notification and unread state when an answer completes while chat is closed", async () => {
    const store = makeStore();
    const pending = deferredResponse();
    apiRequestMock.mockReturnValueOnce(pending.promise);

    const { rerender } = renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />, { store });

    sendViaButton("Close and wait");

    rerender(
      <Provider store={store}>
        <NIAChat open={false} setOpen={jest.fn()} />
      </Provider>
    );

    pending.resolve({ answer: "Ready later" });

    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalledWith("NIA answer is ready.");
    });

    const threadKey = getNiaThreadKey("Test.csv");
    expect(store.getState().niaChat.threads[threadKey].unreadCount).toBe(1);

    rerender(
      <Provider store={store}>
        <NIAChat open={true} setOpen={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(store.getState().niaChat.threads[threadKey].unreadCount).toBe(0);
    });
    expect(screen.getByText("Ready later")).toBeInTheDocument();
  });

  test("shows a notification when an answer completes while chat is minimized", async () => {
    const pending = deferredResponse();
    apiRequestMock.mockReturnValueOnce(pending.promise);

    renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />);

    sendViaButton("Minimize and wait");
    fireEvent.click(screen.getByLabelText(/minimize/i));

    pending.resolve({ answer: "Ready while minimized" });

    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalledWith("NIA answer is ready.");
    });
  });

  test("renders inline error state when chat request fails", async () => {
    apiRequestMock.mockRejectedValueOnce(new Error("Request failed"));

    renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />);

    sendViaButton("Will fail");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Request failed");
    });
    expect((toast as any).error).toHaveBeenCalledWith("Something went wrong. Please try again later!");
  });

  test("completed answers still support TTS playback", async () => {
    const store = makeStore();
    apiRequestMock.mockResolvedValueOnce({ answer: "Answer to speak" });

    const { rerender } = renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />, { store });

    sendViaButton("speak");

    await waitFor(() => {
      expect(screen.getByTestId("VolumeUpIcon")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("VolumeUpIcon"));

    await waitFor(() => expect(ttsHook.fetchData).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText(/generating audio/i)).toBeInTheDocument();

    ttsHook.data = riffWav();
    rerender(
      <Provider store={store}>
        <NIAChat open={true} setOpen={jest.fn()} />
      </Provider>
    );

    await waitFor(() => expect(screen.getByTestId("PauseIcon")).toBeInTheDocument());
    expect(lastAudio.play).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("PauseIcon"));
    await waitFor(() => expect(screen.getByTestId("VolumeUpIcon")).toBeInTheDocument());
  });

  test("voice input: unsupported SpeechRecognition alerts and returns to idle", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    (navigator as any).mediaDevices = { getUserMedia: jest.fn().mockResolvedValue({}) };
    const mediaStart = jest.fn();
    class MR {
      ondataavailable: any = null;
      start = mediaStart;
      stop = jest.fn();
      constructor(_: any) {}
    }
    (global as any).MediaRecorder = MR as any;

    renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />);

    fireEvent.click(screen.getByLabelText(/start voice input/i));

    await waitFor(() => expect((navigator as any).mediaDevices.getUserMedia).toHaveBeenCalled());
    expect(mediaStart).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
    expect(screen.getByLabelText(/start voice input/i)).toBeInTheDocument();

    alertSpy.mockRestore();
  });

  test("voice input: supported SpeechRecognition updates input and stop stops recorder/recognition", async () => {
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

    renderWithStore(<NIAChat open={true} setOpen={jest.fn()} />);

    fireEvent.click(screen.getByLabelText(/start voice input/i));

    await waitFor(() => expect(recorder.start).toHaveBeenCalled());
    expect(recognitions[0].start).toHaveBeenCalled();

    const r0: any = [{ transcript: "Hello" }];
    (r0 as any).isFinal = true;
    const r1: any = [{ transcript: " world" }];
    (r1 as any).isFinal = false;

    recognitions[0].onresult?.({ results: [r0, r1] });

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/listening/i) as HTMLInputElement;
      expect(input.value).toBe("Hello world");
    });

    fireEvent.click(screen.getByLabelText(/stop voice input/i));
    expect(recorder.stop).toHaveBeenCalled();
    expect(recognitions[0].stop).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByLabelText(/start voice input/i)).toBeInTheDocument();
    });
  });

  test("NIAChatTrigger calls setOpen(true) on click and can show unread badge", () => {
    const setOpen = jest.fn();

    render(<NIAChatTrigger setOpen={setOpen} unreadCount={3} />);
    fireEvent.click(screen.getByRole("button"));

    expect(setOpen).toHaveBeenCalledWith(true);
    expect(screen.getByLabelText("3 unread NIA answers")).toBeInTheDocument();
  });
});
