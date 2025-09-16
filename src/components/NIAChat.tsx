"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Mic, Send, X } from "lucide-react";
import { color_primary, color_secondary } from "../constants/colors";
import { useSelector } from "react-redux";
import useFetch from "../hooks/useFetch";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useSpeechSynthesis } from "react-speech-kit";
import PauseIcon from "@mui/icons-material/Pause";
import { marked } from "marked";
import { decode } from "he";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import Loader from "./Loader";

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

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [recordingState, setRecordingState] = useState<"idle" | "recording">(
    "idle"
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { loading, fetchData, data } = useFetch(
    "https://nordikdriveapi-724838782318.us-west1.run.app/chat",
    "POST"
  );
  const { selectedFile } = useSelector((state: any) => state.file);
  const { speak, voices, cancel, speaking } = useSpeechSynthesis();
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<any>(null);

  // --- Detect mobile ---
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

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
    };

    recognition.onerror = (err: any) => console.error(err);

    // When user pauses speaking or recognition ends, reset button state
    recognition.onend = () => {
      setRecordingState("idle"); // Mic button appears again
      mediaRecorderRef.current?.stop(); // stop recording if still active
    };

    recognitionRef.current = recognition;
    recognition.start();
  };


  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleAudio = async (answer: any, index: number) => {
    let htmlText = await marked(answer);
    htmlText = decode(htmlText);
    const text = htmlText.replace(/<[^>]+>/g, "");
    speak({ text, voice: selectedVoice });
    setSelectedIndex(index);
  };

  const addUserAndNIAResponse = (msg: Message) => {
    setMessages((msgs) => [...msgs, msg]);
    const formData = new FormData();
    formData.append("filename", selectedFile.filename);
    if (msg.text) formData.append("question", msg.text);
    if (msg.audio) formData.append("audio", new File([msg.audio], "audio.webm"));
    fetchData(formData);
  };

  useEffect(() => {
    if (data) {
      setMessages((msgs) => [
        ...msgs,
        { from: "nia", text: (data as any).answer },
      ]);
    }
  }, [data]);

  useEffect(() => {
    if (!speaking) {
      setSelectedIndex(null);
    }
  }, [speaking]);

  useEffect(() => {
    if (voices.length > 0) {
      setSelectedVoice(voices[2]);
    }
  }, [voices]);

  const sendMessage = () => {
    if (!input.trim()) return;
    addUserAndNIAResponse({ from: "user", text: input });
    setInput("");
  };

  const renderedMessages = useMemo(
    () =>
      messages.map((msg, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            gap: "20px",
            alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
            maxWidth: "70%",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "18px",
              background:
                msg.from === "user"
                  ? `linear-gradient(135deg, ${color_primary}, ${color_secondary})`
                  : "rgba(0,0,0,0.6)",
              color: "#fff",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
          <div>
            {msg.text && msg.from !== "user" && (
              <>
                {selectedIndex === idx && speaking ? (
                  <PauseIcon
                    style={{ cursor: "pointer" }}
                    onClick={cancel}
                  />
                ) : (
                  <VolumeUpIcon
                    style={{ cursor: "pointer" }}
                    onClick={() => handleAudio(msg.text, idx)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )),
    [messages, selectedIndex, speaking]
  );

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? "0" : fullscreen ? "0" : "8px",
            top: isMobile ? "0" : fullscreen ? "0" : "8px",
            right: isMobile ? "0" : fullscreen ? "0" : "8px",
            left: isMobile ? "0" : fullscreen ? "0" : "auto",
            width: isMobile ? "100%" : fullscreen ? "100%" : "50%",
            height: isMobile ? "100%" : fullscreen ? "100%" : "auto",
            borderRadius: isMobile ? "0" : fullscreen ? "0" : "16px",
            backdropFilter: "blur(40px) saturate(180%)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.06))",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            flexDirection: "column",
            zIndex: 10000,
            overflow: "hidden",
          }}
        >
          <Loader loading={loading} />
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: `linear-gradient(90deg, ${color_primary}, ${color_secondary})`,
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            <span>🤖 NIA – NORDIK Intelligent Assistant</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {!isMobile && (
                <button
                  onClick={() => setFullscreen((prev) => !prev)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                  }}
                >
                  {fullscreen ? "🗗" : "🗖"}
                </button>
              )}
              <X
                onClick={() => setOpen(false)}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {renderedMessages}
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "14px",
              display: "flex",
              gap: "10px",
              background: "rgba(0,0,0,0.5)",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              alignItems: "center",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recordingState === "recording" ? "🎙️ Listening..." : "Ask NIA..."}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "30px",
                border: "1px solid rgba(255,255,255,0.3)",
                outline: "none",
                fontSize: "0.95rem",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              style={{
                background: `linear-gradient(135deg, ${color_primary}, ${color_secondary})`,
                border: "none",
                borderRadius: "50%",
                width: "46px",
                height: "46px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
              }}
            >
              <Send size={18} />
            </button>
            {recordingState === "idle" ? (
              <button
                onClick={startAudioRecording}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: `1px solid ${color_primary}`,
                  borderRadius: "50%",
                  width: "46px",
                  height: "46px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: color_primary,
                  cursor: "pointer",
                }}
              >
                <Mic size={18} />
              </button>
            ) : (
              <button
                onClick={stopAudioRecording}
                style={{
                  background: "rgba(255,0,0,0.2)",
                  border: "1px solid red",
                  borderRadius: "50%",
                  width: "46px",
                  height: "46px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "red",
                  cursor: "pointer",
                }}
              >
                ⏹
              </button>
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
        background: "linear-gradient(135deg, #004B9C, #0454a9ff)",
        border: "none",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "10px 20px",
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
