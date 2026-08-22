import { Bot, Building2, ChartLine, Globe, ShoppingCart, Tags, User, Users, type LucideIcon } from "lucide-react";
import React from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UsageOption =
  | "global"
  | "my-usage"
  | "organization"
  | "team"
  | "customer"
  | "tag"
  | "agent"
  | "user"
  | "user-agent-activity";

export interface UsageViewSelectProps {
  value: UsageOption;
  onChange: (value: UsageOption) => void;
  isAdmin: boolean;
  canViewTagUsage?: boolean;
}

interface OptionConfig {
  value: UsageOption;
  label: string;
  nonAdminLabel?: string;
  description: string;
  nonAdminDescription?: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const OPTIONS: readonly OptionConfig[] = [
  {
    value: "global",
    label: "Global Usage",
    nonAdminLabel: "Your Usage",
    description: "View usage across all resources",
    nonAdminDescription: "View your usage",
    icon: Globe,
  },
  { value: "my-usage", label: "Your Usage", description: "View your own usage", icon: User, adminOnly: true },
  {
    value: "organization",
    label: "Organization Usage",
    nonAdminLabel: "Your Organization Usage",
    description: "View usage across all organizations",
    nonAdminDescription: "View your organization's usage",
    icon: Building2,
  },
  { value: "team", label: "Team Usage", description: "View usage by team", icon: Users },
  {
    value: "customer",
    label: "Customer Usage",
    description: "View usage by customer accounts",
    icon: ShoppingCart,
    adminOnly: true,
  },
  { value: "tag", label: "Tag Usage", description: "View usage grouped by tags", icon: Tags, adminOnly: true },
  { value: "agent", label: "Agent Usage (A2A)", description: "View usage by AI agents", icon: Bot, adminOnly: true },
  { value: "user", label: "User Usage", description: "View usage by individual users", icon: User, adminOnly: true },
  {
    value: "user-agent-activity",
    label: "User Agent Activity",
    description: "View detailed user agent activity logs",
    icon: ChartLine,
    adminOnly: true,
  },
];

interface ResolvedOption {
  value: UsageOption;
  label: string;
  description: string;
  icon: LucideIcon;
}

const isVisible = (option: OptionConfig, isAdmin: boolean, canViewTagUsage: boolean): boolean => {
  if (isAdmin || !option.adminOnly) return true;
  return option.value === "tag" && canViewTagUsage;
};

const resolveOptions = (isAdmin: boolean, canViewTagUsage: boolean): readonly ResolvedOption[] =>
  OPTIONS.filter((option) => isVisible(option, isAdmin, canViewTagUsage)).map((option) => ({
    value: option.value,
    label: isAdmin ? option.label : option.nonAdminLabel ?? option.label,
    description: isAdmin ? option.description : option.nonAdminDescription ?? option.description,
    icon: option.icon,
  }));

export const UsageViewSelect: React.FC<UsageViewSelectProps> = ({
  value,
  onChange,
  isAdmin,
  canViewTagUsage = false,
}) => {
  const options = resolveOptions(isAdmin, canViewTagUsage);
  const selected = options.find((option) => option.value === value);

  return (
    <Select
      value={value}
      onValueChange={(next: UsageOption | null) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger aria-label="Usage view" className="w-60 bg-background">
        <SelectValue>
          {selected && (
            <>
              <selected.icon className="text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{selected.label}</span>
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <option.icon className="mt-0.5 text-muted-foreground" aria-hidden="true" />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
