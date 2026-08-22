import { Button } from "@/components/ui/button";

interface SegmentedToggleProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ readonly value: T; readonly label: string }>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedToggle<T extends string>({ label, options, value, onChange }: SegmentedToggleProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-border bg-background p-0.5">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="xs"
          variant={option.value === value ? "secondary" : "ghost"}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
