import React from "react";

import AdvancedDatePicker from "@/components/shared/advanced_date_picker";
import { UsageViewSelect, type UsageViewSelectProps } from "../UsageViewSelect/UsageViewSelect";
import { UserFilterSelect, type UserFilterSelectProps } from "./UserFilterSelect";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface UsageToolbarProps {
  view: UsageViewSelectProps;
  userFilter: UserFilterSelectProps | null;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
}

export const UsageToolbar: React.FC<UsageToolbarProps> = ({ view, userFilter, dateRange, onDateRangeChange }) => (
  <div role="toolbar" aria-label="Usage filters" className="flex flex-wrap items-center gap-3">
    <UsageViewSelect {...view} />
    {userFilter && <UserFilterSelect {...userFilter} />}
    <div className="ml-auto">
      <AdvancedDatePicker label="" value={dateRange} onValueChange={onDateRangeChange} />
    </div>
  </div>
);
