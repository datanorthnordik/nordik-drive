export const ACTIVITY_TOP_N = 10;
export const ACTIVITY_OTHERS_LABEL = "Others";
export const FILE_ACTIVITY_FILE_CLAUSE_FIELD = "file_id";

export const ACTIVITY_CHART_TYPES = {
  PIE: "PIE",
  DONUT: "DONUT",
  BAR: "BAR",
} as const;

export type ActivityVizType =
  (typeof ACTIVITY_CHART_TYPES)[keyof typeof ACTIVITY_CHART_TYPES];

export const ACTIVITY_DIMENSIONS = {
  COMMUNITY: "COMMUNITY",
  FILENAME: "FILENAME",
  PERSON: "PERSON",
} as const;

export type ActivityDimension =
  (typeof ACTIVITY_DIMENSIONS)[keyof typeof ACTIVITY_DIMENSIONS];

export const FILE_ACTIVITY_MODES = {
  CHANGES: "CHANGES",
  PHOTOS: "PHOTOS",
} as const;

export type FileActivityMode =
  (typeof FILE_ACTIVITY_MODES)[keyof typeof FILE_ACTIVITY_MODES];

export const FILE_ACTIVITY_DIMENSIONS = {
  BY_FILE: "BY_FILE",
  BY_FIELD: "BY_FIELD",
} as const;

export type FileActivityDimension =
  (typeof FILE_ACTIVITY_DIMENSIONS)[keyof typeof FILE_ACTIVITY_DIMENSIONS];

export const ACTIVITY_CHART_TYPE_OPTIONS = [
  { value: ACTIVITY_CHART_TYPES.DONUT, label: "Donut" },
  { value: ACTIVITY_CHART_TYPES.PIE, label: "Pie" },
  { value: ACTIVITY_CHART_TYPES.BAR, label: "Bar" },
] as const;

export const ACTIVITY_DIMENSION_OPTIONS = [
  ACTIVITY_DIMENSIONS.COMMUNITY,
  ACTIVITY_DIMENSIONS.FILENAME,
  ACTIVITY_DIMENSIONS.PERSON,
] as const;

export const FILE_ACTIVITY_DIMENSION_OPTIONS = [
  FILE_ACTIVITY_DIMENSIONS.BY_FILE,
  FILE_ACTIVITY_DIMENSIONS.BY_FIELD,
] as const;
