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
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  color_background,
  color_border,
  color_primary,
  color_primary_dark,
  color_secondary,
  color_secondary_dark,
  color_text_primary,
  color_text_secondary,
  color_white,
} from "../../constants/colors";
import { appendOthersBucket, buildPerBarSeries, getPersonLabel } from "./activityutils";
import {
  ACTIVITY_CHART_TYPE_OPTIONS,
  ACTIVITY_CHART_TYPES,
  ACTIVITY_DIMENSIONS,
  ACTIVITY_TOP_N,
  type ActivityDimension,
  type ActivityVizType,
} from "./options";
import {
  ACTIVITY_BREAKDOWN_TITLE,
  ACTIVITY_CHART_LABEL,
  ACTIVITY_GROUP_BY_LABEL,
  ACTIVITY_NO_DATA_TEXT,
  ACTIVITY_VISUALIZATION_TITLE,
  NO_COMMUNITY_LABEL,
  NO_FILENAME_LABEL,
  getActivityDimensionLabel,
  getActivityEventsLabel,
  getActivityVisualizationTitle,
  getBreakdownSummaryLabel,
} from "./messages";
import {
  ACTIVITY_EMPTY_TEXT_SX,
  ACTIVITY_EVENTS_CHIP_SX,
  ACTIVITY_HEADER_SUBTITLE_SX,
  ACTIVITY_HEADER_TITLE_SX,
  ACTIVITY_ROOT_SX,
  ACTIVITY_SECTION_SUBTITLE_SX,
  ACTIVITY_SECTION_TITLE_SX,
} from "./styles";

export default function ActivityVisualization({
  logData,
  selectedCommunity,
  selectedAction,
}: {
  logData: any;
  selectedCommunity: string;
  selectedAction: string;
}) {
  const [vizType, setVizType] = useState<ActivityVizType>(ACTIVITY_CHART_TYPES.DONUT);

  const allowedDimensions: ActivityDimension[] = useMemo(() => {
    if (selectedCommunity) {
      return [ACTIVITY_DIMENSIONS.PERSON, ACTIVITY_DIMENSIONS.FILENAME];
    }

    return [
      ACTIVITY_DIMENSIONS.COMMUNITY,
      ACTIVITY_DIMENSIONS.FILENAME,
      ACTIVITY_DIMENSIONS.PERSON,
    ];
  }, [selectedCommunity]);

  const [dimension, setDimension] = useState<ActivityDimension>(allowedDimensions[0]);

  useEffect(() => {
    if (!allowedDimensions.includes(dimension)) {
      setDimension(allowedDimensions[0]);
    }
  }, [allowedDimensions, dimension]);

  const title = useMemo(
    () =>
      getActivityVisualizationTitle({
        selectedAction,
        dimension,
        selectedCommunity,
      }),
    [selectedAction, dimension, selectedCommunity]
  );

  const aggregated = useMemo(() => {
    const rawLogData = logData as any;

    const aggregates =
      rawLogData?.aggregates ||
      rawLogData?.data?.aggregates ||
      (Array.isArray(rawLogData) ? rawLogData?.[0]?.aggregates : null) ||
      null;

    if (!aggregates) return [];

    let items: { label: string; count: number }[] = [];

    if (dimension === ACTIVITY_DIMENSIONS.COMMUNITY) {
      items = (aggregates.by_community || []).map((item: any) => ({
        label: item?.label ?? NO_COMMUNITY_LABEL,
        count: Number(item?.count ?? 0),
      }));
    } else if (dimension === ACTIVITY_DIMENSIONS.FILENAME) {
      items = (aggregates.by_filename || []).map((item: any) => ({
        label: item?.label ?? NO_FILENAME_LABEL,
        count: Number(item?.count ?? 0),
      }));
    } else {
      items = (aggregates.by_person || []).map((item: any) => ({
        label: item?.label ?? getPersonLabel(item),
        count: Number(item?.count ?? 0),
      }));
    }

    const normalizedItems = items
      .map((item) => ({ ...item, count: Number(item.count || 0) }))
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count);

    return appendOthersBucket(normalizedItems, ACTIVITY_TOP_N);
  }, [dimension, logData]);

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

  const accentPalette = [
    color_secondary,
    color_primary,
    color_secondary_dark,
    color_primary_dark,
  ];

  return (
    <Box data-testid="activity-viz-root" sx={ACTIVITY_ROOT_SX}>
      <Box
        data-testid="activity-viz-header"
        sx={{
          px: 1.25,
          py: 1,
          borderBottom: `1px solid ${color_border}`,
          backgroundColor: color_white,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography sx={{ ...ACTIVITY_HEADER_TITLE_SX, fontSize: 14, fontWeight: 800 }}>
            {ACTIVITY_VISUALIZATION_TITLE}
          </Typography>
          <Typography
            data-testid="activity-viz-title"
            sx={{
              ...ACTIVITY_HEADER_SUBTITLE_SX,
              color: color_text_secondary,
              fontSize: 12,
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Chip
            data-testid="activity-viz-total"
            label={getActivityEventsLabel(total)}
            size="small"
            sx={ACTIVITY_EVENTS_CHIP_SX}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{ACTIVITY_GROUP_BY_LABEL}</InputLabel>
            <Select
              data-testid="activity-viz-dimension-select"
              label={ACTIVITY_GROUP_BY_LABEL}
              value={dimension}
              onChange={(event) =>
                setDimension(event.target.value as ActivityDimension)
              }
              sx={{
                height: 34,
                backgroundColor: color_white,
                "& .MuiSelect-select": { py: 0.75 },
              }}
            >
              {allowedDimensions.map((option) => (
                <MenuItem key={option} value={option}>
                  {getActivityDimensionLabel(option)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{ACTIVITY_CHART_LABEL}</InputLabel>
            <Select
              data-testid="activity-viz-chart-select"
              label={ACTIVITY_CHART_LABEL}
              value={vizType}
              onChange={(event) =>
                setVizType(event.target.value as ActivityVizType)
              }
              sx={{
                height: 34,
                backgroundColor: color_white,
                "& .MuiSelect-select": { py: 0.75 },
              }}
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
          backgroundColor: color_white,
        }}
      >
        {aggregated.length === 0 ? (
          <Typography data-testid="activity-viz-empty" sx={ACTIVITY_EMPTY_TEXT_SX}>
            {ACTIVITY_NO_DATA_TEXT}
          </Typography>
        ) : (
          <>
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
              {vizType === ACTIVITY_CHART_TYPES.BAR ? (
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
                      innerRadius:
                        vizType === ACTIVITY_CHART_TYPES.DONUT ? 58 : 0,
                      outerRadius: 105,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={280}
                />
              )}
            </Box>

            <Box
              sx={{
                mt: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ ...ACTIVITY_SECTION_TITLE_SX, fontSize: 12 }}>
                {ACTIVITY_BREAKDOWN_TITLE}
              </Typography>
              <Typography sx={ACTIVITY_SECTION_SUBTITLE_SX}>
                {getBreakdownSummaryLabel(aggregated.length)}
              </Typography>
            </Box>

            <Box
              data-testid="activity-viz-breakdown"
              sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.75 }}
            >
              {aggregated.map((item, index) => {
                const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                const accent = accentPalette[index % accentPalette.length];

                return (
                  <Box
                    data-testid={`activity-viz-row-${index}`}
                    key={item.label}
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
                        data-testid={`activity-viz-row-label-${index}`}
                        title={item.label}
                        sx={{
                          fontWeight: 800,
                          fontSize: 12,
                          color: color_text_primary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.label}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                        <Chip
                          data-testid={`activity-viz-row-count-${index}`}
                          label={`${item.count}`}
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
                          data-testid={`activity-viz-row-pct-${index}`}
                          label={`${percent}%`}
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

            <Box sx={{ height: 10, backgroundColor: color_white }} />
          </>
        )}
      </Box>
    </Box>
  );
}
