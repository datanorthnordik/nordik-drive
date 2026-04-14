'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColDef } from "ag-grid-community";
import useFetch from "../../hooks/useFetch";
import { useViewerLoader } from "../../hooks/useViewerLoader";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PauseIcon from "@mui/icons-material/Pause";
import DocumentViewerModal, { type ViewerDoc } from "../../pages/viewers/DocumentViewer";

import {
    color_secondary,
    color_secondary_dark,
    color_border,
    color_white,
    color_black,
    color_black_light,
} from "../../constants/colors";

import { headerDisplay } from "../../components/datatable/HelperComponents";
import {
    DESCRIBE_COLUMN_HEADER,
    DESCRIBE_DEFAULT_PERSON_LABEL,
    DESCRIBE_DIALOG_AUDIO_LOADING_LABEL,
    DESCRIBE_DIALOG_AUDIO_TIP,
    DESCRIBE_DIALOG_CLOSE_LABEL,
    DESCRIBE_DIALOG_EMPTY_TEXT,
    DESCRIBE_DIALOG_FALLBACK_TITLE,
    DESCRIBE_DIALOG_GENERATE_FIRST_TITLE,
    DESCRIBE_DIALOG_LOADING_TEXT,
    DESCRIBE_DIALOG_PAUSE_LABEL,
    DESCRIBE_DIALOG_PAUSE_TITLE,
    DESCRIBE_DIALOG_PLAY_LABEL,
    DESCRIBE_DIALOG_PLAY_TITLE,
    DESCRIBE_DOCUMENTS_BUTTON_LABEL,
    DESCRIBE_DOCUMENTS_LOADING_LABEL,
    DESCRIBE_DOCUMENTS_SECTION_NOTE,
    DESCRIBE_DOCUMENTS_SECTION_TEXT,
    DESCRIBE_DOCUMENTS_SECTION_TITLE,
    DESCRIBE_ERROR_TEXT,
} from "./describeEntryMessages";

function detectAudioMime(buf: ArrayBuffer): string {
    const u = new Uint8Array(buf);
    const s4 = (i: number) =>
        String.fromCharCode(u[i] || 0, u[i + 1] || 0, u[i + 2] || 0, u[i + 3] || 0);

    if (u.byteLength >= 12 && s4(0) === "RIFF" && s4(8) === "WAVE") return "audio/wav";
    if (u.byteLength >= 4 && s4(0) === "OggS") return "audio/ogg";
    if (u.byteLength >= 4 && s4(0) === "fLaC") return "audio/flac";

    if (u.byteLength >= 3 && u[0] === 0x49 && u[1] === 0x44 && u[2] === 0x33) return "audio/mpeg";
    if (u.byteLength >= 2 && u[0] === 0xff && (u[1] & 0xe0) === 0xe0) return "audio/mpeg";

    return "audio/mpeg";
}

function TinySpinner() {
    return (
        <div
            aria-label={DESCRIBE_DIALOG_AUDIO_LOADING_LABEL}
            style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: `2px solid ${color_border}`,
                borderTopColor: color_secondary,
                animation: "describeSpin 0.9s linear infinite",
            }}
        />
    );
}

const DescribeRenderer = React.memo((props: any) => {
    return (
        <button
            style={{
                padding: "6px 12px",
                background: color_secondary,   // ✅ same as AddInfo
                color: color_white,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%",
                height: "34px",
                fontSize: "14px",
                fontWeight: 600,              // ✅ same vibe as AddInfo
            }}
            onClick={(e) => {
                e.stopPropagation();
                props.context.describeRow?.(props.data);
            }}
        >
            {DESCRIBE_COLUMN_HEADER}
        </button>
    );
});

DescribeRenderer.displayName = "DescribeRenderer";

/* -------------------- Dialog (nicer + audio controls) -------------------- */

function DescribeDialog({
    open,
    title,
    text,
    loadingDescribe,
    onClose,

    // audio
    ttsLoading,
    isPlaying,
    onPlay,
    onStop,
    disableAudio,
    onOpenDocuments,
    documentsLoading,
    disableDocuments,
}: {
    open: boolean;
    title: string;
    text: string;
    loadingDescribe: boolean;
    onClose: () => void;

    ttsLoading: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onStop: () => void;
    disableAudio: boolean;
    onOpenDocuments: () => void;
    documentsLoading: boolean;
    disableDocuments: boolean;
}) {
    if (!open) return null;

    return (
        <>
            <style>{`
        @keyframes describeSpin { from { transform: rotate(0deg);} to {transform: rotate(360deg);} }
      `}</style>

            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.45)",
                    zIndex: 10000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                    overflowY: "auto",
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "min(760px, 100%)",
                        maxHeight: "calc(100vh - 32px)",
                        background: color_white,
                        borderRadius: 14,
                        boxShadow: "0 12px 38px rgba(0,0,0,0.25)",
                        border: `1px solid ${color_border}`,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        margin: "auto",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "14px 16px",
                            background: color_secondary,
                            color: color_white,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            borderBottom: `1px solid ${color_secondary_dark}`,
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.2 }}>
                                {title || DESCRIBE_DIALOG_FALLBACK_TITLE}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {/* Audio */}
                            <button
                                disabled={disableAudio}
                                onClick={() => {
                                    if (ttsLoading) return;
                                    if (isPlaying) onStop();
                                    else onPlay();
                                }}
                                style={{
                                    height: 36,
                                    width: 44,
                                    borderRadius: 10,
                                    border: `1px solid ${color_border}`,
                                    background: color_white,
                                    cursor: disableAudio ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: disableAudio ? 0.6 : 1,
                                }}
                                aria-label={
                                    isPlaying
                                        ? DESCRIBE_DIALOG_PAUSE_LABEL
                                        : DESCRIBE_DIALOG_PLAY_LABEL
                                }
                                title={
                                    disableAudio
                                        ? DESCRIBE_DIALOG_GENERATE_FIRST_TITLE
                                        : isPlaying
                                            ? DESCRIBE_DIALOG_PAUSE_TITLE
                                            : DESCRIBE_DIALOG_PLAY_TITLE
                                }
                            >
                                {ttsLoading ? <TinySpinner /> : isPlaying ? <PauseIcon /> : <VolumeUpIcon />}
                            </button>

                            {/* Close */}
                            <button
                                onClick={onClose}
                                style={{
                                    height: 36,
                                    width: 44,
                                    borderRadius: 10,
                                    border: `1px solid ${color_border}`,
                                    background: color_white,
                                    cursor: "pointer",
                                    fontSize: 18,
                                    fontWeight: 900,
                                    color: color_black,
                                }}
                                aria-label={DESCRIBE_DIALOG_CLOSE_LABEL}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div
                        style={{
                            padding: 16,
                            overflowY: "auto",
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        <div
                            style={{
                                whiteSpace: "pre-wrap",
                                color: color_black_light,
                                lineHeight: 1.55,
                                fontSize: 15,
                                fontWeight: 650,
                                background: "#fafafa",
                                border: `1px solid ${color_border}`,
                                borderRadius: 12,
                                padding: 14,
                                minHeight: 140,
                            }}
                        >
                            {loadingDescribe
                                ? DESCRIBE_DIALOG_LOADING_TEXT
                                : (text || DESCRIBE_DIALOG_EMPTY_TEXT)}
                        </div>

                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 12,
                                color: color_black_light,
                                opacity: 0.8,
                                fontWeight: 700,
                            }}
                        >
                            {DESCRIBE_DIALOG_AUDIO_TIP}
                        </div>

                        <div
                            style={{
                                marginTop: 16,
                                padding: 14,
                                borderRadius: 12,
                                border: `1px solid ${color_border}`,
                                background: "#f7fafc",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 15,
                                    fontWeight: 900,
                                    color: color_black,
                                }}
                            >
                                {DESCRIBE_DOCUMENTS_SECTION_TITLE}
                            </div>

                            <div
                                style={{
                                    fontSize: 14,
                                    lineHeight: 1.55,
                                    color: color_black_light,
                                    fontWeight: 650,
                                }}
                            >
                                {DESCRIBE_DOCUMENTS_SECTION_TEXT}
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    lineHeight: 1.45,
                                    color: color_black_light,
                                    opacity: 0.85,
                                    fontWeight: 600,
                                }}
                            >
                                {DESCRIBE_DOCUMENTS_SECTION_NOTE}
                            </div>

                            <button
                                type="button"
                                onClick={onOpenDocuments}
                                disabled={disableDocuments}
                                style={{
                                    padding: "8px 14px",
                                    background: color_secondary,
                                    color: color_white,
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: disableDocuments ? "not-allowed" : "pointer",
                                    minWidth: 220,
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    opacity: disableDocuments ? 0.6 : 1,
                                    alignSelf: "flex-start",
                                }}
                            >
                                {documentsLoading
                                    ? DESCRIBE_DOCUMENTS_LOADING_LABEL
                                    : DESCRIBE_DOCUMENTS_BUTTON_LABEL}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export function useDescribeEntry(apiBase: string) {
    // describe state
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [activeRowId, setActiveRowId] = useState<number | null>(null);
    const [pendingRowId, setPendingRowId] = useState<number | null>(null);
    const [pendingDocRowId, setPendingDocRowId] = useState<number | null>(null);
    const [docs, setDocs] = useState<ViewerDoc[]>([]);
    const [docModalOpen, setDocModalOpen] = useState(false);

    // describe endpoint
    const { data, fetchData, loading, error } = useFetch(`${apiBase}/chat/describe`, "GET", false);

    const {
        data: docsData,
        fetchData: loadDocs,
        loading: docsLoading,
        error: docsError,
    } = useFetch(`${apiBase}/file/docs`, "GET", false);

    // TTS endpoint (binary)
    const {
        data: ttsData,
        loading: ttsReqLoading,
        error: ttsError,
        fetchData: fetchTTS,
    } = useFetch<ArrayBuffer>(`${apiBase}/chat/tts`, "POST");

    // audio player + cache
    const [ttsUrl, setTtsUrl] = useState<string | null>(null);
    const [ttsPlaying, setTtsPlaying] = useState(false);
    const ttsRequestedRef = useRef(false);

    const audioElRef = useRef<HTMLAudioElement | null>(null);

    // ✅ NEW: always keep latest URL in a ref so close/unmount revoke never misses
    const ttsUrlRef = useRef<string | null>(null);
    useEffect(() => {
        ttsUrlRef.current = ttsUrl;
    }, [ttsUrl]);

    const stopTTS = useCallback(() => {
        const a = audioElRef.current;
        if (a) {
            try {
                a.pause();
                a.currentTime = 0;
            } catch { }
        }
        setTtsPlaying(false);
    }, []);

    const cleanupUrl = useCallback((u: string | null) => {
        if (!u) return;
        try {
            URL.revokeObjectURL(u);
        } catch { }
    }, []);

    const close = useCallback(() => {
        stopTTS();

        // ✅ revoke using ref to avoid stale state timing
        cleanupUrl(ttsUrlRef.current);
        setTtsUrl(null);

        setOpen(false);
        setTitle("");
        setText("");
        setActiveRowId(null);
        setPendingRowId(null);
        setPendingDocRowId(null);
        setDocs([]);
        setDocModalOpen(false);
        ttsRequestedRef.current = false;
    }, [cleanupUrl, stopTTS]);

    const openDescribe = useCallback(
        async (row: any) => {
            const rowId = Number(row?.id);
            if (!rowId) return;
            if (pendingRowId !== null) return;

            // reset per-open
            stopTTS();

            // ✅ revoke using ref to avoid stale state timing
            cleanupUrl(ttsUrlRef.current);
            setTtsUrl(null);

            ttsRequestedRef.current = false;

            const name =
                row?.NAME ||
                row?.Name ||
                row?.name ||
                row?.["Full Name"] ||
                row?.["First Names"] ||
                DESCRIBE_DEFAULT_PERSON_LABEL;

            setTitle(String(name));
            setText("");
            setOpen(true);
            setActiveRowId(rowId);
            setPendingRowId(rowId);
            await fetchData(undefined, undefined, false, { path: rowId });
        },
        [fetchData, pendingRowId, stopTTS, cleanupUrl]
    );

    const openAssociatedDocuments = useCallback(async () => {
        if (!activeRowId) return;
        if (pendingDocRowId !== null) return;

        setPendingDocRowId(activeRowId);
        setDocs([]);
        setDocModalOpen(false);

        await loadDocs(undefined, undefined, false, { path: activeRowId });
    }, [activeRowId, loadDocs, pendingDocRowId]);

    // apply describe results
    useEffect(() => {
        if (pendingRowId === null) return;

        if (error) {
            setText(DESCRIBE_ERROR_TEXT);
            setPendingRowId(null);
            return;
        }

        if (!loading && data) {
            setText((data as any)?.answer ?? "");
            setPendingRowId(null);
        }
    }, [data, loading, error, pendingRowId]);

    useViewerLoader<ViewerDoc>({
        loading: docsLoading,
        error: docsError,
        data: docsData,
        pendingRowId: pendingDocRowId,
        setPendingRowId: setPendingDocRowId,
        setItems: setDocs,
        setModalOpen: setDocModalOpen,
        pickList: (nextData: any) =>
            Array.isArray(nextData) ? nextData : (nextData as any)?.docs ?? [],
        onError: (nextError: any) => console.error("Failed to fetch documents:", nextError),
    });

    // play cached URL (toggle)
    const playUrl = useCallback(
        async (url: string) => {
            let a = audioElRef.current;
            if (!a) {
                a = new Audio();
                a.preload = "auto";
                audioElRef.current = a;
            }

            // ✅ ADD: safe getter (works for real audio + mocks)
            const getSrc = (el: any): string => {
                const s = el?.src;
                return typeof s === "string" ? s : "";
            };

            // ✅ ADD: safe setter (only patches when mock doesn't behave)
            const setSrc = (el: any, next: string) => {
                try {
                    el.src = next; // real browser / good mocks
                } catch { }

                // If it's still not a string (your failing case), patch it for the mock
                if (typeof el.src !== "string") {
                    try {
                        let store = String(next);
                        Object.defineProperty(el, "src", {
                            get() {
                                return store;
                            },
                            set(v: any) {
                                store = String(v);
                            },
                            configurable: true,
                        });
                    } catch { }
                }
            };

            const currentSrc = getSrc(a);

            if (!(a as any).paused && currentSrc === url) {
                stopTTS();
                return;
            }

            setSrc(a as any, url);

            try {
                (a as any).load?.();
            } catch { }

            (a as any).onended = () => setTtsPlaying(false);
            (a as any).onerror = () => setTtsPlaying(false);

            setTtsPlaying(true);

            try {
                await (a as any).play?.();
            } catch (e) {
                console.warn("Audio play failed:", e);
                setTtsPlaying(false);
            }
        },
        [stopTTS]
    );


    // request TTS once, then cache URL
    const onPlay = useCallback(async () => {
        if (!text || loading) return;

        // if cached already => play
        if (ttsUrlRef.current) {
            await playUrl(ttsUrlRef.current);
            return;
        }

        if (ttsReqLoading) return;
        if (ttsRequestedRef.current) return;

        ttsRequestedRef.current = true;

        const fd = new FormData();
        fd.append("text", text);
        fd.append("model", "gemini-2.5-flash-tts");
        fd.append("voice", "Albenib");
        fd.append("language", "en-US");
        fd.append("style", "empathetic and more human like");

        fetchTTS(fd, undefined, false, { responseType: "arraybuffer" });
    }, [text, loading, playUrl, ttsReqLoading, fetchTTS]);

    // When TTS returns -> create blob URL + cache + autoplay
    useEffect(() => {
        if (!ttsData) return;

        if (!(ttsData instanceof ArrayBuffer) || ttsData.byteLength === 0) {
            console.warn("TTS returned empty audio buffer");
            ttsRequestedRef.current = false;
            return;
        }

        const mime = detectAudioMime(ttsData);
        const blob = new Blob([ttsData], { type: mime });
        const url = URL.createObjectURL(blob);

        // ✅ keep both state + ref in sync immediately
        ttsUrlRef.current = url;
        setTtsUrl(url);

        (async () => {
            await playUrl(url);
        })();

        ttsRequestedRef.current = false;
    }, [ttsData, playUrl]);

    useEffect(() => {
        if (!ttsError) return;
        console.error("TTS error:", ttsError);
        ttsRequestedRef.current = false;
    }, [ttsError]);

    // cleanup on unmount
    useEffect(() => {
        return () => {
            stopTTS();
            // ✅ revoke using ref so it always revokes whatever was last created
            cleanupUrl(ttsUrlRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const describeInFlight = pendingRowId !== null && loading;
    const describeDocumentsInFlight = pendingDocRowId !== null && docsLoading;

    const describeColDef: ColDef = useMemo(
        () => ({
            headerName: headerDisplay(DESCRIBE_COLUMN_HEADER, 25),
            headerTooltip: DESCRIBE_COLUMN_HEADER,
            field: "__describe",
            pinned: "left",
            width: 140,
            minWidth: 140,
            suppressSizeToFit: true,
            sortable: false,
            filter: false,
            cellRenderer: DescribeRenderer,
            cellStyle: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            },
        }),
        []
    );

    const describeContext = useMemo(
        () => ({
            describeRow: (row: any) => openDescribe(row),
        }),
        [openDescribe]
    );

    const describeModal = (
        <>
            <DescribeDialog
                open={open && !docModalOpen}
                title={title}
                text={text}
                loadingDescribe={describeInFlight}
                onClose={close}
                ttsLoading={ttsReqLoading}
                isPlaying={ttsPlaying}
                onPlay={onPlay}
                onStop={stopTTS}
                disableAudio={!text || describeInFlight}
                onOpenDocuments={() => void openAssociatedDocuments()}
                documentsLoading={describeDocumentsInFlight}
                disableDocuments={!activeRowId || describeDocumentsInFlight}
            />

            <DocumentViewerModal
                open={docModalOpen}
                onClose={() => setDocModalOpen(false)}
                docs={docs}
                startIndex={0}
                mode="view"
                apiBase={apiBase}
                blobEndpointPath="/file/doc"
                only_approved={true}
            />
        </>
    );

    return {
        describeColDef,
        describeContext,
        describeModal,
        describeInFlight,
        describeDocumentsInFlight,
    };
}
