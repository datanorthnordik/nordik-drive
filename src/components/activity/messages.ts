import {
  ACTIVITY_DIMENSIONS,
  ACTIVITY_TOP_N,
  FILE_ACTIVITY_DIMENSIONS,
  FILE_ACTIVITY_MODES,
  type ActivityDimension,
  type FileActivityDimension,
  type FileActivityMode,
} from "./options";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_VALUES,
  ALL_ACTIONS_LABEL,
} from "../../constants/statuses";

export const ACTIVITY_VISUALIZATION_TITLE = "Visualization";
export const ACTIVITY_BREAKDOWN_TITLE = "Breakdown";
export const ACTIVITY_GROUP_BY_LABEL = "Group by";
export const ACTIVITY_GROUP_LABEL = "Group";
export const ACTIVITY_CHART_LABEL = "Chart";
export const ACTIVITY_NO_DATA_TEXT = "No data to visualize.";
export const FILE_ACTIVITY_PLACEHOLDER_TEXT = "Run a search to see visualization.";
export const FILE_ACTIVITY_NO_DATA_TEXT = "No pending aggregation data.";
export const NO_COMMUNITY_LABEL = "No community";
export const NO_FILENAME_LABEL = "No filename";
export const UNKNOWN_PERSON_LABEL = "Unknown";
export const UNKNOWN_BREAKDOWN_LABEL = "(unknown)";

export const getActivityDimensionLabel = (dimension: ActivityDimension) => {
  if (dimension === ACTIVITY_DIMENSIONS.COMMUNITY) return "Community";
  if (dimension === ACTIVITY_DIMENSIONS.FILENAME) return "Filename";
  return "Person";
};

export const getFileActivityDimensionLabel = (
  dimension: FileActivityDimension
) => {
  if (dimension === FILE_ACTIVITY_DIMENSIONS.BY_FILE) return "File";
  return "Field";
};

export const getActivityVisualizationTitle = ({
  selectedAction,
  dimension,
  selectedCommunity,
}: {
  selectedAction: string;
  dimension: ActivityDimension;
  selectedCommunity: string;
}) => {
  const actionTitle = selectedAction || ALL_ACTIONS_LABEL;
  const dimTitle = getActivityDimensionLabel(dimension);
  const scope = selectedCommunity ? `within "${selectedCommunity}"` : "overall";

  return `${actionTitle} activity (${scope}) - contribution by ${dimTitle}`;
};

export const getFileActivityVisualizationTitle = ({
  mode,
  hasFileFilter,
}: {
  mode: FileActivityMode;
  hasFileFilter: boolean;
}) => {
  if (mode === FILE_ACTIVITY_MODES.PHOTOS) {
    return `${ACTIVITY_STATUS_LABELS[ACTIVITY_STATUS_VALUES.PENDING]} photos - grouped by file`;
  }

  return hasFileFilter
    ? `${ACTIVITY_STATUS_LABELS[ACTIVITY_STATUS_VALUES.PENDING]} changes - grouped by field`
    : `${ACTIVITY_STATUS_LABELS[ACTIVITY_STATUS_VALUES.PENDING]} requests - grouped by file`;
};

export const getActivityEventsLabel = (total: number) => `${total} events`;

export const getPendingCountLabel = (total: number) =>
  `${total} ${ACTIVITY_STATUS_VALUES.PENDING}`;

export const getBreakdownSummaryLabel = (count: number) =>
  count > ACTIVITY_TOP_N ? `Top ${ACTIVITY_TOP_N} + Others` : `${count} item(s)`;

export const getFileActivityMetricLabel = ({
  count,
  percent,
  total,
}: {
  count: number;
  percent: number;
  total: number;
}) => (total ? `${count} - ${percent}%` : `${count}`);
