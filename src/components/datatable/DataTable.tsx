'use client';
import React, { useMemo, useRef, useState, useLayoutEffect, useEffect } from "react";
import {
    AllCommunityModule,
    ModuleRegistry,
    themeQuartz,
    colorSchemeLightWarm,
    GridReadyEvent,
    RowNode,
    IRowNode
} from "ag-grid-community";
import {
    Mic,
    MicOff,
    Search,
    ArrowLeft,
    ChevronUp,
    ChevronDown,
    Sparkles,
    Download,
    Plus,
    Info,
    X,
} from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { DataTableWrapper, GridWrapper } from "../Wrappers";
import { color_primary, color_secondary, color_background, header_height, header_mobile_height, color_white, color_black, color_black_light, color_light_blue, color_blue_light, color_blue_lighter, color_blue_lightest, color_text_lighter, color_light_gray, color_warning_light, color_border, color_secondary_dark, color_white_smoke, dark_grey, color_text_light } from "../../constants/colors";
import NIAChat, { NIAChatTrigger } from "../NIAChat";
import { MicIcon, MicOffIcon, SearchIcon } from "lucide-react";
import { Box, Button, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import styled, { keyframes } from "styled-components";
import { colorSources } from "../../constants/constants";
import * as XLSX from "xlsx";
import CommunityFilter from "../CommunityFilter/CommunityFilter";
import { useDispatch, useSelector } from "react-redux";
import { setCommunities } from "../../store/auth/fileSlice";
import { AppDispatch } from "../../store/store";
import { EditableTable } from "./EditableTable";
import AddInfoForm from "./AddInfoForm";
import SmartSearchSuggestions from "./SmartSearchSuggestions";

import { Dialog, DialogTitle, DialogContent, Divider } from "@mui/material";
import DocumentUrlViewerModal from "../photoview/URLDocumentViewer";
import DocumentViewerModal from "../../pages/viewers/DocumentViewer";
import PhotoViewerModal from "../../pages/viewers/PhotoViewer";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";


const API_BASE = "https://nordikdriveapi-724838782318.us-west1.run.app/api";

ModuleRegistry.registerModules([AllCommunityModule]);
const themeLightWarm = themeQuartz.withPart(colorSchemeLightWarm);

interface DataGridProps {
    rowData: any[];
}

/* ---------- Reusable components ---------- */

const AddInfoRenderer = React.memo((props: any) => {
    return (
        <button
            style={{
                padding: "6px 12px",
                background: color_secondary,
                color: color_white,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%",
                height: "34px",
                fontSize: "14px",
                fontWeight: 600
            }}
            onClick={(e) => {
                e.stopPropagation();
                props.context.openForm(props.data);
            }}
        >
            Add Info
        </button>
    );
});

const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

const normalizeUrl = (raw: string) => {
    const s = (raw || "").trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("www.")) return `https://${s}`;
    return s;
};

const cleanUrl = (u: string) => u.replace(/[)\],.]+$/g, "");

const extractUrls = (text: string): string[] => {
    if (!text) return [];
    const matches = text.match(URL_REGEX) || [];
    const cleaned = matches.map((m) => normalizeUrl(cleanUrl(m))).filter(Boolean);
    // unique
    return Array.from(new Set(cleaned));
};

const isDocumentUrl = (url: string) => {
    const u = url.toLowerCase().split("?")[0];
    return (
        u.endsWith(".pdf") ||
        u.endsWith(".png") ||
        u.endsWith(".jpg") ||
        u.endsWith(".jpeg") ||
        u.endsWith(".webp") ||
        u.endsWith(".doc") ||
        u.endsWith(".docx") ||
        u.endsWith(".xls") ||
        u.endsWith(".xlsx") ||
        u.endsWith(".ppt") ||
        u.endsWith(".pptx") ||
        u.endsWith(".csv") ||
        u.endsWith(".txt") ||
        u.endsWith(".json")
    );
};

const linkLabel = (url: string) => {
    try {
        const u = new URL(url);
        const last = u.pathname.split("/").filter(Boolean).pop() || u.hostname;
        return decodeURIComponent(last.length > 22 ? u.hostname : last);
    } catch {
        return url;
    }
};


const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const HighlightCell = React.memo(
    ({ value, searchText, fontSize }: { value: any; searchText: string; fontSize: number }) => {
        if (!value) return null;

        const str = value.toString();
        const match = str.match(/^(.*?)\s*(\(([^)]*)\))?$/);
        const mainText = (match?.[1] || "").trim();

        if (!searchText) {
            return <span style={{ fontSize }}>{mainText}</span>;
        }

        const safeSearch = escapeRegExp(searchText);
        const regex = new RegExp(`(${safeSearch})`, "gi");
        const parts = mainText.split(regex);

        return (
            <span style={{ fontSize }}>
                {parts.map((part: any, index: any) => {
                    // indices 1,3,5,... are the captured matches
                    const isMatch = index % 2 === 1 && part.length > 0;
                    if (isMatch) {
                        return (
                            <span key={index} style={{ backgroundColor: "yellow" }}>
                                {part}
                            </span>
                        );
                    }
                    return <React.Fragment key={index}>{part}</React.Fragment>;
                })}
            </span>
        );
    }
);

/* ---------- Recorder styles ---------- */

const RecorderOverlay = styled.div<{ $recording: boolean }>`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: ${props => props.$recording ? "flex" : "none"};
  justify-content: center;
  align-items: center;
  z-index: 9999;
  flex-direction: column;
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(26,26,26, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(26,26,26, 0); }
  100% { box-shadow: 0 0 0 0 rgba(26,26,26, 0); }
`;

const MicButton = styled.div<{ $recording: boolean }>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${props => props.$recording ? color_primary : "#E0E0E0"};
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: ${props => props.$recording ? color_white : color_black};
  font-size: 48px;
  animation: ${props => props.$recording ? pulse : "none"} 1.5s infinite;
  transition: all 0.3s ease;
`;

const RecorderText = styled.div`
  margin-top: 20px;
  color: ${color_white};
  font-size: 22px;
  font-weight: 500;
  text-align: center;
`;

/* ---------- Main component ---------- */

export default function DataGrid({ rowData }: DataGridProps) {
    const [gridApi, setGridApi] = useState<any>(null);
    const [filterOpen, setFilterOpen] = useState(true);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [overlayTop, setOverlayTop] = useState<number>(0);
    const [overlayHeight, setOverlayHeight] = useState<number>(360);
    const [searchText, setSearchText] = useState("");
    const [lastQuery, setLastQuery] = useState("");
    const [matches, setMatches] = useState<{ rowNode: RowNode; colId: string }[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [fontSize, setFontSize] = useState(16);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [niaOpen, setNiaOpen] = useState(false);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const lastCommunitiesRef = useRef<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const topControlsRef = useRef<HTMLDivElement | null>(null);
    const filtersRef = useRef<HTMLDivElement | null>(null);
    const [gridMinHeight, setGridMinHeight] = useState<number>(360);
    const { selectedFile, selectedCommunities } = useSelector((state: any) => state.file);
    const [formOpen, setFormOpen] = useState(false);
    const [formRow, setFormRow] = useState<any>(null);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [photoRequestId, setPhotoRequestId] = useState<number | null>(null);
    const [hasQuickFilterResults, setHasQuickFilterResults] = useState(true);
    const [linksOpen, setLinksOpen] = useState(false);
    const [linksTitle, setLinksTitle] = useState("");
    const [linksList, setLinksList] = useState<string[]>([]);

    const [docUrlOpen, setDocUrlOpen] = useState(false);
    const [docUrl, setDocUrl] = useState("");
    const [docUrlTitle, setDocUrlTitle] = useState<string>("");

    const [docModalOpen, setDocModalOpen] = useState(false);


    const [pendingPhotoRowId, setPendingPhotoRowId] = useState<number | null>(null);
    const [pendingDocRowId, setPendingDocRowId] = useState<number | null>(null);


    const [photos, setPhotos] = useState<any[]>([]);
    const [docs, setDocs] = useState<any[]>([]);

    const {
        data: photoData,
        fetchData: loadPhotos,
        loading: photosLoading,
        error: photosError,
    } = useFetch(`${API_BASE}/file/photos`, "GET", false);

    const {
        data: docData,
        fetchData: loadDocs,
        loading: docsLoading,
        error: docsError,
    } = useFetch(`${API_BASE}/file/docs`, "GET", false);

    const openWebsite = (url: string) => {
        const u = normalizeUrl(url);
        if (!u) return;
        window.open(u, "_blank", "noopener,noreferrer");
    };

    const openDocumentUrl = (url: string) => {
        const u = normalizeUrl(url);
        if (!u) return;
        setDocUrl(u);
        setDocUrlTitle(linkLabel(u));
        setDocUrlOpen(true);
    };

    const openLinksModal = (urls: string[], title?: string) => {
        setLinksList(urls);
        setLinksTitle(title || "Links");
        setLinksOpen(true);
    };


    const openPhotoViewer = async (row: any) => {
        const rowId = row?.id;
        if (!rowId) return;

        // prevent overlapping requests
        if (pendingPhotoRowId || pendingDocRowId) return;

        setPendingPhotoRowId(rowId);
        setPhotos([]);           // clear stale
        setPhotoModalOpen(false);

        await loadPhotos(undefined, undefined, false, { path: rowId });
    };

    const openDocumentsViewer = async (row: any) => {
        const rowId = row?.id;
        if (!rowId) return;

        if (pendingPhotoRowId || pendingDocRowId) return;

        setPendingDocRowId(rowId);
        setDocs([]);
        setDocModalOpen(false);

        await loadDocs(undefined, undefined, false, { path: rowId });
    };

    useEffect(() => {
        if (!pendingPhotoRowId) return;
        if (photosLoading) return;

        if (photosError) {
            console.error("Failed to fetch photos:", photosError);
            setPendingPhotoRowId(null);
            return;
        }

        if (photoData) {
            const list = Array.isArray(photoData)
                ? photoData
                : ((photoData as any)?.photos ?? []);

            setPhotos(list);
            setPendingPhotoRowId(null);
            setPhotoModalOpen(true);
        }
    }, [pendingPhotoRowId, photosLoading, photosError, photoData]);

    useEffect(() => {
        if (!pendingDocRowId) return;
        if (docsLoading) return;

        if (docsError) {
            console.error("Failed to fetch documents:", docsError);
            setPendingDocRowId(null);
            return;
        }

        if (docData) {
            const list = Array.isArray(docData)
                ? docData
                : ((docData as any)?.docs ?? []);

            setDocs(list);
            setPendingDocRowId(null);
            setDocModalOpen(true);
        }
    }, [pendingDocRowId, docsLoading, docsError, docData]);

    /* ----- layout & overlay calculations ----- */

    useLayoutEffect(() => {
        const computeOverlay = () => {
            if (!wrapperRef.current) {
                setOverlayTop(0);
                setOverlayHeight(360);
                return;
            }
            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const topH = topControlsRef.current?.getBoundingClientRect().bottom ?? wrapperRect.top;
            const filtersH = filtersRef.current?.getBoundingClientRect().bottom ?? topH;
            const top = Math.max(topH - wrapperRect.top, 0);
            const padding = 16;
            const avail = Math.max(200, wrapperRef.current.clientHeight - top - padding);
            setOverlayTop(top + 8);
            setOverlayHeight(avail);
        };
        computeOverlay();
        window.addEventListener("resize", computeOverlay);
        return () => window.removeEventListener("resize", computeOverlay);
    }, []);

    useEffect(() => {
        const prev = document.body.style.overflow;
        if (filterOpen && selectedFile?.community_filter) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = prev || "";
        }
        return () => {
            document.body.style.overflow = prev || "";
        };
    }, [filterOpen, selectedFile?.community_filter]);

    useEffect(() => {
        const enabled = !!selectedFile?.community_filter;
        const uniqueCommunities = enabled
            ? Array.from(
                new Set(
                    rowData
                        .map((item: any) => item?.["First Nation/Community"] ?? "")
                        .map((v: any) => String(v).trim())
                        .filter(Boolean)
                )
            )
            : [];

        const serialized = JSON.stringify(uniqueCommunities);
        if (serialized !== lastCommunitiesRef.current) {
            lastCommunitiesRef.current = serialized;
            dispatch(setCommunities({ communities: uniqueCommunities.sort() }));
        }
    }, [rowData, selectedFile?.community_filter, dispatch]);

    useLayoutEffect(() => {
        const compute = () => {
            const wrapperH = wrapperRef.current?.clientHeight ?? window.innerHeight;
            const topH = topControlsRef.current?.clientHeight ?? 0;
            const filtersH = filtersRef.current?.clientHeight ?? 0;
            const padding = 48;
            const remaining = Math.max(360, wrapperH - topH - filtersH - padding);
            setGridMinHeight(remaining);
        };
        compute();
        window.addEventListener("resize", compute);
        return () => window.removeEventListener("resize", compute);
    }, []);

    useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /* ----- column definitions ----- */

    const columnDefs = useMemo(() => {
        if (!rowData || rowData.length === 0) return [];
        const keys = Object.keys(rowData[0]).filter((k) => k !== "id");

        const addInfoCol = selectedFile?.community_filter
            ? [
                {
                    headerName: "Add Info",
                    field: "add_info",
                    pinned: "left" as const,
                    width: 140,
                    minWidth: 140,
                    suppressSizeToFit: true,
                    cellRenderer: AddInfoRenderer,
                    cellStyle: {
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }
                }
            ]
            : [];

        const otherCols = keys.map((key) => {
            // 👉 If this is the “Photos” column → show button instead of value
            if (key.toLowerCase() === "photos") {
                return {
                    field: key,
                    headerName: key,
                    width: 140,
                    minWidth: 140,
                    sortable: false,
                    filter: false,
                    cellRenderer: (params: any) => (
                        <button
                            style={{
                                padding: "6px 10px",
                                background: color_secondary,
                                color: color_white,
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                width: "100%",
                                height: "32px",
                                fontSize: "12px",
                                fontWeight: 600
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                params.context.openPhotoView(params.data);
                            }}
                        >
                            View Photos
                        </button>
                    )
                };
            }

            if (key.toLowerCase() === "documents") {
                return {
                    field: key,
                    headerName: key,
                    width: 160,
                    minWidth: 160,
                    sortable: false,
                    filter: false,
                    cellRenderer: (params: any) => (
                        <button
                            style={{
                                padding: "6px 10px",
                                background: color_secondary,
                                color: color_white,
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                width: "100%",
                                height: "32px",
                                fontSize: "12px",
                                fontWeight: 600,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                params.context.openDocumentsView(params.data);
                            }}
                        >
                            View Documents
                        </button>
                    ),
                };
            }


            // 👉 DEFAULT RENDERING for all other columns (unchanged)
            return {
                field: key,
                headerName: key,
                tooltipValueGetter: (params: any) => params.value,
                cellRenderer: (params: any) => {
                    if (!params.value) return null;

                    const value = params.value.toString();
                    const urls = extractUrls(value);

                    // ✅ If this cell contains links, show action buttons
                    if (urls.length > 0) {
                        const single = urls.length === 1 ? urls[0] : null;
                        const isDoc = single ? isDocumentUrl(single) : false;

                        const btnStyle: React.CSSProperties = {
                            padding: "6px 10px",
                            background: color_secondary,
                            color: color_white,
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            width: "100%",
                            height: "32px",
                            fontSize: "12px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                        };

                        return (
                            <div style={{ padding: 8 }}>
                                <button
                                    style={btnStyle}
                                    title={value}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (single) {
                                            if (isDoc) params.context.openDocumentUrl(single);
                                            else params.context.openWebsite(single);
                                        } else {
                                            params.context.openLinksModal(urls, params.colDef?.headerName || params.colDef?.field);
                                        }
                                    }}
                                >
                                    {single ? (isDoc ? "View Document" : "View Website") : `View Links (${urls.length})`}
                                </button>
                            </div>
                        );
                    }

                    // ✅ Otherwise, keep your existing color/highlight behavior
                    const match = value.match(/^(.*?)\s*(\(([^)]*)\))?$/);
                    const bracketText = (match?.[3] || "").trim();
                    const bgColor = bracketText ? colorSources[bracketText] || "transparent" : "transparent";
                    const isColored = bracketText && colorSources[bracketText];

                    return (
                        <div
                            style={{
                                backgroundColor: bgColor,
                                padding: "8px",
                                color: isColored ? color_white : color_black_light,
                                fontWeight: isColored ? 600 : 400,
                            }}
                        >
                            <HighlightCell value={value} searchText={searchText} fontSize={fontSize} />
                        </div>
                    );
                }

            };
        });


        return [...addInfoCol, ...otherCols];
    }, [rowData, searchText, fontSize, selectedFile?.community_filter]);

    const defaultColDef = useMemo(
        () => ({
            editable: false,
            minWidth: 100,
            filter: true,
            sortable: true,
            resizable: true,
            cellStyle: {
                textAlign: "left",
                padding: "0px",
                color: color_black_light
            },
            headerClass: "bold-header"
        }),
        []
    );

    /* ----- grid handlers & filters ----- */

    const getRowStyle = (params: any) => ({
        backgroundColor: params.node.rowIndex % 2 === 0 ? "#e8f1fb" : "#ffffff"
    });

    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
    };

    const onZoomChange = (newSize: number) => {
        setFontSize(newSize);
        // no resetRowHeights → keeps scrolling smooth
    };

    const isExternalFilterPresent = () => {
        const communitiesActive =
            Array.isArray(selectedCommunities) && selectedCommunities.length > 0;
        return sourceFilter !== null || communitiesActive;
    };

    const doesExternalFilterPass = (node: IRowNode<any>) => {
        const data = node.data || {};

        let passSource = true;
        if (sourceFilter) {
            const values = Object.values(data);
            passSource = values.some((val: any) => {
                if (!val) return false;
                const match = val.toString().match(/\(([^)]*)\)/);
                const bracketText = match?.[1]?.trim();
                return bracketText === sourceFilter;
            });
        }

        let passCommunity = true;
        if (Array.isArray(selectedCommunities) && selectedCommunities.length > 0) {
            const communityValue = String(data["First Nation/Community"] ?? "")
                .trim()
                .toLowerCase();
            const normalizedSelected = selectedCommunities.map((s: any) =>
                String(s ?? "").trim().toLowerCase()
            );
            passCommunity = normalizedSelected.includes(communityValue);
        }

        return passSource && passCommunity;
    };

    useEffect(() => {
        if (gridApi?.onFilterChanged) {
            gridApi.onFilterChanged();
        }
    }, [selectedCommunities, sourceFilter, gridApi]);

    const availableSources = useMemo(() => {
        if (!rowData || rowData.length === 0) return [];
        const found = new Set<string>();

        rowData.forEach((row) => {
            Object.values(row).forEach((val) => {
                if (typeof val === "string") {
                    const match = val.match(/\(([^)]*)\)/);
                    if (match?.[1]) {
                        const src = match[1].trim();
                        if (colorSources[src]) {
                            found.add(src);
                        }
                    }
                }
            });
        });

        return Array.from(found);
    }, [rowData]);

    /* ----- search & navigation ----- */

    const applyQuickFilter = (api: any, text: string) => {
        if (!api) return;
        if (typeof api.setGridOption === "function") {
            api.setGridOption("quickFilterText", text);
            return;
        }
        if (typeof api.setQuickFilter === "function") {
            api.setQuickFilter(text);
            return;
        }

        const model = text
            ? Object.fromEntries(
                (api.getColumnDefs() || []).map((col: any) => [
                    col.field,
                    { type: "contains", filter: text }
                ])
            )
            : {};
        api.setFilterModel(model);
        api.onFilterChanged();
    };

    const scrollToMatch = (match: { rowNode: RowNode; colId: string }) => {
        if (!gridApi) return;
        gridApi.ensureNodeVisible(match.rowNode, "middle");
        gridApi.ensureColumnVisible(match.colId);
        match.rowNode.setSelected(true);
    };

    const navigateMatch = (direction: "next" | "prev") => {
        if (matches.length === 0) return;
        let newIndex = currentMatchIndex;
        if (direction === "next") newIndex = (currentMatchIndex + 1) % matches.length;
        else newIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
        setCurrentMatchIndex(newIndex);
        scrollToMatch(matches[newIndex]);
    };

    useEffect(() => {
        if (!gridApi) return;

        const t = setTimeout(() => {
            handleSearch(searchText);   // auto filter + hasResults + matches
        }, 500); // small debounce so it doesn't spam while typing

        return () => clearTimeout(t);
    }, [searchText, gridApi]);


    const handleSearch = (termOverride?: string) => {
        const term = (termOverride ?? searchText).trim();
        if (!gridApi) return;

        applyQuickFilter(gridApi, term);

        // Wait 1 tick so AG Grid applies the quick filter before reading counts
        requestAnimationFrame(() => {
            const displayed = gridApi.getDisplayedRowCount?.() ?? 0;
            setHasQuickFilterResults(displayed > 0);

            if (!term) {
                setMatches([]);
                setCurrentMatchIndex(0);
                setLastQuery("");
                return;
            }

            // Always recompute matches for the passed term
            const allMatches: { rowNode: RowNode; colId: string }[] = [];
            const needle = term.toLowerCase();

            gridApi.forEachNodeAfterFilterAndSort((node: RowNode) => {
                (gridApi.getColumnDefs() || []).forEach((col: any) => {
                    if (!col.field) return;
                    const value = node.data?.[col.field]?.toString() || "";
                    if (value.toLowerCase().includes(needle)) {
                        allMatches.push({ rowNode: node, colId: col.field });
                    }
                });
            });

            setMatches(allMatches);
            setCurrentMatchIndex(0);
            setLastQuery(term);

            if (allMatches.length > 0) scrollToMatch(allMatches[0]);
        });
    };

    const viewerLoading =
        (pendingPhotoRowId !== null && photosLoading) ||
        (pendingDocRowId !== null && docsLoading);

    const viewerLoadingText =
        pendingPhotoRowId !== null
            ? "Loading photos..."
            : pendingDocRowId !== null
                ? "Loading documents..."
                : "Loading...";





    /* ---------- render ---------- */

    return (
        <>
            <Loader loading={viewerLoading} text={viewerLoadingText} />
            <GridWrapper
                ref={wrapperRef}
                style={{
                    padding: "8px",
                    boxSizing: "border-box",
                    height: `calc(100vh - ${isMobile ? header_mobile_height : header_height})`,
                    overflow: "hidden",
                    position: "relative"
                }}
            >
                <DataTableWrapper>
                    {!editMode && (
                        <>
                            <div
                                ref={topControlsRef}
                                className="top-controls-bar"
                                style={{
                                    marginBottom: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 12px",
                                    borderRadius: "10px",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",

                                    flexWrap: "nowrap",
                                    whiteSpace: "nowrap",

                                    // ✅ IMPORTANT: prevents clipping (including NIA) when width gets tight
                                    overflowX: "auto",
                                    overflowY: "visible",
                                    WebkitOverflowScrolling: "touch",
                                }}
                            >
                                {/* ...your existing buttons... */}

                                {/* Files */}
                                <Button
                                    onClick={() => window.history.back()}
                                    variant="outlined"
                                    startIcon={<ArrowLeft size={18} />}
                                    sx={{
                                        height: 46,
                                        px: 2,
                                        borderRadius: 999,
                                        borderColor: color_border,
                                        background: color_white,
                                        color: color_secondary,
                                        fontWeight: 900,
                                        textTransform: "none",
                                        flexShrink: 0,
                                        "&:hover": { background: color_white_smoke, borderColor: color_secondary },
                                    }}
                                >
                                    Files
                                </Button>

                                {/* Search */}
                                <TextField
                                    variant="outlined"
                                    placeholder="Search records..."
                                    value={searchText}
                                    onChange={(e) => {
                                        setSearchText(e.target.value);
                                        setMatches([]);
                                        setCurrentMatchIndex(0);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSearch();
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search size={18} color={dark_grey} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {/* small icon pills inside input (matches UX) */}
                                                <Box sx={{ display: "flex", gap: 0.75 }}>
                                                    <IconButton
                                                        onClick={() => handleSearch()}
                                                        size="small"
                                                        aria-label="Search"
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 2,
                                                            border: `1px solid ${color_border}`,
                                                            background: color_white,
                                                            color: dark_grey,
                                                        }}
                                                    >
                                                        <Search size={18} />
                                                    </IconButton>

                                                    <IconButton
                                                        aria-label={isRecording ? "Stop voice search" : "Start voice search"}
                                                        title={isRecording ? "Stop voice search" : "Start voice search"}
                                                        size="small"
                                                        onClick={() => {
                                                            if (!isRecording) {
                                                                const SpeechRecognition =
                                                                    (window as any).SpeechRecognition ||
                                                                    (window as any).webkitSpeechRecognition;
                                                                if (!SpeechRecognition) {
                                                                    alert("Speech recognition not supported.");
                                                                    return;
                                                                }
                                                                const recognition = new SpeechRecognition();
                                                                recognition.lang = "en-US";
                                                                recognition.interimResults = false;
                                                                recognition.maxAlternatives = 1;
                                                                recognition.onresult = (event: any) => {
                                                                    const transcript = event.results[0][0].transcript;
                                                                    setSearchText(transcript);
                                                                    handleSearch(transcript);
                                                                };
                                                                recognition.onend = () => setIsRecording(false);
                                                                recognition.start();
                                                                recognitionRef.current = recognition;
                                                                setIsRecording(true);
                                                            } else {
                                                                recognitionRef.current?.stop();
                                                                setIsRecording(false);
                                                            }
                                                        }}
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 2,
                                                            border: `1px solid ${color_border}`,
                                                            background: color_white,
                                                            color: isRecording ? color_primary : dark_grey,
                                                        }}
                                                    >
                                                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                                    </IconButton>
                                                </Box>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        // ✅ make search shrink more so Download stays visible
                                        flex: "1 1 520px",
                                        minWidth: isMobile ? 220 : 360,
                                        maxWidth: isMobile ? 520 : 760,
                                        "& .MuiOutlinedInput-root": {
                                            height: 46,
                                            borderRadius: 999,
                                            background: color_white,
                                            "& fieldset": { borderColor: color_border },
                                            "&:hover fieldset": { borderColor: color_secondary },
                                            "&.Mui-focused fieldset": { borderColor: color_secondary, borderWidth: 2 },
                                        },
                                        "& input::placeholder": { color: color_text_light, opacity: 1 },
                                    }}
                                />

                                {/* ✅ Single compact split-button: top half prev, bottom half next */}
                                <IconButton
                                    disabled={matches.length === 0}
                                    onClick={(e) => {
                                        if (matches.length === 0) return;
                                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                        const y = (e as any).clientY - rect.top;
                                        if (y < rect.height / 2) navigateMatch("prev");
                                        else navigateMatch("next");
                                    }}
                                    title="Top: previous result • Bottom: next result"
                                    aria-label="Result navigation"
                                    disableRipple
                                    sx={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 999,
                                        border: `1px solid ${color_border}`,
                                        background: color_white,
                                        color: dark_grey,
                                        flexShrink: 0,
                                        overflow: "hidden",
                                        padding: 0,
                                        "&:hover": { background: color_white_smoke },
                                        "&.Mui-disabled": { opacity: 0.45 },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            display: "grid",
                                            gridTemplateRows: "1fr 1fr",
                                        }}
                                    >
                                        {/* Top half */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                lineHeight: 0,
                                                borderBottom: `1px solid ${color_border}`, // ✅ divider
                                                pointerEvents: "none", // ✅ click handled by IconButton
                                            }}
                                        >
                                            <ChevronUp size={18} />
                                        </Box>

                                        {/* Bottom half */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                lineHeight: 0,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <ChevronDown size={18} />
                                        </Box>
                                    </Box>
                                </IconButton>


                                {/* NIA (revert to old clean look) */}
                                <Box
                                    sx={{
                                        height: 46,
                                        display: "flex",
                                        alignItems: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* ✅ NIA: no scaling, no clipping, no overlap */}
                                    <div className="nia-slot">
                                        <NIAChatTrigger setOpen={setNiaOpen} />
                                    </div>

                                </Box>


                                {/* Results */}
                                <Box
                                    sx={{
                                        height: 46,
                                        width: 110,                // ✅ fixed width prevents layout jump
                                        px: 1.5,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",  // ✅ center text
                                        borderRadius: 999,
                                        border: `1px solid ${color_border}`,
                                        background: color_white_smoke,
                                        fontWeight: 900,
                                        color: color_black_light,
                                        flexShrink: 0,
                                        whiteSpace: "nowrap",
                                        fontVariantNumeric: "tabular-nums", // ✅ stable digit width
                                    }}
                                >
                                    {matches.length > 0 ? `${currentMatchIndex + 1} of ${matches.length}` : "0 results"}
                                </Box>


                                {/* Zoom In/Out */}
                                <Button
                                    onClick={() => onZoomChange(Math.min(28, fontSize + 2))}
                                    variant="outlined"
                                    sx={{
                                        height: 46,
                                        px: 2,
                                        borderRadius: 999,
                                        borderColor: color_border,
                                        background: color_white,
                                        color: color_black_light,
                                        fontWeight: 900,
                                        textTransform: "none",
                                        flexShrink: 0,
                                        "&:hover": { background: color_white_smoke, borderColor: color_secondary },
                                    }}
                                >
                                    ZOOM IN
                                </Button>

                                <Button
                                    onClick={() => onZoomChange(Math.max(12, fontSize - 2))}
                                    variant="outlined"
                                    sx={{
                                        height: 46,
                                        px: 2,
                                        borderRadius: 999,
                                        borderColor: color_border,
                                        background: color_white,
                                        color: color_black_light,
                                        fontWeight: 900,
                                        textTransform: "none",
                                        flexShrink: 0,
                                        "&:hover": { background: color_white_smoke, borderColor: color_secondary },
                                    }}
                                >
                                    ZOOM OUT
                                </Button>

                                {/* Download */}
                                <Button
                                    onClick={() => {
                                        if (!gridApi) return;

                                        let totalRows: any[] = [];
                                        let rowDataToExport: any[] = [];

                                        gridApi.forEachNode((node: any) => {
                                            if (node.data) totalRows.push(node.data);
                                        });
                                        gridApi.forEachNodeAfterFilterAndSort((node: any) => {
                                            if (node.data) rowDataToExport.push(node.data);
                                        });

                                        const isFiltered = rowDataToExport.length !== totalRows.length;

                                        const worksheet = XLSX.utils.json_to_sheet(rowDataToExport);
                                        const workbook = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

                                        XLSX.writeFile(workbook, isFiltered ? "filtered_data.xlsx" : "all_data.xlsx");
                                    }}
                                    variant="contained"
                                    startIcon={<Download size={18} />}
                                    sx={{
                                        height: 46,
                                        px: 2.25,
                                        borderRadius: 999,
                                        background: color_secondary,
                                        color: color_white,
                                        fontWeight: 900,
                                        textTransform: "none",
                                        flexShrink: 0,
                                        "&:hover": { background: color_secondary_dark },
                                    }}
                                >
                                    Download
                                </Button>
                            </div>



                            <SmartSearchSuggestions
                                query={searchText}
                                rowData={rowData}
                                hasResults={hasQuickFilterResults}
                                onPick={(value) => {
                                    // update input
                                    setSearchText(value);

                                    // immediately apply filter + update hasResults + matches
                                    handleSearch(value);
                                }}
                            />

                            {availableSources.length > 0 && !selectedFile?.community_filter && (
                                <div
                                    ref={filtersRef}
                                    style={{
                                        display: "flex",
                                        gap: "12px",
                                        alignItems: "center",
                                        marginBottom: "12px",
                                        flexWrap: "wrap"
                                    }}
                                >
                                    <span style={{ fontWeight: "bold" }}>
                                        Filter by Source:
                                    </span>

                                    <button
                                        onClick={() => {
                                            setSourceFilter(null);
                                            gridApi?.onFilterChanged();
                                        }}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: "6px",
                                            border:
                                                sourceFilter === null
                                                    ? `3px solid ${color_black}`
                                                    : `1px solid ${color_light_gray}`,
                                            background: color_white,
                                            color: color_black,
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            boxShadow:
                                                sourceFilter === null
                                                    ? "0 0 6px rgba(0,0,0,0.3)"
                                                    : "none"
                                        }}
                                    >
                                        All
                                    </button>

                                    {availableSources.map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setSourceFilter(key);
                                                gridApi?.onFilterChanged();
                                            }}
                                            style={{
                                                padding: "6px 14px",
                                                borderRadius: "6px",
                                                border:
                                                    sourceFilter === key
                                                        ? "3px solid #000"
                                                        : "1px solid #ccc",
                                                background: colorSources[key],
                                                color: color_white,
                                                cursor: "pointer",
                                                fontWeight: 600,
                                                boxShadow:
                                                    sourceFilter === key
                                                        ? "0 0 6px rgba(0,0,0,0.4)"
                                                        : "none",
                                                textShadow:
                                                    "0 1px 2px rgba(0,0,0,0.3)"
                                            }}
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedFile?.community_filter && (
                                <div className="community-action-bar">
                                    <button
                                        className="community-action-btn"
                                        onClick={() => setFilterOpen((p) => !p)}
                                        aria-expanded={filterOpen}
                                        type="button"
                                    >
                                        {filterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        {filterOpen ? "Hide filter" : "Show filter"}
                                    </button>

                                    <button
                                        className="community-action-btn"
                                        type="button"
                                        onClick={() => {
                                            const sampleRow = gridApi?.getDisplayedRowAtIndex?.(0)?.data || rowData?.[0] || {};
                                            const newRow: any = {};
                                            Object.keys(sampleRow).forEach((key) => (newRow[key] = ""));
                                            setFormRow(newRow);
                                            setFormOpen(true);
                                        }}
                                    >
                                        <Plus size={16} />
                                        Add Student
                                    </button>

                                    <div className="community-action-msg" role="note">
                                        <Info size={18} />
                                        <span className="community-action-msg-text">
                                            Aanii, Boozhoo, Wachéye, Sago! We welcome you to add and/or edit any information in the
                                            Shingwauk student list that is missing or inaccurate. Chi-miigwetch!
                                        </span>
                                    </div>
                                </div>
                            )}




                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    width: "100%",
                                    borderRadius: "8px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    alignItems: "stretch",
                                    gap: "8px",
                                    flex: 1,
                                    minHeight: 0,
                                    overflow: "hidden"
                                }}
                            >
                                {selectedFile?.community_filter && !isMobile && filterOpen && (
                                    <div
                                        className="left-panel"
                                        style={{
                                            padding: "8px 16px",
                                            boxSizing: "border-box",
                                            flex: "0 0 30%",
                                            maxWidth: "30%",
                                            transition: "all 220ms ease",
                                            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",

                                            // ✅ key: panel must not grow beyond available height
                                            display: "flex",
                                            flexDirection: "column",
                                            minHeight: 0,
                                            overflow: "hidden",

                                            // ✅ limit height for short screens (uses wrapper height)
                                            maxHeight: "100%",
                                        }}
                                    >
                                        {/* ✅ sticky header area (always visible) */}
                                        <div
                                            style={{
                                                position: "sticky",
                                                top: 0,
                                                zIndex: 2,
                                                background: color_white,
                                                paddingBottom: 8,
                                            }}
                                        >
                                            {/* If CommunityFilter already renders its own header, keep this empty */}
                                            {/* Otherwise you can optionally put a small title here */}
                                        </div>

                                        {/* ✅ scrollable content */}
                                        <div
                                            style={{
                                                flex: 1,
                                                minHeight: 0,
                                                overflowY: "auto",
                                                overflowX: "hidden",
                                                paddingRight: 6,
                                                WebkitOverflowScrolling: "touch",
                                                overscrollBehavior: "contain",
                                            }}
                                        >
                                            <CommunityFilter onClose={() => setFilterOpen(false)} showClose />
                                        </div>
                                    </div>
                                )}


                                <div
                                    className="ag-theme-quartz"
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        minHeight: 0,
                                        height: "100%",
                                        overflow: "auto"
                                    }}
                                >
                                    <AgGridReact
                                        columnDefs={columnDefs}
                                        rowData={rowData}
                                        defaultColDef={defaultColDef}
                                        getRowHeight={() => 48}
                                        headerHeight={45}
                                        domLayout="normal"
                                        rowSelection="single"
                                        getRowStyle={getRowStyle}
                                        onGridReady={onGridReady}
                                        pagination={false}
                                        suppressPaginationPanel={true}
                                        enableBrowserTooltips={true}
                                        rowModelType="clientSide"
                                        isExternalFilterPresent={
                                            isExternalFilterPresent
                                        }
                                        doesExternalFilterPass={
                                            doesExternalFilterPass
                                        }
                                        context={{
                                            openForm: (row: any) => {
                                                setFormRow(row);
                                                setFormOpen(true);
                                            },
                                            openPhotoView: (row: any) => openPhotoViewer(row),
                                            openDocumentsView: (row: any) => openDocumentsViewer(row),
                                            openWebsite,
                                            openDocumentUrl,
                                            openLinksModal,
                                        }}
                                    />
                                </div>
                            </div>

                            {selectedFile?.community_filter &&
                                isMobile &&
                                filterOpen && (
                                    <div
                                        className="mobile-filter-overlay"
                                        role="dialog"
                                        aria-modal="true"
                                        style={{
                                            position: "absolute",
                                            left: 8,
                                            right: 8,
                                            top: overlayTop,
                                            zIndex: 999,
                                            background: color_background,
                                            borderRadius: 10,
                                            boxShadow:
                                                "0 12px 40px rgba(0,0,0,0.25)",
                                            maxHeight: `calc(100vh - ${overlayTop + 16
                                                }px)`,
                                            overflow: "auto",
                                            padding: 12,
                                            transform: "translateY(0)",
                                            transition:
                                                "opacity 240ms ease, transform 240ms ease",
                                            opacity: 1
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                marginBottom: 8
                                            }}
                                        >
                                            <button
                                                onClick={() =>
                                                    setFilterOpen(false)
                                                }
                                                style={{
                                                    padding: "10px 14px",
                                                    borderRadius: 10,
                                                    background: color_primary,
                                                    color: color_white,
                                                    border: "none",
                                                    cursor: "pointer",
                                                    fontWeight: 700,
                                                    flex: 1
                                                }}
                                            >
                                                Close filter
                                            </button>
                                        </div>
                                        <CommunityFilter
                                            onClose={() => setFilterOpen(false)}
                                            showClose
                                        />
                                    </div>
                                )}

                            {/* Links picker */}
                            {linksOpen && (
                                <Dialog open={linksOpen} onClose={() => setLinksOpen(false)} maxWidth="sm" fullWidth>
                                    <DialogTitle sx={{ fontWeight: 900 }}>{linksTitle}</DialogTitle>
                                    <Divider />
                                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.25, py: 2 }}>
                                        {linksList.map((u) => {
                                            const doc = isDocumentUrl(u);
                                            return (
                                                <Box
                                                    key={u}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        gap: 1,
                                                        p: 1.25,
                                                        borderRadius: 2,
                                                        border: "1px solid rgba(0,0,0,0.10)",
                                                        background: color_white,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 800,
                                                            fontSize: 13,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            maxWidth: "60%",
                                                        }}
                                                        title={u}
                                                    >
                                                        {linkLabel(u)}
                                                    </Typography>

                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            setLinksOpen(false);
                                                            if (doc) openDocumentUrl(u);
                                                            else openWebsite(u);
                                                        }}
                                                        sx={{ fontWeight: 900, textTransform: "none" }}
                                                    >
                                                        {doc ? "View Document" : "View Website"}
                                                    </Button>
                                                </Box>
                                            );
                                        })}
                                    </DialogContent>
                                </Dialog>
                            )}

                            {/* URL Document Viewer */}
                            {docUrlOpen && (
                                <DocumentUrlViewerModal
                                    open={docUrlOpen}
                                    url={docUrl}
                                    title={docUrlTitle}
                                    onClose={() => setDocUrlOpen(false)}
                                />
                            )}

                        </>
                    )}

                    {editMode && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: color_white,
                                zIndex: 1000,
                                borderRadius: 8,
                                overflow: "hidden"
                            }}
                        >
                            <EditableTable
                                data={rowData}
                                onClose={() => setEditMode(false)}
                            />
                        </div>
                    )}
                </DataTableWrapper>

                <RecorderOverlay $recording={isRecording}>
                    <MicButton
                        $recording={isRecording}
                        onClick={() => {
                            recognitionRef.current?.stop();
                            setIsRecording(false);
                        }}
                    >
                        <MicIcon />
                    </MicButton>
                    <RecorderText>Listening...</RecorderText>
                </RecorderOverlay>

                {niaOpen && <NIAChat setOpen={setNiaOpen} open={niaOpen} />}
                {formOpen && (
                    <AddInfoForm
                        row={formRow}
                        file={selectedFile}
                        onClose={() => setFormOpen(false)}
                    />
                )}

                {photoModalOpen && (
                    <PhotoViewerModal
                        open={photoModalOpen}
                        onClose={() => setPhotoModalOpen(false)}
                        photos={photos}
                        startIndex={0}
                        mode="view"
                        showThumbnails={false}
                        showStatusPill={false}
                        only_approved={true}
                    />
                )}

                {docModalOpen && (
                    <DocumentViewerModal
                        open={docModalOpen}
                        onClose={() => setDocModalOpen(false)}
                        docs={docs}
                        startIndex={0}
                        mode="view"
                        apiBase={API_BASE}
                        blobEndpointPath="/file/doc"
                        only_approved={true}
                    />
                )}



                <style>
                    {`
          .ag-theme-quartz .bold-header {
            font-size: 1.1rem !important;
            font-weight: bold !important;
            background-color: ${color_blue_lightest} !important;
            color: ${color_secondary} !important;
          }
          .ag-theme-quartz .ag-row-selected {
            background-color: ${color_blue_light} !important;
            font-weight: bold;
          }
          .ag-theme-quartz .ag-row:hover {
            background-color: ${color_blue_lighter} !important;
          }
          .ag-theme-quartz .ag-paging-panel {
            display: none !important;
          }
          .mobile-filter-button { display: none; }
          .left-panel { display: block; }
          @media (max-width: 900px) {
            .mobile-filter-button { display: inline-flex !important; align-items:center; justify-content:center; }
            .left-panel { display: none !important; }
          }
          @media (min-width: 900px) and (max-width: 1200px) {
            .left-panel {
              flex: 0 0 40% !important;
              max-width: 40% !important;
            }
          }
          .ag-pinned-left-cols-container,
          .ag-pinned-left-header {
            width: max-content !important;
          }
           
            
                    
          .ag-theme-quartz .ag-cell {
       font-weight: bold !important;
   }
       .top-controls-bar {
        scrollbar-width: none;          /* Firefox */
        -ms-overflow-style: none;       /* IE/Edge legacy */
        }
        .top-controls-bar::-webkit-scrollbar {
        display: none;                  /* Chrome/Safari */
        }

        .nia-slot {
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        position: relative;
        z-index: 2;                     /* keeps it above neighbors if any overlap happens */
        }

        .nia-slot > * {
        display: flex;
        align-items: center;
        }

       

        .community-action-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
        }

        

        .community-action-btn:focus-visible {
        outline: 3px solid ${color_blue_light};
        outline-offset: 2px;
        }

        .community-action-bar {
  display: flex;
  align-items: stretch;          /* ✅ makes buttons match message height */
  gap: 8px;
  margin-bottom: 8px;

  padding: 6px;                  /* ✅ reduced height */
  border-radius: 10px;
  background: ${color_white};
  border: 1px solid ${color_border};
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);

  flex-wrap: wrap;               /* ✅ lets message wrap cleanly */
}

.community-action-btn {
  align-self: stretch;           /* ✅ match the tallest item */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 0 14px;               /* ✅ reduced height (no vertical padding) */
  min-height: 36px;              /* ✅ compact baseline height */
  border-radius: 8px;

  background: ${color_secondary};
  color: ${color_white};
  border: none;
  cursor: pointer;
  white-space: nowrap;

  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.community-action-btn:hover {
  background: ${color_secondary_dark};
}

.community-action-msg {
  flex: 1 1 520px;
  min-width: 280px;

  align-self: stretch;           /* ✅ same height as buttons */
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 6px 12px;             /* ✅ reduced height */
  border-radius: 8px;

  background: ${color_blue_lightest};
  border: 1px solid ${color_blue_light};
  color: ${color_black_light};

  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

.community-action-msg-text {
  white-space: normal;           /* ✅ show full text */
  overflow: visible;
  text-overflow: clip;
}



        .community-action-msg-icon {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: ${color_white};
        border: 1px solid ${color_border};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: ${color_secondary};
        flex-shrink: 0;
        }

        @media (max-width: 900px) {
            .community-action-bar {
                flex-wrap: wrap;
            }
            .community-action-msg {
                flex: 1 1 100%;
                min-width: 100%;
            }
        }


        

        /* Responsive: allow message to wrap below buttons when space is tight */
        @media (max-width: 900px) {
        .community-action-bar {
            flex-wrap: wrap;
        }
        .community-action-msg {
            flex: 1 1 100%;
        }
        }


        `}
                </style>
            </GridWrapper>
        </>

    );
}
