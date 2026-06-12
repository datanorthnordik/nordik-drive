"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Mic, Send, X, Bot } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import useFetch from "../hooks/useFetch";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PauseIcon from "@mui/icons-material/Pause";

import { marked } from "marked";
import { decode } from "he";

import {
  color_primary,
  color_secondary,
  color_primary_dark,
  color_secondary_dark,
  color_border,
  color_white,
  color_white_smoke,
  color_black,
  color_black_light,
  color_text_light,
} from "../constants/colors";
import { apiUrl } from "../config/api";
import {
  markThreadRead,
  selectHasAnyPendingNia,
  selectNiaThreadByFileName,
  setThreadVisibility,
  submitNiaQuestion,
} from "../store/niaChatSlice";
import type { AppDispatch, RootState } from "../store/store";

export { default as NIAChatTrigger } from "./NIAChatTrigger";

interface NIAChatProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

async function markdownToPlainText(md: string) {
  const safeMd = typeof md === "string" ? md : "";

  const maybeHtml = await (marked as any)(safeMd);
  const htmlAsString =
    typeof maybeHtml === "string" ? maybeHtml : String(maybeHtml ?? "");

  const decoded = decode(htmlAsString);
  const decodedAsString =
    typeof decoded === "string" ? decoded : String(decoded ?? "");

  return decodedAsString.replace(/<[^>]+>/g, "").replace(/\r/g, "");
}

function getPreferredSpeechLang() {
  return "en-CA";
}

function detectAudioMime(buf: ArrayBuffer): string {
  const u = new Uint8Array(buf);
  const s4 = (i: number) =>
    String.fromCharCode(u[i] || 0, u[i + 1] || 0, u[i + 2] || 0, u[i + 3] || 0);

  if (u.byteLength >= 12 && s4(0) === "RIFF" && s4(8) === "WAVE") return "audio/wav";
  if (u.byteLength >= 4 && s4(0) === "OggS") return "audio/ogg";
  if (u.byteLength >= 4 && s4(0) === "fLaC") return "audio/flac";

  if (
    u.byteLength >= 3 &&
    u[0] === 0x49 &&
    u[1] === 0x44 &&
    u[2] === 0x33
  ) {
    return "audio/mpeg";
  }

  if (u.byteLength >= 2 && u[0] === 0xff && (u[1] & 0xe0) === 0xe0) return "audio/mpeg";

  return "audio/mpeg";
}

function TinySpinner() {
  return (
    <div
      aria-label="Generating audio"
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        border: `2px solid ${color_border}`,
        borderTopColor: color_secondary,
        animation: "niaSpin 0.9s linear infinite",
      }}
    />
  );
}

function ThinkingBubble() {
  return (
    <div
      aria-label="NIA is thinking"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 14,
        background: color_white,
        color: color_black_light,
        border: `1px solid ${color_border}`,
        boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
        lineHeight: 1.35,
        fontWeight: 700,
      }}
    >
      <TinySpinner />
      <span>NIA is thinking...</span>
    </div>
  );
}

const MAX_LINES = 4;
const LINE_HEIGHT_PX = 22;
const VERTICAL_PADDING_PX = 24;
const MAX_TEXTAREA_HEIGHT = MAX_LINES * LINE_HEIGHT_PX + VERTICAL_PADDING_PX;

export default function NIAChat({ open, setOpen }: NIAChatProps) {
  const dispatch = useDispatch<AppDispatch>();
  const finalTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);

  const [fullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [recordingState, setRecordingState] = useState<"idle" | "recording">("idle");
  const [ttsCache, setTtsCache] = useState<Record<string, string>>({});
  const ttsCacheRef = useRef<Record<string, string>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const preferredLangRef = useRef<string>(getPreferredSpeechLang());
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ttsRequestExchangeIdRef = useRef<string | null>(null);

  const { selectedFile, selectedCommunities } = useSelector((state: RootState) => state.file);
  const currentThread = useSelector((state: RootState) =>
    selectNiaThreadByFileName(state, selectedFile?.filename)
  );
  const hasPendingExchange = useSelector((state: RootState) => selectHasAnyPendingNia(state));

  const exchanges = currentThread?.exchanges || [];
  const unreadCount = currentThread?.unreadCount || 0;
  const currentFileName = String(selectedFile?.filename || "").trim();

  const {
    data: ttsData,
    error: ttsError,
    fetchData: fetchTTS,
  } = useFetch<ArrayBuffer>(apiUrl("chat/tts"), "POST");

  const [ttsPlayingExchangeId, setTtsPlayingExchangeId] = useState<string | null>(null);
  const [ttsLoadingExchangeId, setTtsLoadingExchangeId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${next}px`;
  }, [input]);

  useEffect(() => {
    const fileName = currentFileName;
    if (!fileName || !open) return;

    dispatch(
      setThreadVisibility({
        fileName,
        isOpen: open,
        isMinimized: open ? minimized : false,
      })
    );

    return () => {
      if (!fileName) return;
      dispatch(
        setThreadVisibility({
          fileName,
          isOpen: false,
          isMinimized: false,
        })
      );
    };
  }, [currentFileName, dispatch, minimized, open]);

  useEffect(() => {
    if (!open || minimized || !currentFileName || unreadCount === 0) return;
    dispatch(markThreadRead({ fileName: currentFileName }));
  }, [currentFileName, dispatch, minimized, open, unreadCount]);

  useEffect(() => {
    if (!open || minimized || !messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const timer = window.setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [currentThread?.lastCompletedExchangeId, exchanges.length, minimized, open]);

  const startAudioRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorder.start();
    setRecordingState("recording");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser");
      setRecordingState("idle");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = preferredLangRef.current || "en-US";
    recognition.interimResults = true;

    finalTranscriptRef.current = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }

      setInput(finalTranscript + interimTranscript);
      finalTranscriptRef.current = finalTranscript + interimTranscript;
    };

    recognition.onend = () => setRecordingState("idle");
    recognition.onerror = (err: any) => {
      console.error(err);
      setRecordingState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    setRecordingState("idle");
  };

  const stopTTS = useCallback(() => {
    const audio = audioElRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // no-op
      }
    }
    setTtsPlayingExchangeId(null);
  }, []);

  const revokeAllTtsUrls = useCallback((cache: Record<string, string>) => {
    Object.values(cache).forEach((url) => {
      if (!url) return;
      try {
        URL.revokeObjectURL(url);
      } catch {
        // no-op
      }
    });
  }, []);

  const clearTtsCache = useCallback(() => {
    revokeAllTtsUrls(ttsCacheRef.current);
    ttsCacheRef.current = {};
    setTtsCache({});
  }, [revokeAllTtsUrls]);

  const playUrl = useCallback(
    async (url: string, exchangeId: string) => {
      if (ttsPlayingExchangeId !== null && ttsPlayingExchangeId !== exchangeId) {
        stopTTS();
      }

      let audio = audioElRef.current;
      if (!audio) {
        audio = new Audio();
        audio.preload = "auto";
        audioElRef.current = audio;
      }

      if (ttsPlayingExchangeId === exchangeId && audio && !audio.paused) {
        stopTTS();
        return false;
      }

      audio.src = url;
      try {
        audio.load();
      } catch {
        // no-op
      }

      audio.onended = () => setTtsPlayingExchangeId(null);
      audio.onerror = () => setTtsPlayingExchangeId(null);

      setTtsPlayingExchangeId(exchangeId);

      try {
        await audio.play();
        return true;
      } catch (err) {
        console.warn("Audio play failed:", err);
        setTtsPlayingExchangeId(null);
        return false;
      }
    },
    [stopTTS, ttsPlayingExchangeId]
  );

  const sendMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || hasPendingExchange || !currentFileName) return;

    dispatch(
      submitNiaQuestion({
        fileName: currentFileName,
        question: trimmedInput,
        selectedCommunitiesSnapshot: selectedCommunities || [],
        communityFilter: !!selectedFile?.community_filter,
      }) as any
    );

    setInput("");
  };

  const handleAudio = useCallback(
    async (answer: string, exchangeId: string) => {
      if (!answer) return;

      const cachedUrl = ttsCache[exchangeId];
      if (cachedUrl) {
        await playUrl(cachedUrl, exchangeId);
        return;
      }

      if (ttsLoadingExchangeId !== null) return;

      setTtsLoadingExchangeId(exchangeId);
      ttsRequestExchangeIdRef.current = exchangeId;

      let plain = "";
      try {
        plain = await markdownToPlainText(answer);
      } catch (err) {
        console.error("markdownToPlainText failed:", err);
        setTtsLoadingExchangeId(null);
        ttsRequestExchangeIdRef.current = null;
        return;
      }

      const fd = new FormData();
      fd.append("text", plain);
      fd.append("model", "gemini-2.5-flash-tts");
      fd.append("voice", "Albenib");
      fd.append("language", "en-US");
      fd.append("style", "empathetic and more human like");

      fetchTTS(fd, undefined, false, { responseType: "arraybuffer" });
    },
    [fetchTTS, playUrl, ttsCache, ttsLoadingExchangeId]
  );

  useEffect(() => {
    if (!ttsData) return;

    const exchangeId = ttsRequestExchangeIdRef.current;
    if (!exchangeId) return;

    if (!(ttsData instanceof ArrayBuffer) || ttsData.byteLength === 0) {
      console.warn("TTS returned empty audio buffer");
      setTtsLoadingExchangeId(null);
      ttsRequestExchangeIdRef.current = null;
      return;
    }

    const mime = detectAudioMime(ttsData);
    const blob = new Blob([ttsData], { type: mime });
    const url = URL.createObjectURL(blob);

    setTtsCache((prev) => {
      const next = { ...prev, [exchangeId]: url };
      ttsCacheRef.current = next;
      return next;
    });

    void playUrl(url, exchangeId);

    setTtsLoadingExchangeId(null);
    ttsRequestExchangeIdRef.current = null;
  }, [playUrl, ttsData]);

  useEffect(() => {
    if (!ttsError) return;
    console.error("TTS error:", ttsError);
    setTtsLoadingExchangeId(null);
    ttsRequestExchangeIdRef.current = null;
  }, [ttsError]);

  useEffect(() => {
    return () => {
      stopTTS();
      revokeAllTtsUrls(ttsCacheRef.current);
      ttsCacheRef.current = {};
    };
  }, [revokeAllTtsUrls, stopTTS]);

  const renderedMessages = useMemo(
    () =>
      exchanges.map((exchange) => {
        const showAudioControls = exchange.status === "completed" && !!exchange.answer;
        const isThisLoading = ttsLoadingExchangeId === exchange.id;
        const isThisPlaying = ttsPlayingExchangeId === exchange.id;

        return (
          <div
            key={exchange.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
                maxWidth: "100%",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: color_text_light,
                  paddingRight: 4,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                YOU
              </div>

              <div
                style={{
                  maxWidth: "78%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: color_secondary,
                  color: color_white,
                  border: `1px solid ${color_secondary_dark}`,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
                  lineHeight: 1.35,
                  fontWeight: 700,
                  overflowWrap: "anywhere",
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {exchange.question || ""}
                </ReactMarkdown>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 6,
                maxWidth: "100%",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: color_secondary,
                  paddingLeft: 4,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                NIA ASSISTANT
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  maxWidth: "82%",
                }}
              >
                {exchange.status === "pending" ? (
                  <ThinkingBubble />
                ) : (
                  <div
                    role={exchange.status === "error" ? "alert" : undefined}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background:
                        exchange.status === "error" ? "#fff1f1" : color_white,
                      color:
                        exchange.status === "error" ? color_primary_dark : color_black_light,
                      border:
                        exchange.status === "error"
                          ? `1px solid rgba(185, 28, 28, 0.22)`
                          : `1px solid ${color_border}`,
                      boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
                      lineHeight: 1.35,
                      fontWeight: 700,
                      overflowWrap: "anywhere",
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {exchange.status === "error"
                        ? exchange.errorMessage || "Something went wrong. Please try again later!"
                        : exchange.answer || ""}
                    </ReactMarkdown>
                  </div>
                )}

                {showAudioControls && (
                  <div style={{ display: "flex", alignItems: "center", paddingTop: 6 }}>
                    {isThisLoading ? (
                      <TinySpinner />
                    ) : isThisPlaying ? (
                      <PauseIcon style={{ cursor: "pointer" }} onClick={stopTTS} />
                    ) : (
                      <VolumeUpIcon
                        style={{ cursor: "pointer" }}
                        onClick={() => handleAudio(exchange.answer || "", exchange.id)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }),
    [exchanges, handleAudio, stopTTS, ttsLoadingExchangeId, ttsPlayingExchangeId]
  );

  if (!open) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes niaSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: minimized ? "auto" : isMobile ? "0" : fullscreen ? "0" : "8px",
          right: minimized ? "20px" : isMobile ? "0" : fullscreen ? "0" : "8px",
          left: minimized ? "auto" : isMobile ? "0" : fullscreen ? "0" : "auto",
          bottom: minimized ? "20px" : isMobile ? "0" : fullscreen ? "0" : "8px",
          width: minimized ? "100px" : isMobile ? "100%" : fullscreen ? "100%" : "50%",
          height: minimized ? "60px" : isMobile ? "100%" : fullscreen ? "100%" : "auto",
          borderRadius: 14,
          background: color_white_smoke,
          border: `1px solid ${color_border}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 10000,
          overflow: "hidden",
          boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            padding: minimized ? "10px 12px" : "14px 16px",
            background: color_secondary,
            color: color_white,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 900,
            borderBottom: `1px solid ${color_secondary_dark}`,
          }}
        >
          {!minimized && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: color_white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: color_secondary,
                    border: `1px solid ${color_border}`,
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} />
                </div>
                <div style={{ fontSize: 18, letterSpacing: 0.2 }}>NIA ASSISTANT</div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isMobile && !minimized && (
              <button
                onClick={() => setFullscreen((prev) => !prev)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: color_white,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  padding: 6,
                }}
                aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {fullscreen ? "FS-" : "FS+"}
              </button>
            )}

            <button
              onClick={() => setMinimized((prev) => !prev)}
              style={{
                background: "transparent",
                border: "none",
                color: color_white,
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 900,
                lineHeight: 1,
                padding: 6,
              }}
              aria-label={minimized ? "Restore" : "Minimize"}
            >
              {minimized ? "^" : "_"}
            </button>

            <X
              onClick={() => {
                stopTTS();
                clearTtsCache();
                setOpen(false);
              }}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: color_white_smoke,
          }}
        >
          {renderedMessages.length > 0 ? (
            renderedMessages
          ) : (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: `1px solid ${color_border}`,
                background: color_white,
                color: color_text_light,
                fontWeight: 700,
              }}
            >
              Ask NIA a question about the selected file to start the conversation.
            </div>
          )}
        </div>

        <div
          style={{
            padding: "14px 14px 12px",
            background: color_white,
            borderTop: `2px solid ${color_secondary}`,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recordingState === "recording" ? "Listening..." : "Type your message here..."}
              rows={1}
              style={{
                flex: 1,
                minHeight: 56,
                maxHeight: MAX_TEXTAREA_HEIGHT,
                padding: "12px 16px",
                borderRadius: 12,
                border: `2px solid ${color_border}`,
                outline: "none",
                fontSize: 16,
                lineHeight: `${LINE_HEIGHT_PX}px`,
                background: color_white,
                color: color_black_light,
                fontWeight: 800,
                resize: "none",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button
              onClick={sendMessage}
              disabled={hasPendingExchange || !input.trim() || !currentFileName}
              style={{
                width: 52,
                height: 48,
                borderRadius: 10,
                background: color_secondary,
                border: `1px solid ${color_secondary_dark}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: color_white,
                cursor:
                  hasPendingExchange || !input.trim() || !currentFileName
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  hasPendingExchange || !input.trim() || !currentFileName
                    ? 0.6
                    : 1,
              }}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>

            {recordingState === "idle" ? (
              <button
                onClick={startAudioRecording}
                disabled={hasPendingExchange}
                style={{
                  width: 52,
                  height: 48,
                  borderRadius: 10,
                  background: color_black_light,
                  border: `1px solid ${color_black}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: color_white,
                  cursor: hasPendingExchange ? "not-allowed" : "pointer",
                  opacity: hasPendingExchange ? 0.6 : 1,
                }}
                aria-label="Start voice input"
              >
                <Mic size={18} />
              </button>
            ) : (
              <button
                onClick={stopAudioRecording}
                style={{
                  width: 52,
                  height: 48,
                  borderRadius: 10,
                  background: color_primary,
                  border: `1px solid ${color_primary_dark}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: color_white,
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: 12,
                }}
                aria-label="Stop voice input"
              >
                STOP
              </button>
            )}
          </div>

          {!minimized && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                fontSize: 12,
                color: color_text_light,
                fontWeight: 800,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: color_secondary, fontWeight: 900 }}>i</span>
                <span>
                  {hasPendingExchange
                    ? "NIA is preparing your answer. You can keep using the page."
                    : "Tip: Tap the microphone to talk to NIA"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
