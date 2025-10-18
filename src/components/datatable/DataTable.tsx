'use client';
import React, { useMemo, useRef, useState } from "react";
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
import { color_primary, color_secondary } from "../../constants/colors";
import NIAChat, { NIAChatTrigger } from "../NIAChat";
import { MicIcon, MicOffIcon, SearchIcon } from "lucide-react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import styled, { keyframes } from "styled-components";
import { colorSources } from "../../constants/constants";
import { LegendItem, LegendWrapper } from "../Legent";


ModuleRegistry.registerModules([AllCommunityModule]);
const themeLightWarm = themeQuartz.withPart(colorSchemeLightWarm);

interface DataGridProps {
    rowData: any[];
}

// Overlay container
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


const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// put this above your component (or inside it before usage)
const applyQuickFilter = (api: any, text: string) => {
    if (!api) return;

    // AG Grid v31+ (recommended): set grid option
    if (typeof api.setGridOption === 'function') {
        api.setGridOption('quickFilterText', text);
        return;
    }

    // Older versions: classic quick filter
    if (typeof api.setQuickFilter === 'function') {
        api.setQuickFilter(text);
        return;
    }

    // Fallback: simulate quick filter by applying a "contains" filter on all columns
    const model = text
        ? Object.fromEntries(
            (api.getColumnDefs() || []).map((col: any) => [
                col.field,
                { type: 'contains', filter: text },
            ])
        )
        : {};
    api.setFilterModel(model);
    api.onFilterChanged();
};


export default function DataGrid({ rowData }: DataGridProps) {
    const [gridApi, setGridApi] = useState<any>(null);
    const [searchText, setSearchText] = useState('');
    const [lastQuery, setLastQuery] = useState('');
    const [matches, setMatches] = useState<{ rowNode: RowNode; colId: string }[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [fontSize, setFontSize] = useState(16);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [niaOpen, setNiaOpen] = useState(false);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);

    const columnDefs = useMemo(() => {
        if (!rowData || rowData.length === 0) return [];
        return Object.keys(rowData[0]).map(key => ({
            field: key,
            headerName: key,
            tooltipValueGetter: (params: any) => params.value,
            cellRenderer: (params: any) => {
                if (!params.value) return null;

                const value = params.value.toString();
                const safeSearch = escapeRegExp(searchText || "");
                const regexSearch = safeSearch ? new RegExp(`(${safeSearch})`, "gi") : null;

                const match = value.match(/^(.*?)\s*(\(([^)]*)\))?$/);
                const mainText = (match?.[1] || "").trim();

                const renderHighlighted = (text: string) => {
                    if (!regexSearch) return text;
                    return text.split(regexSearch).map((part, idx) =>
                        regexSearch.test(part) ? (
                            <span key={idx} style={{ backgroundColor: "yellow" }}>
                                {part}
                            </span>
                        ) : (
                            part
                        )
                    );
                };

                // ✅ Use params.fontSize
                return <span style={{ fontSize: `${params.fontSize}px` }}>{renderHighlighted(mainText)}</span>;
            },
            cellRendererParams: { fontSize }, // Pass dynamically
            cellStyle: (params: any) => {
                const value = params.value?.toString() || "";
                const match = value.match(/^(.*?)\s*(\(([^)]*)\))?$/);
                const bracketText = (match?.[3] || "").trim();
                const bgColor = bracketText ? colorSources[bracketText] || "transparent" : "transparent";
                return {
                    backgroundColor: bgColor,
                    padding: '8px',
                    color: '#1a1a1a',
                };
            }
        }));
    }, [rowData, searchText, fontSize]); // ✅ include fontSize as dependency


    const defaultColDef = useMemo(() => ({
        editable: false,
        minWidth: 100,
        filter: true,
        sortable: true,
        resizable: true,
        cellStyle: {
            textAlign: 'left',
            padding: '8px',
            color: '#1a1a1a'
        },
        headerClass: 'bold-header',
    }), []);


    const getRowStyle = (params: any) => ({
        backgroundColor: params.node.rowIndex % 2 === 0 ? '#e8f1fb' : '#ffffff'
    });

    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
    };

    const onZoomChange = (newSize: number) => {
        setFontSize(newSize);
        gridApi?.refreshCells({ force: true });

        gridApi.resetRowHeights();
    };



    const handleSearch = () => {
        const term = searchText.trim();
        if (!gridApi) return;

        // 1) Apply filtering globally (quick filter or fallback)
        applyQuickFilter(gridApi, term);

        // Clear matches if empty search
        if (!term) {
            setMatches([]);
            setCurrentMatchIndex(0);
            setLastQuery('');
            return;
        }

        // 2) Build matches **only from visible (filtered) rows**
        const allMatches: { rowNode: RowNode; colId: string }[] = [];
        const needle = term.toLowerCase();

        // afterFilterAndSort iterates only rows currently shown
        gridApi.forEachNodeAfterFilterAndSort((node: RowNode) => {
            (gridApi.getColumnDefs() || []).forEach((col: any) => {
                const value = node.data?.[col.field]?.toString() || '';
                if (value.toLowerCase().includes(needle)) {
                    allMatches.push({ rowNode: node, colId: col.field });
                }
            });
        });

        setMatches(allMatches);
        setCurrentMatchIndex(0);
        setLastQuery(term);

        if (allMatches.length > 0) {
            scrollToMatch(allMatches[0]);
        }
    };


    const isExternalFilterPresent = () => sourceFilter !== null;

    const doesExternalFilterPass = (node: IRowNode<any>) => {
        if (!sourceFilter) return true; // "All" selected → no filter
        const values = Object.values(node.data || {});
        return values.some((val: any) => {
            if (!val) return false;
            const match = val.toString().match(/\(([^)]*)\)/);
            const bracketText = match?.[1]?.trim();
            return bracketText === sourceFilter;
        });
    };

    // Find which sources are actually used in rowData
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



    const scrollToMatch = (match: { rowNode: RowNode; colId: string }) => {
        if (!gridApi) return;
        gridApi.ensureNodeVisible(match.rowNode, 'middle');
        gridApi.ensureColumnVisible(match.colId);
        match.rowNode.setSelected(true);
    };

    const navigateMatch = (direction: 'next' | 'prev') => {
        if (matches.length === 0) return;
        let newIndex = currentMatchIndex;
        if (direction === 'next') newIndex = (currentMatchIndex + 1) % matches.length;
        else newIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
        setCurrentMatchIndex(newIndex);
        scrollToMatch(matches[newIndex]);
    };

    return (
        <GridWrapper style={{ padding: '8px', boxSizing: 'border-box' }}>
            <DataTableWrapper>
                <div
                    style={{
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#f1f5f9",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        flexWrap: "nowrap",
                        overflowX: "auto",
                    }}
                >
                    {/* Back Button */}
                    <button
                        onClick={() => window.history.back()}
                        style={{
                            height: "56px",
                            padding: "0 20px",
                            fontSize: "1rem",
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
                        }}
                    >
                        ← Files
                    </button>

                    {/* Search Input with buttons inside */}
                    <TextField
                        variant="outlined"
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); setMatches([]); setCurrentMatchIndex(0); }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleSearch}>
                                        <SearchIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => {
                                            if (!isRecording) {
                                                const SpeechRecognition =
                                                    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                                if (!SpeechRecognition) { alert("Speech recognition not supported."); return; }
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
                                    >
                                        {isRecording ? <MicOffIcon /> : <MicIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: "200px", flex: 1, height: "56px" }}
                    />

                    {/* Navigation arrows */}
                    <button
                        onClick={() => navigateMatch("prev")}
                        style={{
                            height: "56px",
                            padding: "0 12px",
                            fontSize: "1rem",
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
                            height: "56px",
                            padding: "0 12px",
                            fontSize: "1rem",
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

                    <NIAChatTrigger setOpen={setNiaOpen} />

                    {/* Match Info */}
                    <span
                        style={{
                            height: "56px",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 12px",
                            fontSize: "1rem",
                            color: "#333",
                            background: "#e3f2fd",
                            borderRadius: "10px",
                            fontWeight: 500,
                            flexShrink: 0,
                        }}
                    >
                        {matches.length > 0 ? `${currentMatchIndex + 1} of ${matches.length}` : "0 results"}
                    </span>

                    {/* Zoom */}
                    <button
                        title="Zoom In"
                        onClick={() => onZoomChange(Math.min(28, fontSize + 2))}
                        style={{
                            height: "56px",
                            padding: "0 12px",
                            fontSize: "1rem",
                            borderRadius: "10px",
                            border: "1px solid #ccc",
                            cursor: "pointer",
                            background: "#fff",
                            fontWeight: "bold",
                            flexShrink: 0,
                        }}
                    >
                        ZOOM IN
                    </button>
                    <button
                        title="Zoom Out"
                        onClick={() => onZoomChange(Math.max(12, fontSize - 2))}
                        style={{
                            height: "56px",
                            padding: "0 12px",
                            fontSize: "1rem",
                            borderRadius: "10px",
                            border: "1px solid #ccc",
                            cursor: "pointer",
                            background: "#fff",
                            fontWeight: "bold",
                            flexShrink: 0,
                        }}
                    >
                        ZOOM OUT
                    </button>

                    {/* Download */}
                    <button
                        onClick={() => {
                            if (!gridApi) return;

                            // Detect if filters or quick filter are active
                            const filterModel = gridApi.getFilterModel();
                            const quickFilter = gridApi.getQuickFilter();
                            const isFiltered =
                                Object.keys(filterModel).length > 0 || (quickFilter && quickFilter.trim() !== "");

                            // Export as CSV (built-in, no modules needed)
                            gridApi.exportDataAsCsv({
                                onlyFiltered: isFiltered, // if filtered → export only those rows
                                fileName: isFiltered ? "filtered_data.csv" : "all_data.csv",
                            });
                        }}
                        style={{
                            height: "56px",
                            padding: "0 20px",
                            fontSize: "1rem",
                            borderRadius: "10px",
                            border: `1px solid ${color_secondary}`,
                            background: "#FFE0B2",
                            cursor: "pointer",
                            color: color_secondary,
                            fontWeight: "bold",
                            flexShrink: 0,
                        }}
                    >
                        ⬇️ Download
                    </button>
                </div>

                {availableSources.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            marginBottom: "12px",
                            flexWrap: "wrap",
                        }}
                    >
                        <span style={{ fontWeight: "bold" }}>Filter by Source:</span>

                        {/* "All" button */}
                        <button
                            onClick={() => {
                                setSourceFilter(null);
                                gridApi?.onFilterChanged();
                            }}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                border: sourceFilter === null ? "3px solid #000" : "1px solid #ccc",
                                background: "#f5f5f5",
                                color: "#333",
                                cursor: "pointer",
                                fontWeight: 600,
                                boxShadow: sourceFilter === null ? "0 0 6px rgba(0,0,0,0.3)" : "none",
                            }}
                        >
                            All
                        </button>

                        {/* Only show available sources */}
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
                                    border: sourceFilter === key ? "3px solid #000" : "1px solid #ccc",
                                    background: colorSources[key],
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    boxShadow: sourceFilter === key ? "0 0 6px rgba(0,0,0,0.4)" : "none",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                }}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                )}

                <div
                    className="ag-theme-quartz"
                    style={{ flex: 1, width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    {...themeLightWarm}
                >
                    <AgGridReact
                        columnDefs={columnDefs}
                        rowData={rowData}
                        defaultColDef={defaultColDef}

                        getRowHeight={(params) => {
                            return fontSize + 16; // 16px padding (8px top + 8px bottom)
                        }}
                        headerHeight={45}
                        domLayout="normal"
                        rowSelection="single"
                        getRowStyle={getRowStyle}
                        onGridReady={onGridReady}
                        pagination={false}
                        suppressPaginationPanel={true}
                        enableBrowserTooltips={true}
                        rowModelType="clientSide"
                        isExternalFilterPresent={() => !!sourceFilter}
                        doesExternalFilterPass={doesExternalFilterPass}
                    />

                </div>
            </DataTableWrapper>
            <RecorderOverlay $recording={isRecording}>
                <MicButton $recording={isRecording} onClick={() => {
                    recognitionRef.current?.stop();
                    setIsRecording(false);
                }}>
                    <MicIcon />
                </MicButton>
                <RecorderText>Listening...</RecorderText>
            </RecorderOverlay>

            {niaOpen && <NIAChat setOpen={setNiaOpen} open={niaOpen} />}
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
        `}
            </style>
        </GridWrapper>
    );
}
