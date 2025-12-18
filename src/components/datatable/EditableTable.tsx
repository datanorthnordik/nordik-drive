import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, IconButton, InputAdornment } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { startEditing } from '../../store/slices/editSlice';
import { color_primary, color_secondary } from '../../constants/colors';
import { SearchIcon, ArrowLeft } from 'lucide-react';
import { colorSources } from '../../constants/constants';
import CommunityFilter from '../CommunityFilter/CommunityFilter';
import useFetch from '../../hooks/useFetch';

interface EditableTableProps {
    data: any[];
    onClose: () => void;
}

export const EditableTable = ({ data, onClose }: EditableTableProps) => {
    const [editedData, setEditedData] = useState<{ [key: string]: any }>({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [gridApi, setGridApi] = useState<any>(null);
    const [fontSize, setFontSize] = useState(16);
    const [searchText, setSearchText] = useState('');
    const [matches, setMatches] = useState<any[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [filterOpen, setFilterOpen] = useState(false);
    const dispatch = useDispatch();
    const { selectedCommunities, selectedFile } = useSelector((state: any) => state.file);

    const { data: result, loading, error, fetchData } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/file/edit/request", "POST", false)

    const excludedFields = ['lat', 'lng', 'latitude', 'longitude', 'coordinates', 'id'];

    const getBackgroundColor = (value: any): string => {
        if (!value) return 'transparent';
        const match = value.toString().match(/^(.*?)\s*(\(([^)]*)\))?$/);
        const bracketText = (match?.[3] || "").trim();
        return bracketText ? colorSources[bracketText] || "transparent" : "transparent";
    };

    const getTextColor = (value: any): string => {
        if (!value) return '#1a1a1a';
        const match = value.toString().match(/^(.*?)\s*(\(([^)]*)\))?$/);
        const bracketText = (match?.[3] || "").trim();
        return bracketText && colorSources[bracketText] ? "#fff" : "#1a1a1a";
    };

    const isTrulyEmpty = (v: any) => {
        if (v === null || v === undefined) return true;
        if (typeof v !== "string") return false;            // numbers like 0 are NOT empty
        return v.replace(/\u00A0/g, "").trim() === "";      // remove NBSP and spaces
    };


    // Modify the columnDefs to handle row height with fontSize
    const columnDefs = useMemo(() => {
        if (!data?.length) return [];

        return Object.keys(data[0])
            .filter(key => !excludedFields.includes(key.toLowerCase()))
            .map(key => ({
                field: key,
                headerName: key,
                editable: (p: any) => isTrulyEmpty(p.value),

                // Block Backspace/Delete on non-empty cells (prevents clearing content)
                suppressKeyboardEvent: (p: any) => {
                    const e = p.event as KeyboardEvent;
                    if (!e) return false;
                    const k = e.key;
                    if ((k === 'Backspace' || k === 'Delete') && !isTrulyEmpty(p.value)) {
                        return true; // suppress the key, do NOT edit/clear
                    }
                    return false;
                },

                flex: 1,
                minWidth: 150,
                cellStyle: (params: any) => ({
                    backgroundColor: getBackgroundColor(params.value),
                    color: getTextColor(params.value),
                    padding: '8px',
                    fontSize: `${fontSize}px`,
                    height: `${fontSize + 24}px`,
                    lineHeight: `${fontSize + 16}px`
                }),
                cellEditor: 'agTextCellEditor',
                cellEditorParams: {
                    useFormatter: true,
                    maxLength: 200,
                },
                cellEditorStyle: {
                    fontSize: `${fontSize}px`,
                    height: '100%',
                    padding: '8px'
                }
            }));
    }, [data, fontSize]);


    const onCellValueChanged = (params: any) => {
        const { data: rowData, colDef, newValue, oldValue } = params;
        console.log(rowData);

        // Key for this cell
        const name = `${rowData["First Names"]} ${rowData["Last Names"]}`;
        const key = rowData.id ? `row-${rowData.id}-field-${colDef.field}` : ""

        // If no change, do nothing
        if (newValue === oldValue) return;

        setEditedData(prev => {
            // ✅ If old data already exists, don't update it
            if (prev[key]) {
                return prev;   // do nothing
            }

            // ✅ Otherwise add new edited data
            return {
                ...prev,
                [key]: {
                    name,
                    field: colDef.field,
                    oldValue,
                    newValue
                }
            };
        });
    };


    const handleSave = () => {
        if (Object.keys(editedData).length > 0) {
            setConfirmOpen(true);
        }
    };

    const handleConfirm = () => {
        dispatch(startEditing(editedData));
        setConfirmOpen(false);
        onClose();
        const body = { changes: convertEditedData(editedData), file_id: selectedFile.id, filename: selectedFile.filename };

        fetchData(body)
    };

    function convertEditedData(editedData: any) {
        const converted: any = {};

        Object.entries(editedData).forEach(([key, item]) => {
            // key will be: "row-15048-field-Parents Names"
            const parts = key.split("-");
            const rowID = parseInt(parts[1], 10);

            // field name (can contain hyphens)
            const fieldName = parts.slice(3).join("-");

            converted[rowID] = {
                row_id: rowID,
                field_name: (item as any).field !== "" ? (item as any).field : fieldName,
                old_value: (item as any).oldValue,
                new_value: (item as any).newValue,
            };
        });

        return converted;
    }


    const handleSearch = () => {
        if (gridApi) {
            gridApi.setQuickFilter(searchText);
        }
    };

    const isExternalFilterPresent = () => {
        return Array.isArray(selectedCommunities) && selectedCommunities.length > 0;
    };

    const doesExternalFilterPass = (node: any) => {
        if (!Array.isArray(selectedCommunities) || selectedCommunities.length === 0) return true;

        const communityValue = String(node.data?.["First Nation/Community"] ?? "").trim().toLowerCase();
        const normalizedSelected = selectedCommunities.map((s: any) => String(s ?? "").trim().toLowerCase());
        return normalizedSelected.includes(communityValue);
    };

    // Add zoom handler
    const onZoomChange = (newSize: number) => {
        setFontSize(newSize);
        gridApi?.refreshCells({ force: true });
        gridApi?.resetRowHeights();
    };

    // Add this function to handle row height
    const getRowHeight = (params: any) => {
        return fontSize + 32; // Adjust base height according to fontSize
    };

    const gridStyles = `
        .ag-theme-quartz .ag-cell-focus {
            border: 2px solid ${color_primary} !important;
        }
        .ag-theme-quartz .ag-cell-inline-editing {
            padding: 0 !important;
            height: 100% !important;
        }
        .ag-theme-quartz .ag-cell-inline-editing input {
            height: 100% !important;
            width: 100% !important;
            padding: 8px !important;
            font-size: inherit !important;
            font-family: inherit !important;
            border: none !important;
            border-radius: 4px !important;
            box-shadow: inset 0 0 0 2px ${color_primary} !important;
        }
    `;

    // Add this helper function
    const groupChangesByRow = (changes: { [key: string]: any }) => {

        const grouped: { [key: string]: { field: string, oldValue: any, newValue: any, name: any }[] } = {};

        Object.values(changes).forEach((change) => {
            const rowData = data[change.rowIndex];

            const identifier = change.name ? change.name : `Row ${change.rowIndex + 1}`;

            if (!grouped[identifier]) {
                grouped[identifier] = [];
            }
            grouped[identifier].push({
                field: change.field,
                oldValue: change.oldValue,
                newValue: change.newValue,
                name: change.name
            });
        });

        console.log("Grouping changes:", changes);
        return grouped;
    };

    return (
        <>
            <style>{gridStyles}
                {`
    button.MuiButton-root:hover {
        background-color: inherit !important;
        color: inherit !important;
        border-color: inherit !important;
        box-shadow: none !important;
    }
`}
            </style>
            <Box sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white',
                borderRadius: 1,
                overflow: 'hidden'
            }}>
                {/* Header */}
                <Box sx={{
                    p: 2,
                    bgcolor: '#f1f5f9',
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center'
                }}>
                    <Button
                        onClick={onClose}
                        sx={{
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
                        ← Back to Table
                    </Button>

                    <Button
                        onClick={() => setFilterOpen(prev => !prev)}
                        sx={{
                            height: "56px",
                            padding: "0 20px",
                            fontSize: "1rem",
                            borderRadius: "10px",
                            border: `1px solid ${color_secondary}`,
                            background: filterOpen ? color_secondary : "#fff",
                            cursor: "pointer",
                            color: filterOpen ? "#fff" : color_secondary,
                            fontWeight: "bold"
                        }}
                    >
                        {filterOpen ? 'Hide Filter' : 'Show Filter'}
                    </Button>

                    {/* Search field and other controls */}
                    <TextField
                        variant="outlined"
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            if (gridApi) {
                                gridApi.setGridOption('quickFilterText', e.target.value);
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => gridApi?.setQuickFilter(searchText)}>
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: "200px", flex: 1, height: "56px" }}
                    />

                    <Button
                        title="Zoom In"
                        onClick={() => onZoomChange(Math.min(28, fontSize + 2))}
                        sx={{
                            height: "56px",
                            padding: "0 20px",
                            fontSize: "1rem",
                            borderRadius: "10px",
                            border: `1px solid ${color_secondary}`,
                            background: "#fff",
                            cursor: "pointer",
                            color: color_secondary,
                            fontWeight: "bold",
                            flexShrink: 0,
                        }}
                    >
                        ZOOM IN
                    </Button>

                    <Button
                        title="Zoom Out"
                        onClick={() => onZoomChange(Math.max(12, fontSize - 2))}
                        sx={{
                            height: "56px",
                            padding: "0 20px",
                            fontSize: "1rem",
                            borderRadius: "10px",
                            border: `1px solid ${color_secondary}`,
                            background: "#fff",
                            cursor: "pointer",
                            color: color_secondary,
                            fontWeight: "bold",
                            flexShrink: 0,
                        }}
                    >
                        ZOOM OUT
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={Object.keys(editedData).length === 0}
                        sx={{
                            height: "56px",
                            padding: "0 20px",
                            fontSize: "1rem",
                            borderRadius: "10px",
                            border: `1px solid ${color_secondary}`,
                            background: "#FFE0B2",
                            cursor: "pointer",
                            color: color_secondary,
                            fontWeight: "bold",
                            opacity: Object.keys(editedData).length === 0 ? 0.5 : 1,
                            flexShrink: 0,
                        }}
                    >
                        Save Changes
                    </Button>
                </Box>

                {/* Main Content */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    alignItems: 'stretch',
                    gap: '8px',
                    overflow: 'hidden'
                }}>
                    {/* Community Filter */}
                    {filterOpen && (
                        <Box sx={{
                            padding: '8px 16px',
                            boxSizing: 'border-box',
                            flex: '0 0 30%',
                            maxWidth: '30%',
                            transition: 'all 220ms ease',
                            boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
                        }}>
                            <CommunityFilter onClose={() => setFilterOpen(false)} showClose />
                        </Box>
                    )}

                    {/* Grid Container */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                        minHeight: 0,
                        overflow: 'hidden'
                    }}>
                        <div className="ag-theme-quartz" style={{
                            flex: 1,
                            width: '100%',
                            height: '100%'
                        }}>
                            <AgGridReact
                                rowData={data}
                                columnDefs={columnDefs}
                                defaultColDef={{
                                    sortable: true,
                                    filter: true,
                                    resizable: true,
                                    suppressSizeToFit: false
                                }}
                                getRowHeight={getRowHeight}
                                onGridReady={(params) => {
                                    setGridApi(params.api);
                                    params.api.sizeColumnsToFit();
                                }}
                                onFirstDataRendered={(params) => {
                                    params.api.sizeColumnsToFit();
                                }}
                                suppressClickEdit={true}                 // stop AG Grid from starting edit on click
                                stopEditingWhenCellsLoseFocus={true}     // nice UX, prevents lingering editors
                                onCellClicked={(p) => {                  // manually allow editing only for empty cells
                                    const field = p.colDef.field as string;
                                    const raw = field ? p.data?.[field] : p.value;
                                    if (isTrulyEmpty(raw)) {
                                        p.api.startEditingCell({
                                            rowIndex: p.rowIndex!,
                                            colKey: p.column.getId()
                                        });
                                    } else {
                                        p.api.stopEditing(true);
                                    }
                                }}

                                onCellKeyDown={(p: any) => {
                                    const key = p.event.key;
                                    const field = p.colDef.field as string;
                                    const raw = field ? p.data?.[field] : p.value;

                                    const isEditKey =
                                        key === "Backspace" ||
                                        key === "Delete" ||
                                        key === "Enter" ||
                                        key === "F2";

                                    if (isEditKey && !isTrulyEmpty(raw)) {
                                        p.event.preventDefault();
                                        p.api.stopEditing(true);
                                    }
                                }}


                                onCellValueChanged={onCellValueChanged}
                                getRowStyle={(params: any) => ({
                                    backgroundColor: params.node.rowIndex % 2 === 0 ? '#e8f1fb' : '#ffffff'
                                })}
                                isExternalFilterPresent={isExternalFilterPresent}
                                doesExternalFilterPass={doesExternalFilterPass}
                                enableCellTextSelection={true}
                                suppressRowClickSelection={true}
                                domLayout="normal"
                            />
                        </div>
                    </Box>
                </Box>

                {/* Confirmation Dialog */}
                <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="md">
                    <DialogTitle sx={{ bgcolor: color_secondary, color: 'white' }}>
                        Confirm Changes
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Please review your changes:
                        </Typography>
                        {Object.entries(groupChangesByRow(editedData)).map(([rowId, changes]) => (
                            <Box key={rowId} sx={{ mb: 3, backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                                <Typography variant="h6" sx={{ mb: 1, color: color_secondary }}>
                                    {changes[0]?.name}
                                </Typography>
                                {changes.map((change, idx) => (
                                    <Box key={idx} sx={{ mb: 1, pl: 2 }}>
                                        <Typography variant="subtitle2">
                                            {change.field}:
                                        </Typography>
                                        <Box sx={{ pl: 2 }}>
                                            <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                                From: {change.oldValue || '(empty)'}
                                            </Typography>
                                            <Typography color="primary" sx={{ fontSize: '0.9rem' }}>
                                                To: {change.newValue || '(empty)'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            variant="contained"
                            sx={{ bgcolor: color_primary }}
                        >
                            Confirm & Send for Approval
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>
    );
};