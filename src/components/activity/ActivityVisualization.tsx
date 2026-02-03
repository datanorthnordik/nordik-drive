"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, Chip } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  color_white,
  color_border,
  color_secondary,
  color_text_primary,
  color_text_secondary,
  color_text_light,
  color_primary,
  color_secondary_dark,
  color_primary_dark,
  color_background,
} from "../../constants/colors";

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

  //  Only allowed colors: cycle through your prim/sec variants
  const accentPalette = [color_secondary, color_primary, color_secondary_dark, color_primary_dark];

  return (
    <Box  data-testid="activity-viz-root" 
      sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Header + controls (PendingRequests feel: white header, subtle divider) */}
      <Box
        data-testid="activity-viz-header"
        sx={{
          px: 1.25,
          py: 1,
          borderBottom: `1px solid ${color_border}`,
          backgroundColor: color_white, //  match PendingRequests header area
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: color_text_primary }}>
            Visualization
          </Typography>
          <Typography data-testid="activity-viz-title" sx={{ color: color_text_secondary, fontSize: 12, lineHeight: 1.25 }}>
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Chip
            data-testid="activity-viz-total"
            label={`${total} events`}
            size="small"
            sx={{
              fontWeight: 900,
              height: 26,
              borderRadius: "10px",
              backgroundColor: color_background,
              border: `1px solid ${color_border}`,
              color: color_text_primary,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Group by</InputLabel>
            <Select
              data-testid="activity-viz-dimension-select"
              label="Group by"
              value={dimension}
              onChange={(e) => setDimension(e.target.value as Dimension)}
              sx={{
                height: 34,
                backgroundColor: color_white,
                "& .MuiSelect-select": { py: 0.75 },
              }}
            >
              {allowedDimensions.map((d) => (
                <MenuItem key={d} value={d}>
                  {d === "COMMUNITY" ? "Community" : d === "FILENAME" ? "Filename" : "Person"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Chart</InputLabel>
            <Select
              data-testid="activity-viz-chart-select"
              label="Chart"
              value={vizType}
              onChange={(e) => setVizType(e.target.value as VizType)}
              sx={{
                height: 34,
                backgroundColor: color_white,
                "& .MuiSelect-select": { py: 0.75 },
              }}
            >
              <MenuItem value="DONUT">Donut</MenuItem>
              <MenuItem value="PIE">Pie</MenuItem>
              <MenuItem value="BAR">Bar</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* ONE scroll area */}
      <Box sx={{ p: 1.25, flex: 1, minHeight: 0, overflowY: "auto", backgroundColor: color_white }}>
        {aggregated.length === 0 ? (
          <Typography data-testid="activity-viz-empty" sx={{ color: color_text_light, fontSize: 13 }}>No data to visualize.</Typography>
        ) : (
          <>
            {/* Chart box */}
            <Box
              data-testid="activity-viz-chart-box"
              sx={{
                border: `1px solid ${color_border}`,
                borderRadius: 2,
                backgroundColor: color_white,
                overflow: "hidden",
                "& .MuiChartsLegend-root": { display: "none !important" },
              }}
            >
              {vizType === "BAR" ? (
                <BarChart
                  xAxis={[{ scaleType: "band", data: barLabels }]}
                  series={perBarSeries}
                  height={280}
                  margin={{ bottom: 30, left: 40, right: 10, top: 10 }}
                />
              ) : (
                <PieChart
                  series={[
                    {
                      data: pieData,
                      innerRadius: vizType === "DONUT" ? 58 : 0,
                      outerRadius: 105,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={280}
                />
              )}
            </Box>

            {/* Breakdown header */}
            <Box
              sx={{
                mt: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 12, color: color_text_primary }}>
                Breakdown
              </Typography>
              <Typography sx={{ fontSize: 12, color: color_text_light }}>
                {aggregated.length > TOP_N ? `Top ${TOP_N} + Others` : `${aggregated.length} item(s)`}
              </Typography>
            </Box>

            {/* Breakdown rows */}
            <Box data-testid="activity-viz-breakdown" sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.75 }}>
              {aggregated.map((x, i) => {
                const pct = total > 0 ? Math.round((x.count / total) * 100) : 0;
                const accent = accentPalette[i % accentPalette.length];

                return (
                  <Box
                    data-testid={`activity-viz-row-${i}`}
                    key={x.label}
                    sx={{
                      display: "flex",
                      alignItems: "stretch",
                      border: `1px solid ${color_border}`,
                      borderRadius: 2,
                      overflow: "hidden",
                      backgroundColor: color_white,
                    }}
                  >
                    <Box sx={{ width: 6, backgroundColor: accent, flexShrink: 0 }} />

                    <Box
                      sx={{
                        px: 1,
                        py: 0.85,
                        flex: 1,
                        minWidth: 0,
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography
                        data-testid={`activity-viz-row-label-${i}`}
                        title={x.label}
                        sx={{
                          fontWeight: 800,
                          fontSize: 12,
                          color: color_text_primary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {x.label}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                        <Chip
                          data-testid={`activity-viz-row-count-${i}`}
                          label={`${x.count}`}
                          size="small"
                          sx={{
                            height: 22,
                            borderRadius: "8px",
                            fontWeight: 900,
                            backgroundColor: color_background,
                            border: `1px solid ${color_border}`,
                            color: color_text_primary,
                          }}
                        />
                        <Chip
                          data-testid={`activity-viz-row-pct-${i}`}
                          label={`${pct}%`}
                          size="small"
                          sx={{
                            height: 22,
                            borderRadius: "8px",
                            fontWeight: 900,
                            backgroundColor: color_background,
                            border: `1px solid ${color_border}`,
                            color: color_text_primary,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Optional subtle bottom padding like PendingRequests empty area */}
            <Box sx={{ height: 10, backgroundColor: color_white }} />
          </>
        )}
      </Box>
    </Box>
  );
}
