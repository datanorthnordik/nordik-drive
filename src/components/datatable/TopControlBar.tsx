"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { Box, Button, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { ArrowLeft, ChevronUp, ChevronDown, Download, Mic, MicOff, Search } from "lucide-react";
import * as XLSX from "xlsx";

import {
  color_primary,
  color_secondary,
  color_border,
  color_secondary_dark,
  color_white,
  color_white_smoke,
  dark_grey,
  color_text_light,
  color_black_light,
} from "../../constants/colors";

import { NIAChatTrigger } from "../NIAChat";
import { clearSelectedFile } from "../../store/auth/fileSlice";
import { useDispatch } from "react-redux";


type Props = {
  isMobile: boolean;
  gridApi: any;

  searchText: string;
  setSearchText: (v: string) => void;

  matchesCount: number;
  currentMatchIndex: number;

  onNavigateMatch: (dir: "next" | "prev") => void;

  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  recognitionRef: React.MutableRefObject<any>;

  onSearch: (termOverride?: string) => void;

  fontSize: number;
  onZoomChange: (newSize: number) => void;

  setNiaOpen: (v: boolean) => void;
};

export default function TopControlsBar({
  isMobile,
  gridApi,
  searchText,
  setSearchText,
  matchesCount,
  currentMatchIndex,
  onNavigateMatch,
  isRecording,
  setIsRecording,
  recognitionRef,
  onSearch,
  fontSize,
  onZoomChange,
  setNiaOpen,
}: Props) {
  const resultsText = useMemo(() => {
    return matchesCount > 0 ? `${currentMatchIndex + 1} of ${matchesCount}` : "0 results";
  }, [matchesCount, currentMatchIndex]);

  const dispatch = useDispatch();

  const [totalRecords, setTotalRecords] = useState(0);

  const recomputeTotalRecords = useCallback(() => {
    if (!gridApi) {
      setTotalRecords(0);
      return;
    }

    let count = 0;
    gridApi.forEachNode((node: any) => {
      if (node?.data) count += 1; // only real rows
    });

    setTotalRecords(count);
  }, [gridApi]);

  useEffect(() => {
    recomputeTotalRecords();
    if (!gridApi) return;

    const handler = () => recomputeTotalRecords();

    gridApi.addEventListener("modelUpdated", handler);
    gridApi.addEventListener("rowDataUpdated", handler);

    return () => {
      gridApi.removeEventListener("modelUpdated", handler);
      gridApi.removeEventListener("rowDataUpdated", handler);
    };
  }, [gridApi, recomputeTotalRecords]);

  const totalRecordsText = useMemo(() => {
    const formatted = new Intl.NumberFormat().format(totalRecords);
    return `TOTAL: ${formatted} RECORDS`;
  }, [totalRecords]);


  const startVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      onSearch(transcript);
    };
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleDownload = () => {
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
  };

  return (
    <div
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

        overflowX: "auto",
        overflowY: "visible",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Files */}
      <Button
        onClick={() => {
          dispatch(clearSelectedFile());
          window.history.back()
        }}
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
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} color={dark_grey} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: "flex", gap: 0.75 }}>
                <IconButton
                  onClick={() => onSearch()}
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
                    if (!isRecording) startVoice();
                    else stopVoice();
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

      {/* split nav button */}
      <IconButton
        disabled={matchesCount === 0}
        onClick={(e) => {
          if (matchesCount === 0) return;
          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
          const y = (e as any).clientY - rect.top;
          if (y < rect.height / 2) onNavigateMatch("prev");
          else onNavigateMatch("next");
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 0,
              borderBottom: `1px solid ${color_border}`,
              pointerEvents: "none",
            }}
          >
            <ChevronUp size={18} />
          </Box>
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

      {/* NIA slot + tiny indicator */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.25,
          height: "auto",
          lineHeight: 1,
        }}
      >
        <div className="nia-slot">
          <NIAChatTrigger setOpen={setNiaOpen} />
        </div>

        {/* small indicator (compact, subtle, non-ugly) */}
        <Box
          onClick={() => setNiaOpen(true)}
          role="button"
          aria-label="Talk to NIA"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setNiaOpen(true);
          }}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.6,
            px: 1,
            py: "2px",
            borderRadius: 999,
            border: `1px solid ${color_border}`,
            background: color_white,
            cursor: "pointer",
            userSelect: "none",
            maxWidth: 120,
            "&:hover": { background: color_white_smoke, borderColor: color_secondary },
            "&:focus-visible": {
              outline: `2px solid ${color_secondary}`,
              outlineOffset: 2,
            },
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: color_secondary,
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 900,
              color: color_black_light,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.1,
            }}
          >
            Talk to NIA
          </Typography>
        </Box>
      </Box>

      {/* Results pill */}
      {/* Results + Total (exact like design: total is below the pill) */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.25,
          lineHeight: 1,
        }}
      >
        {/* Results pill */}
        <Box
          sx={{
            height: 46,
            width: 110,
            px: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            border: `1px solid ${color_secondary}`, // blue border like screenshot
            background: color_white,               // white background like screenshot
            fontWeight: 900,
            color: color_secondary,                // blue text like screenshot
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {resultsText}
        </Box>

        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 900,
            color: color_text_light,
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            lineHeight: 1,
            mt: "2px",
            textAlign: "center",
          }}
        >
          {totalRecordsText}
        </Typography>
      </Box>



      {/* Zoom */}
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
        onClick={handleDownload}
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
  );
}
