import moment from "moment";
import { QUICK_SELECT_OPTIONS, type QuickSelectOption } from "./constants";
import { getTimeRangeDisplay } from "./logs_utils";

const TIME_INPUT_FORMAT = "YYYY-MM-DDTHH:mm";

export type TimeRange =
  | { readonly mode: "quick"; readonly label: string; readonly startTime: string }
  | { readonly mode: "custom"; readonly startTime: string; readonly endTime: string };

export const quickTimeRange = (option: QuickSelectOption): TimeRange => ({
  mode: "quick",
  label: option.label,
  startTime: moment().subtract(option.value, option.unit).format(TIME_INPUT_FORMAT),
});

export const DEFAULT_QUICK_OPTION: QuickSelectOption =
  QUICK_SELECT_OPTIONS.find((option) => option.label === "Last 24 Hours") ?? QUICK_SELECT_OPTIONS[0];

export const defaultTimeRange = (): TimeRange => quickTimeRange(DEFAULT_QUICK_OPTION);

export const customTimeRange = (startTime: string, endTime: string): TimeRange => ({
  mode: "custom",
  startTime,
  endTime,
});

export const toCustomTimeRange = (range: TimeRange): TimeRange =>
  range.mode === "custom" ? range : customTimeRange(range.startTime, moment().format(TIME_INPUT_FORMAT));

export const timeRangeEndTime = (range: TimeRange): string =>
  range.mode === "custom" ? range.endTime : moment().format(TIME_INPUT_FORMAT);

export const timeRangeLabel = (range: TimeRange): string =>
  range.mode === "custom" ? getTimeRangeDisplay(true, range.startTime, range.endTime) : range.label;
