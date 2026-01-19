"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Mic, Send, X, Bot } from "lucide-react";
import { useSelector } from "react-redux";
import useFetch from "../hooks/useFetch";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PauseIcon from "@mui/icons-material/Pause";
import { useSpeechSynthesis } from "react-speech-kit";

import { marked } from "marked";
import { decode } from "he";
import { motion } from "framer-motion";

import Loader from "./Loader";

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
  color_text_lighter,
} from "../constants/colors";

type Message = {
  from: "user" | "nia";
  text?: string;
  audio?: Blob;
};

interface NIAChatProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export default function NIAChat({ open, setOpen }: NIAChatProps) {
  const finalTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);

  const [fullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [recordingState, setRecordingState] = useState<"idle" | "recording">(
    "idle"
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const { loading, fetchData, data } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/api/chat",
    "POST"
  );

  const { selectedFile, selectedCommunities } = useSelector(
    (state: any) => state.file
  );

  const { speak, voices, cancel, speaking } = useSpeechSynthesis();
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<any>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // --- Detect mobile ---
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // --- Scroll so the last user message is at the top (kept as-is) ---
  const scrollLastUserToTop = () => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;

    const lastUserIndex = [...messages]
      .map((m, i) => (m.from === "user" ? i : -1))
      .filter((i) => i !== -1)
      .pop();

    if (lastUserIndex !== undefined) {
      const el = messageRefs.current.get(lastUserIndex);
      if (el) {
        container.scrollTo({
          top: el.offsetTop,
          behavior: "smooth",
        });
      }
    }
  };

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
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;

    finalTranscriptRef.current = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setInput(finalTranscript + interimTranscript);
      finalTranscriptRef.current = finalTranscript + interimTranscript;

      // keep your existing behavior
      setRecordingState("idle");
    };

    recognition.onerror = (err: any) => console.error(err);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    setRecordingState("idle");
  };

  const handleAudio = async (answer: any, index: number) => {
    let htmlText = await marked(answer);
    htmlText = decode(htmlText);
    const text = htmlText.replace(/<[^>]+>/g, "");
    speak({ text, voice: selectedVoice });
    setSelectedIndex(index);
  };

  // --- Add user question and send to API ---
  const addUserAndNIAResponse = (msg: Message) => {
    setMessages((msgs) => [...msgs, msg]);
    setTimeout(() => scrollLastUserToTop(), 50);

    const formData = new FormData();
    formData.append("filename", selectedFile?.filename);

    if (msg.text) formData.append("question", msg.text);

    // keep same behavior (don’t change API contract)
    if (selectedFile?.community_filter) {
      formData.append("communities", selectedCommunities as any);
    }

    if (msg.audio)
      formData.append("audio", new File([msg.audio], "audio.webm"));

    fetchData(formData);
  };

  // --- When API returns data (NIA's answer) ---
  useEffect(() => {
    if (data) {
      setMessages((msgs) => [
        ...msgs,
        { from: "nia", text: (data as any).answer },
      ]);
      setTimeout(() => scrollLastUserToTop(), 50);
    }
  }, [data]);

  useEffect(() => {
    if (!speaking) setSelectedIndex(null);
  }, [speaking]);

  useEffect(() => {
    if (voices.length > 0) {
      setSelectedVoice(voices[2] || voices[0] || null);
    }
  }, [voices]);

  const sendMessage = () => {
    if (!input.trim()) return;
    addUserAndNIAResponse({ from: "user", text: input });
    setInput("");
  };

  // ---------- Redesigned messages (UI only) ----------
  const renderedMessages = useMemo(
    () =>
      messages.map((msg, idx) => {
        const isUser = msg.from === "user";
        return (
          <div
            key={idx}
            ref={(el) => {
              if (el) messageRefs.current.set(idx, el);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: isUser ? "flex-end" : "flex-start",
              gap: 6,
              maxWidth: "100%",
            }}
          >
            {/* Small label like UX */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: isUser ? color_text_light : color_secondary,
                paddingLeft: isUser ? 0 : 4,
                paddingRight: isUser ? 4 : 0,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {isUser ? "YOU" : "NIA ASSISTANT"}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                maxWidth: isUser ? "78%" : "82%",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: isUser ? color_secondary : color_white,
                  color: isUser ? color_white : color_black_light,
                  border: isUser
                    ? `1px solid ${color_secondary_dark}`
                    : `1px solid ${color_border}`,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
                  lineHeight: 1.35,
                  fontWeight: 700,
                  overflowWrap: "anywhere",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {msg.text || ""}
                </ReactMarkdown>
              </div>

              {/* TTS controls (same functionality) */}
              {msg.text && !isUser && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    paddingTop: 6,
                  }}
                >
                  {selectedIndex === idx && speaking ? (
                    <PauseIcon style={{ cursor: "pointer" }} onClick={cancel} />
                  ) : (
                    <VolumeUpIcon
                      style={{ cursor: "pointer" }}
                      onClick={() => handleAudio(msg.text, idx)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }),
    [messages, selectedIndex, speaking, cancel]
  );

  return (
    <>
      {open && (
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
          <Loader loading={loading} />

          {/* Header (UX look, same behavior/buttons) */}
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

                  <div style={{ fontSize: 18, letterSpacing: 0.2 }}>
                    NIA ASSISTANT
                  </div>
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
                    fontSize: "1.2rem",
                    fontWeight: 900,
                    lineHeight: 1,
                    padding: 6,
                  }}
                  aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {fullscreen ? "🗗" : "🗖"}
                </button>
              )}

              <button
                onClick={() => setMinimized((prev) => !prev)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: color_white,
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  padding: 6,
                }}
                aria-label={minimized ? "Restore" : "Minimize"}
              >
                {minimized ? "🔼" : "—"}
              </button>

              <X onClick={() => setOpen(false)} style={{ cursor: "pointer" }} />
            </div>
          </div>

          {/* Messages */}
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
            {renderedMessages}
          </div>

          {/* Input Area (UX look, same send/voice behavior) */}
          <div
            style={{
              padding: "14px 14px 12px",
              background: color_white,
              borderTop: `2px solid ${color_secondary}`,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  recordingState === "recording"
                    ? "🎙️ Listening..."
                    : "Type your message here..."
                }
                style={{
                  flex: 1,
                  height: 48,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `2px solid ${color_border}`,
                  outline: "none",
                  fontSize: 15,
                  background: color_white,
                  color: color_black_light,
                  fontWeight: 800,
                }}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />

              {/* Send */}
              <button
                onClick={sendMessage}
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
                  cursor: "pointer",
                }}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>

              {/* Mic */}
              {recordingState === "idle" ? (
                <button
                  onClick={startAudioRecording}
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
                    cursor: "pointer",
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
                  }}
                  aria-label="Stop voice input"
                >
                  ⏹
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
                  <span>Tip: Tap the microphone to talk to NIA</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function NIAChatTrigger({ setOpen }: { setOpen: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={() => setOpen(true)}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 flex items-center gap-3 px-5 h-16 rounded-full shadow-lg z-50 text-white font-semibold"
      style={{
        background: `linear-gradient(135deg, ${color_secondary}, ${color_secondary_dark})`,
        border: "none",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "10px 15px",
        borderRadius: "20px",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.15), transparent 70%)",
        }}
        animate={{ opacity: [0.2, 0.7, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          rotate: [0, 10, -10, 0],
          filter: [
            "drop-shadow(0 0 4px rgba(255,255,255,0.6))",
            "drop-shadow(0 0 12px rgba(255,255,255,0.9))",
            "drop-shadow(0 0 6px rgba(255,255,255,0.7))",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10"
      >
        <Bot size={32} className="text-white" />
      </motion.div>
      <span style={{ color: "white", fontWeight: 700 }}>NIA AI</span>
      <motion.div
        className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-white"
        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.7, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
    </motion.button>
  );
}
