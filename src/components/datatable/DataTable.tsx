'use client';

import React, {
  lazy,
  Suspense,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import {
  GridReadyEvent,
  RowNode,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
// @ts-ignore
import "ag-grid-community/styles/ag-grid.css";
// @ts-ignore
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
import { API_BASE } from "../../config/api";

import { MicIcon } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { SOURCE_COLORS } from "./sourceColors";
import { useDispatch, useSelector } from "react-redux";
import { setCommunities } from "../../store/auth/fileSlice";
import { AppDispatch, RootState } from "../../store/store";

import SmartSearchSuggestions from "./SmartSearchSuggestions";

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
import { apiEnsure } from "../../store/api/apiSlice";
import { FormCfg } from "./config-form-modal.tsx/shared";
import { readOnlyAgGridModules, registerAgGridModules } from "../../lib/agGridModules";

const NIAChat = lazy(() => import("../NIAChat"));
const AddInfoForm = lazy(() => import("./add-info-dialog/AddInfoForm"));
const DocumentUrlViewerModal = lazy(() => import("../photoview/URLDocumentViewer"));
const DocumentViewerModal = lazy(() => import("../../pages/viewers/DocumentViewer"));
const PhotoViewerModal = lazy(() => import("../../pages/viewers/PhotoViewer"));
const ConfigFormModal = lazy(() => import("./config-form-modal.tsx/ConfigFormModal"));

registerAgGridModules(readOnlyAgGridModules);

interface DataGridProps {
  rowData: any[];
}

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
    const match = str.match(/^([\s\S]*?)\s*(\(([^)]*)\))?$/); // newline-safe
    const mainText = (match ? match[1] : str).trim();

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
  const [cfgFormOpen, setCfgFormOpen] = useState(false);
  const [activeFormCfg, setActiveFormCfg] = useState<FormCfg | null>(null);
  const [activeFormRow, setActiveFormRow] = useState<any>(null);

  const openConfigForm = (row: any, cfg: any) => {
    setActiveFormRow(row);
    setActiveFormCfg(cfg as FormCfg);
    setCfgFormOpen(true);
  };

  const { selectedFile, selectedCommunities } = useSelector((state: any) => state.file);
  const currentUserEmail = useSelector((state: any) => state.auth?.user?.email ?? null);

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


  const configKey = useMemo(() => {
    const fname = (selectedFile?.filename || "").trim();
    return fname ? `config_${fname}` : "";
  }, [selectedFile?.filename]);

  const configEntry = useSelector((state: RootState) =>
    configKey ? (state as any)?.api?.entries?.[configKey] : null
  );

  // this is your final config json (or null)
  const configJson = (configEntry?.data as any)?.config || null;

  const hasConfig = !!configJson && Array.isArray(configJson?.columns);

  const addInfoEnabled = hasConfig
    ? !!configJson?.addInfo?.enabled
    : !!selectedFile?.community_filter; 

  const communityFilterEnabled = hasConfig
    ? !!configJson?.community_filter
    : !!selectedFile?.community_filter;

  const describeEnabled = hasConfig
    ? !!configJson?.describe
    : (selectedFile?.describe ?? true);

  const sourceFilterEnabled = hasConfig
    ? !!configJson?.source_filter
    : true; // old behavior (only shown when !community_filter and sources exist)

  useEffect(() => {
    if (!configKey || !selectedFile?.filename) return;

    dispatch(
      apiEnsure({
        key: configKey,
        url: `${API_BASE}/config?file_name=${encodeURIComponent(selectedFile.filename)}`,
        method: "GET",
      })
    );
  }, [dispatch, configKey, selectedFile?.filename]);

  /* -------- Describe -------- */

  const {
    describeColDef,
    describeContext,
    describeModal,
    describeInFlight,
    describeDocumentsInFlight,
  } = useDescribeEntry(API_BASE);

  /* -------- Helpers for opening viewers -------- */

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

  /* -------- Viewer loaders (same behavior) -------- */

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

  /* -------- layout & overlay calculations -------- */

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
    if (filterOpen && communityFilterEnabled) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev || "";
    }
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [filterOpen, communityFilterEnabled]);

  useEffect(() => {
    if (!communityFilterEnabled) return;

    const uniqueCommunities = Array.from(
      new Set(
        rowData
          .map((item: any) => item?.["First Nation/Community"] ?? "")
          .map((v: any) => String(v).trim())
          .filter(Boolean)
      )
    );

    const serialized = JSON.stringify(uniqueCommunities);
    if (serialized !== lastCommunitiesRef.current) {
      lastCommunitiesRef.current = serialized;
      dispatch(setCommunities({ communities: uniqueCommunities.sort() }));
    }
  }, [rowData, communityFilterEnabled, dispatch]);

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
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* -------- column defs -------- */

  const buildDefaultTextCol = useCallback((field: string, header: string) => {
    const charsToShow = Math.min(header.length, MAX_HEADER_CHARS);

    return {
      field,
      headerName: headerDisplay(header, 25),
      headerTooltip: header,
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
                    params.context.openLinksModal(urls, params.colDef?.headerName || params.colDef?.field);
                  }
                }}
              >
                {single ? (isDoc ? "View Document" : "View Website") : `View Links (${urls.length})`}
              </button>
            </div>
          );
        }

        const match = value.match(/^([\s\S]*?)\s*(\(([^)]*)\))?$/);
        const bracketText = (match?.[3] || "").trim();

        const bgColor = bracketText ? SOURCE_COLORS[bracketText] || "transparent" : "transparent";
        const isColored = bracketText && SOURCE_COLORS[bracketText];

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
  }, [fontSize, searchText, openDocumentUrl, openLinksModal]);

  const columnDefs = useMemo(() => {
    if (!rowData || rowData.length === 0) return [];

    const rowKeys = new Set(Object.keys(rowData[0] || {}));

    // --- Add Info column (config-driven) ---
    const addInfoCol = addInfoEnabled
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

    // --- Config-driven columns ---
    if (hasConfig) {
      const cfgCols = (configJson.columns || []) as any[];

      const tableCols = cfgCols.filter((c: any) => {
        // not needed in table view
        if (c?.add_only) return false;

        // If it’s a real data column, include only if present OR explicitly additional_field
        const name = String(c?.name || "");
        if (!name) return false;

        if (c?.additional_field) return true;
        return rowKeys.has(name);
      });

      const mapped = tableCols.map((c: any) => {
        const name = String(c?.name || "");
        const header = String(c?.display_name || c?.name || "");

        // photo_view button
        if (c?.type === "photo_view") {
          return {
            field: `__photo_view__${name}`,
            colId: `__photo_view__${name}`,
            headerName: headerDisplay(header, 25),
            headerTooltip: header,
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

        // doc_view button
        if (c?.type === "doc_view") {
          return {
            field: `__doc_view__${name}`,
            colId: `__doc_view__${name}`,
            headerName: headerDisplay(header, 25),
            headerTooltip: header,
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


        if (c?.type === "form") {
          const formKey = String(c?.key || "");
          const header = String(c?.display_name || c?.name || "Form");

          return {
            colId: `form:${formKey}`,
            field: `__form__${formKey}`,
            valueGetter: () => "", // force render
            headerName: headerDisplay(header, 25),
            headerTooltip: header,
            width: 170,
            minWidth: 170,
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
                  fontWeight: 700,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openConfigForm(params.data, c);
                }}
              >
                Add/View
              </button>
            ),
          };
        }



        // default text column
        return buildDefaultTextCol(name, header || name);
      });

      const describeCol = describeEnabled ? [describeColDef] : [];
      return [...describeCol, ...addInfoCol, ...mapped];
    }

    // --- Fallback (NO config): old behavior ---
    const keys = Object.keys(rowData[0]).filter((k) => k !== "id");

    const addInfoColOld = selectedFile?.community_filter
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

      return buildDefaultTextCol(key, key);
    });

    return [describeColDef, ...addInfoColOld, ...otherCols];
  }, [
    rowData,
    selectedFile?.community_filter,
    hasConfig,
    configJson,
    addInfoEnabled,
    describeEnabled,
    describeColDef,
    buildDefaultTextCol,
  ]);

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

  /* -------- grid handlers & filters -------- */

  const getRowStyle = (params: any) => ({
    backgroundColor: params.node.rowIndex % 2 === 0 ? "#e8f1fb" : "#ffffff",
  });

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const onZoomChange = (newSize: number) => {
    setFontSize(newSize);
  };

  const { isExternalFilterPresent, doesExternalFilterPass } = useExternalGridFilters({
    selectedCommunities,
    sourceFilter,
  });

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
            if (SOURCE_COLORS[src]) found.add(src);
          }
        }
      });
    });

    return Array.from(found);
  }, [rowData]);

  /* -------- search & navigation -------- */

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

    const t = setTimeout(() => handleSearch(searchText), 500);
    return () => clearTimeout(t);
  }, [searchText, gridApi, handleSearch]);

  const viewerLoading =
    (pendingPhotoRowId !== null && photosLoading) ||
    (pendingDocRowId !== null && docsLoading) ||
    describeInFlight ||
    describeDocumentsInFlight;

  const viewerLoadingText =
    pendingPhotoRowId !== null
      ? "Loading photos..."
      : pendingDocRowId !== null
        ? "Loading documents..."
        : describeDocumentsInFlight
          ? "Loading documents..."
        : describeInFlight
          ? "Generating description..."
          : "Loading...";

  const onAddStudent = () => {
    if (!addInfoEnabled) return;

    // If config exists, create a better blank row (required + known fields)
    if (hasConfig) {
      const cols = (configJson?.columns || []) as any[];
      const baseCols = cols.filter((c: any) => {
        if (c?.add_only) return false;
        if (c?.additional_field) return false;
        if (c?.type === "photo_view" || c?.type === "doc_view" || c?.type === "form") return false;
        return !!c?.name;
      });

      const newRow: any = { id: "" };
      baseCols.forEach((c: any) => {
        const t = String(c?.type || "input");
        if (t === "multi" || t === "community_multi") newRow[c.name] = [];
        else newRow[c.name] = "";
      });

      // ensure required fields exist
      const req = (configJson?.addInfo?.required_fields || []) as string[];
      req.forEach((k) => {
        if (!(k in newRow)) newRow[k] = "";
      });

      setFormRow(newRow);
      setFormOpen(true);
      return;
    }

    // fallback old behavior
    const sampleRow = gridApi?.getDisplayedRowAtIndex?.(0)?.data || rowData?.[0] || {};
    const newRow: any = {};
    Object.keys(sampleRow).forEach((key) => (newRow[key] = ""));
    setFormRow(newRow);
    setFormOpen(true);
  };

  const gridContext = useMemo(
    () => ({
      openForm: (row: any) => {
        if (!addInfoEnabled) return;
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
    [addInfoEnabled, openDocumentUrl, openLinksModal, openPhotoViewer, openDocumentsViewer]
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

              {/* SOURCE FILTER (config-driven) */}
              {sourceFilterEnabled && availableSources.length > 0 && !communityFilterEnabled && (
                <div ref={filtersRef}>
                  <SourceFilterBar
                    availableSources={availableSources}
                    sourceFilter={sourceFilter}
                    setSourceFilter={setSourceFilter}
                  />
                </div>
              )}

              {/* COMMUNITY BAR (config-driven) */}
              {communityFilterEnabled && (
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
                  enabled={!!communityFilterEnabled}
                  isMobile={isMobile}
                  filterOpen={filterOpen}
                  setFilterOpen={setFilterOpen}
                  overlayTop={overlayTop}
                  overlayHeight={overlayHeight}
                />

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
                    context={gridContext}
                  />
                </div>
              </div>

              <LinksDialog
                open={linksOpen}
                title={linksTitle}
                urls={linksList}
                onClose={() => setLinksOpen(false)}
                onOpenWebsite={openInNewTab}
                onOpenDocumentUrl={openDocumentUrl}
              />

              {docUrlOpen && (
                <Suspense fallback={null}>
                  <DocumentUrlViewerModal
                    open={docUrlOpen}
                    url={docUrl}
                    title={docUrlTitle}
                    onClose={() => setDocUrlOpen(false)}
                  />
                </Suspense>
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
                overflow: "hidden",
              }}
            >
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

        {niaOpen && (
          <Suspense fallback={null}>
            <NIAChat setOpen={setNiaOpen} open={niaOpen} />
          </Suspense>
        )}

        {formOpen && (
          <Suspense fallback={null}>
            <AddInfoForm
              row={formRow}
              // attach config to file for later child rewrite (doesn't break anything now)
              file={{ ...(selectedFile || {}), config: configJson }}
              onClose={() => setFormOpen(false)}
            />
          </Suspense>
        )}

        {photoModalOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}

        {docModalOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}

        {describeModal}

        {cfgFormOpen && activeFormCfg && (
          <Suspense fallback={null}>
            <ConfigFormModal
              open={cfgFormOpen}
              onClose={() => setCfgFormOpen(false)}
              row={activeFormRow}
              file={selectedFile}
              formConfig={activeFormCfg}
              apiBase={API_BASE}
              addInfoConfig={configJson?.addInfo}
              fetchPath="/form/answers"
              savePath="/form/answers"
              requestGuardEnabled={true}
              currentUserEmail={currentUserEmail}
            />
          </Suspense>
        )}

        <DataGridStyles />
      </GridWrapper>
    </>
  );
}
