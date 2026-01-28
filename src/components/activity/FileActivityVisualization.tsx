"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  color_secondary,
  color_secondary_dark,
  color_border,
  color_white,
  color_white_smoke,
  color_text_primary,
  color_text_secondary,
  color_text_light,
  color_background,
} from "../../constants/colors";

type VizType = "DONUT" | "PIE" | "BAR";
type Mode = "CHANGES" | "PHOTOS";
type Dimension = "BY_FILE" | "BY_FIELD";

type AggKV = { key: string; count: number };

function buildPerBarSeries(items: { label: string; count: number }[]) {
  const labels = items.map((a) => a.label);
  const series = items.map((a, idx) => ({
    label: a.label,
    data: labels.map((_, i) => (i === idx ? a.count : null)),
  }));
  return { labels, series };
}

function hasFileClause(clauses: any[]): boolean {
  return Array.isArray(clauses) && clauses.some((c) => c?.field === "file_id");
}

export default function FileActivityVisualization({
  mode,
  payload,
  clauses,
}: {
  mode: Mode;
  payload: any;
  clauses: any[];
}) {
  const [vizType, setVizType] = useState<VizType>("DONUT");

  const allowedDimensions: Dimension[] = useMemo(() => {
    if (mode === "PHOTOS") return ["BY_FILE"];
    return hasFileClause(clauses) ? ["BY_FIELD"] : ["BY_FILE"];
  }, [mode, clauses]);

  const [dimension, setDimension] = useState<Dimension>(allowedDimensions[0]);

  useEffect(() => {
    if (!allowedDimensions.includes(dimension)) setDimension(allowedDimensions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedDimensions]);

  const title = useMemo(() => {
    if (mode === "PHOTOS") return "Pending photos — grouped by file";
    return hasFileClause(clauses)
      ? "Pending changes — grouped by field"
      : "Pending requests — grouped by file";
  }, [mode, clauses]);

  const TOP_N = 10;

  const aggregated = useMemo(() => {
    const aggs = payload?.aggregations || null;
    if (!aggs) return [];

    let list: AggKV[] = [];

    if (mode === "PHOTOS") {
      list = (aggs.ByFile || aggs.by_file || []) as AggKV[];
    } else {
      list =
        dimension === "BY_FIELD"
          ? ((aggs.ByField || aggs.by_field || []) as AggKV[])
          : ((aggs.ByFile || aggs.by_file || []) as AggKV[]);
    }

    let items = list
      .map((x: any) => ({
        label: String(x?.key ?? x?.label ?? "(unknown)"),
        count: Number(x?.count ?? 0),
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);

    if (items.length <= TOP_N) return items;

    const top = items.slice(0, TOP_N);
    const rest = items.slice(TOP_N);
    const restCount = rest.reduce((s, x) => s + x.count, 0);
    return [...top, { label: "Others", count: restCount }];
  }, [payload, mode, dimension]);

  const total = useMemo(() => aggregated.reduce((s, x) => s + x.count, 0), [aggregated]);

  const pieData = useMemo(
    () =>
      aggregated.map((x, i) => ({
        id: i,
        value: x.count,
        label: x.label,
      })),
    [aggregated]
  );

  const { labels: barLabels, series: perBarSeries } = useMemo(
    () => buildPerBarSeries(aggregated),
    [aggregated]
  );

  return (
    <Box data-testid="file-viz-root" sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Header (screenshot style) */}
      <Box
        sx={{
          px: 1.25,
          py: 0.9,
          borderBottom: `1px solid ${color_border}`,
          background: color_white,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontWeight: 900, color: color_text_primary }}>Visualization</Typography>
          <Typography data-testid="file-viz-title" sx={{ color: color_text_light, fontSize: 13 }}>{title}</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Chip
            data-testid="file-viz-total"
            label={`${total} pending`}
            size="small"
            sx={{
              fontWeight: 900,
              borderRadius: "10px",
              background: color_white,
              border: `1px solid ${color_secondary}`,
              color: color_secondary_dark,
            }}
          />

          {allowedDimensions.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Group</InputLabel>
              <Select data-testid="file-viz-group-select" label="Group" value={dimension} onChange={(e) => setDimension(e.target.value as Dimension)}>
                <MenuItem value="BY_FILE">File</MenuItem>
                <MenuItem value="BY_FIELD">Field</MenuItem>
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Chart</InputLabel>
            <Select data-testid="file-viz-chart-select" label="Chart" value={vizType} onChange={(e) => setVizType(e.target.value as VizType)}>
              <MenuItem value="DONUT">Donut</MenuItem>
              <MenuItem value="PIE">Pie</MenuItem>
              <MenuItem value="BAR">Bar</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Single scroll area */}
      <Box sx={{ p: 1.25, flex: 1, minHeight: 0, overflowY: "auto", background: color_white }}>
        {!payload ? (
          <Box
            data-testid="file-viz-placeholder"
            sx={{
              height: "100%",
              minHeight: 260,
              border: `1px dashed ${color_border}`,
              borderRadius: 12,
              background: color_background,
              display: "grid",
              placeItems: "center",
              p: 2,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <InsertChartOutlinedIcon sx={{ fontSize: 54, color: "#cbd5e1" }} />
              <Typography sx={{ mt: 1, fontWeight: 900, color: color_text_secondary }}>
                Run a search to see visualization.
              </Typography>
            </Box>
          </Box>
        ) : aggregated.length === 0 ? (
          <Typography data-testid="file-viz-no-data" sx={{ color: color_text_secondary }}>No pending aggregation data.</Typography>
        ) : (
          <>
            <Box
              data-testid="file-viz-chart-box"
              sx={{
                border: `1px solid ${color_border}`,
                borderRadius: 12,
                background: color_white,
                overflow: "hidden",
                "& .MuiChartsLegend-root": { display: "none !important" },
              }}
            >
              {vizType === "BAR" ? (
                <BarChart
                  xAxis={[{ scaleType: "band", data: barLabels }]}
                  series={perBarSeries}
                  height={360}
                  margin={{ bottom: 30, left: 40, right: 10, top: 10 }}
                />
              ) : (
                <PieChart
                  series={[
                    {
                      data: pieData,
                      innerRadius: vizType === "DONUT" ? 65 : 0,
                      outerRadius: 120,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={360}
                />
              )}
            </Box>

            <Box sx={{ mt: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 900, fontSize: 13, color: color_text_secondary }}>
                Breakdown
              </Typography>
              <Typography sx={{ fontSize: 12, color: color_text_light }}>
                {aggregated.length > TOP_N ? `Top ${TOP_N} + Others` : `${aggregated.length} item(s)`}
              </Typography>
            </Box>

            <Box data-testid="file-viz-breakdown" sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.75 }}>
              {aggregated.map((x, i) => {
                const pct = total > 0 ? Math.round((x.count / total) * 100) : 0;
                return (
                  <Box
                    key={x.label}
                    data-testid={`file-viz-row-${i}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: `1px solid ${color_border}`,
                      borderRadius: 10,
                      px: 1.25,
                      py: 0.9,
                      background: color_white,
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      title={x.label}
                      data-testid={`file-viz-row-label-${i}`}
                      sx={{
                        fontWeight: 800,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        pr: 1,
                        minWidth: 0,
                        flex: 1,
                        color: color_text_primary,
                      }}
                    >
                      {x.label}
                    </Typography>

                    <Chip
                      label={`${x.count}${total ? ` • ${pct}%` : ""}`}
                      size="small"
                      data-testid={`file-viz-row-metric-${i}`}
                      sx={{
                        fontWeight: 900,
                        flexShrink: 0,
                        borderRadius: "10px",
                        background: color_white_smoke,
                        border: `1px solid ${color_border}`,
                        color: color_text_primary,
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
