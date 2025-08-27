'use client';
import React, { useMemo, useState } from "react";
import {
    AllCommunityModule,
    ModuleRegistry,
    themeQuartz,
    colorSchemeLightWarm,
    GridReadyEvent,
    RowNode
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { GridWrapper } from "../Wrappers";
import { color_primary, color_secondary } from "../../constants/colors";

ModuleRegistry.registerModules([AllCommunityModule]);
const themeLightWarm = themeQuartz.withPart(colorSchemeLightWarm);

interface DataGridProps {
    rowData: any[];
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function DataGrid({ rowData }: DataGridProps) {
    const [gridApi, setGridApi] = useState<any>(null);
    const [searchText, setSearchText] = useState('');
    const [lastQuery, setLastQuery] = useState('');
    const [matches, setMatches] = useState<{ rowNode: RowNode; colId: string }[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [fontSize, setFontSize] = useState(16);

    const columnDefs = useMemo(() => {
        if (!rowData || rowData.length === 0) return [];
        return Object.keys(rowData[0]).map(key => ({
            field: key,
            headerName: key,
            tooltipValueGetter: (params: any) => params.value,
            cellRenderer: (params: any) => {
                if (!searchText) return params.value;
                const value = params.value?.toString() || '';
                const safe = escapeRegExp(searchText);
                const parts = value.split(new RegExp(`(${safe})`, 'gi'));
                return (
                    <>
                        {parts.map((part: string, idx: number) =>
                            part.toLowerCase() === searchText.toLowerCase() ? (
                                <span key={idx} style={{ backgroundColor: 'yellow' }}>{part}</span>
                            ) : part
                        )}
                    </>
                );
            },
            cellStyle: { padding: '8px', color: '#1a1a1a' }
        }));
    }, [rowData, searchText]);

    const defaultColDef = {
        editable: false,
        minWidth: 100,
        filter: true,
        sortable: true,
        resizable: true,
        cellStyle: { textAlign: 'left', fontSize: `${fontSize}px`, padding: '8px', color: '#1a1a1a' },
        headerClass: 'bold-header',
    };


    const getRowStyle = (params: any) => ({
        backgroundColor: params.node.rowIndex % 2 === 0 ? '#e8f1fb' : '#ffffff'
    });

    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
    };

    const onZoomChange = (newSize: number) => {
        setFontSize(newSize);
        gridApi?.refreshCells({ force: true });
    };

    const handleSearch = () => {
        const term = searchText.trim();
        if (!gridApi || !term) {
            setMatches([]);
            setCurrentMatchIndex(0);
            setLastQuery(term);
            return;
        }

        const allMatches: { rowNode: RowNode; colId: string }[] = [];
        const needle = term.toLowerCase();
        gridApi.forEachNode((node: RowNode) => {
            gridApi.getColumnDefs()?.forEach((col: any) => {
                const value = node.data[col.field]?.toString() || '';
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
        <GridWrapper style={{ padding: '8px' }}>
            <div
                style={{
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f1f5f9',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    flexWrap: 'wrap',
                }}
            >
                {/* Back Button */}
                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    style={{
                        padding: '10px 20px',
                        fontSize: '1.2rem',
                        borderRadius: '10px',
                        border: `1px solid ${color_secondary}`,
                        background: '#E3F2FD',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: color_secondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    ← Back to Files
                </button>


                {/* Search Input */}
                <input
                    type="text"
                    value={searchText}
                    onChange={e => {
                        setSearchText(e.target.value);
                        setMatches([]);
                        setCurrentMatchIndex(0);
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            const term = searchText.trim();
                            if (!term) {
                                setMatches([]);
                                setCurrentMatchIndex(0);
                                setLastQuery('');
                                return;
                            }
                            if (term !== lastQuery || matches.length === 0) {
                                handleSearch();
                            } else {
                                navigateMatch('next');
                            }
                        }
                    }}
                    placeholder="Search..."
                    style={{
                        flex: 1,
                        padding: '12px 14px',
                        fontSize: '1.2rem',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        outline: 'none',
                        boxSizing: 'border-box',
                        minWidth: '200px',
                    }}
                />

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    style={{
                        padding: '10px 18px',
                        fontSize: '1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: color_secondary,
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                    }}
                >
                    🔍 Search
                </button>

                {/* Zoom Label */}
                <span
                    style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        marginLeft: '10px',
                        color: '#333',
                    }}
                >
                    Zoom:
                </span>

                {/* Zoom Out */}
                <button
                    title="Zoom Out"
                    onClick={() => onZoomChange(Math.max(12, fontSize - 2))}
                    style={{
                        padding: '6px 12px',
                        fontSize: '1rem',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                        background: '#fff',
                        fontWeight: 'bold',
                    }}
                >
                    A-
                </button>

                {/* Zoom In */}
                <button
                    title="Zoom In"
                    onClick={() => onZoomChange(Math.min(28, fontSize + 2))}
                    style={{
                        padding: '6px 12px',
                        fontSize: '1rem',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                        background: '#fff',
                        fontWeight: 'bold',
                    }}
                >
                    A+
                </button>

                {/* Navigation Arrows */}
                <button onClick={() => navigateMatch('prev')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: '1rem', color: color_primary }}>▲</button>
                <button onClick={() => navigateMatch('next')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: '1rem', color: color_primary }}>▼</button>

                {/* Match Info */}
                <span style={{ fontSize: '1rem', color: '#333', background: '#e3f2fd', padding: '6px 10px', borderRadius: '6px', fontWeight: 500 }}>
                    {matches.length > 0 ? `${currentMatchIndex + 1} of ${matches.length}` : '0 results'}
                </span>
            </div>


            <div
                className="ag-theme-quartz"
                style={{ height: '500px', width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                {...themeLightWarm}
            >
                <AgGridReact
                    columnDefs={columnDefs}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    rowHeight={40}
                    headerHeight={45}
                    domLayout="normal"
                    rowSelection="single"
                    getRowStyle={getRowStyle}
                    onGridReady={onGridReady}
                    pagination={false}
                    suppressPaginationPanel={true}
                    enableBrowserTooltips={true}
                />
            </div>

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
