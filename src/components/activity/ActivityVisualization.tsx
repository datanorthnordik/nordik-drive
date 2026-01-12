"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, Chip } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

type VizType = "PIE" | "DONUT" | "BAR";
type Dimension = "COMMUNITY" | "FILENAME" | "PERSON";

function buildPerBarSeries(items: { label: string; count: number }[]) {
  const labels = items.map((a) => a.label);
  const series = items.map((a, idx) => ({
    label: a.label,
    data: labels.map((_, i) => (i === idx ? a.count : null)),
  }));
  return { labels, series };
}

export default function ActivityVisualization({
  logData,
  selectedCommunity,
  selectedAction,
}: {
  logData: any;
  selectedCommunity: string;
  selectedAction: string;
}) {
  const [vizType, setVizType] = useState<VizType>("DONUT");

  const allowedDimensions: Dimension[] = useMemo(() => {
    if (selectedCommunity) return ["PERSON", "FILENAME"];
    return ["COMMUNITY", "FILENAME", "PERSON"];
  }, [selectedCommunity]);

  const [dimension, setDimension] = useState<Dimension>(allowedDimensions[0]);

  useEffect(() => {
    if (!allowedDimensions.includes(dimension)) setDimension(allowedDimensions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedDimensions]);

  const title = useMemo(() => {
    const actionTitle = selectedAction ? selectedAction : "All actions";
    const dimTitle =
      dimension === "COMMUNITY" ? "Community" : dimension === "FILENAME" ? "Filename" : "Person";
    const scope = selectedCommunity ? `within "${selectedCommunity}"` : "overall";
    return `${actionTitle} activity (${scope}) — contribution by ${dimTitle}`;
  }, [selectedAction, dimension, selectedCommunity]);

  const TOP_N = 10;

  const aggregated = useMemo(() => {
    const anyLog: any = logData as any;

    const aggs =
      anyLog?.aggregates ||
      anyLog?.data?.aggregates ||
      (Array.isArray(anyLog) ? anyLog?.[0]?.aggregates : null) ||
      null;

    if (!aggs) return [];

    let items: { label: string; count: number }[] = [];

    if (dimension === "COMMUNITY") {
      items = (aggs.by_community || []).map((x: any) => ({
        label: x?.label ?? "No community",
        count: Number(x?.count ?? 0),
      }));
    } else if (dimension === "FILENAME") {
      items = (aggs.by_filename || []).map((x: any) => ({
        label: x?.label ?? "No filename",
        count: Number(x?.count ?? 0),
      }));
    } else {
      items = (aggs.by_person || []).map((x: any) => ({
        label: x?.label ?? "Unknown",
        count: Number(x?.count ?? 0),
      }));
    }

    items = items
      .map((x) => ({ ...x, count: Number(x.count || 0) }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);

    // ✅ Top 10 + Others only if more than 10 exist
    if (items.length <= TOP_N) return items;

    const top = items.slice(0, TOP_N);
    const rest = items.slice(TOP_N);
    const restCount = rest.reduce((s, x) => s + x.count, 0);
    return [...top, { label: "Others", count: restCount }];
  }, [logData, dimension]);

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
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Header + controls */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: "1px solid #eef2f7",
          background: "#fbfcfe",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontWeight: 900 }}>Visualization</Typography>
          <Typography sx={{ color: "#64748b", fontSize: 13 }}>{title}</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Chip label={`${total} events`} size="small" sx={{ fontWeight: 900 }} />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Group by</InputLabel>
            <Select
              label="Group by"
              value={dimension}
              onChange={(e) => setDimension(e.target.value as Dimension)}
            >
              {allowedDimensions.map((d) => (
                <MenuItem key={d} value={d}>
                  {d === "COMMUNITY" ? "Community" : d === "FILENAME" ? "Filename" : "Person"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Chart</InputLabel>
            <Select label="Chart" value={vizType} onChange={(e) => setVizType(e.target.value as VizType)}>
              <MenuItem value="DONUT">Donut</MenuItem>
              <MenuItem value="PIE">Pie</MenuItem>
              <MenuItem value="BAR">Bar</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* ✅ ONE scroll area (no nested scroll) */}
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {aggregated.length === 0 ? (
          <Typography sx={{ color: "#94a3b8" }}>No data to visualize.</Typography>
        ) : (
          <>
            {/* ✅ Chart always visible, legend inside chart hidden */}
            <Box
              sx={{
                border: "1px solid #eef2f7",
                borderRadius: 12,
                background: "#fff",
                overflow: "hidden",
                "& .MuiChartsLegend-root": { display: "none !important" }, // ✅ prevents donut shrinking
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

            {/* ✅ Simple “legend” below: customer-friendly */}
            <Box sx={{ mt: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 900, fontSize: 13, color: "#64748b" }}>
                Breakdown
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
                {aggregated.length > TOP_N ? `Top ${TOP_N} + Others` : `${aggregated.length} item(s)`}
              </Typography>
            </Box>

            <Box sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.75 }}>
              {aggregated.map((x) => {
                const pct = total > 0 ? Math.round((x.count / total) * 100) : 0;
                return (
                  <Box
                    key={x.label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      px: 1.25,
                      py: 0.9,
                      background: "#fff",
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      title={x.label}
                      sx={{
                        fontWeight: 800,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        pr: 1,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {x.label}
                    </Typography>

                    <Chip
                      label={`${x.count}${total ? ` • ${pct}%` : ""}`}
                      size="small"
                      sx={{ fontWeight: 900, flexShrink: 0 }}
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
