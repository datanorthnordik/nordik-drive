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
  color_background,
  color_border,
  color_text_primary,
  color_text_secondary,
  color_white,
  color_white_smoke,
} from "../../constants/colors";
import {
  appendOthersBucket,
  buildPerBarSeries,
  getBreakdownLabel,
  hasFileClause,
} from "./activityutils";
import {
  ACTIVITY_CHART_TYPE_OPTIONS,
  ACTIVITY_CHART_TYPES,
  ACTIVITY_TOP_N,
  FILE_ACTIVITY_DIMENSIONS,
  FILE_ACTIVITY_MODES,
  type ActivityVizType,
  type FileActivityDimension,
  type FileActivityMode,
} from "./options";
import {
  ACTIVITY_BREAKDOWN_TITLE,
  ACTIVITY_CHART_LABEL,
  ACTIVITY_GROUP_LABEL,
  ACTIVITY_VISUALIZATION_TITLE,
  FILE_ACTIVITY_NO_DATA_TEXT,
  FILE_ACTIVITY_PLACEHOLDER_TEXT,
  getBreakdownSummaryLabel,
  getFileActivityDimensionLabel,
  getFileActivityMetricLabel,
  getFileActivityVisualizationTitle,
  getPendingCountLabel,
} from "./messages";
import {
  ACTIVITY_HEADER_SUBTITLE_SX,
  ACTIVITY_HEADER_TITLE_SX,
  ACTIVITY_ROOT_SX,
  ACTIVITY_SECTION_SUBTITLE_SX,
  ACTIVITY_SECTION_TITLE_SX,
  FILE_ACTIVITY_PENDING_CHIP_SX,
} from "./styles";

type AggKV = { key: string; count: number };

export default function FileActivityVisualization({
  mode,
  payload,
  clauses,
}: {
  mode: FileActivityMode;
  payload: any;
  clauses: any[];
}) {
  const [vizType, setVizType] = useState<ActivityVizType>(ACTIVITY_CHART_TYPES.DONUT);

  const allowedDimensions: FileActivityDimension[] = useMemo(() => {
    if (mode === FILE_ACTIVITY_MODES.PHOTOS) {
      return [FILE_ACTIVITY_DIMENSIONS.BY_FILE];
    }

    return hasFileClause(clauses)
      ? [FILE_ACTIVITY_DIMENSIONS.BY_FIELD]
      : [FILE_ACTIVITY_DIMENSIONS.BY_FILE];
  }, [clauses, mode]);

  const [dimension, setDimension] = useState<FileActivityDimension>(allowedDimensions[0]);

  useEffect(() => {
    if (!allowedDimensions.includes(dimension)) {
      setDimension(allowedDimensions[0]);
    }
  }, [allowedDimensions, dimension]);

  const title = useMemo(
    () =>
      getFileActivityVisualizationTitle({
        mode,
        hasFileFilter: hasFileClause(clauses),
      }),
    [clauses, mode]
  );

  const aggregated = useMemo(() => {
    const aggregations = payload?.aggregations || null;
    if (!aggregations) return [];

    let list: AggKV[] = [];

    if (mode === FILE_ACTIVITY_MODES.PHOTOS) {
      list = (aggregations.ByFile || aggregations.by_file || []) as AggKV[];
    } else {
      list =
        dimension === FILE_ACTIVITY_DIMENSIONS.BY_FIELD
          ? ((aggregations.ByField || aggregations.by_field || []) as AggKV[])
          : ((aggregations.ByFile || aggregations.by_file || []) as AggKV[]);
    }

    const normalizedItems = list
      .map((item: any) => ({
        label: getBreakdownLabel(item?.key ?? item?.label),
        count: Number(item?.count ?? 0),
      }))
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count);

    return appendOthersBucket(normalizedItems, ACTIVITY_TOP_N);
  }, [dimension, mode, payload]);

  const total = useMemo(
    () => aggregated.reduce((sum, item) => sum + item.count, 0),
    [aggregated]
  );

  const pieData = useMemo(
    () =>
      aggregated.map((item, index) => ({
        id: index,
        value: item.count,
        label: item.label,
      })),
    [aggregated]
  );

  const { labels: barLabels, series: perBarSeries } = useMemo(
    () => buildPerBarSeries(aggregated),
    [aggregated]
  );

  return (
    <Box data-testid="file-viz-root" sx={ACTIVITY_ROOT_SX}>
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
          <Typography sx={ACTIVITY_HEADER_TITLE_SX}>
            {ACTIVITY_VISUALIZATION_TITLE}
          </Typography>
          <Typography
            data-testid="file-viz-title"
            sx={{ ...ACTIVITY_HEADER_SUBTITLE_SX, fontSize: 13 }}
          >
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Chip
            data-testid="file-viz-total"
            label={getPendingCountLabel(total)}
            size="small"
            sx={FILE_ACTIVITY_PENDING_CHIP_SX}
          />

          {allowedDimensions.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{ACTIVITY_GROUP_LABEL}</InputLabel>
              <Select
                data-testid="file-viz-group-select"
                label={ACTIVITY_GROUP_LABEL}
                value={dimension}
                onChange={(event) =>
                  setDimension(event.target.value as FileActivityDimension)
                }
              >
                {allowedDimensions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {getFileActivityDimensionLabel(option)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{ACTIVITY_CHART_LABEL}</InputLabel>
            <Select
              data-testid="file-viz-chart-select"
              label={ACTIVITY_CHART_LABEL}
              value={vizType}
              onChange={(event) =>
                setVizType(event.target.value as ActivityVizType)
              }
            >
              {ACTIVITY_CHART_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box
        sx={{
          p: 1.25,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background: color_white,
        }}
      >
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
                {FILE_ACTIVITY_PLACEHOLDER_TEXT}
              </Typography>
            </Box>
          </Box>
        ) : aggregated.length === 0 ? (
          <Typography data-testid="file-viz-no-data" sx={{ color: color_text_secondary }}>
            {FILE_ACTIVITY_NO_DATA_TEXT}
          </Typography>
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
              {vizType === ACTIVITY_CHART_TYPES.BAR ? (
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
                      innerRadius:
                        vizType === ACTIVITY_CHART_TYPES.DONUT ? 65 : 0,
                      outerRadius: 120,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={360}
                />
              )}
            </Box>

            <Box
              sx={{
                mt: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  ...ACTIVITY_SECTION_TITLE_SX,
                  fontSize: 13,
                  color: color_text_secondary,
                }}
              >
                {ACTIVITY_BREAKDOWN_TITLE}
              </Typography>
              <Typography sx={ACTIVITY_SECTION_SUBTITLE_SX}>
                {getBreakdownSummaryLabel(aggregated.length)}
              </Typography>
            </Box>

            <Box
              data-testid="file-viz-breakdown"
              sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.75 }}
            >
              {aggregated.map((item, index) => {
                const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;

                return (
                  <Box
                    key={item.label}
                    data-testid={`file-viz-row-${index}`}
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
                      title={item.label}
                      data-testid={`file-viz-row-label-${index}`}
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
                      {item.label}
                    </Typography>

                    <Chip
                      label={getFileActivityMetricLabel({
                        count: item.count,
                        percent,
                        total,
                      })}
                      size="small"
                      data-testid={`file-viz-row-metric-${index}`}
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
