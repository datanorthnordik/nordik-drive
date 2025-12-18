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
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { DataTableWrapper, GridWrapper } from "../Wrappers";
import { color_primary, color_secondary, color_background, header_height, header_mobile_height } from "../../constants/colors";
import NIAChat, { NIAChatTrigger } from "../NIAChat";
import { MicIcon, MicOffIcon, SearchIcon } from "lucide-react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import styled, { keyframes } from "styled-components";
import { colorSources } from "../../constants/constants";
import * as XLSX from "xlsx";
import CommunityFilter from "../CommunityFilter/CommunityFilter";
import { useDispatch, useSelector } from "react-redux";
import { setCommunities } from "../../store/auth/fileSlice";
import { AppDispatch } from "../../store/store";
import { EditableTable } from "./EditableTable";
import AddInfoForm from "./AddInfoForm";
import PhotoViewerModal from "../photoview/PhotoView";
import SmartSearchSuggestions from "./SmartSearchSuggestions";


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
                background: "#1976d2",
                color: "#fff",
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
  color: ${props => props.$recording ? "#fff" : "#000"};
  font-size: 48px;
  animation: ${props => props.$recording ? pulse : "none"} 1.5s infinite;
  transition: all 0.3s ease;
`;

const RecorderText = styled.div`
  margin-top: 20px;
  color: white;
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
                                background: "#0d47a1",
                                color: "#fff",
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

            // 👉 DEFAULT RENDERING for all other columns (unchanged)
            return {
                field: key,
                headerName: key,
                tooltipValueGetter: (params: any) => params.value,
                cellRenderer: (params: any) => {
                    if (!params.value) return null;

                    const value = params.value.toString();
                    const match = value.match(/^(.*?)\s*(\(([^)]*)\))?$/);
                    const bracketText = (match?.[3] || "").trim();
                    const bgColor = bracketText ? colorSources[bracketText] || "transparent" : "transparent";
                    const isColored = bracketText && colorSources[bracketText];

                    return (
                        <div
                            style={{
                                backgroundColor: bgColor,
                                padding: "8px",
                                color: isColored ? "#fff" : "#1a1a1a",
                                fontWeight: isColored ? 600 : 400
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
                color: "#1a1a1a"
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


    /* ---------- render ---------- */

    return (
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
                            style={{
                                marginBottom: "10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "#f1f5f9",
                                padding: "8px 12px",
                                borderRadius: "10px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",

                                // ✅ One row always
                                flexWrap: "nowrap",

                                // ✅ Scroll ONLY on mobile
                                overflowX: isMobile ? "auto" : "hidden",
                                overflowY: "hidden",
                                WebkitOverflowScrolling: "touch",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <button
                                onClick={() => window.history.back()}
                                style={{
                                    height: "44px",
                                    padding: "0 16px",
                                    fontSize: "0.95rem",
                                    borderRadius: "10px",
                                    border: `1px solid ${color_secondary}`,
                                    background: "#E3F2FD",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    color: color_secondary,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                ← Files
                            </button>

                            <TextField
                                variant="outlined"
                                placeholder="Search..."
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
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => handleSearch()} size="small">
                                                <SearchIcon size={18} />
                                            </IconButton>
                                            <IconButton
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
                                                            handleSearch();
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
                                                color={isRecording ? "error" : "default"}
                                                title={isRecording ? "Stop recording" : "Start voice search"}
                                                size="small"
                                            >
                                                {isRecording ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    // ✅ better space usage on desktop, still scrolls on mobile when needed
                                    flex: "1 1 420px",
                                    minWidth: isMobile ? "240px" : "320px",
                                    maxWidth: isMobile ? "520px" : "680px",

                                    "& .MuiOutlinedInput-root": {
                                        height: "44px",
                                        borderRadius: "10px",
                                    },
                                }}
                            />

                            <button
                                onClick={() => navigateMatch("prev")}
                                style={{
                                    height: "44px",
                                    padding: "0 10px",
                                    fontSize: "0.95rem",
                                    borderRadius: "10px",
                                    border: "1px solid #ccc",
                                    background: "#fff",
                                    cursor: "pointer",
                                    color: color_primary,
                                    flexShrink: 0,
                                }}
                            >
                                ▲
                            </button>

                            <button
                                onClick={() => navigateMatch("next")}
                                style={{
                                    height: "44px",
                                    padding: "0 10px",
                                    fontSize: "0.95rem",
                                    borderRadius: "10px",
                                    border: "1px solid #ccc",
                                    background: "#fff",
                                    cursor: "pointer",
                                    color: color_primary,
                                    flexShrink: 0,
                                }}
                            >
                                ▼
                            </button>

                            {/* ✅ NIA Trigger shrink + stop it from expanding the bar */}
                            <div
                                style={{
                                    height: "44px",
                                    display: "flex",
                                    alignItems: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <div
                                    style={{
                                        transform: isMobile ? "scale(0.92)" : "scale(0.85)",
                                        transformOrigin: "center",
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <NIAChatTrigger setOpen={setNiaOpen} />
                                </div>
                            </div>

                            <span
                                style={{
                                    height: "44px",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0 10px",
                                    fontSize: "0.95rem",
                                    color: "#333",
                                    background: "#e3f2fd",
                                    borderRadius: "10px",
                                    fontWeight: 500,
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {matches.length > 0
                                    ? `${currentMatchIndex + 1} of ${matches.length}`
                                    : "0 results"}
                            </span>

                            <button
                                title="Zoom In"
                                onClick={() => onZoomChange(Math.min(28, fontSize + 2))}
                                style={{
                                    height: "44px",
                                    padding: "0 10px",
                                    fontSize: "0.95rem",
                                    borderRadius: "10px",
                                    border: "1px solid #ccc",
                                    cursor: "pointer",
                                    background: "#fff",
                                    fontWeight: "bold",
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                ZOOM IN
                            </button>

                            <button
                                title="Zoom Out"
                                onClick={() => onZoomChange(Math.max(12, fontSize - 2))}
                                style={{
                                    height: "44px",
                                    padding: "0 10px",
                                    fontSize: "0.95rem",
                                    borderRadius: "10px",
                                    border: "1px solid #ccc",
                                    cursor: "pointer",
                                    background: "#fff",
                                    fontWeight: "bold",
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                ZOOM OUT
                            </button>

                            <button
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
                                style={{
                                    height: "44px",
                                    padding: "0 16px",
                                    fontSize: "0.95rem",
                                    borderRadius: "10px",
                                    border: `1px solid ${color_secondary}`,
                                    background: "#FFE0B2",
                                    cursor: "pointer",
                                    color: color_secondary,
                                    fontWeight: "bold",
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                ⬇️ Download
                            </button>
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
                                                ? "3px solid #000"
                                                : "1px solid #ccc",
                                        background: "#f5f5f5",
                                        color: "#333",
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
                                            color: "#fff",
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
                            <div
                                style={{
                                    marginBottom: 8,
                                    display: "flex",
                                    alignItems: "stretch",
                                    gap: 10,

                                    // ✅ keep it clean on smaller widths
                                    flexWrap: "wrap",
                                }}
                            >
                                {/* Left: action buttons */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <button
                                        className="mobile-filter-button"
                                        onClick={() => setFilterOpen((prev) => !prev)}
                                        aria-expanded={filterOpen}
                                        style={{
                                            height: "44px",
                                            padding: "0 14px",
                                            borderRadius: 10,
                                            background: color_secondary,
                                            color: "#fff",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 14,
                                            fontWeight: 700,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {filterOpen ? "Hide filter" : "Show filter"}
                                    </button>

                                    <button
                                        className="mobile-filter-button"
                                        onClick={() => {
                                            const sampleRow = gridApi.getDisplayedRowAtIndex(0)?.data; // or rowData[0]
                                            const newRow: any = {};

                                            Object.keys(sampleRow).forEach((key) => {
                                                newRow[key] = "";
                                            });
                                            setFormRow(newRow);
                                            setFormOpen(true);
                                        }}
                                        style={{
                                            height: "44px",
                                            padding: "0 14px",
                                            borderRadius: 10,
                                            background: color_secondary,
                                            color: "#fff",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 14,
                                            fontWeight: 700,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Add Student
                                    </button>
                                </div>

                                {/* Right: compact message (takes remaining width) */}
                                <div
                                    style={{
                                        flex: "1 1 520px",
                                        minWidth: 260,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "#1a1a1a",
                                        background: "#F0F4FF",
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        lineHeight: 1.35,
                                        boxSizing: "border-box",

                                        // ✅ keep height compact, avoid huge block
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    Aanii, Boozhoo, Wachéye, Sago! We welcome you to add and/or edit any
                                    information in the Shingwauk student list that is missing or inaccurate.
                                    Chi-miigwetch!
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
                                            background: "#fff",
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
                                        openPhotoView: (row: any) => {
                                            setPhotoRequestId(row.id)
                                            setPhotoModalOpen(true);
                                        }
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
                                                color: "#fff",
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
                            background: "white",
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
                    requestId={photoRequestId || 0}
                    startIndex={0}
                    onClose={() => setPhotoModalOpen(false)}
                />
            )}


            <style>
                {`
          .ag-theme-quartz .bold-header {
            font-size: 1.1rem !important;
            font-weight: bold !important;
            background-color: #cce0ff !important;
            color: #0d47a1 !important;
          }
          .ag-theme-quartz .ag-row-selected {
            background-color: #99ccff !important;
            font-weight: bold;
          }
          .ag-theme-quartz .ag-row:hover {
            background-color: #b3d1ff !important;
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
        `}
            </style>
        </GridWrapper>
    );
}
