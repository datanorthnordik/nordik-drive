'use client';

import React, {
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import {
  AllCommunityModule,
  ModuleRegistry,
  GridReadyEvent,
  RowNode
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { DataTableWrapper, GridWrapper } from "../Wrappers";
import {
  color_primary,
  color_secondary,
  header_height,
  header_mobile_height,
  color_white,
  color_black,
  color_black_light,
} from "../../constants/colors";

import NIAChat from "../NIAChat";
import { MicIcon } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { colorSources } from "../../constants/constants";
import { useDispatch, useSelector } from "react-redux";
import { setCommunities } from "../../store/auth/fileSlice";
import { AppDispatch } from "../../store/store";

import AddInfoForm from "./add-info-dialog/AddInfoForm";
import SmartSearchSuggestions from "./SmartSearchSuggestions";

import DocumentUrlViewerModal from "../photoview/URLDocumentViewer";
import DocumentViewerModal from "../../pages/viewers/DocumentViewer";
import PhotoViewerModal from "../../pages/viewers/PhotoViewer";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";

/** split components (keep using them) */
import TopControlsBar from "./TopControlBar";
import SourceFilterBar from "./SourceFilterBar";
import CommunityActionBar from "./CommunityActionBar";
import CommunityFilterPanel from "./CommunityFilterPanel";
import LinksDialog from "./LinksDialog";
import DataGridStyles from "./DataGridStyles";

/** utils / hooks */
import { extractUrls, isDocumentUrl, linkLabel, normalizeUrl, openInNewTab } from "../../lib/urlUtils";
import { applyQuickFilter, findMatches, scrollToMatch } from "../../lib/gridSearch";
import { useViewerLoader } from "../../hooks/useViewerLoader";
import { useExternalGridFilters } from "../../hooks/useExternalGridFilters";
import { headerDisplay, headerMinWidthPx, MAX_HEADER_CHARS } from "./HelperComponents";
import { useDescribeEntry } from "../models/DescribeEntry";

const API_BASE = "https://nordikdriveapi-724838782318.us-west1.run.app/api";

ModuleRegistry.registerModules([AllCommunityModule]);

interface DataGridProps {
  rowData: any[];
}

/* ---------- Small renderers stay here (grid-specific) ---------- */

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
        fontWeight: 600,
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
    if (value === null || value === undefined) return null;

    const str = String(value);
    const match = str.match(/^([\s\S]*?)\s*(\(([^)]*)\))?$/); // ✅ newline-safe
    const mainText = (match ? match[1] : str).trim();         // ✅ fallback

    if (!searchText) return <span style={{ fontSize }}>{mainText}</span>;

    const safeSearch = escapeRegExp(searchText);
    const regex = new RegExp(`(${safeSearch})`, "gi");
    const parts = mainText.split(regex);

    return (
      <span style={{ fontSize }}>
        {parts.map((part, index) => {
          const isMatch = index % 2 === 1 && part.length > 0;
          return isMatch ? (
            <span key={index} style={{ backgroundColor: "yellow" }}>{part}</span>
          ) : (
            <React.Fragment key={index}>{part}</React.Fragment>
          );
        })}
      </span>
    );
  }
);


/* ---------- Recorder styles (KEEP AS-IS) ---------- */

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
  const [matches, setMatches] = useState<{ rowNode: RowNode; colId: string }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  //  GUARDED: fontSize kept at container level and passed through
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
  const [docModalOpen, setDocModalOpen] = useState(false);

  const [pendingPhotoRowId, setPendingPhotoRowId] = useState<number | null>(null);
  const [pendingDocRowId, setPendingDocRowId] = useState<number | null>(null);

  const [photos, setPhotos] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);

  const [hasQuickFilterResults, setHasQuickFilterResults] = useState(true);

  const [linksOpen, setLinksOpen] = useState(false);
  const [linksTitle, setLinksTitle] = useState("");
  const [linksList, setLinksList] = useState<string[]>([]);

  const [docUrlOpen, setDocUrlOpen] = useState(false);
  const [docUrl, setDocUrl] = useState("");
  const [docUrlTitle, setDocUrlTitle] = useState<string>("");

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

  const {
    describeColDef,
    describeContext,
    describeModal,
    describeInFlight,
  } = useDescribeEntry(API_BASE);

  const openDocumentUrl = useCallback((url: string) => {
    const u = normalizeUrl(url);
    if (!u) return;
    setDocUrl(u);
    setDocUrlTitle(linkLabel(u));
    setDocUrlOpen(true);
  }, []);

  const openLinksModal = useCallback((urls: string[], title?: string) => {
    setLinksList(urls);
    setLinksTitle(title || "Links");
    setLinksOpen(true);
  }, []);

  const openPhotoViewer = async (row: any) => {
    const rowId = row?.id;
    if (!rowId) return;

    if (pendingPhotoRowId || pendingDocRowId) return;

    setPendingPhotoRowId(rowId);
    setPhotos([]);
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

  // Viewer loaders (same behavior)
  useViewerLoader<any>({
    loading: photosLoading,
    error: photosError,
    data: photoData,
    pendingRowId: pendingPhotoRowId,
    setPendingRowId: setPendingPhotoRowId,
    setItems: setPhotos,
    setModalOpen: setPhotoModalOpen,
    pickList: (d: any) => (Array.isArray(d) ? d : (d as any)?.photos ?? []),
    onError: (e: any) => console.error("Failed to fetch photos:", e),
  });

  useViewerLoader<any>({
    loading: docsLoading,
    error: docsError,
    data: docData,
    pendingRowId: pendingDocRowId,
    setPendingRowId: setPendingDocRowId,
    setItems: setDocs,
    setModalOpen: setDocModalOpen,
    pickList: (d: any) => (Array.isArray(d) ? d : (d as any)?.docs ?? []),
    onError: (e: any) => console.error("Failed to fetch documents:", e),
  });

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
      const _filtersBottom = filtersRef.current?.getBoundingClientRect().bottom ?? topH;
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
          headerName: headerDisplay("Add Info", 25),
          headerTooltip: "Add Info",
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
          },
        },
      ]
      : [];

    const otherCols = keys.map((key) => {
      if (key.toLowerCase() === "photos") {
        return {
          field: key,
          headerName: headerDisplay(key, 25),
          headerTooltip: key,
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
                fontWeight: 600,
              }}
              onClick={(e) => {
                e.stopPropagation();
                params.context.openPhotoView(params.data);
              }}
            >
              View Photos
            </button>
          ),
        };
      }

      if (key.toLowerCase() === "documents") {
        return {
          field: key,
          headerName: key,
          headerTooltip: key,
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

      const fullHeader = key;
      const charsToShow = Math.min(fullHeader.length, MAX_HEADER_CHARS);

      return {
        field: fullHeader,
        headerName: headerDisplay(fullHeader, 25),
        headerTooltip: key,
        tooltipValueGetter: (params: any) => params.value,
        minWidth: headerMinWidthPx(charsToShow),
        cellRenderer: (params: any) => {
          if (!params.value) return null;

          const value = params.value.toString();
          const urls = extractUrls(value);

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
                      params.context.openLinksModal(
                        urls,
                        params.colDef?.headerName || params.colDef?.field
                      );
                    }
                  }}
                >
                  {single
                    ? isDoc
                      ? "View Document"
                      : "View Website"
                    : `View Links (${urls.length})`}
                </button>
              </div>
            );
          }

          const match = value.match(/^([\s\S]*?)\s*(\(([^)]*)\))?$/);
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
        },
      };
    });

    return [describeColDef, ...addInfoCol, ...otherCols];
  }, [rowData, searchText, fontSize, selectedFile?.community_filter, describeColDef]);

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
        color: color_black_light,
      },
      headerClass: "bold-header",
    }),
    []
  );

  /* ----- grid handlers & filters ----- */

  const getRowStyle = (params: any) => ({
    backgroundColor: params.node.rowIndex % 2 === 0 ? "#e8f1fb" : "#ffffff",
  });

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const onZoomChange = (newSize: number) => {
    setFontSize(newSize);
  };

  //  Single external filter logic in ONE place (hook)
  const { isExternalFilterPresent, doesExternalFilterPass } = useExternalGridFilters({
    selectedCommunities,
    sourceFilter,
  });

  //  Single trigger to refresh filters (ONLY here)
  useEffect(() => {
    gridApi?.onFilterChanged?.();
  }, [gridApi, sourceFilter, selectedCommunities]);

  const availableSources = useMemo(() => {
    if (!rowData || rowData.length === 0) return [];
    const found = new Set<string>();

    rowData.forEach((row) => {
      Object.values(row).forEach((val) => {
        if (typeof val === "string") {
          const match = val.match(/\(([^)]*)\)/);
          if (match?.[1]) {
            const src = match[1].trim();
            if (colorSources[src]) found.add(src);
          }
        }
      });
    });

    return Array.from(found);
  }, [rowData]);

  /* ----- search & navigation ----- */

  const handleSearch = useCallback(
    (termOverride?: string) => {
      const term = (termOverride ?? searchText).trim();
      if (!gridApi) return;

      applyQuickFilter(gridApi, term);

      requestAnimationFrame(() => {
        const displayed = gridApi.getDisplayedRowCount?.() ?? 0;
        setHasQuickFilterResults(displayed > 0);

        if (!term) {
          setMatches([]);
          setCurrentMatchIndex(0);
          return;
        }

        const allMatches = findMatches(gridApi, term);
        setMatches(allMatches);
        setCurrentMatchIndex(0);

        if (allMatches.length > 0) scrollToMatch(gridApi, allMatches[0]);
      });
    },
    [gridApi, searchText]
  );

  const navigateMatch = (direction: "next" | "prev") => {
    if (matches.length === 0) return;
    const newIndex =
      direction === "next"
        ? (currentMatchIndex + 1) % matches.length
        : (currentMatchIndex - 1 + matches.length) % matches.length;

    setCurrentMatchIndex(newIndex);
    scrollToMatch(gridApi, matches[newIndex]);
  };

  useEffect(() => {
    if (!gridApi) return;

    const t = setTimeout(() => {
      handleSearch(searchText);
    }, 500);

    return () => clearTimeout(t);
  }, [searchText, gridApi, handleSearch]);

  const viewerLoading =
    (pendingPhotoRowId !== null && photosLoading) ||
    (pendingDocRowId !== null && docsLoading) ||
    describeInFlight;

  const viewerLoadingText =
    pendingPhotoRowId !== null
      ? "Loading photos..."
      : pendingDocRowId !== null
        ? "Loading documents..."
        : describeInFlight
          ? "Generating description..."
          : "Loading...";


  const onAddStudent = () => {
    const sampleRow = gridApi?.getDisplayedRowAtIndex?.(0)?.data || rowData?.[0] || {};
    const newRow: any = {};
    Object.keys(sampleRow).forEach((key) => (newRow[key] = ""));
    setFormRow(newRow);
    setFormOpen(true);
  };

  //  Memoize AG Grid context (guardrail)
  const gridContext = useMemo(
    () => ({
      openForm: (row: any) => {
        setFormRow(row);
        setFormOpen(true);
      },
      openPhotoView: (row: any) => openPhotoViewer(row),
      openDocumentsView: (row: any) => openDocumentsViewer(row),
      openWebsite: openInNewTab,
      openDocumentUrl,
      openLinksModal,
      ...describeContext,
    }),
    [openDocumentUrl, openLinksModal, openPhotoViewer, openDocumentsViewer]
  );

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
          position: "relative",
        }}
      >
        <DataTableWrapper>
          {!editMode && (
            <>
              {/* TOP BAR */}
              <div ref={topControlsRef}>
                <TopControlsBar
                  isMobile={isMobile}
                  gridApi={gridApi}
                  searchText={searchText}
                  setSearchText={(v: any) => {
                    setSearchText(v);
                    setMatches([]);
                    setCurrentMatchIndex(0);
                  }}
                  matchesCount={matches.length}
                  currentMatchIndex={currentMatchIndex}
                  onNavigateMatch={navigateMatch}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  recognitionRef={recognitionRef}
                  onSearch={handleSearch}
                  fontSize={fontSize}
                  onZoomChange={onZoomChange}
                  setNiaOpen={setNiaOpen}
                />
              </div>

              <SmartSearchSuggestions
                query={searchText}
                rowData={rowData}
                hasResults={hasQuickFilterResults}
                onPick={(value) => {
                  setSearchText(value);
                  handleSearch(value);
                }}
              />

              {/* SOURCE FILTER */}
              {availableSources.length > 0 && !selectedFile?.community_filter && (
                <div ref={filtersRef}>
                  <SourceFilterBar
                    availableSources={availableSources}
                    sourceFilter={sourceFilter}
                    setSourceFilter={setSourceFilter} //  NO onFilterChanged here
                  />
                </div>
              )}

              {/* COMMUNITY BAR */}
              {selectedFile?.community_filter && (
                <CommunityActionBar
                  filterOpen={filterOpen}
                  setFilterOpen={setFilterOpen}
                  onAddStudent={onAddStudent}
                />
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
                  overflow: "hidden",
                }}
              >
                <CommunityFilterPanel
                  enabled={!!selectedFile?.community_filter}
                  isMobile={isMobile}
                  filterOpen={filterOpen}
                  setFilterOpen={setFilterOpen}
                  overlayTop={overlayTop}
                  overlayHeight={overlayHeight}
                />

                {/* GRID */}
                <div
                  className="ag-theme-quartz"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    height: "100%",
                    overflow: "auto",
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
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}
                    context={gridContext} //  memoized context
                  />
                </div>
              </div>

              {/* Links picker */}
              <LinksDialog
                open={linksOpen}
                title={linksTitle}
                urls={linksList}
                onClose={() => setLinksOpen(false)}
                onOpenWebsite={openInNewTab}
                onOpenDocumentUrl={openDocumentUrl}
              />

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

          {/* editMode placeholder kept */}
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
                overflow: "hidden",
              }}
            >
              {/* EditableTable unchanged */}
              {/* <EditableTable data={rowData} onClose={() => setEditMode(false)} /> */}
            </div>
          )}
        </DataTableWrapper>

        {/* RecorderOverlay */}
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
          <AddInfoForm row={formRow} file={selectedFile} onClose={() => setFormOpen(false)} />
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

        {describeModal}

        {/*  Old style block preserved exactly */}
        <DataGridStyles />
      </GridWrapper>
    </>
  );
}
